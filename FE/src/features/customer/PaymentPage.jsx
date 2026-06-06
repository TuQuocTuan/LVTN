import React, { useState } from 'react';
import CustomerLayout from '../../components/layout/Customer/CustomerLayout';

const PaymentPage = () => {
  // DỮ LIỆU GIẢ: Các món đã được bếp xác nhận và phục vụ (đã gọi thành công)
  const orderedItems = [
    { id: 1, name: 'Phở Bò Đặc Biệt', price: 85000, quantity: 1 },
    { id: 2, name: 'Bánh Mì Kẹp Thịt', price: 45000, quantity: 2 },
    { id: 3, name: 'Trà Sữa Trân Châu', price: 55000, quantity: 1 },
    { id: 4, name: 'Gỏi Cuốn tôm thịt', price: 45000, quantity: 1 },
  ];

  const [isCallingPayment, setIsCallingPayment] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentCalled, setPaymentCalled] = useState(false);

  // Tính toán tiền bạc
  const subtotal = orderedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // VAT 10%
  const total = subtotal + tax;

  const handleCallPayment = () => {
    setIsCallingPayment(true);
    // Giả lập gửi yêu cầu thanh toán xuống quầy (1.5s)
    setTimeout(() => {
      setIsCallingPayment(false);
      setPaymentCalled(true);
      setShowConfirm(false);
    }, 1500);
  };

  return (
    <CustomerLayout>
      <div className="px-4 py-6 pb-32">
        {/* Tiêu đề trang */}
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary text-3xl">receipt_long</span>
          <h2 className="text-xl font-bold text-gray-900">Tạm tính hóa đơn</h2>
        </div>

        {/* THÔNG TIN BÀN & TRẠNG THÁI */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-neutralCustom font-bold uppercase tracking-wider">Vị trí</p>
            <p className="text-lg font-bold text-gray-900">Bàn số 12</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutralCustom font-bold uppercase tracking-wider">Trạng thái</p>
            <span className={`text-sm font-bold ${paymentCalled ? 'text-green-600' : 'text-primary'}`}>
              {paymentCalled ? 'Đang chờ tính tiền...' : 'Đã phục vụ xong'}
            </span>
          </div>
        </div>

        {/* DANH SÁCH MÓN ĐÃ DÙNG */}
        <div className="space-y-4 mb-8">
          <p className="text-sm font-bold text-neutralCustom ml-1">Chi tiết món ăn</p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {orderedItems.map((item, index) => (
              <div key={item.id} className={`flex justify-between items-center p-4 ${index !== orderedItems.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex gap-3 items-center">
                  <span className="bg-orange-50 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    {item.quantity}
                  </span>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                    <p className="text-xs text-neutralCustom">{item.price.toLocaleString()}đ / món</p>
                  </div>
                </div>
                <p className="font-bold text-gray-900 text-sm">
                  {(item.price * item.quantity).toLocaleString()}đ
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* TỔNG KẾT TIỀN BẠC */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutralCustom">Tạm tính</span>
            <span className="font-bold text-gray-900">{subtotal.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutralCustom">Thuế VAT (10%)</span>
            <span className="font-bold text-gray-900">{tax.toLocaleString()}đ</span>
          </div>
          <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center">
            <span className="font-bold text-gray-900 text-lg">Tổng cộng</span>
            <span className="font-bold text-primary text-2xl">{total.toLocaleString()}đ</span>
          </div>
        </div>

        {/* NÚT GỌI THANH TOÁN (Cố định dưới cùng) */}
        <div className="fixed bottom-24 left-0 w-full px-4 bg-transparent">
          <button 
            onClick={() => !paymentCalled && setShowConfirm(true)}
            disabled={paymentCalled}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
              paymentCalled 
              ? 'bg-green-500 text-white cursor-default' 
              : 'bg-primary text-white shadow-primary/30 hover:bg-orange-800'
            }`}
          >
            <span className="material-symbols-outlined">
              {paymentCalled ? 'hourglass_top' : 'payments'}
            </span>
            {paymentCalled ? 'Đã gửi yêu cầu thanh toán' : 'Yêu cầu thanh toán'}
          </button>
        </div>

        {/* POPUP XÁC NHẬN THANH TOÁN */}
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isCallingPayment && setShowConfirm(false)}></div>
            <div className="relative bg-white w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-4xl">payments</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận thanh toán?</h3>
              <p className="text-sm text-neutralCustom mb-6">
                Nhân viên sẽ mang hóa đơn đến bàn và hỗ trợ bạn thanh toán.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 text-sm font-bold text-neutralCustom bg-gray-100 rounded-xl"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleCallPayment}
                  className="flex-1 py-3 text-sm font-bold text-white bg-primary rounded-xl flex items-center justify-center"
                >
                  {isCallingPayment ? 'Đang gửi...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LỜI CẢM ƠN PHỤ */}
        <p className="text-center text-xs text-neutralCustom mt-8 italic">
          Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi!
        </p>
      </div>
    </CustomerLayout>
  );
};

export default PaymentPage;