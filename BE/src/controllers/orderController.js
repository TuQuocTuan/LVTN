//Xử lý Xem món, Cập nhật món/Recipe
//======================================


import { supabase } from '../config/supabase.js';

//Hàm tạo Order
export const createOrder = async (req, res) => {
    try {
        const { session_id, total_amount, items } = req.body;
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .insert([{ session_id, sub_total: total_amount, total_amount: total_amount, status: 'pending', created_by: 'customer' }])
            .select()
            .single();
        if (orderErr) throw orderErr;

        const detailItems = items.map(item => ({
            order_id: order.id,
            dish_id: item.dish_id,
            quantity: item.quantity,
            price: item.price
        }));
        const { error: detailErr } = await supabase.from('order_details').insert(detailItems);
        if (detailErr) throw detailErr;
        res.json({ success: true, message: 'Đặt món thành công!', order_id: order.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//Hàm tính tiền và đóng bàn
export const getCheckoutBillandCloseSession = async (req, res) => {
    try {
        const { session_id, close_user, is_preview, payment_method, customer_name, phone_number, client_voucher_id } = req.body;

        const { data: orders, error: orderErr } = await supabase
            .from('orders')
            .select(`
                id, 
                total_amount, 
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

        let customerId = null;
        let appliedPromotionId = null;
        let appliedBillPromoId = null;
        let discount_amount = 0;

        if (phone_number) {
            let { data: customer } = await supabase
                .from('customers')
                .select()
                .eq('phone_number', phone_number)
                .maybeSingle();

            if (!customer) {
                const { data: newCustomer } = await supabase
                    .from('customers')
                    .insert([
                        { name: customer_name, phone_number: phone_number || 'Khách tại bàn' }
                    ])
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


        const now = new Date().toISOString();
        const { data: activePromotions } = await supabase
            .from('promotions')
            .select()
            .eq('is_active', true)
            .lte('start_date', now)
            .gte('end_date', now);

        if (client_voucher_id && customerId) {
            const { data: chosenVoucher } = await supabase
                .from('customer_vouchers')
                .select('id, is_used, promotions(*)')
                .eq('id', client_voucher_id)
                .eq('customer_id', customerId)
                .eq('is_used', false)
                .maybeSingle();

            if (chosenVoucher && chosenVoucher.promotions && chosenVoucher.promotions.is_active) {
                const promo = chosenVoucher.promotions;
                appliedPromotionId = promo.id;
                discount_amount += promo.discount_type === "PERCENTAGE" ? sub_total * Number(promo.discount_value) / 100 : Number(promo.discount_value);
            }
        }

        if (activePromotions && activePromotions.length > 0) {
            const billConditionPromo = activePromotions.find(promo => promo.type === 'BILL_CONDITION' && sub_total >= Number(promo.min_bill_value));
            //KM theo điều kiện được cấp
            if (billConditionPromo) {
                appliedBillPromoId = billConditionPromo.id;
                discount_amount += billConditionPromo.discount_type === "PERCENTAGE" ? sub_total * Number(billConditionPromo.discount_value) / 100 : Number(billConditionPromo.discount_value);
            }
        }

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

            if (client_voucher_id && appliedPromotionId) {
                await supabase
                    .from('customer_vouchers')
                    .update({ is_used: true, used_at: new Date().toISOString() })
                    .eq('id', client_voucher_id)
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
                .select(`
                    *,
                    users (
                        fullname
                    )
                `)
                .single();

            if (error) throw error;
            closedByName = session.users?.fullname || 'N/A';
        }

        return res.json({
            success: true,
            message: is_preview ? 'Lấy hóa đơn tạm tính thành công!' : 'Thanh toán và giải phóng bàn thành công!',
            session_id,
            closed_by: closedByName,
            payment_method: is_preview ? null : payment_method,
            items: billDetails,
            sub_total,
            discount_amount,
            vat_amount,
            tongtien,
            is_closed: !is_preview
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
