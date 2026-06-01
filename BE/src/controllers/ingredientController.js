// controller quản lý các món ăn
//==================================================

import { supabase } from '../config/supabase.js';

export const getIngredients = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ingredients')
            .select('id,name,quantity,unit,min_stock,updated_at')
        if (error) throw error;
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi không lấy được nguyên liệu' })
    }
}