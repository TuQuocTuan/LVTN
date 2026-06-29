import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StaffHeader = ({ 
  title = "Tiêu đề trang", 
  subtitle = "Hệ thống quản lý", 
  notifications = [],
  onDismissNotification,
  onClearAllNotifications,
  defaultNotifyText = "gọi phục vụ!"
}) => {
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false); // Thêm state cho Profile
  const navigate = useNavigate();

  // State lưu thông tin user đang đăng nhập
  const [userInfo, setUserInfo] = useState({ fullname: 'Đang tải...', role: '' });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserInfo({
        fullname: user.fullname || user.username,
        role: formatRole(user.role)
      });
    }
  }, []);

  const formatRole = (role) => {
    switch (role?.toLowerCase()) {
      case 'cashier': return 'Thu Ngân';
      case 'chef': return 'Đầu Bếp';
      case 'admin': return 'Quản Lý';
      case 'super_admin': return 'Tổng Quản Lý';
      default: return role;
    }
  };

  const handleLogout = () => {
    if(window.confirm("Bạn có chắc chắn muốn kết thúc ca làm việc và đăng xuất?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <header className="flex justify-between items-center h-16 px-8 sticky top-0 z-40 bg-white border-b border-neutralCustom/20 shrink-0 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-primary">{title}</h1>
        <p className="text-sm text-neutralCustom opacity-70">{subtitle}</p>
      </div>
      
      <div className="flex items-center gap-6">
        
        {/* THÔNG BÁO */}
        <div className="flex items-center gap-4 relative">
          <button 
            onClick={() => { setShowNotiDropdown(!showNotiDropdown); setShowProfileDropdown(false); }}
            className={`hover:text-primary transition-colors relative p-1.5 rounded-full flex items-center justify-center ${showNotiDropdown ? 'text-primary bg-primary/10' : 'text-neutralCustom'}`}
          >
            <span className="material-symbols-outlined text-2xl">notifications</span>
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotiDropdown && (
            <div className="absolute -right-16 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-neutralCustom/20 py-3 z-50">
              <div className="flex justify-between items-center px-4 pb-2 border-b border-neutralCustom/10">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  Danh sách thông báo
                </h4>
                {notifications.length > 0 && (
                  <button onClick={onClearAllNotifications} className="text-xs text-primary hover:underline font-semibold">
                    Xóa tất cả
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto mt-2 px-2 space-y-1 custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="text-center py-8 text-sm text-neutralCustom opacity-60 flex flex-col items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-3xl opacity-40">notifications_off</span>
                        Không có thông báo mới
                    </div>
                ) : (
                    notifications.map((note, index) => {
                        const rawTableName = note.tableName || 'Bàn ẩn danh';
                        const hasCheckoutText = rawTableName.includes('Tính tiền');
                        const isCheckout = note.type === 'checkout' || note.action === 'checkout' || hasCheckoutText;
                        const isKitchenOrder = rawTableName.includes('Mã đơn') || note.type === 'new_order';
                        const cleanTableName = hasCheckoutText ? rawTableName.replace('(Tính tiền)', '').trim() : rawTableName;
                        const actionText = isCheckout ? 'vừa yêu cầu tính tiền!' : (note.message || defaultNotifyText);
                        const displayTitle = note.title || `${cleanTableName} ${actionText}`;

                        let iconName = 'notifications_active';
                        let iconColor = 'text-primary';
                        if (isCheckout) { iconName = 'receipt_long'; iconColor = 'text-green-600'; } 
                        else if (isKitchenOrder) { iconName = 'room_service'; iconColor = 'text-orange-500'; }

                        return (
                        <div key={index} className="flex justify-between items-start p-2.5 rounded-xl hover:bg-culinaryBg/60 transition-colors border-b border-gray-50 last:border-none">
                            <div className="flex gap-2.5">
                            <span className={`material-symbols-outlined text-xl mt-0.5 ${iconColor}`}>{iconName}</span>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{displayTitle}</p>
                                <p className="text-[11px] text-neutralCustom opacity-80 mt-0.5">{note.time || note.created_at || 'Vừa xong'}</p>
                            </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); onDismissNotification(index); }} className="text-neutralCustom hover:text-red-500 p-0.5 rounded-full hover:bg-gray-100 transition-colors">
                              <span className="material-symbols-outlined text-base">close</span>
                            </button>
                        </div>
                        );
                    })
                )}
              </div>
            </div>
          )}
        </div>

        {/* KHU VỰC NÚT ĐĂNG XUẤT */}
        <div className="flex items-center gap-3 pl-6 border-l border-neutralCustom/20 relative">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900 leading-none">{userInfo.fullname}</p>
            <p className="text-[10px] text-neutralCustom uppercase tracking-wider mt-1 font-semibold text-primary">{userInfo.role}</p>
          </div>
          
          <button 
            onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotiDropdown(false); }}
            className={`material-symbols-outlined transition-colors text-[32px] rounded-full ${showProfileDropdown ? 'text-primary' : 'text-neutralCustom hover:text-primary'}`}
          >
            account_circle
          </button>

          {/* Dropdown Menu Tài Khoản */}
          {showProfileDropdown && (
            <div className="absolute right-0 top-[120%] mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50 flex flex-col animate-fade-in">
              <button 
                className="px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 text-left transition-colors"
                onClick={handleLogout}
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default StaffHeader;