import React, { useState } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import { useNavigate } from 'react-router-dom';

const DishManagement = () => {
  // 1. States quản lý giao diện
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState(''); // State mới cho thanh tìm kiếm
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const navigate = useNavigate();

  const categories = ['Tất cả', 'Khai vị', 'Món chính', 'Đồ uống', 'Tráng miệng', 'Khác'];

  const mockDishes = [
    { 
      id: 1, 
      name: 'Phở Bò Đặc Biệt', 
      price: 65000, 
      category: 'Món chính', 
      status: 'available', 
      image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb431?w=150&h=150&fit=crop',
      desc: 'Phở bò truyền thống với nước dùng hầm xương 24h, thịt bò tái lăn và gầu giòn.'
    },
    { 
      id: 2, 
      name: 'Bún Chả Hà Nội', 
      price: 55000, 
      category: 'Món chính', 
      status: 'available', 
      image: 'https://images.unsplash.com/photo-1623910271018-ce8fc1dd3383?w=150&h=150&fit=crop',
      desc: 'Bún chả nướng than hoa, nước mắm chua ngọt chuẩn vị Hà Nội.'
    },
    { 
      id: 3, 
      name: 'Nem Rán Cua Biển', 
      price: 85000, 
      category: 'Khai vị', 
      status: 'unavailable', 
      image: 'https://images.unsplash.com/photo-1625937712144-cefc06f7fbab?w=150&h=150&fit=crop',
      desc: 'Nem cua bể giòn rụm, nhân thịt cua tươi ngon.'
    },
  ];

  // 2. Logic Lọc dữ liệu kết hợp (Tab + Tìm kiếm)
  const filteredDishes = mockDishes.filter(dish => {
    const matchTab = activeTab === 'Tất cả' || dish.category === activeTab;
    // Chuyển cả tên món và từ khóa về chữ thường để tìm kiếm không phân biệt hoa/thường
    const matchSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  // 3. Hàm xử lý mở Drawer
  const handleOpenDrawer = (dish) => {
    setSelectedDish(dish);
    setIsDrawerOpen(true);
  };

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden relative">
      <AdminSidebar currentTab="dish" />
      <AdminHeader />

      <main className="ml-64 pt-24 p-8 w-full flex flex-col h-screen">
        
        {/* Page Header & Actions */}
        <div className="flex flex-col gap-6 mb-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Thực đơn</h2>
              <p className="text-neutralCustom text-sm">Quản lý danh sách món ăn, giá cả và danh mục của nhà hàng.</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-white text-neutralCustom px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-culinaryBg transition-colors border border-neutralCustom/20 shadow-sm">
                <span className="material-symbols-outlined text-[18px]">category</span>
                Thêm danh mục
              </button>
              <button 
                onClick={() => handleOpenDrawer(null)}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-secondary active:scale-95 transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Thêm món ăn
              </button>
            </div>
          </div>

          {/* THANH TÌM KIẾM MỚI */}
          <div className="flex items-center">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutralCustom">search</span>
              <input 
                type="text" 
                placeholder="Tìm kiếm tên món ăn..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutralCustom/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="flex-1 overflow-hidden">
          <div className="bg-white rounded-2xl border border-neutralCustom/20 overflow-hidden flex flex-col h-full shadow-sm">
            
            {/* Tabs Header */}
            <div className="flex justify-between items-center p-4 border-b border-neutralCustom/20 bg-culinaryBg/30">
              <div className="flex gap-6 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`pb-1 px-1 whitespace-nowrap text-sm font-bold transition-colors border-b-2
                      ${activeTab === cat 
                        ? 'text-primary border-primary' 
                        : 'text-neutralCustom/70 border-transparent hover:text-primary'}
                    `}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ml-4">
                {filteredDishes.length} Món
              </span>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto">
              {filteredDishes.length > 0 ? (
                filteredDishes.map((dish) => (
                  <div 
                    key={dish.id} 
                    onClick={() => handleOpenDrawer(dish)}
                    className={`flex items-center p-4 border-b border-neutralCustom/10 hover:bg-culinaryBg/50 transition-colors cursor-pointer group
                      ${dish.status === 'unavailable' ? 'opacity-75' : ''}
                    `}
                  >
                    <img 
                      src={dish.image} 
                      alt={dish.name} 
                      className={`w-14 h-14 rounded-xl object-cover mr-4 shadow-sm ${dish.status === 'unavailable' ? 'grayscale-[50%]' : ''}`} 
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-base">{dish.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-sm font-bold ${dish.status === 'unavailable' ? 'text-neutralCustom' : 'text-primary'}`}>
                          {dish.price.toLocaleString('vi-VN')}đ
                        </span>
                        <span className="text-neutralCustom/30 text-xs">•</span>
                        <span className="text-xs text-neutralCustom font-medium bg-neutralCustom/5 px-2 py-0.5 rounded-md">
                          {dish.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {dish.status === 'available' ? (
                        <div className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                          Đang bán
                        </div>
                      ) : (
                        <div className="bg-neutralCustom/10 text-neutralCustom border border-neutralCustom/20 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                          Tạm ngưng
                        </div>
                      )}
                      <span className="material-symbols-outlined text-neutralCustom/40 group-hover:text-primary transition-colors">
                        chevron_right
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-neutralCustom/60 py-10">
                  <span className="material-symbols-outlined text-5xl mb-3">search_off</span>
                  <p className="font-medium">Không tìm thấy món ăn nào phù hợp.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* ======================= OVERLAY & DRAWER ======================= */}
      {/* ... (Đoạn mã của Drawer Overlay và Form bên phải giữ nguyên như cũ) ... */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300
          ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setIsDrawerOpen(false)}
      ></div>

      <div 
        className={`fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl z-50 flex flex-col border-l border-neutralCustom/20 transform transition-transform duration-300 ease-in-out
          ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="p-6 border-b border-neutralCustom/20 flex items-center justify-between bg-culinaryBg/30">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
              {selectedDish ? 'Chi tiết món ăn' : 'Thêm món mới'}
            </p>
            <h3 className="text-xl font-bold text-gray-900">
              {selectedDish ? selectedDish.name : 'Tạo món ăn mới'}
            </h3>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 hover:bg-neutralCustom/10 rounded-full transition-colors text-neutralCustom"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="relative h-48 w-full rounded-2xl overflow-hidden shadow-md bg-culinaryBg flex items-center justify-center">
            {selectedDish ? (
              <img src={selectedDish.image} alt={selectedDish.name} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-4xl text-neutralCustom/30">add_photo_alternate</span>
            )}
            <button className="absolute bottom-3 right-3 bg-white/90 p-2 rounded-lg shadow-sm hover:bg-white transition-colors">
              <span className="material-symbols-outlined text-sm text-primary">edit</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Tên món ăn</label>
              <input 
                type="text" 
                defaultValue={selectedDish?.name || ''}
                className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" 
                placeholder="Nhập tên món ăn..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Giá bán (VNĐ)</label>
                <input 
                  type="text" 
                  defaultValue={selectedDish?.price || ''}
                  className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" 
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Danh mục</label>
                <select 
                  defaultValue={selectedDish?.category || 'Món chính'}
                  className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                >
                  {categories.filter(c => c !== 'Tất cả').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Mô tả</label>
              <textarea 
                defaultValue={selectedDish?.desc || ''}
                rows="3"
                className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" 
                placeholder="Mô tả chi tiết món ăn..."
              ></textarea>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-culinaryBg/50 rounded-2xl border border-primary/20">
            <div>
              <p className="text-sm font-bold text-gray-900">Trạng thái kinh doanh</p>
              <p className="text-xs text-neutralCustom">Đang hiển thị trên thực đơn</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked={selectedDish?.status !== 'unavailable'} />
              <div className="w-11 h-6 bg-neutralCustom/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
            </label>
          </div>

          {selectedDish && (
            <div className="p-4 border border-neutralCustom/20 bg-white rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-xl">menu_book</span>
                <h4 className="font-bold text-sm">Tóm tắt công thức</h4>
              </div>
              <ul className="text-xs text-neutralCustom space-y-1 list-disc pl-4">
                <li>Bánh phở tươi (200g)</li>
                <li>Thịt bò thăn & gầu (150g)</li>
                <li>Nước dùng bò đặc biệt</li>
              </ul>
              <button 
                onClick={() => navigate('/admin/recipe-detail')}
                className="inline-block text-xs font-bold text-secondary hover:underline"
              >
                Quản lý công thức chi tiết →
              </button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-neutralCustom/20 bg-white flex gap-3">
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="flex-1 py-3 border border-neutralCustom/20 rounded-xl font-bold text-sm text-neutralCustom hover:bg-culinaryBg transition-colors"
          >
            Hủy bỏ
          </button>
          <button className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-secondary transition-all active:scale-95 shadow-md">
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

export default DishManagement;