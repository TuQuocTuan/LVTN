//Khởi tạo và cấu hình kết nối Supabase Client
//===========================================


const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Đọc file .env bằng đường dẫn tuyệt đối tính từ thư mục chạy lệnh (C:\Hoc\LVTN\BE)
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Lỗi: Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong file .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;