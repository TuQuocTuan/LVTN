import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';

// Cấu hình URL gọi API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const IngredientManagement = () => {
  const [activeCategory, setActiveCategory] = useState('Tất cả kho');
  const [searchQuery, setSearchQuery] = useState('');
  
  // STATE: Quản lý dữ liệu từ API
  const [ingredients, setIngredients] = useState([]);
  const [categories, setCategories] = useState(['Tất cả kho']); // Khởi tạo mặc định có 'Tất cả kho'
  const [isLoading, setIsLoading] = useState(true);

  // 1. GỌI API LẤY DANH MỤC NGUYÊN LIỆU
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories/category_ingredients`);
      const result = await response.json();

      if (result.success && result.categories) {
        // Backend trả về mảng object [{name: 'Thịt'}, {name: 'Rau củ'}]
        // Ta cần map nó ra thành mảng chuỗi và chèn 'Tất cả kho' lên đầu
        const categoryNames = result.categories.map(cat => cat.name);
        setCategories(['Tất cả kho', ...categoryNames]);
      }
    } catch (error) {
      console.error("Lỗi khi fetch danh mục nguyên liệu:", error);
    }
  };

  // 2. GỌI API LẤY DANH SÁCH NGUYÊN LIỆU
  const fetchIngredients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/ingredients`);
      const result = await response.json();

      if (result.success) {
       const formattedData = result.data.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          min_stock: item.min_stock,
          
          // ĐỌC ĐÚNG OBJECT TỪ BACKEND TRẢ VỀ:
          category: item.category_ingredients?.name || 'Khác', 
          
          price: item.price || 0,
          image: item.image_url || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=150&h=150&fit=crop'
      }));
        setIngredients(formattedData);
      } else {
        console.error("Lỗi từ server:", result.message);
      }
    } catch (error) {
      console.error("Lỗi khi fetch nguyên liệu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Chạy 1 lần khi mở trang để tải cả danh mục và nguyên liệu
  useEffect(() => {
    fetchCategories();
    fetchIngredients();
  }, []);

  // Hàm gọi API XÓA nguyên liệu
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nguyên liệu "${name}" không?`)) return;
    
    try {
      const response = await fetch(`${API_URL}/ingredients/delete/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      
      if (result.success) {
        alert("Xóa thành công!");
        fetchIngredients(); // Tải lại danh sách sau khi xóa
      } else {
        alert("Lỗi: " + result.message);
      }
    } catch (error) {
      alert("Lỗi kết nối đến máy chủ!");
    }
  };

  // Hàm tính toán trạng thái tồn kho và màu sắc hiển thị
  const getStockStatus = (quantity, min_stock) => {
    if (quantity === 0) return { color: 'text-red-500', bg: 'bg-red-500', barWidth: '0%' };
    if (quantity < min_stock) return { color: 'text-red-600', bg: 'bg-red-500', barWidth: `${(quantity / min_stock) * 50}%` };
    if (quantity < min_stock * 1.5) return { color: 'text-tertiary', bg: 'bg-tertiary', barWidth: '75%' };
    return { color: 'text-green-600', bg: 'bg-green-500', barWidth: '100%' };
  };

  // Logic lọc dữ liệu
  const filteredIngredients = ingredients.filter(item => {
    const matchCategory = activeCategory === 'Tất cả kho' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden relative">
      <AdminSidebar currentTab="inventory" />
      <AdminHeader />

      <main className="ml-64 pt-24 p-8 w-full flex flex-col h-screen">
        
        {/* Page Header & Action */}
        <div className="flex flex-col gap-6 mb-6 flex-shrink-0">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Nguyên vật liệu</h2>
              <p className="text-neutralCustom text-sm">Quản lý nguyên liệu, mức tồn kho và cảnh báo nhập hàng cho hệ thống.</p>
            </div>
            <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-secondary transition-all active:scale-95 text-sm">
              <span className="material-symbols-outlined text-[20px]">add_box</span>
              Thêm nguyên liệu mới
            </button>
          </div>

          {/* Tìm kiếm */}
          <div className="flex items-center">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutralCustom">search</span>
              <input 
                type="text" 
                placeholder="Tìm kiếm tên nguyên liệu..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutralCustom/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Inventory Table Section */}
        <div className="flex-1 overflow-hidden">
          <div className="bg-white rounded-2xl border border-neutralCustom/20 overflow-hidden flex flex-col h-full shadow-sm">
            
            {/* Filter Bar */}
            <div className="p-4 bg-culinaryBg/30 border-b border-neutralCustom/20 flex flex-wrap gap-4 items-center">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap
                      ${activeCategory === cat 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-neutralCustom hover:bg-white hover:border-neutralCustom/20 border border-transparent'}
                    `}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-culinaryBg/50 border-b border-neutralCustom/10 text-neutralCustom font-bold uppercase text-[11px] tracking-widest shrink-0 items-center">
              <div className="col-span-4">Chi tiết mặt hàng</div>
              <div className="col-span-1">Đơn vị</div>
              <div className="col-span-3">Tồn kho hiện tại</div>
              <div className="col-span-1 text-center">Cảnh báo</div>
              <div className="col-span-2 text-right">Đơn giá</div>
              <div className="col-span-1 text-right">Thao tác</div>
            </div>

            {/* Table Rows */}
            <div className="flex-1 overflow-y-auto relative">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-neutralCustom/60 py-10 animate-pulse">
                  <span className="material-symbols-outlined text-4xl mb-2">hourglass_empty</span>
                  <p>Đang tải dữ liệu kho...</p>
                </div>
              ) : filteredIngredients.length > 0 ? (
                filteredIngredients.map((item) => {
                  const status = getStockStatus(item.quantity, item.min_stock);
                  const isOutOfStock = item.quantity === 0;

                  return (
                    <div 
                      key={item.id} 
                      className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-neutralCustom/10 hover:bg-culinaryBg/40 transition-colors items-center group
                        ${item.quantity > 0 && item.quantity < item.min_stock * 1.5 ? 'bg-tertiary/5' : ''}
                      `}
                    >
                      {/* Tên & Hình ảnh */}
                      <div className="col-span-4 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-culinaryBg overflow-hidden border border-neutralCustom/20 shadow-sm shrink-0 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}>
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold text-sm truncate ${isOutOfStock ? 'text-neutralCustom/60 line-through' : 'text-gray-900'}`}>
                            {item.name}
                          </p>
                          <p className="text-neutralCustom text-xs mt-0.5">{item.category}</p>
                        </div>
                      </div>

                      {/* Đơn vị */}
                      <div className="col-span-1 text-gray-900 text-sm font-medium">{item.unit}</div>

                      {/* Tồn kho (Thanh Process Bar) */}
                      <div className="col-span-3 pr-6">
                        <div className="flex flex-col gap-1.5">
                          <span className={`${status.color} font-bold text-sm`}>
                            {item.quantity} {item.unit}
                          </span>
                          <div className="w-full bg-neutralCustom/10 h-1.5 rounded-full overflow-hidden">
                            <div className={`${status.bg} h-full transition-all duration-500`} style={{ width: status.barWidth }}></div>
                          </div>
                        </div>
                      </div>

                      {/* Mức cảnh báo */}
                      <div className="col-span-1 text-neutralCustom text-sm font-medium text-center">{item.min_stock} {item.unit}</div>

                      {/* Đơn giá */}
                      <div className="col-span-2 text-gray-900 text-sm font-bold text-right">
                        {item.price > 0 ? `${item.price.toLocaleString('vi-VN')} đ` : '---'}
                      </div>

                      {/* Thao tác */}
                      <div className="col-span-1 flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-neutralCustom hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Chỉnh sửa">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-1.5 text-neutralCustom hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Xóa nguyên liệu"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-neutralCustom/60 py-10">
                  <span className="material-symbols-outlined text-5xl mb-3">inventory_2</span>
                  <p className="font-medium">Không tìm thấy nguyên liệu nào phù hợp.</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="p-4 bg-culinaryBg/30 border-t border-neutralCustom/10 flex justify-center items-center text-sm shrink-0">
              <div className="flex gap-2">
                <button className="p-1.5 border border-neutralCustom/20 rounded-lg hover:bg-white text-neutralCustom transition-colors disabled:opacity-50" disabled>
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button className="px-3 py-1 bg-primary text-white rounded-lg font-bold shadow-sm">1</button>
                <button className="p-1.5 border border-neutralCustom/20 rounded-lg hover:bg-white text-neutralCustom transition-colors">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default IngredientManagement;