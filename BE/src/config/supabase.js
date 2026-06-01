import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Nạp biến môi trường bằng đường dẫn tuyệt đối ngay khi file khởi chạy
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Lỗi: Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong file .env');
    process.exit(1);
}

// Khởi tạo và export instance dùng chung cho toàn bộ Backend
export const supabase = createClient(supabaseUrl, supabaseServiceKey);