import React, { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import axios from 'axios';

const axiosConfig = { headers: { 'ngrok-skip-browser-warning': 'true' } };

const PromotionManagement = () => {
  // Quản lý Tab hiển thị hiện tại ('Khuyến mãi' hoặc 'Lịch sử tặng Voucher')
  const [activeTab, setActiveTab] = useState('Khuyến mãi');
  const [promotionsList, setPromotionsList] = useState([]);
  const [customerVouchersList, setCustomerVouchersList] = useState([]);
  
  // Trạng thái chờ khi đang đồng bộ danh sách khuyến mãi
  const [isLoading, setIsLoading] = useState(false);
  
  // Trạng thái chờ khi đang tải danh sách lịch sử tặng voucher
  const [isLoadingCV, setIsLoadingCV] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [alertModal, setAlertModal] = useState({ show: false, message: '', title: 'Thông báo', type: 'success' });
  
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  // Giá trị mặc định để khởi tạo dữ liệu cho form khuyến mãi
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

  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  
  // Dữ liệu tặng voucher gồm số điện thoại nhận, cờ bỏ qua giới hạn và khuyến mãi được chọn
  const [giftData, setGiftData] = useState({ phone_number: '', bypass_limit: true, selectedPromo: null });
  
  // Tìm kiếm & dropdown chọn khách hàng tặng voucher
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef(null);

  // Trạng thái chờ khi đang thực hiện gửi tặng voucher qua API
  const [isSendingGift, setIsSendingGift] = useState(false);
  
  const [customersList, setCustomersList] = useState([]);

  useEffect(() => {
    fetchPromotions();
    fetchCustomerVouchers();
    fetchCustomers();
  }, []);

  // Đóng dropdown khách hàng khi click bên ngoài modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Kích hoạt hiển thị hộp thoại cảnh báo thông báo nhanh
  const showAlert = (message, type = 'success', title = 'Thông báo') => {
    setAlertModal({ show: true, message, title, type });
  };

  // Gọi API lấy toàn bộ danh sách chương trình khuyến mãi từ hệ thống
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

  // Gọi API lấy lịch sử phát tặng voucher cho khách hàng
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

  // Gọi API lấy danh sách toàn bộ khách hàng để phục vụ việc chọn gửi tặng voucher
  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/customers`, axiosConfig);
      if (response.data && response.data.success) {
        setCustomersList(response.data.data || []);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách khách hàng:", error);
    }
  };

  // Chuyển đổi định dạng chuỗi ngày ISO từ database thành chuỗi tương thích với input datetime-local
  const formatForInput = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  // Định dạng chuỗi ngày giờ từ database sang định dạng thân thiện DD/MM/YYYY
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Mở modal ở chế độ thêm khuyến mãi mới (reset sạch form)
  const handleOpenAddModal = () => {
    setFormData(initialPromoState);
    setIsPromoModalOpen(true);
  };

  // Đọc dữ liệu của chương trình khuyến mãi hiện có và mở modal chỉnh sửa
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

  // Gửi thông tin form khuyến mãi lên Backend để lưu (thêm mới hoặc cập nhật)
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

  // Gọi API xóa chương trình khuyến mãi sau khi được xác nhận
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

  // Mở modal chuẩn bị tặng voucher cho khách hàng
  const handleOpenGiftModal = (promo) => {
    setGiftData({ phone_number: '', bypass_limit: true, selectedPromo: promo });
    setCustomerSearchTerm('');
    setIsCustomerDropdownOpen(false);
    setIsGiftModalOpen(true);
  };

  // Lọc danh sách khách hàng theo Tên hoặc Số điện thoại trong ô tìm kiếm
  const filteredCustomersForGift = customersList.filter(cus => {
    if (!customerSearchTerm.trim()) return true;
    const term = customerSearchTerm.toLowerCase().trim();
    const nameMatch = cus.name?.toLowerCase().includes(term);
    const phoneMatch = cus.phone_number?.includes(term);
    return nameMatch || phoneMatch;
  });

  // Gửi yêu cầu tặng voucher qua API lên Backend (tạo voucher và tự động gửi email)
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
        fetchCustomerVouchers();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || "Lỗi trong quá trình tặng voucher!", "error", "Giao dịch thất bại");
    } finally {
      setIsSendingGift(false);
    }
  };

  // Tính số lượng trang cho bộ phân trang
  const totalPages = Math.ceil(promotionsList.length / itemsPerPage);
  
  // Trích xuất danh sách khuyến mãi hiển thị cho trang hiện tại
  const currentPromotions = promotionsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Lấy nhãn hiển thị và CSS class tương ứng cho từng loại khuyến mãi
  const getTypeStyle = (type) => {
    switch (type?.toUpperCase()) {
      case 'VOUCHER': return { label: 'Voucher', color: 'text-secondary bg-secondary/10 border-secondary/20' };
      case 'BILL_CONDITION': return { label: 'KM Hệ thống', color: 'text-primary bg-primary/10 border-primary/20' };
      default: return { label: 'Khác', color: 'text-tertiary bg-tertiary/10 border-tertiary/20' };
    }
  };

  // Xác định trạng thái hoạt động hiện tại của chương trình khuyến mãi (đã tắt, hết hạn hoặc đang chạy)
  const getPromoStatus = (isActive, endDate) => {
    if (!isActive) return { text: 'Đã tắt', color: 'text-neutralCustom', dot: 'bg-neutralCustom' };
    if (new Date() > new Date(endDate)) return { text: 'Hết hạn', color: 'text-red-500', dot: 'bg-red-500' };
    return { text: 'Đang chạy', color: 'text-green-600', dot: 'bg-green-500 animate-pulse' };
  };

  // Đếm số chương trình đang chạy hợp lệ
  const activePromotionsCount = promotionsList.filter(p => p.is_active && new Date(p.end_date) >= new Date()).length;

  // Cấu hình danh sách các chỉ số thống kê bento
  const stats = [
    { title: 'Chương trình đang chạy', value: activePromotionsCount, icon: 'local_activity', color: 'primary', bg: 'bg-primary/10 text-primary' },
    { title: 'Voucher đã phát', value: customerVouchersList.length, icon: 'card_giftcard', color: 'secondary', bg: 'bg-secondary/10 text-secondary' },
    { title: 'Tổng chương trình', value: promotionsList.length, icon: 'confirmation_number', color: 'tertiary', bg: 'bg-tertiary/10 text-tertiary' },
  ];

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden relative">
      <AdminSidebar currentTab="promotion" />
      <AdminHeader />

      {/* HỆ THỐNG ALERT MODAL THAY THẾ TOAST */}
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

      {/* HỆ THỐNG HỘP THOẠI XÁC NHẬN THAY THẾ CONFIRM */}
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

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <main className="ml-64 pt-20 p-6 w-[calc(100%-16rem)] flex flex-col min-h-screen">
        {/* Tiêu đề & Nút thêm khuyến mãi */}
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

        {/* Khối thống kê chỉ số Bento */}
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

        {/* Thanh chọn Tabs */}
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

        {/* Bảng chương trình Khuyến mãi */}
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

            {/* Phân trang danh sách */}
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
          /* Bảng Lịch sử tặng Voucher */
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

      {/* Form thêm mới / Sửa khuyến mãi */}
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

      {/* Modal tặng Voucher cho khách hàng */}
      {isGiftModalOpen && giftData.selectedPromo && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col animate-scale-up relative">
            <div className="p-6 border-b border-neutralCustom/10 bg-orange-50/50 flex flex-col items-center text-center rounded-t-3xl">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                <span className="material-symbols-outlined text-4xl text-secondary">card_giftcard</span>
              </div>
              <h3 className="text-xl font-black text-gray-900">Tặng Voucher Tri Ân</h3>
              <p className="text-xs text-neutralCustom mt-1">Đang thực hiện tặng: <b className="text-primary">{giftData.selectedPromo.name}</b></p>
            </div>

            <div className="p-6 space-y-4 bg-white">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Tìm / Chọn khách hàng nhận Voucher <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={customerDropdownRef}>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 material-symbols-outlined text-neutralCustom text-xl pointer-events-none z-10">
                      {giftData.phone_number ? 'account_circle' : 'search'}
                    </span>
                    <input
                      type="text"
                      placeholder="Nhập Tên hoặc Số điện thoại để tìm..."
                      value={
                        isCustomerDropdownOpen 
                          ? customerSearchTerm 
                          : (giftData.phone_number 
                              ? (() => {
                                  const found = customersList.find(c => c.phone_number === giftData.phone_number);
                                  return found ? `${found.name} - ${found.phone_number}` : giftData.phone_number;
                                })()
                              : customerSearchTerm)
                      }
                      onFocus={() => {
                        setIsCustomerDropdownOpen(true);
                      }}
                      onChange={(e) => {
                        setCustomerSearchTerm(e.target.value);
                        setIsCustomerDropdownOpen(true);
                        if (giftData.phone_number) {
                          setGiftData(prev => ({ ...prev, phone_number: '' }));
                        }
                      }}
                      className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-neutralCustom/20 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                    />
                    {giftData.phone_number || customerSearchTerm ? (
                      <button
                        type="button"
                        onClick={() => {
                          setGiftData(prev => ({ ...prev, phone_number: '' }));
                          setCustomerSearchTerm('');
                          setIsCustomerDropdownOpen(true);
                        }}
                        className="absolute right-3 p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-700 rounded-full transition-colors z-10"
                        title="Xóa tìm kiếm / lựa chọn"
                      >
                        <span className="material-symbols-outlined text-lg block">close</span>
                      </button>
                    ) : (
                      <span className="absolute right-4 material-symbols-outlined text-neutralCustom pointer-events-none">
                        arrow_drop_down
                      </span>
                    )}
                  </div>

                  {/* Dropdown hiển thị danh sách khách hàng tìm kiếm */}
                  {isCustomerDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-neutralCustom/20 rounded-2xl shadow-2xl z-[100] max-h-48 overflow-y-auto animate-fade-in divide-y divide-gray-100">
                      {filteredCustomersForGift.length > 0 ? (
                        filteredCustomersForGift.map(cus => {
                          const isSelected = cus.phone_number === giftData.phone_number;
                          return (
                            <div
                              key={cus.id}
                              onClick={() => {
                                setGiftData(prev => ({ ...prev, phone_number: cus.phone_number }));
                                setCustomerSearchTerm('');
                                setIsCustomerDropdownOpen(false);
                              }}
                              className={`p-3 px-4 flex items-center justify-between cursor-pointer transition-colors ${
                                isSelected ? 'bg-orange-50/80 text-primary font-bold' : 'hover:bg-orange-50/40 text-gray-800'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                                  isSelected ? 'bg-primary text-white' : 'bg-stone-100 text-stone-600'
                                }`}>
                                  {cus.name ? cus.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-900">{cus.name}</p>
                                  <p className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[13px] text-stone-400">call</span>
                                    {cus.phone_number}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-xs text-gray-500 font-medium">
                          Không tìm thấy khách hàng nào khớp với từ khóa "{customerSearchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {giftData.phone_number && (() => {
                  const selectedCustomer = customersList.find(c => c.phone_number === giftData.phone_number);
                  if (!selectedCustomer) return null;
                  return (
                    <div className="mt-4 bg-stone-50/50 border border-stone-200/80 p-4 rounded-2xl space-y-2.5 animate-fade-in text-xs shadow-inner">
                      <div className="flex justify-between items-center">
                        <span className="text-stone-500 font-bold uppercase tracking-wider text-[10px]">Tên khách hàng:</span>
                        <span className="text-gray-900 font-extrabold">{selectedCustomer.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-500 font-bold uppercase tracking-wider text-[10px]">Email đăng ký:</span>
                        <span className="text-gray-900 font-semibold font-mono break-all max-w-[200px] text-right" title={selectedCustomer.email}>
                          {selectedCustomer.email}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <p className="text-[10.5px] text-neutralCustom mt-3 leading-relaxed">
                  * Hệ thống sẽ tự động gửi email thông báo kèm mã Voucher trực tiếp tới Email đăng ký ở trên của khách hàng sau khi tặng thành công.
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-neutralCustom/10 bg-gray-50 flex justify-end gap-3 shrink-0 rounded-b-3xl">
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