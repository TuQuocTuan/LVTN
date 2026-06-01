import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from './components/layout/CustomerLayout';
import MenuPage from './features/customer/MenuPage';
import KitchenDashboard from './features/kitchen/KitchenDashboard';
import AdminDashboard from './features/admin/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* LƯỒNG KHÁCH HÀNG (Sử dụng CustomerLayout bọc ngoài) */}
        <Route path="/menu" element={<MenuPage />} />

        {/* LƯỒNG NHÀ BẾP (Giao diện full màn hình PC) */}
        <Route path="/kitchen" element={<KitchenDashboard />} />

        {/* LƯỒNG ADMIN (Giao diện full màn hình PC) */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Đường dẫn mặc định nếu gõ sai: Tự động đá về trang /menu */}
        <Route path="*" element={<Navigate to="/menu" replace />} />
      </Routes>
    </Router>
  );
}

export default App;