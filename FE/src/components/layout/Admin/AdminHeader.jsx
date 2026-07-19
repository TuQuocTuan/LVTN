import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminHeader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

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
      case 'super_admin': return 'Tổng Quản Lý';
      case 'admin': return 'Quản Lý Cơ Sở';
      default: return role;
    }
  };

  const handleLogoutSubmit = async () => {
    setIsLoggingOut(true);
    try {
      const savedUser = JSON.parse(localStorage.getItem('user')) || {};
      
      // Gọi API logout nếu cần
      if (import.meta.env.VITE_API_URL) {
        await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`, {
          user_id: savedUser.id || savedUser._id,
          username: savedUser.username || 'unknown'
        });
      }
    } catch (err) {
      console.error("Lỗi ghi nhận LOGOUT xuống server:", err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setShowLogoutConfirm(false);
      setIsLoggingOut(false);
      navigate('/login');
    }
  };

  return (
    <>
      <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-16rem)] h-16 bg-white border-b border-neutralCustom/15 z-40 flex items-center justify-between px-6 sm:px-8 shadow-sm transition-all duration-300">

        {/* Cụm thông tin tài khoản người dùng và Menu rủ xuống */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-3 pl-4 border-l border-neutralCustom/15 relative">
            <div className="text-right hidden sm:block select-none">
              <p className="text-sm font-bold leading-tight text-gray-950 truncate max-w-[150px]">{userInfo.fullname}</p>
              <p className="text-[10px] text-primary uppercase font-extrabold tracking-wider mt-1">{userInfo.role}</p>
            </div>

            {/* Nút Avatar tài khoản bo tròn cao cấp */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white border-2 border-white ring-2 ring-primary/25 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
              title="Tài khoản cá nhân"
            >
              <span className="material-symbols-outlined text-xl">person</span>
            </button>

            {/* Menu Dropdown điều khiển an toàn */}
            {isOpen && (
              <div className="absolute right-0 top-[120%] mt-1 w-48 bg-white border border-neutralCustom/15 rounded-xl shadow-xl py-1.5 z-50 flex flex-col animate-scale-up origin-top-right">
                <div className="px-4 py-2 border-b border-stone-100 sm:hidden">
                  <p className="text-xs font-bold text-gray-900 truncate">{userInfo.fullname}</p>
                  <p className="text-[9px] text-primary font-black uppercase mt-0.5">{userInfo.role}</p>
                </div>
                <button
                  onClick={() => { setIsOpen(false); setShowLogoutConfirm(true); }}
                  className="px-4 py-2.5 text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 text-left transition-colors w-full cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full border border-neutralCustom/10 text-center animate-scale-up">
            <div className="w-16 h-16 bg-orange-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100">
              <span className="material-symbols-outlined text-4xl">logout</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2">Đăng xuất</h3>
            <p className="text-xs sm:text-sm text-neutralCustom mb-6 leading-relaxed">
              Bạn có chắc chắn muốn kết thúc phiên làm việc hiện tại và đăng xuất khỏi hệ thống quản trị Làng MÌXI BBQ?
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
                className="w-1/2 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black text-xs sm:text-sm rounded-xl hover:opacity-95 shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                {isLoggingOut ? (
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                ) : (
                  'Đăng xuất'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminHeader;