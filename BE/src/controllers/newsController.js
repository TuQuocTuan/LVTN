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