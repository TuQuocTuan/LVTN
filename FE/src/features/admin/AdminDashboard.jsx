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

  // States cho danh sách báo cáo kết ca
  const [shiftReportsList, setShiftReportsList] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportsSearchTerm, setReportsSearchTerm] = useState('');
  const [reportsCurrentPage, setReportsCurrentPage] = useState(1);
  const reportsItemsPerPage = 5;

  /* STREAMING_CHUNK: Gọi các API doanh thu thực tế khi thay đổi khoảng thời gian bộ lọc */
  useEffect(() => {
    fetchRealRevenue();
    fetchWeeklyChartData();
    fetchShiftReports();
  }, [range]);

  const fetchShiftReports = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/shift-reports`);
      if (response.data && response.data.success && response.data.data) {
        setShiftReportsList(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi đồng bộ danh sách kết ca:", error);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '---';
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} - ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

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
      <main className="ml-64 max-lg:ml-0 pt-20 p-6 max-lg:p-5 lg:w-[calc(100%-16rem)] w-full transition-all duration-300 flex flex-col gap-6">
        
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

        {/* NHẬT KÝ KẾT CA CỦA THU NGÂN */}
        {(() => {
          const getFilteredReports = () => {
            return shiftReportsList.filter(r => {
              const matchName = (r.users?.fullname || '').toLowerCase().includes(reportsSearchTerm.toLowerCase()) ||
                (r.users?.username || '').toLowerCase().includes(reportsSearchTerm.toLowerCase());
              return matchName;
            });
          };

          const filteredReports = getFilteredReports();
          const totalPages = Math.ceil(filteredReports.length / reportsItemsPerPage);
          const currentReports = filteredReports.slice((reportsCurrentPage - 1) * reportsItemsPerPage, reportsCurrentPage * reportsItemsPerPage);

          return (
            <div className="bg-white p-6 rounded-2xl border border-neutralCustom/15 shadow-sm flex flex-col mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Nhật ký Kết ca của Thu ngân</h3>
                  <p className="text-neutralCustom text-xs mt-0.5">Danh sách các ca làm việc đã đóng két và xác nhận doanh thu</p>
                </div>
                
                <div className="relative w-full sm:max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutralCustom text-xl">search</span>
                  <input
                    type="text"
                    placeholder="Tìm tên thu ngân..."
                    value={reportsSearchTerm}
                    onChange={(e) => { setReportsSearchTerm(e.target.value); setReportsCurrentPage(1); }}
                    className="w-full bg-gray-50 border border-neutralCustom/20 text-xs rounded-xl pl-10 pr-4 py-2 outline-none focus:border-primary focus:bg-white transition-all text-gray-900 font-medium"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-culinaryBg/50 text-neutralCustom border-b border-neutralCustom/20 text-[11px] uppercase tracking-wider font-bold">
                      <th className="px-5 py-3 whitespace-nowrap">Người kết ca</th>
                      <th className="px-5 py-3 whitespace-nowrap">Thời gian kết thúc</th>
                      <th className="px-5 py-3 whitespace-nowrap text-right">Tiền mặt đầu ca</th>
                      <th className="px-5 py-3 whitespace-nowrap text-right">Doanh thu bán</th>
                      <th className="px-5 py-3 whitespace-nowrap text-right">Tổng trong két</th>
                      <th className="px-5 py-3 whitespace-nowrap text-center">Số đơn hàng</th>
                      <th className="px-5 py-3 whitespace-nowrap text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutralCustom/10 text-xs">
                    {currentReports.length > 0 ? (
                      currentReports.map((report) => (
                        <tr key={report.id} className="hover:bg-culinaryBg/30 transition-colors group">
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <p className="font-bold text-gray-900">{report.users?.fullname || 'Ẩn danh'}</p>
                            <p className="text-[10px] text-neutralCustom mt-0.5 font-mono">@{report.users?.username || 'no-username'}</p>
                          </td>
                          <td className="px-5 py-3.5 text-neutralCustom whitespace-nowrap">
                            {formatDate(report.created_at)}
                          </td>
                          <td className="px-5 py-3.5 text-gray-900 text-right whitespace-nowrap font-medium">
                            {Number(report.initial_amount || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-5 py-3.5 text-green-600 text-right whitespace-nowrap font-bold">
                            +{Number(report.revenue_amount || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-5 py-3.5 text-primary text-right whitespace-nowrap font-black">
                            {Number(report.total_amount || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-5 py-3.5 text-gray-800 text-center whitespace-nowrap font-semibold">
                            {report.total_orders} đơn
                          </td>
                          <td className="px-5 py-3.5 text-center whitespace-nowrap">
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="px-3 py-1.5 bg-primary/10 text-primary font-bold rounded-lg border border-primary/20 hover:bg-primary hover:text-white transition-all text-[11px] flex items-center gap-1.5 mx-auto active:scale-95 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">receipt_long</span>
                              Xem Bill
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-neutralCustom italic bg-gray-50/50">Không tìm thấy báo cáo kết ca nào.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Phân trang */}
              {filteredReports.length > 0 && (
                <div className="p-4 border-t border-neutralCustom/10 flex justify-center items-center text-xs mt-2 shrink-0">
                  <div className="flex gap-2">
                    <button onClick={() => setReportsCurrentPage(prev => prev - 1)} disabled={reportsCurrentPage === 1} className="p-1 border border-neutralCustom/20 rounded-lg hover:bg-stone-50 text-neutralCustom disabled:opacity-50"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button key={page} onClick={() => setReportsCurrentPage(page)} className={`px-2.5 py-1 rounded-lg ${reportsCurrentPage === page ? 'bg-primary text-white font-bold' : 'hover:bg-stone-50 text-neutralCustom'}`}>{page}</button>
                    ))}
                    <button onClick={() => setReportsCurrentPage(prev => prev + 1)} disabled={reportsCurrentPage === totalPages || totalPages === 0} className="p-1 border border-neutralCustom/20 rounded-lg hover:bg-stone-50 text-neutralCustom disabled:opacity-50"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      </main>

      {/* MODAL XEM CHI TIẾT BILL KẾT CA */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedReport(null)}>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up border border-neutralCustom/10" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
                Hóa đơn kết ca
              </span>
              <button onClick={() => setSelectedReport(null)} className="text-neutralCustom hover:text-gray-900 p-1 rounded-full hover:bg-gray-200 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 bg-stone-100 flex justify-center items-center overflow-y-auto max-h-[60vh] w-full">
              <div className="bg-white p-5 w-full shadow-md border-t-8 border-primary rounded-b-xl font-mono text-[11px] text-gray-800 select-none">
                <div className="text-center mb-4">
                  <h3 className="text-sm font-bold text-gray-900">LÀNG MÌXI BBQ</h3>
                  <p className="text-[10px] mt-0.5">BÁO CÁO KẾT CA LÀM VIỆC</p>
                  <p className="text-[9px] text-neutralCustom mt-1">-----------------------------</p>
                </div>
                
                <div className="space-y-1.5">
                  <p>Thời gian in: {new Date(selectedReport.created_at).toLocaleString('vi-VN')}</p>
                  <p>Thu ngân: {selectedReport.users?.fullname || 'Ẩn danh'}</p>
                  <p>Tổng số đơn hàng: {selectedReport.total_orders} đơn</p>
                  <p className="text-[9px] text-neutralCustom">-----------------------------</p>
                  
                  <div className="flex justify-between">
                    <span>Tiền đầu ca:</span>
                    <span>{Number(selectedReport.initial_amount || 0).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Doanh thu:</span>
                    <span>{Number(selectedReport.revenue_amount || 0).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <p className="text-[9px] text-neutralCustom">-----------------------------</p>
                  <div className="flex justify-between font-bold text-gray-900 text-xs">
                    <span>TỔNG TRONG KÉT:</span>
                    <span>{Number(selectedReport.total_amount || 0).toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <p className="font-bold text-[10px] uppercase">XÁC NHẬN CỦA QUẢN LÝ</p>
                  <br /><br /><br />
                  <p className="text-[9px] text-neutralCustom">(Ký và ghi rõ họ tên)</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2.5">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const thoigianin = new Date(selectedReport.created_at).toLocaleString('vi-VN');
                  const html_bill = `
                  <!DOCTYPE html>
                  <html>
                  <head>
                      <style>
                          @page {
                              size: 80mm auto;
                              margin: 0;
                          }
                          html, body {
                              margin: 0;
                              padding: 0;
                              width: 80mm;
                              height: auto;
                              background-color: #fff;
                          }
                          body {
                              font-family: 'Arial', sans-serif;
                              font-size: 12px;
                              padding: 8px;
                              box-sizing: border-box;
                          }
                          .text-center { text-align: center; }
                          .bold { font-weight: bold; }
                          .divider { border-top: 1px dashed #000; margin: 10px 0; }
                          table { width: 100%; border-collapse: collapse; }
                          .text-right { text-align: right; }
                      </style>
                  </head>
                  <body>
                      <div class="text-center">
                          <h3 style="margin: 0; font-size: 16px;">MÌXI</h3>
                          <p style="margin: 5px 0;" class="bold">BÁO CÁO KẾT CA</p>
                      </div>
                      <div class="divider"></div>
                      <p>Thời gian in: ${thoigianin}</p>
                      <p>Thu ngân: ${selectedReport.users?.fullname || 'Ẩn danh'}</p>
                      <p>Tổng số đơn hàng: ${selectedReport.total_orders}</p>
                      <div class="divider"></div>
                      <table>
                          <tr>
                              <td>Tiền đầu ca:</td>
                              <td class="text-right">${Number(selectedReport.initial_amount || 0).toLocaleString('vi-VN')}đ</td>
                          </tr>
                          <tr>
                              <td>Tổng doanh thu:</td>
                              <td class="text-right">${Number(selectedReport.revenue_amount || 0).toLocaleString('vi-VN')}đ</td>
                          </tr>
                          <tr class="bold" style="font-size: 14px;">
                              <td>TỔNG TRONG KÉT:</td>
                              <td class="text-right">${Number(selectedReport.total_amount || 0).toLocaleString('vi-VN')}đ</td>
                          </tr>
                      </table>
                      <div class="divider"></div>
                      <div class="text-center bold">XÁC NHẬN CỦA QUẢN LÝ</div>
                      <br><br><br><br>
                      <div class="text-center">(Ký và ghi rõ họ tên)</div>
                  </body>
                  </html>
                  `;
                  const iframe = document.createElement('iframe');
                  iframe.style.display = 'none';
                  document.body.appendChild(iframe);
                  const doc = iframe.contentWindow.document;
                  doc.open();
                  doc.write(html_bill);
                  doc.close();
                  setTimeout(() => {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                    setTimeout(() => document.body.removeChild(iframe), 2000);
                  }, 500);
                }}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-secondary transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                In hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;