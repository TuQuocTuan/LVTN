//quản lý trạng thái của bàn
//==============================

import { supabase } from '../config/supabase.js';

//Mở bàn (cashier)
export const openTable = async (req, res) => {
    try {
        const { table_id } = req.body;
        if (!table_id) {
            return res.status(400).json({
                success: false,
                message: "Không tìm thấy bàn"
            })
        }

        const { data: existingSession, error: checkErr } = await supabase
            .from('dining_sessions')
            .select('id')
            .eq('table_id', table_id)
            .eq('status', 'open')
            .maybeSingle();

        if (checkErr) throw checkErr;

        if (existingSession) {
            return res.json({
                success: true,
                message: 'Bàn đang hoạt động, tham gia vào phiên cũ!!!',
                session_id: existingSession.id
            });
        }

        const { data: newSession, error: sessionErr } = await supabase
            .from('dining_sessions')
            .insert([{ table_id, status: 'open' }])
            .select()
            .single()
        if (sessionErr) throw sessionErr;

        res.status(201).json({ success: true, message: 'Mở bàn thành công', session_id: newSession.id })
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

//Mở menu(customer)
export const openMenuCustomer = async (req, res) => {
    try {
        const { table_id, phone_number, name } = req.query;

        if (!table_id) {
            return res.status(400).json({ success: false, message: 'Thiếu mã bàn!' });
        }
        const { data: session, error } = await supabase
            .from('dining_sessions')
            .select('id')
            .eq('table_id', table_id)
            .eq('status', 'active')
            .maybeSingle();

        if (error) throw error;

        if (!session) {
            return res.status(400).json({
                success: false,
                table_id: table_id,
                message: 'Bàn chưa được mở!!!!!'
            });
        }

        let customerId = null;

        if (phone_number) {
            const { data: existingCustomer, error: findErr } = await supabase
                .from('customers')
                .select('id')
                .eq('phone_number', phone_number)
                .maybeSingle();

            if (findErr) throw findErr;

            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                const { data: newCustomer, error: createErr } = await supabase
                    .from('customers')
                    .insert([{ phone_number, name: name || 'Khách vãng lai' }])
                    .select()
                    .single();

                if (createErr) throw createErr;
                customerId = newCustomer.id;
            }
        } else {
            const { data: guestCustomer, error: guestErr } = await supabase
                .from('customers')
                .insert([{ name: name || 'Khách vãng lai không SĐT' }])
                .select()
                .single();

            if (guestErr) throw guestErr;
            customerId = guestCustomer.id;
        }

        return res.json({
            success: true,
            message: 'Vao ban xem thuc don thanh cong!',
            session_id: session.id,
            table_id,
            creator_id: customerId
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};