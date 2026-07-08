//Xử lý logic Đăng nhập/Đăng ký (bcrypt, jwt)
//==============================================

import { supabase } from "../config/supabase.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const { data: user, error: fetchErr } = await supabase
            .from('users')
            .select('id, username, fullname, role, password_hash, permissions')
            .eq('username', username)
            .eq('is_active', true)
            .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tồn tại tài khoản' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác' });
        }

        const { password_hash, ...userSession } = user;

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'MA_BAO_MAT_DU_PHONG',
            { expiresIn: '1d' }
        );

        await supabase
            .from('user_logs')
            .insert([
                {
                    user_id: user.id,
                    username: user.username,
                    action: 'LOGIN'
                }
            ]);

        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công!',
            user: userSession,
            token: token
        });

    } catch (error) {
        console.error("Lỗi login:", error);
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
}



export const logout = async (req, res) => {
    const { user_id, username } = req.body;
    await supabase
        .from('user_logs')
        .insert([
            {
                user_id: user_id,
                username: username,
                action: 'LOGOUT'
            }
        ]);

    return res.status(200).json({
        success: true,
        message: 'Đăng xuất thành công!'
    });
};