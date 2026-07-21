import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  const [userPermissions, setUserPermissions] = useState({});
  const navigate = useNavigate();

  // States để lưu dữ liệu kết ca từ API
  const [shiftReportData, setShiftReportData] = useState(null);
  const [ketCaTime, setKetCaTime] = useState('');
  const [alertModal, setAlertModal] = useState({ show: false, title: 'Thông báo', message: '', type: 'error' });

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

      let perms = {};
      if (typeof user.permissions === 'string') {
        try {
          perms = JSON.parse(user.permissions);
        } catch (e) { }
      } else if (typeof user.permissions === 'object' && user.permissions !== null) {
        perms = user.permissions;
      }
      setUserPermissions(perms);
    }
  }, []);

  const hasPermission = (permissionKey) => {
    if (userRole === 'super_admin') return true;
    return !!userPermissions[permissionKey];
  };

  const formatRole = (role) => {
    switch (role?.toLowerCase()) {
      case 'cashier': return 'Thu Ngân';
      case 'chef': return 'Đầu Bếp';
      case 'admin': return 'Quản Lý';
      case 'super_admin': return 'Tổng Quản Lý';
      default: return role;
    }
  };

  // Trình in ẩn (Silent Print) dùng để in HTML Hóa đơn kết ca
  const openSilentPrint = (htmlContent) => {
    if (!htmlContent) return;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 500);
  };

  const handleOpenKetCaModal = async () => {
    try {
      setIsLoggingOut(true);
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const response = await axios.get(`${API_BASE_URL}/user/ketca`, {
        params: { user_id: userObj.id }
      });
      if (response.data && response.data.success) {
        setShiftReportData(response.data);
        // Ghi nhận mốc ngày giờ bấm kết ca hiện tại
        setKetCaTime(new Date().toLocaleString('vi-VN'));
        setShowLogoutConfirm(true);
      } else {
        setAlertModal({
          show: true,
          title: "Cảnh Báo",
          message: response.data.message || "Không thể kết ca vào lúc này.",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu kết ca:", error);
      setAlertModal({
        show: true,
        title: "Cảnh Báo",
        message: error.response?.data?.message || "Lỗi khi tải dữ liệu kết ca.",
        type: "error"
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Đóng profile dropdown và mở modal đăng xuất cơ bản (không gọi dữ liệu kết ca)
  const handleOpenNormalLogoutModal = () => {
    setShowProfileDropdown(false);
    setShiftReportData(null); // Clear dữ liệu kết ca để hiện modal đăng xuất thường
    setShowLogoutConfirm(true);
  };

  const handleLogoutSubmit = async () => {
    setIsLoggingOut(true);

    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};

      // Nếu là thu ngân/quản lý và có dữ liệu kết ca, thực hiện gửi yêu cầu chốt ca chính thức (lưu DB)
      if (['cashier', 'admin', 'super_admin'].includes(userRole) && shiftReportData) {
        await axios.post(`${API_BASE_URL}/user/ketca`, {
          user_id: userObj.id || userObj._id
        });

        // Lệnh in bill kết ca tự động
        if (shiftReportData.html_bill) {
          openSilentPrint(shiftReportData.html_bill);
        }
      }

      // Gọi API Logout lưu Log vào hệ thống
      if (import.meta.env.VITE_API_URL) {
        await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`, {
          user_id: userObj.id || userObj._id,
          username: userObj.username || 'unknown'
        });
      }
      console.log("Đã gọi API logout thành công!");

      // Chỉ xóa bộ nhớ và chuyển trang khi thực hiện thành công toàn bộ
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setShowLogoutConfirm(false);
      navigate('/login');
    } catch (err) {
      console.error("Lỗi chốt ca hoặc ghi nhận LOGOUT xuống server:", err);
      setAlertModal({
        show: true,
        title: "Lỗi Kết Ca",
        message: err.response?.data?.message || "Lỗi chốt ca hoặc ghi nhận đăng xuất. Vui lòng thử lại!",
        type: "error"
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="flex justify-between items-center h-16 px-6 sm:px-8 sticky top-0 z-40 bg-white border-b border-neutralCustom/15 shrink-0 shadow-sm transition-all duration-300">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-primary tracking-tight leading-none">{title}</h1>
        <p className="text-[11px] sm:text-xs text-neutralCustom font-semibold mt-1 opacity-80">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">

        {/* 🌟 STREAMING_CHUNK: Nút KẾT CA hiển thị cho Thu ngân, Admin và Super Admin */}
        {['cashier', 'admin', 'super_admin'].includes(userRole) && !window.location.pathname.startsWith('/kitchen') && (
          <button
            onClick={handleOpenKetCaModal}
            disabled={isLoggingOut || !hasPermission('close_shift')}
            className={`px-4 py-2 text-white font-extrabold rounded-xl flex items-center gap-2 shadow-md text-xs transition-all shrink-0
              ${hasPermission('close_shift')
                ? 'bg-red-500 hover:bg-red-600 hover:shadow-red-500/20 active:scale-95 cursor-pointer'
                : 'bg-gray-300 text-gray-400 cursor-not-allowed opacity-60'}`}
            title={hasPermission('close_shift') ? "Kết ca làm việc" : "Tài khoản bị giới hạn quyền kết ca"}
          >
            {isLoggingOut ? (
              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">work_history</span>
            )}
            <span>KẾT CA LÀM VIỆC</span>
          </button>
        )}

        {/* THÔNG BÁO CHỜ CHẾ BIẾN/THANH TOÁN */}
        <div className="flex items-center gap-4 relative">
          <button
            onClick={() => { setShowNotiDropdown(!showNotiDropdown); setShowProfileDropdown(false); }}
            className={`hover:text-primary transition-all duration-200 relative p-2 rounded-full flex items-center justify-center cursor-pointer ${showNotiDropdown ? 'text-primary bg-primary/10' : 'text-neutralCustom hover:bg-stone-50'}`}
            title="Thông báo hệ thống"
          >
            <span className="material-symbols-outlined text-2xl">notifications</span>
            {notifications.length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm border-2 border-white animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Hộp thoại danh sách thông báo */}
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
            <p className="text-xs sm:text-sm font-bold leading-none text-gray-950 whitespace-nowrap">{userInfo.fullname}</p>
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
                <p className="text-xs font-bold text-gray-900 truncate">{userInfo.fullname}</p>
                <p className="text-[9px] text-primary font-black uppercase mt-0.5">{userInfo.role}</p>
              </div>
              <button
                onClick={handleOpenNormalLogoutModal}
                className="px-4 py-2.5 text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 text-left transition-colors w-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🌟 STREAMING_CHUNK: Render hộp thoại Modal Kết ca hoặc Đăng xuất tùy thuộc vào dữ liệu shiftReportData */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className={`bg-white rounded-3xl p-6 sm:p-8 shadow-2xl w-full border border-neutralCustom/10 animate-scale-up ${['cashier', 'admin', 'super_admin'].includes(userRole) && shiftReportData ? 'max-w-md' : 'max-w-sm text-center'}`}>

            {/* THIẾT KẾ CHO THU NGÂN/QUẢN LÝ (CHỈ KHI CÓ DỮ LIỆU KẾT CA THẬT) */}
            {['cashier', 'admin', 'super_admin'].includes(userRole) && shiftReportData ? (
              <>
                <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
                    <span className="material-symbols-outlined text-3xl">receipt_long</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Báo Cáo Kết Ca</h3>
                    <p className="text-xs text-neutralCustom mt-0.5">Xác nhận doanh thu và đóng ca làm việc Làng MÌXI.</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6 bg-stone-50/50 p-4 rounded-2xl border border-stone-200/50 text-left">
                  {/* 🌟 THÊM MỚI: Hiển thị Ngày và Giờ bấm kết ca */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-700">Ngày giờ kết ca:</span>
                    <span className="font-bold text-gray-900 font-mono">{ketCaTime}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-700">Tiền mặt đầu ca:</span>
                    <span className="font-bold text-gray-900">{Number(shiftReportData?.tien_dau_ca || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-700">Tổng doanh thu tiền mặt:</span>
                    <span className="font-bold text-gray-900">{Number(shiftReportData?.tongTienBanDuoc_CASH || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-700">Tổng doanh thu VNPAY:</span>
                    <span className="font-bold text-gray-900">{Number(shiftReportData?.tongTienBanDuoc_VNPAY || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between items-center mt-2">
                    <span className="font-black text-gray-900 text-base uppercase">Tổng tiền trong két:</span>
                    <span className="font-black text-primary text-xl">{Number(shiftReportData?.tong_tien_trong_ket || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    disabled={isLoggingOut}
                    onClick={() => setShowLogoutConfirm(false)}
                    className="w-1/2 py-3 border border-neutralCustom/20 text-neutralCustom bg-white font-bold text-sm rounded-xl hover:bg-stone-50 active:scale-95 transition-all cursor-pointer"
                  >
                    Đóng cửa sổ
                  </button>
                  <button
                    disabled={isLoggingOut}
                    onClick={handleLogoutSubmit}
                    className="w-1/2 py-3 bg-primary text-white font-black text-sm rounded-xl hover:bg-secondary shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isLoggingOut ? (
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">print</span>
                        In Bill & Đăng Xuất
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* THIẾT KẾ CHO ĐẦU BẾP / QUẢN LÝ / HOẶC THU NGÂN KHI BẤM LOGOUT THƯỜNG */
              <>
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                  <span className="material-symbols-outlined text-4xl">logout</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2">
                  Đăng xuất hệ thống
                </h3>
                <p className="text-xs sm:text-sm text-neutralCustom mb-6 leading-relaxed">
                  Bạn có chắc chắn muốn kết thúc ca làm việc và đăng xuất khỏi ứng dụng nghiệp vụ Làng MÌXI BBQ?
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
              </>
            )}

          </div>
        </div>
      )}

      {/* 🌟 HỆ THỐNG ALERT MODAL THAY THẾ TOAST (Bảo mật, có nút bấm Đồng ý) */}
      {alertModal.show && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-neutralCustom/10 text-center animate-scale-up">
            <div className={`w-16 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              alertModal.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              <span className="material-symbols-outlined text-3xl">
                {alertModal.type === 'success' ? 'check_circle' : 'error'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{alertModal.title}</h3>
            <p className="text-sm text-neutralCustom mb-6 leading-relaxed">{alertModal.message}</p>
            <button 
              onClick={() => setAlertModal({ show: false, message: '', title: 'Thông báo', type: 'error' })} 
              className={`w-full py-3 text-white font-bold rounded-xl text-sm transition-all shadow-md ${
                alertModal.type === 'success' ? 'bg-primary hover:bg-secondary' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              Đồng ý
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default StaffHeader;