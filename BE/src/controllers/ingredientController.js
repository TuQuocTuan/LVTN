// controller quản lý các món ăn
//==================================================

import { supabase } from '../config/supabase.js';

//Hàm lấy các nguyên liệu
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

export const addIngredients = async (req, res) => {
    try {
        const { name, quantity, unit, min_stock } = req.body;
        if (!name || !quantity || !unit || !min_stock) {
            return res.status(400).json({ success: false, message: 'Thieu thong tin nguyen lieu!' })
        }
        const { data, error } = await supabase
            .from('ingredients')
            .insert({
                name,
                quantity,
                unit,
                min_stock
            })
            .select()
            .single();

        if (error) throw error;
        return res.status(201).json({ success: true, message: 'Thêm nguyên liệu thành công', data })
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message })
    }
}