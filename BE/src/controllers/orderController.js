//Xử lý Xem món, Cập nhật món/Recipe
//======================================


import { supabase } from '../config/supabase.js';
import moment from 'moment-timezone';
import { createVnPayUrl } from '../controllers/paymentController.js';
import { kiemtraMinStock } from './dishController.js';
import { generateBillHtml } from './billController.js';
import QRCode from 'qrcode';
import htmlPdf from 'html-pdf-node';
import e from 'express';

export const kiemtraTonkho = async (items) => {
    try {
        const dishIDs = items.map(item => Number(item.dish_id))

        const { data: recipes, error: fetchErr } = await supabase
            .from('recipes')
            .select('dish_id,amount_required,ingredient_id')
            .in('dish_id', dishIDs);
        if (fetchErr) throw fetchErr;

        const ingredientIDs = recipes.map(r => r.ingredient_id);
        const { data: ingredients, error: fetchInErr } = await supabase
            .from('ingredients')
            .select('id, name, quantity, min_stock')
            .in('id', ingredientIDs)
        if (fetchInErr) throw fetchInErr;

        const ingredientMap = {};
        ingredients.forEach(i => {
            ingredientMap[i.id] = {
                name: i.name,
                quantity: Number(i.quantity || 0)
            };
        });

        const thongtinMonAn = {};

        for (const item of items) {
            const currentDishRecipes = recipes.filter(r => Number(r.dish_id) === Number(item.dish_id));
            let SoMonToiDa = Number(item.quantity);

            for (const recipe of currentDishRecipes) {
                const ingre = ingredientMap[recipe.ingredient_id];
                const soluongcancho1mon = Number(recipe.amount_required);

                const soluongIngreMax = Math.floor(ingre.quantity / soluongcancho1mon);
                if (soluongIngreMax < SoMonToiDa) {
                    SoMonToiDa = soluongIngreMax;
                }
                thongtinMonAn[item.dish_id] = {
                    requested: Number(item.quantity),
                    maxAvailable: SoMonToiDa,
                }
            }
        }

        const danhsachDatLo = [];
        for (const dishId in thongtinMonAn) {
            const info = thongtinMonAn[dishId];
            if (info.maxAvailable < info.requested) {
                danhsachDatLo.push({
                    dish_id: Number(dishId),
                    maxAvailable: info.maxAvailable
                })
            }
        }

        if (danhsachDatLo.length > 0) {
            return {
                success: false,
                danhsachDatLo: danhsachDatLo,
                message: "Một số món ăn không đủ số lượng trong kho!"
            };
        }
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}


//Hàm tạo Order
export const createOrder = async (req, res) => {
    try {
        const { session_id, items, table_id } = req.body;

        if (!session_id) {
            return res.status(400).json({ success: false, message: 'Thiếu mã phiên ăn (session_id)!' });
        }

        const { data: activeSession, error: sessionErr } = await supabase
            .from('dining_sessions')
            .select('id, status')
            .eq('table_id', Number(table_id))
            .eq('status', 'serving')
            .maybeSingle();

        if (sessionErr) {
            console.error("Lỗi kết nối Supabase:", sessionErr);
            return res.status(500).json({ success: false, error: "Lỗi hệ thống khi kiểm tra bàn!" });
        }

        if (!activeSession || activeSession.id !== session_id) {
            return res.status(403).json({
                success: false,
                is_expired_session: true,
                message: 'Lượt ăn cũ của bạn đã kết thúc. Vui lòng quét lại mã QR để vào phiên mới!'
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách món ăn không hợp lệ!' });
        }

        const checkKho = await kiemtraTonkho(items);
        if (checkKho.success === false) {
            const dishesToClose = checkKho.danhsachDatLo
                .filter(err => err.maxAvailable === 0)
                .map(err => err.dish_id);

            if (dishesToClose.length > 0) {
                await supabase
                    .from('dishes')
                    .update({ status: 'out_of_stock' })
                    .in('id', dishesToClose);

                await supabase.channel('restaurant-notifications').send({
                    type: 'broadcast',
                    event: 'dish_out_of_stock',
                    payload: { dishes: dishesToClose.map(id => ({ id })), status: 'out_of_stock' }
                });
            }
            return res.status(400).json({
                success: false,
                code: "INSUFFICIENT_STOCK",
                danhsachDatLo: checkKho.danhsachDatLo,
                message: "Kho không đủ số lượng đáp ứng đơn hàng."
            });
        }

        let calculatedSubTotal = 0;
        items.forEach(item => {
            calculatedSubTotal += Number(item.quantity) * Number(item.price);
        });

        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .insert([{
                session_id,
                sub_total: calculatedSubTotal,
                total_amount: calculatedSubTotal,
                status: 'pending',
            }])
            .select('id, session_id, sub_total, total_amount, status')
            .single();

        if (orderErr) throw orderErr;


        const detailItems = items.map(item => ({
            order_id: order.id,
            dish_id: item.dish_id,
            quantity: item.quantity,
            note: item.note,
            price: item.price
        }));

        const { error: detailErr } = await supabase.from('order_details').insert(detailItems);
        if (detailErr) throw detailErr;

        return res.json({ success: true, message: 'Đặt món thành công!', order_id: order.id });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

//Hàm lấy đơn hàng theo session
export const getOrderBySession = async (req, res) => {
    try {
        const { session_id } = req.params;
        const { data: session, error: sessionErr } = await supabase
            .from('orders')
            .select(`*,
                created_at,
                order_details(*,dishes(name),note)`)
            .eq('session_id', session_id);

        if (sessionErr) throw sessionErr;
        if (!session || session.length == 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiên ăn!' });
        }

        const formattedSession = session.map(order => ({
            ...order,
            created_at: moment(order.created_at).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss")
        }));

        return res.status(200).json({ success: true, data: formattedSession });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}



//Hàm tính giảm giá  
export const calculateDiscount = async (sub_total, voucher_code, customerId) => {
    let appliedPromotionId = null;
    let appliedVoucherName = "Không áp dụng";
    let discount_amount = 0;
    const now = new Date();

    if (voucher_code && customerId) {
        const { data: promo } = await supabase
            .from('promotions')
            .select('*')
            .eq('code', voucher_code.trim().toUpperCase())
            .eq('is_active', true)
            .maybeSingle();

        if (promo) {
            const { data: userVouchers } = await supabase
                .from('customer_vouchers')
                .select('*')
                .eq('customer_id', customerId)
                .eq('promotion_id', promo.id)
                .eq('is_used', false)
                .limit(1);

            const userVoucher = userVouchers && userVouchers.length > 0 ? userVouchers[0] : null;

            if (userVoucher) {
                const startDate = new Date(promo.start_date);
                const endDate = new Date(promo.end_date);

                if (now >= startDate && now <= endDate) {
                    const discountValue = Number(promo.discount_value);
                    const minBillValue = Number(promo.min_bill_value || 0);

                    if (sub_total >= minBillValue) {
                        appliedPromotionId = userVoucher.id;
                        appliedVoucherName = `Áp dụng Voucher: ${promo.code}`;

                        if (promo.discount_type === "PERCENTAGE") {
                            discount_amount += (sub_total * discountValue) / 100;
                        } else {
                            discount_amount += discountValue;
                        }
                    } else {
                        appliedVoucherName = `Voucher ${promo.code} ko đủ điều kiện đơn tối thiểu ${minBillValue.toLocaleString()}đ`;
                    }
                }
            }
        }
    }

    const isoNow = now.toISOString();
    const { data: activePromotions } = await supabase
        .from('promotions')
        .select()
        .eq('is_active', true)
        .lte('start_date', isoNow)
        .gte('end_date', isoNow);

    if (activePromotions && activePromotions.length > 0) {
        const billConditionPromo = activePromotions.find(
            promo => promo.type === 'BILL_CONDITION' && sub_total >= Number(promo.min_bill_value || 0)
        );

        if (billConditionPromo) {
            const promoValue = Number(billConditionPromo.discount_value);
            if (appliedPromotionId) {
                appliedVoucherName += ` + KM hệ thống: ${billConditionPromo.name}`;
            } else {
                appliedVoucherName = `Khuyến mãi hệ thống: ${billConditionPromo.name}`;
            }

            if (billConditionPromo.discount_type === "PERCENTAGE") {
                discount_amount += (sub_total * promoValue) / 100;
            } else {
                discount_amount += promoValue;
            }
        }
    }
    return { discount_amount, appliedPromotionId, appliedVoucherName };
};


const getOrderBySessionId = async (session_id) => {
    try {
        let arrayOrder = [];
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('session_id', session_id);
        if (error) throw error;
        if (data && data.length > 0) {
            arrayOrder.push(...data);
        }
        return arrayOrder;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

//Hàm xử lý thanh toán cuối cùng: cập nhật thông tin khách hàng, đổi trạng thái voucher, đóng phiên ăn
const handleFinalPayment = async (req, session_id, close_user, payment_method, customer_name, phone_number, client_voucher_id, appliedPromotionId, financialData, is_manual) => {
    let customerId = null;

    if (phone_number) {
        let { data: customer } = await supabase
            .from('customers')
            .select()
            .eq('phone_number', phone_number)
            .maybeSingle();

        if (!customer) {
            const { data: newCustomer } = await supabase
                .from('customers')
                .insert([{ name: customer_name, phone_number: phone_number || 'Khách tại bàn' }])
                .select()
                .single();
            customer = newCustomer;
        }
        customerId = customer?.id;

        await supabase
            .from('dining_sessions')
            .update({ customer_id: customerId })
            .eq('id', session_id);
    }


    const activeOrders = await getOrderBySessionId(session_id);

    const pendingOrder = activeOrders.filter(order => order.status === 'pending');

    if (pendingOrder.length > 0) {
        await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('session_id', session_id)
            .eq('status', 'pending');
    }

    const { data: sessionData, error: sessionErr } = await supabase
        .from('dining_sessions')
        .select('*, users (fullname)')
        .eq('id', session_id)
        .single();

    if (sessionErr) throw sessionErr;

    const { sub_total, discount_amount, vat_rate, vat_amount, tongtien } = financialData;

    if (payment_method.toUpperCase() === 'VNPAY' && !is_manual) {
        const vnpayUrl = createVnPayUrl(req, session_id, tongtien);

        return {
            payment_type: 'ONLINE',
            payment_url: vnpayUrl,
            closed_by: 'Chờ thanh toán VNPay'
        };
    }

    const { error: closeErr } = await supabase
        .from('dining_sessions')
        .update({
            status: 'closed',
            closed_by_user_id: close_user,
            closed_at: new Date().toISOString(),
            payment_method: payment_method
        })
        .eq('id', session_id);

    if (closeErr) throw closeErr;

    const { error: billErr } = await supabase
        .from('bills')
        .insert([{
            session_id,
            sub_total,
            discount_amount,
            vat_rate,
            vat_amount,
            total_amount: tongtien,
            payment_method,
            created_by: sessionData.users?.fullname
        }]);

    if (billErr) throw billErr;

    if (customerId && appliedPromotionId) {
        await supabase
            .from('customer_vouchers')
            .update({ is_used: true, used_at: new Date().toISOString() })
            .eq('customer_id', customerId);
    }

    return {
        payment_type: 'OFFLINE',
        closed_by: sessionData.users?.fullname
    };
};

//Gom bill và tính tạm tính
export const getTamtinhBill = async (session_id) => {
    try {
        let totals = 0;
        const gomBill = {};

        const { data: orders, error: fetchErr } = await supabase
            .from('orders')
            .select('id, sub_total, order_details(dishes(name), quantity, price, status)')
            .eq('session_id', session_id)
            .eq('status', 'completed');

        if (fetchErr) throw fetchErr;

        orders.forEach(order => {
            if (order.order_details) {
                order.order_details = order.order_details.filter(detail => detail.status !== 'cancelled');
                order.order_details.forEach(detail => {
                    const tenmon = detail.dishes?.name;
                    const soluong = detail.quantity;
                    const giatien = detail.price;
                    if (gomBill[tenmon]) {
                        gomBill[tenmon].quantity += soluong;
                    } else {
                        gomBill[tenmon] = { quantity: soluong, price: giatien };
                    }
                });
            }
        });

        totals = orders.reduce((tong, item) => tong + item.sub_total, 0);

        return { orders: orders, total: totals, billDetails: gomBill };
    } catch (error) {
        return { success: false, message: error.message };
    }
}


//Hàm tính tiền và đóng bàn
export const getCheckoutBillandCloseSession = async (req, res) => {
    try {
        const { session_id, close_user, is_preview, payment_method, customer_name, phone_number, email, voucher_code, is_manual } = req.body;

        console.log("=== CHECKOUT REQUEST ===", { session_id, payment_method, is_preview, is_manual });

        const { orders, total: sub_total, billDetails } = await getTamtinhBill(session_id);

        console.log("=== ORDERS FOUND ===", orders ? orders.length : 0);

        if (!orders || orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn cho phiên ăn này!' });
        }

        let customerId = null;
        let isNewCustomerOrMissingEmail = false;

        if (phone_number) {
            const formattedPhone = phone_number.trim();

            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('*')
                .eq('phone_number', formattedPhone)
                .maybeSingle();

            if (existingCustomer) {
                customerId = existingCustomer.id;
                if (!existingCustomer.email) {
                    isNewCustomerOrMissingEmail = true;
                }
            } else {
                isNewCustomerOrMissingEmail = true;
            }

            if (!is_preview && isNewCustomerOrMissingEmail && email) {
                const { data: savedCustomer } = await supabase
                    .from('customers')
                    .upsert(
                        {
                            phone_number: formattedPhone,
                            email: email.trim(),
                            name: customer_name || 'Khách hàng mới'
                        },
                        { onConflict: 'phone_number' }
                    )
                    .select()
                    .maybeSingle();

                if (savedCustomer) {
                    customerId = savedCustomer.id;
                    isNewCustomerOrMissingEmail = false;
                }
            }
        }

        const { discount_amount, appliedPromotionId, appliedVoucherName } = await calculateDiscount(sub_total, voucher_code, customerId);

        const final_sub_total = Math.max(0, sub_total - discount_amount);
        const vat_rate = 0.1;
        const vat_amount = final_sub_total * vat_rate;
        const tongtien = final_sub_total + vat_amount;

        let closedByName = 'N/A';

        if (is_preview === true) {
            closedByName = 'Khách xem tạm tính';
        } else {
            if (!payment_method) {
                return res.status(400).json({ success: false, message: 'Vui lòng chọn phương thức thanh toán!' });
            }

            console.log("👉 Chuẩn bị nhảy vào handleFinalPayment...");

            closedByName = await handleFinalPayment(
                req,
                session_id,
                close_user,
                payment_method,
                customer_name,
                phone_number ? phone_number.trim() : null,
                null,
                appliedPromotionId,
                { sub_total, discount_amount, vat_rate, vat_amount, tongtien },
                is_manual
            );

            console.log("=== HANDLE FINAL PAYMENT RESULT ===", closedByName);
        }

        let detailed_orders = orders.map(order => ({
            id: order.id,
            created_at: order.created_at,
            sub_total: order.sub_total,
            order_details: order.order_details.map(details => ({
                quantity: details.quantity,
                price: details.price,
                dishes: details.dishes?.name
            }))
        }));

        const thoigianthanhtoan = moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");


        let qrCodeHtmlSection = '';
        if (!is_preview) {
            try {
                const reviewUrl = `${process.env.FRONTEND_URL}/review?session_id=${session_id}`;
                const qrCodeImageBase64 = await QRCode.toDataURL(reviewUrl, {
                    width: 150,
                    margin: 1
                });

                // Chuẩn bị sẵn đoạn HTML chứa ảnh mã QR
                qrCodeHtmlSection = `
                    <div class="text-center" style="margin-top: 15px; margin-bottom: 5px;">
                        <p class="bold" style="font-size: 11px; margin: 0 0 5px 0;">QUÉT MÃ ĐÁNH GIÁ MÓN ĂN!</p>
                        <img src="${qrCodeImageBase64}" alt="Review QR Code" style="width: 120px; height: 120px; border: 1px solid #eee; padding: 2px;"/>
                    </div>
                `;
            } catch (qrErr) {
                console.error("Lỗi sinh QR Code trên Bill:", qrErr.message);
            }
        }

        const html_bill = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page {
                    size: 80mm auto;
                    margin: 0;
                }
                html, body {
                    margin: 0;
                    padding: 0;
                    width: 80mm;
                    height: auto;
                    background-color: #fff;
                }
                body {
                    font-family: 'Arial', sans-serif;
                    font-size: 12px;
                    padding: 8px;
                    box-sizing: border-box;
                }
                .text-center { text-align: center; }
                .bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; }
                .text-right { text-align: right; }
            </style>
        </head>
        <body>
            <div class="text-center">
                <h3 style="margin: 0; font-size: 16px;">MÌXI</h3>
                <p style="margin: 5px 0;">Hóa Đơn Thanh Toán</p>
                <p>Mã Phiên: #${session_id.substring(0, 8)}...</p>
            </div>
            <div class="divider"></div>
            <p>Ngày in: ${thoigianthanhtoan}</p>
            <div class="divider"></div>
            <table>
                <thead>
                    <tr class="bold">
                        <td>Tên món</td>
                        <td class="text-center">SL</td>
                        <td class="text-right">T.Tiền</td>
                    </tr>
                </thead>
               <tbody>
                    ${detailed_orders.flatMap(order =>
            order.order_details.map(detail => `
                            <tr>
                                <td>${detail.dishes || 'Món ăn'}</td>
                                <td class="text-center">${detail.quantity}</td>
                                <td class="text-right">${Number(detail.price * detail.quantity).toLocaleString('vi-VN')}đ</td>
                            </tr>
                        `)
        ).join('')}
                </tbody>
            </table>
            <div class="divider"></div>
            <table>
                <tr>
                    <td>Tạm tính:</td>
                    <td class="text-right">${Number(sub_total).toLocaleString('vi-VN')}đ</td>
                </tr>
                <tr>
                    <td>Giảm giá:</td>
                    <td class="text-right">-${Number(discount_amount).toLocaleString('vi-VN')}đ</td>
                </tr>
                <tr>
                    <td>Thuế VAT (10%):</td>
                    <td class="text-right">${Number(vat_amount).toLocaleString('vi-VN')}đ</td>
                </tr>
                <tr class="bold" style="font-size: 14px;">
                    <td>TỔNG CỘNG:</td>
                    <td class="text-right">${Number(tongtien).toLocaleString('vi-VN')}đ</td>
                </tr>
            </table>
            <div class="divider"></div>
            
            ${qrCodeHtmlSection}
            
            <div class="text-center bold" style="margin-top: 10px;">CẢM ƠN QUÝ KHÁCH & HẸN GẶP LẠI</div>
        </body>
        </html>
        `;

        return res.json({
            success: true,
            message: is_preview ? 'Lấy hóa đơn tạm tính thành công!' : 'Thanh toán và giải phóng bàn thành công!',
            is_missing_email: isNewCustomerOrMissingEmail,
            created_at: thoigianthanhtoan,
            session_id,
            closed_by: is_preview ? 'Khách xem tạm tính' : closedByName.closed_by,
            payment_url: is_preview ? null : (closedByName.payment_url || null),
            payment_method: is_preview ? null : payment_method,
            items: billDetails,
            sub_total,
            detailed_orders,
            discount_amount,
            vat_amount,
            tongtien,
            voucher_name: appliedVoucherName || "Không áp dụng",
            is_closed: !is_preview && payment_method.toUpperCase() !== 'VNPAY',
            html_bill: is_preview ? null : html_bill
        });

    } catch (error) {
        console.error("CRASH TRONG HÀM CHECKOUT:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

//Hàm lấy các order đang chờ chế biến của phiên ăn
export const getPendingOrders = async (req, res) => {
    try {
        const { data: orders, error: orderErr } = await supabase
            .from('orders')
            .select(`status,id,order_details(id, status, dish_id, quantity, dishes(name),note),dining_sessions (tables(name))`)
            .eq('status', 'pending')

        if (orderErr) throw orderErr;
        return res.json({ success: true, orders });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}



//Hàm cập nhật trạng thái đơn
export const updateOrderStatus = async (req, res) => {
    try {
        const { order_id } = req.body;

        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .update({ status: 'completed' })
            .select(`status, id, session_id, order_details(dish_id, quantity, status, dishes(name), note), dining_sessions(tables(name))`)
            .eq('id', order_id);

        if (orderErr) throw orderErr;
        if (!order || order.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
        }

        const currentOrder = order[0];

        for (const orderDetail of currentOrder.order_details) {
            if (orderDetail.status === 'cancelled') continue;
            const { data: recipeItems, error: recipeErr } = await supabase
                .from('recipes')
                .select('ingredient_id, amount_required')
                .eq('dish_id', orderDetail.dish_id);

            if (recipeErr) throw recipeErr;

            if (recipeItems && recipeItems.length > 0) {
                for (const recipe of recipeItems) {
                    const totalDeduct = Number(recipe.amount_required) * Number(orderDetail.quantity);

                    const { data: ingredientData, error: ingGetErr } = await supabase
                        .from('ingredients')
                        .select('id, name, quantity')
                        .eq('id', recipe.ingredient_id)
                        .single();

                    if (ingGetErr) throw ingGetErr;

                    if (ingredientData) {
                        const newQuantity = Number(ingredientData.quantity) - totalDeduct;

                        const { error: updateIngErr } = await supabase
                            .from('ingredients')
                            .update({ quantity: newQuantity })
                            .eq('id', recipe.ingredient_id);

                        if (updateIngErr) throw updateIngErr;
                    }
                }
            }
        }
        await kiemtraMinStock();
        return res.json({ success: true, order: currentOrder });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}



export const cancelOrderStatus = async (req, res) => {
    try {
        const { order_id, order_detail_id } = req.body;

        if (order_detail_id) {
            // Hủy một món cụ thể
            const { data: detailData, error: detailErr } = await supabase
                .from('order_details')
                .update({ status: 'cancelled' })
                .eq('id', order_detail_id)
                .eq('order_id', order_id)
                .select()
                .maybeSingle();

            if (detailErr) throw detailErr;
        } else {
            // Hủy toàn bộ món trong đơn
            const { error: detailsErr } = await supabase
                .from('order_details')
                .update({ status: 'cancelled' })
                .eq('order_id', order_id);

            if (detailsErr) throw detailsErr;
        }

        // Lấy tất cả các món để tính toán lại tổng tiền của đơn hàng
        const { data: orderDetails, error: detailsErr } = await supabase
            .from('order_details')
            .select(`id, quantity, price, status, note, dishes(name)`)
            .eq('order_id', order_id);

        if (detailsErr) throw detailsErr;

        // Tính lại tổng tiền của các món chưa bị hủy
        const activeDetails = orderDetails.filter(detail => detail.status !== 'cancelled');
        const newSubTotal = activeDetails.reduce((sum, detail) => sum + (Number(detail.price || 0) * Number(detail.quantity || 0)), 0);

        // Cập nhật lại orders (sub_total, total_amount)
        const { error: updateOrderErr } = await supabase
            .from('orders')
            .update({
                sub_total: newSubTotal,
                total_amount: newSubTotal
            })
            .eq('id', order_id);

        if (updateOrderErr) throw updateOrderErr;

        // Kiểm tra xem tất cả các món đã bị hủy chưa
        const allCancelled = orderDetails.every(detail => detail.status === 'cancelled');
        if (allCancelled) {
            await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', order_id);
        }

        // Lấy thông tin đơn hàng mới nhất để phản hồi
        const { data: orderData, error: orderErr } = await supabase
            .from('orders')
            .select(`status, id, session_id, dining_sessions (tables(name))`)
            .eq('id', order_id)
            .single();
        if (orderErr) throw orderErr;

        const finalOrder = {
            ...orderData,
            order_details: orderDetails
        };

        return res.json({ success: true, order: finalOrder });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}