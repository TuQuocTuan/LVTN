import React from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import { useNavigate } from 'react-router-dom';

const RecipeDetail = () => {
    const navigate = useNavigate();
    
  // DỮ LIỆU MẪU (Mock Data) - Chuẩn bị sẵn để gọi API getRecipeByDish
  const recipeData = {
    dishName: 'Phở Bò Đặc Biệt',
    category: 'Món Chính',
    badge: 'Bán Chạy',
    lastUpdated: '14:30 - 24/10/2023 bởi Bếp trưởng Nam',
    estimatedCost: '43.000',
    ingredients: [
      { id: 1, name: 'Bánh phở tươi', amount: 200, unit: 'g' },
      { id: 2, name: 'Thịt bò tái (Thăn nội)', amount: 100, unit: 'g' },
      { id: 3, name: 'Nước dùng hầm xương', amount: 450, unit: 'ml' },
      { id: 4, name: 'Hành, mùi, ngò gai', amount: 15, unit: 'g' },
    ],
    instructions: [
      {
        step: 1,
        title: 'Trụng phở',
        desc: 'Trụng qua nước sôi 10 giây cho tơi và nóng. Trút ráo nước rồi cho vào tô.',
        warning: null
      },
      {
        step: 2,
        title: 'Xếp thịt',
        desc: 'Xếp dàn đều thịt thăn bò thái mỏng (2mm) lên trên mặt bánh phở.',
        warning: null
      },
      {
        step: 3,
        title: 'Chan nước dùng',
        desc: 'Chan nước dùng đang sôi (> 95°C) ngập phở, cách miệng tô 1.5cm.',
        warning: 'Để tô trên khay an toàn trước khi chan để tránh bỏng.'
      },
      {
        step: 4,
        title: 'Hoàn thiện',
        desc: 'Rắc hành lá, ngò gai và tiêu đen. Phục vụ kèm đĩa gia vị.',
        warning: null
      }
    ]
  };

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden relative">
      {/* HEADER & SIDEBAR TÁI SỬ DỤNG */}
      <AdminSidebar currentTab="recipes" />
      <AdminHeader />

      {/* MAIN CONTENT AREA */}
      <main className="ml-64 pt-24 p-8 w-full flex flex-col h-screen">
        
        {/* Page Navigation & Header */}
        <div className="mb-8 flex-shrink-0">
          <div 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-neutralCustom mb-4 hover:text-primary cursor-pointer transition-colors w-fit"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="text-sm font-bold">Trở về Quản lý món ăn</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutralCustom/20 pb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-1 bg-tertiary/10 text-tertiary rounded-md text-[10px] font-bold tracking-wider uppercase border border-tertiary/20">
                  {recipeData.category}
                </span>
                <span className="px-2.5 py-1 bg-white text-gray-900 rounded-md text-[10px] font-bold tracking-wider uppercase border border-neutralCustom/30 shadow-sm">
                  {recipeData.badge}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">{recipeData.dishName}</h2>
              <p className="text-sm text-neutralCustom mt-1">Cập nhật lần cuối: {recipeData.lastUpdated}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutralCustom/20 text-neutralCustom font-bold rounded-xl hover:bg-culinaryBg transition-colors shadow-sm text-sm">
                <span className="material-symbols-outlined text-[18px]">sync</span>
                Đồng bộ Kho
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutralCustom/20 text-neutralCustom font-bold rounded-xl hover:bg-culinaryBg transition-colors shadow-sm text-sm">
                <span className="material-symbols-outlined text-[18px]">print</span>
                In C.Thức
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-secondary active:scale-95 transition-all shadow-md text-sm">
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Sửa C.Thức
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden pb-6">
          
          {/* Left Column (Ingredients) - Takes up 4 columns */}
          <div className="lg:col-span-4 h-full flex flex-col">
            <div className="bg-white rounded-2xl border border-neutralCustom/20 overflow-hidden flex flex-col h-full shadow-sm">
              <div className="p-4 border-b border-neutralCustom/20 bg-culinaryBg/30 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">kitchen</span>
                  Nguyên Liệu
                </h3>
                <span className="text-xs font-bold text-neutralCustom uppercase tracking-wider">Cho 1 Porson</span>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="divide-y divide-neutralCustom/10">
                  {recipeData.ingredients.map((item) => (
                    <div key={item.id} className="py-3.5 flex justify-between items-center group hover:bg-culinaryBg/20 px-2 rounded-lg transition-colors">
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      <span className="text-sm font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-md">
                        {item.amount}{item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-culinaryBg/50 border-t border-neutralCustom/20 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Tổng chi phí dự kiến:</span>
                <span className="text-xl font-bold text-primary">~{recipeData.estimatedCost}đ</span>
              </div>
            </div>
          </div>

          {/* Right Column (Instructions) - Takes up 8 columns */}
          <div className="lg:col-span-8 h-full flex flex-col">
            <div className="bg-white rounded-2xl border border-neutralCustom/20 overflow-hidden flex flex-col h-full shadow-sm">
              <div className="p-4 border-b border-neutralCustom/20 bg-culinaryBg/30">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">format_list_numbered</span>
                  Các Bước Thực Hiện
                </h3>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto">
                <ol className="space-y-6 list-decimal list-inside marker:text-primary marker:font-bold marker:text-lg">
                  {recipeData.instructions.map((inst) => (
                    <li key={inst.step} className="text-neutralCustom text-sm leading-relaxed pl-2">
                      <span className="font-bold text-gray-900 ml-1">{inst.title}:</span> {inst.desc}
                      
                      {/* Hiển thị cảnh báo nếu có */}
                      {inst.warning && (
                        <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 text-sm text-gray-900 rounded-r-lg ml-6">
                          <span className="font-bold text-red-600 mr-2">Lưu ý:</span> 
                          {inst.warning}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default RecipeDetail;