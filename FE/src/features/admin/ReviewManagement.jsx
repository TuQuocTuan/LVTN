import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import axios from 'axios';

// Thiết lập URL kết nối đến API Backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const axiosConfig = { headers: { 'ngrok-skip-browser-warning': 'true' } };

// Helper an toàn để tránh lỗi RegEx khi từ cấm chứa ký tự đặc biệt (VD: di~, v~, b`)
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const ReviewManagement = () => {
  /* STATE QUẢN LÝ DỮ LIỆU VÀ PHÂN TRANG */
  const [reviewsList, setReviewsList] = useState([]);
  const [dishesList, setDishesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // STATE LƯU TRỮ DANH SÁCH TỪ THÔ TỤC ĐỌC TỪ FILE TXT
  const [sensitiveWords, setSensitiveWords] = useState([]);

  const [viewMode, setViewMode] = useState('table');

  // Phân trang danh sách ý kiến đánh giá (Mỗi trang 8 đánh giá)
  const [reviewCurrentPage, setReviewCurrentPage] = useState(1);
  const reviewsPerPage = 8;

  // Phân trang bảng xếp hạng chất lượng món ăn (Mỗi trang 5 món ăn)
  const [dishCurrentPage, setDishCurrentPage] = useState(1);
  const dishesPerPage = 5;

  // Các bộ lọc dữ liệu thông minh
  const [filterRating, setFilterRating] = useState('ALL');
  const [selectedDishFilter, setSelectedDishFilter] = useState('ALL'); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // STATES ĐIỀU KHIỂN BỘ LỌC THÔ TỤC
  const [maskSensitive, setMaskSensitive] = useState(true); // Che từ nhạy cảm bằng dấu *
  const [hideSensitive, setHideSensitive] = useState(false); // Ẩn hoàn toàn các đánh giá chứa từ tục tĩu

  const [alertModal, setAlertModal] = useState({ show: false, message: '', title: 'Thông báo', type: 'error' });

  // NẠP SONG SONG DANH SÁCH TỪ THÔ TỤC VÀ DỮ LIỆU ĐÁNH GIÁ KHI KHỞI CHẠY TRANG
  useEffect(() => {
    fetchProfanityList();
    fetchData();
  }, []);

  // Tự động đưa phân trang về trang 1 mỗi khi đổi bộ lọc
  useEffect(() => {
    setReviewCurrentPage(1);
    setDishCurrentPage(1);
  }, [filterRating, selectedDishFilter, searchTerm, startDate, endDate, hideSensitive]);

  const showAlert = (message, type = 'error', title = 'Thông báo') => {
    setAlertModal({ show: true, message, title, type });
  };

  // HÀM FETCH ĐỌC FILE TXT TỪ THƯ MỤC PUBLIC (GIA CỐ BỘ TÁCH TỪ SPACE-SEPARATED THÔNG MINH)
  const fetchProfanityList = async () => {
    try {
      const response = await fetch('/vietnamese_profanity.txt');
      const contentType = response.headers.get('content-type');
      
      // Phòng tránh lỗi Single Page App trả về nội dung HTML thay vì file văn bản
      if (!response.ok || (contentType && contentType.includes('text/html'))) {
        throw new Error('Tệp tin từ cấm không tồn tại hoặc trả về sai định dạng HTML');
      }
      
      const text = await response.text();
      const words = [];
      
      // Xử lý thông minh tách cả theo hàng (\n) lẫn dấu cách dòng gộp (space) nếu có dòng quá dài
      text.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        // Nếu dòng chứa quá nhiều từ cách nhau bởi khoảng trắng (ví dụ trên 4 từ dính nhau), tách ra làm từ cấm đơn lẻ
        if (trimmed.includes(' ') && trimmed.split(/\s+/).length > 4) {
          trimmed.split(/\s+/).forEach(w => {
            const wordTrimmed = w.trim();
            if (wordTrimmed) words.push(wordTrimmed);
          });
        } else {
          words.push(trimmed);
        }
      });
        
      setSensitiveWords(words);
    } catch (error) {
      console.error("Lỗi nạp tệp tin từ vựng thô tục, kích hoạt dự phòng ngay lập tức:", error);
      // Phương án dự phòng (Fallback) chứa đầy đủ các từ thô tục gốc để cứu cánh ngay lập tức
      setSensitiveWords([
        'cặc', 'cak', 'kak', 'kac', 'cac', 'lồn', 'lon', 'đéo', 'đm', 'vcl', 'clgt', 'buồi', 'buoi', 'đĩ', 'chó'
      ]);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resReviews, resDishes] = await Promise.all([
        axios.get(`${API_URL}/review`, axiosConfig),
        axios.get(`${API_URL}/dishes`, axiosConfig)
      ]);

      if (resReviews.data && resReviews.data.success) {
        setReviewsList(resReviews.data.data || []);
      }
      if (resDishes.data && resDishes.data.success) {
        setDishesList(resDishes.data.data || []);
      }
    } catch (error) {
      console.error("Lỗi đồng bộ dữ liệu đánh giá:", error);
      showAlert("Gặp sự cố khi đồng bộ ý kiến đánh giá từ hệ thống Làng MÌXI BBQ!", "error", "Lỗi đồng bộ");
    } finally {
      setIsLoading(false);
    }
  };

  const getDishNameById = (dishId) => {
    const dish = dishesList.find(d => d.id === Number(dishId));
    return dish ? dish.name : `Món ăn #${dishId}`;
  };

  /* HÀM KIỂM TRA BÌNH LUẬN CÓ CHỨA TỪ TỤC TĨU KHÔNG (NÂNG CẤP UNICODE BOUNDARY) */
  const checkHasProfanity = (text) => {
    if (!text || sensitiveWords.length === 0) return false;
    const cleanText = text.toLowerCase();
    return sensitiveWords.some(word => {
      const regex = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(word)}(?![\\p{L}\\p{N}])`, 'gui');
      return regex.test(cleanText);
    });
  };

  /* HÀM CHE TỪ NGỮ THÔ TỤC THÀNH DẤU SAO (*) (NÂNG CẤP UNICODE BOUNDARY CHE DẤU ĐỘNG CHUẨN XÁC) */
  const maskProfanityText = (text) => {
    if (!text || sensitiveWords.length === 0) return text || '';
    let maskedText = text;
    sensitiveWords.forEach(word => {
      const regex = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(word)}(?![\\p{L}\\p{N}])`, 'gui');
      maskedText = maskedText.replace(regex, (match) => {
        // Giữ lại ký tự đầu tiên và chuyển các ký tự sau thành dấu sao (*) để tăng tính thẩm mỹ
        return match[0] + '*'.repeat(match.length - 1);
      });
    });
    return maskedText;
  };

  const selectToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  };

  const selectThisWeek = () => {
    const current = new Date();
    const first = current.getDate() - current.getDay() + (current.getDay() === 0 ? -6 : 1);
    const firstDay = new Date(current.setDate(first)).toISOString().split('T')[0];
    const lastDay = new Date().toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const selectThisMonth = () => {
    const current = new Date();
    const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
    const firstDayStr = new Date(firstDay.getTime() - firstDay.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const lastDayStr = new Date().toISOString().split('T')[0];
    setStartDate(firstDayStr);
    setEndDate(lastDayStr);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  /* LỌC DANH SÁCH REVIEW (KẾT HỢP BỘ LỌC THÔ TỤC) */
  const filteredReviews = reviewsList.filter(r => {
    const matchRating = filterRating === 'ALL' || r.rating === Number(filterRating);
    const matchDishSelect = selectedDishFilter === 'ALL' || Number(r.dish_id) === Number(selectedDishFilter);

    const dishName = getDishNameById(r.dish_id);
    const commentText = r.comment || '';
    const matchSearch = dishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        commentText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        String(r.session_id).toLowerCase().includes(searchTerm.toLowerCase());

    let matchDate = true;
    if (startDate || endDate) {
      const reviewDate = new Date(r.created_at);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (reviewDate < start) matchDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (reviewDate > end) matchDate = false;
      }
    }

    let matchCensor = true;
    if (hideSensitive && checkHasProfanity(r.comment)) {
      matchCensor = false;
    }

    return matchRating && matchDishSelect && matchSearch && matchDate && matchCensor;
  });

  const totalReviewPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const indexOfLastReview = reviewCurrentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviewsList = filteredReviews.slice(indexOfFirstReview, indexOfLastReview);

  /* TÍNH TOÁN BẢNG XẾP HẠNG CHẤT LƯỢNG MÓN ĂN */
  const getDishQualityAnalytics = () => {
    const analytics = {};
    
    reviewsList.forEach(r => {
      const id = r.dish_id;
      if (!analytics[id]) {
        analytics[id] = {
          name: getDishNameById(id),
          totalReviews: 0,
          sumStars: 0,
          negativeCount: 0 
        };
      }
      analytics[id].totalReviews += 1;
      analytics[id].sumStars += r.rating;
      if (r.rating <= 3) {
        analytics[id].negativeCount += 1;
      }
    });

    return Object.values(analytics).sort((a, b) => (b.sumStars / b.totalReviews) - (a.sumStars / a.totalReviews));
  };

  const dishAnalyticsList = getDishQualityAnalytics();

  const totalDishPages = Math.ceil(dishAnalyticsList.length / dishesPerPage);
  const indexOfLastDish = dishCurrentPage * dishesPerPage;
  const indexOfFirstDish = indexOfLastDish - dishesPerPage;
  const currentDishesAnalytics = dishAnalyticsList.slice(indexOfFirstDish, indexOfLastDish);

  const totalReviews = reviewsList.length;
  const averageRating = totalReviews > 0 ? (reviewsList.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : '0.0';
  const criticalCount = reviewsList.filter(r => r.rating <= 3).length; 

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, idx) => (
      <span
        key={idx}
        className="material-symbols-outlined text-yellow-400 text-xs sm:text-sm"
        style={{ fontVariationSettings: idx < rating ? "'FILL' 1" : "'FILL' 0" }}
      >
        star
      </span>
    ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Vừa xong';
    const d = new Date(dateString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden relative">
      <AdminSidebar currentTab="review" />
      <AdminHeader />

      {/* CUSTOM ALERT DIALOG AN TOÀN */}
      {alertModal.show && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-neutralCustom/10 text-center animate-scale-up">
            <div className="w-16 h-14 rounded-2xl bg-red-50 text-red-650 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{alertModal.title}</h3>
            <p className="text-sm text-neutralCustom mb-6 leading-relaxed">{alertModal.message}</p>
            <button 
              onClick={() => setAlertModal({ show: false, message: '', title: 'Thông báo', type: 'error' })} 
              className="w-full py-3 text-white font-bold rounded-xl text-sm transition-all shadow-md bg-red-500 hover:bg-red-600"
            >
              Đồng ý
            </button>
          </div>
        </div>
      )}

      {/* WORKSPACE GIÁM SÁT CHẤT LƯỢNG CHO MÁY TÍNH */}
      <main className="ml-64 pt-20 p-6 w-[calc(100%-16rem)] flex flex-col min-h-screen transition-all duration-300">
        
        {/* Header */}
        <div className="mb-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Ý kiến & Khảo sát món ăn</h2>
            <p className="text-neutralCustom text-sm mt-1">Giám sát chất lượng món nướng lẩu ẩn danh trực tiếp từ ý kiến khách hàng quét mã QR trên bill.</p>
          </div>
          
          <div className="bg-white border border-neutralCustom/20 p-1 rounded-xl flex gap-1 shadow-sm shrink-0">
            <button 
              onClick={() => setViewMode('table')} 
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-primary text-white shadow-sm' : 'text-neutralCustom hover:bg-gray-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">table_rows</span>
              Bảng biểu
            </button>
            <button 
              onClick={() => setViewMode('grid')} 
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-primary text-white shadow-sm' : 'text-neutralCustom hover:bg-gray-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              Thẻ bento
            </button>
          </div>
        </div>

        {/* BENTO STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 shrink-0">
          <div className="bg-white p-5 rounded-2xl border border-neutralCustom/20 shadow-sm flex items-center gap-5 hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-yellow-50 text-yellow-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <div>
              <p className="text-xs font-bold text-neutralCustom uppercase tracking-wider mb-1">Điểm đánh giá trung bình</p>
              <h4 className="text-3xl font-black text-gray-900">{averageRating} <span className="text-sm font-medium text-neutralCustom">/ 5.0</span></h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutralCustom/20 shadow-sm flex items-center gap-5 hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">forum</span>
            </div>
            <div>
              <p className="text-xs font-bold text-neutralCustom uppercase tracking-wider mb-1">Tổng lượt khảo sát</p>
              <h4 className="text-3xl font-black text-gray-900">{totalReviews} lượt</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-red-100 bg-red-50/20 shadow-sm flex items-center gap-5 hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">warning</span>
            </div>
            <div>
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Món ăn bị chê (≤3 sao)</p>
              <h4 className="text-3xl font-black text-red-600">{criticalCount} lượt</h4>
            </div>
          </div>
        </div>

        {/* PANEL BỘ LỌC KHOẢNG THỜI GIAN */}
        <div className="bg-white p-4 rounded-2xl border border-neutralCustom/20 shadow-sm mb-4 flex flex-col gap-3 shrink-0">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-2 shrink-0">
              <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
              <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Bộ lọc khoảng thời gian:</span>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
              <button onClick={selectToday} className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">Hôm nay</button>
              <button onClick={selectThisWeek} className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">Tuần này</button>
              <button onClick={selectThisMonth} className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">Tháng này</button>
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full"></div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Từ ngày</span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-50 border border-neutralCustom/20 text-sm rounded-xl px-4 py-2 outline-none focus:border-primary focus:bg-white text-gray-900 font-medium"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Đến ngày</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-50 border border-neutralCustom/20 text-sm rounded-xl px-4 py-2 outline-none focus:border-primary focus:bg-white text-gray-900 font-medium"
                />
              </div>
            </div>
            
            <div className="sm:self-end">
              <button 
                onClick={clearDateFilter}
                disabled={!startDate && !endDate}
                className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-base">restart_alt</span>
                Xóa lọc ngày
              </button>
            </div>
          </div>
        </div>

        {/* LỌC THEO MÓN ĂN VÀ TÌM KIẾM TỪ KHÓA BÌNH LUẬN + BỘ LỌC SENSITIVE THÔ TỤC */}
        <div className="bg-white p-4 rounded-2xl border border-neutralCustom/20 shadow-sm mb-4 space-y-3 shrink-0">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutralCustom text-xl">search</span>
              <input 
                type="text" 
                placeholder="Tìm theo từ khóa góp ý, mã phiên ăn..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-neutralCustom/20 text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-primary focus:bg-white transition-all font-semibold text-gray-950" 
              />
            </div>

            <div className="flex gap-3 w-full md:w-auto items-center shrink-0">
              <select
                value={selectedDishFilter}
                onChange={(e) => setSelectedDishFilter(e.target.value)}
                className="px-4 py-2.5 border border-neutralCustom/20 rounded-xl text-xs font-bold text-gray-700 bg-white outline-none focus:border-primary cursor-pointer max-w-xs"
              >
                <option value="ALL">-- Tất cả món ăn --</option>
                {dishesList.map(dish => (
                  <option key={dish.id} value={dish.id}>{dish.name}</option>
                ))}
              </select>

              <div className="flex gap-1 overflow-x-auto">
                {['ALL', '5', '4', '3', '2', '1'].map((stars) => (
                  <button 
                    key={stars}
                    onClick={() => setFilterRating(stars)} 
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1 shrink-0 ${
                      filterRating === stars 
                        ? 'bg-gray-900 text-white border-gray-900 shadow-sm' 
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {stars === 'ALL' ? 'Tất cả' : `${stars} ★`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full"></div>

          {/* PHÂN HỆ ĐIỀU KHIỂN BỘ LỌC TỪ NGỮ THÔ TỤC (SENSITIVE CONTROLS) */}
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-xs font-bold text-gray-650 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-orange-500 text-lg">gpp_maybe</span>
              Hệ thống lọc từ tục tĩu tự động:
            </span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={maskSensitive} 
                  onChange={(e) => setMaskSensitive(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" 
                />
                Che mờ từ nhạy cảm (dạng *)
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={hideSensitive} 
                  onChange={(e) => setHideSensitive(e.target.checked)}
                  className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500" 
                />
                Ẩn hoàn toàn đánh giá tục tĩu
              </label>
            </div>
          </div>
        </div>

        {/* KHU VỰC HIỂN THỊ ĐA CHẾ ĐỘ DÀNH CHO LAPTOP */}
        <div className="flex flex-col gap-6 mb-4">
          
          {/* CHI TIẾT DANH SÁCH REVIEW KÈM PHÂN TRANG (CHIẾM 100% CHIỀU RỘNG) */}
          <div className="w-full flex flex-col">
            <div>
              {isLoading ? (
                <div className="py-24 text-center text-stone-500 font-bold flex flex-col items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-5xl animate-spin text-primary">progress_activity</span>
                  <span>Đang lấy đánh giá live từ hệ thống Làng MÌXI BBQ...</span>
                </div>
              ) : filteredReviews.length > 0 ? (
                viewMode === 'table' ? (
                  /* CHẾ ĐỘ BẢNG BIỂU CHUYÊN NGHIỆP */
                  <div className="bg-white rounded-2xl border border-neutralCustom/20 shadow-sm overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-stone-50 border-b border-neutralCustom/10 text-neutralCustom text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                            <th className="px-4 py-3">Phiên ăn / Thời gian</th>
                            <th className="px-4 py-3">Món ăn nướng lẩu</th>
                            <th className="px-4 py-3 text-center">Xếp hạng</th>
                            <th className="px-4 py-3">Bình luận góp ý</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutralCustom/10">
                          {currentReviewsList.map((review, idx) => {
                            // THỰC HIỆN LỌC VÀ CHE DẤU NGAY TRƯỚC KHI HIỂN THỊ TRÊN MÀN HÌNH
                            const hasBadWord = checkHasProfanity(review.comment);
                            const displayComment = maskSensitive ? maskProfanityText(review.comment) : review.comment;

                            return (
                              <tr key={idx} className={`hover:bg-orange-500/5 transition-colors group ${hasBadWord ? 'bg-red-50/10' : ''}`}>
                                <td className="px-4 py-3.5">
                                  <div className="flex flex-col min-w-[130px]">
                                    <span className="text-xs font-bold text-gray-800 whitespace-nowrap">
                                      {formatDate(review.created_at)}
                                    </span>
                                    <span className="text-[10px] font-mono text-neutralCustom/85 mt-0.5" title={review.session_id}>
                                      #{String(review.session_id).slice(0, 8)}...
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="inline-block bg-orange-50 border border-orange-200 text-orange-600 font-extrabold px-2.5 py-1 rounded-lg text-xs whitespace-nowrap">
                                    {getDishNameById(review.dish_id)}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                  <div className="flex gap-0.5 justify-center">{renderStars(review.rating)}</div>
                                </td>
                                <td className="px-4 py-3.5 text-sm text-gray-700 min-w-[200px] max-w-xs md:max-w-md">
                                  <div className="flex flex-col gap-1">
                                    {/* THAY THẾ BIẾN THÔ review.comment THÀNH BIẾN ĐÃ ĐƯỢC CHE DẤU displayComment */}
                                    <p className="italic font-medium leading-relaxed font-semibold break-words">
                                      "{displayComment || 'Không để lại lời nhắn'}"
                                    </p>
                                    {/* Nhãn đỏ cảnh báo nếu phát hiện thô tục */}
                                    {hasBadWord && (
                                      <span className="self-start inline-flex items-center gap-1 bg-red-50 text-red-650 border border-red-100 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1 shadow-sm">
                                        <span className="material-symbols-outlined text-[12px]">gpp_maybe</span>
                                        ⚠️ Có từ tục tĩu nhạy cảm
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* CHẾ ĐỘ GRID BENTO THOÁNG ĐÃNG */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    {currentReviewsList.map((review, idx) => {
                      // ĐỒNG BỘ LỌC TỤC TĨU CHO CẢ CHẾ ĐỘ THẺ BENTO GRID
                      const hasBadWord = checkHasProfanity(review.comment);
                      const displayComment = maskSensitive ? maskProfanityText(review.comment) : review.comment;

                      return (
                        <div key={idx} className={`bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between ${hasBadWord ? 'border-red-150 bg-red-50/5' : 'border-neutralCustom/20'}`}>
                          <div>
                            {/* Header: Ngày giờ và Mã session */}
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[10px] bg-stone-100 text-stone-600 font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                Bill #{String(review.session_id).slice(0, 8)}...
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider">{formatDate(review.created_at)}</span>
                            </div>

                            {/* Món ăn và sao */}
                            <div className="flex items-center justify-between mb-4">
                              <span className="bg-orange-50 text-orange-600 border border-orange-100 font-black px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider">
                                {getDishNameById(review.dish_id)}
                              </span>
                              <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                            </div>

                            {/* THAY THẾ BIẾN THÔ review.comment THÀNH displayComment */}
                            <div className="bg-stone-50/50 p-4 rounded-xl text-sm italic text-gray-700 leading-relaxed border border-stone-200/40 relative">
                              "{displayComment || 'Không có bình luận chi tiết'}"
                            </div>
                            
                            {/* Cảnh báo ở dạng Grid */}
                            {hasBadWord && (
                              <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-red-650">
                                <span className="material-symbols-outlined text-[14px]">gpp_maybe</span>
                                Phát hiện từ tục tĩu nhạy cảm
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="col-span-full py-24 text-center text-gray-400 font-bold italic bg-white rounded-2xl border border-dashed border-neutralCustom/25">
                  Không tìm thấy ý kiến khảo sát nào khớp với điều kiện lọc...
                </div>
              )}
            </div>

            {/* PHÂN TRANG DANH SÁCH ĐÁNH GIÁ ĐƠN GIẢN TRUNG TÂM */}
            {!isLoading && totalReviewPages > 1 && (
              <div className="mt-3 flex justify-center items-center p-2 rounded-2xl shrink-0">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setReviewCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={reviewCurrentPage === 1}
                    className="p-1.5 border border-neutralCustom/20 rounded-xl hover:bg-stone-50 text-neutralCustom disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center bg-white shadow-sm w-9 h-9"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  {Array.from({ length: totalReviewPages }, (_, i) => i + 1).map((page) => (
                    <button 
                      key={page}
                      onClick={() => setReviewCurrentPage(page)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        reviewCurrentPage === page 
                          ? 'bg-primary text-white font-bold' 
                          : 'hover:bg-stone-50 text-neutralCustom border border-neutralCustom/20 bg-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button 
                    onClick={() => setReviewCurrentPage(prev => Math.min(prev + 1, totalReviewPages))}
                    disabled={reviewCurrentPage === totalReviewPages}
                    className="p-1.5 border border-neutralCustom/20 rounded-xl hover:bg-stone-50 text-neutralCustom disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center bg-white shadow-sm w-9 h-9"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BẢNG PHÂN TÍCH CHẤT LƯỢNG CHI TIẾT TỪNG MÓN (ĐẨY XUỐNG DƯỚI CÙNG FULL WIDTH) */}
          <div className="w-full flex flex-col">
            <div className="bg-white p-6 rounded-2xl border border-neutralCustom/20 shadow-sm flex flex-col justify-between">
              <div>
                <div className="border-b border-gray-150 pb-4 mb-4">
                  <h3 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary">bar_chart</span> Xếp hạng chất lượng món ăn
                  </h3>
                  <p className="text-xs text-neutralCustom mt-0.5">Tự động tổng hợp và xếp hạng trung bình từ dữ liệu Live của khách hàng.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {currentDishesAnalytics.length > 0 ? (
                    currentDishesAnalytics.map((dish, index) => {
                      const avgScore = (dish.sumStars / dish.totalReviews).toFixed(1);
                      const isLowQuality = Number(avgScore) <= 3.8;
                      const percentage = Math.min(100, Math.max(0, (Number(avgScore) / 5) * 100));

                      return (
                        <div key={index} className="p-3 bg-stone-50/50 border border-stone-200/60 rounded-xl flex flex-col gap-2.5 transition-all hover:bg-stone-100/50">
                          <div className="flex items-center justify-between min-w-0">
                            <div className="min-w-0 pr-3">
                              <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm truncate">{dish.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-neutralCustom font-semibold">{dish.totalReviews} lượt đánh giá</span>
                                {dish.negativeCount > 0 && (
                                  <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded font-black">
                                    {dish.negativeCount} lượt chê
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0 flex flex-col items-end">
                              <span className={`text-sm font-black px-2 py-0.5 rounded-lg ${
                                isLowQuality ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-150'
                              }`}>
                                {avgScore} ★
                              </span>
                            </div>
                          </div>

                          {/* Thanh biểu đồ phần trăm tỷ lệ hài lòng */}
                          <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isLowQuality ? 'bg-red-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-xs text-stone-400 italic py-8">Chưa có dữ liệu phân tích chất lượng món ăn.</p>
                  )}
                </div>
              </div>

              {/* THANH ĐIỀU KHIỂN PHÂN TRANG CHO PHẦN XẾP HẠNG MÓN ĂN TỐI GIẢN */}
              {dishAnalyticsList.length > dishesPerPage && (
                <div className="mt-4 pt-3 border-t border-gray-150 flex justify-center items-center shrink-0">
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setDishCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={dishCurrentPage === 1}
                      className="p-1 border border-neutralCustom/20 rounded-lg hover:bg-stone-50 text-neutralCustom disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center bg-white shadow-sm w-7 h-7"
                    >
                      <span className="material-symbols-outlined text-xs">chevron_left</span>
                    </button>
                    {Array.from({ length: totalDishPages }, (_, i) => i + 1).map((page) => (
                      <button 
                        key={page}
                        onClick={() => setDishCurrentPage(page)}
                        className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all shadow-sm ${
                          dishCurrentPage === page 
                            ? 'bg-primary text-white font-bold' 
                            : 'hover:bg-stone-50 text-neutralCustom border border-neutralCustom/15 bg-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      onClick={() => setDishCurrentPage(prev => Math.min(prev + 1, totalDishPages))}
                      disabled={dishCurrentPage === totalDishPages}
                      className="p-1 border border-neutralCustom/20 rounded-lg hover:bg-stone-50 text-neutralCustom disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center bg-white shadow-sm w-7 h-7"
                    >
                      <span className="material-symbols-outlined text-xs">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default ReviewManagement;
