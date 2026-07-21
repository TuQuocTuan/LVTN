import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// Lấy địa chỉ API từ cấu hình môi trường
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const RecipeManagement = () => {
  const navigate = useNavigate();
  // Lấy ID món ăn từ đường dẫn URL (ví dụ: /admin/recipe-management/5 -> dishId = 5)

  const { dishId } = useParams();

  // KHAI BÁO CÁC STATE QUẢN LÝ DỮ LIỆU HIỂN THỊ CHÍNH
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [dishName, setDishName] = useState('Đang tải...');
  const [ingredients, setIngredients] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [allIngredients, setAllIngredients] = useState([]);

  // State hiển thị Toast Banner thông báo
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // KHAI BÁO CÁC STATE QUẢN LÝ MODAL (POPUP) VÀ DỮ LIỆU FORM
  const [isEditIngModalOpen, setIsEditIngModalOpen] = useState(false);
  const [isEditStepModalOpen, setIsEditStepModalOpen] = useState(false);
  const [editIngredients, setEditIngredients] = useState([]);
  const [editInstructions, setEditInstructions] = useState([]);
  
  // Chạy tuần tự khi vào trang để đảm bảo allIngredients có dữ liệu trước khi mapping chi tiết công thức
  useEffect(() => {
    const init = async () => {
      if (dishId) {
        const loadedIngs = await fetchAllIngredients();
        await fetchRecipeVersions(dishId, loadedIngs);
      }
    };
    init();
  }, [dishId]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Hàm lấy danh sách kho nguyên liệu tổng
  const fetchAllIngredients = async () => {
    try {
      const res = await axios.get(`${API_URL}/ingredients`);
      if (res.data.success) {
        setAllIngredients(res.data.data);
        return res.data.data;
      }
    } catch (error) { 
      console.error("Lỗi lấy kho nguyên liệu:", error); 
    }
    return [];
  };

  // Hàm lấy danh sách các version công thức của món ăn
  const fetchRecipeVersions = async (id, currentAllIngredients = []) => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/recipes/version?dish_id=${id}`);
      
      if (res.data.success && res.data.data.length > 0) {
        const verList = res.data.data;
        setVersions(verList);
        setSelectedVersion(verList[0]); // Tự động chọn version mới nhất
        fetchRecipeDetailByVersion(id, verList[0], currentAllIngredients); // Gọi tiếp hàm lấy chi tiết của version đó
      } else {
        setDishName("Món ăn chưa có công thức");
        setVersions([]);
        setIngredients([]);
        setInstructions([]);
      }
    } catch (error) {
      console.error("Lỗi lấy version công thức:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm lấy chi tiết công thức (Nguyên liệu thật + Hướng dẫn thật)
  const fetchRecipeDetailByVersion = async (id, version, loadedIngredients = []) => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/recipes/by-version?dish_id=${id}&version=${version}`);
      
      if (res.data.success && res.data.data.length > 0) {
        const data = res.data.data;
        setDishName(data[0]?.dishes?.name || 'Chưa cập nhật tên');
        
        // GIẢI PHÁP ĐỐI CHIẾU MÃ ID: Nếu API không trả về ingredient_id, tra cứu ngược từ tên trong danh mục tổng
        const formattedIngredients = data.map(item => {
          let ingId = item.ingredient_id;
          if (!ingId && item.ingredients?.name) {
            const listToSearch = loadedIngredients && loadedIngredients.length > 0 ? loadedIngredients : allIngredients;
            const found = listToSearch.find(i => i.name === item.ingredients.name);
            if (selectedVersion) {
              if (found) ingId = found.id;
            }
            if (found) {
              ingId = found.id;
            }
          }
          return {
            id: item.id,
            ingredient_id: ingId, 
            name: item.ingredients?.name,
            amount: item.amount_required,
            unit: item.ingredients?.unit
          };
        });
        setIngredients(formattedIngredients);

        // GIẢI MÃ AN TOÀN TRÁNH BỊ SỰ CỐ ĐỐI VỚI CỘT STEPS TEXT
        const rawSteps = data[0]?.steps;
        let parsedSteps = [];
        if (rawSteps) {
          try {
            parsedSteps = typeof rawSteps === 'string' ? JSON.parse(rawSteps) : rawSteps;
          } catch (e) {
            console.log("Cột steps chứa văn bản thường. Tự động đóng gói thành Bước 1 để hiển thị mượt mà.");
            parsedSteps = [{
              step: 1,
              title: "Quy trình chuẩn bị",
              desc: String(rawSteps),
              warning: ""
            }];
          }
        }
        setInstructions(Array.isArray(parsedSteps) ? parsedSteps : []);
      } else {
        setIngredients([]);
        setInstructions([]);
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết công thức:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // CÁC HÀM XỬ LÝ SỰ KIỆN MỞ MODAL VÀ THAO TÁC FORM (ĐỘNG)

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
    // Nạp mảng danh sách từ Database vào Form để bắt đầu sửa thay vì dùng Mock ảo
    setEditInstructions([...instructions]);
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

  // CÁC HÀM GỌI API LƯU DỮ LIỆU

  // Lưu Nguyên Liệu (Đồng bộ đồng thời cả quy trình chế biến)
  const handleSaveIngredients = async () => {
    // Lọc bỏ các dòng trống để tránh ném NaN lên Database
    const payloadIngredients = editIngredients
      .filter(i => i.ingredient_id && i.amount_required)
      .map(i => ({
        ingredient_id: Number(i.ingredient_id),
        amount_required: Number(i.amount_required)
      }));

    if (payloadIngredients.length === 0) {
      return showToast("Vui lòng chọn đầy đủ tên nguyên liệu và định lượng!", "error");
    }

    setIsSaving(true);
    try {
      const payload = {
        dish_id: Number(dishId),
        ingredients: payloadIngredients,
        steps: JSON.stringify(instructions) // Đồng bộ gửi kèm các bước hiện tại tránh bị rỗng cột Postgres
      };
      const res = await axios.put(`${API_URL}/recipes/update`, payload);
      
      if (res.data.success) {
        showToast("Cập nhật nguyên liệu định lượng thành công!", "success");
        setIsEditIngModalOpen(false);
        const loadedIngs = await fetchAllIngredients();
        fetchRecipeVersions(dishId, loadedIngs); // Tải lại data để đồng bộ
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi khi lưu nguyên liệu vào kho!", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Lưu Hướng Dẫn 
  const handleSaveInstructions = async () => {
    if (editInstructions.some(step => !step.title || !step.desc)) {
      return showToast("Vui lòng điền đầy đủ tiêu đề và nội dung chi tiết của từng bước!", "error");
    }

    // CHỐT CHẶN BẢO MẬT: Chuyển đổi và tra cứu ngược mã ID từ tên nếu bị mất do API by-version thiếu trường
    const payloadIngredients = ingredients
      .filter(i => i.ingredient_id && i.amount)
      .map(i => ({
        ingredient_id: Number(i.ingredient_id),
        amount_required: Number(i.amount)
      }));

    if (payloadIngredients.length === 0) {
      return showToast("Món ăn này cần phải được cài đặt định lượng nguyên liệu trước khi lưu quy trình chế biến!", "error");
    }

    setIsSaving(true);
    try {
      const payload = {
        dish_id: Number(dishId),
        ingredients: payloadIngredients,
        steps: JSON.stringify(editInstructions) // Mã hóa chuỗi String JSON loại bỏ lỗi 500 của Postgres
      };

      const res = await axios.put(`${API_URL}/recipes/update`, payload);
      
      if (res.data.success) {
        showToast("Cập nhật quy trình chế biến thành công!", "success");
        setIsEditStepModalOpen(false); // Đóng Modal
        const loadedIngs = await fetchAllIngredients();
        fetchRecipeVersions(dishId, loadedIngs); // Reload để tải phiên bản cập nhật mới nhất
      }
    } catch (error) {
      console.error("Sự cố xảy ra khi gọi lưu hướng dẫn:", error);
      showToast(error.response?.data?.message || "Lỗi hệ thống khi lưu quy trình chế biến!", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // HÀM XUẤT CÔNG THỨC RA FILE MICROSOFT WORD (.DOC)
  const handleExportWord = () => {
    // Thiết lập phong cách cho file Word chuẩn hoá, lề 1-inch, bảng viền đen rõ nét
    const styles = `
      <style>
        @page { size: A4; margin: 1in; }
        body { font-family: 'Times New Roman', Times, serif; color: #000000; line-height: 1.5; }
        .header { text-align: center; margin-bottom: 25px; border-bottom: 3px double #000000; padding-bottom: 12px; }
        .doc-title { font-size: 20pt; font-weight: bold; text-transform: uppercase; margin: 0; }
        .doc-subtitle { font-size: 11pt; font-style: italic; margin-top: 5px; color: #475569; }
        .section-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #000000; padding-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000000; padding: 8px 12px; font-size: 11pt; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        ol { padding-left: 20px; margin: 0; }
        li { font-size: 11pt; margin-bottom: 12px; text-align: justify; }
        .warning-box { background-color: #fafafa; border-left: 3px solid #000000; padding: 8px 12px; margin-top: 5px; font-size: 10pt; font-weight: bold; font-style: italic; color: #000000; }
        .footer-signature { margin-top: 50px; display: table; width: 100%; }
        .signature-col { display: table-cell; width: 50%; text-align: center; font-size: 11pt; }
        .signature-space { height: 80px; }
      </style>
    `;

    // Dựng tài liệu HTML tương thích sâu với Microsoft Word
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        ${styles}
      </head>
      <body>
        <div class="header">
          <div style="font-size: 12pt; font-weight: bold;">LÀNG MÌXI BBQ</div>
          <div style="font-size: 9pt; letter-spacing: 2px;">HỆ THỐNG QUẢN LÝ CÔNG THỨC TIÊU CHUẨN</div>
          <h1 class="doc-title" style="margin-top: 15px;">TIÊU CHUẨN CHẾ BIẾN MÓN ĂN</h1>
          <div class="doc-subtitle">Tên món: ${dishName} | Phiên bản áp dụng: Version ${selectedVersion}</div>
        </div>

        <div class="section-title">I. NGUYÊN LIỆU ĐỊNH LƯỢNG (Chuẩn 1 phần ăn)</div>
        <table>
          <thead>
            <tr>
              <th style="width: 10%;">STT</th>
              <th style="width: 60%;">Tên nguyên vật liệu</th>
              <th style="width: 30%; text-align: right;">Định lượng tiêu chuẩn</th>
            </tr>
          </thead>
          <tbody>
            ${ingredients.map((ing, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><b>${ing.name || 'Nguyên liệu'}</b></td>
                <td style="text-align: right; font-weight: bold;">${ing.amount} ${ing.unit}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">II. QUY TRÌNH CHẾ BIẾN TIÊU CHUẨN (SOP)</div>
        <ol>
          ${instructions.map((inst) => `
            <li>
              <b>${inst.title}:</b> ${inst.desc}
              ${inst.warning ? `<div class="warning-box">⚠️ LƯU Ý BẮT BUỘC: ${inst.warning}</div>` : ''}
            </li>
          `).join('')}
        </ol>

        <div class="footer-signature">
          <div class="signature-col">
            <b>BẾP TRƯỞNG XÁC NHẬN</b>
            <div class="signature-space"></div>
            <span>(Ký, ghi rõ họ tên)</span>
          </div>
          <div class="signature-col">
            <b>BAN QUẢN LÝ DUYỆT</b>
            <div class="signature-space"></div>
            <span>(Ký, đóng dấu)</span>
          </div>
        </div>
      </body>
      </html>
    `;

    // Tiến hành tải file .doc về máy khách
    const blob = new Blob(["\uFEFF" + html], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Cong_thuc_${dishName.replace(/\s+/g, '_')}_V${selectedVersion}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans h-screen flex overflow-hidden relative">

      <AdminSidebar currentTab="recipes" />
      <AdminHeader />

      {/* Floating custom Toast Alert thay thế alert() của trình duyệt */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-[120] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl animate-fade-in text-white font-bold text-sm ${
          toast.type === 'success' ? 'bg-green-600 border border-green-500' : 'bg-red-600 border border-red-500'
        }`}>
          <span className="material-symbols-outlined">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      <main className="ml-64 pt-20 p-6 w-[calc(100%-16rem)] flex flex-col h-screen overflow-hidden transition-all duration-300">
        <div className="w-full flex flex-col h-full overflow-hidden">
          {/* HEADER TRANG */}
          <div className="mb-5 flex-shrink-0">
            <div onClick={() => navigate('/admin/dish-management')} className="flex items-center gap-2 text-neutralCustom mb-3 hover:text-primary cursor-pointer transition-colors w-fit no-print">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span className="text-xs font-bold">Trở về Quản lý món ăn</span>
            </div>

            <div className="flex justify-between items-end border-b border-neutralCustom/20 pb-3">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{dishName}</h2>
                <p className="text-xs text-neutralCustom mt-0.5 font-medium no-print">Lưu trữ {versions.length} phiên bản công thức trong kho</p>
                {/* Phiên bản hiển thị tĩnh dành riêng cho tờ giấy A4 khi in */}
                <p className="hidden print:block text-xs text-neutralCustom font-bold mt-0.5">Phiên bản áp dụng: Version {selectedVersion} (Mới nhất)</p>
              </div>

              <div className="flex items-center gap-2.5 no-print">
                {/* Dropdown chọn phiên bản công thức */}
                {versions.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 border border-neutralCustom/20 rounded-xl bg-white shadow-sm text-xs">
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

                <button 
                  onClick={handleExportWord}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-md text-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  Xuất Word Công Thức
                </button>
              </div>
            </div>
          </div>

          {/* === NỘI DUNG HIỂN THỊ CHÍNH (READ-ONLY) === */}
          <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-hidden pb-6">
            
            {/* CỘT 1: BẢNG NGUYÊN LIỆU */}
            <div className="w-full lg:w-1/3 h-full flex flex-col min-h-0">
              <div className="bg-white rounded-2xl border border-neutralCustom/20 overflow-hidden flex flex-col h-full shadow-sm">
                <div className="py-2.5 px-4 border-b border-neutralCustom/20 bg-culinaryBg/30 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-xs md:text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">kitchen</span>Nguyên Liệu Định Lượng
                  </h3>
                  {/* NÚT SỬA NGUYÊN LIỆU */}
                  <button onClick={handleOpenEditIngModal} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg active:scale-95 transition-transform no-print">
                    <span className="material-symbols-outlined text-[14px]">edit</span> Định lượng
                  </button>
                </div>
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                  <div className="divide-y divide-neutralCustom/10">
                    {isLoading ? (
                      <div className="text-center py-5 text-neutralCustom text-xs">Đang tải dữ liệu...</div>
                    ) : ingredients.length > 0 ? (
                      ingredients.map((item) => (
                        <div key={item.id} className="py-2 flex justify-between items-center text-xs md:text-sm font-medium">
                          <span className="text-gray-950 font-semibold">{item.name || "Nguyên liệu không rõ"}</span>
                          <span className="text-[10px] md:text-xs font-bold text-primary bg-primary/5 px-2.5 py-0.5 rounded">{item.amount} {item.unit}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-neutralCustom text-xs italic">Chưa cấu hình nguyên liệu trừ kho cho món ăn này.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT 2: BẢNG HƯỚNG DẪN THỰC HIỆN */}
            <div className="w-full lg:w-2/3 h-full flex flex-col min-h-0">
              <div className="bg-white rounded-2xl border border-neutralCustom/20 overflow-hidden flex flex-col h-full shadow-sm">
                <div className="py-2.5 px-4 border-b border-neutralCustom/20 bg-culinaryBg/30 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-xs md:text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">format_list_numbered</span>Quy Trình Chế Biến
                  </h3>
                  {/* NÚT SỬA HƯỚNG DẪN */}
                  <button onClick={handleOpenEditStepModal} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg active:scale-95 transition-transform no-print">
                    <span className="material-symbols-outlined text-[14px]">edit</span> Sửa quy trình
                  </button>
                </div>
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                  <ol className="space-y-4 list-decimal list-inside marker:text-primary marker:font-black marker:text-base">
                    {instructions.length > 0 ? (
                      instructions.map((inst, idx) => (
                        <li key={idx} className="text-neutralCustom text-xs md:text-sm leading-relaxed pl-1 font-medium">
                          <span className="font-bold text-gray-950 ml-1 text-xs md:text-sm">{inst.title}:</span> {inst.desc}
                          {/* Hiện cảnh báo nếu có nhập nội dung vào */}
                          {inst.warning && (
                            <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-500 text-[10px] md:text-xs text-red-750 ml-5 rounded-r-lg font-bold">
                              <span className="font-black text-red-600 mr-2 uppercase tracking-wide">Cảnh báo:</span>{inst.warning}
                            </div>
                          )}
                        </li>
                      ))
                    ) : (
                      <div className="text-center py-8 text-neutralCustom text-xs italic">Chưa cập nhật hướng dẫn chế biến cho món ăn này.</div>
                    )}
                  </ol>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* BẢNG CHỈNH SỬA ĐỊNH LƯỢNG NGUYÊN LIỆU (POPUP) */}
      {isEditIngModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
            
            <div className="p-5 border-b border-neutralCustom/20 flex items-center justify-between bg-culinaryBg">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Định lượng Nguyên liệu</h3>
                <p className="text-xs text-neutralCustom mt-1">Quản lý nguyên liệu trừ kho cho món: <span className="font-bold">{dishName}</span></p>
              </div>
              <button onClick={() => setIsEditIngModalOpen(false)} className="p-2 hover:bg-neutralCustom/10 rounded-full text-neutralCustom">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 max-h-[60vh] custom-scrollbar">
              <div className="flex justify-end mb-4">
                <button onClick={handleAddIngRow} className="text-xs font-bold bg-primary text-white px-4 py-2 rounded-xl hover:bg-secondary transition-colors shadow-sm">
                  + Thêm nguyên liệu
                </button>
              </div>
              
              <div className="space-y-3">
                {editIngredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-3 group bg-white p-2 rounded-xl border border-neutralCustom/10 shadow-sm">
                    {/* Thẻ chọn nguyên liệu */}
                    <select
                      value={ing.ingredient_id}
                      onChange={(e) => handleChangeIng(idx, 'ingredient_id', e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-neutralCustom/30 rounded-lg text-sm outline-none focus:border-primary cursor-pointer text-gray-900 font-bold bg-white"
                    >
                      <option value="" disabled>Chọn nguyên liệu...</option>
                      {allIngredients.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    
                    {/* Ô nhập số lượng */}
                    <input
                      type="number" step="any" min="0" placeholder="Số lượng..."
                      value={ing.amount_required}
                      onChange={(e) => handleChangeIng(idx, 'amount_required', e.target.value)}
                      className="w-28 px-4 py-2.5 border border-neutralCustom/30 rounded-lg text-sm outline-none focus:border-primary text-center font-bold text-primary"
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

      {/* BẢNG CHỈNH SỬA CÁC BƯỚC THỰC HIỆN (POPUP) */}
      {isEditStepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
            
            <div className="p-5 border-b border-neutralCustom/20 flex items-center justify-between bg-culinaryBg">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Các Bước Chế Biến</h3>
                <p className="text-xs text-neutralCustom mt-1">Cập nhật quy trình thực hiện cho món: <span className="font-bold">{dishName}</span></p>
              </div>
              <button onClick={() => setIsEditStepModalOpen(false)} className="p-2 hover:bg-neutralCustom/10 rounded-full text-neutralCustom">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 max-h-[65vh] custom-scrollbar">
              <div className="flex justify-end mb-4">
                <button onClick={handleAddStep} className="text-xs font-bold bg-primary text-white px-4 py-2 rounded-xl hover:bg-secondary transition-colors shadow-sm">
                  + Thêm bước
                </button>
              </div>

              <div className="space-y-5">
                {editInstructions.map((step, idx) => (
                  <div key={idx} className="p-5 bg-white border border-neutralCustom/20 rounded-xl relative shadow-sm">
                    {/* Cục tròn hiển thị Số thứ tự bước */}
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-white font-black rounded-full flex items-center justify-center text-sm shadow-md border-2 border-white">
                      {step.step}
                    </div>
                    {/* Nút xóa bước */}
                    <button onClick={() => handleRemoveStep(idx)} className="absolute top-3 right-3 text-neutralCustom/30 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                    
                    {/* Các ô nhập liệu cho một Bước */}
                    <div className="pr-8">
                      <input
                        type="text" placeholder="Tên thao tác (VD: Sơ chế thịt ba chỉ)..."
                        value={step.title} onChange={(e) => handleChangeStep(idx, 'title', e.target.value)}
                        className="w-full px-4 py-2.5 mb-3 border border-neutralCustom/30 rounded-lg text-sm font-bold outline-none focus:border-primary text-gray-900"
                      />
                      <textarea
                        placeholder="Mô tả chi tiết cách thực hiện..." rows="2"
                        value={step.desc} onChange={(e) => handleChangeStep(idx, 'desc', e.target.value)}
                        className="w-full px-4 py-2.5 mb-3 border border-neutralCustom/30 rounded-lg text-sm outline-none focus:border-primary resize-none text-gray-700 font-medium"
                      ></textarea>
                      <input
                        type="text" placeholder="Cảnh báo/Lưu ý an toàn nếu có (Không bắt buộc)..."
                        value={step.warning || ''} onChange={(e) => handleChangeStep(idx, 'warning', e.target.value)}
                        className="w-full px-4 py-2.5 bg-red-50/50 border border-red-200 rounded-lg text-xs outline-none focus:border-red-450 text-red-700 placeholder:text-red-300 font-bold"
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