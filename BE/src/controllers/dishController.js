// controller quản lý các món ăn
//==================================================


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';

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