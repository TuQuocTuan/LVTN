// controller quản lý các món ăn
//==================================================

import { error } from 'console';
import { supabase } from '../config/supabase.js';

//Hàm lấy các nguyên liệu
export const getIngredients = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ingredients')
            .select('id,name,quantity,unit,min_stock,updated_at,category_ingredients(name),price')
        if (error) throw error;
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi không lấy được nguyên liệu' })
    }
}

export const addIngredients = async (req, res) => {
    try {
        const { name, quantity, unit, min_stock, price, category_id } = req.body;
        if (!name || quantity === undefined || !unit || min_stock === undefined) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin nguyên liệu!' });
        }

        if (!isNaN(unit.trim())) {
            return res.status(400).json({ success: false, message: 'Đơn vị tính không thể là chữ số thuần túy (ví dụ hợp lệ: g, kg, ml, cái, lon, chai...)!' });
        }

        const { data: existingIngredient, error: existingError } = await supabase
            .from('ingredients')
            .select('id')
            .ilike('name', name.trim())
            .maybeSingle();

        if (existingIngredient) {
            return res.status(400).json({ success: false, message: 'Nguyên liệu đã tồn tại!' });
        }

        const priceValue = (price !== undefined && price !== null && price !== '') ? Number(price) : 0;

        const { data: newIngredient, error: insertError } = await supabase
            .from('ingredients')
            .insert({
                name: name.trim(),
                quantity: Number(quantity),
                unit: unit.trim(),
                min_stock: Number(min_stock),
                category_id: category_id ? Number(category_id) : null,
                price: priceValue
            })
            .select()
            .single();

        if (insertError) throw insertError;
        return res.status(201).json({ success: true, message: 'Thêm nguyên liệu thành công', newIngredient });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

export const updateIngredient = async (req, res) => {
    try {
        const { id, name, quantity, unit, min_stock, price, category_id } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập ID để cập nhật!' });
        }

        if (unit !== undefined && (!unit.trim() || !isNaN(unit.trim()))) {
            return res.status(400).json({ success: false, message: 'Đơn vị tính không thể là chữ số thuần túy (ví dụ hợp lệ: g, kg, ml, cái, lon, chai...)!' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (quantity !== undefined) updateData.quantity = Number(quantity);
        if (unit !== undefined) updateData.unit = unit.trim();
        if (min_stock !== undefined) updateData.min_stock = Number(min_stock);
        if (category_id !== undefined) updateData.category_id = Number(category_id);
        if (price !== undefined) updateData.price = Number(price);

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

//Huỷ nguyên liệu kết thúc ngày
export const huyNguyenLieu = async (req, res) => {
    try {
        const { data: cate, error: cateErr } = await supabase
            .from('category_ingredients')
            .select('id,name')
            .in('name', ['Thịt', 'Rau củ', 'Sốt']);
        if (cateErr) throw cateErr;
        let cIDS = cate.map(i => i.id);

        const { data: ingredients, error: fetchErr } = await supabase
            .from('ingredients')
            .select('id,name,quantity,unit,price,category_id')
            .in('category_id', cIDS);
        if (fetchErr) throw fetchErr;
        let tongtienvon = ingredients.reduce((laphientai, ingredient) => {
            if (ingredient.unit === "g" || ingredient.unit === "ml") {
                return laphientai + (Number(ingredient.price) * Number(ingredient.quantity) / 1000);
            } else {
                return laphientai + (Number(ingredient.price) * Number(ingredient.quantity));
            }
        }, 0);

        const { data: updateIngre, error: updateErr } = await supabase
            .from("ingredients")
            .update({ quantity: 0 })
            .in('category_id', cIDS)
            .select();
        if (updateErr) throw updateErr;

        if (tongtienvon > 0) {
            const { error: insertErr } = await supabase
                .from('ingredient_wastes')
                .insert({ total_cost: Math.round(tongtienvon) });
            if (insertErr) throw insertErr;
        }

        return res.status(200).json({ success: true, tongtienvon })
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message })
    }
}

export const huytuychon = async (req, res) => {
    try {
        const { id, soluong } = req.body;
        const { data: ingredients, error: ingredientErr } = await supabase
            .from('ingredients')
            .select('id,name,quantity,unit,price,category_id')
            .eq('id', id);
        if (ingredientErr) throw ingredientErr;
        if (!ingredients || ingredients.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nguyên liệu' });
        }

        const ing = ingredients[0];
        const unitLower = (ing.unit || '').trim().toLowerCase();
        const floatUnits = ['g', 'ml', 'kg', 'l', 'lit', 'lít'];

        // Kiểm tra nguyên liệu rời (cái, lon, chai, hộp...) chỉ được nhập số nguyên
        if (!floatUnits.includes(unitLower) && !Number.isInteger(Number(soluong))) {
            return res.status(400).json({
                success: false,
                message: `Nguyên liệu có đơn vị "${ing.unit}" chỉ cho phép hủy số nguyên (1, 2, 3...)!`
            });
        }

        const { data: huyNL, error: huyNLErr } = await supabase
            .from('ingredients')
            .update({ quantity: ing.quantity - soluong })
            .eq('id', ing.id)
            .select();
        if (huyNLErr) throw huyNLErr;

        let tienvon = 0;
        if (ingredients[0].unit === "g" || ingredients[0].unit === "ml") {
            tienvon = (Number(ingredients[0].price) * Number(soluong) / 1000);
        } else {
            tienvon = (Number(ingredients[0].price) * Number(soluong));
        }

        const { error: insertErr } = await supabase
            .from('ingredient_wastes')
            .insert({ total_cost: Math.round(tienvon) });
        if (insertErr) throw insertErr;
        return res.status(200).json({ success: true, huyNL });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
