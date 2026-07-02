import React, { useState } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';

// --- MOCK COMPONENTS DÙNG CHO PREVIEW SANDBOX (Bỏ qua khi chạy local) ---
const MOCK_REVIEWS = [
    {
        id: 'rev-1',
        customer_name: 'Nguyễn Minh Quân',
        phone: '0983207432',
        rating: 5,
        dish_name: 'Mì Xá Xíu Quảng Đông',
        comment: 'Đồ ăn cực ngon, mì xá xíu đậm đà chuẩn vị. Nước dùng thanh ngọt húp cạn tô luôn. Phục vụ nhanh nhẹn dù quán đang rất đông. Sẽ quay lại ủng hộ!',
        created_at: '2026-07-02T19:30:00.000Z', // Hôm nay
        is_replied: true,
        reply: 'Dạ, Làng MìXì chân thành cảm ơn đánh giá 5 sao của anh Quân ạ. Rất hân hạnh được tiếp tục phục vụ anh trong các lần ghé quán tiếp theo!'
    },
    {
        id: 'rev-2',
        customer_name: 'Trần Thị Thu Thảo',
        phone: '0901234567',
        rating: 3,
        dish_name: 'Sủi Cảo Tôm Thịt',
        comment: 'Sủi cảo nhân tôm thịt tươi ngon nhưng phần nước dùng hôm nay hơi mặn một chút so với mọi khi. Mong quán chú ý gia giảm gia vị hơn nhé.',
        created_at: '2026-07-02T12:15:00.000Z', // Hôm nay
        is_replied: false,
        reply: ''
    },
    {
        id: 'rev-3',
        customer_name: 'Khách ẩn danh',
        phone: 'Chưa cung cấp SĐT',
        rating: 2,
        dish_name: 'Mì Trộn Xốt Cay',
        comment: 'Mì trộn hơi nhão quá, nước xốt cay thì quá ngọt. Phục vụ hôm nay hơi chậm, gọi món 20 phút mới có mì mang ra bàn.',
        created_at: '2026-07-01T20:45:00.000Z', // Hôm qua
        is_replied: false,
        reply: ''
    },
    {
        id: 'rev-4',
        customer_name: 'Phạm Hoàng Hải',
        phone: '0912456789',
        rating: 5,
        dish_name: 'Hoành Thánh Chiên Giòn',
        comment: 'Hoành thánh chiên siêu giòn, ráo dầu không bị ngấy, chấm xốt xí muội rất cuốn. Không gian quán sạch sẽ, decor mang đậm phong cách Trung Hoa.',
        created_at: '2026-06-25T11:00:00.000Z', // Tuần trước
        is_replied: false,
        reply: ''
    }
];

const MOCK_DISHES_LIST = [
    'Mì Xá Xíu Quảng Đông',
    'Mì Trộn Xốt Cay',
    'Sủi Cảo Tôm Thịt',
    'Hoành Thánh Chiên Giòn',
    'Mì Hoành Thánh Vịt Quay',
    'Bánh Bao Kim Sa'
];

const MOCK_VOUCHERS = [
    { id: 'v-1', code: 'MIXISINHNTHAT', name: 'Voucher mừng sinh nhật tri ân', value: '50.000 đ' },
    { id: 'v-2', code: 'XINLOIKHACH', name: 'Voucher xin lỗi trải nghiệm chưa tốt', value: '10%' },
    { id: 'v-3', code: 'CAMON5SAO', name: 'Voucher tri ân phản hồi 5 sao', value: '20.000 đ' }
];

