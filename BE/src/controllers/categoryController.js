//Quản lý danh mục món 
//================================

import { supabase } from '../config/supabase.js';

export const getCategories = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('id,name')
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getIngredientsCategories = async (req, res) => {
    try {
        const { data: categories, error: fetchErr } = await supabase
            .from('category_ingredients')
            .select('id,name')
        if (fetchErr) throw fetchErr;

        res.status(200).json({
            success: true,
            categories,
            message: "Lấy danh mục thành công!"
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}



