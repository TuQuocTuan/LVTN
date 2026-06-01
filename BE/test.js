const express = require('express');
const supabase = require('./src/config/supabase');

const app = express();
const PORT = 5000;

// API test cho điện thoại gọi vào
app.get('/api/test-qr', async (req, res) => {
    console.log('📱 [TÍN HIỆU]: Có điện thoại vừa quét QR và kết nối vào hệ thống!');

    // Thử bốc dữ liệu từ Supabase xem BE chạy mượt không
    const { data, error } = await supabase.from('tables').select('*').limit(1);

    if (error) {
        return res.status(500).json({ status: 'Lỗi kết nối Supabase', error: error.message });
    }

    // Trả kết quả về cho màn hình điện thoại hiển thị
    res.json({
        message: "Kết nối từ điện thoại tới Máy tính & Supabase THÀNH CÔNG!",
        database_test: data
    });
});

// Lắng nghe trên '0.0.0.0' để mở cửa cho điện thoại kết nối vào
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server test đang chạy! Cổng: ${PORT}`);
    console.log(`👉 Để test, hãy nhập URL này vào trình duyệt điện thoại:`);
    console.log(`http://<IP_MAY_TINH_CUA_BAN>:${PORT}/api/test-qr`);
});