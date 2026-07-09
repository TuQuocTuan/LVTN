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
                from: `"Làng MÌXI Management" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '[Làng MÌXI] Thông báo cấp tài khoản nhân viên mới',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px;">
                        <h2 style="color: #ff6b00; text-align: center;">CHÀO MỪNG THÀNH VIÊN MỚI</h2>
                        <p>Xin chào <b>${fullname}</b>,</p>
                        <p>Tài khoản quản trị hệ thống nội bộ của bạn tại <b>Làng MÌXI</b> đã được khởi tạo thành công với vai trò: <span style="text-transform: uppercase; font-weight: bold; color: #ff6b00;">${role}</span>.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff6b00; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 5px 0;"><b>Tên đăng nhập:</b> <code style="font-size: 14px; color: #333;">${username}</code></p>
                            <p style="margin: 5px 0;"><b>Mật khẩu kích hoạt:</b> <code style="font-size: 14px; color: #333;">${password}</code></p>
                        </div>

                        <p style="color: #dd2c00; font-size: 13px;"><i>* Lưu ý: Để đảm bảo an toàn bảo mật, vui lòng tiến hành đăng nhập và đổi lại mật khẩu cá nhân ngay trong phiên làm việc đầu tiên.</i></p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #999; text-align: center;">Đây là email tự động từ hệ thống quản lý Làng MÌXI. Vui lòng không trả lời email này.</p>
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
                from: `"Làng MÌXI Management" <${process.env.EMAIL_USER}>`,
                to: emailhople,
                subject: '[Làng MÌXI] Thông báo cấp tài khoản nhân viên mới',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px;">
                        <h2 style="color: #ff6b00; text-align: center;">CHÀO MỪNG THÀNH VIÊN MỚI</h2>
                        <p>Xin chào <b>${fullname}</b>,</p>
                        <p>Tài khoản quản trị hệ thống nội bộ của bạn tại <b>Làng MÌXI</b> đã được thay đổi mật khẩu thành công.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff6b00; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 5px 0;"><b>Mật khẩu mới:</b> <code style="font-size: 14px; color: #333;">${password}</code></p>
                        </div>

                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #999; text-align: center;">Đây là email tự động từ hệ thống quản lý Làng MÌXI. Vui lòng không trả lời email này.</p>
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

export const quanlythoigianlam1ca = async (req, res) => {
    try {

        const { data: cashiers, error: fetchErr } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'cashier')
            .eq('is_active', true);
        if (fetchErr) throw fetchErr;

        const cashierIDs = cashiers.map(cashier => cashier.id);

        const { data: shift } = await supabase
            .from('user_logs')
            .select('user_id,action,created_at')
            .in('user_id', cashierIDs)
            .order('created_at', { ascending: true });

        if (!shift) return res.status(404).json({ success: false, message: 'Ca không tồn tại' });

        const reportShifts = [];
        const activeLogins = {};

        shift.forEach(item => {
            const userId = item.user_id;
            if (item.action === 'LOGIN') {
                activeLogins[userId] = item;
            } else if (item.action === 'LOGOUT') {
                if (activeLogins[userId]) {
                    const loginlog = activeLogins[userId];
                    const logintime = new Date(loginlog.created_at);
                    const logouttime = new Date(item.created_at);

                    const diffMs = logouttime - logintime;
                    const tongphut = Math.floor(diffMs / (1000 * 60));
                    const sogio = Math.floor(tongphut / 60);
                    const sophut = tongphut % 60;

                    reportShifts.push({
                        user_id: userId,
                        username: item.username,
                        login_time: logintime.toLocaleString('vi-VN'),
                        logout_time: logouttime.toLocaleString('vi-VN'),
                        duration: `${sogio} giờ ${sophut} phút (${tongphut} phút)`,
                        date: logintime.toLocaleString('vi-VN').split(',')[0],
                    });

                    delete activeLogins[userId];
                }
            }
        })

        reportShifts.sort((a, b) => new Date(b.login_time) - new Date(a.login_time));
        return res.status(200).json({ success: true, data: reportShifts });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const ketCa = async (req, res) => {
    try {
        const now = moment().tz("Asia/Ho_Chi_Minh");
        const startOfDay = moment().tz("Asia/Ho_Chi_Minh").startOf('day').toISOString();
        const endOfDay = moment().tz("Asia/Ho_Chi_Minh").endOf('day').toISOString();
        const thoigianin = now.format("DD/MM/YYYY HH:mm:ss");

        const { data: bills, error: fetchErr } = await supabase
            .from('bills')
            .select('*')
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay);

        const soLuongDon = bills ? bills.length : 0;
        const tongTienBanDuoc = bills ? bills.reduce((sum, bill) => sum + Number(bill.total_amount || 0), 0) : 0;
        const tiendauca = 4000000;
        const tongTienTrongKet = tiendauca + tongTienBanDuoc;

        if (fetchErr) throw fetchErr;

        const html_bill = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page {
                    size: 80mm auto;
                    margin: 0;
                }
                html, body {
                    margin: 0;
                    padding: 0;
                    width: 80mm;
                    height: auto;
                    background-color: #fff;
                }
                body {
                    font-family: 'Arial', sans-serif;
                    font-size: 12px;
                    padding: 8px;
                    box-sizing: border-box;
                }
                .text-center { text-align: center; }
                .bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; }
                .text-right { text-align: right; }
            </style>
        </head>
        <body>
            <div class="text-center">
                <h3 style="margin: 0; font-size: 16px;">MÌXI</h3>
                <p style="margin: 5px 0;" class="bold">BÁO CÁO KẾT CA</p>
            </div>
            <div class="divider"></div>
            <p>Thời gian in: ${thoigianin}</p>
            <p>Tổng số đơn hàng: ${soLuongDon}</p>
            <div class="divider"></div>
            <table>
                <tr>
                    <td>Tiền đầu ca:</td>
                    <td class="text-right">${tiendauca.toLocaleString('vi-VN')}đ</td>
                </tr>
                <tr>
                    <td>Tổng doanh thu:</td>
                    <td class="text-right">${tongTienBanDuoc.toLocaleString('vi-VN')}đ</td>
                </tr>
                <tr class="bold" style="font-size: 14px;">
                    <td>TỔNG TRONG KÉT:</td>
                    <td class="text-right">${tongTienTrongKet.toLocaleString('vi-VN')}đ</td>
                </tr>
            </table>
            <div class="divider"></div>
            <div class="text-center bold">XÁC NHẬN CỦA QUẢN LÝ</div>
            <br><br><br><br>
            <div class="text-center">(Ký và ghi rõ họ tên)</div>
        </body>
        </html>
        `;

        return res.status(200).json({
            success: true,
            tien_dau_ca: tiendauca,
            tong_tien_ban_duoc: tongTienBanDuoc,
            tong_tien_trong_ket: tongTienTrongKet,
            html_bill: html_bill
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }

}