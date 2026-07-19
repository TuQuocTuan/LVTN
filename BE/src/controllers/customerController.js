import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';
import htmlPdf from 'html-pdf-node';

export const createCustomer = async (req, res) => {
    try {
        const { name, phone_number, email } = req.body;
        if (!name || !phone_number || !email) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin'
            })
        }

        const { data: existCus, error: existErr } = await supabase
            .from('customers')
            .select('*')
            .or(`phone_number.eq.${phone_number},email.eq.${email}`)
            .maybeSingle();

        if (existErr) throw existErr;
        if (existCus) {
            return res.status(400).json({ success: false, message: 'Khách hàng đã tồn tại' })
        }

        const { data: newCus, error: insertErr } = await supabase
            .from('customers')
            .insert([{ name, phone_number, email }])
            .select();
        if (insertErr) throw insertErr;
        res.status(201).json({
            success: true,
            message: 'Tạo thành công',
            customer: newCus
        })
    } catch (error) {
        console.error('Lỗi tạo khách hàng:', error);
        return res.status(500).json({ success: false, message: 'Lỗi không tạo được khách hàng' });
    }
}

export const editCustomer = async (req, res) => {
    try {
        const { id, name, phone_number, email } = req.body;
        if (!id || !name || !phone_number || !email) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin'
            })
        }

        const { data: existCus, error: existErr } = await supabase
            .from('customers')
            .select('name,phone_number,email')
            .eq('id', id)
            .maybeSingle();

        if (existErr) throw existErr;
        if (!existCus) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' })
        }

        const { data: dupCus, error: dupErr } = await supabase
            .from('customers')
            .select('name,phone_number,email')
            .neq('id', id)
            .or(`phone_number.eq.${phone_number},email.eq.${email}`)
            .maybeSingle();
        if (dupErr) throw dupErr;
        if (dupCus) {
            return res.status(400).json({ success: false, message: 'Khách hàng đã tồn tại' })
        }

        const { data: updatedCus, error: updateErr } = await supabase
            .from('customers')
            .update({ name, phone_number, email })
            .eq('id', id)
            .select();
        if (updateErr) throw updateErr;
        res.status(200).json({
            success: true,
            message: 'Cập nhật thành công',
            customer: updatedCus
        })
    } catch (error) {
        console.error('Lỗi cập nhật khách hàng:', error);
        return res.status(500).json({ success: false, message: 'Lỗi không cập nhật được khách hàng' });
    }
}