// controller quản lý tin tức
//==================================================

import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';
import moment from 'moment';

export const getNews = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('news')
            .select('*')
        return res.status(200).json({ success: true, data })
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const addNews = async (req, res) => {
    try {
        const { promotion_id, title, content, is_published } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp hình ảnh!' });
        }
        if (!promotion_id || !title || !content || !is_published) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin!' });
        }

        const formattitle = title.trim();

        const { data: existingnews, error: checkErr } = await supabase
            .from('news')
            .select('id, title')
            .ilike('title', formattitle)
            .maybeSingle();
        if (checkErr) throw checkErr;
        if (existingnews) {
            return res.status(400).json({ success: false, message: 'Tin tức đã tồn tại' });
        }

        const fileExtension = file.originalname.split('.').pop();
        const fileName = `news-${Date.now()}.${fileExtension}`;

        const { data: uploadData, error: uploadErr } = await supabase
            .storage
            .from('news_img')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });
        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = supabase
            .storage
            .from('news_img')
            .getPublicUrl(fileName);

        const imageUrl = publicUrlData.publicUrl;

        const isPublishedBool = is_published === 'true' || is_published === true;

        const { data: newNews, error: insertErr } = await supabase
            .from('news')
            .insert({
                promotion_id,
                title: formattitle.toUpperCase(),
                content,
                image_url: imageUrl,
                is_published: isPublishedBool,
                created_at: moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss')
            })
            .select()
            .single();

        if (insertErr) throw insertErr;

        return res.status(200).json({ success: true, data: newNews });
    } catch (error) {
        console.error("🔥 Lỗi addNews:", error);
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
}

export const updateNews = async (req, res) => {
    try {
        console.log("--- DỮ LIỆU FE GỬI LÊN ---");
        console.log("Body:", req.body);
        console.log("File ảnh:", req.file);
        console.log("---------------------------");
        const { id, promotion_id, title, content, is_published } = req.body;
        const file = req.file;

        const { data: existingNews, error: fetchErr } = await supabase
            .from('news')
            .select('*')
            .neq('id', id)
            .eq('title', title.trim())
            .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (existingNews) {
            return res.status(400).json({ success: false, message: 'Tin tức đã tồn tại' })
        }

        const { data: currentNews } = await supabase
            .from('news')
            .select('image_url')
            .eq('id', id)
            .maybeSingle();

        let imageUrl = undefined;

        if (file) {
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `news-${Date.now()}.${fileExtension}`;

            const { data: uploadData, error: uploadErr } = await supabase
                .storage
                .from('news_img')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });
            if (uploadErr) throw uploadErr;

            const { data: publicUrlData } = supabase
                .storage
                .from('news_img')
                .getPublicUrl(fileName);

            imageUrl = publicUrlData.publicUrl;

            if (currentNews && currentNews.image_url) {
                try {
                    const rawFileName = currentNews.image_url.split('/').pop();
                    const oldFileName = rawFileName.split('?')[0];
                    await supabase.storage.from('news_img').remove([oldFileName]);
                    console.log(`Đã xóa ảnh cũ thành công: ${oldFileName}`);
                } catch (deleteImgErr) {
                    console.error("Lỗi xóa ảnh cũ trong storage (không chặn luồng chính):", deleteImgErr);
                }
            }
        }

        const updateData = {
            promotion_id: promotion_id || null,
            title: title.trim().toUpperCase(),
            content,
            is_published: is_published === 'true' || is_published === true,
        };

        if (imageUrl) {
            updateData.image_url = imageUrl;
        }

        const { data: updatedNews, error: Err } = await supabase
            .from('news')
            .update(updateData)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (Err) throw Err;

        return res.status(200).json({ success: true, data: updateNews, message: 'Cập nhật thành công' });

    } catch (error) {
        console.error("Lỗi updateNews:", error);
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
}

export const delNews = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: news, error: newsError } = await supabase
            .from('news')
            .select('image_url')
            .eq('id', id)
            .maybeSingle();
        if (newsError) throw newsError;

        const { data: delNews, error: delErr } = await supabase
            .from('news')
            .delete()
            .eq('id', id)
            .select()
            .single();
        if (delErr) throw delErr;

        if (news.image_url) {
            const fileName = news.image_url.split('/').pop();
            const { error: deleteStorageErr } = await supabase
                .storage
                .from('news_img')
                .remove([fileName]);
            if (deleteStorageErr) {
                console.error(`Lỗi xóa ảnh ${fileName} trên Storage:`, deleteStorageErr.message);
            }
        }

        return res.status(200).json({ success: true, data: delNews, message: 'Xóa thành công' });
    } catch (error) {
        console.error("Lỗi delNews:", error);
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
}