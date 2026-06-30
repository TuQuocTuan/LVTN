import { supabase } from '../config/supabase.js';
import moment from 'moment-timezone';
import nodemailer from 'nodemailer';



export const getCustomerVoucher = async (req, res) => {
    try {
        const { phone_number, email } = req.body;
        const { data: customer, error: customerErr } = await supabase
            .from('customers')
            .select('id')
            .eq('phone_number', phone_number)
            .eq('email', email)
            .maybeSingle()
        if (customerErr) throw customerErr;
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng!' });
        }
        const { data: cusVoucher, error: cusVoucherErr } = await supabase
            .from('customer_vouchers')
            .select('customer_id, promotion_id, is_used')
            .eq('customer_id', customer.id)
            .eq('is_used', false)
        if (!cusVoucher || cusVoucher.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy voucher cho khách hàng này!' });
        }

        let promotionsID = cusVoucher.map(voucher => voucher.promotion_id);

        const { data: promotion, error: promotionErr } = await supabase
            .from('promotions')
            .select('code,name,discount_value,is_active')
            .in('id', promotionsID)
            .eq('is_active', true)
        return res.status(200).json({ success: true, message: 'Voucher của khách hàng', promotion });
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

//Hàm thêm voucher cho khách
export const addVoucherCustomer = async (req, res) => {
    const { code, name, type, discount_type, discount_value, min_bill_value, start_date, end_date, is_active, customer_id } = req.body;

    try {
        if (!code || !name || !type || !discount_type || !discount_value || !start_date || !end_date || !customer_id) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc!' });
        }

        const totalBill = await calculateCustomerTotalBill(customer_id);

        if (type === "VOUCHER" && totalBill < 5000000) {
            return res.status(400).json({ success: false, message: 'Chưa đủ điều kiện chi tiêu 5 triệu!' });
        }

        let promotionId = null;
        const upperCode = code.toUpperCase();

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

        const { data: existingPromo, error: checkErr } = await supabase
            .from('promotions')
            .select('id')
            .eq('code', upperCode)
            .maybeSingle();

        if (checkErr) throw checkErr;

        if (existingPromo) {
            promotionId = existingPromo.id;
        }
        else {
            const { data: addedPromo, error: addErr } = await supabase
                .from('promotions')
                .insert([formatData])
                .select('*,id')
                .single();

            if (addErr) throw addErr;
            promotionId = addedPromo.id;
        }

        const { data: hasVoucher, error: checkVoucherErr } = await supabase
            .from('customer_vouchers')
            .select('id')
            .eq('customer_id', customer_id)
            .eq('promotion_id', promotionId)
            .maybeSingle();

        if (checkVoucherErr) throw checkVoucherErr;
        if (hasVoucher) {
            return res.status(400).json({ success: false, message: 'Khách hàng này đã sở hữu mã giảm giá này rồi!' });
        }

        const { data: addedPromoCustomer, error: addErrCustomer } = await supabase
            .from('customer_vouchers')
            .insert({
                customer_id: customer_id,
                promotion_id: promotionId,
                is_used: false,
                created_at: moment().tz("Asia/Ho_Chi_Minh").toISOString(),
            })
            .select();
        if (addErrCustomer) throw addErrCustomer;

        const { data: customer, error: fetchCusErr } = await supabase
            .from('customers')
            .select('name,email')
            .eq('id', customer_id)
            .single();
        if (fetchCusErr) throw fetchCusErr;

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
                to: customer.email,
                subject: '[Làng Mixi] Bạn đã được cấp voucher mới',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px;">
                        <h2 style="color: #ff6b00; text-align: center;">BẠN ĐÃ ĐƯỢC TẶNG 1 VOUCHER</h2>
                        <p>Xin chào <b>${customer.name}</b>,</p>
                        <p>Bạn đã được hệ thống <b>Làng Mixi</b> tặng 1 voucher.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff6b00; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 5px 0;"><b>Mã Voucher:</b> <code style="font-size: 14px; color: #333;">${formatData.code}</code></p>
                            <p style="margin: 5px 0;"><b>Loại Voucher:</b> <code style="font-size: 14px; color: #333;">${formatData.type}</code></p>
                            <p style="margin: 5px 0;"><b>Loại Giảm giá:</b> <code style="font-size: 14px; color: #333;">${formatData.discount_type}</code></p>
                            <p style="margin: 5px 0;"><b>Giá trị giảm giá:</b> <code style="font-size: 14px; color: #333;">${formatData.discount_value}</code></p>
                            <p style="margin: 5px 0;"><b>Giá trị đơn hàng tối thiểu:</b> <code style="font-size: 14px; color: #333;">${formatData.min_bill_value ? formatData.min_bill_value.toLocaleString('vi-VN') + ' VND' : '0 VND'}</code></p>
                            <p style="margin: 5px 0;"><b>Thời gian bắt đầu:</b> <code style="font-size: 14px; color: #333;">${formatData.start_date}</code></p>
                            <p style="margin: 5px 0;"><b>Thời gian kết thúc:</b> <code style="font-size: 14px; color: #333;">${formatData.end_date}</code></p>
                            <p style="margin: 5px 0;"><b>Trạng thái:</b> <code style="font-size: 14px; color: #333;">${formatData.is_active}</code></p>
                        </div>

                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #999; text-align: center;">Đây là email tự động từ hệ thống quản lý Làng Mixi. Vui lòng không trả lời email này.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`Đã gửi mail voucher thành công cho: ${customer.email}`);

        } catch (mailError) {
            console.error("Lỗi gửi mail voucher:", mailError);
            return res.status(200).json({
                success: true,
                message: 'Thêm khuyến mãi thành công nhưng hệ thống gửi Mail thông báo gặp sự cố!'
            });
        }

        return res.status(200).json({ success: true, message: 'Thêm khuyến mãi thành công!' });
    } catch (error) {
        console.error("Lỗi addPromotions:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}