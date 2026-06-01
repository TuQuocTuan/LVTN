// controller quản lý công thức
//=================================

import { supabase } from '../config/supabase.js';

export const getRecipeByDish = async (req, res) => {
    try {
        const { dish_id } = req.params;
        const { data, error } = await supabase
            .from('recipes')
            .select(`
                id,
                amount_required,
                ingredients(
                name,
                unit
               )
            `)
            .eq('dish_id', dish_id);

        if (error) throw error;

        if (!data || data.length == 0) {
            return res.status(404).json({ success: false, message: 'Món ăn này chưa được cấu hình công thức!' });
        }
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Không lấy được công thức' })
    }
}
