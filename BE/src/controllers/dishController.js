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


//Hàm thêm món ăn
export const addDish = async (req, res) => {
    try {
        const { category_id, name, description, price, image_url, instructions } = req.body;
        const { data, error } = await supabase
            .from('dishes')
            .insert([
                {
                    category_id: Number(category_id),
                    name: name,
                    description: description,
                    status: 'available',
                    price: Number(price),
                    image_url: image_url,
                    instructions: instructions || []
                }
            ])
            .select()
            .single();
        if (error) throw error;
        res.status(201).json({ success: true, data, message: 'Thêm món ăn thành công' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
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
