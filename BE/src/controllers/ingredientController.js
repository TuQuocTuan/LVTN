// controller quản lý các món ăn
//==================================================

import { supabase } from '../config/supabase.js';

//Hàm lấy các nguyên liệu
export const getIngredients = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ingredients')
            .select('id,name,quantity,unit,min_stock,updated_at,category_ingredients(name)')
        if (error) throw error;
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi không lấy được nguyên liệu' })
    }
}

<<<<<<< HEAD

=======
>>>>>>> a3ac3ac (a)
export const addIngredients = async (req, res) => {
    try {
        const { name, quantity, unit, min_stock, category_id } = req.body;
        if (!name || !quantity || !unit || !min_stock) {
            return res.status(400).json({ success: false, message: 'Thieu thong tin nguyen lieu!' })
        }


        const { data: existingIngredient, error: existingError } = await supabase
            .from('ingredients')
            .select('id')
            .ilike('name', name.trim())
            .maybeSingle();

        if (existingIngredient) {
            return res.status(400).json({ success: false, message: 'Nguyên liệu đã tồn tại!' })
        }

        const { data: newIngredient, error: insertError } = await supabase
            .from('ingredients')
            .insert({
                name,
                quantity: Number(quantity),
                unit,
                min_stock: Number(min_stock),
                category_id: Number(category_id)
            })
            .select()
            .single();

        if (insertError) throw insertError;
        return res.status(201).json({ success: true, message: 'Thêm nguyên liệu thành công', newIngredient })
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message })
    }
}

export const updateIngredient = async (req, res) => {
    try {
        const { id, name, quantity, unit, min_stock, category_id } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập ID để cập nhật!' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (quantity !== undefined) updateData.quantity = Number(quantity);
        if (unit !== undefined) updateData.unit = unit.trim();
        if (min_stock !== undefined) updateData.min_stock = Number(min_stock);
        if (category_id !== undefined) updateData.category_id = Number(category_id);

        const IngredientID = Number(id);
        if (updateData.name) {
            const { data: existingName, error: nameErr } = await supabase
                .from('ingredients')
                .select('id')
                .ilike('name', updateData.name)
                .neq('id', IngredientID)
                .maybeSingle();

            if (nameErr) throw nameErr;
            if (existingName) {
                return res.status(400).json({ success: false, message: 'Tên nguyên liệu đã tồn tại!' });
            }
        }
        const { data: updatedResult, error: updateErr } = await supabase
            .from('ingredients')
            .update(updateData)
            .eq('id', IngredientID)
            .select()
            .single();

        if (updateErr) throw updateErr;

        return res.status(200).json({
            success: true,
            message: 'Cập nhật nguyên liệu thành công',
            updateIngredient: updatedResult
        });

    } catch (error) {
        console.error("Lỗi cập nhật nguyên liệu:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// Hàm xoá nguyên liệu
export const deleteIngredients = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập ID để xoá!' });
        }
        const { error } = await supabase
            .from('ingredients')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Xoá nguyên liệu thành công' })
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message })
    }
}

