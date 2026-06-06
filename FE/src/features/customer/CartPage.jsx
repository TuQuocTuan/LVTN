import React, { useState } from 'react';
import CustomerLayout from '../../components/layout/Customer/CustomerLayout';
import CartItem from '../../components/layout/Customer/CartItem';

// Mock data: Danh sách các món đang nằm trong giỏ hàng
const initialCart = [
  { id: 1, name: 'Phở Bò Đặc Biệt', price: 85000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCi6Sp5gavedt1DszkAFd4p8FaUmKDTO4Mz1Js392OJ3so-9UwwRXYR7H6XzXZ9-deVzQQ2DReZI8JlRJTxHj4Ip1Ai7QKGIyFtLVoE8sab4YFcw6Rr-Hkg7rO8nLEV3i_sEK_QtbuaBZ4TYjQvlFgQ6ZGq75J4KgHE80_P4YUQoY8l0BXS8vYOXUutoXFlYyJePLkta0FqXBYA8E6Q2lPnNxcluAf8U97ygIS0yOTb7YmdXAMwgZvOzWZvr8pXHW6iA37_zD7WBOs', quantity: 1, note: 'Không hành' },
  { id: 2, name: 'Bánh Mì Kẹp Thịt', price: 45000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCx1xvwqiz5k5LtsXiRt3iaiGRftvoL7yIFMVsIM8dy9hskZBtcIrUnLPpt9Ksm-dBcyuXuO5ITNZgHNz5Q7aLUFmXNbFWAo33erCgllSv2YQMjgrcgzu9qs0MHMJqSwXDiP1Uy5aTAGoSU4vRvB9rIBrJV7IYo0L7I5M68MTMTeLiGst9gIQebBAAMftFZEEgCzVs3kl50Mk_x1U8xZJSD_UpT1F9Q_ViV-MHYsLEKC5yZQDyR_0P1MPPJi94ahxu-7hHzvi3RUW0', quantity: 2, note: '' },
  { id: 3, name: 'Trà Sữa Trân Châu', price: 55000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCosiDF-ZJJQ8qhjqiQeZe3IbNSFvwfpUtXxuJQvKWBxhv9N0g_HTuWZS2gnaROUZlVOfmnXfiZgD66m1TOmT0SYAG2LZTWplymNEzajZnobdn0Pg7llA9IMe-tf7zlXSjo3Ctf__6xyjm2IwuitBvIXOFhhK6HnEYCGczig0AdSNP3veoYZCrwUjdpW_0upWGxmvGjWK0__DbwJ6yK6VmArWw7HxNXHlbKZazl1t0pr88rCqkJA9YR7ax-cifeTDx4HLZTg2D1pp0', quantity: 1, note: 'Ít đường, nhiều đá' },
];

const CartPage = () => {
  const [cartItems, setCartItems] = useState(initialCart);
  
  // State quản lý trạng thái của nút Đặt hàng ('idle': bình thường, 'loading': đang gửi, 'success': thành công)
  const [submitStatus, setSubmitStatus] = useState('idle'); 

  // --- CÁC HÀM XỬ LÝ SỐ LƯỢNG & DỮ LIỆU ---
  const handleIncrease = (id) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  };

  const handleDecrease = (id) => {
    setCartItems(prev => prev.map(item => item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item));
  };

  const handleRemove = (id) => {
    // Dùng filter để loại bỏ món ăn có ID trùng khớp ra khỏi mảng
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleNoteChange = (id, newNote) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, note: newNote } : item));
  };

  // --- LOGIC TÍNH TOÁN (Derived State) ---
  // Mỗi khi cartItems thay đổi, React sẽ tự động chạy lại các phép tính này
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const vat = subTotal * 0.1; // VAT 10%
  const finalTotal = subTotal + vat;

  // --- XỬ LÝ HIỆU ỨNG NÚT ĐẶT HÀNG ---
  const handleCheckout = () => {
    if (cartItems.length === 0) return; // Giỏ hàng trống thì không cho gửi
    
    setSubmitStatus('loading');
    
    // Giả lập gọi API mất 1.5 giây
    setTimeout(() => {
      setSubmitStatus('success');
      
      // Chờ 2 giây sau đó reset về ban đầu (thực tế bước này sẽ chuyển trang hoặc xóa giỏ hàng)
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 2000);
    }, 1500);
  };

  return (
    <CustomerLayout>
      {/* KHU VỰC 1: TIÊU ĐỀ GIỎ HÀNG */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Giỏ hàng của bạn</h2>
        <span className="text-xs font-bold text-neutralCustom bg-white border border-neutralCustom/20 px-3 py-1 rounded-full shadow-sm">
          {totalItems} Món
        </span>
      </div>

      {/* KHU VỰC 2: DANH SÁCH MÓN ĂN */}
      <div className="px-4 pb-48"> {/* Đẩy pb-48 để không bị phần tính tiền đè lên */}
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

      {/* KHU VỰC 3: PHẦN TÍNH TIỀN (Ghim dưới đáy, ngay trên thanh MenuNav) */}
      {/* bottom-16 chính là chiều cao của thanh BottomNav bên CustomerLayout */}
      <div className="fixed bottom-16 left-0 w-full bg-white/90 backdrop-blur-md px-4 pt-6 pb-4 border-t border-neutralCustom/20 z-40 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
        
        {/* Chi tiết tính tiền */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-neutralCustom">
            <span>Tạm tính</span>
            <span>{subTotal.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between text-sm text-neutralCustom">
            <span>Thuế VAT (10%)</span>
            <span>{vat.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-neutralCustom/20">
            <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
            <span className="text-xl font-bold text-primary">{finalTotal.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
        
        {/* Nút bấm (Call to Action) */}
        <button 
          onClick={handleCheckout}
          disabled={submitStatus !== 'idle' || cartItems.length === 0} // Khóa nút khi đang load hoặc giỏ hàng trống
          className={`w-full py-3.5 rounded-xl text-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg
            ${submitStatus === 'success' 
              ? 'bg-green-600 text-white shadow-green-600/30' 
              : 'bg-primary text-white shadow-primary/30'
            }
            ${cartItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {submitStatus === 'idle' && (
            <>
              <span className="material-symbols-outlined">restaurant_menu</span>
              Gửi yêu cầu nấu
            </>
          )}
          
          {submitStatus === 'loading' && (
            <>
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Đang gửi...
            </>
          )}
          
          {submitStatus === 'success' && (
            <>
              <span className="material-symbols-outlined">check_circle</span>
              Đã gửi thành công!
            </>
          )}
        </button>
      </div>
    </CustomerLayout>
  );
};

export default CartPage;