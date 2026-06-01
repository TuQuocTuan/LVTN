import React from 'react';
// Import thêm useLocation từ react-router-dom
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

const CustomerLayout = ({ children }) => {
  const navigate = useNavigate(); // Hàm dùng để điều hướng bằng code
  const location = useLocation(); // Lấy thông tin URL hiện tại

  // Kiểm tra xem trình duyệt có đang ở trang /cart không
  const isCartActive = location.pathname === '/cart';

  return (
    <div className="bg-culinaryBg text-gray-900 min-h-screen pb-24 font-sans">

      {/* Header (Top Bar) */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 py-2 bg-white shadow-sm border-b border-neutralCustom/20 transition-all duration-200">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            restaurant
          </span>
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold text-primary">Bàn 12</h1>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
              <span className="text-[10px] font-bold text-neutralCustom tracking-wider uppercase">
                Đã kết nối
              </span>
            </div>
          </div>
        </div>
        
        {/* Nút Giỏ hàng: Đổi màu và in đậm khi đang ở trang /cart */}
        <button 
          onClick={() => navigate('/cart')}
          className={`relative transition-all duration-200 active:scale-95 p-2 rounded-full ${
            isCartActive ? 'bg-primary/10' : 'hover:bg-culinaryBg'
          }`}
        >
          <span 
            className={`material-symbols-outlined ${
              isCartActive ? 'text-primary' : 'text-neutralCustom'
            }`}
            style={isCartActive ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            shopping_cart
          </span>
          <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
            3
          </span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="pt-20">
        {children}
      </main>

      {/* Footer (Bottom Navigation) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-white rounded-t-xl border-t border-neutralCustom/20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-4">
        
        {/* Nút Thực Đơn -> trỏ tới /menu */}
        <NavLink 
          to="/menu" 
          className={({ isActive }) => `flex flex-col items-center justify-center h-full px-4 transition-all duration-200 active:scale-90 ${
            isActive ? 'text-primary font-bold border-t-2 border-primary' : 'text-neutralCustom hover:bg-culinaryBg'
          }`}
        >
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>menu_book</span>
              <span className="text-xs font-bold uppercase mt-1">Thực đơn</span>
            </>
          )}
        </NavLink>

        {/* Nút Đơn Hàng -> trỏ tới /orders */}
        <NavLink 
          to="/orders" 
          className={({ isActive }) => `flex flex-col items-center justify-center h-full px-4 transition-all duration-200 active:scale-90 ${
            isActive ? 'text-primary font-bold border-t-2 border-primary' : 'text-neutralCustom hover:bg-culinaryBg'
          }`}
        >
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>receipt_long</span>
              <span className="text-xs font-bold uppercase mt-1">Đơn hàng</span>
            </>
          )}
        </NavLink>

        {/* Nút Thanh Toán -> trỏ tới /payment */}
        <NavLink 
          to="/payment" 
          className={({ isActive }) => `flex flex-col items-center justify-center h-full px-4 transition-all duration-200 active:scale-90 ${
            isActive ? 'text-primary font-bold border-t-2 border-primary' : 'text-neutralCustom hover:bg-culinaryBg'
          }`}
        >
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>payments</span>
              <span className="text-xs font-bold uppercase mt-1">Thanh toán</span>
            </>
          )}
        </NavLink>

      </nav>
    </div>
  );
};

export default CustomerLayout;