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
            .eq('status', 'serving')
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
            .insert([{ table_id, status: 'serving' }])
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
        const { table_key, old_session } = req.body;

        if (!table_key) {
            return res.status(400).json({ success: false, message: 'Thiếu mã bàn!' });
        }

        const { data: table, error: tableErr } = await supabase
            .from('tables')
            .select('id')
            .eq('table_key', table_key)
            .single();

        if (tableErr || !table) {
            return res.status(404).json({ success: false, message: 'Mã QR bàn không hợp lệ!' });
        }

        const { data: session, error: sessionErr } = await supabase
            .from('dining_sessions')
            .select('id')
            .eq('table_id', Number(table.id))
            .eq('status', 'serving')
            .maybeSingle();

        if (sessionErr) throw sessionErr;

        if (!session) {
            return res.status(400).json({
                success: false,
                table_id: table.id,
                message: 'Bàn chưa được mở!!!!!'
            });
        }

        if (old_session && old_session !== session.id) {
            return res.status(403).json({
                success: false,
                is_expired_session: true,
                message: 'Lượt ăn cũ của bạn đã kết thúc!'
            });
        }

        return res.json({
            success: true,
            message: 'Vao ban xem thuc don thanh cong!',
            session_id: session.id,
            table_id: table.id,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

//Hàm đóng bàn (không tính tiền)
export const closeTable = async (req, res) => {
    try {
        const { table_id } = req.body;
        if (!table_id) {
            res.json({
                success: false,
                message: "Thiếu mã bàn"
            })
        }
        const { data: session, error } = await supabase
            .from('dining_sessions')
            .update({
                status: 'closed',
                closed_at: new Date().toISOString()
            })
            .eq('table_id', table_id)
            .eq('status', 'serving')
            .select()
            .maybeSingle();
        if (error) throw error;
        if (!session) {
            return res.json({
                success: false,
                table_id: table_id,
                message: 'Bàn chưa được mở!!!!'
            })
        }
        return res.json({
            success: true,
            message: 'Đóng bàn thành công!',
            session_id: session.id,
            table_id,
            closed_at: session.closed_at
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}