import React, { createContext, useContext, useEffect } from 'react';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

const resources = {
    VI: {
        translation: {
            // --- Trang chào mừng (WelcomePage) ---
            welcome: 'Xin chào',
            subtitle: 'Chào mừng quý khách đến với',
            brandName: 'Làng MÌXI BBQ',
            seating: 'VỊ TRÍ CHỖ NGỒI',
            tableNo: 'Bàn số',
            errorServer: 'Không thể kết nối đến máy chủ nhà bếp!',
            loadingMenu: 'Đang mở thực đơn...',
            startOrdering: 'Bắt đầu gọi món',
            langLabel: 'TIẾNG VIỆT',

            // --- Khung Layout chung (CustomerLayout) ---
            connected: 'Đã kết nối',
            table: 'Bàn',
            menu: 'Thực đơn',
            orders: 'Đơn hàng',
            payment: 'Thanh toán',

            // --- Trang thực đơn & Thẻ món ăn (MenuPage / MenuItemCard) ---
            titleMenu: 'Thực Đơn Nướng BBQ',
            subTitleMenu: 'Nướng than hoa thơm ngon, trọn vị',
            loadingMenuPage: 'Đang tải thực đơn BBQ...',
            all: 'Tất cả',
            emptyMenu: 'Danh mục này hiện tại chưa có món ăn khả dụng!',
            outOfStock: 'Hết hàng',
            orderBtn: 'Đặt món',
            paused: 'Tạm ngưng',

            // --- Trang giỏ hàng (CartPage & CartItem) ---
            cartTitle: 'Giỏ hàng của bạn',
            subTotal: 'Tạm tính',
            vatLabel: 'Thuế VAT (10%)',
            total: 'Tổng thanh toán',
            emptyCart: 'Giỏ hàng của bạn đang trống!',
            btnOrder: 'Gửi yêu cầu nấu', // Nút gửi lệnh đặt món xuống bếp
            notePlaceholder: 'Thêm ghi chú nướng chín kỹ, cay nhiều...',
            checkoutSuccess: 'Đã gửi order thành công đến bếp nướng!',

            // Popup xử lý thiếu hụt kho nguyên liệu
            adjustStockTitle: 'Kho không đủ món',
            adjustStockDesc: 'Xin lỗi quý khách, hiện tại nhà bếp không có đủ nguyên liệu để chuẩn bị một số món ăn:',
            adjustStockConfirm: 'Bạn có muốn tự động điều chỉnh giỏ hàng về số lượng tối đa có thể phục vụ không?',
            btnCancel: 'Hủy bỏ',
            btnAccept: 'Đồng ý giảm',

            // --- Trang theo dõi tiến độ bếp (OrdersPage) ---
            orderHistoryTitle: 'Đơn hàng của bạn',
            orderHistorySub: 'Theo dõi tiến độ các món đã đặt',
            loadingOrders: 'Đang tải đơn hàng...',
            emptyOrders: 'Bạn chưa có đơn hàng nào',
            statusPending: 'Đang chế biến',
            statusCompleted: 'Đã xuất món',
            statusCancelled: 'Món bị hủy',
            orderNo: 'Đơn',
            noteLabel: 'Ghi chú',

            // --- Trang hóa đơn & Gọi thanh toán (PaymentPage) ---
            previewBillTitle: 'Hóa đơn tạm tính',
            previewBillSub: 'Cảm ơn bạn đã tin tưởng dùng bữa!',
            seatingPosition: 'Vị trí',
            paymentStatus: 'Trạng thái',
            statusWaiting: 'Đang chờ thu ngân...',
            statusServing: 'Đang phục vụ',
            dishDetails: 'Chi tiết món ăn',
            perDish: 'món',
            discountLabel: 'Khuyến mãi',
            vatRateLabel: 'Thuế VAT (10%)',
            finalAmount: 'Tổng cộng',
            btnRequestPayment: 'Yêu cầu thanh toán',
            btnRequested: 'Đã báo thu ngân', // Khi khách đã gửi tín hiệu gọi thanh toán
            confirmPaymentTitle: 'Xác nhận thanh toán?',
            confirmPaymentDesc: 'Nhân viên sẽ mang hóa đơn đến bàn và hỗ trợ bạn thanh toán.',
            btnYes: 'Xác nhận',
            btnNo: 'Hủy',
            footerThankYou: 'Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi!',

            // --- Gọi phục vụ (CallService) ---
            callServiceTitle: 'Gọi phục vụ?',
            callServiceDesc: 'Nhân viên sẽ đến bàn của bạn ngay lập tức.',
            staffComingAlert: 'Nhân viên đang đến hỗ trợ!',
            callingStatus: 'Đang gửi...',
            callStaffMessage: 'Khách cần hỗ trợ'
        }
    },

    // -----------------------------------------------------------------------
    // 🇺🇸 BỘ PHÂN DỊCH TIẾNG ANH (EN)
    // -----------------------------------------------------------------------
    EN: {
        translation: {
            // --- WelcomePage ---
            welcome: 'Welcome',
            subtitle: 'Welcome to',
            brandName: 'MÌXI BBQ Village',
            seating: 'SEATING POSITION',
            tableNo: 'Table No.',
            errorServer: 'Cannot connect to the kitchen server!',
            loadingMenu: 'Opening menu...',
            startOrdering: 'Start Ordering',
            langLabel: 'ENGLISH',

            // --- CustomerLayout ---
            connected: 'Connected',
            table: 'Table',
            menu: 'Menu',
            orders: 'Orders',
            payment: 'Payment',

            // --- MenuPage / MenuItemCard ---
            titleMenu: 'BBQ Grilling Menu',
            subTitleMenu: 'Fragrant and rich charcoal grilled flavors',
            loadingMenuPage: 'Loading BBQ menu...',
            all: 'All',
            emptyMenu: 'No available dishes in this category!',
            outOfStock: 'Out of stock',
            orderBtn: 'Add to Order',
            paused: 'Paused',

            // --- CartPage ---
            cartTitle: 'Your Cart',
            subTotal: 'Subtotal',
            vatLabel: 'VAT (10%)',
            total: 'Total Amount',
            emptyCart: 'Your cart is empty!',
            btnOrder: 'Place Order Now',
            notePlaceholder: 'Add notes like: well done, extra spicy...',
            checkoutSuccess: 'Order placed successfully! The kitchen is preparing your dishes.',
            adjustStockTitle: 'Out of Stock',
            adjustStockDesc: 'Sorry, the kitchen does not have enough ingredients for some dishes:',
            adjustStockConfirm: 'Would you like the system to automatically adjust your cart to the maximum available quantity?',
            btnCancel: 'Cancel',
            btnAccept: 'Agree to reduce',

            // --- OrdersPage ---
            orderHistoryTitle: 'Your Orders',
            orderHistorySub: 'Track the progress of your ordered dishes',
            loadingOrders: 'Loading orders...',
            emptyOrders: 'You have no orders yet',
            statusPending: 'Preparing',
            statusCompleted: 'Served',
            statusCancelled: 'Cancelled',
            orderNo: 'Order',
            noteLabel: 'Note',

            // --- PaymentPage ---
            previewBillTitle: 'Temporary Bill',
            previewBillSub: 'Thank you for dining with us!',
            seatingPosition: 'Table',
            paymentStatus: 'Status',
            statusWaiting: 'Waiting for Cashier...',
            statusServing: 'Serving',
            dishDetails: 'Dish Details',
            perDish: 'dish',
            discountLabel: 'Discount',
            vatRateLabel: 'VAT (10%)',
            finalAmount: 'Total Amount',
            btnRequestPayment: 'Request Payment',
            btnRequested: 'Notified Cashier',
            confirmPaymentTitle: 'Confirm Payment?',
            confirmPaymentDesc: 'Staff will bring the invoice to your table and assist you with payment.',
            btnYes: 'Confirm',
            btnNo: 'Cancel',
            footerThankYou: 'Thank you for choosing our restaurant!',

            // --- CallService ---
            callServiceTitle: 'Call Staff?',
            callServiceDesc: 'Staff will come to your table immediately.',
            staffComingAlert: 'Staff is on the way to help!',
            callingStatus: 'Sending...',
            callStaffMessage: 'Customer needs assistance'
        }
    }
};

