import React, { useState, useEffect } from 'react';
import CustomerLayout from '../../components/layout/Customer/CustomerLayout';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) return;

      try {
        //const response = await fetch(`http://localhost:5000/api/orders?session_id=${sessionId}`);
        const response = await fetch('http://localhost:5000/api/orders/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                is_preview: true // Backend vẫn trả về object chứa toàn bộ chi tiết đơn hàng
            })
        });
        const data = await response.json();
        
        if (data.success && data.detailed_orders) {
          setOrders(data.detailed_orders);
        }
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // LOGIC 3 TRẠNG THÁI MỚI
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold uppercase">
            <span className="material-symbols-outlined text-[14px] animate-pulse">schedule</span>
            Đang chế biến
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Đã xuất món
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold uppercase">
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            Món bị hủy
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <CustomerLayout>
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-gray-900">Đơn hàng của bạn</h2>
        <p className="text-sm text-neutralCustom mt-1">Theo dõi tiến độ các món đã đặt</p>
      </div>

      <div className="px-4 pb-24 space-y-4">
        {isLoading ? (
          <div className="text-center py-10 animate-pulse text-sm text-neutralCustom">Đang tải đơn hàng...</div>
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className={`bg-white border rounded-xl p-4 shadow-sm ${order.status === 'cancelled' ? 'border-red-200' : 'border-neutralCustom/20'}`}>
              <div className="flex justify-between items-center border-b border-neutralCustom/10 pb-3 mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">Đơn #{String(order.id).slice(-4)}</h3>
                  <span className="text-xs text-neutralCustom">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="space-y-2 mb-4">
                {order.order_details.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div className="flex gap-2">
                      <span className={`font-semibold ${order.status === 'cancelled' ? 'text-gray-400' : 'text-primary'}`}>{item.quantity}x</span>
                      <p className={order.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'}>{item.dishes}</p>
                    </div>
                    <span className="text-neutralCustom">{item.price.toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center bg-culinaryBg rounded-lg px-3 py-2">
                <span className="text-sm font-semibold text-gray-900">Tổng cộng:</span>
                <span className={`font-bold ${order.status === 'cancelled' ? 'text-gray-400' : 'text-primary'}`}>
                  {order.sub_total.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-6xl text-neutralCustom/50 mb-2">receipt_long</span>
            <p className="text-neutralCustom font-semibold">Bạn chưa có đơn hàng nào</p>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default OrdersPage;