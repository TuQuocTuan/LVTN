import qs from 'qs';
import crypto from 'crypto';
import moment from 'moment-timezone';
import { supabase } from '../config/supabase.js';

const vnpEncode = (str) => {
    return encodeURIComponent(str)
        .replace(/%20/g, '+')
        .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
};

export const createVnPayUrl = (req, session_id, amount) => {
    let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
        ipAddr = '127.0.0.1';
    }

    const tmnCode = 'HFZO9WRM';
    const secretKey = 'HXWPBBC8GOHC2CWLRJUYV0L2O51IUIOI';
    const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = 'https://lvtn-sable.vercel.app/cashier';
    const date = new Date();
    const createDate = moment(date).tz("Asia/Ho_Chi_Minh").format('YYYYMMDDHHmmss');

    let vnp_Params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': tmnCode,
        'vnp_Locale': 'vn',
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': `${session_id}_${createDate}`,
        'vnp_OrderInfo': `Thanh toan hoa don phien an ${session_id}`,
        'vnp_OrderType': 'other',
        'vnp_Amount': Math.round(amount) * 100,
        'vnp_ReturnUrl': returnUrl,
        'vnp_IpAddr': ipAddr,
        'vnp_CreateDate': createDate
    };

    vnp_Params = Object.keys(vnp_Params)
        .sort()
        .reduce((obj, key) => {
            obj[key] = vnp_Params[key];
            return obj;
        }, {});

    const signData = Object.entries(vnp_Params)
        .map(([key, val]) => `${encodeURIComponent(key)}=${vnpEncode(val)}`)
        .join('&');

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    vnp_Params['vnp_SecureHash'] = signed;

    const linkParams = Object.entries(vnp_Params)
        .map(([key, val]) => `${encodeURIComponent(key)}=${vnpEncode(val)}`)
        .join('&');

    return `${vnpUrl}?${linkParams}`;
};


export const vnpayIPN = async (req, res) => {
    console.log("--> [IPN] Có tín hiệu gọi ngầm từ VNPay!");

    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = Object.keys(vnp_Params)
            .sort()
            .reduce((obj, key) => {
                obj[key] = vnp_Params[key];
                return obj;
            }, {});

        const secretKey = 'HXWPBBC8GOHC2CWLRJUYV0L2O51IUIOI';

        const signData = Object.entries(vnp_Params)
            .map(([key, val]) => `${encodeURIComponent(key)}=${vnpEncode(val)}`)
            .join('&');

        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        if (secureHash.toLowerCase() === signed.toLowerCase()) {
            console.log("[IPN] Khớp chữ ký SecureHash thành công!");

            const responseCode = vnp_Params['vnp_ResponseCode'];
            const txnRef = vnp_Params['vnp_TxnRef'];
            const session_id = txnRef.split('_')[0];

            if (responseCode === '00') {
                console.log(`[IPN] Đang tiến hành xử lý cho session_id: ${session_id}...`);

                const { data: sessionData, error: fetchError } = await supabase
                    .from('dining_sessions')
                    .select('*')
                    .eq('id', session_id)
                    .single();

                if (fetchError || !sessionData) {
                    console.error("[IPN] Không tìm thấy dữ liệu phiên ăn:", fetchError?.message);
                    return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
                }

                const { error: sessionError } = await supabase
                    .from('dining_sessions')
                    .update({ status: 'closed' })
                    .eq('id', session_id);

                if (sessionError) {
                    console.error("[IPN] Lỗi đóng phiên ăn:", sessionError.message);
                    return res.status(200).json({ RspCode: '02', Message: 'Update session failed' });
                }

                const totalAmount = parseInt(vnp_Params['vnp_Amount'], 10) / 100; // Số tiền cuối thu từ VNPay (Tổng tiền)
                const vatRate = 0.10;


                const discountAmount = sessionData.discount_amount || 0;

                const subTotal = sessionData.sub_total || Math.round(totalAmount / (1 + vatRate) + discountAmount);
                const vatAmount = Math.round((subTotal - discountAmount) * vatRate);

                const { data: billData, error: billError } = await supabase
                    .from('bills')
                    .insert([
                        {
                            session_id: session_id,
                            sub_total: subTotal,
                            discount_amount: discountAmount,
                            vat_rate: vatRate,
                            vat_amount: vatAmount,
                            total_amount: totalAmount,
                            payment_method: 'VNPAY',
                            created_at: new Date()
                        }
                    ]);

                if (billError) {
                    console.error("[IPN] Lỗi tạo hóa đơn lưu vào DB:", billError.message);
                } else {
                    console.log(`[IPN] Đã lưu hóa đơn thành công vào DB cho phiên ăn: ${session_id}`);
                }

                console.log(`[SUCCESS] Xử lý IPN hoàn tất cho session: ${session_id}`);
                return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
            }

            console.log("[IPN] Giao dịch thất bại từ phía VNPay (Mã không phải 00)");
            return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        } else {
            console.log("[IPN] Sai chữ ký SecureHash!");
            return res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' });
        }
    } catch (error) {
        console.error("[IPN] Lỗi sập hàm try-catch:", error.message);
        return res.status(500).json({ RspCode: '99', Message: error.message });
    }
};

export const createPaymentUrlRequest = async (req, res) => {
    try {
        const { session_id, amount } = req.body;

        if (!session_id || !amount) {
            return res.status(400).json({ success: false, message: "Thiếu session_id hoặc amount!" });
        }

        const paymentUrl = createVnPayUrl(req, session_id, amount);
        return res.status(200).json({ success: true, payment_url: paymentUrl });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};