// controller quản lý công thức
//=================================

import { supabase } from '../config/supabase.js';

//Hàm lấy công thức theo món
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

//Hàm lấy danh sách tất cả công thức
export const getRecipelist = async (req, res) => {
    try {
        const { data: recipe, error: recipeErr } = await supabase
            .from('recipes')
            .select('id,dishes(name),ingredients(name,quantity,unit)');
        if (recipeErr) throw recipeErr;
        res.status(200).json({ success: true, data: recipe });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi không lấy được danh sách món ăn' })
    }
}

//Tìm công thức
export const searchRecipe = async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên món ăn cần tìm!' });
        }
        const searchName = `%${name.trim()}%`;

        const { data: recipe, error: recipeErr } = await supabase
            .from('recipes')
            .select(`
                id,
                dishes!inner(name), 
                ingredients(name, unit),
                amount_required
            `)
            .ilike('dishes.name', searchName);
        if (recipeErr) throw recipeErr;
        if (!recipe || recipe.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy công thức' });
        }

        return res.status(200).json({ success: true, data: recipe });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Lỗi tìm kiếm: ${error.message}` });
    }
}


//Thêm công thức
export const addRecipes = async (req, res) => {
    try {
        const { dish_id, ingredients } = req.body;
        if (!dish_id || !ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ thông tin!' })
        }

        const ingredientIds = ingredients.map(i => i.ingredient_id);
        const { data: checkExist, error: checkExistError } = await supabase
            .from('recipes')
            .select('*')
            .eq('dish_id', dish_id)
            .in('ingredient_id', ingredientIds)

        if (checkExistError) throw checkExistError;
        if (checkExist && checkExist.length > 0) {
            return res.status(400).json({ success: false, message: 'Công thức đã tồn tại!' })
        }

        const addData = ingredients.map(ingredient => ({
            dish_id: Number(dish_id),
            ingredient_id: Number(ingredient.ingredient_id),
            amount_required: Number(ingredient.amount_required)
        }))

        const { data: newRecipes, error: newRecipesError } = await supabase
            .from('recipes')
            .insert(addData)
            .select();

        if (newRecipesError) throw newRecipesError;

        const khoitaoVersion = ingredients.map(ingredient => ({
            dish_id: Number(dish_id),
            ingredient_id: Number(ingredient.ingredient_id),
            amount_required: Number(ingredient.amount_required),
            version: 1
        }))

        const { error: versionError } = await supabase
            .from('recipe_histories')
            .insert(khoitaoVersion)

        if (versionError) throw versionError;

        return res.status(200).json({ success: true, message: 'Thêm công thức thành công', data: newRecipes })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}


//Sửa công thức
export const updateRecipes = async (req, res) => {
    try {
        const { dish_id, ingredients } = req.body;
        if (!dish_id || !ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ thông tin!' })
        }

        const { error: deleteOldErr } = await supabase
            .from('recipes')
            .delete()
            .eq('dish_id', dish_id);

        if (deleteOldErr) throw deleteOldErr;

        const updateData = ingredients.map(item => ({
            dish_id: Number(dish_id),
            ingredient_id: Number(item.ingredient_id),
            amount_required: Number(item.amount_required)
        }))


        const { data: updatedRecipes, error: updatedRecipesError } = await supabase
            .from('recipes')
            .insert(updateData)
            .select();
        if (updatedRecipesError) throw updatedRecipesError;

        const { data: oldRecipes, error: fetchOldErr } = await supabase
            .from('recipes')
            .select('ingredient_id, amount_required')
            .eq('dish_id', dish_id);
        if (fetchOldErr) throw fetchOldErr;

        if (oldRecipes && oldRecipes.length > 0) {
            const { data: history_recipe, error: history_Err } = await supabase
                .from('recipe_histories')
                .select('version')
                .eq('dish_id', dish_id)
                .order('version', { ascending: false })
                .limit(1);
            if (history_Err) throw history_Err;

            const nextVersion = (history_recipe && history_recipe.length > 0) ? (history_recipe[0].version + 1) : 1;

            const truyenData = updateData.map(item => ({
                dish_id: item.dish_id,
                ingredient_id: item.ingredient_id,
                amount_required: item.amount_required,
                version: nextVersion
            }));

            const { error: insertHistoryErr } = await supabase
                .from('recipe_histories')
                .insert(truyenData);

            if (insertHistoryErr) throw insertHistoryErr;
        }


        return res.status(200).json({ success: true, message: 'Cập nhật công thức thành công', data: updatedRecipes })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

//Xoá công thức
export const deleteRecipe = async (req, res) => {
    try {
        const { dish_id, ingredient_ids } = req.body;

        if (!dish_id) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập món ăn!' })
        }
        let xoaCT = supabase.from('recipes').delete().eq('dish_id', dish_id);

        if (ingredient_ids && Array.isArray(ingredient_ids) && ingredient_ids.length > 0) {
            xoaCT = xoaCT.in('ingredient_id', ingredient_ids.map(id => Number(id)));
        }

        const { error } = await xoaCT;
        if (error) {
            throw error;
        }
        return res.status(200).json({
            success: true, message: ingredient_ids && ingredient_ids.length > 0
                ? 'Xóa các nguyên liệu được chọn ra khỏi công thức thành công'
                : 'Xóa toàn bộ công thức của món ăn thành công'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const getAllVersionByDish = async (req, res) => {
    try {
        const { dish_id } = req.query;
        if (!dish_id) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập món ăn!' })
        }
        const { data: history_recipe, error: recipeErr } = await supabase
            .from('recipe_histories')
            .select('version')
            .eq('dish_id', dish_id)
            .order('version', { ascending: false });
        if (recipeErr) throw recipeErr;

        const versions = [...new Set(history_recipe.map(item => item.version))];
        return res.status(200).json({ success: true, data: versions });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }

}

export const getRecipeByVersion = async (req, res) => {
    try {
        const { dish_id, version } = req.query;

        if (!dish_id || !version) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập món ăn và phiên bản!' });
        }

        const { data: history_recipe, error: recipeErr } = await supabase
            .from('recipe_histories')
            .select('id, amount_required, dishes(name), ingredients(name, unit)')
            .eq('dish_id', Number(dish_id))
            .eq('version', Number(version));

        if (recipeErr) throw recipeErr;

        return res.status(200).json({ success: true, data: history_recipe });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}