// Cấu hình khởi tạo thư viện i18next kết nối với React
i18n
    .use(initReactI18next) // Gắn mô-đun i18n vào hệ sinh thái React
    .init({
        resources, // Nạp bảng từ điển Việt - Anh đã khai báo ở trên
        // Ưu tiên lấy ngôn ngữ đã lưu trong bộ nhớ máy khách (localStorage)
        // Nếu chưa từng lưu (lần đầu quét mã), mặc định chọn Tiếng Việt 'VI'
        lng: localStorage.getItem('app_lang') || 'VI',
        fallbackLng: 'VI', // Ngôn ngữ dự phòng khi gặp lỗi
        interpolation: {
            escapeValue: false // React đã tự động chống mã độc XSS nên thiết lập false
        }
    });

// Tạo một Context trung tâm để các Component dễ dàng gọi nhanh trạng thái ngôn ngữ
const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const { t, i18n: i18nInstance } = useTranslation();

    // Hàm chuyển đổi qua lại nhanh giữa Tiếng Việt và Tiếng Anh
    const toggleLanguage = () => {
        const nextLang = i18nInstance.language === 'VI' ? 'EN' : 'VI';
        i18nInstance.changeLanguage(nextLang);
        localStorage.setItem('app_lang', nextLang); // Lưu lại cấu hình cho các trang sau đọc
    };

    // Hàm chuyển đổi sang một ngôn ngữ cụ thể (Ví dụ: 'VI' hoặc 'EN')
    const changeLanguage = (langCode) => {
        const formattedCode = langCode.toUpperCase();
        i18nInstance.changeLanguage(formattedCode);
        localStorage.setItem('app_lang', formattedCode);
    };

    return (
        <LanguageContext.Provider value={{ lang: i18nInstance.language, toggleLanguage, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

// Custom Hook tiện ích để lấy nhanh hàm dịch t() và ngôn ngữ hiện tại ở các file UI
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage phải được đặt bên trong cấu trúc của LanguageProvider!');
    }
    return context;
};