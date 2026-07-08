import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const AdminSidebar = ({ currentTab }) => {
  const [userRole, setUserRole] = useState('');
  const [userPermissions, setUserPermissions] = useState({});

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role?.toString().trim().toLowerCase());

        let perms = {};
        if (typeof user.permissions === 'string') {
          perms = JSON.parse(user.permissions);
        } else if (typeof user.permissions === 'object' && user.permissions !== null) {
          perms = user.permissions;
        }
        setUserPermissions(perms);
      } catch (e) {
        console.error("Lỗi parse thông tin user trong sidebar", e);
      }
    }
  }, []);

  // Cấu hình danh sách menu có ánh xạ mã quyền chi tiết (permissionKey)
  const menuItems = [
    { id: 'dashboard', label: 'Thống kê doanh thu', icon: 'bar_chart', path: '/admin/dashboard', permissionKey: 'view_reports' },
    { id: 'inventory', label: 'Quản lý nguyên vật liệu', icon: 'inventory', path: '/admin/ingredient-management', permissionKey: 'manage_ingredients' },
    { id: 'dish', label: 'Quản lý món ăn', icon: 'restaurant_menu', path: '/admin/dish-management', permissionKey: 'manage_menu' },
    { id: 'user', label: 'Quản lý nhân sự', icon: 'manage_accounts', path: '/admin/role-management', requiredRole: 'super_admin' },
    { id: 'promotion', label: 'Quản lý ưu đãi', icon: 'campaign', path: '/admin/promotion-management', permissionKey: 'promotions' },
    { id: 'news', label: 'Quản lý tin tức', icon: 'news', path: '/admin/news-management', permissionKey: 'manage_news' },
    { id: 'shift', label: 'Quản lý lịch làm', icon: 'shift', path: '/admin/shift-management', permissionKey: 'manage_shift' },
    { id: 'review', label: 'Quản lý đánh giá khách hàng', icon: 'comment', path: '/admin/review-management', permissionKey: 'manage_review' },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-white border-r border-neutralCustom/20 shadow-sm flex flex-col p-4 gap-2 z-50">
      <div className="mb-8 px-2">
        <h1 className="text-3xl font-bold text-primary">Làng MÌXI</h1>
        <p className="text-neutralCustom text-sm">Quản trị hệ thống</p>
      </div>

      <nav className="flex flex-col gap-2 flex-grow">
        {menuItems.map((item) => {
          // Kiểm tra vai trò bắt buộc (vd: trang quản lý nhân sự chỉ super_admin mới thấy)
          if (item.requiredRole && item.requiredRole !== userRole) {
            return null;
          }

          // Kiểm tra phân quyền chi tiết (Nếu không phải super_admin thì bắt buộc phải có key quyền hoạt động)
          if (userRole !== 'super_admin' && item.permissionKey && !userPermissions[item.permissionKey]) {
            return null;
          }

          const isActive = currentTab === item.id;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all active:scale-95 ${isActive
                  ? 'bg-primary/10 text-primary border-r-4 border-primary font-bold shadow-sm'
                  : 'text-neutralCustom hover:bg-culinaryBg'
                }`}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="font-semibold text-base">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;