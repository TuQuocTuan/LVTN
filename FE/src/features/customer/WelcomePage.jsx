import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const WelcomePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, lang, toggleLanguage } = useLanguage();

  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tableId, setTableId] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    const tableKey = searchParams.get('table_key');

    if (tableKey) {
      localStorage.removeItem('sessionId');
      localStorage.removeItem('tableId');

      // Lưu tạm mã băm mới vào máy
      localStorage.setItem('table_key', tableKey);

      // Xóa đuôi URL cho sạch đẹp
      window.history.replaceState({}, document.title, window.location.pathname);

      // Gọi API mở thực đơn (Chắc chắn lọt qua vì old_session đã bị xóa sạch ở bước 1)
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

      {/* TOP BAR */}
      <nav className="fixed top-0 left-0 w-full z-40 flex justify-end items-center px-4 py-3 bg-white/80 backdrop-blur-md shadow-sm">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform p-2 bg-primary/10 rounded-xl px-3 py-1.5"
        >
          <span className="font-bold text-xs text-primary">{t('langLabel')}</span>
          <span className="material-symbols-outlined text-primary text-sm">language</span>
        </button>
      </nav>

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 pt-20 pb-24 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-100">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-20 w-96 h-96 bg-tertiary/10 rounded-full blur-3xl"></div>
        </div>

        <div className={`w-full max-w-md flex flex-col items-center z-10 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div 
            onClick={() => navigate('/about')}
            className="relative mb-12 group transition-transform duration-500 hover:scale-105 cursor-pointer"
            title="Xem giới thiệu nhà hàng"
          >
            <div className="absolute inset-0 bg-primary pulse-soft rounded-full -m-4"></div>
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-xl">
              <img alt="Restaurant" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=300&fit=crop" />
            </div>
          </div>

          <div className="text-center mb-8 space-y-2">
            <h2 className="text-neutralCustom font-bold opacity-80 uppercase tracking-widest text-xs">{t('welcome')}</h2>
            <h1 className="text-3xl text-gray-900 leading-tight px-4 font-semibold">
              {t('subtitle')} <br />
              <span 
                onClick={() => navigate('/about')}
                className="text-primary font-black cursor-pointer hover:underline hover:opacity-90 active:scale-95 transition-all inline-block"
                title="Xem giới thiệu nhà hàng"
              >
                {t('brandName')}
              </span>
            </h1>
          </div>

          <div className="w-full glass-card border border-neutralCustom/20 rounded-xl p-8 mb-10 text-center shadow-lg">
            <div className="text-xs font-bold text-neutralCustom mb-2">{t('seating')}</div>
            <div className="font-bold text-primary text-6xl md:text-7xl mb-1">{t('tableNo')} {tableId}</div>
            <div className="w-12 h-1 bg-primary mx-auto rounded-full mt-4"></div>
          </div>

          {error && (
            <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-xl animate-bounce">
              <p className="text-red-500 text-sm font-bold text-center">{error}</p>
            </div>
          )}

          <button
            onClick={handleStartOrdering}
            disabled={isLoading}
            className="w-full bg-primary text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/30 transition-all duration-300 hover:bg-orange-700 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:active:scale-100"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                {t('loadingMenu')}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">restaurant_menu</span>
                {t('startOrdering')}
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};

export default WelcomePage;