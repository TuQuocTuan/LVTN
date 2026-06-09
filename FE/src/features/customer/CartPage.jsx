import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerLayout from '../../components/layout/Customer/CustomerLayout';
import CartItem from '../../components/layout/Customer/CartItem';
import { useCart } from '../../context/CartContext'; // Import chìa khóa lấy kho chung

const CartPage = () => {
  const navigate = useNavigate();

  // Bốc toàn bộ dữ liệu giỏ hàng sống từ kho chung ra dùng
  const {
    cartItems,
    totalItems,
    handleIncrease,
    handleDecrease,
    handleRemove,
    handleNoteChange,
    clearCart
  } = useCart();

  const [submitStatus, setSubmitStatus] = useState('idle');

  // Tính tiền tự động thời gian thực dựa trên các món có trong giỏ
  const subTotal = cartItems.reduce((total, item) => total + (item.rawPrice * item.quantity), 0);
  const vat = subTotal * 0.1;
  const finalTotal = subTotal + vat;

  // Gọi API lưu Order vào database của nhà hàng
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    try {
      setSubmitStatus('loading');
      const sessionId = localStorage.getItem('sessionId');
      const creatorId = localStorage.getItem('creatorId');

      if (!sessionId) {
        alert("Lỗi: Không tìm thấy phiên ăn. Vui lòng quét lại mã QR!");
        setSubmitStatus('idle');
        return;
      }

      // Khớp cấu trúc mảng mà orderController backend yêu cầu (dish_id, quantity, price)
      const itemsToOrder = cartItems.map(item => ({
        dish_id: item.id,
        quantity: item.quantity,
        price: item.rawPrice,
        note: item.note || null
      }));

      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          customer_id: creatorId,
          items: itemsToOrder
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus('success');
        setTimeout(() => {
          clearCart(); // Đặt món xong thì dọn sạch giỏ hàng trống trải
          setSubmitStatus('idle');
          navigate('/orders'); // Chuyển hướng qua trang xem tạm tính hóa đơn
        }, 1500);
      } else {
        alert("Đặt món thất bại: " + data.message);
        setSubmitStatus('idle');
      }
    } catch (error) {
      console.error("Lỗi hệ thống:", error);
      alert("Không thể kết nối đến máy chủ nhà bếp!");
      setSubmitStatus('idle');
    }
  };

  return (
    <CustomerLayout>
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Giỏ hàng của bạn</h2>
        <span className="text-xs font-bold text-neutralCustom bg-white border border-neutralCustom/20 px-3 py-1 rounded-full shadow-sm">
          {totalItems} Món
        </span>
      </div>

      <div className="px-4 pb-48">
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              onRemove={handleRemove}
              onNoteChange={handleNoteChange}
            />
          ))
        ) : (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-6xl text-neutralCustom/50 mb-2">production_quantity_limits</span>
            <p className="text-neutralCustom font-semibold">Giỏ hàng của bạn đang trống</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-0 w-full bg-white/90 backdrop-blur-md px-4 pt-6 pb-4 border-t border-neutralCustom/20 z-40 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-neutralCustom"><span>Tạm tính</span><span>{subTotal.toLocaleString('vi-VN')}đ</span></div>
          <div className="flex justify-between text-sm text-neutralCustom"><span>Thuế VAT (10%)</span><span>{vat.toLocaleString('vi-VN')}đ</span></div>
          <div className="flex justify-between items-center pt-2 border-t border-neutralCustom/20">
            <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
            <span className="text-xl font-bold text-primary">{finalTotal.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={submitStatus !== 'idle' || cartItems.length === 0}
          className={`w-full py-3.5 rounded-xl text-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg
            ${submitStatus === 'success' ? 'bg-green-600 text-white shadow-green-600/30' : 'bg-primary text-white shadow-primary/30'}
            ${cartItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {submitStatus === 'idle' && <><span className="material-symbols-outlined">restaurant_menu</span>Gửi yêu cầu nấu</>}
          {submitStatus === 'loading' && <><span className="material-symbols-outlined animate-spin">progress_activity</span>Đang gửi...</>}
          {submitStatus === 'success' && <><span className="material-symbols-outlined">check_circle</span>Đã gửi thành công!</>}
        </button>
      </div>
    </CustomerLayout>
  );
};

export default CartPage;