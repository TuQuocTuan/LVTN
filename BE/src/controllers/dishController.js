// controller quản lý các món ăn
//==================================================


import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
export const uploadMiddleware = upload.single('image');

//Hàm lấy món ăn
export const getDishes = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('dishes')
            .select('id, name, price, description, image_url, status, categories(name)');
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
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Server chưa nhận được bất kỳ dữ liệu chữ (Body) nào từ Form!'
            });
        }

        const file = req.file;
        const { category_id, name, description, price, instructions } = req.body;

        if (!name || !price || !category_id) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ tên, giá và danh mục món ăn!'
            });
        }

        if (!file) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp hình ảnh món ăn' });
        }

        const formattedName = name.trim();
        const { data: existingDish, error: checkErr } = await supabase
            .from('dishes')
            .select('id, name')
            .ilike('name', formattedName)
            .maybeSingle();

        if (checkErr) throw checkErr;
        if (existingDish) {
            return res.status(400).json({ success: false, message: 'Món ăn đã tồn tại' });
        }

        const fileExtension = file.originalname.split('.').pop();
        const fileName = `dish-${Date.now()}.${fileExtension}`;

        const { data: uploadData, error: uploadErr } = await supabase
            .storage
            .from('dish_img')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = supabase
            .storage
            .from('dish_img')
            .getPublicUrl(fileName);

        const imageUrl = publicUrlData.publicUrl;

        const { data: newDish, error: insertErr } = await supabase
            .from('dishes')
            .insert({
                category_id,
                name: formattedName,
                description,
                price: Number(price),
                instructions: [instructions],
                image_url: imageUrl,
                status: 'available',
            })
            .select()
            .single();

        if (insertErr) throw insertErr;

        return res.status(200).json({ success: true, data: newDish });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

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

export const updateDish = async (req, res) => {
    try {
        const { id, category_id, name, description, price, instructions, status } = req.body;
        const file = req.file;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID món ăn cần cập nhật!' });
        }
        if (!category_id || !name || !price) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên, giá và danh mục món ăn!' });
        }
        const formattedName = name.trim();
        const { data: existingDish, error: checkErr } = await supabase
            .from('dishes')
            .select('id, name')
            .ilike('name', formattedName)
            .neq('id', id)
            .maybeSingle();
        if (existingDish) {
            return res.status(400).json({ success: false, message: 'Món ăn đã tồn tại' });
        }

        const updateData = {
            category_id,
            name: formattedName,
            description,
            price: Number(price),
            instructions: [instructions],
            status,
        };

        if (file) {
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `dish-${Date.now()}.${fileExtension}`;

            const { data: uploadData, error: uploadErr } = await supabase
                .storage
                .from('dish_img')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });
            if (uploadErr) throw uploadErr;

            const { data: publicUrlData } = supabase
                .storage
                .from('dish_img')
                .getPublicUrl(fileName);
            updateData.image_url = publicUrlData.publicUrl;
        }
        const { data: updatedDish, error: updateErr } = await supabase
            .from('dishes')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateErr) throw updateErr;
        return res.status(200).json({ success: true, data: updatedDish });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const deleteDish = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID món ăn cần xóa!' });
        }
        const { data: dish, error: disherror } = await supabase
            .from('dishes')
            .select('image_url')
            .eq('id', id)
            .maybeSingle();
        if (disherror) throw disherror;

        if (!dish) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn' });
        }
        const { data: deletedDish, error: deleteError } = await supabase
            .from('dishes')
            .delete()
            .eq('id', id)
        if (deleteError) throw deleteError;

        if (dish.image_url) {
            const fileName = dish.image_url.split('/').pop();
            const { error: deleteStorageErr } = await supabase
                .storage
                .from('dish_img')
                .remove([fileName]);
            if (deleteStorageErr) {
                console.error(`Lỗi xóa ảnh ${fileName} trên Storage:`, deleteStorageErr.message);
            }
        }
        return res.status(200).json({ success: true, message: 'Xóa món ăn và ảnh thành công' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}