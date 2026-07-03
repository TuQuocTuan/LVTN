import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminHeader = ({ searchPlaceholder = "Tìm kiếm..." }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleLogout = async () => {
    // 🎯 1. Thêm async vào đây
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")) {
      try {
        // 2. Bốc thông tin user đang lưu trong máy ra trước khi xoá
        const savedUser = JSON.parse(localStorage.getItem('user')) || {};

        console.log("Dữ liệu chuẩn bị LOGOUT gửi lên BE:", savedUser);

        await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`, {
          user_id: savedUser.id || savedUser._id, // Đề phòng trường hợp dùng _id của MongoDB/Supabase tùy biến
          username: savedUser.username || 'unknown'
        });

        console.log("Đã gọi API logout thành công!");
      } catch (err) {
        console.error("Lỗi ghi nhận LOGOUT xuống server:", err);
      } finally {
        // 4. Cho dù API chạy thành công hay lỗi mạng, vẫn xoá sạch máy và đá user ra ngoài
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-white border-b border-neutralCustom/20 z-40 flex items-center justify-between px-8 shadow-sm">
      <div className="flex items-center gap-4 ml-auto">
        {/* Khung User */}
        <div className="flex items-center gap-3 pl-4 border-l border-neutralCustom/20 relative">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-bold leading-none text-gray-900">{userInfo.fullname}</p>
            <p className="text-[10px] text-neutralCustom uppercase tracking-widest mt-1 font-semibold text-primary">{userInfo.role}</p>
          </div>

          {/* Nút Avatar Icon */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white border-2 border-primary/20 hover:opacity-80 transition-opacity shadow-sm"
          >
            <span className="material-symbols-outlined">person</span>
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 top-[110%] mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50 flex flex-col animate-fade-in">
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

export default AdminHeader;