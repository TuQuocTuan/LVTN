import React, { useState, useEffect, useCallback } from 'react';
import CustomerLayout from '../../components/layout/Customer/CustomerLayout';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import { listenDatabaseChanges } from '../../utils/realtimeHelper';
import { supabase } from '../../config/supabase';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  const fetchOrders = useCallback(async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) return;

    try {
      // GỌI ĐÚNG API GET LẤY LỊCH SỬ ĐƠN HÀNG TỪ CONTROLLER getOrderBySession
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/orders/${sessionId}`);
      const data = response.data;

      if (data.success) {
        // Xử lý linh hoạt: backend có thể trả về 'detailed_orders' hoặc 'data'
        const orderList = data.detailed_orders || data.data || [];
        setOrders(orderList);
      }
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) return;

    // Lắng nghe thay đổi (INSERT, UPDATE, DELETE) liên quan đến session hiện tại từ bảng orders
    const channel = listenDatabaseChanges('customer-orders-realtime', 'orders', '*', (payload) => {
      const updatedSessionId = payload.new?.session_id || payload.old?.session_id;
      if (updatedSessionId && String(updatedSessionId) === String(sessionId)) {
        fetchOrders();
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  // LOGIC 3 TRẠNG THÁI (Sử dụng đúng bảng màu của bạn)
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 bg-tertiary/20 text-tertiary px-2 py-1 rounded text-[10px] font-bold uppercase">
            <span className="material-symbols-outlined text-[14px] animate-pulse">schedule</span>
            {t('statusPending')}
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-1 rounded text-[10px] font-bold uppercase">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            {t('statusCompleted')}
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 bg-neutralCustom/20 text-neutralCustom px-2 py-1 rounded text-[10px] font-bold uppercase">
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            {t('statusCancelled')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <CustomerLayout>
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-gray-900">{t('orderHistoryTitle')}</h2>
        <p className="text-sm text-neutralCustom mt-1">{t('orderHistorySub')}</p>
      </div>

      <div className="px-4 pb-24 space-y-4">
        {isLoading ? (
          <div className="text-center py-10 animate-pulse text-sm text-neutralCustom">{t('loadingOrders')}</div>
        ) : orders.length > 0 ? (
          orders.map((order, index) => (
            <div key={order.id} className="bg-white border border-neutralCustom/20 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-neutralCustom/10 pb-3 mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">
                    {t('orderNo')} #{index + 1} <span className="text-sm font-normal text-primary ml-1">#{String(order.id).slice(0, 4)}</span>
                  </h3>
                  <span className="text-xs text-neutralCustom">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="space-y-3 mb-4">
                {/* Đảm bảo vòng lặp kiểm tra order_details có tồn tại */}
                {order.order_details && order.order_details.map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <div className="flex justify-between text-sm">
                      <div className="flex gap-2">
                        <span className={`font-semibold ${order.status === 'cancelled' ? 'text-gray-400' : 'text-primary'}`}>
                          {item.quantity}x
                        </span>
                        <p className={order.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'}>
                          {/* Hỗ trợ trường hợp tên món nằm trong dishes hoặc trả thẳng tên */}
                          {item.dishes?.name || item.dishes || 'Món ăn'}
                        </p>
                      </div>
                      <span className="text-neutralCustom">{Number(item.price).toLocaleString('vi-VN')}đ</span>
                    </div>

                    {/* KIỂM TRA VÀ HIỂN THỊ GHI CHÚ (NOTE) TẠI ĐÂY */}
                    {item.note && (
                      <p className="text-xs text-neutralCustom/80 italic pl-6 mt-0.5">
                        * {t('noteLabel')}: {item.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center bg-culinaryBg rounded-lg px-3 py-2">
                <span className="text-sm font-semibold text-gray-900">{t('total')}:</span>
                <span className={`font-bold ${order.status === 'cancelled' ? 'text-gray-400' : 'text-primary'}`}>
                  {Number(order.sub_total).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-6xl text-neutralCustom/50 mb-2">receipt_long</span>
            <p className="text-neutralCustom font-semibold">{t('emptyOrders')}</p>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default OrdersPage;