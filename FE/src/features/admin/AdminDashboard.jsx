import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import axios from 'axios';

const AdminDashboard = () => {
  /* STREAMING_CHUNK: Quản lý trạng thái mở sidebar trên di động và loading dữ liệu */
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Quản lý đóng/mở Sidebar trượt trên điện thoại
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('week'); // Khoảng thời gian lọc: day, week, month, year
  const [liveRevenue, setLiveRevenue] = useState(0); // Tổng doanh thu thật bốc từ API
  
  // Dữ liệu đồ thị cột thực tế được render tự động từ API tuần của Tuấn
  const [weeklyData, setWeeklyData] = useState([]);
  const [hoveredBarIndex, setHoveredIndex] = useState(null);

  /* STREAMING_CHUNK: Gọi các API doanh thu thực tế khi thay đổi khoảng thời gian bộ lọc */
  useEffect(() => {
    fetchRealRevenue();
    fetchWeeklyChartData();
  }, [range]);

  // Giao dịch gọi API lấy tổng doanh thu theo khoảng thời gian chọn lọc
  const fetchRealRevenue = async () => {
    setLoading(true);
    try {
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

  /* STREAMING_CHUNK: Lấy dữ liệu doanh thu từng ngày trong tuần từ API */
  const fetchWeeklyChartData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/dashboard/revenue-week`);
      if (response.data && response.data.success && response.data.data) {
        const rawData = response.data.data;
        const maxVal = Math.max(...rawData.map(item => item.total)) || 1;

        // Chuyển đổi dữ liệu thô từ database thành các điểm cột cân xứng
        const computedData = rawData.map((item, idx) => {
          // Tính toán phần trăm chiều cao cho cột doanh thu thật
          const revPercent = maxVal > 0 ? (item.total / maxVal) * 85 : 0;
          // Lợi nhuận tạm tính 35% của ngày đó
          const profit = Math.round(item.total * 0.35);
          const profPercent = maxVal > 0 ? (profit / maxVal) * 85 : 0;

          return {
            day: item.day_name,
            revenue: item.total,
            profit: profit,
            revenueHeight: item.total > 0 ? `${Math.max(revPercent, 6)}%` : '4%',
            profitHeight: profit > 0 ? `${Math.max(profPercent, 3)}%` : '2%',
            highlight: item.total === maxVal && maxVal > 0
          };
        });

        setWeeklyData(computedData);
      }
    } catch (error) {
      console.error("Gặp sự cố khi đồng bộ API tuần của Tuấn:", error);
      setWeeklyData([]);
    }
  };

  const liveProfit = Math.round(liveRevenue * 0.35);

  /* STREAMING_CHUNK: Thiết lập mảng chỉ số Bento Metrics tích hợp biểu đồ Sparklines mini */
  const metrics = [
    { 
      id: 1, 
      title: 'Tổng doanh thu', 
      value: loading ? 'Đang tính...' : `${liveRevenue.toLocaleString('vi-VN')}đ`, 
      trend: '+12.5%', 
      isUp: true, 
      icon: 'payments', 
      color: 'primary',
      sparkline: [30, 45, 35, 60, 55, 70, 85]
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

  const topDishes = [
    { name: 'Salad Cá Hồi Áp Chảo', sales: '342 đ/h', percentage: 92, image: 'https://images.unsplash.com/photo-1560963689-02e820bfceb5?w=200&h=200&fit=crop' },
    { name: 'Steak Thăn Ngoại Bò Mỹ', sales: '215 đ/h', percentage: 75, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=150&h=150&fit=crop' },
  ];

  /* STREAMING_CHUNK: Nâng cấp thiết kế Excel (tăng font-size lên 15px, tăng padding và độ rộng ô) */
  const handleExportExcel = () => {
    // Chỉnh sửa giao diện bên trong bảng tính Excel: To ra, chữ rõ ràng hơn
    const styles = `
      <style>
        table { border-collapse: collapse; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
        td, th { padding: 14px 20px; border: 1px solid #cbd5e1; font-size: 15px; } /* Tăng font-size lên 15px, padding rộng rãi */
        .title-row { font-size: 22px; font-weight: bold; color: #ff6b00; padding: 18px 0; text-align: left; } /* Tiêu đề to 22px */
        .meta-label { background-color: #f8fafc; font-weight: bold; color: #475569; width: 240px; font-size: 15px; }
        .meta-val { color: #0f172a; font-weight: bold; font-size: 15px; }
        .header-row { background-color: #ff6b00; color: #ffffff; font-weight: bold; text-align: center; font-size: 15px; }
        .row-even { background-color: #ffffff; }
        .row-odd { background-color: #fdfaf6; }
        .number-cell { text-align: right; font-family: Consolas, monospace; font-size: 15px; }
        .grand-total { background-color: #ffedd5; font-weight: bold; color: #ea580c; font-size: 16px; }
        .spacer { border: none; height: 20px; }
      </style>
    `;

    // Thiết kế cấu trúc bảng Excel chuyên nghiệp có tổ chức phân vùng rõ rệt
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        ${styles}
      </head>
      <body>
        <table>
          <tr>
            <td colspan="3" class="title-row">BÁO CÁO DOANH THU HOẠT ĐỘNG - LÀNG MÌXI BBQ</td>
          </tr>
          <tr>
            <td class="meta-label">Thời điểm xuất báo cáo:</td>
            <td colspan="2" class="meta-val">${new Date().toLocaleString('vi-VN')}</td>
          </tr>
          <tr>
            <td class="meta-label">Bộ lọc khoảng thời gian:</td>
            <td colspan="2" class="meta-val">${range === 'day' ? 'Hôm nay' : range === 'week' ? 'Tuần này' : range === 'month' ? 'Tháng này' : 'Năm nay'}</td>
          </tr>
          <tr>
            <td class="meta-label">Tổng doanh thu lũy kế:</td>
            <td colspan="2" class="meta-val" style="color: #ff6b00;">${liveRevenue.toLocaleString('vi-VN')} đ</td>
          </tr>
          <tr>
            <td class="meta-label">Lợi nhuận tạm tính (35%):</td>
            <td colspan="2" class="meta-val" style="color: #2b6cb0;">${liveProfit.toLocaleString('vi-VN')} đ</td>
          </tr>
          <tr class="spacer"><td colspan="3" class="spacer"></td></tr>
          <tr>
            <td colspan="3" style="font-weight: bold; font-size: 15px; color: #1e293b; padding-bottom: 8px;">CHI TIẾT PHÂN TÍCH DOANH SỐ THEO NGÀY TRONG TUẦN</td>
          </tr>
          <tr class="header-row">
            <td>Thứ</td>
            <td>Doanh thu thật (đ)</td>
            <td>Lợi nhuận ròng tạm tính 35% (đ)</td>
          </tr>
    `;

    // Nạp dữ liệu các hàng trong tuần với màu so le đẹp mắt
    weeklyData.forEach((row, index) => {
      const rowClass = index % 2 === 0 ? 'row-even' : 'row-odd';
      html += `
        <tr class="${rowClass}">
          <td style="font-weight: bold; color: #334155;">${row.day}</td>
          <td class="number-cell">${Number(row.revenue).toLocaleString('vi-VN')} đ</td>
          <td class="number-cell">${Number(row.profit).toLocaleString('vi-VN')} đ</td>
        </tr>
      `;
    });

    // Tính toán và thêm dòng tổng hợp lũy kế cuối Excel
    const totalRev = weeklyData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalProf = weeklyData.reduce((acc, curr) => acc + curr.profit, 0);
    html += `
          <tr class="grand-total">
            <td>TỔNG CỘNG TUẦN</td>
            <td class="number-cell">${totalRev.toLocaleString('vi-VN')} đ</td>
            <td class="number-cell">${totalProf.toLocaleString('vi-VN')} đ</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Xuất file .xls chuẩn chỉnh mã hóa UTF-8 BOM chống vỡ tiếng Việt
    const blob = new Blob(["\uFEFF" + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_tai_chinh_${range}_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      
      /* RESPONSIVE CHO SIDEBAR CON (Screen < 1024px) */
      [&_aside]:max-lg:-translate-x-full [&_aside]:max-lg:transition-transform [&_aside]:max-lg:duration-300 [&_aside]:max-lg:ease-in-out [&_aside]:max-lg:z-50
      ${isSidebarOpen ? '[&_aside]:max-lg:translate-x-0' : ''}

      /* HỖ TRỢ ĐA THIẾT BỊ CHO HEADER CON (Screen < 1024px) */
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
          
          {/* Cặp nút select và Xuất Excel thẳng hàng h-[42px] */}
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
            
            {/* NÚT XUẤT FILE EXCEL: MÀU XANH LÁ SOLID, HOVER ĐẬM, KHÔNG TRONG SUỐT */}
            <button 
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 text-xs sm:text-sm h-[42px] whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[20px]">download_for_offline</span>
              <span>Xuất file Excel</span>
            </button>
          </div>
        </section>

        {/* Bento Grid Metrics */}
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
                {/* Sparkline sóng mini */}
                <div className="w-16 h-8 opacity-80">
                  <svg className="w-full h-full" viewBox="0 0 70 30">
                    <path
                      d={`M ${metric.sparkline.map((val, idx) => `${idx * 11},${30 - (val / 100) * 25}`).join(' L ')}`}
                      fill="none"
                      stroke={metric.isUp ? "#16a34a" : "#dc2626"}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* BIỂU ĐỒ XU HƯỚNG DOANH THU: ĐÃ THAY ĐỔI THÀNH BIỂU ĐỒ CỘT KÉP (REVENUE & PROFIT) SIÊU ĐẸP */}
        <div className="bg-white p-6 rounded-2xl border border-neutralCustom/15 shadow-sm flex flex-col justify-between relative">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[17px] font-bold text-gray-900">Xu hướng doanh thu</h3>
              <p className="text-neutralCustom text-[11px] mt-0.5">Biểu đồ biểu diễn dòng tiền tuần này của Làng MÌXI</p>
            </div>
            <div className="flex gap-4 text-xs font-bold text-neutralCustom">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary"></span> Doanh thu thật</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#fca5a5]"></span> Lợi nhuận ròng</span>
            </div>
          </div>
          
          {/* Biểu đồ cột kép 3D-like thích ứng bề ngang */}
          <div className="relative h-64 w-full flex items-end justify-between px-2 sm:px-6 mt-4">
            {/* Đường lưới mỏng */}
            <div className="absolute inset-0 border-b border-neutralCustom/10 pointer-events-none"></div>
            <div className="absolute inset-x-0 bottom-1/4 border-b border-neutralCustom/10 pointer-events-none"></div>
            <div className="absolute inset-x-0 bottom-1/2 border-b border-neutralCustom/10 pointer-events-none"></div>
            <div className="absolute inset-x-0 bottom-3/4 border-b border-neutralCustom/10 pointer-events-none"></div>

            {weeklyData.length > 0 ? (
              weeklyData.map((data, idx) => (
                <div 
                  key={idx} 
                  className="flex flex-col justify-end items-center h-full relative group cursor-pointer"
                  style={{ width: `${100 / weeklyData.length}%` }} // Phân tách đều bằng 100/7
                  onMouseEnter={() => setHoveredIndex(idx)} 
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Nhóm cột kép (Doanh thu & Lợi nhuận nằm sát nhau) */}
                  <div className="flex items-end justify-center gap-1.5 sm:gap-2 h-full w-full relative pb-1">
                    {/* Cột Lợi nhuận ròng tạm tính 35% (Màu hồng cam thanh lịch) */}
                    <div 
                      className="w-2.5 sm:w-4 bg-[#fca5a5]/80 hover:bg-[#fca5a5] rounded-t-md transition-all duration-300"
                      style={{ height: data.profitHeight }}
                    ></div>
                    {/* Cột Doanh thu thật (Màu cam đậm rực rỡ) */}
                    <div 
                      className={`w-2.5 sm:w-4 rounded-t-md transition-all duration-300 ${
                        data.highlight ? 'bg-primary shadow-lg scale-x-105' : 'bg-primary/75 hover:bg-primary'
                      }`}
                      style={{ height: data.revenueHeight }}
                    ></div>
                  </div>

                  {/* Tooltip hiển thị số tiền thật khi hover */}
                  {hoveredBarIndex === idx && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-950 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl pointer-events-none z-20 whitespace-nowrap">
                      DT: {Number(data.revenue).toLocaleString('vi-VN')}đ
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-950 rotate-45"></div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-neutralCustom/25 rounded-2xl p-6 bg-gray-50/50">
                <span className="material-symbols-outlined text-4xl text-neutralCustom/40 mb-2">bar_chart</span>
                <p className="text-xs text-neutralCustom font-bold">Chưa có dữ liệu doanh thu tuần này</p>
              </div>
            )}
          </div>
          
          {/* ĐỒNG BỘ TOÁN HỌC TRỤC X: Phân chia chiều rộng và padding giống hệt biểu đồ cột để thẳng hàng tăm tắp */}
          <div className="flex w-full mt-5 text-neutralCustom text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 sm:px-6">
            {weeklyData.map((d, idx) => (
              <span 
                key={idx} 
                className="text-center truncate" 
                style={{ width: `${100 / weeklyData.length}%` }} // Đồng bộ width 100/7
              >
                {d.day}
              </span>
            ))}
          </div>
        </div>

        {/* MÓN ĂN BÁN CHẠY NHẤT: THIẾT KẾ GRID CARD THOÁNG ĐÃNG */}
        <div className="bg-white p-6 rounded-2xl border border-neutralCustom/15 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Món ăn bán chạy hàng đầu</h3>
          <p className="text-neutralCustom text-xs uppercase tracking-wider font-bold mb-6">Xếp hạng theo số lượng phần ăn xuất quầy</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {topDishes.map((dish, idx) => (
              <div key={idx} className="flex items-center gap-5 bg-culinaryBg/20 p-4 rounded-2xl border border-neutralCustom/10">
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