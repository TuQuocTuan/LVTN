import { supabase } from '../config/supabase.js';

export const getCustomerVoucher = async (req, res) => {
    try {
        const { phone_number } = req.body;
        const { data: customer, error: customerErr } = await supabase
            .from('customers')
            .select('id')
            .eq('phone_number', phone_number)
            .maybeSingle()
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
