import React, { useState } from 'react';
import CustomerLayout from '../../components/layout/Customer/CustomerLayout';

// Mock data: Danh sách các đơn hàng ĐÃ GỬI
const mockOrders = [
  {
    orderId: '#DH-0812',
    time: '19:45',
    status: 'cooking', // Trạng thái: 'pending' (Chờ nhận), 'cooking' (Đang nấu), 'served' (Đã lên món)
    total: 253000,
    items: [
      { id: 1, name: 'Phở Bò Đặc Biệt', quantity: 1, note: 'Không hành' },
      { id: 2, name: 'Bánh Mì Kẹp Thịt', quantity: 2, note: '' },
      { id: 3, name: 'Trà Sữa Trân Châu', quantity: 1, note: 'Ít đường, nhiều đá' },
    ]
  },
  {
    orderId: '#DH-0811',
    time: '19:00',
    status: 'served',
    total: 45000,
    items: [
      { id: 4, name: 'Gỏi Cuốn', quantity: 1, note: '' },
    ]
  }
];

const OrdersPage = () => {
  // Thực tế sau này bạn sẽ dùng useEffect để call API lấy danh sách đơn hàng về
  const [orders, setOrders] = useState(mockOrders);

  // Hàm helper để render màu sắc và text trạng thái cho đẹp
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold uppercase">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            Chờ bếp nhận
          </span>
        );
      case 'cooking':
        return (
          <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase">
            <span className="material-symbols-outlined text-[14px] animate-spin">soup_kitchen</span>
            Đang nấu
          </span>
        );
      case 'served':
        return (
          <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase">
            <span className="material-symbols-outlined text-[14px]">done_all</span>
            Đã lên món
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
        <p className="text-sm text-neutralCustom mt-1">Theo dõi các món đã đặt tại đây</p>
      </div>

      <div className="px-4 pb-24 space-y-4">
        {orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.orderId} className="bg-white border border-neutralCustom/20 rounded-xl p-4 shadow-sm">
              
              {/* Header của Bill */}
              <div className="flex justify-between items-center border-b border-neutralCustom/10 pb-3 mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{order.orderId}</h3>
                  <span className="text-xs text-neutralCustom">Đặt lúc {order.time}</span>
                </div>
                {getStatusBadge(order.status)}
              </div>

              {/* Danh sách món trong Bill */}
              <div className="space-y-2 mb-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex gap-2">
                      <span className="font-semibold text-primary">{item.quantity}x</span>
                      <div>
                        <p className="text-gray-900">{item.name}</p>
                        {item.note && <p className="text-[11px] text-neutralCustom italic">- {item.note}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer của Bill (Tổng tiền) */}
              <div className="flex justify-between items-center bg-culinaryBg rounded-lg px-3 py-2">
                <span className="text-sm font-semibold text-gray-900">Tổng cộng:</span>
                <span className="font-bold text-primary">{order.total.toLocaleString('vi-VN')}đ</span>
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