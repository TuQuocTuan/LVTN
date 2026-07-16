import { supabase } from '../config/supabase.js';
import moment from 'moment-timezone';
import nodemailer from 'nodemailer';



export const getCustomerVoucher = async (req, res) => {
    try {
        const { phone_number } = req.body;
        if (!phone_number) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số điện thoại!' });
        }
        const { data: customer, error: customerErr } = await supabase
            .from('customers')
            .select('id')
            .eq('phone_number', phone_number.trim())
            .maybeSingle()
        if (customerErr) throw customerErr;
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng!' });
        }
        const { data: cusVoucher, error: cusVoucherErr } = await supabase
            .from('customer_vouchers')
            .select('customer_id, promotion_id, is_used')
            // .eq('customer_id', customer.id)
            // .eq('is_used', false)
            .eq('customer_id', customer.id);
        if (cusVoucherErr) throw cusVoucherErr;
        if (!cusVoucher || cusVoucher.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy voucher cho khách hàng này!' });
        }

        let promotionsID = cusVoucher.map(voucher => voucher.promotion_id);

        const { data: promotions, error: promotionErr } = await supabase
            .from('promotions')
            .select('id,code,name,discount_value,discount_type,is_active,created_at,start_date,end_date')
            .in('id', promotionsID)
            .eq('is_active', true);
        if (promotionErr) throw promotionErr;

        const promotionResult = [];
        cusVoucher.forEach(cv => {
            const promo = promotions.find(p => p.id === cv.promotion_id);
            if (promo) {
                promotionResult.push({
                    id: promo.id,
                    code: promo.code,
                    name: promo.name,
                    discount_value: promo.discount_value,
                    discount_type: promo.discount_type,
                    is_active: promo.is_active,
                    is_used: cv.is_used,
                    created_at: promo.created_at,
                    start_date: promo.start_date,
                    end_date: promo.end_date
                });
            }
        });

        return res.status(200).json({ success: true, message: 'Voucher của khách hàng', promotion: promotionResult });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}


