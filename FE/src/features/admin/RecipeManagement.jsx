import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// Lấy địa chỉ API từ biến môi trường
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const RecipeManagement = () => {
  const navigate = useNavigate();
  // Lấy ID món ăn từ đường dẫn URL (ví dụ: /admin/recipe-management/5 -> dishId = 5)
  const { dishId } = useParams();

  // =========================================================================
  // 1. KHAI BÁO CÁC STATE QUẢN LÝ DỮ LIỆU HIỂN THỊ CHÍNH
  // =========================================================================
  const [versions, setVersions] = useState([]); // Chứa danh sách các version công thức (VD: [2, 1])
  const [selectedVersion, setSelectedVersion] = useState(''); // Version đang được chọn để xem
  const [dishName, setDishName] = useState('Đang tải...'); // Tên món ăn hiển thị trên tiêu đề
  const [ingredients, setIngredients] = useState([]); // Danh sách nguyên liệu thật từ DB
  const [isLoading, setIsLoading] = useState(true); // Trạng thái màn hình chờ (Loading)
  const [isSaving, setIsSaving] = useState(false); // Trạng thái vô hiệu hóa nút khi đang gọi API lưu
  const [allIngredients, setAllIngredients] = useState([]); // Toàn bộ kho nguyên liệu dùng cho thẻ <select>

  // 🌟 Dữ liệu ảo (Mock Data) cho phần Hướng dẫn vì Backend chưa có API
  const [mockInstructions, setMockInstructions] = useState([
    { step: 1, title: 'Trụng phở', desc: 'Trụng qua nước sôi 10 giây cho tơi và nóng.', warning: '' },
    { step: 2, title: 'Chan nước dùng', desc: 'Chan nước dùng đang sôi (> 95°C) ngập phở.', warning: 'Cẩn thận bỏng.' }
  ]);

  // =========================================================================
  // 2. KHAI BÁO CÁC STATE QUẢN LÝ MODAL (POPUP) VÀ DỮ LIỆU FORM
  // =========================================================================
  const [isEditIngModalOpen, setIsEditIngModalOpen] = useState(false); // Đóng/mở Popup sửa nguyên liệu
  const [isEditStepModalOpen, setIsEditStepModalOpen] = useState(false); // Đóng/mở Popup sửa các bước
  const [editIngredients, setEditIngredients] = useState([]); // Dữ liệu mảng nguyên liệu đang bị chỉnh sửa
  const [editInstructions, setEditInstructions] = useState([]); // Dữ liệu mảng các bước đang bị chỉnh sửa

  // =========================================================================
  // 3. CÁC HÀM GỌI API (FETCH DATA)
  // =========================================================================
  
  // Chạy 1 lần duy nhất khi vào trang hoặc khi dishId trên URL thay đổi
  useEffect(() => {
    if (dishId) {
      fetchRecipeVersions(dishId);
      fetchAllIngredients(); // Lấy sẵn kho nguyên liệu để tí nữa chọn
    }
  }, [dishId]);

  // Hàm lấy danh sách kho nguyên liệu
  const fetchAllIngredients = async () => {
    try {
      const res = await axios.get(`${API_URL}/ingredients`);
      if (res.data.success) setAllIngredients(res.data.data);
    } catch (error) { 
      console.error("Lỗi lấy kho nguyên liệu:", error); 
    }
  };

  // Hàm lấy danh sách các version công thức của món ăn
  const fetchRecipeVersions = async (id) => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/recipes/version?dish_id=${id}`);
      
      if (res.data.success && res.data.data.length > 0) {
        const verList = res.data.data;
        setVersions(verList);
        setSelectedVersion(verList[0]); // Tự động chọn version mới nhất
        fetchRecipeDetailByVersion(id, verList[0]); // Gọi tiếp hàm lấy chi tiết của version đó
      } else {
        setDishName("Món ăn chưa có công thức");
        setVersions([]);
        setIngredients([]);
      }
    } catch (error) {
      console.error("Lỗi lấy version công thức:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm lấy chi tiết công thức (Nguyên liệu thật)
  const fetchRecipeDetailByVersion = async (id, version) => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/recipes/by-version?dish_id=${id}&version=${version}`);
      
      if (res.data.success && res.data.data.length > 0) {
        const data = res.data.data;
        setDishName(data[0]?.dishes?.name || 'Chưa cập nhật tên');
        
        // Format lại dữ liệu nguyên liệu để dễ hiển thị
        const formattedIngredients = data.map(item => ({
          id: item.id,
          ingredient_id: item.ingredient_id, 
          name: item.ingredients?.name,
          amount: item.amount_required,
          unit: item.ingredients?.unit
        }));
        setIngredients(formattedIngredients);
      } else {
        setIngredients([]);
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết công thức:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // 4. CÁC HÀM XỬ LÝ SỰ KIỆN MỞ MODAL VÀ THAO TÁC FORM (ĐỘNG)
  // =========================================================================

  // --- Cho phần Nguyên liệu ---
  const handleOpenEditIngModal = () => {
    // Copy dữ liệu hiển thị hiện tại vào state của Form để bắt đầu sửa
    if (ingredients.length > 0) {
      const formIngs = ingredients.map(ing => ({
        ingredient_id: ing.ingredient_id || '',
        amount_required: ing.amount,
        unit: ing.unit
      }));
      setEditIngredients(formIngs);
    } else {
      // Nếu chưa có gì thì khởi tạo 1 dòng trống
      setEditIngredients([{ ingredient_id: '', amount_required: '', unit: '' }]);
    }
    setIsEditIngModalOpen(true);
  };

  const handleAddIngRow = () => setEditIngredients([...editIngredients, { ingredient_id: '', amount_required: '', unit: '' }]);
  const handleRemoveIngRow = (index) => setEditIngredients(editIngredients.filter((_, i) => i !== index));
  const handleChangeIng = (index, field, value) => {
    const newIngs = [...editIngredients];
    newIngs[index][field] = value;
    // Auto-fill đơn vị tính khi chọn tên nguyên liệu
    if (field === 'ingredient_id') {
      const selected = allIngredients.find(i => i.id === Number(value));
      if (selected) newIngs[index].unit = selected.unit;
    }
    setEditIngredients(newIngs);
  };

  // --- Cho phần Các bước thực hiện ---
  const handleOpenEditStepModal = () => {
    // Nạp mảng Mock Data vào Form để bắt đầu sửa
    setEditInstructions([...mockInstructions]);
    setIsEditStepModalOpen(true);
  };

  const handleAddStep = () => setEditInstructions([...editInstructions, { step: editInstructions.length + 1, title: '', desc: '', warning: '' }]);
  const handleRemoveStep = (index) => {
    // Xóa bước và tự động đánh lại số thứ tự (step)
    const newSteps = editInstructions.filter((_, i) => i !== index).map((s, i) => ({ ...s, step: i + 1 }));
    setEditInstructions(newSteps);
  };
  const handleChangeStep = (index, field, value) => {
    const newSteps = [...editInstructions];
    newSteps[index][field] = value;
    setEditInstructions(newSteps);
  };

  // =========================================================================
  // 5. CÁC HÀM GỌI API LƯU DỮ LIỆU
  // =========================================================================

  // 🟢 Lưu Nguyên Liệu (Đã kết nối Database thật)
  const handleSaveIngredients = async () => {
    if (editIngredients.some(i => !i.ingredient_id || !i.amount_required)) {
      return alert("Vui lòng chọn đầy đủ tên nguyên liệu và số lượng!");
    }
    setIsSaving(true);
    try {
      const payload = {
        dish_id: dishId,
        ingredients: editIngredients.map(i => ({
          ingredient_id: Number(i.ingredient_id),
          amount_required: Number(i.amount_required)
        }))
      };
      const res = await axios.put(`${API_URL}/recipes/update`, payload);
      
      if (res.data.success) {
        alert("Cập nhật nguyên liệu thành công!");
        setIsEditIngModalOpen(false);
        fetchRecipeVersions(dishId); // Reload lại trang để thấy bản cập nhật mới
      }
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi lưu nguyên liệu vào kho!");
    } finally {
      setIsSaving(false);
    }
  };

  // 🔴 Lưu Hướng Dẫn (Lưu tạm trên State vì Backend chưa làm API)
  const handleSaveInstructions = async () => {
    setIsSaving(true);
    try {
      // Tạm thời lưu vào state, sau này gọi API `dishes/update-instructions`
      setMockInstructions(editInstructions);
      alert("Cập nhật các bước thực hiện thành công (Đang lưu tạm trên giao diện)!");
      setIsEditStepModalOpen(false); // Đóng Modal
    } catch (error) {
      alert("Lỗi khi lưu hướng dẫn!");
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================================
  // 6. RENDER GIAO DIỆN (UI)
  // =========================================================================
  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden relative">
      <AdminSidebar currentTab="recipes" />
      <AdminHeader />

      <main className="ml-64 pt-24 p-8 w-full flex flex-col h-screen">
        
        {/* === HEADER TRANG === */}
        <div className="mb-8 flex-shrink-0">
          <div onClick={() => navigate('/admin/dish-management')} className="flex items-center gap-2 text-neutralCustom mb-4 hover:text-primary cursor-pointer transition-colors w-fit">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="text-sm font-bold">Trở về Quản lý món ăn</span>
          </div>

          <div className="flex justify-between items-end border-b border-neutralCustom/20 pb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{dishName}</h2>
              <p className="text-sm text-neutralCustom mt-1">Lưu trữ {versions.length} phiên bản công thức</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Dropdown chọn phiên bản công thức */}
              {versions.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 border border-neutralCustom/20 rounded-xl bg-white shadow-sm text-sm">
                  <span className="font-bold text-neutralCustom">Phiên bản:</span>
                  <select
                    value={selectedVersion}
                    onChange={(e) => {
                      const newVer = Number(e.target.value);
                      setSelectedVersion(newVer);
                      fetchRecipeDetailByVersion(dishId, newVer); // Tải lại data khi đổi Version
                    }}
                    className="bg-transparent text-primary font-bold outline-none cursor-pointer"
                  >
                    {versions.map((v, index) => (
                      <option key={v} value={v}>Version {v} {index === 0 ? '(Mới nhất)' : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutralCustom/20 text-neutralCustom font-bold rounded-xl hover:bg-culinaryBg transition-colors shadow-sm text-sm">
                <span className="material-symbols-outlined text-[18px]">print</span>
                In C.Thức
              </button>
            </div>
          </div>
        </div>

        {/* === NỘI DUNG HIỂN THỊ CHÍNH (READ-ONLY) === */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden pb-6">
          
          {/* CỘT 1: BẢNG NGUYÊN LIỆU */}
          <div className="lg:col-span-4 h-full flex flex-col">
            <div className="bg-white rounded-2xl border border-neutralCustom/20 overflow-hidden flex flex-col h-full shadow-sm">
              <div className="p-4 border-b border-neutralCustom/20 bg-culinaryBg/30 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">kitchen</span>Nguyên Liệu
                </h3>
                {/* NÚT SỬA NGUYÊN LIỆU */}
                <button onClick={handleOpenEditIngModal} className="text-sm font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-[16px]">edit</span> Sửa
                </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="divide-y divide-neutralCustom/10">
                  {isLoading ? (
                    <div className="text-center py-5 text-neutralCustom">Đang tải...</div>
                  ) : ingredients.length > 0 ? (
                    ingredients.map((item) => (
                      <div key={item.id} className="py-3.5 flex justify-between items-center">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-md">{item.amount} {item.unit}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-5 text-neutralCustom">Chưa cấu hình nguyên liệu trừ kho.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CỘT 2: BẢNG HƯỚNG DẪN THỰC HIỆN */}
          <div className="lg:col-span-8 h-full flex flex-col">
            <div className="bg-white rounded-2xl border border-neutralCustom/20 overflow-hidden flex flex-col h-full shadow-sm">
              <div className="p-4 border-b border-neutralCustom/20 bg-culinaryBg/30 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">format_list_numbered</span>Các Bước Thực Hiện
                </h3>
                {/* NÚT SỬA HƯỚNG DẪN */}
                <button onClick={handleOpenEditStepModal} className="text-sm font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-[16px]">edit</span> Sửa
                </button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <ol className="space-y-6 list-decimal list-inside marker:text-primary marker:font-bold marker:text-lg">
                  {mockInstructions.length > 0 ? (
                    mockInstructions.map((inst, idx) => (
                      <li key={idx} className="text-neutralCustom text-sm leading-relaxed pl-2">
                        <span className="font-bold text-gray-900 ml-1">{inst.title}:</span> {inst.desc}
                        {/* Hiện cảnh báo nếu có nhập nội dung vào */}
                        {inst.warning && (
                          <div className="mt-2 p-2.5 bg-red-50 border-l-4 border-red-500 text-xs text-gray-900 ml-6 rounded-r-lg">
                            <span className="font-bold text-red-600 mr-2">Lưu ý:</span>{inst.warning}
                          </div>
                        )}
                      </li>
                    ))
                  ) : (
                    <div className="text-center py-5 text-neutralCustom">Chưa cập nhật hướng dẫn chế biến.</div>
                  )}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ===================================================================== */}
      {/* 🌟 MODAL 1: BẢNG CHỈNH SỬA ĐỊNH LƯỢNG NGUYÊN LIỆU (POPUP) */}
      {/* ===================================================================== */}
      {isEditIngModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
            
            <div className="p-5 border-b border-neutralCustom/20 flex items-center justify-between bg-culinaryBg">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Định lượng Nguyên liệu</h3>
                <p className="text-xs text-neutralCustom mt-1">Quản lý nguyên liệu trừ kho cho món: <span className="font-bold">{dishName}</span></p>
              </div>
              <button onClick={() => setIsEditIngModalOpen(false)} className="p-2 hover:bg-neutralCustom/10 rounded-full text-neutralCustom">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 max-h-[60vh]">
              <div className="flex justify-end mb-4">
                <button onClick={handleAddIngRow} className="text-sm font-bold bg-primary/10 text-primary px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-colors">
                  + Thêm dòng
                </button>
              </div>
              
              <div className="space-y-3">
                {editIngredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-3 group bg-white p-2 rounded-xl border border-neutralCustom/10 shadow-sm">
                    {/* Thẻ chọn nguyên liệu */}
                    <select
                      value={ing.ingredient_id}
                      onChange={(e) => handleChangeIng(idx, 'ingredient_id', e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-neutralCustom/30 rounded-lg text-sm outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="" disabled>Chọn nguyên liệu...</option>
                      {allIngredients.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    
                    {/* Ô nhập số lượng */}
                    <input
                      type="number" step="any" min="0" placeholder="Số lượng..."
                      value={ing.amount_required}
                      onChange={(e) => handleChangeIng(idx, 'amount_required', e.target.value)}
                      className="w-28 px-4 py-2.5 border border-neutralCustom/30 rounded-lg text-sm outline-none focus:border-primary text-center"
                    />
                    
                    {/* Ô đơn vị tính (Tự động điền theo nguyên liệu) */}
                    <div className="w-16 text-sm font-bold text-neutralCustom text-center bg-gray-50 py-2.5 rounded-lg border border-neutralCustom/10">
                      {ing.unit || '-'}
                    </div>

                    <button onClick={() => handleRemoveIngRow(idx)} className="p-2.5 text-neutralCustom/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-neutralCustom/20 bg-white flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsEditIngModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-neutralCustom border border-neutralCustom/20 hover:bg-gray-50">Hủy bỏ</button>
              <button onClick={handleSaveIngredients} disabled={isSaving} className="px-8 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-secondary shadow-md disabled:opacity-50">
                {isSaving ? 'Đang lưu...' : 'Lưu Công Thức'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 🌟 MODAL 2: BẢNG CHỈNH SỬA CÁC BƯỚC THỰC HIỆN (POPUP) */}
      {/* ===================================================================== */}
      {isEditStepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
            
            <div className="p-5 border-b border-neutralCustom/20 flex items-center justify-between bg-culinaryBg">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Các Bước Chế Biến</h3>
                <p className="text-xs text-neutralCustom mt-1">Cập nhật quy trình thực hiện cho món: <span className="font-bold">{dishName}</span></p>
              </div>
              <button onClick={() => setIsEditStepModalOpen(false)} className="p-2 hover:bg-neutralCustom/10 rounded-full text-neutralCustom">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 max-h-[65vh]">
              <div className="flex justify-end mb-4">
                <button onClick={handleAddStep} className="text-sm font-bold bg-primary/10 text-primary px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-colors">
                  + Thêm bước
                </button>
              </div>

              <div className="space-y-5">
                {editInstructions.map((step, idx) => (
                  <div key={idx} className="p-5 bg-white border border-neutralCustom/20 rounded-xl relative shadow-sm">
                    {/* Cục tròn hiển thị Số thứ tự bước */}
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-white font-bold rounded-full flex items-center justify-center text-sm shadow-md border-2 border-white">
                      {step.step}
                    </div>
                    {/* Nút xóa bước */}
                    <button onClick={() => handleRemoveStep(idx)} className="absolute top-3 right-3 text-neutralCustom/30 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                    
                    {/* Các ô nhập liệu cho một Bước */}
                    <div className="pr-8">
                      <input
                        type="text" placeholder="Tên thao tác (VD: Trụng phở)..."
                        value={step.title} onChange={(e) => handleChangeStep(idx, 'title', e.target.value)}
                        className="w-full px-4 py-2.5 mb-3 border border-neutralCustom/30 rounded-lg text-sm font-bold outline-none focus:border-primary"
                      />
                      <textarea
                        placeholder="Mô tả chi tiết cách làm..." rows="2"
                        value={step.desc} onChange={(e) => handleChangeStep(idx, 'desc', e.target.value)}
                        className="w-full px-4 py-2.5 mb-3 border border-neutralCustom/30 rounded-lg text-sm outline-none focus:border-primary resize-none"
                      ></textarea>
                      <input
                        type="text" placeholder="Cảnh báo/Lưu ý an toàn (nếu có)..."
                        value={step.warning || ''} onChange={(e) => handleChangeStep(idx, 'warning', e.target.value)}
                        className="w-full px-4 py-2.5 bg-red-50/50 border border-red-200 rounded-lg text-xs outline-none focus:border-red-400 text-red-700 placeholder:text-red-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-neutralCustom/20 bg-white flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsEditStepModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-neutralCustom border border-neutralCustom/20 hover:bg-gray-50">Hủy bỏ</button>
              <button onClick={handleSaveInstructions} disabled={isSaving} className="px-8 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-secondary shadow-md disabled:opacity-50">
                {isSaving ? 'Đang lưu...' : 'Lưu Hướng Dẫn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeManagement;