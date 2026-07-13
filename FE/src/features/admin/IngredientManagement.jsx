import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const IngredientManagement = () => {
  const [activeCategory, setActiveCategory] = useState('Tất cả kho');
  const [searchQuery, setSearchQuery] = useState('');

  const [ingredients, setIngredients] = useState([]);
  const [categories, setCategories] = useState(['Tất cả kho']);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // STATE: Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // STATE: QUẢN LÝ THÊM MỚI (ADD)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addData, setAddData] = useState({
    name: '', quantity: '', unit: '', min_stock: '', category_id: ''
  });

  // STATE: QUẢN LÝ CHỈNH SỬA (EDIT)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    name: '', quantity: '', unit: '', min_stock: '', category_id: ''
  });

  // 🌟 STATES THAY THẾ ALERT VÀ CONFIRM MẶC ĐỊNH
  const [alertModal, setAlertModal] = useState({ show: false, message: '', title: 'Thông báo', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  const showAlert = (message, type = 'success', title = 'Thông báo') => {
    setAlertModal({ show: true, message, title, type });
  };

  /* STREAMING_CHUNK: Tải danh mục nguyên liệu từ Backend */
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories/category_ingredients`);
      const result = response.data;
      if (result.success && result.categories) {
        setCategoryOptions(result.categories);
        const categoryNames = result.categories.map(cat => cat.name);
        setCategories(['Tất cả kho', ...categoryNames]);
      }
    } catch (error) {
      console.error("Lỗi khi fetch danh mục:", error);
    }
  };

  /* STREAMING_CHUNK: Tải danh sách nguyên vật liệu chi tiết */
  const fetchIngredients = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/ingredients`);
      const result = response.data;

      if (result.success) {
        const formattedData = result.data.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          min_stock: item.min_stock,
          category: item.category_ingredients?.name || 'Khác',
          price: item.price || 0,
          image: item.image_url || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=150&h=150&fit=crop'
        }));
        setIngredients(formattedData);
      }
    } catch (error) {
      console.error("Lỗi khi fetch nguyên liệu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchIngredients();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // HÀM XỬ LÝ: THÊM NGUYÊN LIỆU
  const openAddModal = () => {
    setAddData({ name: '', quantity: '', unit: '', min_stock: '', category_id: '' });
    setIsAddModalOpen(true);
  };

  /* STREAMING_CHUNK: Submit thêm nguyên liệu an toàn */
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addData.category_id) return showAlert("Vui lòng chọn danh mục nguyên liệu phù hợp!", "error");

    try {
      setIsAdding(true);
      const payload = {
        name: addData.name,
        quantity: Number(addData.quantity),
        unit: addData.unit,
        min_stock: Number(addData.min_stock),
        category_id: Number(addData.category_id)
      };

      const response = await axios.post(`${API_URL}/ingredients/add`, payload);
      const result = response.data;

      if (result.success) {
        showAlert("Thêm mới nguyên liệu vào kho thành công!", "success", "Thành công");
        setIsAddModalOpen(false);
        fetchIngredients();
      } else {
        showAlert("Lỗi: " + (result.message || result.error || "Không xác định"), "error");
      }
    } catch (error) {
      showAlert("Không thể kết nối đến máy chủ quản lý kho Làng MÌXI!", "error");
    } finally {
      setIsAdding(false);
    }
  };

  // HÀM XỬ LÝ: SỬA NGUYÊN LIỆU
  const openEditModal = (item) => {
    setEditingId(item.id);
    const targetCategory = categoryOptions.find(c => c.name === item.category);
    setEditData({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      min_stock: item.min_stock,
      category_id: targetCategory ? targetCategory.id : ''
    });
    setIsEditModalOpen(true);
  };

  /* STREAMING_CHUNK: Submit cập nhật nguyên liệu an toàn */
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editData.category_id) return showAlert("Vui lòng lựa chọn danh mục nguyên liệu!", "error");

    try {
      setIsEditing(true);
      const payload = {
        id: editingId,
        name: editData.name,
        quantity: Number(editData.quantity),
        unit: editData.unit,
        min_stock: Number(editData.min_stock),
        category_id: Number(editData.category_id)
      };

      const response = await axios.put(`${API_URL}/ingredients/update`, payload);
      const result = response.data;

      if (result.success) {
        showAlert("Cập nhật nguyên liệu thành công!", "success", "Thành công");
        setIsEditModalOpen(false);
        fetchIngredients();
      } else {
        showAlert("Lỗi cập nhật: " + (result.message || result.error || "Không xác định"), "error");
      }
    } catch (error) {
      showAlert("Lỗi kết nối đến máy chủ!", "error");
    } finally {
      setIsEditing(false);
    }
  };

  // HÀM XỬ LÝ: XÓA NGUYÊN LIỆU (THAY THẾ WINDOW.CONFIRM)
  const handleDelete = (id, name) => {
    setConfirmModal({
      show: true,
      title: "Xóa nguyên liệu",
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn nguyên liệu "${name}" ra khỏi kho quản trị?`,
      onConfirm: async () => {
        try {
          const response = await axios.delete(`${API_URL}/ingredients/delete/${id}`);
          const result = response.data;
          if (result.success) {
            showAlert("Xóa nguyên liệu thành công!", "success", "Xóa thành công");
            fetchIngredients();
          } else {
            showAlert("Lỗi: " + (result.message || result.error || "Không thể thực hiện xóa"), "error");
          }
        } catch (error) {
          showAlert("Gặp sự cố kết nối máy chủ!", "error");
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // RENDER DỮ LIỆU
  const getStockStatus = (quantity, min_stock) => {
    if (min_stock === 0) return { color: 'text-green-600', bg: 'bg-green-500', barWidth: '100%' };
    const percentage = Math.min((quantity / min_stock) * 100, 100);

    if (quantity > min_stock) {
      return { color: 'text-green-600', bg: 'bg-green-500', barWidth: '100%' };
    }
    else if (quantity >= min_stock / 2) {
      return { color: 'text-amber-600', bg: 'bg-amber-500', barWidth: `${percentage}%` };
    }
    else {
      return { color: 'text-red-600', bg: 'bg-red-500', barWidth: `${percentage}%` };
    }
  };

  const filteredIngredients = ingredients.filter(item => {
    const matchCategory = activeCategory === 'Tất cả kho' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(debouncedQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  useEffect(() => setCurrentPage(1), [activeCategory, debouncedQuery]);

  const totalPages = Math.ceil(filteredIngredients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedIngredients = filteredIngredients.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  /* STREAMING_CHUNK: Render giao diện quản lý kho nguyên liệu trên PC/Laptop */
  return (
    <div className="bg-culinaryBg text-gray-900 font-sans h-screen flex overflow-hidden relative">
      <AdminSidebar currentTab="inventory" />
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
                className="w-1/2 py-3 border border-neutralCustom/20 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={confirmModal.onConfirm} 
                className="w-1/2 py-3 bg-primary text-white font-bold rounded-xl text-sm hover:bg-secondary transition-all cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="ml-64 pt-20 p-6 w-[calc(100%-16rem)] flex flex-col h-screen overflow-hidden transition-all duration-300">
        
        {/* Header Bar */}
        <div className="flex flex-col gap-4 mb-4 flex-shrink-0">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Quản lý Nguyên vật liệu</h2>
              <p className="text-neutralCustom text-xs font-medium">Theo dõi sát sao định lượng tồn kho và cảnh báo nhập hàng cho bếp Làng MÌXI.</p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-secondary transition-all active:scale-95 text-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              Thêm nguyên liệu mới
            </button>
          </div>

          <div className="flex items-center">
            <div className="relative w-full max-w-md group">
              <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${searchQuery ? 'text-primary' : 'text-neutralCustom group-focus-within:text-primary'}`}>search</span>
              <input type="text" placeholder="Tìm kiếm tên nguyên liệu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-10 py-2 bg-white border border-neutralCustom/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutralCustom hover:text-red-500 transition-colors p-1 rounded-full cursor-pointer"><span className="material-symbols-outlined text-[18px]">close</span></button>}
            </div>
          </div>
        </div>

        {/* Bảng danh sách */}
        <div className="flex-1 overflow-hidden">
          <div className="bg-white rounded-2xl border border-neutralCustom/20 overflow-hidden flex flex-col h-full shadow-sm">
            <div className="p-3 bg-stone-50/50 border-b border-neutralCustom/20 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${activeCategory === cat ? 'bg-primary text-white shadow-sm' : 'text-neutralCustom hover:bg-white border border-transparent'}`}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-stone-50/30 border-b border-neutralCustom/10 text-neutralCustom font-black uppercase text-[10px] sm:text-[11px] tracking-widest shrink-0 items-center">
              <div className="col-span-3">Chi tiết mặt hàng</div>
              <div className="col-span-1 text-center">Đơn vị</div>
              <div className="col-span-3">Tồn kho hiện tại</div>
              <div className="col-span-2 text-center">Cảnh báo</div>
              <div className="col-span-2 text-right">Đơn giá</div>
              <div className="col-span-1 text-right whitespace-nowrap">Thao tác</div>
            </div>

            <div className="flex-1 overflow-y-auto relative custom-scrollbar divide-y divide-neutralCustom/10">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-neutralCustom/60 py-20 animate-pulse">
                  <span className="material-symbols-outlined text-4xl animate-spin text-primary">hourglass_empty</span>
                  <p className="mt-2 font-bold text-sm">Đang tải dữ liệu kho Làng MÌXI...</p>
                </div>
              ) : paginatedIngredients.length > 0 ? (
                paginatedIngredients.map((item) => {
                  const status = getStockStatus(item.quantity, item.min_stock);
                  const isOutOfStock = item.quantity === 0;

                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-2.5 hover:bg-stone-50/60 transition-colors items-center group">
                      <div className="col-span-3 flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-lg bg-stone-100 overflow-hidden border border-neutralCustom/15 shadow-sm shrink-0 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}>
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold text-xs truncate ${isOutOfStock ? 'text-neutralCustom/60 line-through' : 'text-gray-900'}`}>{item.name}</p>
                          <p className="text-neutralCustom text-[10px] mt-0.5 font-bold">{item.category}</p>
                        </div>
                      </div>

                      <div className="col-span-1 text-gray-900 text-xs font-semibold text-center">{item.unit}</div>

                      <div className="col-span-3 pr-4">
                        <div className="flex flex-col gap-1">
                          <span className={`${status.color} font-bold text-xs`}>{item.quantity} {item.unit}</span>
                          <div className="w-full bg-neutralCustom/10 h-1 rounded-full overflow-hidden">
                            <div className={`${status.bg} h-full transition-all duration-500`} style={{ width: status.barWidth }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 text-neutralCustom text-xs font-bold text-center">{item.min_stock} {item.unit}</div>

                      <div className="col-span-2 text-gray-900 text-xs font-bold text-right">
                        {item.price > 0 ? `${item.price.toLocaleString('vi-VN')} đ` : '---'}
                      </div>

                      <div className="col-span-1 flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(item)} className="p-1.5 text-neutralCustom hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer" title="Chỉnh sửa">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button onClick={() => handleDelete(item.id, item.name)} className="p-1.5 text-neutralCustom hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Xóa">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-neutralCustom/60 py-20">
                  <span className="material-symbols-outlined text-5xl mb-3">inventory_2</span>
                  <p className="font-bold">Không tìm thấy nguyên liệu nào phù hợp.</p>
                </div>
              )}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="p-3 bg-stone-50/50 border-t border-neutralCustom/10 flex justify-center items-center text-sm shrink-0">
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1 border border-neutralCustom/20 rounded-lg hover:bg-white text-neutralCustom disabled:opacity-50 flex items-center justify-center bg-white w-8 h-8 cursor-pointer"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg shadow-sm font-bold text-xs cursor-pointer ${currentPage === page ? 'bg-primary text-white' : 'hover:bg-white text-neutralCustom border border-neutralCustom/10 bg-white'}`}>{page}</button>
                  ))}
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 border border-neutralCustom/20 rounded-lg hover:bg-white text-neutralCustom disabled:opacity-50 flex items-center justify-center bg-white w-8 h-8 cursor-pointer"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* MODAL THÊM NGUYÊN LIỆU (ADD) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up border border-neutralCustom/10">
            <div className="p-5 border-b border-neutralCustom/20 flex items-center justify-between bg-stone-50/50">
              <h3 className="text-lg font-black text-gray-900">Thêm nguyên liệu mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 hover:bg-neutralCustom/10 rounded-full text-neutralCustom cursor-pointer flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6">
              <form id="addIngredientForm" onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Tên nguyên liệu *</label>
                  <input type="text" required value={addData.name} onChange={(e) => setAddData({ ...addData, name: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary font-semibold" placeholder="Nhập tên..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Danh mục *</label>
                  <select required value={addData.category_id} onChange={(e) => setAddData({ ...addData, category_id: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary cursor-pointer font-bold bg-white">
                    <option value="" disabled>-- Chọn danh mục --</option>
                    {categoryOptions.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Đơn vị tính *</label>
                  <input type="text" required value={addData.unit} onChange={(e) => setAddData({ ...addData, unit: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary font-semibold" placeholder="g, kg, ml, lon..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Số lượng đầu *</label>
                    <input type="number" step="any" min="0" required value={addData.quantity} onChange={(e) => setAddData({ ...addData, quantity: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary font-bold text-primary" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Mức cảnh báo *</label>
                    <input type="number" step="any" min="0" required value={addData.min_stock} onChange={(e) => setAddData({ ...addData, min_stock: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary font-bold text-red-500" placeholder="0" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-neutralCustom/20 bg-stone-50/50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-neutralCustom border border-neutralCustom/20 hover:bg-white cursor-pointer bg-white">Hủy</button>
              <button type="submit" form="addIngredientForm" disabled={isAdding} className="px-6 py-2.5 rounded-xl font-black text-sm text-white bg-primary hover:bg-secondary shadow-md flex gap-2 justify-center items-center min-w-[120px] cursor-pointer">
                {isAdding ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA NGUYÊN LIỆU (EDIT) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up border border-neutralCustom/10">
            <div className="p-5 border-b border-neutralCustom/20 flex items-center justify-between bg-stone-50/50">
              <h3 className="text-lg font-black text-gray-900">Chỉnh sửa nguyên liệu</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 hover:bg-neutralCustom/10 rounded-full text-neutralCustom cursor-pointer flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6">
              <form id="editIngredientForm" onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Tên nguyên liệu *</label>
                  <input type="text" required value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Danh mục *</label>
                  <select required value={editData.category_id} onChange={(e) => setEditData({ ...editData, category_id: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary cursor-pointer font-bold bg-white">
                    <option value="" disabled>-- Chọn danh mục --</option>
                    {categoryOptions.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Đơn vị tính *</label>
                  <input type="text" required value={editData.unit} onChange={(e) => setEditData({ ...editData, unit: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary font-semibold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Số lượng *</label>
                    <input type="number" step="any" min="0" required value={editData.quantity} onChange={(e) => setEditData({ ...editData, quantity: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary font-bold text-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Cảnh báo tồn *</label>
                    <input type="number" step="any" min="0" required value={editData.min_stock} onChange={(e) => setEditData({ ...editData, min_stock: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary font-bold text-red-500" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-neutralCustom/20 bg-stone-50/50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-neutralCustom border border-neutralCustom/20 hover:bg-white cursor-pointer bg-white">Hủy</button>
              <button type="submit" form="editIngredientForm" disabled={isEditing} className="px-6 py-2.5 rounded-xl font-black text-sm text-white bg-primary hover:bg-secondary shadow-md flex gap-2 justify-center items-center min-w-[120px] cursor-pointer">
                {isEditing ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientManagement;