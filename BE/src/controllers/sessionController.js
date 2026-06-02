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

        //Kiểm tra xem bàn đã mở chưa
        const { data: existingSession, error: checkErr } = await supabase
            .from('dining_sessions')
            .select('id')
            .eq('table_id', table_id)
            .eq('status', 'active')
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
            .insert([{ table_id, status: 'active' }])
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
        const { table_id } = req.query;
        const { data: session, error } = await supabase
            .from('dining_sessions')
            .select('id')
            .eq('table_id', table_id)
            .eq('status', 'active')
            .maybeSingle();
        if (error) throw error;

        if (!session) {
            return res.json({
                success: false,
                session_id: session.id,
                table_id: table_id,
                message: 'Bàn chưa được mở!!!!!'
            })
        }

        return res.json({
            success: true,
            session_id: session.id,
            table_id: table_id,
            message: 'Bàn đã được mở!!!!'
        })

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

