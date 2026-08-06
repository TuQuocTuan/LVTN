import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import axios from 'axios';

const AdminDashboard = () => {
  /* STREAMING_CHUNK: Quản lý trạng thái mở sidebar trên di động và loading dữ liệu */
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Quản lý đóng/mở Sidebar trượt trên điện thoại
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('day'); // Khoảng thời gian lọc: day, week, month, year
  const [liveRevenue, setLiveRevenue] = useState(0); // Tổng doanh thu thật bốc từ API
  const [costRevenue, setCostRevenue] = useState(0); // Tổng tiền vốn bốc từ API
  const [wasteRevenue, setWasteRevenue] = useState(0); // Tổng tiền hủy nguyên liệu bốc từ API
  const [realRevenue, setRealRevenue] = useState(0); // Doanh thu thực tế (Lợi nhuận ròng) bốc từ API
  const [cashRevenue, setCashRevenue] = useState(0); // Doanh thu tiền mặt
  const [transferRevenue, setTransferRevenue] = useState(0); // Doanh thu chuyển khoản (VNPAY)
  const [liveAverageBill, setLiveAverageBill] = useState(0); // Hóa đơn trung bình

  // Dữ liệu đồ thị cột thực tế được render tự động từ API tuần
  const [weeklyData, setWeeklyData] = useState([]);
  const [hoveredBar, setHoveredBar] = useState(null);

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

  // Giao dịch gọi API lấy tổng doanh thu và tiền vốn theo khoảng thời gian chọn lọc
  const fetchRealRevenue = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/dashboard/revenue`, { range });
      if (response.data && response.data.success) {
        setLiveRevenue(Number(response.data.tongdoanhthu || 0));
        setCostRevenue(Number(response.data.tongcost || 0));
        setWasteRevenue(Number(response.data.tongtienhuy || 0));
        setRealRevenue(Number(response.data.doanhthuthucte || 0));
        setCashRevenue(Number(response.data.tongtienmat || 0));
        setTransferRevenue(Number(response.data.tongchuyenkhoan || 0));
        setLiveAverageBill(Number(response.data.averageBill || 0)); // Lấy hóa đơn trung bình thực tế từ BE
      }
    } catch (error) {
      console.error("Lỗi đồng bộ API Doanh thu thật:", error);
      setLiveRevenue(0);
      setCostRevenue(0);
      setWasteRevenue(0);
      setRealRevenue(0);
      setCashRevenue(0);
      setTransferRevenue(0);
      setLiveAverageBill(0);
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
          const revPercent = maxVal > 0 ? (item.total / maxVal) * 85 : 0;
          const profit = item.doanhthuthucte || 0;
          const profPercent = maxVal > 0 ? (profit / maxVal) * 85 : 0;

          return {
            day: item.day_name,
            revenue: item.total,
            cost: item.cost || 0,
            waste: item.waste || 0,
            profit: profit,
            revenueHeight: item.total > 0 ? `${Math.max(revPercent, 6)}%` : '4%',
            profitHeight: profit > 0 ? `${Math.max(profPercent, 3)}%` : '2%',
            highlight: item.total === maxVal && maxVal > 0
          };
        });

        setWeeklyData(computedData);
      }
    } catch (error) {
      console.error("Gặp sự cố khi đồng bộ API tuần:", error);
      setWeeklyData([]);
    }
  };

  /* STREAMING_CHUNK: Thiết lập mảng chỉ số tài chính (4 thẻ Bento Card) */
  const metrics = [
    {
      id: 1,
      title: 'Tổng doanh thu',
      value: loading ? 'Đang tính...' : `${liveRevenue.toLocaleString('vi-VN')}đ`,
      isUp: true,
      icon: 'payments',
      color: 'primary',
    },
    {
      id: 2,
      title: 'Tiền vốn bán món',
      value: loading ? 'Đang tính...' : `${costRevenue.toLocaleString('vi-VN')}đ`,
      isUp: false,
      icon: 'account_balance_wallet',
      color: 'amber',
    },
    {
      id: 3,
      title: 'Tiền hủy nguyên liệu',
      value: loading ? 'Đang tính...' : `${wasteRevenue.toLocaleString('vi-VN')}đ`,
      isUp: false,
      icon: 'delete_sweep',
      color: 'orange',
    },
    {
      id: 4,
      title: 'Doanh thu thực tế',
      value: loading ? 'Đang tính...' : `${realRevenue.toLocaleString('vi-VN')}đ`,
      isUp: true,
      icon: 'trending_up',
      color: 'emerald',
    },
  ];

  // HÀM XUẤT BÁO CÁO EXCEL TÀI CHÍNH CHI TIẾT
  const handleExportExcel = () => {
    // 1. Tính tổng doanh thu tuần = Tổng tiền bán hàng của 7 ngày trong tuần cộng lại
    const totalRev = weeklyData.reduce((acc, curr) => acc + curr.revenue, 0);

    // 2. Tính tổng tiền vốn bán món tuần = Tổng giá vốn nguyên liệu tạo nên các món ăn bán ra trong tuần
    const totalCost = weeklyData.reduce((acc, curr) => acc + curr.cost, 0);

    // 3. Tính tổng tiền hủy nguyên liệu tuần = Tổng chi phí nguyên liệu bị hủy của 7 ngày cộng lại
    const totalWaste = weeklyData.reduce((acc, curr) => acc + (curr.waste || 0), 0);

    // 4. Tính tổng lợi nhuận thực tế tuần = (Doanh thu thuần - Tiền vốn bán món - Tiền hủy nguyên liệu) của các ngày cộng lại
    const totalProf = weeklyData.reduce((acc, curr) => acc + curr.profit, 0);

    // 5. Tính Tỷ suất lợi nhuận ròng (%) = (Doanh thu thực tế / Tổng doanh thu) * 100%
    const overallProfitMargin = liveRevenue > 0 ? ((realRevenue / liveRevenue) * 100).toFixed(1) : '0';
    
    // 6. Tính tổng doanh thu nhận qua các kênh thanh toán = Tiền mặt (CASH) + Chuyển khoản (VNPAY)
    const totalPaymentRev = cashRevenue + transferRevenue;

    // 7. Tính tỷ lệ phần trăm (%) doanh thu Tiền mặt = (Tiền mặt / Tổng doanh thu thanh toán) * 100%
    const cashPercent = totalPaymentRev > 0 ? ((cashRevenue / totalPaymentRev) * 100).toFixed(1) : '0';

    // 8. Tính tỷ lệ phần trăm (%) doanh thu Chuyển khoản VNPAY = (Chuyển khoản / Tổng doanh thu thanh toán) * 100%
    const transferPercent = totalPaymentRev > 0 ? ((transferRevenue / totalPaymentRev) * 100).toFixed(1) : '0';

    const styles = `
      <style>
        table { border-collapse: collapse; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        td, th { padding: 6px 12px; border: 1px solid #cbd5e1; font-size: 13px; vertical-align: middle; }
        .title-row { font-size: 18px; font-weight: bold; color: #ea580c; padding: 10px 0; text-align: left; }
        .section-header { font-size: 14px; font-weight: bold; color: #1e293b; background-color: #f1f5f9; padding: 8px 12px; border-left: 4px solid #ea580c; }
        .meta-label { background-color: #f8fafc; font-weight: bold; color: #475569; width: 220px; font-size: 13px; text-align: left; }
        .meta-val { color: #0f172a; font-weight: bold; font-size: 13px; text-align: left; }
        .header-row { background-color: #ea580c; color: #ffffff; font-weight: bold; text-align: center; font-size: 13px; }
        .row-even { background-color: #ffffff; }
        .row-odd { background-color: #fdfaf6; }
        .number-cell { text-align: right; font-family: Consolas, monospace; font-size: 13px; }
        .text-center { text-align: center; }
        .grand-total { background-color: #ffedd5; font-weight: bold; color: #c2410c; font-size: 14px; }
        .spacer { border: none; height: 8px; }
      </style>
    `;

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        ${styles}
      </head>
      <body>
        <table>
          <tr>
            <td colspan="6" class="title-row">BÁO CÁO DOANH THU & CHỈ SỐ TÀI CHÍNH CHI TIẾT - LÀNG MÌXI BBQ</td>
          </tr>
          <tr>
            <td class="meta-label">Thời điểm xuất báo cáo:</td>
            <td colspan="5" class="meta-val" style="text-align: left;">${new Date().toLocaleString('vi-VN')}</td>
          </tr>
          <tr>
            <td class="meta-label">Bộ lọc khoảng thời gian:</td>
            <td colspan="5" class="meta-val" style="text-align: left;">${range === 'day' ? 'Hôm nay' : range === 'week' ? 'Tuần này' : range === 'month' ? 'Tháng này' : 'Năm nay'}</td>
          </tr>
          
          <tr class="spacer"><td colspan="6" class="spacer"></td></tr>
          <tr>
            <td colspan="6" class="section-header">1. TỔNG QUAN CHỈ SỐ KINH DOANH</td>
          </tr>
          <tr>
            <td class="meta-label">Tổng doanh thu bán hàng:</td>
            <td colspan="5" class="meta-val" style="color: #ea580c; text-align: left;">${liveRevenue.toLocaleString('vi-VN')} đ</td>
          </tr>
          <tr>
            <td class="meta-label">Tiền vốn bán món:</td>
            <td colspan="5" class="meta-val" style="color: #d97706; text-align: left;">${costRevenue.toLocaleString('vi-VN')} đ</td>
          </tr>
          <tr>
            <td class="meta-label">Tiền hủy nguyên liệu tươi:</td>
            <td colspan="5" class="meta-val" style="color: #dc2626; text-align: left;">${wasteRevenue.toLocaleString('vi-VN')} đ</td>
          </tr>
          <tr>
            <td class="meta-label">Doanh thu thực tế (Lợi nhuận):</td>
            <td colspan="5" class="meta-val" style="color: #059669; text-align: left;">${realRevenue.toLocaleString('vi-VN')} đ</td>
          </tr>
          <tr>
            <td class="meta-label">Tỷ suất lợi nhuận ròng:</td>
            <td colspan="5" class="meta-val" style="color: #0284c7; text-align: left;">${overallProfitMargin}%</td>
          </tr>

          <tr class="spacer"><td colspan="6" class="spacer"></td></tr>
          <tr>
            <td colspan="6" class="section-header">2. PHÂN TÍCH PHƯƠNG THỨC THANH TOÁN</td>
          </tr>
          <tr>
            <td class="meta-label">Tiền mặt (CASH):</td>
            <td colspan="2" class="meta-val" style="color: #059669; text-align: left;">${cashRevenue.toLocaleString('vi-VN')} đ</td>
            <td colspan="3" class="meta-val" style="text-align: left;">Tỷ lệ: ${cashPercent}%</td>
          </tr>
          <tr>
            <td class="meta-label">Chuyển khoản (VNPAY):</td>
            <td colspan="2" class="meta-val" style="color: #2563eb; text-align: left;">${transferRevenue.toLocaleString('vi-VN')} đ</td>
            <td colspan="3" class="meta-val" style="text-align: left;">Tỷ lệ: ${transferPercent}%</td>
          </tr>

          <tr class="spacer"><td colspan="6" class="spacer"></td></tr>
          <tr>
            <td colspan="6" class="section-header">3. BẢNG PHÂN TÍCH DOANH SỐ CHI TIẾT THEO NGÀY TRONG TUẦN</td>
          </tr>
          <tr class="header-row">
            <td>Thứ</td>
            <td>Tổng doanh thu (đ)</td>
            <td>Tiền vốn bán món (đ)</td>
            <td>Tiền hủy nguyên liệu (đ)</td>
            <td>Doanh thu thực tế (đ)</td>
            <td>Tỷ suất lợi nhuận (%)</td>
          </tr>
    `;

    // 9. Duyệt qua từng ngày trong tuần để tạo dòng bảng dữ liệu chi tiết
    weeklyData.forEach((row, index) => {
      const rowClass = index % 2 === 0 ? 'row-even' : 'row-odd';
      // Tỷ suất lợi nhuận riêng của từng ngày (%) = (Doanh thu thực tế ngày đó / Tổng doanh thu ngày đó) * 100%
      const margin = row.revenue > 0 ? ((row.profit / row.revenue) * 100).toFixed(1) : '0';
      html += `
        <tr class="${rowClass}">
          <td style="font-weight: bold; color: #334155;">${row.day}</td>
          <td class="number-cell">${Number(row.revenue).toLocaleString('vi-VN')} đ</td>
          <td class="number-cell">${Number(row.cost).toLocaleString('vi-VN')} đ</td>
          <td class="number-cell" style="color: #dc2626;">${Number(row.waste || 0).toLocaleString('vi-VN')} đ</td>
          <td class="number-cell" style="font-weight: bold; color: #059669;">${Number(row.profit).toLocaleString('vi-VN')} đ</td>
          <td class="number-cell" style="color: #0284c7;">${margin}%</td>
        </tr>
      `;
    });

    // 10. Tính tỷ suất lợi nhuận trung bình cả tuần (%) = (Tổng lợi nhuận tuần / Tổng doanh thu tuần) * 100%
    const weeklyMargin = totalRev > 0 ? ((totalProf / totalRev) * 100).toFixed(1) : '0';
    html += `
          <tr class="grand-total">
            <td>TỔNG CỘNG TUẦN</td>
            <td class="number-cell">${totalRev.toLocaleString('vi-VN')} đ</td>
            <td class="number-cell">${totalCost.toLocaleString('vi-VN')} đ</td>
            <td class="number-cell" style="color: #dc2626;">${totalWaste.toLocaleString('vi-VN')} đ</td>
            <td class="number-cell">${totalProf.toLocaleString('vi-VN')} đ</td>
            <td class="number-cell">${weeklyMargin}%</td>
          </tr>
    `;

    if (shiftReportsList && shiftReportsList.length > 0) {
      html += `
        <tr class="spacer"><td colspan="6" class="spacer"></td></tr>
        <tr>
          <td colspan="6" class="section-header">4. NHẬT KÝ KẾT CA LÀM VIỆC CỦA THU NGÂN</td>
        </tr>
        <tr class="header-row">
          <td>Thu ngân</td>
          <td colspan="2">Thời gian kết ca</td>
          <td>Tiền mặt đầu ca (đ)</td>
          <td>Doanh thu ca (đ)</td>
          <td>Tổng trong két (đ)</td>
        </tr>
      `;

      shiftReportsList.forEach((report, index) => {
        const rowClass = index % 2 === 0 ? 'row-even' : 'row-odd';
        const formattedTime = new Date(report.created_at).toLocaleString('vi-VN');
        html += `
          <tr class="${rowClass}">
            <td style="font-weight: bold;">${report.users?.fullname || 'Ẩn danh'}</td>
            <td colspan="2" class="text-center">${formattedTime}</td>
            <td class="number-cell">${Number(report.initial_amount || 0).toLocaleString('vi-VN')} đ</td>
            <td class="number-cell" style="color: #059669;">${Number(report.revenue_amount || 0).toLocaleString('vi-VN')} đ</td>
            <td class="number-cell" style="font-weight: bold; color: #ea580c;">${Number(report.total_amount || 0).toLocaleString('vi-VN')} đ</td>
          </tr>
        `;
      });
    }

    html += `
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\uFEFF" + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_chi_tiet_tai_chinh_${range}_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getColorClasses = (colorName) => {
    switch (colorName) {
      case 'primary': return 'bg-primary/10 text-primary';
      case 'amber': return 'bg-amber-500/10 text-amber-600';
      case 'orange': return 'bg-orange-500/10 text-orange-600';
      case 'emerald': return 'bg-emerald-500/10 text-emerald-600';
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

        {/* Bento Grid Metrics (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <div key={metric.id} className="bg-white p-5 rounded-2xl border border-neutralCustom/15 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className={`material-symbols-outlined p-2.5 rounded-xl ${getColorClasses(metric.color)}`}>
                  {metric.icon}
                </span>
              </div>
              <div className="mt-5 flex justify-between items-end">
                <div>
                  <p className="text-neutralCustom text-[10px] font-bold uppercase tracking-widest">{metric.title}</p>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{metric.value}</h3>
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
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary"></span> Tổng doanh thu</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#fca5a5]"></span> Doanh thu thực tế</span>
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
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Nhóm cột kép (Doanh thu & Lợi nhuận nằm sát nhau) */}
                  <div className="flex items-end justify-center gap-1.5 sm:gap-2 h-full w-full relative pb-1">
                    {/* Cột Doanh thu thực tế */}
                    <div
                      className={`w-2.5 sm:w-4 bg-[#fca5a5]/80 hover:bg-[#fca5a5] rounded-t-md transition-all duration-300 ${hoveredBar?.index === idx && hoveredBar?.type === 'profit' ? 'scale-110 shadow-md ring-2 ring-[#fca5a5]/50 z-10' : ''
                        }`}
                      style={{ height: data.profitHeight }}
                      onMouseEnter={() => setHoveredBar({ index: idx, type: 'profit' })}
                    ></div>

                    {/* Cột Tổng doanh thu */}
                    <div
                      className={`w-2.5 sm:w-4 rounded-t-md transition-all duration-300 ${data.highlight ? 'bg-primary shadow-lg scale-x-105' : 'bg-primary/75 hover:bg-primary'
                        } ${hoveredBar?.index === idx && hoveredBar?.type === 'revenue' ? 'scale-110 shadow-md ring-2 ring-primary/50 z-10' : ''
                        }`}
                      style={{ height: data.revenueHeight }}
                      onMouseEnter={() => setHoveredBar({ index: idx, type: 'revenue' })}
                    ></div>
                  </div>

                  {/* Tooltip hiển thị thông tin cụ thể của cột đang rê chuột vào */}
                  {hoveredBar && hoveredBar.index === idx && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-950 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl pointer-events-none z-30 whitespace-nowrap flex items-center gap-1.5 border border-white/10">
                      {hoveredBar.type === 'profit' ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-[#fca5a5]"></span>
                          <span className="text-gray-300">Doanh thu thực tế:</span>
                          <span className="text-[#fca5a5] font-extrabold">{Number(data.profit).toLocaleString('vi-VN')}đ</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          <span className="text-gray-300">Tổng doanh thu:</span>
                          <span className="text-primary font-extrabold">{Number(data.revenue).toLocaleString('vi-VN')}đ</span>
                        </>
                      )}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-950 rotate-45 border-r border-b border-white/10"></div>
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

        {/* THỐNG KÊ DOANH THU THEO PHƯƠNG THỨC THANH TOÁN */}
        {(() => {
          const totalMethodRevenue = cashRevenue + transferRevenue;
          const cashPercentage = totalMethodRevenue > 0 ? Math.round((cashRevenue / totalMethodRevenue) * 100) : 0;
          const transferPercentage = totalMethodRevenue > 0 ? Math.round((transferRevenue / totalMethodRevenue) * 100) : 0;

          return (
            <div className="bg-white p-6 rounded-2xl border border-neutralCustom/15 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Doanh thu theo phương thức</h3>
              <p className="text-neutralCustom text-xs uppercase tracking-wider font-bold mb-6">
                Phân tích tỷ lệ thanh toán tiền mặt và chuyển khoản (VNPAY)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tiền mặt */}
                <div className="flex items-center gap-5 bg-emerald-50/30 p-5 rounded-2xl border border-emerald-500/10 hover:shadow-md transition-all duration-300">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-150">
                    <span className="material-symbols-outlined text-[32px]">payments</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="font-extrabold text-sm text-gray-900">Tiền mặt (CASH)</span>
                      <span className="text-emerald-600 font-black text-base whitespace-nowrap">
                        {cashRevenue.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 bg-stone-100 rounded-full overflow-hidden border border-neutralCustom/10">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${cashPercentage}%` }}></div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-600 w-8 text-right shrink-0">{cashPercentage}%</span>
                    </div>
                  </div>
                </div>

                {/* Chuyển khoản (VNPAY) */}
                <div className="flex items-center gap-5 bg-blue-50/30 p-5 rounded-2xl border border-blue-500/10 hover:shadow-md transition-all duration-300">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-150">
                    <span className="material-symbols-outlined text-[32px]">qr_code_2</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="font-extrabold text-sm text-gray-900">Chuyển khoản (VNPAY)</span>
                      <span className="text-blue-600 font-black text-base whitespace-nowrap">
                        {transferRevenue.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 bg-stone-100 rounded-full overflow-hidden border border-neutralCustom/10">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${transferPercentage}%` }}></div>
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-600 w-8 text-right shrink-0">{transferPercentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
                  <p className="text-[9px] text-neutralCustom">-----------------------------------------------------------</p>

                  <div className="flex justify-between">
                    <span>Tiền đầu ca:</span>
                    <span>{Number(selectedReport.initial_amount || 0).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Doanh thu:</span>
                    <span>{Number(selectedReport.revenue_amount || 0).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <p className="text-[9px] text-neutralCustom">-----------------------------------------------------------</p>
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
                      <meta charset="utf-8" />
                      <title>In Báo Cáo Kết Ca</title>
                      <style>
                          @page {
                              size: 80mm auto;
                              margin: 0;
                          }
                          @media print {
                              html, body {
                                  width: 80mm !important;
                                  margin: 0 !important;
                                  padding: 0 !important;
                              }
                              .bill-container {
                                  width: 80mm !important;
                                  max-width: 80mm !important;
                                  margin: 0 !important;
                                  padding: 10px !important;
                              }
                          }
                          html, body {
                              margin: 0;
                              padding: 0;
                              width: 80mm;
                              background-color: #fff;
                              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                              font-size: 12px;
                              color: #000;
                          }
                          .bill-container {
                              width: 80mm;
                              max-width: 80mm;
                              padding: 10px;
                              box-sizing: border-box;
                              margin: 0 auto;
                          }
                          .text-center { text-align: center; }
                          .bold { font-weight: bold; }
                          .divider { border-top: 1px dashed #000; margin: 8px 0; }
                          table { width: 100%; border-collapse: collapse; margin: 6px 0; }
                          td { padding: 3px 0; vertical-align: top; }
                          .text-right { text-align: right; }
                      </style>
                  </head>
                  <body>
                      <div class="bill-container">
                          <div class="text-center">
                              <h3 style="margin: 0; font-size: 16px; font-weight: 800;">LÀNG MÌXI BBQ</h3>
                              <p style="margin: 4px 0 0 0;" class="bold">BÁO CÁO KẾT CA</p>
                          </div>
                          <div class="divider"></div>
                          <p style="margin: 3px 0;">Thời gian in: ${thoigianin}</p>
                          <p style="margin: 3px 0;">Thu ngân: ${selectedReport.users?.fullname || 'Ẩn danh'}</p>
                          <p style="margin: 3px 0;">Tổng số đơn hàng: ${selectedReport.total_orders} đơn</p>
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
                              <tr class="bold" style="font-size: 13px;">
                                  <td style="padding-top: 6px;">TỔNG TRONG KÉT:</td>
                                  <td class="text-right" style="padding-top: 6px;">${Number(selectedReport.total_amount || 0).toLocaleString('vi-VN')}đ</td>
                              </tr>
                          </table>
                          <div class="divider"></div>
                          <div class="text-center bold" style="margin-top: 10px;">XÁC NHẬN CỦA QUẢN LÝ</div>
                          <br><br><br>
                          <div class="text-center" style="font-size: 10px; color: #555;">(Ký và ghi rõ họ tên)</div>
                      </div>
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