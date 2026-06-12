import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';

import WelcomePage from './features/customer/WelcomePage'; // Import trang Chào mừng
import MenuPage from './features/customer/MenuPage';
import CartPage from './features/customer/CartPage'; 
import OrdersPage from './features/customer/OrdersPage';
import PaymentPage from './features/customer/PaymentPage';

import TableManager from './features/cashier/TableManager';

import KitchenOrders from './features/kitchen/KitchenOrders';

import AdminDashboard from './features/admin/AdminDashboard';
import RoleManagement from './features/admin/RoleManagement';
import DishManagement from './features/admin/DishManagement';
import RecipeDetail from './features/admin/RecipeDetail';
import IngredientManagement from './features/admin/IngredientManagement';
import PromotionNewsManagement from './features/admin/PromotionNewsManagement';


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

          {/* LƯỒNG THU NGÂN (PC) */}
          <Route path="/cashier" element={<TableManager />} />

          {/* LƯỒNG NHÀ BẾP (PC) */}
          <Route path="/kitchen" element={<KitchenOrders />} />

          {/* LƯỒNG ADMIN (PC) */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/role-management" element={<RoleManagement />} />
          <Route path="/admin/dish-management" element={<DishManagement />} />
          <Route path="/admin/recipe-detail" element={<RecipeDetail />} />
          <Route path="/admin/ingredient-management" element={<IngredientManagement />} />
          <Route path="/admin/promotion-management" element={<PromotionNewsManagement />} />

          {/* Đường dẫn mặc định nếu gõ sai: Tự động đá về trang Chào mừng (/) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;