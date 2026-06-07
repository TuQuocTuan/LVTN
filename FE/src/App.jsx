import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';

import WelcomePage from './features/customer/WelcomePage'; // Import trang Chào mừng
import MenuPage from './features/customer/MenuPage';
import CartPage from './features/customer/CartPage'; 
import OrdersPage from './features/customer/OrdersPage';
import PaymentPage from './features/customer/PaymentPage';

import AdminDashboard from './features/admin/AdminDashboard';
import KitchenOrders from './features/kitchen/KitchenOrders';

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>

          {/* LUỒNG KHÁCH HÀNG (Mobile) */}
          <Route path="/" element={<WelcomePage />} />
          
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />     
          <Route path="/orders" element={<OrdersPage />} /> 
          <Route path="/payment" element={<PaymentPage />} />

          {/* LƯỒNG NHÀ BẾP (PC) */}
          <Route path="/kitchen" element={<KitchenOrders />} />

          {/* LƯỒNG ADMIN (PC) */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Đường dẫn mặc định nếu gõ sai: Tự động đá về trang Chào mừng (/) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;