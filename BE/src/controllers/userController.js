//Quản lý các user 
//=================================

import { supabase } from '../config/supabase.js';
import bcrypt from 'bcrypt';
import moment from 'moment';
import sgMail from '@sendgrid/mail';

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


        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        let mailSent = false;
        console.log(`[MAIL] Khởi động luồng gửi mail bằng SendGrid cho: ${newUser?.email || 'Trống'} (Tên: ${newUser?.fullname})`);
        if (newUser.email && newUser.email.trim() !== '') {
            try {
                console.log(`[MAIL] Email hợp lệ. Đang gọi API SendGrid...`);

                const msg = {
                    to: newUser.email,
                    from: process.env.EMAIL_USER,
                    subject: '[Làng MÌXI] Thông báo: Bạn được cấp tài khoản!',
                    html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px;">
                                    <h2 style="color: #ff6b00; text-align: center;">TÀI KHOẢN </h2>
                                    <p>Xin chào <b>${fullname}</b>,</p>
                                    <p>Bạn vừa được hệ thống quản trị <b>Làng MÌXI</b> cấp tài khoản:</p>
                                    
                                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff6b00; margin: 20px 0; border-radius: 4px;">
                                        <p style="margin: 5px 0;"><b>Tên tài khoản:</b> <code style="font-size: 14px; color: #333;">${newUser.username}</code></p>
                                        <p style="margin: 5px 0;"><b>Mật khẩu:</b> <b style="font-size: 16px; color: #ff6b00;">123456</b></p>
                                    </div>

                                    <p style="font-size: 13px; color: #555;"><i>Vui lòng đổi mật khẩu sau khi nhận mail này.</i></p>
                                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                                    <p style="font-size: 12px; color: #999; text-align: center;">Đây là email tự động từ hệ thống quản lý Làng MÌXI. Vui lòng không trả lời email này.</p>
                                </div>
                            `
                };
                await sgMail.send(msg);
                mailSent = true;
                console.log(`[MAIL] Đã gửi mail qua SendGrid thành công tới: ${newUser.email}`);
            } catch (mailError) {
                console.error("[MAIL] Lỗi SendGrid API:", error.response ? error.response.body : error);
            }
        }

        const successMessage = mailSent
            ? 'Đã tạo tài khoản thành công và đã gửi thư chúc mừng tới Email của khách!'
            : 'Đã tạo tài khoản thành công! (Nhân viên chưa đăng ký Email hoặc Email dùng thử nên không gửi thư thông báo)';

        return res.status(200).json({ success: true, message: successMessage });
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

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        let mailSent = false;
        console.log(`[MAIL] Khởi động luồng gửi mail bằng SendGrid cho: ${user?.email || 'Trống'} (Tên: ${user?.name})`);
        if (user.email && user.email.trim() !== '') {
            try {
                console.log(`[MAIL] Email hợp lệ. Đang gọi API SendGrid...`);

                const msg = {
                    to: user.email,
                    from: process.env.EMAIL_USER,
                    subject: '[Làng MÌXI] Thông báo: Bạn nhận được Voucher tri ân đặc biệt!',
                    html: `
                               <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px;">
                                    <h2 style="color: #ff6b00; text-align: center;">TÀI KHOẢN </h2>
                                    <p>Xin chào <b>${user.fullname}</b>,</p>
                                    <p>Bạn vừa được hệ thống quản trị <b>Làng MÌXI</b> cập nhật lại mật khẩu:</p>
                                    
                                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff6b00; margin: 20px 0; border-radius: 4px;">
                                        <p style="margin: 5px 0;"><b>Tên tài khoản:</b> <code style="font-size: 14px; color: #333;">${user.fullname}</code></p>
                                        <p style="margin: 5px 0;"><b>Mật khẩu mới:</b> <b style="font-size: 16px; color: #ff6b00;">${password}</b></p>
                                    </div>

                                    <p style="font-size: 13px; color: #555;"><i>Vui lòng đổi mật khẩu sau khi nhận mail này.</i></p>
                                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                                    <p style="font-size: 12px; color: #999; text-align: center;">Đây là email tự động từ hệ thống quản lý Làng MÌXI. Vui lòng không trả lời email này.</p>
                                </div>
                            `
                };
                await sgMail.send(msg);
                mailSent = true;
                console.log(`[MAIL] Đã gửi mail qua SendGrid thành công tới: ${user.email}`);
            } catch (mailError) {
                console.error("[MAIL] Lỗi SendGrid API:", error.response ? error.response.body : error);
            }
        }

        const successMessage = mailSent
            ? 'Đã cập nhật tài khoản thành công và đã gửi thư chúc mừng tới Email của khách!'
            : 'Đã cập nhật khoản thành công! (Nhân viên chưa đăng ký Email hoặc Email dùng thử nên không gửi thư thông báo)';

        return res.status(200).json({ success: true, message: successMessage });
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
        const tiendauca = 1000000;
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