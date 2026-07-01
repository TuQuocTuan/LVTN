import { supabase } from '../config/supabase';

/* Lắng nghe thay đổi từ Database (Dành cho Bếp) */
export const listenDatabaseChanges = (channelName, tableName, eventType, callback) => {
  const channel = supabase.channel(channelName)
    .on('postgres_changes', { event: eventType, schema: 'public', table: tableName }, callback)
    .subscribe();
  return channel; // Trả về channel để dọn dẹp khi tắt màn hình
};

/* Lắng nghe tin nhắn Broadcast (Dành cho Thu ngân) */
export const listenBroadcast = (channelName, eventName, callback) => {
  const channel = supabase.channel(channelName)
    .on('broadcast', { event: eventName }, callback)
    .subscribe();
  return channel;
};

/*  Mở kênh để Gửi tin nhắn Broadcast (Dành cho Khách hàng) */
export const initBroadcastChannel = (channelName) => {
  const channel = supabase.channel(channelName);
  channel.subscribe();
  return channel;
};