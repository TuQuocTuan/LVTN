//Xử lý Xem món, Cập nhật món/Recipe
//======================================


import { supabase } from '../config/supabase.js';
import moment from 'moment-timezone';
import { createVnPayUrl } from '../controllers/paymentController.js';

//Hàm tạo Order
export const createOrder = async (req, res) => {
    try {
        const { session_id, items, customer_id } = req.body;

        if (!session_id) {
            return res.status(400).json({ success: false, message: 'Thiếu mã phiên ăn (session_id)!' });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách món ăn không hợp lệ!' });
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
const handleFinalPayment = async (req, session_id, close_user, payment_method, customer_name, phone_number, client_voucher_id, appliedPromotionId, financialData) => {
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

    if (client_voucher_id && appliedPromotionId) {
        await supabase
            .from('customer_vouchers')
            .update({ is_used: true, used_at: new Date().toISOString() })
            .eq('id', client_voucher_id);
    }

    const { data: sessionData, error: sessionErr } = await supabase
        .from('dining_sessions')
        .select('*, users (fullname)')
        .eq('id', session_id)
        .single();

    if (sessionErr) throw sessionErr;

    const { sub_total, discount_amount, vat_rate, vat_amount, tongtien } = financialData;

    if (payment_method.toUpperCase() === 'VNPAY') {
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
            .select('id, sub_total, order_details(dishes(name), quantity, price)')
            .eq('session_id', session_id)
            .eq('status', 'completed');

        if (fetchErr) throw fetchErr;

        orders.forEach(order => {
            order.order_details.forEach(detail => {
                const tenmon = detail.dishes?.name;
                const soluong = detail.quantity;
                const giatien = detail.price;
                if (gomBill[tenmon]) {
                    gomBill[tenmon].quantity += soluong;
                } else {
                    gomBill[tenmon] = { quantity: soluong, price: giatien };
                }
            })
        })

        totals = orders.reduce((tong, item) => tong + item.sub_total, 0);

        if (fetchErr) throw fetchErr;
        return { orders: orders, total: totals, billDetails: gomBill };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

//Hàm tính tiền và đóng bàn
export const getCheckoutBillandCloseSession = async (req, res) => {
    try {
        const { session_id, close_user, is_preview, payment_method, customer_name, phone_number, email, voucher_code } = req.body;

        const { orders, total: sub_total, billDetails } = await getTamtinhBill(session_id);

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
            closedByName = await handleFinalPayment(
                req,
                session_id,
                close_user,
                payment_method,
                customer_name,
                phone_number ? phone_number.trim() : null,
                null,
                appliedPromotionId,
                { sub_total, discount_amount, vat_rate, vat_amount, tongtien }
            );
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
            is_closed: !is_preview && payment_method.toUpperCase() !== 'VNPAY'
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

//Hàm lấy các order đang chờ chế biến của phiên ăn
export const getPendingOrders = async (req, res) => {
    try {
        const { data: orders, error: orderErr } = await supabase
            .from('orders')
            .select(`status,id,order_details(dish_id, quantity, dishes(name),note),dining_sessions (tables(name))`)
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

        // 1. SỬA: Thêm cột dish_id vào select của order_details
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .update({ status: 'completed' })
            .select(`status, id, session_id, order_details(dish_id, quantity, dishes(name), note), dining_sessions(tables(name))`)
            .eq('id', order_id);

        if (orderErr) throw orderErr;
        if (!order || order.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
        }

        const currentOrder = order[0];

        // 2. Vòng lặp duyệt qua từng chi tiết món ăn
        for (const orderDetail of currentOrder.order_details) {
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
        return res.json({ success: true, order: currentOrder });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const cancelOrderStatus = async (req, res) => {
    try {
        const { order_id } = req.body;
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .select(`status,id,session_id,order_details(quantity, dishes(name),note),dining_sessions (tables(name))`)
            .eq('id', order_id)
        if (orderErr) throw orderErr;
        return res.json({ success: true, order });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}