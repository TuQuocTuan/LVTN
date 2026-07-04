import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import axios from 'axios';

const AdminDashboard = () => {
  // --- STATES QUẢN LÝ RESPONSIVE TRÊN MOBILE/TABLET ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Quản lý đóng/mở Sidebar trượt trên điện thoại

  // --- STATES QUẢN LÝ DỮ LIỆU THẬT ---
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('week'); // Khoảng thời gian lọc: day (Hôm nay), week (Tuần này), month (Tháng này), year (Năm nay)
  const [liveRevenue, setLiveRevenue] = useState(0); // Tổng doanh thu thật lấy từ API của bạn

  // State theo dõi điểm di chuột trên biểu đồ để hiển thị Tooltip động
  const [hoveredBarIndex, setHoveredIndex] = useState(null);

  // Tự động tải Doanh thu thật từ Backend mỗi khi thay đổi khoảng thời gian
  useEffect(() => {
    fetchRealRevenue();
  }, [range]);

  const fetchRealRevenue = async () => {
    setLoading(true);
    try {
      // Gọi đúng API hoạt động thực tế của Backend: POST /api/dashboard/revenue
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/dashboard/revenue`, { range });
      if (response.data && response.data.success) {
        setLiveRevenue(Number(response.data.tongdoanhthu || 0));
      }
    } catch (error) {
      console.error("Lỗi đồng bộ API Doanh thu thật:", error);
      setLiveRevenue(0);
    } finally {
      setLoading(false);
    }
  };

  // Tính toán Lợi nhuận tạm tính 35% doanh thu
  const liveProfit = Math.round(liveRevenue * 0.35);

  // Danh sách metrics tinh giản thành 3 cột Bento cân đối, cao cấp
  const metrics = [
    { 
      id: 1, 
      title: 'Tổng doanh thu', 
      value: loading ? 'Đang tính...' : `${liveRevenue.toLocaleString('vi-VN')}đ`, 
      trend: '+12.5%', 
      isUp: true, 
      icon: 'payments', 
      color: 'primary',
      sparkline: [30, 45, 35, 60, 55, 70, 85] // Biểu đồ sóng mini
    },
    { 
      id: 2, 
      title: 'Hóa đơn trung bình', 
      value: '102.925đ', 
      trend: '-2.1%', 
      isUp: false, 
      icon: 'receipt', 
      color: 'tertiary',
      sparkline: [60, 55, 58, 48, 52, 45, 42]
    },
    { 
      id: 3, 
      title: 'Lợi nhuận (Tạm tính 35%)', 
      value: loading ? 'Đang tính...' : `${liveProfit.toLocaleString('vi-VN')}đ`, 
      trend: '+8.4%', 
      isUp: true, 
      icon: 'trending_up', 
      color: 'secondary',
      sparkline: [25, 30, 40, 38, 50, 48, 65]
    },
  ];

  // Dữ liệu đồ thị sóng thực tế (Mỗi mốc có doanh thu và tọa độ vẽ spline)
  const chartData = [
    { day: 'Thứ 2', revenue: 52000000, profit: 18200000, cx: 50, cy: 190 },
    { day: 'Thứ 3', revenue: 68000000, profit: 23800000, cx: 170, cy: 150 },
    { day: 'Thứ 4', revenue: 58000000, profit: 20300000, cx: 290, cy: 175 },
    { day: 'Thứ 5', revenue: 75000000, profit: 26250000, cx: 410, cy: 130 },
    { day: 'Thứ 6', revenue: 92000000, profit: 32200000, cx: 530, cy: 95 },
    { day: 'Thứ 7', revenue: 115000000, profit: 80500000, cx: 650, cy: 75, highlight: true },
    { day: 'Chủ nhật', revenueHeight: '85%', profitHeight: '75%', revenue: 105000000, profit: 73500000, cx: 770, cy: 45, highlight: true }
  ];

  // Món ăn bán chạy nhất tại cơ sở (Hình ảnh rõ nét chống vỡ)
  const topDishes = [
    { name: 'Salad Cá Hồi Áp Chảo', sales: '342 đ/h', percentage: 92, image: 'https://images.unsplash.com/photo-1560963689-02e820bfceb5?w=200&h=200&fit=crop' },
    { name: 'Steak Thăn Ngoại Bò Mỹ', sales: '215 đ/h', percentage: 75, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=150&h=150&fit=crop' },
  ];

  const getColorClasses = (colorName) => {
    switch(colorName) {
      case 'primary': return 'bg-primary/10 text-primary';
      case 'secondary': return 'bg-secondary/10 text-secondary';
      case 'tertiary': return 'bg-tertiary/10 text-tertiary';
      default: return 'bg-neutralCustom/10 text-neutralCustom';
    }
  };

  return (
    <div className={`
      bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden relative
      
      /* 🌟 1. ĐỊNH DẠNG IN ẤN */
      print:bg-white
      [&_aside]:print:hidden [&_header]:print:hidden [&_nav]:print:hidden [&_select]:print:hidden [&_button]:print:hidden [&_.no-print]:print:hidden
      [&_main]:print:ml-0 [&_main]:print:p-0 [&_main]:print:w-full

      /* 🌟 2. HỖ TRỢ ĐA THIẾT BỊ CHO SIDEBAR CON (Screen < 1024px) */
      [&_aside]:max-lg:-translate-x-full [&_aside]:max-lg:transition-transform [&_aside]:max-lg:duration-300 [&_aside]:max-lg:ease-in-out [&_aside]:max-lg:z-50
      ${isSidebarOpen ? '[&_aside]:max-lg:translate-x-0' : ''}

      /* 🌟 3. HỖ TRỢ ĐA THIẾT BỊ CHO HEADER CON (Screen < 1024px) */
      [&_header]:max-lg:w-full [&_header]:max-lg:left-0 [&_header]:max-lg:px-4
    `}>

      <AdminSidebar currentTab="dashboard" />
      <AdminHeader />

      {/* Lớp phủ mờ nền khi mở Sidebar trên Mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
        ></div>
      )}

      {/* 3. KHU VỰC NỘI DUNG CHÍNH (MAIN) */}
      <main className="ml-64 max-lg:ml-0 pt-24 p-8 max-lg:p-5 w-full transition-all duration-300 flex flex-col gap-6">
        
        {/* Header Section */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-neutralCustom/25 bg-white text-gray-700 active:scale-95 transition-transform flex items-center justify-center shadow-sm"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight text-[26px]">Báo cáo doanh thu</h2>
              <p className="text-neutralCustom text-xs sm:text-sm mt-0.5">Tổng quan hiệu suất kinh doanh thực tế từ hóa đơn</p>
            </div>
          </div>
          
          {/* Cặp nút select và In hóa đơn thẳng hàng h-[42px] */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto self-stretch sm:self-auto shrink-0 justify-end flex-nowrap">
            <select 
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-white border border-neutralCustom/20 text-xs sm:text-sm font-bold text-gray-700 px-4 rounded-xl shadow-sm outline-none focus:border-primary transition-colors cursor-pointer h-[42px] min-w-[110px] sm:min-w-[130px] flex items-center"
            >
              <option value="day">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="year">Năm nay</option>
            </select>
            
            <button 
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 px-5 bg-primary text-white rounded-xl font-bold hover:bg-secondary transition-all shadow-md active:scale-95 text-xs sm:text-sm h-[42px] whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
              <span>In hóa đơn</span>
            </button>
          </div>
        </section>

        {/* */}
        {/* Bento Grid Metrics: Chia thành 3 cột Bento cân đối, sang trọng */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((metric) => (
            <div key={metric.id} className="bg-white p-5 rounded-2xl border border-neutralCustom/15 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className={`material-symbols-outlined p-2.5 rounded-xl ${getColorClasses(metric.color)}`}>
                  {metric.icon}
                </span>
                <span className={`font-black text-xs px-2.5 py-1 rounded-lg ${metric.isUp ? 'text-green-600 bg-green-50 border border-green-150' : 'text-red-500 bg-red-50 border border-red-150'}`}>
                  {metric.trend}
                </span>
              </div>
              <div className="mt-5 flex justify-between items-end">
                <div>
                  <p className="text-neutralCustom text-[10px] font-bold uppercase tracking-widest">{metric.title}</p>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{metric.value}</h3>
                </div>
                {/* Sparkline sóng mini góc phải */}
                <div className="w-16 h-8 opacity-80">
                  <svg className="w-full h-full" viewBox="0 0 70 30">
                    <path
                      d={`M ${metric.sparkline.map((val, idx) => `${idx * 11},${30 - (val / 100) * 25}`).join(' L ')}`}
                      fill="none"
                      stroke={metric.isUp ? "#30d158" : "#ff453a"}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* */}
        {/* 🌟 BIỂU ĐỒ XU HƯỚNG DOANH THU: THIẾT KẾ DẠNG SÓNG GRADIENT CỰC KỲ SANG TRỌNG */}
        <div className="bg-white p-6 rounded-2xl border border-neutralCustom/15 shadow-sm flex flex-col justify-between relative">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[17px] font-bold text-gray-900">Xu hướng doanh thu</h3>
              <p className="text-neutralCustom text-[11px] mt-0.5">Biểu đồ biểu diễn dòng tiền luân chuyển 7 ngày gần đây nhất</p>
            </div>
            <div className="flex gap-4 text-xs font-bold text-neutralCustom">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary"></span> Doanh thu</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#fca5a5]"></span> Lợi nhuận ròng</span>
            </div>
          </div>
          
          {/* Biểu đồ Sóng Spline Area SVG */}
          <div className="relative h-64 w-full flex items-end">
            <svg className="w-full h-full" viewBox="0 0 820 220" preserveAspectRatio="none">
              <defs>
                {/* Khai báo Gradient chuyển sắc cho Doanh thu */}
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6b00" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#ff6b00" stopOpacity="0.0"/>
                </linearGradient>
                {/* Khai báo Gradient chuyển sắc cho Lợi nhuận */}
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#fca5a5" stopOpacity="0.0"/>
                </linearGradient>
              </defs>

              {/* Đường lưới kẻ ngang */}
              <line x1="0" y1="220" x2="820" y2="220" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="165" x2="820" y2="165" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="110" x2="820" y2="110" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="55" x2="820" y2="55" stroke="#f1f5f9" strokeWidth="1" />
              
              {/* 1. Mảng Lợi nhuận tạm tính (Area dưới mờ hơn) */}
              <path 
                d="M 50,220 L 50,150 Q 110,135 170,120 Q 230,135 290,145 Q 350,115 410,100 Q 470,90 530,85 Q 590,70 650,60 Q 710,65 770,75 L 770,220 Z" 
                fill="url(#profitGrad)"
              />
              <path 
                d="M 50,150 Q 110,135 170,120 Q 230,135 290,145 Q 350,115 410,100 Q 470,90 530,85 Q 590,70 650,60 Q 710,65 770,75" 
                fill="none" 
                stroke="#fca5a5" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />

              {/* 2. Mảng Doanh thu (Area chính cam rực rỡ) */}
              <path 
                d="M 50,220 L 50,110 Q 110,85 170,70 Q 230,95 290,105 Q 350,75 410,50 Q 470,45 530,40 Q 590,25 650,20 Q 710,25 770,30 L 770,220 Z" 
                fill="url(#revenueGrad)"
              />
              <path 
                d="M 50,110 Q 110,85 170,70 Q 230,95 290,105 Q 350,75 410,50 Q 470,45 530,40 Q 590,25 650,20 Q 710,25 770,30" 
                fill="none" 
                stroke="#ff6b00" 
                strokeWidth="3.5" 
                strokeLinecap="round"
              />

              {/* Đường dóng dọc khi hover chuột vào từng cột điểm mốc */}
              {hoveredBarIndex !== null && (
                <line 
                  x1={chartData[hoveredBarIndex].cx || (50 + hoveredBarIndex * 120)} 
                  y1="10" 
                  x2={chartData[hoveredBarIndex].cx || (50 + hoveredBarIndex * 120)} 
                  y2="220" 
                  stroke="#ff6b00" 
                  strokeWidth="1" 
                  strokeDasharray="4 4"
                />
              )}

              {/* Các điểm mốc tròn phát sáng (Anchor Dots) */}
              {chartData.map((data, idx) => {
                const x = data.cx || (50 + idx * 120);
                // Giả định tọa độ y tương thích tỉ lệ
                const yPositions = [110, 70, 105, 50, 40, 20, 30];
                const y = yPositions[idx];
                
                return (
                  <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
                    {/* Vòng hào quang phát sáng ngoài khi hover */}
                    {hoveredBarIndex === idx && (
                      <circle cx={x} cy={y} r="10" fill="#ff6b00" fillOpacity="0.15" />
                    )}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={hoveredBarIndex === idx ? "6" : "4"} 
                      fill="#ffffff" 
                      stroke="#ff6b00" 
                      strokeWidth={hoveredBarIndex === idx ? "3" : "2"} 
                    />
                  </g>
                );
              })}
            </svg>

            {/* 🌟 Hộp thoại thông tin nổi tương tác thời gian thực khi rê chuột qua đồ thị */}
            {hoveredBarIndex !== null && (
              <div 
                className="absolute bg-gray-950 text-white rounded-xl p-3 shadow-xl pointer-events-none text-xs flex flex-col gap-1 border border-white/10 animate-fade-in"
                style={{ 
                  left: `${(chartData[hoveredBarIndex].cx || (50 + hoveredBarIndex * 120)) / 820 * 90}%`,
                  bottom: '80px',
                  transform: 'translateX(-50%)'
                }}
              >
                <p className="font-black text-[10px] text-gray-400 uppercase tracking-widest">{chartData[hoveredBarIndex].day}</p>
                <p className="flex justify-between gap-5 font-semibold mt-1">Doanh thu: <b className="text-primary">{chartData[hoveredBarIndex].revenue ? chartData[hoveredBarIndex].revenue.toLocaleString('vi-VN') + 'đ' : chartData[hoveredBarIndex].value}</b></p>
                <p className="flex justify-between gap-5 font-semibold text-gray-300">Lợi nhuận ròng: <b>{chartData[hoveredBarIndex].profit ? chartData[hoveredBarIndex].profit.toLocaleString('vi-VN') + 'đ' : '---'}</b></p>
              </div>
            )}
          </div>
          
          {/* Trục X nhãn các ngày dưới chân biểu đồ */}
          <div className="flex justify-between mt-5 text-neutralCustom text-xs font-bold uppercase tracking-wider px-4">
            {chartData.map((d, idx) => <span key={idx} className="truncate max-sm:max-w-[42px]">{d.day}</span>)}
          </div>
        </div>

        {/* */}
        {/* 🌟 MÓN ĂN BÁN CHẠY NHẤT: THIẾT KẾ GRID CARD THOÁNG ĐÃNG CHỐNG TRÀN */}
        <div className="bg-white p-6 rounded-2xl border border-neutralCustom/15 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Món ăn bán chạy hàng đầu</h3>
          <p className="text-neutralCustom text-xs uppercase tracking-wider font-bold mb-6">Xếp hạng theo số lượng phần ăn xuất quầy</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {topDishes.map((dish, idx) => (
              <div key={idx} className="flex items-center gap-5 bg-culinaryBg/20 p-4 rounded-2xl border border-neutralCustom/10">
                {/* Bo tròn ảnh hoàn mỹ bằng rounded-xl và chống biến dạng bằng object-cover */}
                <img className="w-16 h-16 rounded-xl object-cover shadow-sm border border-neutralCustom/10 shrink-0" src={dish.image} alt={dish.name}/>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-gray-900 truncate pr-3">{dish.name}</span>
                    <span className="text-primary font-black text-sm whitespace-nowrap">{dish.sales}</span>
                  </div>
                  <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-neutralCustom/15">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${dish.percentage}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;