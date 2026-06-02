import crypto from 'crypto';
import axios from 'axios';

export const createMoMoPayment = async (req, res) => {
    try {
        const { session_id, tongtien } = req.body;

        if (!session_id || !tongtien) {
            return res.status(400).json({ success: false, message: 'Thiếu session_id hoặc tongtien!' });
        }

        const partnerCode = "MOMO";
        const accessKey = "P8yK0Pq7B2f7nK5m";
        const secretKey = "v0F8eC0w3mJ7zY9qX6kZ0w3e";
        const endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";
        const redirectUrl = "http://localhost:3000/payment-success";
        const ipnUrl = "https://state-bobbing-faculty.ngrok-free.dev/api/payments/momo-ipn"; // Đã sửa thừa dấu ;;

        const orderId = partnerCode + new Date().getTime();
        const requestId = orderId;
        const orderInfo = `Thanh toan don hang cho session ${session_id}`;

        // CẬP NHẬT: Đảm bảo số tiền luôn là số nguyên sạch sẽ
        const amount = Math.round(Number(tongtien)).toString();
        const requestType = "captureWallet";

        // CẬP NHẬT: Thay vì dùng JSON.stringify, truyền chuỗi text thuần túy để tránh lỗi ký tự đặc biệt
        const extraData = `session_id=${session_id}`;

        // Tạo chuỗi ký số theo quy định nghiêm ngặt của MoMo
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&requestId=${requestId}&redirectUrl=${redirectUrl}&requestType=${requestType}`;

        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = {
            partnerCode, requestId, orderId, orderInfo, amount,
            redirectUrl, ipnUrl, requestType, extraData, signature,
            lang: 'vi'
        };

        // Bắn dữ liệu sang MoMo Server
        const momoResponse = await axios.post(endpoint, requestBody);

        // Trả payUrl về cho Frontend chuyển hướng người dùng
        return res.json({
            success: true,
            payUrl: momoResponse.data.payUrl
        });

    } catch (error) {
        if (error.response) {
            console.log("MoMo Error Data:", error.response.data);
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. WEBHOOK IPN (MOMO TỰ ĐỘNG GỌI NGẦM ĐỂ CẬP NHẬT TRẠNG THÁI CLOSED)
export const momoIPNListener = async (req, res) => {
    try {
        const { resultCode, extraData } = req.body;

        if (resultCode === 0 && extraData) {
            // CẬP NHẬT: Tách chuỗi lấy giá trị session_id sau dấu "="
            const session_id = extraData.split('=')[1];

            // Tự động cập nhật trạng thái đóng bàn dưới Supabase
            const { error } = await supabase
                .from('dining_sessions')
                .update({
                    status: 'closed',
                    closed_at: new Date().toISOString(),
                    payment_method: 'momo'
                })
                .eq('id', session_id);

            if (error) throw error;
            console.log(`[MoMo] Đã tự động đóng bàn thành công cho session: ${session_id}`);
        }

        return res.status(204).send();

    } catch (error) {
        console.error('[MoMo IPN Error]:', error.message);
        return res.status(500).json({ error: error.message });
    }
};