const App = () => {
    const [currentView, setCurrentView] = useState('admin'); // 'customer' hoặc 'admin'

    // --- STATES CHUNG ---
    const [reviewsList, setReviewsList] = useState(MOCK_REVIEWS);

    // --- STATES KHÁCH HÀNG ---
    const [customerForm, setCustomerForm] = useState({
        name: '',
        phone: '',
        dish_name: MOCK_DISHES_LIST[0],
        rating: 5,
        comment: ''
    });
    const [hoveredStar, setHoveredStar] = useState(0);

    // --- STATES ADMIN ---
    const [filterRating, setFilterRating] = useState('ALL'); // ALL, 5, 4, 3, 2, 1
    const [searchTerm, setSearchTerm] = useState('');

    // States Lọc khoảng thời gian
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // States Modal Phản hồi ý kiến
    const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [replyText, setReplyText] = useState('');

    // States Modal Tặng Voucher
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const [selectedReviewForGift, setSelectedReviewForVoucher] = useState(null);
    const [selectedVoucherId, setSelectedVoucherId] = useState(MOCK_VOUCHERS[0].id);

    // ====================== XỬ LÝ PHÍA KHÁCH HÀNG ĐÁNH GIÁ ======================
    const handleCustomerSubmit = (e) => {
        e.preventDefault();
        if (!customerForm.comment.trim()) {
            return alert("Vui lòng để lại ý kiến đóng góp của bạn về món ăn!");
        }

        const newReview = {
            id: `rev-${Date.now()}`,
            customer_name: customerForm.name.trim() || 'Khách ẩn danh',
            phone: customerForm.phone.trim() || 'Chưa cung cấp SĐT',
            rating: customerForm.rating,
            dish_name: customerForm.dish_name,
            comment: customerForm.comment.trim(),
            created_at: new Date().toISOString(),
            is_replied: false,
            reply: ''
        };

        setReviewsList(prev => [newReview, ...prev]);

        alert("Cảm ơn ý kiến đánh giá quý báu của bạn! Làng MìXì đã nhận được và sẽ gửi voucher quà tặng tri ân qua số điện thoại/Zalo sớm nhất.");

        setCustomerForm({
            name: '',
            phone: '',
            dish_name: MOCK_DISHES_LIST[0],
            rating: 5,
            comment: ''
        });
    };

    // ====================== XỬ LÝ PHÍA ADMIN QUẢN LÝ ======================
    const handleOpenReplyModal = (review) => {
        setSelectedReview(review);
        setReplyText(review.reply || '');
        setIsReplyModalOpen(true);
    };

    const handleSendReply = () => {
        if (!replyText.trim()) {
            return alert('Vui lòng nhập nội dung thư phản hồi góp ý!');
        }

        setReviewsList(prev => prev.map(r => {
            if (r.id === selectedReview.id) {
                return { ...r, is_replied: true, reply: replyText.trim() };
            }
            return r;
        }));

        alert("Gửi phản hồi của nhà hàng thành công!");
        setIsReplyModalOpen(false);
        setSelectedReview(null);
    };

    // 🌟 MỚI: Mở modal tặng Voucher cho khách hàng cụ thể
    const handleOpenGiftModal = (review) => {
        if (review.phone === 'Chưa cung cấp SĐT') {
            return alert("Khách hàng này đánh giá ẩn danh (không cung cấp SĐT), không thể tặng Voucher!");
        }
        setSelectedReviewForVoucher(review);
        setSelectedVoucherId(MOCK_VOUCHERS[0].id);
        setIsGiftModalOpen(true);
    };

    const handleSendVoucher = () => {
        const voucher = MOCK_VOUCHERS.find(v => v.id === selectedVoucherId);
        alert(`Đã tặng thành công mã Voucher "${voucher.code}" (${voucher.name} trị giá ${voucher.value}) gửi trực tiếp đến SĐT ${selectedReviewForGift.phone} của khách hàng ${selectedReviewForGift.customer_name}!`);
        setIsGiftModalOpen(false);
        setSelectedReviewForVoucher(null);
    };

    const handleDeleteReview = (id) => {
        const isConfirm = window.confirm("Bạn có chắc chắn muốn xóa đánh giá này khỏi hệ thống quản trị?");
        if (!isConfirm) return;

        setReviewsList(prev => prev.filter(r => r.id !== id));
        alert("Xóa đánh giá thành công!");
    };

    // --- ACTIONS CHỌN NHANH KHOẢNG THỜI GIAN ---
    const selectToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
    };

    const selectThisWeek = () => {
        const current = new Date();
        const first = current.getDate() - current.getDay() + (current.getDay() === 0 ? -6 : 1); // Thứ 2
        const firstDay = new Date(current.setDate(first)).toISOString().split('T')[0];
        const lastDay = new Date().toISOString().split('T')[0]; // Hôm nay
        setStartDate(firstDay);
        setEndDate(lastDay);
    };

    const selectThisMonth = () => {
        const current = new Date();
        const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
        const firstDayStr = new Date(firstDay.getTime() - firstDay.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        const lastDayStr = new Date().toISOString().split('T')[0]; // Hôm nay
        setStartDate(firstDayStr);
        setEndDate(lastDayStr);
    };

    const clearDateFilter = () => {
        setStartDate('');
        setEndDate('');
    };

    // Render Ngôi sao
    const renderStars = (rating, size = 'text-sm') => {
        return Array.from({ length: 5 }, (_, idx) => (
            <span
                key={idx}
                className={`material-symbols-outlined text-yellow-400 ${size}`}
                style={{ fontVariationSettings: idx < rating ? "'FILL' 1" : "'FILL' 0" }}
            >
                star
            </span>
        ));
    };

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    };

    // Lọc danh sách theo số sao, từ khóa tìm kiếm và khoảng thời gian
    const filteredReviews = reviewsList.filter(r => {
        const matchRating = filterRating === 'ALL' || r.rating === Number(filterRating);
        const matchSearch = r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.dish_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.phone.includes(searchTerm) ||
            r.comment.toLowerCase().includes(searchTerm.toLowerCase());

        let matchDate = true;
        if (startDate || endDate) {
            const reviewDate = new Date(r.created_at);
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (reviewDate < start) matchDate = false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (reviewDate > end) matchDate = false;
            }
        }

        return matchRating && matchSearch && matchDate;
    });

    // Thống kê số liệu nhanh
    const totalReviews = reviewsList.length;
    const averageRating = totalReviews > 0 ? (reviewsList.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : 0.0;
    const pendingReplyCount = reviewsList.filter(r => !r.is_replied).length;
    const criticalCount = reviewsList.filter(r => r.rating <= 3 && !r.is_replied).length;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <AdminSidebar currentTab="review" />
            <AdminHeader />

            {/* 🌟 NÚT CHUYỂN ĐỔI CHẾ ĐỘ XEM TRÊN PREVIEW SANDBOX */}
            <div className="fixed bottom-6 right-6 z-[999] bg-white border-2 border-orange-500 rounded-2xl p-3 shadow-2xl flex flex-col gap-2 max-w-[220px]">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Bảng điều hướng Demo</p>
                <button
                    onClick={() => setCurrentView('customer')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${currentView === 'customer' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                >
                    📱 Giao diện Khách hàng
                </button>
                <button
                    onClick={() => setCurrentView('admin')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${currentView === 'admin' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                >
                    💻 Giao diện Quản lý
                </button>
            </div>

            {/* ========================================================================= */}
            {/* 1. GIAO DIỆN KHÁCH HÀNG ĐÁNH GIÁ (CUSTOMER VIEW - MOBILE-FIRST) */}
            {/* ========================================================================= */}
            {currentView === 'customer' && (
                <div className="flex-1 flex items-center justify-center p-4 bg-orange-50/50">
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-orange-100">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white text-center relative">
                            <div className="absolute top-3 left-4 text-[10px] font-bold tracking-widest bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full uppercase">Làng MìXì</div>
                            <h2 className="text-2xl font-black mt-2">Đánh Giá Món Ăn</h2>
                            <p className="text-xs text-orange-100 mt-1 leading-relaxed">Mỗi ý kiến đóng góp của bạn giúp chúng tôi cải thiện chất lượng dịch vụ ngày một tốt hơn!</p>
                        </div>

                        <form onSubmit={handleCustomerSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Món ăn muốn đánh giá <span className="text-red-500">*</span></label>
                                <select
                                    value={customerForm.dish_name}
                                    onChange={(e) => setCustomerForm({ ...customerForm, dish_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-500 focus:bg-white transition-all font-bold text-gray-900 cursor-pointer"
                                >
                                    {MOCK_DISHES_LIST.map((dish, i) => (
                                        <option key={i} value={dish}>{dish}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="text-center py-2 bg-orange-50/30 rounded-2xl border border-orange-100/50">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Độ hài lòng của bạn</label>
                                <div className="flex justify-center gap-2">
                                    {Array.from({ length: 5 }, (_, i) => {
                                        const ratingValue = i + 1;
                                        return (
                                            <button
                                                type="button"
                                                key={i}
                                                onClick={() => setCustomerForm({ ...customerForm, rating: ratingValue })}
                                                onMouseEnter={() => setHoveredStar(ratingValue)}
                                                onMouseLeave={() => setHoveredStar(0)}
                                                className="text-4xl transition-transform hover:scale-125 focus:outline-none"
                                            >
                                                <span
                                                    className="material-symbols-outlined text-[40px]"
                                                    style={{
                                                        color: ratingValue <= (hoveredStar || customerForm.rating) ? '#facc15' : '#e5e7eb',
                                                        fontVariationSettings: ratingValue <= (hoveredStar || customerForm.rating) ? "'FILL' 1" : "'FILL' 0"
                                                    }}
                                                >
                                                    star
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs font-bold text-orange-500 mt-1">
                                    {customerForm.rating === 5 && 'Rất ngon, vô cùng hài lòng! 😍'}
                                    {customerForm.rating === 4 && 'Ngon miệng, hài lòng! 🙂'}
                                    {customerForm.rating === 3 && 'Bình thường, tạm ổn! 😐'}
                                    {customerForm.rating === 2 && 'Chưa ngon, cần cải thiện! 🙁'}
                                    {customerForm.rating === 1 && 'Rất tệ, không hài lòng! 😡'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Cảm nhận chi tiết <span className="text-red-500">*</span></label>
                                <textarea
                                    rows="4"
                                    placeholder="Hãy chia sẻ cảm nhận của bạn về hương vị món ăn..."
                                    value={customerForm.comment}
                                    onChange={(e) => setCustomerForm({ ...customerForm, comment: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-500 focus:bg-white transition-all font-medium text-gray-900 resize-none"
                                ></textarea>
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-4">
                                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Để lại thông tin nhận Voucher quà tặng</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Họ tên khách</label>
                                        <input
                                            type="text"
                                            placeholder="Không bắt buộc"
                                            value={customerForm.name}
                                            onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                                            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-orange-500 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Số điện thoại</label>
                                        <input
                                            type="text"
                                            placeholder="Nhận mã Zalo"
                                            value={customerForm.phone}
                                            onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                                            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-orange-500 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-xl text-base shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all mt-2 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-xl">send</span>
                                GỬI ĐÁNH GIÁ NGAY
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 2. TRANG QUẢN LÝ ĐÁNH GIÁ DÀNH CHO ADMIN (ADMIN MANAGEMENT VIEW) */}
            {/* ========================================================================= */}
            {currentView === 'admin' && (
                <div className="flex-1 flex">
                    <AdminSidebar currentTab="review" />
                    <AdminHeader />

                    <main className="ml-64 pt-24 p-8 w-full flex flex-col min-h-screen">
                        {/* Header Section */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-1">Ý kiến & Đánh giá Khách hàng</h2>
                            <p className="text-neutralCustom text-sm">Theo dõi toàn bộ đánh giá chất lượng món ăn, phục vụ của thực khách sau khi quét mã QR hóa đơn.</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-5 rounded-2xl border border-neutralCustom/20 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-neutralCustom uppercase tracking-wider mb-0.5">Điểm trung bình</p>
                                    <h4 className="text-2xl font-black text-gray-900">{averageRating} <span className="text-sm font-medium text-neutralCustom">/ 5.0</span></h4>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-neutralCustom/20 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[28px]">forum</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-neutralCustom uppercase tracking-wider mb-0.5">Tổng số lượt góp ý</p>
                                    <h4 className="text-2xl font-black text-gray-900">{totalReviews}</h4>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-neutralCustom/20 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[28px]">chat_bubble_outline</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-neutralCustom uppercase tracking-wider mb-0.5">Chờ phản hồi</p>
                                    <h4 className="text-2xl font-black text-gray-900">{pendingReplyCount}</h4>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-red-100 bg-red-50/20 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[28px]">warning</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-0.5">Tiêu cực cần xử lý</p>
                                    <h4 className="text-2xl font-black text-red-600">{criticalCount}</h4>
                                </div>
                            </div>
                        </div>

                        {/* 🌟 MỚI: BỘ LỌC KHOẢNG THỜI GIAN THÔNG MINH */}
                        <div className="bg-white p-5 rounded-2xl border border-neutralCustom/20 shadow-sm mb-6 flex flex-col gap-4">
                            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="material-symbols-outlined text-orange-500 text-xl">calendar_month</span>
                                    <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Bộ lọc khoảng thời gian:</span>
                                </div>

                                {/* Các nút chọn nhanh */}
                                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                                    <button
                                        onClick={selectToday}
                                        className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                                    >
                                        Hôm nay
                                    </button>
                                    <button
                                        onClick={selectThisWeek}
                                        className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                                    >
                                        Tuần này
                                    </button>
                                    <button
                                        onClick={selectThisMonth}
                                        className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                                    >
                                        Tháng này
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 w-full"></div>

                            {/* Ô lịch tùy chọn */}
                            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                                <div className="flex-1 grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Từ ngày</span>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-gray-50 border border-neutralCustom/20 text-sm rounded-xl px-4 py-2 outline-none focus:border-orange-500 focus:bg-white text-gray-900 font-medium"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Đến ngày</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-gray-50 border border-neutralCustom/20 text-sm rounded-xl px-4 py-2 outline-none focus:border-orange-500 focus:bg-white text-gray-900 font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Nút reset */}
                                <div className="sm:self-end">
                                    <button
                                        onClick={clearDateFilter}
                                        disabled={!startDate && !endDate}
                                        className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-base">restart_alt</span>
                                        Xóa lọc ngày
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filters Panel */}
                        <div className="bg-white p-4 rounded-2xl border border-neutralCustom/20 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full md:max-w-xs">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutralCustom text-xl">search</span>
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên, SĐT, món ăn..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-50 border border-neutralCustom/20 text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-orange-500 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar">
                                {['ALL', '5', '4', '3', '2', '1'].map((stars) => (
                                    <button
                                        key={stars}
                                        onClick={() => setFilterRating(stars)}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1 shrink-0 ${filterRating === stars
                                            ? 'bg-gray-900 text-white border-gray-900'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {stars === 'ALL' ? 'Tất cả' : `${stars} Sao`}
                                        {stars !== 'ALL' && <span className="material-symbols-outlined text-xs text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Reviews Grid Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                            {filteredReviews.length > 0 ? (
                                filteredReviews.map((review) => (
                                    <div key={review.id} className="bg-white rounded-2xl p-6 border border-neutralCustom/20 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-base">{review.customer_name}</h4>
                                                    <p className="text-xs text-neutralCustom mt-0.5 font-semibold flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">call</span> {review.phone}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-mono font-bold">{formatDate(review.created_at)}</span>
                                            </div>

                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="flex gap-0.5">
                                                    {renderStars(review.rating)}
                                                </div>
                                                <span className="bg-orange-50 text-orange-600 border border-orange-100 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                                                    {review.dish_name}
                                                </span>
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-xl text-sm italic text-gray-700 leading-relaxed mb-4 border border-gray-100">
                                                "{review.comment}"
                                            </div>

                                            {/* Hiển thị nội dung phản hồi nếu đã trả lời */}
                                            {review.is_replied && (
                                                <div className="bg-orange-500/5 border-l-4 border-orange-500 p-3 rounded-r-xl text-xs mb-4">
                                                    <p className="font-bold text-orange-500 mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">reply</span> Phản hồi từ nhà hàng:
                                                    </p>
                                                    <p className="text-gray-700 italic">"{review.reply}"</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer Buttons */}
                                        <div className="border-t border-gray-100 pt-3 flex justify-between items-center mt-4 shrink-0">
                                            {/* 🌟 MỚI: NÚT TẶNG VOUCHER */}
                                            <button
                                                onClick={() => handleOpenGiftModal(review)}
                                                className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1
                          ${review.phone === 'Chưa cung cấp SĐT'
                                                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                                        : 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-600'}`}
                                                title={review.phone === 'Chưa cung cấp SĐT' ? "Đánh giá ẩn danh không thể tặng Voucher" : "Tặng Voucher tri ân"}
                                            >
                                                <span className="material-symbols-outlined text-sm">card_giftcard</span>
                                                Tặng Voucher
                                            </button>

                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => handleOpenReplyModal(review)}
                                                    className="px-4 py-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                                >
                                                    <span className="material-symbols-outlined text-sm">reply</span>
                                                    {review.is_replied ? 'Sửa phản hồi' : 'Phản hồi'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteReview(review.id)}
                                                    className="px-3 py-2 text-neutralCustom hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                    title="Xóa đánh giá"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-16 text-center text-gray-400 font-bold italic bg-white rounded-2xl border border-dashed border-neutralCustom/25">
                                    Chưa có ý kiến khách hàng nào phù hợp với bộ lọc...
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL PHẢN HỒI Ý KIẾN KHÁCH HÀNG (DÀNH CHO ADMIN) */}
            {/* ========================================================================= */}
            {isReplyModalOpen && selectedReview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
                        <div className="p-5 border-b border-neutralCustom/20 flex items-center justify-between bg-culinaryBg shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Thư phản hồi góp ý</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Phản hồi của nhà hàng sẽ được cập nhật trực tiếp tại đây.</p>
                            </div>
                            <button
                                onClick={() => setIsReplyModalOpen(false)}
                                className="p-1.5 hover:bg-neutralCustom/10 rounded-full text-neutralCustom transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-4 bg-gray-50 flex-1">
                            <div className="bg-white p-4 rounded-xl border border-gray-150 text-xs shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-gray-900">{selectedReview.customer_name}</span>
                                    <span>{renderStars(selectedReview.rating)}</span>
                                </div>
                                <p className="text-gray-600 italic">"{selectedReview.comment}"</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Nội dung thư trả lời <span className="text-red-500">*</span></label>
                                <textarea
                                    rows="5"
                                    placeholder="Dạ, Làng MìXì chân thành cảm ơn ý kiến đóng góp quý báu của bạn..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-neutralCustom/30 rounded-xl text-xs outline-none focus:border-orange-500 transition-all font-medium text-gray-900 resize-none"
                                ></textarea>
                            </div>
                        </div>

                        <div className="p-5 border-t border-neutralCustom/20 bg-white flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setIsReplyModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl font-bold text-sm text-neutralCustom border border-neutralCustom/20 hover:bg-gray-50 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleSendReply}
                                className="px-8 py-2.5 rounded-xl font-bold text-sm text-white bg-orange-500 hover:bg-orange-600 shadow-md transition-all flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-sm">send</span>
                                Gửi phản hồi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 🌟 MỚI: MODAL TẶNG VOUCHER CHO KHÁCH HÀNG (DÀNH CHO ADMIN) */}
            {/* ========================================================================= */}
            {isGiftModalOpen && selectedReviewForGift && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
                        <div className="p-6 border-b border-neutralCustom/10 bg-orange-50/50 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                                <span className="material-symbols-outlined text-4xl text-orange-500">card_giftcard</span>
                            </div>
                            <h3 className="text-xl font-black text-gray-900">Tặng Voucher Tri Ân</h3>
                            <p className="text-xs text-neutralCustom mt-1">
                                Tặng Voucher tri ân phản hồi đóng góp cho khách: <b className="text-orange-500">{selectedReviewForGift.customer_name}</b>
                            </p>
                        </div>

                        <div className="p-6 space-y-4 bg-white">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Số điện thoại liên hệ</label>
                                <input
                                    type="text"
                                    value={selectedReviewForGift.phone}
                                    disabled
                                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Lựa chọn Voucher <span className="text-red-500">*</span></label>
                                <select
                                    value={selectedVoucherId}
                                    onChange={(e) => setSelectedVoucherId(e.target.value)}
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-bold text-gray-900 cursor-pointer"
                                >
                                    {MOCK_VOUCHERS.map(promo => (
                                        <option key={promo.id} value={promo.id}>
                                            [{promo.code}] {promo.name} - Giảm {promo.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-5 border-t border-neutralCustom/10 bg-gray-50 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => { setIsGiftModalOpen(false); setSelectedReviewForVoucher(null); }}
                                className="px-6 py-2.5 rounded-xl font-bold text-sm text-neutralCustom border border-neutralCustom/20 hover:bg-white transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleSendVoucher}
                                className="px-8 py-2.5 rounded-xl font-bold text-sm text-white bg-orange-500 hover:bg-orange-600 shadow-md transition-all flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-sm">send</span>
                                Xác nhận tặng ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default App;