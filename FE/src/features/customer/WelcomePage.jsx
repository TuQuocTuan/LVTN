import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
  const navigate = useNavigate();

  // State quản lý hiệu ứng trượt lên lúc mới vào trang
  const [isVisible, setIsVisible] = useState(false);

  // Các state mới cho Popup
  const [showPopup, setShowPopup] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Thêm state loading khi gọi API

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Hàm xử lý khi bấm nút "Bắt đầu gọi món" ở màn hình chính
  const handleOpenPopup = () => {
    setShowPopup(true);
    setError('');
  };

  // Hàm xử lý khi khách bấm "Xác nhận" trong Popup
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Kiểm tra dữ liệu đầu vào
    if (!name.trim() || !phone.trim()) {
      setError('Vui lòng nhập đầy đủ Tên và Số điện thoại!');
      return;
    }

    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError('Số điện thoại không hợp lệ (Phải đủ 10 số và bắt đầu bằng 0)!');
      return;
    }

    // 2. GỌI API XUỐNG BACKEND
    setIsLoading(true);
    setError('');

    try {
      // Gọi API open-menu (Nhớ đảm bảo server Node.js đang chạy ở port 5000)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sessions/open-menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table_id: 2,
          name: name,
          phone_number: phone
        })
      });

      const data = await response.json();

      if (data.success) {
        // NẾU THÀNH CÔNG: Lưu dữ liệu Backend trả về vào két sắt
        localStorage.setItem('customerName', name);
        localStorage.setItem('customerPhone', phone);
        localStorage.setItem('sessionId', data.session_id); // Dùng để gọi món sau này
        localStorage.setItem('creatorId', data.creator_id); // Dùng để biết ai là người gọi

        // Chuyển hướng sang trang Menu
        navigate('/menu');
      } else {
        // NẾU THẤT BẠI (VD: Bàn chưa được thu ngân mở) -> Hiện lỗi từ Backend
        setError(data.message);
      }
    } catch (err) {
      console.error("Lỗi gọi API:", err);
      setError('Không thể kết nối đến máy chủ. Vui lòng gọi phục vụ!');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    // Dùng Regex để loại bỏ tất cả các ký tự không phải là số (0-9) khi đang gõ
    const onlyNumbers = e.target.value.replace(/[^0-9]/g, '');

    // Chỉ cho phép cập nhật vào state nếu độ dài <= 10
    if (onlyNumbers.length <= 10) {
      setPhone(onlyNumbers);
      setError('');
    }
  };

  return (
    <div className="bg-mesh min-h-screen flex flex-col text-gray-900 font-sans relative">

      {/* --- TOP BAR --- */}
      <nav className="fixed top-0 left-0 w-full z-40 flex justify-end items-center px-4 py-3 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform p-2">
          <span className="font-bold text-sm text-primary">TIẾNG VIỆT</span>
          <span className="material-symbols-outlined text-neutralCustom">language</span>
        </div>
      </nav>

      {/* --- KHU VỰC NỘI DUNG CHÍNH --- */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 pt-20 pb-24 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-100">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-20 w-96 h-96 bg-tertiary/10 rounded-full blur-3xl"></div>
        </div>

        <div className={`w-full max-w-md flex flex-col items-center z-10 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="relative mb-12 group transition-transform duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-primary pulse-soft rounded-full -m-4"></div>
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-xl">
              <img alt="Restaurant" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfoQsfNouqUgI9WXVGU5o8shbJ9S0qIbQT__R_JDEcjV2JM5zd1H_bX3H-UXtOcnCmbHxG20xfBSTslFA5wyPf4Vu9NYu4NJx7g86AR1FtYPwGNfvC_TVRaGasf0U8q8hioJtCeJ0ol1dmD0s2Yw4nJMwrKysLZr-8usML25ww9o69CtgW59fkzjVuMIRVCpWhmEvhrsRviwME12s7VySZ_C3T3XodegAXLc79dBnGtNPDuaHNDrU2JQop2rUlEyQLZtPJVUB-T3w" />
            </div>
          </div>

          <div className="text-center mb-8 space-y-2">
            <h2 className="text-neutralCustom font-bold opacity-80 uppercase tracking-widest text-xs">Xin chào</h2>
            <h1 className="text-3xl text-gray-900 leading-tight px-4 font-semibold">
              Chào mừng quý khách đến với <br />
              <span className="text-primary font-bold">Làng MìXI</span>
            </h1>
          </div>

          <div className="w-full glass-card border border-neutralCustom/20 rounded-xl p-8 mb-10 text-center shadow-lg">
            <div className="text-xs font-bold text-neutralCustom mb-2">VỊ TRÍ CHỖ NGỒI</div>
            <div className="font-bold text-primary text-6xl md:text-7xl mb-1">Bàn số 12</div>
            <div className="w-12 h-1 bg-primary mx-auto rounded-full mt-4"></div>
          </div>

          <button
            onClick={handleOpenPopup}
            className="w-full bg-primary text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/30 transition-all duration-300 hover:bg-orange-700 active:scale-95 flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">restaurant_menu</span>
            Bắt đầu gọi món
          </button>
        </div>
      </main>

      {/* =========================================
          POPUP ĐIỀN THÔNG TIN KHÁCH HÀNG
      ========================================== */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => !isLoading && setShowPopup(false)}
          ></div>

          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-[pulse_0.2s_ease-out]">
            <button
              disabled={isLoading}
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-neutralCustom hover:text-gray-900 bg-gray-100 rounded-full p-1 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Thông tin của bạn</h3>
              <p className="text-sm text-neutralCustom mt-1">Vui lòng cho bếp biết tên của bạn nhé!</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field: Tên */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1 ml-1">Họ và Tên</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-primary focus:border-primary block px-4 py-3 outline-none transition-colors disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Field: Số điện thoại (Đã gọi đúng hàm handlePhoneChange) */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1 ml-1">Số điện thoại</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    disabled={isLoading}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-primary focus:border-primary block px-4 py-3 outline-none transition-colors disabled:opacity-60"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-xs font-semibold text-center animate-bounce">{error}</p>}

              {/* Nút Xác nhận */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white font-bold text-base py-3.5 rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-all mt-2 flex justify-center items-center gap-2 disabled:bg-gray-400 disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận & Vào bàn'
                )}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default WelcomePage;