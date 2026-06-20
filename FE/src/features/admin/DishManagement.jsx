import React, { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DishManagement = () => {
  const navigate = useNavigate();

  // States quản lý giao diện & Dữ liệu
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // State Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  
  const [dishes, setDishes] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]); // Chứa danh sách category từ DB
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State quản lý Form thêm/sửa
  const [selectedDish, setSelectedDish] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category_id: '',
    description: '',
    status: 'available',
    instructions: null,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Lấy ra danh sách các Tabs (Lấy tên category độc nhất từ dishes đang có)
  const tabCategories = ['Tất cả', ...new Set(dishes.map(d => d.categories?.name || 'Khác'))];

  // GỌI API LẤY DỮ LIỆU
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Lấy danh sách món ăn từ API
      const dishRes = await axios.get(`${API_BASE_URL}/dishes`);
      if (dishRes.data.success) {
        setDishes(dishRes.data.data);
      }

      // Lấy danh mục món ăn
      const response = await axios.get(`${API_BASE_URL}/categories`);
      
      // Vì Backend trả thẳng về mảng dữ liệu (res.json(data)) nên mảng chính là catRes.data
      const categoriesData = Array.isArray(response.data) ? response.data : [];
      setCategoriesList(categoriesData);

      // Nếu đang ở trạng thái THÊM MỚI, tự động điền danh mục đầu tiên vào ô select
      if (!selectedDish) {
        setFormData(prev => ({ ...prev, category_id: '' }));
      }

    } catch (error) {
      console.error("Lỗi tải dữ liệu thực đơn:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý Debounce cho thanh tìm kiếm (Đợi 0.5s sau khi gõ mới cập nhật)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset về trang 1 mỗi khi đổi Tab hoặc gõ tìm kiếm mới
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, debouncedQuery]);

  // Logic Lọc dữ liệu kết hợp (Tab + Tìm kiếm)
  const filteredDishes = dishes.filter(dish => {
    const catName = dish.categories?.name || 'Khác';
    const matchTab = activeTab === 'Tất cả' || catName === activeTab;
    const matchSearch = dish.name.toLowerCase().includes(debouncedQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalPages = Math.ceil(filteredDishes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDishes = filteredDishes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // XỬ LÝ FORM & DRAWER
  const handleOpenPopup = (dish) => {
    setSelectedDish(dish);
    if (dish) {
      // Chế độ Sửa món: Giữ đúng danh mục của món ăn đó
      setFormData({
        name: dish.name,
        price: dish.price,
        category_id: categoriesList.find(c => c.name === dish.categories?.name)?.id || '',
        description: dish.description || '',
        status: dish.status || 'available',
        instructions: dish.instructions ? dish.instructions[0] : null
      });
      setImagePreview(dish.image_url);
    } else {
      // CHẾ ĐỘ THÊM MỚI
      setFormData({
        name: '',
        price: '',
        category_id: '', // Đặt về rỗng ở đây
        description: '',
        status: 'available',
        instructions: null
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsDrawerOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Preview ảnh vừa chọn
    }
  };

  // 5. GỌI API THÊM / SỬA MÓN ĂN
  const handleSaveDish = async () => {
    if (!formData.name || !formData.price || !formData.category_id) {
      return alert("Vui lòng nhập đủ tên, giá và danh mục!");
    }
    if (!selectedDish && !imageFile) {
      return alert("Món ăn mới bắt buộc phải có hình ảnh!");
    }

    setIsSaving(true);
    try {
      // Vì backend dùng Multer nên phải gói dữ liệu vào FormData
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('price', formData.price);
      submitData.append('category_id', formData.category_id);
      submitData.append('description', formData.description);
      submitData.append('instructions', formData.instructions);
      
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      if (selectedDish) {
        // Cập nhật
        submitData.append('id', selectedDish.id);
        submitData.append('status', formData.status);
        const res = await axios.put(`${API_BASE_URL}/dishes/update`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) alert("Cập nhật thành công!");
      } else {
        // Thêm mới
        const res = await axios.post(`${API_BASE_URL}/dishes`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) alert("Thêm món mới thành công!");
      }

      setIsDrawerOpen(false);
      fetchData(); // Tải lại danh sách
    } catch (error) {
      console.error("Lỗi lưu món:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi lưu món ăn.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden relative">
      <AdminSidebar currentTab="dish" />
      <AdminHeader />

{/* MAIN CONTENT */}
      {/* 1. Ép chiều cao cố định h-screen cho toàn bộ khung màn hình bên phải sidebar */}
      <main className="ml-64 pt-24 p-8 w-full flex flex-col h-screen bg-culinaryBg">
        
        {/* Page Header & Actions */}
        <div className="flex flex-col gap-6 mb-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Thực đơn</h2>
              <p className="text-neutralCustom text-sm">Quản lý danh sách món ăn, giá cả và danh mục của nhà hàng.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => handleOpenPopup(null)}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-secondary active:scale-95 transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Thêm món ăn
              </button>
            </div>
          </div>

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

        {/* Bảng danh sách - Tổ chức Flex-col bọc ngoài */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Hộp trắng lớn: Ép h-full và overflow-hidden để chặn scroll tổng */}
          <div className="bg-white rounded-2xl border border-neutralCustom/20 overflow-hidden flex flex-col h-full shadow-sm mb-6">
            
            {/* TABS HEADER: Đứng im ở đỉnh hộp trắng */}
            <div className="flex justify-between items-center p-4 border-b border-neutralCustom/20 bg-culinaryBg/30 shrink-0">
              <div className="flex gap-6 overflow-x-auto no-scrollbar">
                {tabCategories.map((cat) => (
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

            {/* LIST CONTENT: Vùng chứa danh sách món ăn (Hiện thanh cuộn dọc riêng biệt tại đây) */}
            <div className="flex-1 overflow-y-auto relative custom-scrollbar">
              {isLoading ? (
                 <div className="flex justify-center py-10 text-neutralCustom">Đang tải dữ liệu thực đơn...</div>
              ) : paginatedDishes.length > 0 ? (
                paginatedDishes.map((dish) => (
                  <div 
                    key={dish.id} 
                    onClick={() => handleOpenPopup(dish)}
                    className={`flex items-center p-4 border-b border-neutralCustom/10 hover:bg-culinaryBg/50 transition-colors cursor-pointer group
                      ${dish.status === 'out_of_stock' ? 'opacity-75' : ''}
                    `}
                  >
                    <img 
                      src={dish.image_url || dish.image} 
                      alt={dish.name} 
                      className={`w-14 h-14 rounded-xl object-cover mr-4 shadow-sm ${dish.status === 'out_of_stock' ? 'grayscale-[50%]' : ''}`} 
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-base">{dish.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-sm font-bold ${dish.status === 'out_of_stock' ? 'text-neutralCustom' : 'text-primary'}`}>
                          {Number(dish.price).toLocaleString('vi-VN')}đ
                        </span>
                        <span className="text-neutralCustom/30 text-xs">•</span>
                        <span className="text-xs text-neutralCustom font-medium bg-neutralCustom/5 px-2 py-0.5 rounded-md">
                          {dish.categories?.name || dish.category || 'Khác'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {dish.status !== 'out_of_stock' ? (
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

            {/* THANH PHÂN TRANG: Khóa cứng ở đáy hộp trắng, không bị chạy khi cuộn món ăn */}
            {totalPages > 1 && (
              <div className="p-4 bg-culinaryBg/50 border-t border-neutralCustom/10 flex justify-center items-center text-sm shrink-0 rounded-b-2xl">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => prev - 1)} 
                    disabled={currentPage === 1} 
                    className="p-1.5 border border-neutralCustom/20 rounded-lg hover:bg-white text-neutralCustom disabled:opacity-50 transition-colors bg-white flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button 
                      key={page} 
                      onClick={() => setCurrentPage(page)} 
                      className={`px-3 py-1.5 rounded-lg shadow-sm transition-colors font-bold text-sm
                        ${currentPage === page 
                          ? 'bg-primary text-white' 
                          : 'bg-white hover:bg-gray-50 text-neutralCustom border border-neutralCustom/10'}
                      `}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => setCurrentPage(prev => prev + 1)} 
                    disabled={currentPage === totalPages || totalPages === 0} 
                    className="p-1.5 border border-neutralCustom/20 rounded-lg hover:bg-white text-neutralCustom disabled:opacity-50 transition-colors bg-white flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* OVERLAY & POPUP MODAL CHÍNH GIỮA */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* LỚP NỀN MỜ (BACKDROP) */}
          <div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !isSaving && setIsDrawerOpen(false)}
          ></div>

          {/* HỘP POPUP CHÍNH GIỮA */}
          <div 
            className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-neutralCustom/10 z-10 max-h-[85vh] animate-scale-up"
            style={{
              animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}
          >
            {/* Header Popup */}
            <div className="p-6 border-b border-neutralCustom/20 flex items-center justify-between bg-culinaryBg/30 shrink-0">
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
                className="p-2 hover:bg-neutralCustom/10 rounded-full transition-colors text-neutralCustom flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Nội dung Popup (Có scroll tự động nếu nội dung quá dài) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-white">
              
              {/* Khu vực Upload Ảnh */}
              <div 
                onClick={() => fileInputRef.current.click()} // Kích hoạt chọn ảnh khi bấm bất kỳ đâu trong khung
                className="relative h-48 w-full rounded-2xl overflow-hidden shadow-md bg-culinaryBg flex flex-col items-center justify-center border-2 border-dashed border-neutralCustom/30 cursor-pointer hover:bg-neutralCustom/5 transition-all group shrink-0"
                title="Bấm vào đây để thay đổi hình ảnh món ăn"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-neutralCustom/50 group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-4xl mb-1">add_photo_alternate</span>
                    <span className="text-sm font-medium">Bấm để chọn ảnh</span>
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden" 
                />
                
                {/* Cây bút nhỏ ở góc dưới vẫn giữ để báo hiệu, nhưng không bị tranh chấp sự kiện click */}
                <div className="absolute bottom-3 right-3 bg-white/90 p-2 rounded-lg shadow-sm group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </div>
              </div>

              {/* Các trường nhập liệu */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5 tracking-wide">Tên món ăn</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" 
                    placeholder="Nhập tên món ăn..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5 tracking-wide">Giá bán (VNĐ)</label>
                    <input 
                      type="number" 
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" 
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5 tracking-wide">Danh mục</label>
                    <select 
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer"
                    >
                      <option value="" disabled>Chọn Danh Mục</option>
                      {categoriesList.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5 tracking-wide">Mô tả ngắn</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" 
                    placeholder="Mô tả chi tiết món ăn..."
                  ></textarea>
                </div>
              </div>

              {/* Trạng thái kinh doanh */}
              {selectedDish && (
                <div className="flex items-center justify-between p-4 bg-culinaryBg/50 rounded-2xl border border-primary/20">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Trạng thái kinh doanh</p>
                    <p className="text-xs text-neutralCustom">Đang hiển thị trên thực đơn</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.status === 'available'}
                      onChange={(e) => setFormData({...formData, status: e.target.checked ? 'available' : 'out_of_stock'})}
                    />
                    <div className="w-11 h-6 bg-neutralCustom/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                  </label>
                </div>
              )}

              {/* Tóm tắt công thức */}
              {selectedDish && (
                <div className="p-4 border border-neutralCustom/20 bg-white rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-xl">menu_book</span>
                    <h4 className="font-bold text-sm">Quản lý Công thức</h4>
                  </div>
                  <p className="text-xs text-neutralCustom">Thiết lập định lượng nguyên liệu để hệ thống tự động trừ kho khi có đơn đặt món này.</p>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      navigate(`/admin/recipe-management/${selectedDish.id}`);
                    }}
                    className="inline-block text-xs font-bold text-secondary hover:underline mt-1"
                  >
                    Tới trang quản lý công thức chi tiết →
                  </button>
                </div>
              )}
            </div>

            {/* Footer Nút hành động */}
            <div className="p-6 border-t border-neutralCustom/20 bg-culinaryBg/20 flex gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 py-3 border border-neutralCustom/20 bg-white rounded-xl font-bold text-sm text-neutralCustom hover:bg-gray-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                type="button"
                onClick={handleSaveDish}
                disabled={isSaving}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-secondary transition-all active:scale-95 shadow-md disabled:opacity-50 flex items-center justify-center"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default DishManagement;