import { supabase } from '../config/supabase';

/**
 * Lắng nghe thay đổi trực tiếp từ Database (PostgreSQL Realtime)
 * Thích hợp dùng cho các phân hệ cần cập nhật dữ liệu tự động khi DB thay đổi:
 * - Nhà bếp: Lắng nghe đơn đặt món mới (INSERT trên bảng orders).
 * - Khách hàng: Lắng nghe trạng thái cập nhật món ăn (UPDATE trên bảng orders).
 * 
 * @param {string} channelName - Tên kênh kết nối tự đặt (ví dụ: 'kitchen-realtime', 'customer-orders-realtime')
 * @param {string} tableName - Tên bảng trong DB cần theo dõi (ví dụ: 'orders', 'tables')
 * @param {string} eventType - Loại sự kiện cần lắng nghe ('INSERT', 'UPDATE', 'DELETE' hoặc '*' cho tất cả)
 * @param {function} callback - Hàm xử lý được gọi khi có sự thay đổi dữ liệu từ DB
 * @returns {object} channel - Đối tượng subscription để dọn dẹp (cleanup) khi tắt màn hình
 */
export const listenDatabaseChanges = (channelName, tableName, eventType, callback) => {
  const channel = supabase.channel(channelName)
    .on('postgres_changes', { event: eventType, schema: 'public', table: tableName }, callback)
    .subscribe();
  return channel;
};

/**
 * Lắng nghe tin nhắn Broadcast gửi trực tiếp từ các Client khác (Realtime không qua lưu trữ DB)
 * Thích hợp cho Thu ngân nhận thông báo từ Khách hàng:
 * - Thu ngân: Lắng nghe sự kiện khách gọi phục vụ hoặc gọi thanh toán ('call_staff').
 * 
 * @param {string} channelName - Tên kênh Broadcast chung (ví dụ: 'restaurant-notifications')
 * @param {string} eventName - Tên sự kiện cụ thể (ví dụ: 'call_staff')
 * @param {function} callback - Hàm xử lý khi nhận được tin nhắn Broadcast
 * @returns {object} channel - Đối tượng subscription để dọn dẹp
 */
export const listenBroadcast = (channelName, eventName, callback) => {
  const channel = supabase.channel(channelName)
    .on('broadcast', { event: eventName }, callback)
    .subscribe();
  return channel;
};

/**
 * Khởi tạo và đăng ký kênh gửi tin nhắn Broadcast (Gửi thông điệp realtime đi)
 * Thích hợp cho Khách hàng khi cần gửi tín hiệu:
 * - Khách hàng: Mở kênh để phát tin nhắn gọi nhân viên, yêu cầu tính tiền đến Thu ngân.
 * 
 * @param {string} channelName - Tên kênh Broadcast chung cần kết nối (ví dụ: 'restaurant-notifications')
 * @returns {object} channel - Kênh đã đăng ký thành công, dùng channel.send(...) để phát tin nhắn
 */
export const initBroadcastChannel = (channelName) => {
  const channel = supabase.channel(channelName);
  channel.subscribe();
  return channel;
};