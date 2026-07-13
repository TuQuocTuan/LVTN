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

  // 🌟 STATES THAY THẾ ALERT VÀ CONFIRM MẶC ĐỊNH
  const [alertModal, setAlertModal] = useState({ show: false, message: '', title: 'Thông báo', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  // Lấy ra danh sách các Tabs (Lấy tên category độc nhất từ dishes đang có)
  const tabCategories = ['Tất cả', ...new Set(dishes.map(d => d.categories?.name || 'Khác'))];

  // Helper hiển thị hộp thoại alert tùy biến
  const showAlert = (message, type = 'success', title = 'Thông báo') => {
    setAlertModal({ show: true, message, title, type });
  };

  /* STREAMING_CHUNK: Thực hiện tải dữ liệu thực đơn từ Database */
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const dishRes = await axios.get(`${API_BASE_URL}/dishes`);
      if (dishRes.data.success) {
        setDishes(dishRes.data.data);
      }

      const response = await axios.get(`${API_BASE_URL}/categories`);
      const categoriesData = Array.isArray(response.data) ? response.data : [];
      setCategoriesList(categoriesData);

      if (!selectedDish) {
        setFormData(prev => ({ ...prev, category_id: '' }));
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu thực đơn:", error);
      showAlert("Gặp sự cố khi đồng bộ thực đơn từ máy chủ Làng MÌXI!", "error", "Lỗi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý Debounce cho thanh tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  /* STREAMING_CHUNK: Logic điều phối mở form Drawer chỉnh sửa món ăn */
  const handleOpenPopup = (dish) => {
    setSelectedDish(dish);
    if (dish) {
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
      setFormData({
        name: '',
        price: '',
        category_id: '',
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
      setImagePreview(URL.createObjectURL(file));
    }
  };

  /* STREAMING_CHUNK: Thực hiện lưu thông tin món ăn lên API thông qua FormData */
  const handleSaveDish = async () => {
    if (!formData.name || !formData.price || !formData.category_id) {
      return showAlert("Vui lòng nhập đủ tên, giá và danh mục món ăn!", "error", "Thiếu thông tin");
    }
    if (!selectedDish && !imageFile) {
      return showAlert("Món ăn mới bắt buộc phải tải lên hình ảnh minh họa!", "error", "Thiếu hình ảnh");
    }

    setIsSaving(true);
    try {
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
        submitData.append('id', selectedDish.id);
        submitData.append('status', formData.status);
        const res = await axios.put(`${API_BASE_URL}/dishes/update`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          showAlert("Cập nhật thông tin món ăn thành công!", "success", "Thành công");
        }
      } else {
        const res = await axios.post(`${API_BASE_URL}/dishes`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          showAlert("Thêm món ăn mới vào thực đơn thành công!", "success", "Thành công");
        }
      }

      setIsDrawerOpen(false);
      fetchData(); 
    } catch (error) {
      console.error("Lỗi lưu món:", error);
      showAlert(error.response?.data?.message || "Có lỗi xảy ra khi đồng bộ món ăn lên server Làng MÌXI.", "error", "Lỗi đồng bộ");
    } finally {
      setIsSaving(false);
    }
  };

  /* STREAMING_CHUNK: Render giao diện quản trị món ăn chuẩn PC/Laptop */
  return (
    <div className="bg-culinaryBg text-gray-900 font-sans h-screen flex overflow-hidden relative">
      <AdminSidebar currentTab="dish" />
      <AdminHeader />

      {/* 🌟 HỆ THỐNG CUSTOM ALERT MODAL AN TOÀN */}
      {alertModal.show && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-neutralCustom/10 text-center animate-scale-up">
            <div className={`w-16 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              alertModal.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              <span className="material-symbols-outlined text-3xl">
                {alertModal.type === 'success' ? 'check_circle' : 'error'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{alertModal.title}</h3>
            <p className="text-sm text-neutralCustom mb-6 leading-relaxed">{alertModal.message}</p>
            <button 
              onClick={() => setAlertModal({ show: false, message: '', title: 'Thông báo', type: 'success' })} 
              className={`w-full py-3 text-white font-bold rounded-xl text-sm transition-all shadow-md ${
                alertModal.type === 'success' ? 'bg-primary hover:bg-secondary' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              Đồng ý
            </button>
          </div>
        </div>
      )}

      {/* 🌟 HỆ THỐNG CUSTOM CONFIRM MODAL */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-neutralCustom/10 text-center animate-scale-up">
            <div className="w-16 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
              <span className="material-symbols-outlined text-3xl">info</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-neutralCustom mb-6 leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })} 
                className="w-1/2 py-3 border border-neutralCustom/20 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={confirmModal.onConfirm} 
                className="w-1/2 py-3 bg-primary text-white font-bold rounded-xl text-sm hover:bg-secondary transition-all"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="ml-64 pt-20 p-6 w-[calc(100%-16rem)] flex flex-col h-screen bg-culinaryBg overflow-hidden transition-all duration-300">
        <div className="w-full flex flex-col h-full overflow-hidden">
          
          {/* Page Header */}
          <div className="flex flex-col gap-4 mb-4 flex-shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-1 tracking-tight">Quản lý Thực đơn</h2>
                <p className="text-neutralCustom text-xs md:text-sm">Quản lý danh sách món ăn, giá bán và cấu trúc định lượng cho bếp Làng MÌXI.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleOpenPopup(null)}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold shadow-md hover:bg-secondary transition-all active:scale-95 text-xs md:text-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">add_circle</span>
                  Thêm món ăn mới
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <div className="relative w-full max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutralCustom text-xl">search</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm tên món ăn nướng lẩu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-neutralCustom/20 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Bảng danh sách - Thích ứng bề ngang rộng rãi của Laptop/PC */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-white rounded-2xl border border-neutralCustom/20 overflow-hidden flex flex-col h-full shadow-sm mb-6">

              <div className="flex justify-between items-center p-3.5 border-b border-neutralCustom/20 bg-stone-50/50 shrink-0">
                <div className="flex gap-6 overflow-x-auto no-scrollbar">
                  {tabCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={`pb-1 px-1 whitespace-nowrap text-xs md:text-sm font-black transition-colors border-b-2 cursor-pointer
                        ${activeTab === cat
                          ? 'text-primary border-primary'
                          : 'text-neutralCustom/70 border-transparent hover:text-primary'}
                      `}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-black px-3 py-1 rounded-full whitespace-nowrap ml-4">
                  {filteredDishes.length} món.
                </span>
              </div>

              {/* Vùng hiển thị danh sách có scrollbar thanh lịch */}
              <div className="flex-1 overflow-y-auto relative custom-scrollbar divide-y divide-neutralCustom/10">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-neutralCustom animate-pulse">
                    <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
                    <p className="mt-2 text-sm font-bold">Đang tải dữ liệu thực đơn Làng MÌXI...</p>
                  </div>
                ) : paginatedDishes.length > 0 ? (
                  paginatedDishes.map((dish) => (
                    <div
                      key={dish.id}
                      onClick={() => handleOpenPopup(dish)}
                      className={`flex items-center py-3 px-5 hover:bg-stone-50/80 transition-colors cursor-pointer group
                        ${dish.status === 'out_of_stock' ? 'opacity-75' : ''}
                      `}
                    >
                      <img
                        src={dish.image_url || dish.image}
                        alt={dish.name}
                        className={`w-12 h-12 rounded-lg object-cover mr-4 shadow-sm ${dish.status === 'out_of_stock' ? 'grayscale-[50%]' : ''}`}
                      />
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="font-extrabold text-gray-900 text-sm md:text-base truncate">{dish.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs md:text-sm font-bold ${dish.status === 'out_of_stock' ? 'text-neutralCustom' : 'text-primary'}`}>
                            {Number(dish.price).toLocaleString('vi-VN')} đ
                          </span>
                          <span className="text-neutralCustom/30 text-xs">•</span>
                          <span className="text-[10px] md:text-xs text-neutralCustom font-semibold bg-neutralCustom/5 px-2 py-0.5 rounded-md">
                            {dish.categories?.name || dish.category || 'Khác'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {dish.status !== 'out_of_stock' ? (
                          <div className="bg-primary/10 text-primary border border-primary/20 text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            Đang bán
                          </div>
                        ) : (
                          <div className="bg-neutralCustom/10 text-neutralCustom border border-neutralCustom/20 text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            Tạm ngưng
                          </div>
                        )}
                        <span className="material-symbols-outlined text-neutralCustom/40 group-hover:text-primary transition-colors text-lg">
                          chevron_right
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-neutralCustom/60 py-20">
                    <span className="material-symbols-outlined text-5xl mb-3">search_off</span>
                    <p className="font-bold">Không tìm thấy món ăn nào phù hợp với bộ lọc.</p>
                  </div>
                )}
              </div>

              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="p-3 bg-stone-50/50 border-t border-neutralCustom/10 flex justify-center items-center text-sm shrink-0 rounded-b-2xl">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1 border border-neutralCustom/20 rounded-lg hover:bg-white text-neutralCustom disabled:opacity-50 transition-colors bg-white flex items-center justify-center cursor-pointer w-9 h-9"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-lg shadow-sm transition-colors font-black text-xs md:text-sm cursor-pointer
                          ${currentPage === page
                            ? 'bg-primary text-white'
                            : 'bg-white hover:bg-gray-50 text-neutralCustom border border-neutralCustom/10'}
                        `}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-1 border border-neutralCustom/20 rounded-lg hover:bg-white text-neutralCustom disabled:opacity-50 transition-colors bg-white flex items-center justify-center cursor-pointer w-9 h-9"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* OVERLAY & POPUP MODAL CHÍNH GIỮA */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !isSaving && setIsDrawerOpen(false)}
          ></div>

          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-neutralCustom/10 z-10 max-h-[85vh] animate-scale-up">
            <div className="p-6 border-b border-neutralCustom/20 flex items-center justify-between bg-stone-50/50 shrink-0">
              <div>
                <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">
                  {selectedDish ? 'Chi tiết món ăn' : 'Thêm món mới'}
                </p>
                <h3 className="text-xl font-black text-gray-900">
                  {selectedDish ? selectedDish.name : 'Tạo món ăn mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-neutralCustom/10 rounded-full transition-colors text-neutralCustom flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-white">
              <div
                onClick={() => fileInputRef.current.click()}
                className="relative h-48 w-full rounded-2xl overflow-hidden shadow-md bg-stone-50 flex flex-col items-center justify-center border-2 border-dashed border-neutralCustom/30 cursor-pointer hover:bg-stone-100/50 transition-all group shrink-0"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-neutralCustom/50 group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-4xl mb-1">add_photo_alternate</span>
                    <span className="text-sm font-bold">Bấm để tải ảnh lên</span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />

                <div className="absolute bottom-3 right-3 bg-white/90 p-2 rounded-lg shadow-sm group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5 tracking-wide">Tên món ăn</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-semibold"
                    placeholder="Nhập tên món ăn..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5 tracking-wide">Giá bán (VNĐ)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-bold text-primary"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5 tracking-wide">Danh mục</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer font-bold"
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
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-medium text-gray-700"
                    placeholder="Mô tả chi tiết món ăn..."
                  ></textarea>
                </div>
              </div>

              {selectedDish && (
                <div className="flex items-center justify-between p-4 bg-stone-50/50 rounded-2xl border border-primary/20">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Trạng thái kinh doanh</p>
                    <p className="text-xs text-neutralCustom">Đang hiển thị trên thực đơn của quán</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.status === 'available'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'available' : 'out_of_stock' })}
                    />
                    <div className="w-11 h-6 bg-neutralCustom/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                  </label>
                </div>
              )}

              {selectedDish && (
                <div className="p-4 border border-neutralCustom/15 bg-white rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-xl">menu_book</span>
                    <h4 className="font-extrabold text-sm">Quản lý Công thức nấu nướng</h4>
                  </div>
                  <p className="text-xs text-neutralCustom">Định lượng chi tiết cấu trúc nguyên vật liệu chế biến giúp hệ thống tự động trừ kho khi có đơn.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      navigate(`/admin/recipe-management/${selectedDish.id}`);
                    }}
                    className="inline-block text-xs font-black text-secondary hover:underline mt-1 cursor-pointer"
                  >
                    Tới trang quản lý công thức chi tiết →
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-neutralCustom/20 bg-stone-50/50 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 py-3 border border-neutralCustom/20 bg-white rounded-xl font-bold text-sm text-neutralCustom hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveDish}
                disabled={isSaving}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-black text-sm hover:bg-secondary transition-all active:scale-95 shadow-md disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {isSaving ? (
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                ) : (
                  'Lưu thay đổi'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DishManagement;