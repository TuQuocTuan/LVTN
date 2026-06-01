import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './features/customer/MenuPage';
import CartPage from './features/customer/CartPage'; // Import trang Giỏ hàng
import KitchenDashboard from './features/kitchen/KitchenDashboard';
import AdminDashboard from './features/admin/AdminDashboard';
import OrdersPage from './features/customer/OrdersPage';

// Tạm tạo component rỗng cho Đơn hàng và Thanh toán để test chuyển trang không bị lỗi
const PaymentPage = () => <div className="p-20 text-center font-bold">Giao diện Trang Thanh Toán</div>;

function App() {
  return (
    <Router>
      <Routes>
        {/* ==============================
            LƯỒNG KHÁCH HÀNG (Mobile)
        ============================== */}
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />     {/* Route Giỏ hàng */}
        <Route path="/orders" element={<OrdersPage />} /> {/* Route Đơn hàng */}
        <Route path="/payment" element={<PaymentPage />} />{/* Route Thanh toán */}

        {/* ==============================
            LƯỒNG NHÀ BẾP (PC)
        ============================== */}
        <Route path="/kitchen" element={<KitchenDashboard />} />

        {/* ==============================
            LƯỒNG ADMIN (PC)
        ============================== */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Đường dẫn mặc định nếu gõ sai: Tự động đá về trang /menu */}
        <Route path="*" element={<Navigate to="/menu" replace />} />
      </Routes>
    </Router>
  );
}

export default App;