import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- LUỒNG KHÁCH HÀNG ---
import WelcomePage from './features/customer/WelcomePage'; // Import trang Chào mừng
import MenuPage from './features/customer/MenuPage';
import CartPage from './features/customer/CartPage'; 
import OrdersPage from './features/customer/OrdersPage';
import PaymentPage from './features/customer/PaymentPage';

// --- LUỒNG BẾP & ADMIN ---
import KitchenDashboard from './features/kitchen/KitchenDashboard';
import AdminDashboard from './features/admin/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* ==============================
            LƯỒNG KHÁCH HÀNG (Mobile)
        ============================== */}
        {/* Trang đầu tiên xuất hiện khi vào web */}
        <Route path="/" element={<WelcomePage />} />
        
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />     
        <Route path="/orders" element={<OrdersPage />} /> 
        <Route path="/payment" element={<PaymentPage />} />

        {/* ==============================
            LƯỒNG NHÀ BẾP (PC)
        ============================== */}
        <Route path="/kitchen" element={<KitchenDashboard />} />

        {/* ==============================
            LƯỒNG ADMIN (PC)
        ============================== */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Đường dẫn mặc định nếu gõ sai: Tự động đá về trang Chào mừng (/) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;