import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// --- IMPORT CÁC TRANG DÀNH CHO KHÁCH HÀNG ---
import WelcomePage from '../features/customer/WelcomePage'; 
import MenuPage from '../features/customer/MenuPage';
import CartPage from '../features/customer/CartPage'; 
import OrdersPage from '../features/customer/OrdersPage';
import PaymentPage from '../features/customer/PaymentPage';

// --- IMPORT TRANG ĐĂNG NHẬP & NỘI BỘ ---
import Login from '../features/auth/Login'; 
import TableManager from '../features/cashier/TableManager';
import KitchenOrders from '../features/kitchen/KitchenOrders';

import AdminDashboard from '../features/admin/AdminDashboard';
import RoleManagement from '../features/admin/RoleManagement';
import DishManagement from '../features/admin/DishManagement';
import RecipeManagement from '../features/admin/RecipeManagement';
import IngredientManagement from '../features/admin/IngredientManagement';
import PromotionNewsManagement from '../features/admin/PromotionNewsManagement';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;

  try {
    if (userStr) user = JSON.parse(userStr);
  } catch (e) {
    console.error("Lỗi đọc thông tin user:", e);
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role?.toLowerCase();
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    alert("Bạn không có quyền truy cập vào trang này!");
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<WelcomePage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/cart" element={<CartPage />} />     
      <Route path="/orders" element={<OrdersPage />} /> 
      <Route path="/payment" element={<PaymentPage />} />
      
      <Route path="/cashier" element={
        <ProtectedRoute allowedRoles={['cashier', 'admin', 'super_admin']}>
          <TableManager />
        </ProtectedRoute>
      } />

      <Route path="/kitchen" element={
        <ProtectedRoute allowedRoles={['chef', 'admin', 'super_admin']}>
          <KitchenOrders />
        </ProtectedRoute>
      } />

      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/role-management" element={<ProtectedRoute allowedRoles={['super_admin']}><RoleManagement /></ProtectedRoute>} />
      <Route path="/admin/dish-management" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><DishManagement /></ProtectedRoute>} />
      <Route path="/admin/recipe-management/:dishId" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><RecipeManagement /></ProtectedRoute>} />
      <Route path="/admin/ingredient-management" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><IngredientManagement /></ProtectedRoute>} />
      <Route path="/admin/promotion-management" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><PromotionNewsManagement /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;