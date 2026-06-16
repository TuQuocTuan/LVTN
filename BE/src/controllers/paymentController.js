import qs from 'qs';
import crypto from 'crypto';
import moment from 'moment-timezone';

// Hàm helper mã hóa chuẩn viết hoa ký tự đặc biệt của VNPay (Dùng chung cho cả tạo link và IPN)
const vnpEncode = (str) => {
    return encodeURIComponent(str)
        .replace(/%20/g, '+') // VNPay bắt buộc khoảng trắng trong chuỗi hash phải là dấu +
        .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
};

// 1. Hàm tạo link thanh toán VNPay
export const createVnPayUrl = (req, session_id, amount) => {
    let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
        ipAddr = '127.0.0.1';
    }

    // 🎯 ĐÃ ĐỒNG BỘ: Điền chính xác thông tin từ Email của bạn
    const tmnCode = 'HFZO9WRM';
    const secretKey = 'HXWPBBC8GOHC2CWLRJUYV0L2O51IUIOI';
    const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:5173/payment-return';

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
        'vnp_Amount': amount * 100,
        'vnp_ReturnUrl': returnUrl,
        'vnp_IpAddr': ipAddr,
        'vnp_CreateDate': createDate
    };

    // Sắp xếp tham số theo alphabet
    vnp_Params = Object.keys(vnp_Params)
        .sort()
        .reduce((obj, key) => {
            obj[key] = vnp_Params[key];
            return obj;
        }, {});

    // Tự nối chuỗi signData để tạo mã băm
    const signData = Object.entries(vnp_Params)
        .map(([key, val]) => `${encodeURIComponent(key)}=${vnpEncode(val)}`)
        .join('&');

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    vnp_Params['vnp_SecureHash'] = signed;

    // Ghép thành chuỗi URL hoàn chỉnh
    const linkParams = Object.entries(vnp_Params)
        .map(([key, val]) => `${encodeURIComponent(key)}=${vnpEncode(val)}`)
        .join('&');

    return `${vnpUrl}?${linkParams}`;
};


// 2. Hàm IPN hứng và xác thực kết quả thanh toán ngầm từ VNPay
export const vnpayIPN = async (req, res) => {
    try {

        let vnp_Params = req.query;
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        // Sắp xếp tham số theo alphabet
        vnp_Params = Object.keys(vnp_Params)
            .sort()
            .reduce((obj, key) => {
                obj[key] = vnp_Params[key];
                return obj;
            }, {});

        // 🎯 ĐÃ ĐỒNG BỘ: Dùng đúng mã secretKey từ email
        const secretKey = 'HXWPBBC8GOHC2CWLRJUYV0L2O51IUIOI';

        // 🎯 ĐÃ ĐỒNG BỘ: Sử dụng cùng hàm vnpEncode ghép chuỗi đối chiếu giống hàm tạo link
        const signData = Object.entries(vnp_Params)
            .map(([key, val]) => `${encodeURIComponent(key)}=${vnpEncode(val)}`)
            .join('&');

        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        if (secureHash === signed) {
            const responseCode = vnp_Params['vnp_ResponseCode'];
            const txnRef = vnp_Params['vnp_TxnRef'];
            const session_id = txnRef.split('_')[0];

            if (responseCode === '00') {
                // 🎯 KÉO LOGIC UPDATE DATABASE QUA ĐÂY:
                // 1. Chuyển status của dining_sessions thành 'closed'
                // 2. Insert dữ liệu vào bảng bills thành công

                console.log(`Thanh toan thanh cong cho session: ${session_id}`);
                return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
            } else {
                console.log(`Giao dich that bai hoặc bi huy: ${responseCode}`);
                return res.status(200).json({ RspCode: '01', Message: 'Payment Failed' });
            }
        } else {
            console.log("Lỗi: Không trùng khớp chữ ký SecureHash!");
            return res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' });
        }
    } catch (error) {
        return res.status(500).json({ RspCode: '99', Message: error.message });
    }
};


// 3. Request API phụ trợ tạo Url độc lập
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