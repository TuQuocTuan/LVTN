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
