//QUản lý bàn
//===============================

import { supabase } from '../config/supabase.js';


export const getDanhSachBan = async (req, res) => {
    try {
        const { data: tables, error } = await supabase
            .from('tables')
            .select(`
                id,
                name,
                type,
                dining_sessions(
                    id,
                    status
                )
            `)
            .neq('dining_sessions.status', 'closed');

        if (error) throw error;

        return res.status(200).json({
            success: true,
            tables,
            message: "Lấy danh sách bàn kèm trạng thái chi tiết thành công"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không lấy được danh sách bàn",
            error: error.message
        });
    }
};

export const getSessionByTable = async (req, res) => {
    try {
        const { table_id } = req.body;

        const { data: dining_sessions, error } = await supabase
            .from('dining_sessions')
            .select('id, status, closed_at')
            .eq('table_id', table_id)
            .eq('status', 'closed')
            .order('closed_at', { ascending: false })
            .limit(1);

        if (error) throw error;
        return res.status(200).json({
            success: true,
            dining_sessions,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Không lấy được thông tin phiên theo bàn",
            error: error.message
        });
    }
}