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
            .single(); //lấy đúng dòng vừa chèn
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

//Hàm tính tiền
export const getCheckoutBill = async (req, res) => {
    try {
        const { session_id } = req.params;

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

        let final_total = 0;
        const billDetails = {};

        orders.forEach(order => {
            final_total += order.total_amount;
            order.order_details.forEach(detail => {
                const dishName = detail.dishes.name;
                if (billDetails[dishName]) {
                    billDetails[dishName].quantity += detail.quantity;
                    billDetails[dishName].sub_total += detail.quantity * detail.price;
                } else {
                    billDetails[dishName] = {
                        price: detail.price,
                        quantity: detail.quantity,
                        sub_total: detail.quantity * detail.price
                    };
                }
            });
        });

        res.json({
            success: true,
            session_id,
            items: billDetails,
            final_total
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

//Hàm thanh toán và cập nhật bàn
