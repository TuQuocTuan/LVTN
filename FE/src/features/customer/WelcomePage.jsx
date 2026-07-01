import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // 🎯 Đã thêm useSearchParams vào đây

const WelcomePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // 🎯 Đã khai báo biến searchParams ở đây

  // State quản lý hiệu ứng trượt lên lúc mới vào trang
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [tableId, setTableId] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    const tableKey = searchParams.get('table_key');

    if (tableKey) {
      // 1. 🌟 THẦN CHÚ MỚI: Quét sạch dấu vết cũ của người đi trước NGAY LẬP TỨC
      localStorage.removeItem('sessionId');
      localStorage.removeItem('tableId');

      // 2. Lưu tạm mã băm mới vào máy
      localStorage.setItem('table_key', tableKey);

      // 3. Xóa đuôi URL cho sạch đẹp
      window.history.replaceState({}, document.title, window.location.pathname);

      // 4. Gọi API mở thực đơn (Chắc chắn lọt qua vì old_session đã bị xóa sạch ở bước 1)
      const autoCheckTable = async () => {
        setIsLoading(true);
        try {
          const response = await axios.post(`${import.meta.env.VITE_API_URL}/sessions/open-menu`, {
            table_key: tableKey,
            old_session: "" // Luôn luôn là chuỗi rỗng cho lượt quét mới
          });

          if (response.data.success) {
            setTableId(response.data.table_id);
            localStorage.setItem('tableId', response.data.table_id);
            localStorage.setItem('sessionId', response.data.session_id);
          }
        } catch (err) {
          console.error("Lỗi tự động kiểm tra bàn:", err);
          if (err.response && err.response.data && err.response.data.message) {
            setError(err.response.data.message);
          } else {
            setError('Không thể kết nối đến máy chủ nhà bếp!');
          }
        } finally {
          setIsLoading(false); // Tắt xoay nút bấm
        }
      };

      autoCheckTable();
    } else {
      // Khách F5 trang khi đã mất đuôi URL, bốc từ bộ nhớ máy ra xài tiếp bình thường
      const savedTableId = localStorage.getItem('tableId');
      if (savedTableId) {
        setTableId(Number(savedTableId));
      }
    }

    return () => clearTimeout(timer);
  }, [searchParams]);


  // Hàm xử lý khi bấm nút "Bắt đầu gọi món"
  const handleStartOrdering = () => {
    if (error) return; // Nếu bàn chưa mở (có lỗi) thì không cho vào menu
    navigate('/menu');
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
            <div className="font-bold text-primary text-6xl md:text-7xl mb-1">Bàn số {tableId}</div>
            <div className="w-12 h-1 bg-primary mx-auto rounded-full mt-4"></div>
          </div>

          {/* Hiển thị lỗi nếu bàn chưa mở */}
          {error && (
            <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-xl animate-bounce">
              <p className="text-red-500 text-sm font-bold text-center">{error}</p>
            </div>
          )}

          {/* Nút Bắt đầu gọi món gánh luôn luồng API */}
          <button
            onClick={handleStartOrdering}
            disabled={isLoading}
            className="w-full bg-primary text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/30 transition-all duration-300 hover:bg-orange-700 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:active:scale-100"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                Đang mở thực đơn...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">restaurant_menu</span>
                Bắt đầu gọi món
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};

export default WelcomePage;