import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import axios from 'axios';

const PromotionNewsManagement = () => {
  // State quản lý Tab đang active
  const [activeTab, setActiveTab] = useState('Khuyến mãi');

  // --- STATES QUẢN LÝ DỮ LIỆU TỪ API ---
  const [promotionsList, setPromotionsList] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  const initialNewsState = {
    id: null,
    title: '',
    content: '',
    promotion_id: '',
    is_published: true,
    imageFile: null
  };
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [newsFormData, setNewsFormData] = useState(initialNewsState);
  const [imagePreview, setImagePreview] = useState(null);

  const [isNewsDetailOpen, setIsNewsDetailOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);


  // Gọi API lấy danh sách khuyến mãi khi component được render
  useEffect(() => {
    fetchPromotions();
    fetchNews();
  }, []);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/promotions/list`);

      if (response.data.success) {
        const dataList = response.data.promotions || [];
        setPromotionsList(dataList);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách khuyến mãi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNews = async () => {
    setIsLoadingNews(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/news`);
      // Giả định backend trả về { success: true, data: [...] } hoặc { success: true, news: [...] }
      if (response.data.success) {
        setNewsList(response.data.data || response.data.news || []);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách tin tức:", error);
    } finally {
      setIsLoadingNews(false);
    }
  };

  // Hàm format string ISO thành dạng "YYYY-MM-DDThh:mm" để nạp vào thẻ <input type="datetime-local">
  const formatForInput = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

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
      return alert("Vui lòng điền đầy đủ thông tin bắt buộc (*)");
    }

    setIsSaving(true);
    try {
      // Dựa vào id để phân biệt là Đang Thêm mới hay Đang Cập nhật
      const url = formData.id
        ? `${import.meta.env.VITE_API_URL}/promotions/update`
        : `${import.meta.env.VITE_API_URL}/promotions/add`;

      const payload = { ...formData };
      payload.discount_value = Number(payload.discount_value);
      if (payload.min_bill_value) payload.min_bill_value = Number(payload.min_bill_value);

      const res = await axios.post(url, payload);

      if (res.data.success) {
        alert(formData.id ? "Cập nhật khuyến mãi thành công!" : "Thêm khuyến mãi mới thành công!");
        setIsPromoModalOpen(false);
        fetchPromotions(); // Tải lại danh sách
      }
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi lưu dữ liệu!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn khuyến mãi này không?")) return;
    try {
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/promotions/delete/${id}`);
      if (res.data.success) {
        alert("Xóa thành công!");
        fetchPromotions();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi xóa!");
    }
  };

  const handleOpenAddNewsModal = () => {
    setNewsFormData(initialNewsState);
    setImagePreview(null);
    setIsNewsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewsFormData({ ...newsFormData, imageFile: file });
      setImagePreview(URL.createObjectURL(file)); // Hiển thị ảnh xem trước
    }
  };

  const handleSaveNews = async () => {
    if (!newsFormData.title || !newsFormData.content) return alert("Vui lòng điền đủ Tiêu đề và Nội dung bài viết!");
    setIsSaving(true);
    try {
      const payload = new FormData();
      if (newsFormData.id) payload.append('id', newsFormData.id);
      payload.append('content', newsFormData.content);
      payload.append('is_published', newsFormData.is_published);
      if (newsFormData.promotion_id) payload.append('promotion_id', newsFormData.promotion_id);
      if (newsFormData.imageFile) payload.append('image', newsFormData.imageFile);

      // Chuyển URL dựa trên việc thêm hay sửa
      const url = newsFormData.id
        ? `${import.meta.env.VITE_API_URL}/news/update`
        : `${import.meta.env.VITE_API_URL}/news/add`;

      const res = await axios.post(url, payload, { headers: { 'Content-Type': 'multipart/form-data' } });

      if (res.data.success) {
        alert(newsFormData.id ? "Cập nhật tin tức thành công!" : "Đăng tin tức thành công!");
        setIsNewsModalOpen(false);
        fetchNews();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi lưu tin tức!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewNewsDetail = (news) => {
    setSelectedNews(news);
    setIsNewsDetailOpen(true);
  };

  const handleEditNews = (news) => {
    setNewsFormData({
      id: news.id,
      title: news.title,
      content: news.content,
      promotion_id: news.promotion_id || '',
      is_published: news.is_published,
      imageFile: null // Ảnh cũ sẽ không cần upload lại trừ khi chọn ảnh mới
    });
    setImagePreview(news.image_url || null);
    setIsNewsDetailOpen(false);
    setIsNewsModalOpen(true);
  };

  const handleDeleteNews = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn bài viết này không? Hành động này không thể hoàn tác!")) return;
    try {
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/news/delete/${id}`);
      if (res.data.success) {
        alert("Xóa tin tức thành công!");
        setIsNewsDetailOpen(false); // Đóng modal chi tiết nếu đang mở
        fetchNews();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi xóa tin tức!");
    }
  };

  // XỬ LÝ PHÂN TRANG (PAGINATION)
  const totalPages = Math.ceil(promotionsList.length / itemsPerPage);
  // Cắt mảng lấy đúng 6 phần tử cho trang hiện tại
  const currentPromotions = promotionsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // HÀM FORMAT GIAO DIỆN HIỂN THỊ CHUNG
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const getTypeStyle = (type) => {
    switch (type?.toUpperCase()) {
      case 'VOUCHER': return { label: 'Voucher', color: 'bg-secondary/10 text-secondary' };
      case 'BILL_CONDITION': return { label: 'KM Hệ thống', color: 'bg-primary/10 text-primary' };
      default: return { label: 'Khác', color: 'bg-tertiary/10 text-tertiary' };
    }
  };

  const getPromoStatus = (isActive, endDate) => {
    if (!isActive) return { text: 'Đã tắt', color: 'text-neutralCustom', dot: 'bg-neutralCustom' };

    const now = new Date();
    const end = new Date(endDate);

    if (now > end) {
      return { text: 'Hết hạn', color: 'text-red-500', dot: 'bg-red-500' };
    }
    return { text: 'Đang chạy', color: 'text-green-600', dot: 'bg-green-500 animate-pulse' };
  };

  const activePromotionsCount = promotionsList.filter(p => p.is_active && new Date(p.end_date) >= new Date()).length;
  const totalNewsCount = newsList.length;

  const stats = [
    { title: 'Khuyến mãi đang chạy', value: activePromotionsCount < 10 ? `0${activePromotionsCount}` : activePromotionsCount, icon: 'local_activity', color: 'primary', bg: 'bg-primary/10 text-primary' },
    { title: 'Lượt sử dụng mã', value: '1.2k', icon: 'query_stats', color: 'secondary', bg: 'bg-secondary/10 text-secondary' },
    { title: 'Tổng số tin tức', value: totalNewsCount < 10 ? `0${totalNewsCount}` : totalNewsCount, icon: 'newspaper', color: 'tertiary', bg: 'bg-tertiary/10 text-tertiary' },
  ];

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden relative">
      <AdminSidebar currentTab="promotion" />
      <AdminHeader />

      <main className="ml-64 pt-24 p-8 w-full flex flex-col min-h-screen">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Khuyến mãi & Tin tức</h2>
            <p className="text-neutralCustom text-sm">Tạo và quản lý các chương trình ưu đãi, bài viết tin tức cho nhà hàng.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleOpenAddNewsModal} className="bg-white text-primary border border-primary/30 font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 hover:bg-primary/5 transition-all shadow-sm text-sm">
              <span className="material-symbols-outlined text-[20px]">edit_note</span>
              <span>Viết tin tức</span>
            </button>
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
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {stat.icon}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-neutralCustom uppercase tracking-wider mb-1">{stat.title}</p>
                <h4 className={`text-3xl font-black text-${stat.color} leading-none`}>{stat.value}</h4>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Section */}
        <div className="mb-6 flex border-b border-neutralCustom/20">
          <button
            onClick={() => setActiveTab('Khuyến mãi')}
            className={`px-8 py-3.5 font-bold text-sm transition-all border-b-2 ${activeTab === 'Khuyến mãi' ? 'border-primary text-primary' : 'border-transparent text-neutralCustom hover:text-primary'
              }`}
          >
            Chương trình Khuyến mãi
          </button>
          <button
            onClick={() => setActiveTab('Tin tức')}
            className={`px-8 py-3.5 font-bold text-sm transition-all border-b-2 ${activeTab === 'Tin tức' ? 'border-primary text-primary' : 'border-transparent text-neutralCustom hover:text-primary'
              }`}
          >
            Tin tức & Sự kiện
          </button>
        </div>

        {/* NỘI DUNG THEO TAB */}

        {activeTab === 'Khuyến mãi' ? (
          /* TAB 1: BẢNG KHUYẾN MÃI */
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutralCustom/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-culinaryBg/50 text-neutralCustom border-b border-neutralCustom/20">
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Tên chương trình</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Loại</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Mức giảm</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Thời hạn</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutralCustom/10">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-neutralCustom">Đang tải dữ liệu khuyến mãi...</td>
                    </tr>
                  ) : currentPromotions.length > 0 ? (
                    currentPromotions.map((promo) => {
                      const typeStyle = getTypeStyle(promo.type);
                      const statusObj = getPromoStatus(promo.is_active, promo.end_date);
                      return (
                        <tr key={promo.code} className={`hover:bg-culinaryBg/30 transition-colors group ${!promo.is_active ? 'opacity-60' : ''}`}>
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900 text-sm">{promo.name}</p>
                            <p className="text-xs text-neutralCustom mt-0.5">{promo.code}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`${typeStyle.color} px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-current`}>
                              {typeStyle.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-sm text-gray-900">
                            {Number(promo.discount_value).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col text-neutralCustom text-xs">
                              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {formatDate(promo.start_date)}</span>
                              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">event_busy</span> {formatDate(promo.end_date)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`flex items-center gap-2 font-bold text-sm ${statusObj.color}`}>
                              <span className={`w-2 h-2 rounded-full ${statusObj.dot}`}></span>
                              {statusObj.text}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
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
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-neutralCustom">Chưa có liệu khuyến mãi nào cả.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang (Pagination) */}
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
          /* TAB 2: GTIN TỨC */
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Tin tức & Sự kiện gần đây</h3>
            </div>

            {isLoadingNews ? (
              <div className="text-center py-10 text-neutralCustom">Đang tải danh sách tin tức...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Nút thêm bài viết mới dạng Card (Luôn hiện ở đầu hoặc cuối) */}
                <button onClick={handleOpenAddNewsModal} className="rounded-2xl border-2 border-dashed border-neutralCustom/30 flex flex-col items-center justify-center p-6 hover:bg-primary/5 hover:border-primary/40 transition-all group min-h-[260px] bg-white">
                  <div className="w-14 h-14 rounded-full bg-culinaryBg flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-3 shadow-sm border border-neutralCustom/10">
                    <span className="material-symbols-outlined text-2xl">add</span>
                  </div>
                  <p className="font-bold text-neutralCustom group-hover:text-primary transition-colors">Tạo bài viết mới</p>
                </button>

                {/* Lặp danh sách tin tức từ Database */}
                {newsList.map((news) => {
                  // KIỂM TRA TRẠNG THÁI: Dùng is_published thay vì isDraft
                  const isDraft = news.is_published === false;
                  const statusLabel = isDraft ? 'Bản nháp' : 'Đã đăng';

                  return (
                    <div
                      key={news.id}
                      onClick={() => handleViewNewsDetail(news)}
                      className={`bg-white rounded-2xl overflow-hidden border border-neutralCustom/20 shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-pointer ${isDraft ? 'opacity-90' : ''}`}>
                      <div className="relative h-40 bg-culinaryBg flex items-center justify-center">
                        {/* LẤY ẢNH: Dùng image_url */}
                        {news.image_url ? (
                          <img src={news.image_url} alt={news.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-4xl text-neutralCustom/30">add_photo_alternate</span>
                        )}
                        <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider text-white shadow-sm
                          ${isDraft ? 'bg-neutralCustom' : 'bg-green-500'}
                        `}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        {/* LẤY NGÀY: Dùng created_at */}
                        <p className="text-xs text-neutralCustom mb-1.5">{formatDate(news.created_at)}</p>
                        <h5 className="font-bold text-gray-900 line-clamp-2 mb-4 text-sm flex-1" title={news.title}>{news.title}</h5>
                        <div className="flex justify-between items-center mt-auto border-t border-neutralCustom/10 pt-3">
                          <span className="text-xs text-neutralCustom font-medium flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">
                              {isDraft ? 'history_edu' : 'visibility'}
                            </span>
                            {isDraft ? 'Đang soạn' : `1T lượt xem`}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditNews(news); }}
                              className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors" title="Chỉnh sửa"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteNews(news.id); }}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Xóa"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL XEM CHI TIẾT TIN TỨC (VIEW-ONLY) */}
      {isNewsDetailOpen && selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in pointer">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up max-h-[90vh]">

            {/* Header: Ảnh hiển thị trọn vẹn (object-contain thay vì object-cover) */}
            <div className="w-full bg-gray-100 flex justify-center items-center relative shrink-0 border-b border-neutralCustom/10">
              {selectedNews.image_url ? (
                // 🌟 Dùng object-contain và max-h-80 để ảnh tự khớp mà không bao giờ bị cắt đầu cắt đuôi
                <img src={selectedNews.image_url} alt={selectedNews.title} className="max-w-full max-h-80 object-contain" />
              ) : (
                <div className="w-full h-48 flex flex-col items-center justify-center text-neutralCustom/40">
                  <span className="material-symbols-outlined text-4xl mb-2">image</span>
                  <span className="text-sm font-medium">Không có ảnh bìa</span>
                </div>
              )}
              {/* Nút đóng góc trên */}
              <button onClick={() => setIsNewsDetailOpen(false)} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors shadow-md">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Nội dung chi tiết cuộn được */}
            <div className="p-6 overflow-y-auto bg-white flex-1 custom-scrollbar">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md text-white ${selectedNews.is_published === false ? 'bg-neutralCustom' : 'bg-green-500'}`}>
                  {selectedNews.is_published === false ? 'Bản nháp' : 'Đã đăng'}
                </span>
                <span className="text-xs font-medium text-neutralCustom flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  {formatDate(selectedNews.created_at)}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 leading-snug">{selectedNews.title}</h2>

              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedNews.content}
              </div>
            </div>

            {/* Footer: Chỉ còn nút Đóng */}
            <div className="p-5 border-t border-neutralCustom/20 bg-gray-50 flex justify-end shrink-0">
              <button onClick={() => setIsNewsDetailOpen(false)} className="px-8 py-2.5 rounded-xl font-bold text-sm text-gray-700 bg-white border border-neutralCustom/30 hover:bg-gray-100 transition-colors shadow-sm">
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL FORM THÊM / SỬA KHUYẾN MÃI (POPUP) */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
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
                {/* Tên chương trình */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Tên chương trình <span className="text-red-500">*</span></label>
                  <input
                    type="text" placeholder="VD: Khai trương giảm 20%"
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900"
                  />
                </div>

                {/* Mã CODE */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Mã Code (CODE) <span className="text-red-500">*</span></label>
                  <input
                    type="text" placeholder="VD: SUMMER20"
                    value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-900 uppercase"
                  />
                </div>

                {/* Loại Khuyến mãi */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Loại Khuyến Mãi <span className="text-red-500">*</span></label>
                  <select
                    value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 cursor-pointer"
                  >
                    <option value="VOUCHER">VOUCHER (Phiếu giảm giá)</option>
                    <option value="BILL_CONDITION">BILL_CONDITION (Theo Hóa đơn)</option>
                    <option value="GLOBAL">GLOBAL (Toàn cục)</option>
                  </select>
                </div>

                {/* Loại Giảm & Mức giảm */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Loại Giảm</label>
                  <select
                    value={formData.discount_type} onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 cursor-pointer"
                  >
                    <option value="AMOUNT">Theo số tiền (VNĐ)</option>
                    <option value="PERCENTAGE">Theo phần trăm (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Mức Giảm <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="number" min="0" placeholder={formData.discount_type === 'PERCENTAGE' ? 'Ví dụ: 10' : 'Ví dụ: 50000'}
                      value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-primary pr-10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutralCustom font-bold text-sm">
                      {formData.discount_type === 'PERCENTAGE' ? '%' : 'đ'}
                    </span>
                  </div>
                </div>

                {/* Điều kiện hóa đơn */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Hóa đơn tối thiểu (Tùy chọn)</label>
                  <div className="relative">
                    <input
                      type="number" min="0" placeholder="VD: 500000 (Để trống nếu không có yêu cầu)"
                      value={formData.min_bill_value} onChange={(e) => setFormData({ ...formData, min_bill_value: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 pr-10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutralCustom font-bold text-sm">đ</span>
                  </div>
                </div>

                {/* Ngày bắt đầu - Kết thúc */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Ngày bắt đầu <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 cursor-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Ngày kết thúc <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 cursor-text"
                  />
                </div>

                {/* Active Checkbox */}
                <div className="col-span-2 flex items-center gap-3 bg-white p-3 rounded-xl border border-neutralCustom/20">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="is_active" className="text-sm font-bold text-gray-900 cursor-pointer select-none">
                    Kích hoạt chương trình ngay lập tức
                  </label>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-neutralCustom/20 bg-white flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsPromoModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-neutralCustom border border-neutralCustom/20 hover:bg-gray-50 transition-colors">
                Hủy bỏ
              </button>
              <button
                onClick={handleSavePromo}
                disabled={isSaving}
                className="px-8 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-secondary shadow-md hover:shadow-primary/30 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isSaving ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                {isSaving ? 'Đang lưu...' : 'Lưu Khuyến Mãi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM THÊM / SỬA KHUYẾN MÃI */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
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
                  <input type="text" placeholder="VD: Khai trương giảm 20%" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Mã Code (CODE) <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="VD: SUMMER20" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-900 uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Loại Khuyến Mãi <span className="text-red-500">*</span></label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 cursor-pointer">
                    <option value="VOUCHER">VOUCHER (Phiếu giảm giá)</option>
                    <option value="BILL_CONDITION">BILL_CONDITION (Theo Hóa đơn)</option>
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
                    <input type="number" min="0" placeholder={formData.discount_type === 'PERCENTAGE' ? 'Ví dụ: 10' : 'Ví dụ: 50000'} value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-primary pr-10" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutralCustom font-bold text-sm">{formData.discount_type === 'PERCENTAGE' ? '%' : 'đ'}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Hóa đơn tối thiểu (Tùy chọn)</label>
                  <div className="relative">
                    <input type="number" min="0" placeholder="VD: 500000 (Để trống nếu không có yêu cầu)" value={formData.min_bill_value} onChange={(e) => setFormData({ ...formData, min_bill_value: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 pr-10" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutralCustom font-bold text-sm">đ</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Ngày bắt đầu <span className="text-red-500">*</span></label>
                  <input type="datetime-local" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 cursor-text" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Ngày kết thúc <span className="text-red-500">*</span></label>
                  <input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 cursor-text" />
                </div>
                <div className="col-span-2 flex items-center gap-3 bg-white p-3 rounded-xl border border-neutralCustom/20">
                  <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer" />
                  <label htmlFor="is_active" className="text-sm font-bold text-gray-900 cursor-pointer select-none">Kích hoạt chương trình ngay lập tức</label>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-neutralCustom/20 bg-white flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsPromoModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-neutralCustom border border-neutralCustom/20 hover:bg-gray-50 transition-colors">Hủy bỏ</button>
              <button onClick={handleSavePromo} disabled={isSaving} className="px-8 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-secondary shadow-md hover:shadow-primary/30 disabled:opacity-50 transition-all flex items-center gap-2">
                {isSaving ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                {isSaving ? 'Đang lưu...' : 'Lưu Khuyến Mãi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL FORM THÊM / SỬA TIN TỨC (Giữ nguyên) */}
      {/* ===================================================================== */}
      {isNewsModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up max-h-[90vh]">
            <div className="p-5 border-b border-neutralCustom/20 flex items-center justify-between bg-culinaryBg shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{newsFormData.id ? 'Chỉnh Sửa Tin Tức' : 'Viết Tin Tức Mới'}</h3>
                <p className="text-xs text-neutralCustom mt-1">Cập nhật tin tức, sự kiện hoặc giới thiệu món ăn mới</p>
              </div>
              <button onClick={() => setIsNewsModalOpen(false)} className="p-2 hover:bg-neutralCustom/10 rounded-full text-neutralCustom transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 bg-gray-50 flex-1 custom-scrollbar">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Tiêu đề bài viết <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="VD: Khai trương cơ sở mới tại Quận 1..." value={newsFormData.title} onChange={(e) => setNewsFormData({ ...newsFormData, title: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Đính kèm chương trình khuyến mãi (Nếu có)</label>
                  <select value={newsFormData.promotion_id} onChange={(e) => setNewsFormData({ ...newsFormData, promotion_id: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 cursor-pointer">
                    <option value="">-- Không đính kèm chương trình nào --</option>
                    {promotionsList.map(promo => (
                      <option key={promo.id} value={promo.id}>{promo.name} (Code: {promo.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Ảnh bìa bài viết</label>
                  <input type="file" accept="image/*" id="newsImageUpload" className="hidden" onChange={handleImageChange} />
                  <label
                    htmlFor="newsImageUpload"
                    className="block w-full h-48 sm:h-56 rounded-2xl border-2 border-dashed border-neutralCustom/40 bg-gray-50 hover:bg-gray-100 overflow-hidden relative shadow-sm cursor-pointer transition-all group flex flex-col items-center justify-center"
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain bg-black/5" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                          <span className="material-symbols-outlined text-4xl mb-2">image_search</span>
                          <span className="font-bold text-sm">Nhấn để chọn ảnh khác</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center flex flex-col items-center px-4">
                        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm mb-3 text-primary">
                          <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                        </div>
                        <span className="font-bold text-gray-700 text-sm mb-1">Nhấn để tải ảnh lên</span>
                        <span className="text-xs text-neutralCustom">Hỗ trợ JPG, PNG, WEBP (Tối đa 5MB)</span>
                      </div>
                    )}
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Nội dung chi tiết <span className="text-red-500">*</span></label>
                  <textarea rows="5" placeholder="Nhập nội dung chi tiết bài viết tại đây..." value={newsFormData.content} onChange={(e) => setNewsFormData({ ...newsFormData, content: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 resize-none custom-scrollbar"></textarea>
                </div>
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-neutralCustom/20">
                  <input type="checkbox" id="is_published" checked={newsFormData.is_published} onChange={(e) => setNewsFormData({ ...newsFormData, is_published: e.target.checked })} className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer" />
                  <div className="flex flex-col cursor-pointer select-none" onClick={() => setNewsFormData({ ...newsFormData, is_published: !newsFormData.is_published })}>
                    <label className="text-sm font-bold text-gray-900 cursor-pointer">Xuất bản bài viết ngay lập tức</label>
                    <span className="text-[11px] text-neutralCustom">Bỏ chọn nếu bạn muốn lưu dưới dạng Bản nháp (Draft)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-neutralCustom/20 bg-white flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsNewsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-neutralCustom border border-neutralCustom/20 hover:bg-gray-50 transition-colors">Hủy bỏ</button>
              <button onClick={handleSaveNews} disabled={isSaving} className="px-8 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-secondary shadow-md hover:shadow-primary/30 disabled:opacity-50 transition-all flex items-center gap-2">
                {isSaving ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">send</span>}
                {isSaving ? 'Đang tải lên...' : 'Lưu Tin Tức'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionNewsManagement;