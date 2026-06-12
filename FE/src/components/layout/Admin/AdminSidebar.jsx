import React from 'react';
import { Link } from 'react-router-dom';

const AdminSidebar = ({ currentTab }) => {
  // Cấu hình danh sách menu để dễ quản lý và render bằng vòng lặp .map
  const menuItems = [
    { id: 'dashboard', label: 'Thống kê doanh thu', icon: 'bar_chart', path: '/admin/dashboard' },
    { id: 'inventory', label: 'Quản lý nguyên vật liệu', icon: 'inventory', path: '/admin/ingredient-management' },
    { id: 'dish', label: 'Quản lý món ăn', icon: 'restaurant_menu', path: '/admin/dish-management' },
    { id: 'user', label: 'Quản lý nhân sự', icon: 'manage_accounts', path: '/admin/role-management' },
    { id: 'promotion', label: 'Ưu đãi & Tin tức', icon: 'campaign', path: '/admin/promotion-management' },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-white border-r border-neutralCustom/20 shadow-sm flex flex-col p-4 gap-2 z-50">
      <div className="mb-8 px-2">
        <h1 className="text-3xl font-bold text-primary">Làng MÌXI</h1>
        <p className="text-neutralCustom text-sm">Quản trị hệ thống</p>
      </div>
      
      <nav className="flex flex-col gap-2 flex-grow">
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all active:scale-95 ${
                isActive 
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