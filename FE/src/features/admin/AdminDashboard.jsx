import React, { useState } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';

const AdminDashboard = () => {
  // --- MOCK DATA (Dễ dàng thay thế bằng API sau này) ---
  const metrics = [
    { id: 1, title: 'Tổng doanh thu', value: '128.450.000đ', trend: '+12.5%', isUp: true, icon: 'payments', color: 'primary' },
    { id: 2, title: 'Số đơn hàng', value: '1.248', trend: '+5.2%', isUp: true, icon: 'shopping_cart', color: 'secondary' },
    { id: 3, title: 'Trung bình hóa đơn', value: '102.925đ', trend: '-2.1%', isUp: false, icon: 'receipt', color: 'tertiary' },
    { id: 4, title: 'Lợi nhuận ròng', value: '42.180.000đ', trend: '+8.4%', isUp: true, icon: 'trending_up', color: 'neutralCustom' },
  ];

  const chartData = [
    { day: 'Thứ 2', revenueHeight: '40%', profitHeight: '30%', value: '52.000.000đ' },
    { day: 'Thứ 3', revenueHeight: '55%', profitHeight: '45%', value: '68.000.000đ' },
    { day: 'Thứ 4', revenueHeight: '45%', profitHeight: '35%', value: '58.000.000đ' },
    { day: 'Thứ 5', revenueHeight: '60%', profitHeight: '50%', value: '75.000.000đ' },
    { day: 'Thứ 6', revenueHeight: '75%', profitHeight: '65%', value: '92.000.000đ' },
    { day: 'Thứ 7', revenueHeight: '90%', profitHeight: '80%', value: '115.000.000đ', highlight: true },
    { day: 'Chủ nhật', revenueHeight: '85%', profitHeight: '75%', value: '105.000.000đ', highlight: true },
  ];

  const paymentMethods = [
    { name: 'Tiền mặt', amount: '45.000.000đ', percentage: 35, color: 'bg-primary' },
    { name: 'Quẹt thẻ (POS)', amount: '58.000.000đ', percentage: 45, color: 'bg-tertiary' },
    { name: 'Chuyển khoản', amount: '25.450.000đ', percentage: 20, color: 'bg-secondary' },
  ];

  const recentTransactions = [
    { id: '#ORD-2849', time: '14:25, 24/05/2024', table: 'Bàn 04', method: 'Thẻ', methodIcon: 'credit_card', status: 'Thành công', amount: '1.450.000đ' },
    { id: '#ORD-2848', time: '14:10, 24/05/2024', table: 'Bàn 12', method: 'Tiền mặt', methodIcon: 'payments', status: 'Thành công', amount: '820.000đ' },
    { id: '#ORD-2847', time: '13:55, 24/05/2024', table: 'Mang về', method: 'Chuyển khoản', methodIcon: 'account_balance', status: 'Đang chờ', amount: '215.000đ' },
    { id: '#ORD-2846', time: '13:30, 24/05/2024', table: 'Bàn 08', method: 'Thẻ', methodIcon: 'credit_card', status: 'Thành công', amount: '2.840.000đ' },
  ];

  const topDishes = [
    { name: 'Salad Cá Hồi Áp Chảo', sales: '342 đ/h', percentage: 92, image: 'https://images.unsplash.com/photo-1560963689-02e820bfceb5?w=150&h=150&fit=crop' },
    { name: 'Steak Thăn Ngoại Bò Mỹ', sales: '215 đ/h', percentage: 75, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=150&h=150&fit=crop' },
  ];

  // Helper render màu icon linh hoạt
  const getColorClasses = (colorName) => {
    switch(colorName) {
      case 'primary': return 'bg-primary/10 text-primary';
      case 'secondary': return 'bg-secondary/10 text-secondary';
      case 'tertiary': return 'bg-tertiary/10 text-tertiary';
      default: return 'bg-neutralCustom/10 text-neutralCustom';
    }
  };

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden">

      <AdminSidebar currentTab="dashboard" />
      <AdminHeader />

      {/* 3. MAIN CONTENT */}
      <main className="ml-64 pt-24 p-8 w-full">
        
        {/* Header Section */}
        <section className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Báo cáo doanh thu</h2>
            <p className="text-neutralCustom mt-1">Tổng quan hiệu suất kinh doanh trong 7 ngày qua</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-neutralCustom/20 bg-white rounded-xl text-neutralCustom font-bold hover:bg-culinaryBg transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              Hôm nay
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-secondary transition-all shadow-md active:scale-95">
              <span className="material-symbols-outlined text-[20px]">download</span>
              Xuất báo cáo
            </button>
          </div>
        </section>

        {/* Bento Grid Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric) => (
            <div key={metric.id} className="bg-white p-5 rounded-2xl border border-neutralCustom/20 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-between items-start">
                <span className={`material-symbols-outlined p-2.5 rounded-xl ${getColorClasses(metric.color)}`}>
                  {metric.icon}
                </span>
                <span className={`font-bold text-xs ${metric.isUp ? 'text-green-600' : 'text-red-500'}`}>
                  {metric.trend}
                </span>
              </div>
              <div className="mt-5">
                <p className="text-neutralCustom text-xs font-bold uppercase tracking-wider">{metric.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Main Line/Bar Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-neutralCustom/20 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-gray-900">Xu hướng doanh thu</h3>
              <div className="flex gap-4 text-xs font-bold text-neutralCustom">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary"></span> Doanh thu</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-secondary"></span> Lợi nhuận</span>
              </div>
            </div>
            
            {/* CSS Grid Chart */}
            <div className="h-64 flex items-end justify-between gap-3 relative mt-auto">
              {/* Background Lines */}
              <div className="absolute inset-0 border-b border-neutralCustom/10 pointer-events-none"></div>
              <div className="absolute inset-x-0 bottom-1/4 border-b border-neutralCustom/10 pointer-events-none"></div>
              <div className="absolute inset-x-0 bottom-1/2 border-b border-neutralCustom/10 pointer-events-none"></div>
              <div className="absolute inset-x-0 bottom-3/4 border-b border-neutralCustom/10 pointer-events-none"></div>

              {chartData.map((data, idx) => (
                <div key={idx} className="flex flex-col justify-end w-full h-full relative group">
                  {/* Cột lợi nhuận (Phía sau mờ hơn) */}
                  <div className="absolute bottom-0 w-full bg-secondary opacity-40 rounded-t-md transition-all group-hover:opacity-60" style={{ height: data.profitHeight }}></div>
                  {/* Cột doanh thu (Phía trước đậm hơn) */}
                  <div className={`w-full rounded-t-md transition-all z-10 
                    ${data.highlight ? 'bg-primary shadow-lg scale-x-105' : 'bg-primary/60 group-hover:bg-primary'}
                  `} style={{ height: data.revenueHeight }}></div>
                  
                  {/* Tooltip sử dụng group-hover của Tailwind (Không cần JS) */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                    {data.value}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-neutralCustom text-xs font-bold uppercase tracking-wider">
              {chartData.map(d => <span key={d.day}>{d.day}</span>)}
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-neutralCustom/20 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Phương thức thanh toán</h3>
            <div className="flex-1 flex flex-col justify-center gap-6">
              {paymentMethods.map((method, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-gray-900">{method.name}</span>
                    <span className="text-neutralCustom">{method.amount} ({method.percentage}%)</span>
                  </div>
                  <div className="h-2 w-full bg-culinaryBg rounded-full overflow-hidden">
                    <div className={`h-full ${method.color} rounded-full`} style={{ width: `${method.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-culinaryBg rounded-xl text-center text-sm text-neutralCustom border border-neutralCustom/10">
              <p>Phí giao dịch trung bình: <strong className="text-gray-900">0.8%</strong></p>
            </div>
          </div>
        </div>

        {/* Transactions & Top Food Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          
          {/* Table */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-neutralCustom/20 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutralCustom/10 flex justify-between items-center bg-culinaryBg/30">
              <h3 className="text-lg font-bold text-gray-900">Giao dịch gần đây</h3>
              <button className="text-primary font-bold text-sm hover:underline">Xem tất cả</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-culinaryBg/50 text-neutralCustom text-xs uppercase tracking-wider font-bold">
                    <th className="px-6 py-4 rounded-tl-lg">Mã đơn</th>
                    <th className="px-6 py-4">Thời gian</th>
                    <th className="px-6 py-4">Bàn</th>
                    <th className="px-6 py-4">Thanh toán</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right rounded-tr-lg">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutralCustom/10 text-sm">
                  {recentTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-culinaryBg/30 transition-colors cursor-pointer">
                      <td className="px-6 py-4 font-bold text-gray-900">{tx.id}</td>
                      <td className="px-6 py-4 text-neutralCustom">{tx.time}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{tx.table}</td>
                      <td className="px-6 py-4 text-neutralCustom">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">{tx.methodIcon}</span> {tx.method}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                          ${tx.status === 'Thành công' ? 'bg-green-100 text-green-700' : 'bg-tertiary/20 text-tertiary'}
                        `}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-primary">{tx.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Food */}
          <div className="h-full">
            
            {/* Top Food Card */}
            <div className="bg-white p-6 rounded-2xl border border-neutralCustom/20 shadow-sm relative overflow-hidden group h-full flex flex-col">
              
              <div className="relative z-10 flex flex-col h-full">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Món ăn bán chạy</h3>
                <p className="text-neutralCustom text-xs uppercase tracking-wider font-bold mb-6">Theo số lượng đơn</p>
                
                {/* Khu vực danh sách */}
                <div className="space-y-5 flex-1 overflow-y-auto pr-2">
                  {topDishes.map((dish, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <img className="w-14 h-14 rounded-xl object-cover shadow-sm" src={dish.image} alt={dish.name}/>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-bold text-sm text-gray-900 line-clamp-1">{dish.name}</span>
                          <span className="text-primary font-bold text-sm whitespace-nowrap">{dish.sales}</span>
                        </div>
                        <div className="h-1.5 w-full bg-culinaryBg rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${dish.percentage}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;