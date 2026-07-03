//Quản lý các user 
//=================================

import { supabase } from '../config/supabase.js';
import bcrypt from 'bcrypt';
import moment from 'moment';
import nodemailer from 'nodemailer';

export const getAllUser = async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id,username,fullname,role,is_active,permissions,email,phone_number');

        if (error) throw error;
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const updateRoleUser = async (req, res) => {
    try {
        const { id, role, is_active, permissions, fullname, email, phone_number } = req.body;
        const activeStatus = is_active === 'true' || is_active === true;
        const { data: updateRole, error: updateErr } = await supabase
            .from('users')
            .update({
                role: role, is_active: activeStatus, permissions: permissions, fullname: fullname, email: email, phone_number: phone_number
            })
            .eq('id', id)
        if (updateErr) throw updateErr;
        return res.status(200).json({ success: true, message: 'Cập nhật Role thành công' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const addUser = async (req, res) => {
    try {
        const { username, password, fullname, role, is_active, created_at, email, phone_number, permissions } = req.body;
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
                permissions: permissions,
            })
            .select();

        if (addErr) throw addErr;

        try {
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: `"Làng Mixi Management" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '[Làng Mixi] Thông báo cấp tài khoản nhân viên mới',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px;">
                        <h2 style="color: #ff6b00; text-align: center;">CHÀO MỪNG THÀNH VIÊN MỚI</h2>
                        <p>Xin chào <b>${fullname}</b>,</p>
                        <p>Tài khoản quản trị hệ thống nội bộ của bạn tại <b>Làng Mixi</b> đã được khởi tạo thành công với vai trò: <span style="text-transform: uppercase; font-weight: bold; color: #ff6b00;">${role}</span>.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff6b00; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 5px 0;"><b>Tên đăng nhập:</b> <code style="font-size: 14px; color: #333;">${username}</code></p>
                            <p style="margin: 5px 0;"><b>Mật khẩu kích hoạt:</b> <code style="font-size: 14px; color: #333;">${password}</code></p>
                        </div>

                        <p style="color: #dd2c00; font-size: 13px;"><i>* Lưu ý: Để đảm bảo an toàn bảo mật, vui lòng tiến hành đăng nhập và đổi lại mật khẩu cá nhân ngay trong phiên làm việc đầu tiên.</i></p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #999; text-align: center;">Đây là email tự động từ hệ thống quản lý Làng Mixi. Vui lòng không trả lời email này.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`Đã gửi mail cấp tài khoản thành công cho: ${email}`);

        } catch (mailError) {
            console.error("Lỗi gửi mail tài khoản (DB vẫn lưu thành công):", mailError);
            return res.status(200).json({
                success: true,
                data: newUser,
                message: 'Thêm User thành công nhưng hệ thống gửi Mail thông báo gặp sự cố!'
            });
        }

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

export const changePassword = async (req, res) => {
    try {
        const { id, password } = req.body;
        const hashPassword = await bcrypt.hash(password, 10);

        const { data: user, error: fetchUserErr } = await supabase
            .from('users')
            .select('email, fullname')
            .eq('id', id)
            .maybeSingle();

        const fullname = user.fullname;
        const emailhople = user.email;

        const { data: changePassword, error: fetchErr } = await supabase
            .from('users')
            .update({ password_hash: hashPassword })
            .eq('id', id);

        if (fetchErr) throw fetchErr;

        try {
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: `"Làng Mixi Management" <${process.env.EMAIL_USER}>`,
                to: emailhople,
                subject: '[Làng Mixi] Thông báo cấp tài khoản nhân viên mới',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px;">
                        <h2 style="color: #ff6b00; text-align: center;">CHÀO MỪNG THÀNH VIÊN MỚI</h2>
                        <p>Xin chào <b>${fullname}</b>,</p>
                        <p>Tài khoản quản trị hệ thống nội bộ của bạn tại <b>Làng Mixi</b> đã được thay đổi mật khẩu thành công.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff6b00; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 5px 0;"><b>Mật khẩu mới:</b> <code style="font-size: 14px; color: #333;">${password}</code></p>
                        </div>

                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #999; text-align: center;">Đây là email tự động từ hệ thống quản lý Làng Mixi. Vui lòng không trả lời email này.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`Đã gửi mail cấp tài khoản thành công cho: ${emailhople}`);

        } catch (mailError) {
            console.error("Lỗi gửi mail tài khoản (DB vẫn lưu thành công):", mailError);
            return res.status(200).json({
                success: true,
                data: changePassword,
                message: 'Thêm User thành công nhưng hệ thống gửi Mail thông báo gặp sự cố!'
            });
        }

        return res.status(200).json({ success: true, message: 'Cập nhật mật khẩu thành công' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const quanlythoigianlam = async (req, res) => {
    try {

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}