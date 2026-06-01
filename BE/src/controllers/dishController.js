// controller quản lý các món ăn
//==================================================


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';

//Hàm lấy món ăn
export const getDishes = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('dishes')
            .select('id, name, price, image_url, status, categories(name)');
        if (error) throw error;
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        console.error('Lỗi không lấy được món:', error);
        res.status(500).json({ success: false, message: 'Lỗi không lấy được món' })
    }
}


//Hàm tìm kiếm món ăn
export const searchDishesByName = async (req, res) => {
    const { name } = req.query;
    if (!name) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên món ăn' })
    }
    try {
        const { data, error } = await supabase
            .from('dishes')
            .select('id, name, price, image_url, status, categories(name)')
            .ilike('name', `%${name}%`)
        if (error) throw error;
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tìm kiếm' });
    }
}
