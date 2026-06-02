//QUản lý bàn
//===============================

import { supabase } from '../config/supabase.js';


export const getDanhSachBan = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tables')
            .select('name,type')
        if (error) throw error;
        res.status(200).json({
            success: true,
            data,
            message: "Lấy danh sách bàn thành công"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Không lấy được danh sách bàn"
        })
    }
}