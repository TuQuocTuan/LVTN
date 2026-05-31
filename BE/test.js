const supabase = require('./src/config/supabase');

async function testConnection() {
    console.log('🔄 Đang thử kết nối tới Supabase...');

    // Thử câu truy vấn đơn giản: Lấy danh sách từ bảng tables
    const { data, error } = await supabase
        .from('tables')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Kết nối thất bại! Lỗi từ Supabase:', error.message);
    } else {
        console.log('✅ Kết nối Supabase thành công chuẩn chỉnh!');
        console.log('Dữ liệu test nhận được:', data);
    }
}

testConnection();