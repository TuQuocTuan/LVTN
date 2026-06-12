import React, { useState } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';

const PromotionNewsManagement = () => {
  // State quản lý Tab đang active
  const [activeTab, setActiveTab] = useState('Khuyến mãi');

  // --- MOCK DATA ---
  const stats = [
    { title: 'Khuyến mãi đang chạy', value: '04', icon: 'local_activity', color: 'primary', bg: 'bg-primary/10 text-primary' },
    { title: 'Lượt sử dụng mã', value: '1.2k', icon: 'query_stats', color: 'secondary', bg: 'bg-secondary/10 text-secondary' },
    { title: 'Tin tức mới', value: '02', icon: 'newspaper', color: 'tertiary', bg: 'bg-tertiary/10 text-tertiary' },
  ];

  const promotions = [
    { id: 1, title: 'Chào hè rực rỡ - Giảm 20%', code: 'HE2024', type: 'Giảm giá', typeColor: 'bg-secondary/10 text-secondary', duration: '01/06 - 30/06', durationIcon: 'calendar_today', status: 'Đang chạy', statusColor: 'text-green-600', dot: 'bg-green-500 animate-pulse', isActive: true },
    { id: 2, title: 'Tặng Trà Đào cho hóa đơn trên 500k', code: 'Áp dụng tại quầy', type: 'Tặng món', typeColor: 'bg-tertiary/10 text-tertiary', duration: 'Vô thời hạn', durationIcon: 'calendar_today', status: 'Đang chạy', statusColor: 'text-green-600', dot: 'bg-green-500', isActive: true },
    { id: 3, title: 'Khai trương cơ sở mới', code: 'Giảm 50% bàn đặt trước', type: 'Sự kiện', typeColor: 'bg-primary/10 text-primary', duration: 'Hết hạn 15/05', durationIcon: 'history', status: 'Kết thúc', statusColor: 'text-neutralCustom', dot: 'bg-neutralCustom', isActive: false },
  ];

  const newsList = [
    { id: 1, date: '12/06/2024', title: 'Ra mắt thực đơn Mùa Hè: Hương vị biển cả ngay tại Bistro', views: 428, status: 'Đã đăng', isDraft: false, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop' },
    { id: 2, date: '08/06/2024', title: 'ChefOS cập nhật tính năng quản lý kho tự động', views: 1100, status: 'Đã đăng', isDraft: false, image: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?w=400&h=300&fit=crop' },
    { id: 3, date: 'Cập nhật: 1 giờ trước', title: 'Thông báo lịch nghỉ lễ Quốc khánh 2/9', views: 0, status: 'Bản nháp', isDraft: true, image: null },
  ];

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden relative">
      <AdminSidebar currentTab="promotions" />
      {/* Truyền placeholder riêng cho trang này */}
      <AdminHeader searchPlaceholder="Tìm kiếm chương trình, tin tức..." />

      <main className="ml-64 pt-24 p-8 w-full flex flex-col min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Khuyến mãi & Tin tức</h2>
            <p className="text-neutralCustom text-sm">Tạo và quản lý các chương trình ưu đãi, bài viết tin tức cho nhà hàng.</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-white text-primary border border-primary/30 font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 hover:bg-primary/5 transition-all shadow-sm text-sm">
              <span className="material-symbols-outlined text-[20px]">edit_note</span>
              <span>Viết tin tức</span>
            </button>
            <button className="bg-primary text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-md hover:bg-secondary transition-all active:scale-95 text-sm">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'wght' 700" }}>add</span>
              <span>Tạo khuyến mãi</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl flex items-center gap-5 border border-neutralCustom/20 shadow-sm hover:-translate-y-1 transition-transform duration-300">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {stat.icon}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-neutralCustom uppercase tracking-wider mb-1">{stat.title}</p>
                <h4 className={`text-3xl font-black text-${stat.color} leading-none`}>{stat.value}</h4>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Section */}
        <div className="mb-6 flex border-b border-neutralCustom/20">
          <button 
            onClick={() => setActiveTab('Khuyến mãi')}
            className={`px-8 py-3.5 font-bold text-sm transition-all border-b-2 ${
              activeTab === 'Khuyến mãi' ? 'border-primary text-primary' : 'border-transparent text-neutralCustom hover:text-primary'
            }`}
          >
            Chương trình Khuyến mãi
          </button>
          <button 
            onClick={() => setActiveTab('Tin tức')}
            className={`px-8 py-3.5 font-bold text-sm transition-all border-b-2 ${
              activeTab === 'Tin tức' ? 'border-primary text-primary' : 'border-transparent text-neutralCustom hover:text-primary'
            }`}
          >
            Tin tức & Sự kiện
          </button>
        </div>

        {/* ================= NỘI DUNG THEO TAB ================= */}
        
        {activeTab === 'Khuyến mãi' ? (
          /* TAB 1: BẢNG KHUYẾN MÃI */
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutralCustom/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-culinaryBg/50 text-neutralCustom border-b border-neutralCustom/20">
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Tên chương trình</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Loại</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Thời hạn</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutralCustom/10">
                  {promotions.map((promo) => (
                    <tr key={promo.id} className={`hover:bg-culinaryBg/30 transition-colors group ${!promo.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900 text-sm">{promo.title}</p>
                        <p className="text-xs text-neutralCustom mt-0.5">{promo.code}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`${promo.typeColor} px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-current`}>
                          {promo.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-neutralCustom text-sm">
                          <span className="material-symbols-outlined text-[16px]">{promo.durationIcon}</span>
                          {promo.duration}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 font-bold text-sm ${promo.statusColor}`}>
                          <span className={`w-2 h-2 rounded-full ${promo.dot}`}></span>
                          {promo.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          {promo.isActive ? (
                            <>
                              <button className="p-1.5 text-neutralCustom hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                              <button className="p-1.5 text-neutralCustom hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><span className="material-symbols-outlined text-[18px]">stop_circle</span></button>
                            </>
                          ) : (
                            <>
                              <button className="p-1.5 text-neutralCustom hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><span className="material-symbols-outlined text-[18px]">restore</span></button>
                              <button className="p-1.5 text-neutralCustom hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="px-6 py-4 bg-culinaryBg/30 flex justify-between items-center border-t border-neutralCustom/10">
              <span className="text-sm text-neutralCustom font-medium">Hiển thị {promotions.length} chương trình</span>
              <div className="flex gap-2">
                <button className="p-1.5 rounded-lg border border-neutralCustom/20 text-neutralCustom hover:bg-white disabled:opacity-30 transition-colors" disabled>
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button className="p-1.5 rounded-lg border border-neutralCustom/20 text-neutralCustom hover:bg-white transition-colors">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: GRID TIN TỨC */
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Tin tức & Sự kiện gần đây</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Lặp danh sách tin tức */}
              {newsList.map((news) => (
                <div key={news.id} className={`bg-white rounded-2xl overflow-hidden border border-neutralCustom/20 shadow-sm hover:shadow-md transition-shadow flex flex-col ${news.isDraft ? 'opacity-90' : ''}`}>
                  <div className="relative h-40 bg-culinaryBg flex items-center justify-center">
                    {news.image ? (
                      <img src={news.image} alt={news.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-neutralCustom/30">add_photo_alternate</span>
                    )}
                    <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider text-white shadow-sm
                      ${news.isDraft ? 'bg-neutralCustom' : 'bg-green-500'}
                    `}>
                      {news.status}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-xs text-neutralCustom mb-1.5">{news.date}</p>
                    <h5 className="font-bold text-gray-900 line-clamp-2 mb-4 text-sm flex-1">{news.title}</h5>
                    <div className="flex justify-between items-center mt-auto border-t border-neutralCustom/10 pt-3">
                      <span className="text-xs text-neutralCustom font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">
                          {news.isDraft ? 'history_edu' : 'visibility'}
                        </span> 
                        {news.isDraft ? 'Đang soạn' : `${news.views} lượt xem`}
                      </span>
                      <button className="text-primary hover:bg-primary/10 p-1 rounded-md transition-colors">
                        <span className="material-symbols-outlined text-[20px]">
                          {news.isDraft ? 'edit' : 'more_horiz'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Nút thêm bài viết mới dạng Card */}
              <button className="rounded-2xl border-2 border-dashed border-neutralCustom/30 flex flex-col items-center justify-center p-6 hover:bg-primary/5 hover:border-primary/40 transition-all group min-h-[260px]">
                <div className="w-14 h-14 rounded-full bg-culinaryBg flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-3 shadow-sm border border-neutralCustom/10">
                  <span className="material-symbols-outlined text-2xl">add</span>
                </div>
                <p className="font-bold text-neutralCustom group-hover:text-primary transition-colors">Tạo bài viết mới</p>
              </button>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default PromotionNewsManagement;