import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import WelcomePage from '../features/customer/WelcomePage';
import MenuPage from '../features/customer/MenuPage';
import CartPage from '../features/customer/CartPage';
import OrdersPage from '../features/customer/OrdersPage';
import PaymentPage from '../features/customer/PaymentPage';
import CustomerReview from '../features/customer/CustomerReview';

import Login from '../features/auth/Login';
import TableManager from '../features/cashier/TableManager';
import KitchenOrders from '../features/kitchen/KitchenOrders';

import AdminDashboard from '../features/admin/AdminDashboard';
import RoleManagement from '../features/admin/RoleManagement';
import DishManagement from '../features/admin/DishManagement';
import RecipeManagement from '../features/admin/RecipeManagement';
import IngredientManagement from '../features/admin/IngredientManagement';
import PromotionManagement from '../features/admin/PromotionManagement';
import NewsManagement from '../features/admin/NewsManagement';
import ShiftManagement from '../features/admin/ShiftManagement';
import ReviewManagement from '../features/admin/ReviewManagement';

const ProtectedRoute = ({ children, allowedRoles, requiredPermission }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;

  try {
    if (userStr) user = JSON.parse(userStr);
  } catch (e) {
    console.error("Lỗi đọc thông tin user:", e);
  }

  // Nếu chưa đăng nhập, bắt buộc quay lại trang login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role?.toString().trim().toLowerCase();

  if (userRole === 'super_admin') return children;

  // Kiểm tra vai trò chính (allowedRoles)
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    alert("Tài khoản của bạn không có quyền truy cập vào trang này!");

    // Nếu là nhân sự nội bộ (admin, chef, cashier) cố tình truy cập link cấm, đẩy về dashboard nội bộ chứ không đẩy ra login
    if (['admin', 'chef', 'cashier'].includes(userRole)) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra quyền chi tiết (Permissions Checkbox)
  if (requiredPermission) {
    let userPermissions = {};
    try {
      if (typeof user.permissions === 'string') {
        userPermissions = JSON.parse(user.permissions || '{}');
      } else if (typeof user.permissions === 'object' && user.permissions !== null) {
        userPermissions = user.permissions;
      }
    } catch (e) {
      console.error("Lỗi đọc chi tiết quyền:", e);
    }

    // Nếu quyền tương ứng bị tắt (false hoặc không tồn tại), tiến hành chặn truy cập
    if (!userPermissions[requiredPermission]) {
      alert("Tài khoản của bạn không được cấp quyền sử dụng tính năng này!");
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
};

const CustomerRoute = ({ children }) => {
  const sessionId = localStorage.getItem('sessionId');

  // Nếu trong máy hoàn toàn không có sessionId -> Đuổi về trang Welcome bắt quét mã/ấn nút
  if (!sessionId) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<WelcomePage />} />
      <Route path="/menu" element={<CustomerRoute><MenuPage /></CustomerRoute>} />
      <Route path="/cart" element={<CustomerRoute><CartPage /></CustomerRoute>} />
      <Route path="/orders" element={<CustomerRoute><OrdersPage /></CustomerRoute>} />
      <Route path="/payment" element={<CustomerRoute><PaymentPage /></CustomerRoute>} />
      <Route path="/review" element={<CustomerRoute><CustomerReview /></CustomerRoute>} />

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

      {/* ĐỒNG BỘ PHÂN QUYỀN CHI TIẾT THEO CHECKBOX VÀ VAI TRÒ */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="view_reports">
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/admin/role-management" element={
        <ProtectedRoute allowedRoles={['super_admin']}>
          <RoleManagement />
        </ProtectedRoute>
      } />

      <Route path="/admin/dish-management" element={
        <ProtectedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="manage_menu">
          <DishManagement />
        </ProtectedRoute>
      } />

      <Route path="/admin/recipe-management/:dishId" element={
        <ProtectedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="view_recipes">
          <RecipeManagement />
        </ProtectedRoute>
      } />

      <Route path="/admin/ingredient-management" element={
        <ProtectedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="manage_ingredients">
          <IngredientManagement />
        </ProtectedRoute>
      } />

      <Route path="/admin/promotion-management" element={
        <ProtectedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="promotions">
          <PromotionManagement />
        </ProtectedRoute>
      } />

      <Route path="/admin/news-management" element={
        <ProtectedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="manage_news">
          <NewsManagement />
        </ProtectedRoute>
      } />

      <Route path="/admin/shift-management" element={
        <ProtectedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="manage_shift">
          <ShiftManagement />
        </ProtectedRoute>
      } />  

      <Route path="/admin/review-management" element={
        <ProtectedRoute allowedRoles={['admin', 'super_admin']} requiredPermission="manage_review">
          <ReviewManagement />
        </ProtectedRoute>
      } />  

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;