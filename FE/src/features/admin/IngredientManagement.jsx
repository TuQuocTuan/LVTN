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

  // GỌI API LẤY DANH MỤC
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

  // GỌI API LẤY NGUYÊN LIỆU
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

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addData.category_id) return alert("Vui lòng chọn danh mục!");

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
      const result = response.data
      
      if (result.success) {
        alert("Thêm nguyên liệu thành công!");
        setIsAddModalOpen(false);
        fetchIngredients();
      } else {
        alert("Lỗi: " + (result.message || result.error || "Không xác định"));
      }
    } catch (error) {
      alert("Lỗi kết nối đến máy chủ!");
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editData.category_id) return alert("Vui lòng chọn danh mục!");

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
        alert("Cập nhật nguyên liệu thành công!");
        setIsEditModalOpen(false);
        fetchIngredients();
      } else {
        alert("Lỗi: " + (result.message || result.error || "Không xác định"));
      }
    } catch (error) {
      alert("Lỗi kết nối đến máy chủ!");
    } finally {
      setIsEditing(false);
    }
  };

  // HÀM XỬ LÝ: XÓA NGUYÊN LIỆU
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${name}" không?`)) return;
    try {
      const response = await axios.delete(`${API_URL}/ingredients/delete/${id}`);
      const result = response.data;
      if (result.success) {
        alert("Xóa thành công!");
        fetchIngredients();
      } else {
        alert("Lỗi: " + (result.message || result.error || "Không thể xóa"));
      }
    } catch (error) {
      alert("Lỗi kết nối máy chủ!");
    }
  };

  // RENDER DỮ LIỆU
  const getStockStatus = (quantity, min_stock) => {
    if (quantity === 0) return { color: 'text-red-500', bg: 'bg-red-500', barWidth: '0%' };
    if (quantity < min_stock) return { color: 'text-red-600', bg: 'bg-red-500', barWidth: `${(quantity / min_stock) * 50}%` };
    if (quantity < min_stock * 1.5) return { color: 'text-tertiary', bg: 'bg-tertiary', barWidth: '75%' };
    return { color: 'text-green-600', bg: 'bg-green-500', barWidth: '100%' };
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

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden relative">
      <AdminSidebar currentTab="inventory" />
      <AdminHeader />

      <main className="ml-64 pt-24 p-8 w-full flex flex-col h-screen">
        
        {/* Header Bar */}
        <div className="flex flex-col gap-6 mb-6 flex-shrink-0">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Nguyên vật liệu</h2>
              <p className="text-neutralCustom text-sm">Quản lý nguyên liệu, mức tồn kho và cảnh báo nhập hàng cho hệ thống.</p>
            </div>
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-secondary transition-all active:scale-95 text-sm"
            >
              <span className="material-symbols-outlined text-[20px]">add_box</span>
              Thêm nguyên liệu mới
            </button>
          </div>

          <div className="flex items-center">
            <div className="relative w-full max-w-md group">
              <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${searchQuery ? 'text-primary' : 'text-neutralCustom group-focus-within:text-primary'}`}>search</span>
              <input type="text" placeholder="Tìm kiếm tên nguyên liệu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-10 py-2.5 bg-white border border-neutralCustom/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutralCustom hover:text-red-500 transition-colors p-1 rounded-full"><span className="material-symbols-outlined text-[18px]">close</span></button>}
            </div>
          </div>
        </div>

        {/* Bảng danh sách */}
        <div className="flex-1 overflow-hidden">
          <div className="bg-white rounded-2xl border border-neutralCustom/20 overflow-hidden flex flex-col h-full shadow-sm">
            <div className="p-4 bg-culinaryBg/30 border-b border-neutralCustom/20 flex gap-2 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-primary text-white shadow-sm' : 'text-neutralCustom hover:bg-white border border-transparent'}`}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-culinaryBg/50 border-b border-neutralCustom/10 text-neutralCustom font-bold uppercase text-[11px] tracking-widest shrink-0 items-center">
              <div className="col-span-4">Chi tiết mặt hàng</div>
              <div className="col-span-1">Đơn vị</div>
              <div className="col-span-3">Tồn kho hiện tại</div>
              <div className="col-span-1 text-center">Cảnh báo</div>
              <div className="col-span-2 text-right">Đơn giá</div>
              <div className="col-span-1 text-right">Thao tác</div>
            </div>

            <div className="flex-1 overflow-y-auto relative custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-neutralCustom/60 py-10 animate-pulse">
                  <span className="material-symbols-outlined text-4xl mb-2">hourglass_empty</span>
                  <p>Đang tải dữ liệu kho...</p>
                </div>
              ) : paginatedIngredients.length > 0 ? (
                paginatedIngredients.map((item) => {
                  const status = getStockStatus(item.quantity, item.min_stock);
                  const isOutOfStock = item.quantity === 0;

                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-neutralCustom/10 hover:bg-culinaryBg/40 transition-colors items-center group">
                      <div className="col-span-4 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-culinaryBg overflow-hidden border border-neutralCustom/20 shadow-sm shrink-0 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}>
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold text-sm truncate ${isOutOfStock ? 'text-neutralCustom/60 line-through' : 'text-gray-900'}`}>{item.name}</p>
                          <p className="text-neutralCustom text-xs mt-0.5">{item.category}</p>
                        </div>
                      </div>

                      <div className="col-span-1 text-gray-900 text-sm font-medium">{item.unit}</div>

                      <div className="col-span-3 pr-6">
                        <div className="flex flex-col gap-1.5">
                          <span className={`${status.color} font-bold text-sm`}>{item.quantity} {item.unit}</span>
                          <div className="w-full bg-neutralCustom/10 h-1.5 rounded-full overflow-hidden">
                            <div className={`${status.bg} h-full transition-all duration-500`} style={{ width: status.barWidth }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1 text-neutralCustom text-sm font-medium text-center">{item.min_stock} {item.unit}</div>

                      <div className="col-span-2 text-gray-900 text-sm font-bold text-right">
                        {item.price > 0 ? `${item.price.toLocaleString('vi-VN')} đ` : '---'}
                      </div>

                      <div className="col-span-1 flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(item)} className="p-1.5 text-neutralCustom hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Chỉnh sửa">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => handleDelete(item.id, item.name)} className="p-1.5 text-neutralCustom hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
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

            <div className="p-4 bg-culinaryBg/30 border-t border-neutralCustom/10 flex justify-center items-center text-sm shrink-0">
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1} className="p-1.5 border border-neutralCustom/20 rounded-lg hover:bg-white text-neutralCustom disabled:opacity-50"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded-lg shadow-sm ${currentPage === page ? 'bg-primary text-white font-bold' : 'hover:bg-white text-neutralCustom'}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 border border-neutralCustom/20 rounded-lg hover:bg-white text-neutralCustom disabled:opacity-50"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* MODAL THÊM NGUYÊN LIỆU (ADD) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-neutralCustom/20 flex items-center justify-between bg-culinaryBg">
              <h3 className="text-xl font-bold text-gray-900">Thêm nguyên liệu mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 hover:bg-neutralCustom/10 rounded-full text-neutralCustom">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6">
              <form id="addIngredientForm" onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Tên nguyên liệu *</label>
                  <input type="text" required value={addData.name} onChange={(e) => setAddData({...addData, name: e.target.value})} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Danh mục *</label>
                  <select required value={addData.category_id} onChange={(e) => setAddData({...addData, category_id: e.target.value})} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary cursor-pointer">
                    <option value="" disabled>-- Chọn danh mục --</option>
                    {categoryOptions.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Đơn vị tính *</label>
                  <input type="text" required value={addData.unit} onChange={(e) => setAddData({...addData, unit: e.target.value})} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Số lượng đầu *</label>
                    <input type="number" step="any" min="0" required value={addData.quantity} onChange={(e) => setAddData({...addData, quantity: e.target.value})} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Mức cảnh báo *</label>
                    <input type="number" step="any" min="0" required value={addData.min_stock} onChange={(e) => setAddData({...addData, min_stock: e.target.value})} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-neutralCustom/20 bg-culinaryBg flex justify-end gap-3">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-neutralCustom border border-neutralCustom/20 hover:bg-white">Hủy</button>
              <button type="submit" form="addIngredientForm" disabled={isAdding} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-secondary shadow-md flex gap-2 justify-center items-center min-w-[120px]">
                {isAdding ? 'Đang lưu...' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA NGUYÊN LIỆU (EDIT) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-neutralCustom/20 flex items-center justify-between bg-culinaryBg">
              <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa nguyên liệu</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 hover:bg-neutralCustom/10 rounded-full text-neutralCustom">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6">
              <form id="editIngredientForm" onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Tên nguyên liệu *</label>
                  <input type="text" required value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Danh mục *</label>
                  <select required value={editData.category_id} onChange={(e) => setEditData({...editData, category_id: e.target.value})} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary cursor-pointer">
                    <option value="" disabled>-- Chọn danh mục --</option>
                    {categoryOptions.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Đơn vị tính *</label>
                  <input type="text" required value={editData.unit} onChange={(e) => setEditData({...editData, unit: e.target.value})} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Số lượng *</label>
                    <input type="number" step="any" min="0" required value={editData.quantity} onChange={(e) => setEditData({...editData, quantity: e.target.value})} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5">Cảnh báo tồn *</label>
                    <input type="number" step="any" min="0" required value={editData.min_stock} onChange={(e) => setEditData({...editData, min_stock: e.target.value})} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-neutralCustom/20 bg-culinaryBg flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-neutralCustom border border-neutralCustom/20 hover:bg-white">Hủy</button>
              <button type="submit" form="editIngredientForm" disabled={isEditing} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-secondary shadow-md flex gap-2 justify-center items-center min-w-[120px]">
                {isEditing ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default IngredientManagement;