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

  // Gọi API lấy dữ liệu tin tức & list KM (để gán bài viết)
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

  const handleSaveNews = async () => {
    if (!newsFormData.title || !newsFormData.content) {
      return alert("Vui lòng điền đủ Tiêu đề và Nội dung bài viết!");
    }

    if (!newsFormData.id && !newsFormData.imageFile) {
      return alert("Vui lòng tải lên ảnh bìa cho bài viết mới!");
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
      imageFile: null
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
        setIsNewsDetailOpen(false);
        fetchNews();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi xóa tin tức!");
    }
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

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden relative">
      <AdminSidebar currentTab="news" />
      <AdminHeader />

      <main className="ml-64 pt-24 p-8 w-full flex flex-col min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Tin tức & Sự kiện</h2>
            <p className="text-neutralCustom text-sm">Viết các bài truyền thông, tin tức nội bộ, ra mắt món ăn mới để đồng bộ lên App khách hàng.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleOpenAddNewsModal} className="bg-primary text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-md hover:bg-secondary transition-all active:scale-95 text-sm">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'wght' 700" }}>add</span>
              <span>Viết tin tức mới</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl flex items-center gap-5 border border-neutralCustom/20 shadow-sm">
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
            <div className="text-center py-10 text-neutralCustom">Đang tải danh sách tin tức...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card Thêm bài viết nhanh */}
              <button onClick={handleOpenAddNewsModal} className="rounded-2xl border-2 border-dashed border-neutralCustom/30 flex flex-col items-center justify-center p-6 hover:bg-primary/5 hover:border-primary/40 transition-all group min-h-[260px] bg-gray-50/50">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-3 shadow-sm border border-neutralCustom/10">
                  <span className="material-symbols-outlined text-2xl">add</span>
                </div>
                <p className="font-bold text-neutralCustom group-hover:text-primary transition-colors">Tạo bài viết mới</p>
              </button>

              {/* Danh sách bài viết */}
              {newsList.map((news) => {
                const isDraft = news.is_published === false;
                const statusLabel = isDraft ? 'Bản nháp' : 'Đã đăng';

                return (
                  <div
                    key={news.id}
                    onClick={() => handleViewNewsDetail(news)}
                    className={`bg-white rounded-2xl overflow-hidden border border-neutralCustom/20 shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-pointer group ${isDraft ? 'opacity-90' : ''}`}
                  >
                    <div className="relative h-40 bg-culinaryBg flex items-center justify-center">
                      {news.image_url ? (
                        <img src={news.image_url} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <span className="material-symbols-outlined text-4xl text-neutralCustom/30 group-hover:scale-110 transition-transform">add_photo_alternate</span>
                      )}
                      <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider text-white shadow-sm z-10
                        ${isDraft ? 'bg-neutralCustom' : 'bg-green-500'}
                      `}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <p className="text-xs text-neutralCustom mb-1.5">{formatDate(news.created_at)}</p>
                      <h5 className="font-bold text-gray-900 line-clamp-2 mb-4 text-sm flex-1 group-hover:text-primary transition-colors" title={news.title}>{news.title}</h5>
                      <div className="flex justify-between items-center mt-auto border-t border-neutralCustom/10 pt-3">
                        <span className="text-xs text-neutralCustom font-medium flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">
                            {isDraft ? 'history_edu' : 'visibility'}
                          </span>
                          {isDraft ? 'Đang soạn' : `Đang hiển thị`}
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
      </main>

      {/* MODAL XEM CHI TIẾT TIN TỨC */}
      {isNewsDetailOpen && selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in cursor-pointer" onClick={() => setIsNewsDetailOpen(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up max-h-[90vh] cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="w-full bg-gray-100 flex justify-center items-center relative shrink-0 border-b border-neutralCustom/10">
              {selectedNews.image_url ? (
                <img src={selectedNews.image_url} alt={selectedNews.title} className="max-w-full max-h-80 object-contain" />
              ) : (
                <div className="w-full h-48 flex flex-col items-center justify-center text-neutralCustom/40">
                  <span className="material-symbols-outlined text-4xl mb-2">image</span>
                  <span className="text-sm font-medium">Không có ảnh bìa</span>
                </div>
              )}
              <button onClick={() => setIsNewsDetailOpen(false)} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors shadow-md">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

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

            <div className="p-5 border-t border-neutralCustom/20 bg-gray-50 flex justify-end shrink-0">
              <button onClick={() => setIsNewsDetailOpen(false)} className="px-8 py-2.5 rounded-xl font-bold text-sm text-gray-700 bg-white border border-neutralCustom/30 hover:bg-gray-100 transition-colors shadow-sm">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM THÊM / SỬA TIN TỨC */}
      {isNewsModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up max-h-[90vh]">
            <div className="p-5 border-b border-neutralCustom/20 flex items-center justify-between bg-culinaryBg shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{newsFormData.id ? 'Chỉnh Sửa Tin Tức' : 'Viết Tin Tức Mới'}</h3>
                <p className="text-xs text-neutralCustom mt-1">Cập nhật bài viết truyền thông lên bảng tin khách hàng</p>
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
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Nội dung chi tiết <span className="text-red-500">*</span></label>
                  <textarea rows="6" placeholder="Nhập nội dung chi tiết bài viết tại đây..." value={newsFormData.content} onChange={(e) => setNewsFormData({ ...newsFormData, content: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 resize-none custom-scrollbar"></textarea>
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

export default NewsManagement;