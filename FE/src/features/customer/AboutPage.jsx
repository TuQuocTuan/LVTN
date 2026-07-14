import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AboutPage = () => {
  // --- STATES CHUNG ---
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [news, setNews] = useState([]);
  const [promotions, setPromotions] = useState([]);
  
  const [isLoadingDishes, setIsLoadingDishes] = useState(false);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  // --- STATES TRA CỨU VOUCHER ---
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // --- STATES PHÂN TRANG ---
  const [dishesCurrentPage, setDishesCurrentPage] = useState(1);
  const dishesPerPage = 8;

  const [newsCurrentPage, setNewsCurrentPage] = useState(1);
  const newsPerPage = 4;

  // --- STATES MODAL CHI TIẾT TIN TỨC ---
  const [activeNewsDetail, setActiveNewsDetail] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchFeaturedDishes();
    fetchPublishedNews();
    fetchPromotionsList();
  }, []);

  // Gọi API lấy danh sách món ăn
  const fetchFeaturedDishes = async () => {
    setIsLoadingDishes(true);
    try {
      const response = await axios.get(`${API_URL}/dishes`);
      if (response.data && response.data.success) {
        // Lọc những món ăn đang có trạng thái "available" (đang phục vụ) để giới thiệu
        const availableDishes = (response.data.data || []).filter(dish => dish.status === 'available');
        setDishes(availableDishes);

        // Trích xuất danh sách danh mục (Categories) duy nhất có trong các món ăn khả dụng
        const uniqueCategories = [];
        availableDishes.forEach(dish => {
          const categoryName = dish.categories?.name;
          if (categoryName && !uniqueCategories.includes(categoryName)) {
            uniqueCategories.push(categoryName);
          }
        });
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu món ăn:", error);
    } finally {
      setIsLoadingDishes(false);
    }
  };

  // Gọi API lấy danh sách tin tức đã xuất bản
  const fetchPublishedNews = async () => {
    setIsLoadingNews(true);
    try {
      const response = await axios.get(`${API_URL}/news`);
      if (response.data && response.data.success) {
        // Chỉ lấy các tin tức được đánh dấu đã xuất bản (is_published === true)
        const publishedNews = (response.data.data || []).filter(item => item.is_published === true);
        setNews(publishedNews);
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu bảng tin:", error);
    } finally {
      setIsLoadingNews(false);
    }
  };

  // Gọi API lấy danh sách Khuyến mãi để đồng bộ thông tin Voucher đính kèm tin tức
  const fetchPromotionsList = async () => {
    try {
      const response = await axios.get(`${API_URL}/promotions/list`);
      if (response.data && response.data.success) {
        setPromotions(response.data.promotions || []);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách khuyến mãi:", error);
    }
  };

  const handleVoucherLookup = async (e) => {
    e.preventDefault();
    setLookupError('');
    
    if (!phoneNumber.trim() || !email.trim()) {
      setLookupError("Vui lòng nhập đầy đủ cả Số điện thoại và Email đăng ký!");
      return;
    }

    setIsSearching(true);
    setSearchResult(null);
    setHasSearched(false);

    try {
      const response = await axios.post(`${API_URL}/promotions/customer-voucher`, {
        phone_number: phoneNumber.trim(),
        email: email.trim()
      });

      if (response.data && response.data.success) {
        setSearchResult(response.data.promotion || []);
      } else {
        setSearchResult([]);
      }
    } catch (error) {
      console.error("Lỗi tra cứu voucher:", error);
      if (error.response && error.response.status === 404) {
        setSearchResult([]);
      } else {
        setLookupError("Hệ thống tra cứu voucher đang bận, vui lòng thử lại sau!");
      }
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  // Reset trang món ăn khi đổi danh mục
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setDishesCurrentPage(1);
  };

  // Lọc món ăn hiển thị theo danh mục được chọn
  const displayedDishes = activeCategory === 'ALL' 
    ? dishes 
    : dishes.filter(dish => dish.categories?.name === activeCategory);

  // Phân trang Món ăn
  const totalDishesPages = Math.ceil(displayedDishes.length / dishesPerPage);
  const indexOfLastDish = dishesCurrentPage * dishesPerPage;
  const indexOfFirstDish = indexOfLastDish - dishesPerPage;
  const currentDishesList = displayedDishes.slice(indexOfFirstDish, indexOfLastDish);

  // Phân trang Tin tức
  const totalNewsPages = Math.ceil(news.length / newsPerPage);
  const indexOfLastNews = newsCurrentPage * newsPerPage;
  const indexOfFirstNews = indexOfLastNews - newsPerPage;
  const currentNewsList = news.slice(indexOfFirstNews, indexOfLastNews);

  return (
    <div className="bg-stone-50 text-gray-800 font-sans min-h-screen selection:bg-orange-600 selection:text-white">
      
      {/* BANNER HERO COVER (PHONG CÁCH QUÁN NƯỚNG BBQ CHUYÊN NGHIỆP) */}
      <section className="relative h-[480px] bg-stone-900 flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1544025162-d76694265947?w=1600&h=800&fit=crop" 
            alt="Làng MÌXI BBQ Background" 
            className="w-full h-full object-cover scale-105 filter blur-[0.5px]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/65 to-transparent z-10"></div>
        
        <div className="relative z-20 px-4 max-w-2xl mx-auto">
          <span className="text-orange-500 font-black tracking-widest text-xs uppercase bg-orange-600/10 px-3.5 py-1.5 rounded-full border border-orange-500/25">Nướng ngon tròn vị</span>
          <h1 className="text-4xl sm:text-5xl font-black text-white mt-4 tracking-tight leading-tight">
            LÀNG <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">MÌXI BBQ</span>
          </h1>
          <p className="text-orange-100/90 mt-4 text-xs sm:text-sm font-medium leading-relaxed">
            Tinh túy ẩm thực nướng than hoa thượng hạng. Lựa chọn kỹ lưỡng từng miếng thịt vân mỡ đều tăm tắp, hòa quyện xốt ướp đậm đà độc quyền mang tới bữa tiệc nướng ngon đúng điệu.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <a href="#menu" className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-orange-600/25 active:scale-95">Khám phá Thực đơn</a>
            <a href="#lookup" className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition-all border border-white/20 active:scale-95">Tra cứu ưu đãi của bạn</a>
          </div>
        </div>
      </section>

      {/* CÂU CHUYỆN THƯƠNG HIỆU */}
      <section className="py-24 px-4 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-stone-200">
          <img 
            src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=450&fit=crop" 
            alt="Premium BBQ Grilling" 
            className="w-full h-[340px] object-cover hover:scale-102 transition-transform duration-500"
          />
          <div className="absolute bottom-4 left-4 bg-stone-950/70 backdrop-blur-sm text-white text-[10px] px-3.5 py-2 rounded-lg font-bold">
            Bếp rực lửa hồng - Tiệc nướng thăng hoa
          </div>
        </div>

        <div>
          <span className="text-orange-500 font-bold text-xs uppercase tracking-widest">Nghệ thuật nướng than hoa</span>
          <h2 className="text-3xl font-black text-stone-900 mt-2 tracking-tight">Vị Khói Độc Đáo</h2>
          <p className="text-stone-600 mt-4 text-xs sm:text-sm leading-relaxed">
            Tại Làng MÌXI BBQ, bếp than hoa được ví như trái tim của nhà hàng. Những mồi than đượm nồng mang nhiệt lượng tỏa đều, khóa chặt dòng nước ngọt tự nhiên bên trong miếng thịt nướng ráo cạnh bên ngoài, phảng phất hương khói dịu nhẹ mà không một loại bếp gas hay lò điện nào tái hiện được.
          </p>
          <p className="text-stone-600 mt-3 text-xs sm:text-sm leading-relaxed">
            Thịt bò, sườn heo hay hải sản tại quán đều trải qua quy trình tẩm ướp tối thiểu 6 tiếng với 18 loại hương liệu thảo mộc truyền thống, bảo đảm đậm đà ngấm sâu vào từng thớ thịt thịt nướng vàng óng ả.
          </p>
        </div>
      </section>

      {/* ĐẶC SẮC THỰC ĐƠN (PHÂN TRANG & TAB DỰA TRÊN API THẬT) */}
      <section id="menu" className="bg-white py-24 border-y border-stone-200/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-orange-500 font-bold text-xs uppercase tracking-widest">Tuyệt tác từ nhà bếp</span>
            <h2 className="text-3xl sm:text-4xl font-black text-stone-900 mt-1 tracking-tight font-sans">Menu Nướng BBQ Đặc Sắc</h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-3">Khám phá các cực phẩm bò nướng, heo nướng và hải sản tươi rói đẫm xốt được tẩm ướp tinh tế.</p>
          </div>

          {/* TAB CATEGORIES LOAD ĐỘNG TỪ DB */}
          {categories.length > 0 && (
            <div className="flex justify-center flex-wrap gap-2.5 mb-10">
              <button 
                onClick={() => handleCategoryChange('ALL')}
                className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wider transition-all duration-300 ${
                  activeCategory === 'ALL' 
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' 
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                Tất cả
              </button>
              {categories.map((cat, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wider transition-all duration-300 ${
                    activeCategory === cat 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {isLoadingDishes ? (
            <div className="text-center py-20 text-stone-400 font-bold italic flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Đang tải thực đơn BBQ từ nhà bếp...</span>
            </div>
          ) : currentDishesList.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentDishesList.map((dish) => (
                  <div key={dish.id} className="bg-stone-50/40 border border-stone-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div className="h-44 w-full overflow-hidden bg-stone-100 relative">
                      <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                      <span className="absolute top-3 left-3 bg-stone-900/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded shadow-sm">
                        {dish.categories?.name || 'Món chính'}
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-1.5 mb-1.5">
                          <h4 className="font-bold text-stone-950 text-xs sm:text-sm line-clamp-1">{dish.name}</h4>
                          <span className="text-orange-600 font-black text-xs sm:text-sm whitespace-nowrap">{Number(dish.price).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <p className="text-stone-500 text-[11px] leading-relaxed line-clamp-2">{dish.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Phân trang Thực đơn */}
              {totalDishesPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button 
                    onClick={() => setDishesCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={dishesCurrentPage === 1}
                    className="p-2 border border-stone-200 rounded-xl hover:bg-stone-100 text-stone-600 disabled:opacity-40 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  {Array.from({ length: totalDishesPages }, (_, i) => i + 1).map((page) => (
                    <button 
                      key={page}
                      onClick={() => setDishesCurrentPage(page)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                        dishesCurrentPage === page 
                          ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25' 
                          : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button 
                    onClick={() => setDishesCurrentPage(prev => Math.min(prev + 1, totalDishesPages))}
                    disabled={dishesCurrentPage === totalDishesPages}
                    className="p-2 border border-stone-200 rounded-xl hover:bg-stone-100 text-stone-600 disabled:opacity-40 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-stone-400 font-medium">Hiện thực đơn đang được cập nhật thêm, vui lòng quay lại sau!</div>
          )}
        </div>
      </section>

      {/* BẢNG TIN & SỰ KIỆN */}
      <section className="py-24 max-w-5xl mx-auto px-4">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-orange-500 font-bold text-xs uppercase tracking-widest">Tin tức & Sự kiện Làng MÌXI</span>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900 mt-1 tracking-tight">Sự Kiện Đồng Hành</h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-3 leading-relaxed">
            Cập nhật thường xuyên các chương trình ưu đãi, ngày hội ẩm thực và đặc quyền tặng kèm voucher đặc biệt.
          </p>
        </div>

        {isLoadingNews ? (
          <div className="text-center py-20 text-stone-400 font-bold italic flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Đang lấy tin tức sự kiện...</span>
          </div>
        ) : currentNewsList.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentNewsList.map((item) => {
                // Đối chiếu tìm Voucher đính kèm bài viết nếu có
                const attachedPromo = promotions.find(p => p.id === item.promotion_id);

                return (
                  <div 
                    key={item.id} 
                    className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-sm flex flex-col hover:shadow-md transition-all group cursor-pointer"
                    onClick={() => { setActiveNewsDetail(item); }}
                  >
                    <div className="h-48 bg-stone-100 relative overflow-hidden">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 font-mono uppercase tracking-wider">
                          {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </span>
                        <h4 className="font-bold text-stone-900 text-sm sm:text-base mt-2 leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors" title={item.title}>
                          {item.title}
                        </h4>
                        <p className="text-stone-500 text-xs mt-2.5 line-clamp-3 leading-relaxed mb-4 font-normal">
                          {item.content}
                        </p>

                        {/* HIỂN THỊ VOUCHER ĐÍNH KÈM DẠNG TĨNH (STATIC DISPLAY) */}
                        {attachedPromo && (
                          <div className="bg-orange-50 border border-orange-100/70 p-3 rounded-2xl flex items-center gap-2.5 mb-4 relative overflow-hidden">
                            <span className="material-symbols-outlined text-orange-500 text-lg">local_offer</span>
                            <div className="flex-1">
                              <span className="text-[9px] font-black text-orange-500 uppercase tracking-wider block">Ưu đãi tặng kèm tin tức</span>
                              <span className="text-xs font-bold text-stone-700">
                                {attachedPromo.name} (Mã: <span className="font-mono text-orange-600 font-black">{attachedPromo.code}</span>)
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveNewsDetail(item); }}
                        className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-1 self-start mt-2"
                      >
                        Đọc bài viết chi tiết 
                        <span className="material-symbols-outlined text-[16px] mt-0.5">chevron_right</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Phân trang Tin tức */}
            {totalNewsPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button 
                  onClick={() => setNewsCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={newsCurrentPage === 1}
                  className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 text-stone-600 disabled:opacity-40 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                {Array.from({ length: totalNewsPages }, (_, i) => i + 1).map((page) => (
                  <button 
                    key={page}
                    onClick={() => setNewsCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                      newsCurrentPage === page 
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25' 
                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={() => setNewsCurrentPage(prev => Math.min(prev + 1, totalNewsPages))}
                  disabled={newsCurrentPage === totalNewsPages}
                  className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 text-stone-600 disabled:opacity-40 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-stone-400 font-medium">Hiện không có chương trình ưu đãi nào đang diễn ra. Hẹn gặp lại bạn sớm!</div>
        )}
      </section>

      {/* CỔNG TRA CỨU VOUCHER THÔNG MINH */}
      <section id="lookup" className="bg-gradient-to-b from-white to-stone-50/50 py-24 border-t border-stone-200/60">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-stone-200/70 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/5 rounded-full translate-x-1/3 -translate-y-1/3"></div>
            
            <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-200/50">
              <span className="material-symbols-outlined text-[32px]">card_giftcard</span>
            </div>
            
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 mb-1">Cổng Tra Cứu Ưu Đãi</h3>
            <p className="text-xs text-stone-500 leading-relaxed mb-6">
              Vui lòng nhập chính xác Số điện thoại và Email đăng ký lúc đặt bàn để rà soát hòm thư voucher tri ân của bạn tại Làng MÌXI BBQ.
            </p>

            <form onSubmit={handleVoucherLookup} className="space-y-3 max-w-md mx-auto mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input 
                  type="tel" 
                  placeholder="Số điện thoại đăng ký" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 hover:border-orange-500/50 focus:bg-white rounded-xl text-xs font-bold text-stone-900 outline-none focus:border-orange-500 transition-all"
                />
                <input 
                  type="email" 
                  placeholder="Địa chỉ Email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 hover:border-orange-500/50 focus:bg-white rounded-xl text-xs font-bold text-stone-900 outline-none focus:border-orange-500 transition-all"
                />
              </div>
              <button 
                type="submit"
                disabled={isSearching}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Đang tra cứu hệ thống...
                  </>
                ) : (
                  'Tra cứu voucher ngay'
                )}
              </button>
            </form>

            {lookupError && (
              <p className="text-xs text-red-500 font-bold mb-3">{lookupError}</p>
            )}

            {/* --- KẾT QUẢ TRA CỨU VOUCHER --- */}
            {hasSearched && (
              <div className="mt-8 border-t border-dashed border-stone-200 pt-6 animate-fade-in text-left">
                {searchResult && searchResult.length > 0 ? (
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">task_alt</span>
                      Đã tìm thấy ưu đãi của bạn:
                    </h5>
                    
                    {searchResult.map((voucher, index) => {
                      const isUsed = voucher.is_used;
                      return (
                        <div 
                          key={index} 
                          className={`p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden border transition-all ${
                            isUsed 
                              ? 'bg-stone-100/60 border-stone-200 opacity-70' 
                              : 'bg-orange-50/40 border-orange-100 shadow-sm hover:shadow-md'
                          }`}
                        >
                          <div className={`absolute top-0 right-0 font-mono font-bold text-[9px] px-2.5 py-0.5 rounded-bl uppercase ${
                            isUsed ? 'bg-stone-400 text-white' : 'bg-orange-600 text-white'
                          }`}>
                            {voucher.code}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                isUsed ? 'bg-stone-200 text-stone-600' : 'bg-green-100 text-green-700'
                              }`}>
                                {isUsed ? 'Đã dùng' : 'Khả dụng'}
                              </span>
                              <p className={`font-black text-xs sm:text-sm pr-20 ${isUsed ? 'text-stone-500 line-through' : 'text-stone-900'}`}>
                                {voucher.name}
                              </p>
                            </div>
                            <p className="text-[11px] text-stone-550 mt-1 leading-relaxed">
                              {isUsed 
                                ? 'Ưu đãi này đã được áp dụng cho hóa đơn thanh toán trước đó.' 
                                : 'Ưu đãi áp dụng nướng lẩu thả ga cho hóa đơn dùng bữa tại quầy. Xuất trình mã này cho thu ngân khi thanh toán.'
                              }
                            </p>
                          </div>
                          <div className={`flex justify-between items-center mt-3 border-t pt-2.5 ${isUsed ? 'border-stone-200' : 'border-orange-100/50'}`}>
                            <span className="text-[10px] text-stone-500 font-medium">Hạn sử dụng: <strong className="text-stone-700">Theo chương trình</strong></span>
                            <span className={`text-xs sm:text-sm font-black ${isUsed ? 'text-stone-400 line-through' : 'text-orange-600'}`}>
                              Giảm -{Number(voucher.discount_value).toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-center">
                    <span className="material-symbols-outlined text-stone-400 text-3xl mb-1.5">sentiment_dissatisfied</span>
                    <p className="text-xs font-bold text-stone-600">SĐT hoặc Email này hiện chưa có Voucher khả dụng!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* DETAILED NEWS POP-UP MODAL */}
      {activeNewsDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in" onClick={() => setActiveNewsDetail(null)}>
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-up max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="w-full bg-stone-100 flex justify-center items-center relative shrink-0 border-b border-stone-200/30">
              {activeNewsDetail.image_url ? (
                <img 
                  src={activeNewsDetail.image_url} 
                  alt={activeNewsDetail.title} 
                  className="w-full h-64 object-cover" 
                />
              ) : (
                <div className="w-full h-48 flex flex-col items-center justify-center text-stone-400">
                  <span className="material-symbols-outlined text-4xl mb-2">image</span>
                  <span className="text-sm font-medium">Không có ảnh bìa</span>
                </div>
              )}
              <button 
                onClick={() => { setActiveNewsDetail(null); }} 
                className="absolute top-4 right-4 p-2 bg-stone-900/60 hover:bg-stone-900/80 backdrop-blur-md rounded-full text-white transition-all shadow-md"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-white flex-1 custom-scrollbar">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium text-stone-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  {new Date(activeNewsDetail.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 mb-4 leading-snug">
                {activeNewsDetail.title}
              </h3>
              <div className="h-px bg-stone-100 w-full mb-5"></div>

              {/* KHU VỰC VOUCHER ĐÍNH KÈM TĨNH BÊN TRONG POP-UP (NO COPY BUTTON) */}
              {(() => {
                const attachedPromo = promotions.find(p => p.id === activeNewsDetail.promotion_id);
                if (!attachedPromo) return null;
                return (
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                      <span className="material-symbols-outlined">local_offer</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider block">Khuyến mãi tặng kèm tin tức</span>
                      <span className="text-sm font-bold text-stone-850 block">{attachedPromo.name}</span>
                      <span className="text-xs text-stone-500 block mt-0.5">
                        Mã ưu đãi: <strong className="text-orange-600 font-mono bg-orange-100/50 px-1.5 py-0.5 rounded">{attachedPromo.code}</strong> • Ưu đãi giảm: -{Number(attachedPromo.discount_value).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                );
              })()}

              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">
                {activeNewsDetail.content}
              </p>
            </div>

            <div className="p-4 border-t border-stone-200/50 bg-stone-50 flex justify-end shrink-0">
              <button 
                onClick={() => { setActiveNewsDetail(null); }} 
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 transition-colors shadow-sm"
              >
                Đóng bài viết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-stone-950 text-stone-400 text-xs sm:text-sm py-16 border-t border-stone-800">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          <div>
            <h4 className="text-xl font-black text-white tracking-tight uppercase mb-4">
              LÀNG <span className="text-orange-500">MÌXI BBQ</span>
            </h4>
            <p className="text-xs text-stone-400/90 leading-relaxed max-w-sm">
              Trải nghiệm nướng than hoa thượng hạng hàng đầu. Điểm dừng chân lý tưởng để tận hưởng nghệ thuật nướng khói đậm đà ấm áp.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-white text-xs uppercase tracking-widest mb-4">Thời gian mở cửa</h5>
            <p className="text-xs text-stone-400/80 leading-relaxed">
              Thứ Hai - Chủ Nhật: 09:30 - 22:30 <br/>
              *Thời gian nhận order nướng lẩu cuối cùng lúc 22:15 hàng ngày.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-white text-xs uppercase tracking-widest mb-4">Địa chỉ liên hệ</h5>
            <p className="text-xs text-stone-400/80 leading-relaxed">
              180 Cao Lỗ, Thành phố Hồ Chí Minh, Việt Nam.<br/>
              Hotline hỗ trợ: <strong className="text-orange-500 font-bold">1900 6868</strong>
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-12 pt-8 border-t border-stone-800/80 text-center text-xs text-stone-500">
          <p>© 2026 Làng MÌXI BBQ. Gìn giữ trọn vẹn tinh túy nghệ thuật ẩm thực nướng.</p>
        </div>
      </footer>

    </div>
  );
};

export default AboutPage;