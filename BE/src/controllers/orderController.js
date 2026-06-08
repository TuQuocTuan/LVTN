//Xử lý Xem món, Cập nhật món/Recipe
//======================================


import { supabase } from '../config/supabase.js';
import moment from 'moment-timezone';

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

//Hàm tính subtotal khi khách thêm món
export const calculateSubtotal = (orders) => {
    let sub_total = 0;
    const billDetails = {};
    orders.forEach(order => {
        if (order.order_details && Array.isArray(order.order_details)) {
            order.order_details.forEach(detail => {
                const dishName = detail.dishes?.name;
                if (!dishName) return;

                const giahientai = detail.price;
                const soluongsanpham = detail.quantity;
                const tonggiahientai = soluongsanpham * giahientai;
                if (billDetails[dishName]) {
                    billDetails[dishName].quantity += soluongsanpham;
                    billDetails[dishName].sub_total += tonggiahientai;
                } else {
                    billDetails[dishName] = {
                        price: giahientai,
                        quantity: soluongsanpham,
                        sub_total: tonggiahientai
                    }
                }
                sub_total += tonggiahientai;
            });
        }
    });
    return { sub_total, billDetails };
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


//Hàm xử lý thanh toán cuối cùng: cập nhật thông tin khách hàng, đổi trạng thái voucher, đóng phiên ăn
const handleFinalPayment = async (session_id, close_user, payment_method, customer_name, phone_number, client_voucher_id, appliedPromotionId, financialData) => {
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

    if (client_voucher_id && appliedPromotionId) {
        await supabase
            .from('customer_vouchers')
            .update({ is_used: true, used_at: new Date().toISOString() })
            .eq('id', client_voucher_id);
    }

    const { data: session, error } = await supabase
        .from('dining_sessions')
        .update({
            status: 'closed',
            closed_by_user_id: close_user,
            closed_at: new Date().toISOString(),
            payment_method: payment_method
        })
        .eq('id', session_id)
        .select('*, users (fullname)')
        .single();

    if (error) throw error;

    const { sub_total, discount_amount, vat_rate, vat_amount, tongtien } = financialData;

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
            created_by: session.users?.fullname
        }]);

    if (billErr) throw billErr;

    return session.users?.fullname;
};

//Hàm tính tiền và đóng bàn
export const getCheckoutBillandCloseSession = async (req, res) => {
    try {
        const {
            session_id,
            close_user,
            is_preview,
            payment_method,
            customer_name,
            phone_number,
            email,
            voucher_code
        } = req.body;

        const { data: orders, error: orderErr } = await supabase
            .from('orders')
            .select(`
                id, 
                sub_total,
                total_amount, 
                created_at,
                order_details(
                    quantity, 
                    price,
                    dishes(name)
                )
            `)
            .eq('session_id', session_id);

        if (orderErr) throw orderErr;
        if (!orders || orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn cho phiên ăn này!' });
        }

        const { sub_total, billDetails } = calculateSubtotal(orders);

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
            closed_by: closedByName,
            payment_method: is_preview ? null : payment_method,
            items: billDetails,
            sub_total,
            detailed_orders,
            discount_amount,
            vat_amount,
            tongtien,
            voucher_name: appliedVoucherName || "Không áp dụng",
            is_closed: !is_preview
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
            .select(`status,id,order_details(quantity, dishes(name),note),dining_sessions (tables(name))`)
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
            .select(`status,id,session_id,order_details(quantity, dishes(name),note),dining_sessions (tables(name))`)
            .eq('id', order_id)
        if (orderErr) throw orderErr;
        return res.json({ success: true, order });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
