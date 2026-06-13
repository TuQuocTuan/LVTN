import { supabase } from '../config/supabase.js';
import moment from 'moment-timezone';
// export const getCustomerVoucher = async (req, res) => {
//     try {
//         const { phone_number } = req.body;
//         const { data: customer, error: customerErr } = await supabase
//             .from('customers')
//             .select('id')
//             .eq('phone_number', phone_number)
//             .maybeSingle()
//         const { data: cusVoucher, error: cusVoucherErr } = await supabase
//             .from('customer_vouchers')
//             .select('customer_id, promotion_id, is_used')
//             .eq('customer_id', customer.id)
//             .eq('is_used', false)
//         if (!cusVoucher || cusVoucher.length === 0) {
//             return res.status(404).json({ success: false, message: 'Không tìm thấy voucher cho khách hàng này!' });
//         }

//         let promotionsID = cusVoucher.map(voucher => voucher.promotion_id);

//         const { data: promotion, error: promotionErr } = await supabase
//             .from('promotions')
//             .select('code,name,discount_value,is_active')
//             .in('id', promotionsID)
//             .eq('is_active', true)
//         return res.status(200).json({ success: true, message: 'Voucher của khách hàng', promotion });
//     } catch (error) {
//         return res.status(500).json({ success: false, message: error.message });
//     }
// }


//Hàm lấy KM
export const getAllPromotions = async (req, res) => {
    try {
        const { data: promtions, error: promotionsErr } = await supabase
            .from('promotions')
            .select('code,name,type,discount_value,min_bill_value,start_date,end_date')
            .eq('is_active', true)
        if (promotionsErr) throw promotionsErr;
        return res.status(200).json({ success: true, message: 'Danh sách khuyến mãi', promtions });
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

        if (formatData.type === "VOUCHER") {
            const { data: addedPromo, error: addErr } = await supabase
                .from('promotions')
                .insert([formatData])
                .select('*,id')
                .single();

            if (addErr) throw addErr;

            const { data: addedPromoCustomer, error: addErrCustomer } = await supabase
                .from('customer_vouchers')
                .insert({
                    customer_id: customer_id,
                    promotion_id: addedPromo.id,
                    is_used: false,
                    created_at: moment().tz("Asia/Ho_Chi_Minh").toISOString(),
                })
                .select();
            if (addErrCustomer) throw addErrCustomer;
        }
        return res.status(200).json({ success: true, message: 'Thêm khuyến mãi thành công!' });
    } catch (error) {
        console.error("Lỗi addPromotions:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}