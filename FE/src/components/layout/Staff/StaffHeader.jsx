import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StaffHeader = ({
  title = "Tiêu đề trang",
  subtitle = "Hệ thống quản lý",
  notifications = [],
  onDismissNotification,
  onClearAllNotifications,
  defaultNotifyText = "gọi phục vụ!"
}) => {
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // Trạng thái xác nhận tắt ca / logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState({ fullname: 'Đang tải...', role: '' });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role?.toLowerCase() || '');
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

  const handleLogoutSubmit = async () => {
    setIsLoggingOut(true);
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};

      console.log("👉 Dữ liệu chuẩn bị LOGOUT gửi lên BE:", userObj);
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        user_id: userObj.id || userObj._id,
        username: userObj.username || 'unknown'
      });
      console.log("✅ Đã gọi API logout thành công!");
    } catch (err) {
      console.error("❌ Lỗi ghi nhận LOGOUT xuống server:", err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setShowLogoutConfirm(false);
      setIsLoggingOut(false);
      navigate('/login');
    }
  };

  return (
    <header className="flex justify-between items-center h-16 px-6 sm:px-8 sticky top-0 z-40 bg-white border-b border-neutralCustom/15 shrink-0 shadow-sm transition-all duration-300">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-primary tracking-tight leading-none">{title}</h1>
        <p className="text-[11px] sm:text-xs text-neutralCustom font-semibold mt-1 opacity-80">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">

        {/* THÔNG BÁO CHỜ CHẾ BIẾN/THANH TOÁN (STAY ALIGNED ON LAPTOPS) */}
        <div className="flex items-center gap-4 relative">
          <button
            onClick={() => { setShowNotiDropdown(!showNotiDropdown); setShowProfileDropdown(false); }}
            className={`hover:text-primary transition-all duration-200 relative p-2 rounded-full flex items-center justify-center cursor-pointer ${showNotiDropdown ? 'text-primary bg-primary/10' : 'text-neutralCustom hover:bg-stone-50'}`}
            title="Thông báo hệ thống"
          >
            <span className="material-symbols-outlined text-2xl">notifications</span>
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm border-2 border-white animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Hộp thoại danh sách thông báo rủ xuống trên Laptop */}
          {showNotiDropdown && (
            <div className="absolute -right-16 top-[120%] mt-1 w-80 bg-white rounded-2xl shadow-xl border border-neutralCustom/15 py-3 z-50 animate-scale-up origin-top-right">
              <div className="flex justify-between items-center px-4 pb-2 border-b border-stone-100">
                <h4 className="font-bold text-gray-950 text-xs sm:text-sm flex items-center gap-1.5">
                  Danh sách thông báo
                </h4>
                {notifications.length > 0 && (
                  <button onClick={onClearAllNotifications} className="text-xs text-primary hover:underline font-bold cursor-pointer">
                    Xóa tất cả
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto mt-2 px-2 space-y-1 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-xs text-neutralCustom opacity-60 flex flex-col items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-3xl opacity-40">notifications_off</span>
                    <span>Không có thông báo mới</span>
                  </div>
                ) : (
                  notifications.map((note, index) => {
                    const rawTableName = note.tableName || 'Bàn ẩn danh';
                    const hasCheckoutText = rawTableName.includes('Tính tiền');
                    const isCheckout = note.type === 'checkout' || note.action === 'checkout' || hasCheckoutText;
                    const isKitchenOrder = rawTableName.includes('Mã đơn') || note.type === 'new_order';
                    const cleanTableName = hasCheckoutText ? rawTableName.replace('(Tính tiền)', '').trim() : rawTableName;
                    const actionText = isCheckout ? 'yêu cầu tính tiền' : (note.message || defaultNotifyText);
                    const displayTitle = note.title || `${cleanTableName} ${actionText}`;

                    let iconName = 'notifications_active';
                    let iconColor = 'text-primary bg-primary/10';
                    if (isCheckout) { iconName = 'receipt_long'; iconColor = 'text-green-600 bg-green-50'; }
                    else if (isKitchenOrder) { iconName = 'room_service'; iconColor = 'text-orange-500 bg-orange-50'; }

                    return (
                      <div key={index} className="flex justify-between items-start p-2.5 rounded-xl hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-none">
                        <div className="flex gap-2.5">
                          <span className={`material-symbols-outlined text-lg p-1.5 rounded-lg shrink-0 ${iconColor}`}>{iconName}</span>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-gray-950 leading-tight">{displayTitle}</p>
                            <p className="text-[10px] text-neutralCustom opacity-80 mt-1 font-mono">{note.time || note.created_at || 'Vừa xong'}</p>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDismissNotification(index); }} className="text-neutralCustom hover:text-red-500 p-0.5 rounded-full hover:bg-stone-100 transition-colors shrink-0 cursor-pointer">
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

        {/* TÀI KHOẢN NHÂN SỰ & MENU PHỤ */}
        <div className="flex items-center gap-3 pl-4 sm:pl-6 border-l border-neutralCustom/15 relative">
          <div className="text-right select-none hidden sm:block">
            <p className="text-xs sm:text-sm font-bold leading-none text-gray-950 truncate max-w-[120px]">{userInfo.fullname}</p>
            <p className="text-[10px] text-primary uppercase font-extrabold tracking-wider mt-1">{userInfo.role}</p>
          </div>

          <button
            onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotiDropdown(false); }}
            className={`material-symbols-outlined transition-all text-[32px] rounded-full hover:scale-105 cursor-pointer ${showProfileDropdown ? 'text-primary' : 'text-neutralCustom hover:text-primary'}`}
          >
            account_circle
          </button>

          {/* Dropdown Menu Tài Khoản nhân sự */}
          {showProfileDropdown && (
            <div className="absolute right-0 top-[120%] mt-1 w-48 bg-white border border-neutralCustom/15 rounded-xl shadow-xl py-1.5 z-50 flex flex-col animate-scale-up origin-top-right">
              <div className="px-4 py-2 border-b border-stone-100 sm:hidden">
                <p className="text-xs font-bold text-gray-950 truncate">{userInfo.fullname}</p>
                <p className="text-[9px] text-primary font-black uppercase mt-0.5">{userInfo.role}</p>
              </div>
              <button
                onClick={() => { setShowProfileDropdown(false); setShowLogoutConfirm(true); }}
                className="px-4 py-2.5 text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 text-left transition-colors w-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full border border-neutralCustom/10 text-center animate-scale-up">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 animate-pulse">
              <span className="material-symbols-outlined text-4xl">work_history</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2">
              {userRole === 'cashier' ? 'Kết thúc ca làm việc?' : 'Đăng xuất'}
            </h3>
            <p className="text-xs sm:text-sm text-neutralCustom mb-6 leading-relaxed">
              {userRole === 'cashier'
                ? 'Hệ thống sẽ đồng bộ và tổng hợp thời gian hoạt động của ca làm hiện tại của bạn. Xác nhận hoàn ca?'
                : 'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng nghiệp vụ Làng MÌXI BBQ?'}
            </p>
            <div className="flex gap-3">
              <button
                disabled={isLoggingOut}
                onClick={() => setShowLogoutConfirm(false)}
                className="w-1/2 py-3 border border-neutralCustom/20 text-neutralCustom bg-white font-bold text-xs sm:text-sm rounded-xl hover:bg-stone-50 active:scale-95 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                disabled={isLoggingOut}
                onClick={handleLogoutSubmit}
                className="w-1/2 py-3 bg-red-500 text-white font-black text-xs sm:text-sm rounded-xl hover:bg-red-600 shadow-md shadow-red-500/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                {isLoggingOut ? (
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                ) : (
                  'Xác nhận'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default StaffHeader;