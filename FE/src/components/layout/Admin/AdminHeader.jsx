import React, { useState } from 'react';

const AdminHeader = ({ userName = "Admin User", userRole = "Quản lý" }) => {
  // State để quản lý việc ẩn/hiện menu dropdown
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-white border-b border-neutralCustom/20 z-40 flex items-center justify-end px-8 shadow-sm">
      <div className="flex items-center gap-4">
        
        {/* Nút thông báo */}
        <button className="p-2 rounded-full text-neutralCustom hover:text-primary transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Khung User có thêm relative để căn chỉnh dropdown bên trong */}
        <div className="flex items-center gap-3 pl-4 border-l border-neutralCustom/20 relative">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-bold leading-none text-gray-900">{userName}</p>
            <p className="text-[10px] text-neutralCustom uppercase tracking-widest mt-1">{userRole}</p>
          </div>
          
          {/* Nút Avatar Icon */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white border-2 border-primary/20 hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined">person</span>
          </button>

          {/* Dropdown Menu (Chỉ hiện khi isOpen === true) */}
          {isOpen && (
            <div className="absolute right-0 top-[110%] mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg py-2 z-50 flex flex-col">
              <button 
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-left transition-colors"
                onClick={() => {
                  console.log("Chuyển đến trang cá nhân");
                  setIsOpen(false);
                }}
              >
                <span className="material-symbols-outlined text-[18px]">account_circle</span>
                Thông tin cá nhân
              </button>
              
              <hr className="my-1 border-gray-100" />
              
              <button 
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 text-left transition-colors"
                onClick={() => {
                  console.log("Xử lý đăng xuất");
                  setIsOpen(false);
                }}
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