//Hàm lấy KM
export const getAllPromotions = async (req, res) => {
    try {
        const { data: promotions, error: promotionsErr } = await supabase
            .from('promotions')
            .select('id,code,name,type,discount_type,discount_value,min_bill_value,start_date,end_date,is_active')
            //.eq('is_active', true)
            .order('created_at', { ascending: false });

        if (promotionsErr) throw promotionsErr;
        return res.status(200).json({ success: true, message: 'Danh sách khuyến mãi', promotions });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

//Hàm thêm KM
export const addPromotions = async (req, res) => {
    try {
        const { code, name, type, discount_type, discount_value, min_bill_value, start_date, end_date, is_active } = req.body;

        if (!code || !name || !type || !discount_type || !discount_value || !start_date || !end_date) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc!' });
        }

        const { data: existingPromo, error: fetchErr } = await supabase
            .from('promotions')
            .select('id')
            .or(`code.eq.${code.toUpperCase()},name.eq.${name.toUpperCase()}`)
            .maybeSingle();

        if (fetchErr) throw fetchErr;

        if (existingPromo) {
            return res.status(400).json({
                success: false,
                message: 'Mã hoặc tên khuyến mãi đã tồn tại!'
            });
        }

        let formatData = {
            code: code.toUpperCase(),
            name: name.toUpperCase(),
            type: type.toUpperCase(),
            discount_type: discount_type.toUpperCase(),
            discount_value: Number(discount_value),
            min_bill_value: min_bill_value ? Number(min_bill_value) : null,
            start_date: moment(start_date).tz("Asia/Ho_Chi_Minh").toISOString(),
            end_date: moment(end_date).tz("Asia/Ho_Chi_Minh").toISOString(),
            is_active: is_active !== undefined ? Boolean(is_active) : true,
        };

        const { data: addedPromo, error: addErr } = await supabase
            .from('promotions')
            .insert([formatData])
            .select();
        if (addErr) throw addErr;

        return res.status(200).json({
            success: true,
            message: 'Thêm khuyến mãi thành công!',
            data: addedPromo
        });

    } catch (error) {
        console.error("Lỗi addPromotions:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}

//Hàm cập nhật KM
export const updatePromotion = async (req, res) => {
    try {
        const { id, code, name, type, discount_type, discount_value, min_bill_value, start_date, end_date, is_active } = req.body;
        if (!code || !name || !type || !discount_type || !discount_value || !start_date || !end_date) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc!' });
        }

        const { data: existingPromo, error: fetchErr } = await supabase
            .from('promotions')
            .select('*')
            .or(`code.eq.${code.toUpperCase()},name.eq.${name.toUpperCase()}`)
            .neq('id', id)
            .maybeSingle();
        if (fetchErr) throw fetchErr;
        if (existingPromo) {
            return res.status(400).json({
                success: false,
                message: 'Mã hoặc tên bị trùng'
            });
        }

        let formatData = {
            code: code.toUpperCase(),
            name: name.toUpperCase(),
            type: type.toUpperCase(),
            discount_type: discount_type.toUpperCase(),
            discount_value: Number(discount_value),
            min_bill_value: min_bill_value ? Number(min_bill_value) : null,
            start_date: moment(start_date).tz("Asia/Ho_Chi_Minh").toISOString(),
            end_date: moment(end_date).tz("Asia/Ho_Chi_Minh").toISOString(),
            is_active: is_active !== undefined ? Boolean(is_active) : true,
        };

        const { data: updatedPromo, error: updateErr } = await supabase
            .from('promotions')
            .update(formatData)
            .eq('id', id)
            .select();
        if (updateErr) throw updateErr;

        return res.status(200).json({
            success: true,
            message: 'Cập nhật khuyến mãi thành công!',
            data: updatedPromo
        });
    } catch (error) {
        console.error("Lỗi updatePromotion:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}

//Hàm xoá KM
export const deletePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp id' });
        }

        const { data: deletePromo, error: fetchErr } = await supabase
            .from('promotions')
            .delete()
            .eq('id', id)
            .select();
        if (fetchErr) throw fetchErr;
        if (!deletePromo) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
        }
        return res.status(200).json({ success: true, message: 'Xóa khuyến mãi thành công!', data: deletePromo });
    } catch (error) {
        console.error("Lỗi deletePromotion:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}

//Hàm tính tổng bill của khách
export const calculateCustomerTotalBill = async (customer_id) => {
    const { data: dining_session, error: fetchCusErr } = await supabase
        .from('dining_sessions')
        .select('customers(name, phone_number),id')
        .eq('customer_id', customer_id);
    if (fetchCusErr) throw fetchCusErr;

    let arrayIDSession = dining_session.map((session) => session.id);
    let totalbill = 0;

    const { data: bill, error: fetchBillErr } = await supabase
        .from('bills')
        .select('total_amount')
        .in('session_id', arrayIDSession);
    if (fetchBillErr) throw fetchBillErr;
    totalbill = bill.reduce((total, item) => total + item.total_amount, 0);
    return totalbill;
}

//Hàm lấy tổng bill của khách
export const getTotalBillCustomer = async (req, res) => {
    try {
        const { customer_id } = req.body;
        if (!customer_id) {
            return res.status(400).json({ success: false, message: 'Thiếu Customer ID!' });
        }

        const totalbill = await calculateCustomerTotalBill(customer_id);

        return res.status(200).json({ success: true, message: 'Tổng số tiền đã chi ra:', totalbill });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// 🌟 API MỚI: Lấy danh sách lịch sử khách hàng đã nhận Voucher (Cho Tab "Danh sách Voucher đã tặng")
export const getCustomerVouchersHistory = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('customer_vouchers')
            .select(`
                id, is_used, created_at,
                customers ( name, phone_number, email ),
                promotions ( code, name, discount_value, discount_type )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

//Hàm thêm voucher cho khách
export const giftVoucherToCustomer = async (req, res) => {
    const { phone_number, promotion_id, bypass_limit } = req.body;

    try {
        if (!phone_number || !promotion_id) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ Số điện thoại và mã Voucher!' });
        }

        const { data: customer, error: findCusErr } = await supabase
            .from('customers')
            .select('id, name, email')
            .eq('phone_number', phone_number.trim())
            .maybeSingle();

        if (findCusErr) throw findCusErr;

        if (!customer) {
            return res.status(404).json({ success: false, message: `Không tìm thấy bất kỳ khách hàng nào sử dụng Số điện thoại: ${phone_number}` });
        }

        const customer_id = customer.id;

        const { data: promotion, error: promoErr } = await supabase
            .from('promotions')
            .select('*')
            .eq('id', promotion_id)
            .single();

        if (promoErr) throw promoErr;

        const { data: hasVoucher, error: checkVoucherErr } = await supabase
            .from('customer_vouchers')
            .select('id')
            .eq('customer_id', customer_id)
            .eq('promotion_id', promotion_id)
            .maybeSingle();

        if (checkVoucherErr) throw checkVoucherErr;
        if (hasVoucher) {
            return res.status(400).json({ success: false, message: 'Khách hàng này đã sở hữu mã giảm giá này rồi!' });
        }

        const { error: addErrCustomer } = await supabase
            .from('customer_vouchers')
            .insert({
                customer_id: customer_id,
                promotion_id: promotion_id,
                is_used: false,
                created_at: moment().tz("Asia/Ho_Chi_Minh").toISOString(),
            });

        if (addErrCustomer) throw addErrCustomer;


        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        let mailSent = false;
        console.log(`[MAIL] Khởi động luồng gửi mail bằng SendGrid cho: ${customer?.email || 'Trống'} (Tên: ${customer?.name})`);
        if (customer.email && customer.email.trim() !== '') {
            try {
                console.log(`[MAIL] Email hợp lệ. Đang gọi API SendGrid...`);

                const msg = {
                    to: customer.email,
                    from: process.env.EMAIL_USER,
                    subject: '[Làng MÌXI] Thông báo: Bạn nhận được Voucher tri ân đặc biệt!',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px;">
                            <h2 style="color: #ff6b00; text-align: center;">MÓN QUÀ TRI ÂN KHÁCH HÀNG</h2>
                            <p>Xin chào <b>${customer.name}</b>,</p>
                            <p>Bạn vừa được hệ thống quản trị <b>Làng MÌXI</b> gửi tặng một phần quà tri ân đặc biệt:</p>
                            
                            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff6b00; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 5px 0;"><b>Tên Voucher:</b> <code style="font-size: 14px; color: #333;">${promotion.name}</code></p>
                                <p style="margin: 5px 0;"><b>Mã Voucher:</b> <b style="font-size: 16px; color: #ff6b00;">${promotion.code}</b></p>
                                <p style="margin: 5px 0;"><b>Mức giảm giá:</b> <code style="font-size: 14px; color: #333;">${promotion.discount_type === 'PERCENTAGE' ? promotion.discount_value + '%' : promotion.discount_value.toLocaleString('vi-VN') + ' đ'}</code></p>
                                <p style="margin: 5px 0;"><b>Hóa đơn tối thiểu:</b> <code style="font-size: 14px; color: #333;">${promotion.min_bill_value ? promotion.min_bill_value.toLocaleString('vi-VN') + ' VND' : 'Không có điều kiện'}</code></p>
                                <p style="margin: 5px 0;"><b>Hạn sử dụng:</b> <code style="font-size: 14px; color: #333;">Đến hết ngày ${moment(promotion.end_date).format('DD/MM/YYYY HH:mm')}</code></p>
                            </div>

                            <p style="font-size: 13px; color: #555;"><i>Cảm ơn bạn đã luôn đồng hành và ủng hộ Làng MÌXI! Vui lòng xuất trình mã này khi thanh toán tại quầy.</i></p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 12px; color: #999; text-align: center;">Đây là email tự động từ hệ thống quản lý Làng MÌXI. Vui lòng không trả lời email này.</p>
                        </div>
                    `
                };
                await sgMail.send(msg);
                mailSent = true;
                console.log(`[MAIL] Đã gửi mail qua SendGrid thành công tới: ${customer.email}`);
            } catch (mailError) {
                console.error("[MAIL] Lỗi SendGrid API:", error.response ? error.response.body : error);
            }
        }

        const successMessage = mailSent
            ? 'Đã phát tặng Voucher thành công và đã gửi thư chúc mừng tới Email của khách!'
            : 'Đã phát tặng Voucher thành công! (Khách hàng chưa đăng ký Email hoặc Email dùng thử nên không gửi thư thông báo)';

        return res.status(200).json({ success: true, message: successMessage });

    } catch (error) {
        console.error("Lỗi giftVoucherToCustomer:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}