import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const axiosConfig = { headers: { 'ngrok-skip-browser-warning': 'true' } };

const CustomerManagement = () => {
  const [customersList, setCustomersList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Phân trang (8 khách hàng mỗi trang)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // State Modal (Thêm/Sửa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', phone_number: '', email: '' });

  // Custom Alerts / Dialogs
  const [alertModal, setAlertModal] = useState({ show: false, message: '', title: 'Thông báo', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const showAlert = (message, type = 'error', title = 'Thông báo') => {
    setAlertModal({ show: true, message, title, type });
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/customers`, axiosConfig);
      if (response.data && response.data.success) {
        setCustomersList(response.data.data || []);
      } else {
        showAlert(response.data?.message || "Lỗi tải danh sách khách hàng", "error");
      }
    } catch (error) {
      console.error("Lỗi tải danh sách khách hàng:", error);
      showAlert("Không thể lấy danh sách khách hàng từ máy chủ.", "error", "Lỗi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };


  const handleOpenEditModal = (cus) => {
    setFormData({
      id: cus.id,
      name: cus.name || '',
      phone_number: cus.phone_number || '',
      email: cus.email || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    if (e) e.preventDefault();

    if (!formData.name.trim() || !formData.phone_number.trim() || !formData.email.trim()) {
      return showAlert("Vui lòng nhập đầy đủ tất cả các trường thông tin!", "error", "Thiếu thông tin");
    }

    setIsSaving(true);
    try {
      if (formData.id) {
        // Cập nhật khách hàng
        const response = await axios.put(`${API_URL}/customers/edit`, formData, axiosConfig);
        if (response.data && response.data.success) {
          showAlert("Cập nhật thông tin khách hàng thành công!", "success", "Thành công");
          setIsModalOpen(false);
          fetchCustomers();
        } else {
          showAlert(response.data?.message || "Lỗi cập nhật khách hàng", "error");
        }
      }
    } catch (error) {
      console.error("Lỗi lưu khách hàng:", error);
      showAlert(error.response?.data?.message || "Không thể kết nối đến máy chủ để lưu thông tin.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (cus) => {
    showConfirm(
      "Xác nhận xóa khách hàng",
      `Bạn có chắc chắn muốn xóa khách hàng "${cus.name}" khỏi hệ thống không? Hành động này không thể hoàn tác.`,
      async () => {
        try {
          const response = await axios.delete(`${API_URL}/customers/${cus.id}`, axiosConfig);
          if (response.data && response.data.success) {
            showAlert("Xóa thông tin khách hàng thành công!", "success", "Thành công");
            fetchCustomers();
          } else {
            showAlert(response.data?.message || "Không thể xóa khách hàng này.", "error");
          }
        } catch (error) {
          console.error("Lỗi xóa khách hàng:", error);
          showAlert(error.response?.data?.message || "Lỗi kết nối máy chủ khi thực hiện xóa.", "error");
        }
      }
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa rõ';
    const d = new Date(dateString);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // Filter khách hàng theo ô tìm kiếm
  const filteredCustomers = customersList.filter(cus => {
    const name = cus.name || '';
    const phone = cus.phone_number || '';
    const email = cus.email || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
           email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden relative">
      <AdminSidebar currentTab="customer" />
      <AdminHeader />

      {/* CUSTOM ALERT DIALOG */}
      {alertModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-neutralCustom/10 text-center animate-scale-up">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              alertModal.type === 'success' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-600'
            }`}>
              <span className="material-symbols-outlined text-3xl">
                {alertModal.type === 'success' ? 'check_circle' : 'error'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{alertModal.title}</h3>
            <p className="text-sm text-neutralCustom mb-6 leading-relaxed whitespace-pre-line">{alertModal.message}</p>
            <button 
              onClick={() => setAlertModal({ show: false, message: '', title: 'Thông báo', type: 'error' })} 
              className={`w-full py-3 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer ${
                alertModal.type === 'success' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/10' : 'bg-red-500 hover:bg-red-600 shadow-red-500/10'
              }`}
            >
              Đồng ý
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM DIALOG */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-neutralCustom/10 text-center animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">help</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-neutralCustom mb-6 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })} 
                className="w-1/2 py-3 border border-neutralCustom/20 text-neutralCustom bg-white font-bold text-sm rounded-xl hover:bg-stone-50 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
                }} 
                className="w-1/2 py-3 bg-red-500 hover:bg-red-600 text-white font-black text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/15"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHÍNH */}
      <main className="ml-64 pt-20 p-6 w-[calc(100%-16rem)] flex flex-col min-h-screen transition-all duration-300">
        
        {/* Header */}
        <div className="mb-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Quản lý Khách hàng</h2>
            <p className="text-neutralCustom text-sm mt-1">Quản lý cơ sở dữ liệu khách hàng đăng ký thành viên Làng MÌXI BBQ.</p>
          </div>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="bg-white p-4 rounded-2xl border border-neutralCustom/20 shadow-sm mb-4 flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
          <div className="relative w-full md:max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutralCustom text-xl">search</span>
            <input 
              type="text" 
              placeholder="Tìm khách hàng theo Tên, Số điện thoại, Email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-neutralCustom/20 text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-primary focus:bg-white transition-all font-semibold text-gray-950" 
            />
          </div>
          <div className="text-xs font-bold text-neutralCustom bg-stone-50 px-4 py-2 rounded-xl border border-stone-200/50 shrink-0">
            <span className="text-primary text-sm font-black">{filteredCustomers.length}</span> khách hàng
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="flex-1 bg-white rounded-2xl border border-neutralCustom/20 shadow-sm overflow-hidden animate-fade-in flex flex-col justify-between min-h-[400px]">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-32 text-center text-stone-500 font-bold flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-5xl animate-spin text-primary">progress_activity</span>
                <span>Đang tải thông tin khách hàng từ hệ thống Làng MÌXI...</span>
              </div>
            ) : currentCustomers.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-neutralCustom/10 text-neutralCustom text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Họ và tên</th>
                    <th className="px-5 py-3.5">Số điện thoại</th>
                    <th className="px-5 py-3.5">Địa chỉ Email</th>
                    <th className="px-5 py-3.5">Ngày giờ đăng ký</th>
                    <th className="px-5 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutralCustom/10">
                  {currentCustomers.map((cus, idx) => (
                    <tr key={cus.id || idx} className="hover:bg-orange-500/5 transition-colors group">
                      <td className="px-5 py-4">
                        <span className="text-xs sm:text-sm font-black text-gray-900">{cus.name}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs sm:text-sm font-mono font-bold text-stone-700">{cus.phone_number}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs sm:text-sm font-semibold text-stone-600 break-all">{cus.email}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-stone-500 font-medium">{formatDate(cus.created_at)}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleOpenEditModal(cus)}
                            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                            title="Sửa thông tin"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(cus)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                            title="Xóa khách hàng"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-32 text-center text-gray-400 font-bold italic border-dashed border-2 border-neutralCustom/10 m-5 rounded-2xl">
                Không tìm thấy khách hàng nào khớp với từ khóa tìm kiếm...
              </div>
            )}
          </div>

          {/* Phân trang */}
          {!isLoading && totalPages > 1 && (
            <div className="p-4 border-t border-gray-150 flex justify-center items-center shrink-0">
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-neutralCustom/20 rounded-xl hover:bg-stone-50 text-neutralCustom disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center bg-white shadow-sm w-9 h-9"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      currentPage === page 
                        ? 'bg-primary text-white font-bold' 
                        : 'hover:bg-stone-50 text-neutralCustom border border-neutralCustom/15 bg-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-neutralCustom/20 rounded-xl hover:bg-stone-50 text-neutralCustom disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center bg-white shadow-sm w-9 h-9"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL THÊM / SỬA KHÁCH HÀNG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-neutralCustom/10 animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">
                  edit_note
                </span>
                Cập nhật thông tin Khách hàng
              </h3>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập họ và tên (VD: Nguyễn Văn A)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutralCustom/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold text-gray-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10,11}"
                  placeholder="Nhập số điện thoại (VD: 0987654321)"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutralCustom/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold text-gray-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Nhập địa chỉ email (VD: khachhang@gmail.com)"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutralCustom/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold text-gray-950"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-3 border border-neutralCustom/20 text-neutralCustom bg-white font-bold text-sm rounded-xl hover:bg-stone-50 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-1/2 py-3 bg-primary text-white font-black text-sm rounded-xl hover:bg-secondary transition-all cursor-pointer shadow-md shadow-primary/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>Lưu thông tin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
