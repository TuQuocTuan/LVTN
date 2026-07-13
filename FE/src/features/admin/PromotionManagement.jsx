import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import axios from 'axios';

const PromotionManagement = () => {
  // State quản lý Tab: 'Khuyến mãi' hoặc 'Lịch sử tặng Voucher'
  const [activeTab, setActiveTab] = useState('Khuyến mãi');

  // --- STATES QUẢN LÝ DỮ LIỆU TỪ API ---
  const [promotionsList, setPromotionsList] = useState([]);
  const [customerVouchersList, setCustomerVouchersList] = useState([]); // Danh sách lịch sử voucher đã tặng
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCV, setIsLoadingCV] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // --- STATES CHỐT CHẶN BẢO MẬT THAY THẾ ALERT/CONFIRM TRÌNH DUYỆT ---
  const [alertModal, setAlertModal] = useState({ show: false, message: '', title: 'Thông báo', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  // State Form Khuyến mãi
  const initialPromoState = {
    id: null,
    code: '',
    name: '',
    type: 'VOUCHER',
    discount_type: 'AMOUNT',
    discount_value: '',
    min_bill_value: '',
    start_date: '',
    end_date: '',
    is_active: true
  };
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialPromoState);
  const [isSaving, setIsSaving] = useState(false);

  // --- STATES QUẢN LÝ TẶNG VOUCHER (CHỈ NHẬP SĐT) ---
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftData, setGiftData] = useState({ phone_number: '', bypass_limit: true, selectedPromo: null });
  const [isSendingGift, setIsSendingGift] = useState(false);

  // Tự động tải dữ liệu khi render
  useEffect(() => {
    fetchPromotions();
    fetchCustomerVouchers();
  }, []);

  const showAlert = (message, type = 'success', title = 'Thông báo') => {
    setAlertModal({ show: true, message, title, type });
  };

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/promotions/list`);
      if (response.data.success) {
        setPromotionsList(response.data.promotions || []);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách khuyến mãi:", error);
      showAlert("Gặp sự cố khi tải danh sách khuyến mãi!", "error", "Lỗi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerVouchers = async () => {
    setIsLoadingCV(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/promotions/customer-vouchers`);
      if (response.data.success) {
        setCustomerVouchersList(response.data.data || []);
      }
    } catch (error) {
      console.error("Lỗi tải lịch sử tặng voucher:", error);
    } finally {
      setIsLoadingCV(false);
    }
  };

  const formatForInput = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // ====================== XỬ LÝ KHUYẾN MÃI ======================
  const handleOpenAddModal = () => {
    setFormData(initialPromoState);
    setIsPromoModalOpen(true);
  };

  const handleOpenEditModal = (promo) => {
    setFormData({
      id: promo.id,
      code: promo.code,
      name: promo.name,
      type: promo.type,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_bill_value: promo.min_bill_value || '',
      start_date: formatForInput(promo.start_date),
      end_date: formatForInput(promo.end_date),
      is_active: promo.is_active
    });
    setIsPromoModalOpen(true);
  };

  const handleSavePromo = async () => {
    if (!formData.code || !formData.name || !formData.discount_value || !formData.start_date || !formData.end_date) {
      return showAlert("Vui lòng điền đầy đủ các thông tin bắt buộc (*)", "error", "Thiếu thông tin");
    }

    setIsSaving(true);
    try {
      const url = formData.id
        ? `${import.meta.env.VITE_API_URL}/promotions/update`
        : `${import.meta.env.VITE_API_URL}/promotions/add`;

      const payload = { ...formData };
      payload.discount_value = Number(payload.discount_value);
      if (payload.min_bill_value) payload.min_bill_value = Number(payload.min_bill_value);

      const res = await axios.post(url, payload);
      if (res.data.success) {
        showAlert(formData.id ? "Cập nhật khuyến mãi thành công!" : "Thêm khuyến mãi mới thành công!", "success", "Thành công");
        setIsPromoModalOpen(false);
        fetchPromotions();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || "Lỗi khi lưu dữ liệu!", "error", "Thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePromo = (id) => {
    setConfirmModal({
      show: true,
      title: 'Xóa khuyến mãi',
      message: 'Bạn có chắc chắn muốn xóa vĩnh viễn khuyến mãi này không? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        try {
          const res = await axios.delete(`${import.meta.env.VITE_API_URL}/promotions/delete/${id}`);
          if (res.data.success) {
            showAlert("Đã xóa chương trình khuyến mãi thành công!", "success", "Xóa thành công");
            fetchPromotions();
          }
        } catch (error) {
          showAlert(error.response?.data?.message || "Không thể thực hiện xóa!", "error", "Thất bại");
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // ====================== XỬ LÝ TẶNG VOUCHER CHO KHÁCH (CHỈ NHẬP SĐT) ======================
  const handleOpenGiftModal = (promo) => {
    setGiftData({ phone_number: '', bypass_limit: true, selectedPromo: promo });
    setIsGiftModalOpen(true);
  };

  const handleSendGiftSubmit = async () => {
    const { phone_number, bypass_limit, selectedPromo } = giftData;
    if (!phone_number.trim()) {
      return showAlert("Vui lòng nhập Số điện thoại khách hàng cần tặng!", "error", "Yêu cầu nhập liệu");
    }

    setIsSendingGift(true);
    try {
      const payload = {
        phone_number: phone_number.trim(),
        promotion_id: selectedPromo.id,
        bypass_limit: bypass_limit
      };

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/promotions/gift-voucher`, payload);

      if (res.data.success) {
        showAlert(res.data.message || "Tặng voucher thành công và đã gửi mail!", "success", "Thành công");
        setIsGiftModalOpen(false);
        fetchCustomerVouchers(); // Refresh lại danh sách lịch sử ở Tab 2
      }
    } catch (error) {
      showAlert(error.response?.data?.message || "Lỗi trong quá trình tặng voucher!", "error", "Giao dịch thất bại");
    } finally {
      setIsSendingGift(false);
    }
  };

  // ====================== UI HELPERS ======================
  const totalPages = Math.ceil(promotionsList.length / itemsPerPage);
  const currentPromotions = promotionsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getTypeStyle = (type) => {
    switch (type?.toUpperCase()) {
      case 'VOUCHER': return { label: 'Voucher', color: 'text-secondary bg-secondary/10 border-secondary/20' };
      case 'BILL_CONDITION': return { label: 'KM Hệ thống', color: 'text-primary bg-primary/10 border-primary/20' };
      default: return { label: 'Khác', color: 'text-tertiary bg-tertiary/10 border-tertiary/20' };
    }
  };

  const getPromoStatus = (isActive, endDate) => {
    if (!isActive) return { text: 'Đã tắt', color: 'text-neutralCustom', dot: 'bg-neutralCustom' };
    if (new Date() > new Date(endDate)) return { text: 'Hết hạn', color: 'text-red-500', dot: 'bg-red-500' };
    return { text: 'Đang chạy', color: 'text-green-600', dot: 'bg-green-500 animate-pulse' };
  };

  const activePromotionsCount = promotionsList.filter(p => p.is_active && new Date(p.end_date) >= new Date()).length;

  const stats = [
    { title: 'Chương trình đang chạy', value: activePromotionsCount, icon: 'local_activity', color: 'primary', bg: 'bg-primary/10 text-primary' },
    { title: 'Voucher đã phát', value: customerVouchersList.length, icon: 'card_giftcard', color: 'secondary', bg: 'bg-secondary/10 text-secondary' },
    { title: 'Tổng chương trình', value: promotionsList.length, icon: 'confirmation_number', color: 'tertiary', bg: 'bg-tertiary/10 text-tertiary' },
  ];

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden relative">
      <AdminSidebar currentTab="promotion" />
      <AdminHeader />

      {/* 🌟 HỆ THỐNG ALERT MODAL THAY THẾ TOAST (Bảo mật, có nút bấm Đồng ý) */}
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

      {/* 🌟 HỆ THỐNG HỘP THOẠI XÁC NHẬN THAY THẾ CONFIRM */}
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

      <main className="ml-64 pt-20 p-6 w-[calc(100%-16rem)] flex flex-col min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Khuyến mãi & Vouchers</h2>
            <p className="text-neutralCustom text-sm font-medium">Tạo và quản lý các sự kiện chiết khấu hóa đơn và chương trình tặng quà tri ân khách hàng.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleOpenAddModal} className="bg-primary text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-md hover:bg-secondary transition-all active:scale-95 text-sm">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'wght' 700" }}>add</span>
              <span>Tạo khuyến mãi</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl flex items-center gap-5 border border-neutralCustom/20 shadow-sm hover:-translate-y-1 transition-transform duration-300">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-neutralCustom uppercase tracking-wider mb-1">{stat.title}</p>
                <h4 className="text-3xl font-black text-gray-900 leading-none">{stat.value < 10 ? `0${stat.value}` : stat.value}</h4>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Section */}
        <div className="mb-6 flex border-b border-neutralCustom/20">
          <button
            onClick={() => setActiveTab('Khuyến mãi')}
            className={`px-8 py-3.5 font-bold text-sm transition-all border-b-2 ${activeTab === 'Khuyến mãi' ? 'border-primary text-primary' : 'border-transparent text-neutralCustom hover:text-primary'}`}
          >
            Chương trình Khuyến mãi
          </button>
          <button
            onClick={() => setActiveTab('Lịch sử tặng Voucher')}
            className={`px-8 py-3.5 font-bold text-sm transition-all border-b-2 ${activeTab === 'Lịch sử tặng Voucher' ? 'border-primary text-primary' : 'border-transparent text-neutralCustom hover:text-primary'}`}
          >
            Lịch sử tặng Voucher
          </button>
        </div>

        {/* TAB KHUYẾN MÃI */}
        {activeTab === 'Khuyến mãi' ? (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutralCustom/20 animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-culinaryBg/50 text-neutralCustom border-b border-neutralCustom/20">
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap">Tên chương trình</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap">Loại</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap">Mức giảm</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap">Thời hạn</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutralCustom/10">
                  {isLoading ? (
                    <tr><td colSpan="6" className="text-center py-8 text-neutralCustom">Đang tải dữ liệu...</td></tr>
                  ) : currentPromotions.length > 0 ? (
                    currentPromotions.map((promo) => {
                      const typeStyle = getTypeStyle(promo.type);
                      const statusObj = getPromoStatus(promo.is_active, promo.end_date);
                      return (
                        <tr key={promo.id} className={`hover:bg-culinaryBg/30 transition-colors group ${!promo.is_active ? 'opacity-60' : ''}`}>
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900 text-sm">{promo.name}</p>
                            <p className="text-xs text-neutralCustom mt-0.5 font-mono">{promo.code}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${typeStyle.color}`}>
                              {typeStyle.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-sm text-gray-900 whitespace-nowrap">
                            {Number(promo.discount_value).toLocaleString('vi-VN')} {promo.discount_type === 'PERCENTAGE' ? '%' : 'đ'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col text-neutralCustom text-xs whitespace-nowrap">
                              <span className="flex items-center gap-1 whitespace-nowrap"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {formatDate(promo.start_date)}</span>
                              <span className="flex items-center gap-1 whitespace-nowrap"><span className="material-symbols-outlined text-[14px]">event_busy</span> {formatDate(promo.end_date)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center gap-2 font-bold text-sm whitespace-nowrap ${statusObj.color}`}>
                              <span className={`w-2 h-2 rounded-full whitespace-nowrap ${statusObj.dot}`}></span>{statusObj.text}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="inline-flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {promo.type?.toUpperCase() === 'VOUCHER' && promo.is_active && (
                                <button onClick={() => handleOpenGiftModal(promo)} className="p-1.5 text-secondary hover:bg-secondary/10 rounded-lg transition-colors" title="Tặng Voucher cho khách">
                                  <span className="material-symbols-outlined text-[18px]">card_giftcard</span>
                                </button>
                              )}
                              <button onClick={() => handleOpenEditModal(promo)} className="p-1.5 text-neutralCustom hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Chỉnh sửa">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button onClick={() => handleDeletePromo(promo.id)} className="p-1.5 text-neutralCustom hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="6" className="text-center py-8 text-neutralCustom">Chưa có dữ liệu khuyến mãi.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Phân trang */}
            {promotionsList.length > 0 && (
              <div className="p-4 bg-culinaryBg/30 border-t border-neutralCustom/10 flex justify-center items-center text-sm shrink-0">
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1} className="p-1.5 border border-neutralCustom/20 rounded-lg hover:bg-white text-neutralCustom disabled:opacity-50"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded-lg shadow-sm ${currentPage === page ? 'bg-primary text-white font-bold' : 'hover:bg-white text-neutralCustom'}`}>{page}</button>
                  ))}
                  <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 border border-neutralCustom/20 rounded-lg hover:bg-white text-neutralCustom disabled:opacity-50"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* TAB LỊCH SỬ TẶNG VOUCHER */
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutralCustom/20 animate-fade-in">
            <div className="p-5 border-b border-neutralCustom/20 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Danh sách khách hàng đã nhận Voucher</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-culinaryBg/50 text-neutralCustom border-b border-neutralCustom/20">
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Khách hàng</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Mã giảm giá</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Mức ưu đãi</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Trạng thái sử dụng</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Ngày cấp phát</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutralCustom/10">
                  {isLoadingCV ? (
                    <tr><td colSpan="5" className="text-center py-8 text-neutralCustom">Đang đồng bộ dữ liệu...</td></tr>
                  ) : customerVouchersList.length > 0 ? (
                    customerVouchersList.map((cv) => (
                      <tr key={cv.id} className="hover:bg-culinaryBg/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900 text-sm">{cv.customers?.name || 'Khách vãng lai'}</p>
                          <p className="text-xs text-neutralCustom mt-0.5">{cv.customers?.phone_number || cv.customers?.email || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-md text-xs uppercase tracking-wider border border-primary/10">
                            {cv.promotions?.code}
                          </span>
                          <p className="text-[10px] text-neutralCustom mt-1">{cv.promotions?.name}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-sm text-gray-900">
                          {Number(cv.promotions?.discount_value || 0).toLocaleString('vi-VN')} {cv.promotions?.discount_type === 'PERCENTAGE' ? '%' : 'đ'}
                        </td>
                        <td className="px-6 py-4">
                          {cv.is_used ? (
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Đã dùng</span>
                          ) : (
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Chưa dùng</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-neutralCustom font-medium">
                          {formatDate(cv.created_at)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center py-8 text-neutralCustom">Chưa có lịch sử phát voucher nào!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL FORM THÊM / SỬA KHUYẾN MÃI */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up max-h-[90vh]">
            <div className="p-5 border-b border-neutralCustom/20 flex items-center justify-between bg-culinaryBg shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{formData.id ? 'Sửa Khuyến Mãi' : 'Tạo Khuyến Mãi Mới'}</h3>
                <p className="text-xs text-neutralCustom mt-1">Cấu hình chi tiết chương trình ưu đãi cho nhà hàng</p>
              </div>
              <button onClick={() => setIsPromoModalOpen(false)} className="p-2 hover:bg-neutralCustom/10 rounded-full text-neutralCustom transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 bg-gray-50 flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Tên chương trình <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="VD: Tri ân khách hàng thân thiết" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Mã Code (CODE) <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="VD: TRUONGHA" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-900 uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Loại Khuyến Mãi <span className="text-red-500">*</span></label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 cursor-pointer">
                    <option value="VOUCHER">VOUCHER (Phiếu giảm giá cá nhân)</option>
                    <option value="BILL_CONDITION">BILL_CONDITION (Áp dụng theo Hóa đơn)</option>
                    <option value="GLOBAL">GLOBAL (Toàn cục)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Loại Giảm</label>
                  <select value={formData.discount_type} onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 cursor-pointer">
                    <option value="AMOUNT">Theo số tiền (VNĐ)</option>
                    <option value="PERCENTAGE">Theo phần trăm (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Mức Giảm <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="number" min="0" placeholder="Nhập giá trị..." value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-primary pr-10" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutralCustom font-bold text-sm">{formData.discount_type === 'PERCENTAGE' ? '%' : 'đ'}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Hóa đơn tối thiểu (Tùy chọn)</label>
                  <div className="relative">
                    <input type="number" min="0" placeholder="VD: 500000" value={formData.min_bill_value} onChange={(e) => setFormData({ ...formData, min_bill_value: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 pr-10" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutralCustom font-bold text-sm">đ</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Ngày bắt đầu <span className="text-red-500">*</span></label>
                  <input type="datetime-local" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Ngày kết thúc <span className="text-red-500">*</span></label>
                  <input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900" />
                </div>
                <div className="col-span-2 flex items-center gap-3 bg-white p-3 rounded-xl border border-neutralCustom/20">
                  <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer" />
                  <label htmlFor="is_active" className="text-sm font-bold text-gray-900 cursor-pointer select-none">Kích hoạt chương trình ngay lập tức</label>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-neutralCustom/20 bg-white flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsPromoModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-neutralCustom border border-neutralCustom/20 hover:bg-gray-50 transition-colors">Hủy bỏ</button>
              <button onClick={handleSavePromo} disabled={isSaving} className="px-8 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-secondary shadow-md disabled:opacity-50 transition-all flex items-center gap-2">
                {isSaving ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                {isSaving ? 'Đang lưu...' : 'Lưu Khuyến Mãi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 MỚI: MODAL TẶNG VOUCHER CHO KHÁCH HÀNG (CHỈ NHẬP SĐT) */}
      {isGiftModalOpen && giftData.selectedPromo && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-neutralCustom/10 bg-orange-50/50 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                <span className="material-symbols-outlined text-4xl text-secondary">card_giftcard</span>
              </div>
              <h3 className="text-xl font-black text-gray-900">Tặng Voucher Tri Ân</h3>
              <p className="text-xs text-neutralCustom mt-1">Đang thực hiện tặng: <b className="text-primary">{giftData.selectedPromo.name}</b></p>
            </div>

            <div className="p-6 space-y-4 bg-white">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Số điện thoại khách hàng <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutralCustom text-xl">call</span>
                  <input 
                    type="text" 
                    placeholder="VD: 0832071653" 
                    value={giftData.phone_number} 
                    onChange={(e) => setGiftData({ ...giftData, phone_number: e.target.value })} 
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-neutralCustom/20 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-900" 
                  />
                </div>
                <p className="text-[10.5px] text-neutralCustom mt-2 leading-relaxed">
                  * Hệ thống sẽ tự động tra cứu khách hàng dựa trên Số điện thoại để cấp mã Voucher và gửi email phản hồi trực tiếp tới Email đăng ký của họ.
                </p>
              </div>

              {/* Checkbox bỏ qua điều kiện tích lũy 5 triệu */}
              <div className="flex items-center gap-3 bg-orange-50/50 p-3.5 rounded-2xl border border-orange-100 mt-2">
                <input 
                  type="checkbox" 
                  id="bypass_limit" 
                  checked={giftData.bypass_limit} 
                  onChange={(e) => setGiftData({ ...giftData, bypass_limit: e.target.checked })} 
                  className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer" 
                />
                <div className="flex flex-col cursor-pointer select-none" onClick={() => setGiftData({ ...giftData, bypass_limit: !giftData.bypass_limit })}>
                  <label htmlFor="bypass_limit" className="text-xs font-bold text-gray-900 cursor-pointer">
                    Bỏ qua điều kiện tích lũy chi tiêu 5.000.000 đ
                  </label>
                  <span className="text-[10px] text-neutralCustom">Tích chọn để phát ngay lập tức cho khách hàng bất kỳ.</span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-neutralCustom/10 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsGiftModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-700 border border-neutralCustom/20 hover:bg-white transition-colors">Hủy</button>
              <button 
                onClick={handleSendGiftSubmit} 
                disabled={isSendingGift} 
                className="px-8 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-secondary shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isSendingGift ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> : <span className="material-symbols-outlined text-[16px]">send</span>}
                {isSendingGift ? 'Đang xử lý...' : 'Xác nhận tặng ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionManagement;