//Quản lý các user 
//=================================

import { supabase } from '../config/supabase.js';
import bcrypt from 'bcrypt';
import moment from 'moment';

export const getAllUser = async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id,username,fullname,role,is_active');

        if (error) throw error;
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const updateRoleUser = async (req, res) => {
    try {
        const { id, role } = req.body;
        const { data: updateRole, error: updateErr } = await supabase
            .from('users')
            .update({ role: role })
            .eq('id', id)
        if (updateErr) throw updateErr;
        return res.status(200).json({ success: true, message: 'Cập nhật Role thành công' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const addUser = async (req, res) => {
    try {
        const { username, password, fullname, role, is_active, created_at, email, phone_number } = req.body;
        if (!username || !password || !fullname || !role || !email || !phone_number) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin User!' });
        }

        let formatPassword = await bcrypt.hash(password, 10);
        const { data: existUser, error: checkErr } = await supabase
            .from('users')
            .select('email,phone_number')
            .eq('email', email)
            .eq('phone_number', phone_number)
            .maybeSingle();
        if (checkErr) throw checkErr;
        if (existUser) {
            return res.status(400).json({ success: false, message: 'User đã tồn tại!' });
        }

        const { data: newUser, error: addErr } = await supabase
            .from('users')
            .insert({
                username: username,
                password_hash: formatPassword,
                fullname: fullname,
                role: role,
                is_active: Boolean(is_active),
                created_at: moment(created_at).tz("Asia/Ho_Chi_Minh").format('YYYY-MM-DD HH:mm:ss'),
                email: email,
                phone_number: phone_number,
            })
            .select();

        if (addErr) throw addErr;
        return res.status(200).json({ success: true, message: 'Thêm User thành công' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: deletedUser, error: deleteErr } = await supabase
            .from('users')
            .update({ is_active: false })
            .eq('id', id)
            .select();
        if (deleteErr) throw deleteErr;
        return res.status(200).json({ success: true, message: 'Xóa User thành công' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}