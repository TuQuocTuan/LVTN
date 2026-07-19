import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import axios from 'axios';

const NewsManagement = () => {
  // --- STATES QUẢN LÝ DỮ LIỆU TỪ API ---
  const [newsList, setNewsList] = useState([]);
  const [promotionsList, setPromotionsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
  const [isSaving, setIsSaving] = useState(false);

  const [isNewsDetailOpen, setIsNewsDetailOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  // 🌟 STATES THAY THẾ ALERT VÀ CONFIRM MẶC ĐỊNH
  const [alertModal, setAlertModal] = useState({ show: false, message: '', title: 'Thông báo', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  const showAlert = (message, type = 'success', title = 'Thông báo') => {
    setAlertModal({ show: true, message, title, type });
  };

  /* STREAMING_CHUNK: Đồng bộ tải tin tức & chương trình khuyến mãi */
  useEffect(() => {
    fetchNews();
    fetchPromotions();
  }, []);

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/news`);
      if (response.data.success) {
        setNewsList(response.data.data || []);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách tin tức:", error);
      showAlert("Gặp sự cố khi đồng bộ bảng tin nướng từ Làng MÌXI!", "error", "Lỗi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPromotions = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/promotions/list`);
      if (response.data.success) {
        setPromotionsList(response.data.promotions || []);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách khuyến mãi:", error);
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
      setImagePreview(URL.createObjectURL(file));
    }
  };

  /* STREAMING_CHUNK: Nghiệp vụ lưu tin tức / sự kiện mới của Làng MÌXI */
  const handleSaveNews = async () => {
    if (!newsFormData.title || !newsFormData.content) {
      return showAlert("Vui lòng điền đầy đủ tiêu đề và nội dung bài viết!", "error", "Thiếu thông tin");
    }

    if (!newsFormData.id && !newsFormData.imageFile) {
      return showAlert("Vui lòng tải lên ảnh bìa đại diện cho bài viết truyền thông mới!", "error", "Thiếu ảnh bìa");
    }

    setIsSaving(true);
    try {
      const payload = new FormData();
      if (newsFormData.id) payload.append('id', newsFormData.id);

      payload.append('title', newsFormData.title);
      payload.append('content', newsFormData.content);
      payload.append('is_published', newsFormData.is_published);
      if (newsFormData.promotion_id) payload.append('promotion_id', newsFormData.promotion_id);
      if (newsFormData.imageFile) payload.append('image', newsFormData.imageFile);

      let res;
      if (newsFormData.id) {
        res = await axios.put(`${import.meta.env.VITE_API_URL}/news/update`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await axios.post(`${import.meta.env.VITE_API_URL}/news/add`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        showAlert(newsFormData.id ? "Cập nhật bài viết sự kiện thành công!" : "Đăng tải bài viết thành công lên hệ thống Làng MÌXI!", "success", "Thành công");
        setIsNewsModalOpen(false);
        fetchNews();
      }
    } catch (error) {
      console.error("Lỗi lưu bài viết:", error);
      showAlert(error.response?.data?.message || "Có lỗi phát sinh khi truyền thông tin tin tức lên máy chủ!", "error", "Thất bại");
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
      imageFile: null
    });
    setImagePreview(news.image_url || null);
    setIsNewsDetailOpen(false);
    setIsNewsModalOpen(true);
  };

  /* STREAMING_CHUNK: Nghiệp vụ xóa bài viết tin tức sử dụng Modal an toàn */
  const handleDeleteNews = (id) => {
    setConfirmModal({
      show: true,
      title: "Xóa bài viết",
      message: "Bạn có chắc chắn muốn xóa vĩnh viễn bài viết này không? Hành động này sẽ dọn sạch dữ liệu và không thể khôi phục lại.",
      onConfirm: async () => {
        try {
          const res = await axios.delete(`${import.meta.env.VITE_API_URL}/news/delete/${id}`);
          if (res.data.success) {
            showAlert("Đã xóa bài viết sự kiện thành công!", "success", "Xóa thành công");
            setIsNewsDetailOpen(false);
            fetchNews();
          }
        } catch (error) {
          console.error("Lỗi khi xóa bài:", error);
          showAlert(error.response?.data?.message || "Lỗi hệ thống khi dọn dẹp bài viết!", "error", "Thất bại");
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const stats = [
    { title: 'Tổng số tin tức', value: newsList.length, icon: 'newspaper', color: 'primary', bg: 'bg-primary/10 text-primary' },
    { title: 'Bài viết đã đăng', value: newsList.filter(n => n.is_published).length, icon: 'task_alt', color: 'green', bg: 'bg-green-50 text-green-600' },
    { title: 'Bản nháp lưu tạm', value: newsList.filter(n => !n.is_published).length, icon: 'edit_calendar', color: 'tertiary', bg: 'bg-tertiary/10 text-tertiary' },
  ];

  /* STREAMING_CHUNK: Render giao diện Tin tức bento thích ứng Laptop/PC màn hình lớn */
  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden relative">
      <AdminSidebar currentTab="news" />
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

      <main className="ml-64 pt-20 p-6 w-[calc(100%-16rem)] flex flex-col min-h-screen transition-all duration-300">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">Tin tức & Sự kiện</h2>
            <p className="text-neutralCustom text-sm">Quản lý nội dung truyền thông, khuyến mãi ra mắt và sự kiện thương hiệu Làng MÌXI.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleOpenAddNewsModal} className="bg-primary text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-md hover:bg-secondary transition-all active:scale-95 text-sm cursor-pointer">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'wght' 700" }}>add</span>
              <span>Viết tin tức mới</span>
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

        {/* Content Section */}
        <div className="animate-fade-in bg-white border border-neutralCustom/20 rounded-2xl p-6 shadow-sm flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Tất cả bài viết truyền thông</h3>
          {isLoading ? (
            <div className="text-center py-20 text-neutralCustom flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
              <p className="font-bold text-sm">Đang đồng bộ bảng tin...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card Thêm bài viết nhanh */}
              <button onClick={handleOpenAddNewsModal} className="rounded-2xl border-2 border-dashed border-neutralCustom/30 flex flex-col items-center justify-center p-6 hover:bg-primary/5 hover:border-primary/40 transition-all group min-h-[260px] bg-gray-50/50 cursor-pointer">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-3 shadow-sm border border-neutralCustom/10">
                  <span className="material-symbols-outlined text-2xl">add</span>
                </div>
                <p className="font-black text-neutralCustom group-hover:text-primary transition-colors text-sm">Tạo bài viết mới</p>
              </button>

              {/* Danh sách bài viết */}
              {newsList.map((news) => {
                const isDraft = news.is_published === false;
                const statusLabel = isDraft ? 'Bản nháp' : 'Đã đăng';

                return (
                  <div
                    key={news.id}
                    onClick={() => handleViewNewsDetail(news)}
                    className={`bg-white rounded-2xl overflow-hidden border border-neutralCustom/20 shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer group ${isDraft ? 'opacity-90' : ''}`}
                  >
                    <div className="relative h-40 bg-stone-100 flex items-center justify-center overflow-hidden">
                      {news.image_url ? (
                        <img src={news.image_url} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <span className="material-symbols-outlined text-4xl text-neutralCustom/30 group-hover:scale-110 transition-transform">add_photo_alternate</span>
                      )}
                      <span className={`absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider text-white shadow-md z-10
                        ${isDraft ? 'bg-neutralCustom' : 'bg-green-500'}
                      `}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <p className="text-xs text-neutralCustom mb-1.5 font-bold font-mono">{formatDate(news.created_at)}</p>
                      <h5 className="font-extrabold text-gray-900 line-clamp-2 mb-4 text-sm flex-1 group-hover:text-primary transition-colors" title={news.title}>{news.title}</h5>
                      <div className="flex justify-between items-center mt-auto border-t border-neutralCustom/10 pt-3 shrink-0">
                        <span className="text-xs text-neutralCustom font-semibold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">
                            {isDraft ? 'history_edu' : 'visibility'}
                          </span>
                          {isDraft ? 'Đang soạn' : `Đang hiển thị`}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditNews(news); }}
                            className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors cursor-pointer" title="Chỉnh sửa"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteNews(news.id); }}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer" title="Xóa"
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
      </main>

      {/* MODAL XEM CHI TIẾT TIN TỨC */}
      {isNewsDetailOpen && selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in cursor-pointer" onClick={() => setIsNewsDetailOpen(false)}>
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-up max-h-[90vh] cursor-default border border-neutralCustom/10" onClick={(e) => e.stopPropagation()}>
            <div className="w-full bg-stone-100 flex justify-center items-center relative shrink-0 border-b border-neutralCustom/10">
              {selectedNews.image_url ? (
                <img src={selectedNews.image_url} alt={selectedNews.title} className="max-w-full max-h-80 object-contain bg-black/5 w-full" />
              ) : (
                <div className="w-full h-48 flex flex-col items-center justify-center text-neutralCustom/40">
                  <span className="material-symbols-outlined text-4xl mb-2">image</span>
                  <span className="text-sm font-bold">Không có ảnh minh họa</span>
                </div>
              )}
              <button onClick={() => setIsNewsDetailOpen(false)} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors shadow-md cursor-pointer flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-white flex-1 custom-scrollbar">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md text-white ${selectedNews.is_published === false ? 'bg-neutralCustom' : 'bg-green-500'}`}>
                  {selectedNews.is_published === false ? 'Bản nháp' : 'Đã đăng'}
                </span>
                <span className="text-xs font-bold text-neutralCustom flex items-center gap-1 font-mono">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  {formatDate(selectedNews.created_at)}
                </span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-6 leading-snug">{selectedNews.title}</h2>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">
                {selectedNews.content}
              </div>
            </div>

            <div className="p-5 border-t border-neutralCustom/20 bg-stone-50/50 flex justify-end gap-2 shrink-0">
              <button onClick={() => handleDeleteNews(selectedNews.id)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer bg-white">
                Xóa bài viết
              </button>
              <button onClick={() => handleEditNews(selectedNews)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-secondary shadow-md transition-all cursor-pointer">
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM THÊM / SỬA TIN TỨC */}
      {isNewsModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-up max-h-[90vh]">
            <div className="p-5 border-b border-neutralCustom/20 flex items-center justify-between bg-stone-50/50 shrink-0">
              <div>
                <h3 className="text-xl font-black text-gray-900">{newsFormData.id ? 'Chỉnh Sửa Tin Tức' : 'Viết Tin Tức Mới'}</h3>
                <p className="text-xs text-neutralCustom mt-1">Đăng tải nội dung sự kiện và đính kèm voucher ưu đãi lên trang tin Làng MÌXI</p>
              </div>
              <button onClick={() => setIsNewsModalOpen(false)} className="p-2 hover:bg-neutralCustom/10 rounded-full text-neutralCustom cursor-pointer flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 bg-white flex-1 custom-scrollbar">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5 tracking-wide">Tiêu đề bài viết <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="VD: Khai trương cơ sở mới tại Quận 1..." value={newsFormData.title} onChange={(e) => setNewsFormData({ ...newsFormData, title: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5 tracking-wide">Đính kèm chương trình khuyến mãi (Nếu có)</label>
                  <select value={newsFormData.promotion_id} onChange={(e) => setNewsFormData({ ...newsFormData, promotion_id: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-700 cursor-pointer">
                    <option value="">-- Không đính kèm chương trình nào --</option>
                    {promotionsList
                      .filter(promo => promo.type?.toUpperCase() === 'BILL_CONDITION' || promo.type?.toUpperCase() === 'GLOBAL')
                      .map(promo => (
                        <option key={promo.id} value={promo.id}>{promo.name} (Code: {promo.code})</option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5 tracking-wide">Ảnh bìa bài viết</label>
                  <input type="file" accept="image/*" id="newsImageUpload" className="hidden" onChange={handleImageChange} />
                  <label
                    htmlFor="newsImageUpload"
                    className="block w-full h-48 sm:h-56 rounded-2xl border-2 border-dashed border-neutralCustom/40 bg-stone-50 hover:bg-stone-100/50 overflow-hidden relative shadow-sm cursor-pointer transition-all group flex flex-col items-center justify-center border-dashed"
                  >
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview?.startsWith('http') ? `${imagePreview}?t=${Date.now()}` : imagePreview}
                          alt="Preview"
                          className="w-full h-full object-contain bg-black/5"
                        />
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
                  <label className="block text-xs font-bold text-neutralCustom uppercase mb-1.5 tracking-wide">Nội dung chi tiết <span className="text-red-500">*</span></label>
                  <textarea rows="6" placeholder="Nhập nội dung chi tiết bài viết tại đây..." value={newsFormData.content} onChange={(e) => setNewsFormData({ ...newsFormData, content: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-700 resize-none custom-scrollbar"></textarea>
                </div>
                <div className="flex items-center gap-3 bg-stone-50/50 p-3 rounded-xl border border-neutralCustom/15">
                  <input type="checkbox" id="is_published" checked={newsFormData.is_published} onChange={(e) => setNewsFormData({ ...newsFormData, is_published: e.target.checked })} className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer" />
                  <div className="flex flex-col cursor-pointer select-none" onClick={() => setNewsFormData({ ...newsFormData, is_published: !newsFormData.is_published })}>
                    <label className="text-sm font-bold text-gray-900 cursor-pointer">Xuất bản bài viết ngay lập tức</label>
                    <span className="text-[11px] text-neutralCustom">Bỏ chọn nếu bạn muốn lưu dưới dạng Bản nháp (Draft) để chỉnh sửa sau</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-neutralCustom/20 bg-stone-50/50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsNewsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-neutralCustom border border-neutralCustom/20 hover:bg-white transition-colors cursor-pointer bg-white">Hủy bỏ</button>
              <button onClick={handleSaveNews} disabled={isSaving} className="px-8 py-2.5 rounded-xl font-black text-sm text-white bg-primary hover:bg-secondary shadow-md hover:shadow-primary/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer min-w-[140px]">
                {isSaving ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> : 'Lưu Tin Tức'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsManagement;