import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerLayout from '../../components/layout/Customer/CustomerLayout';
import CartItem from '../../components/layout/Customer/CartItem';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';

const CartPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Bốc toàn bộ dữ liệu giỏ hàng sống từ kho chung ra dùng
  const {
    cartItems,
    totalItems,
    handleIncrease,
    handleDecrease,
    handleRemove,
    handleNoteChange,
    clearCart,
    handleSetQuantity
  } = useCart();

  // QUẢN LÝ TIẾN TRÌNH & POPUP
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [isStockModalOpen, setIsStockModalOpen] = useState(false); // Đóng/mở Popup thiếu kho
  const [outOfStockItems, setOutOfStockItems] = useState([]); // Chứa danh sách các món bị quá tải kho

  // Hộp thoại Alert tùy biến
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    icon: 'info', // 'info', 'warning', 'error'
    onConfirm: null
  });

  const showAlert = (message, title = 'Thông báo', icon = 'info', onConfirm = null) => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      icon,
      onConfirm
    });
  };

  const handleCloseAlertModal = () => {
    if (alertModal.onConfirm) {
      alertModal.onConfirm();
    }
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  };

  // Tính tiền tự động thời gian thực dựa trên các món có trong giỏ
  const subTotal = cartItems.reduce((total, item) => total + (item.rawPrice * item.quantity), 0);
  const vat = subTotal * 0.1;
  const finalTotal = subTotal + vat;

  // Gọi API lưu Order vào database của nhà hàng
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    try {
      setSubmitStatus('loading');
      const sessionId = localStorage.getItem('sessionId');
      const tableId = localStorage.getItem('tableId');
      const creatorId = localStorage.getItem('creatorId');

      if (!sessionId || !tableId) {
        showAlert(
          "Không tìm thấy phiên ăn hoặc mã bàn. Vui lòng quét lại mã QR!",
          "Lỗi hệ thống",
          "error"
        );
        setSubmitStatus('idle');
        return;
      }

      // Khớp cấu trúc mảng mà orderController backend yêu cầu (dish_id, quantity, price)
      const itemsToOrder = cartItems.map(item => ({
        dish_id: item.id,
        quantity: item.quantity,
        price: item.rawPrice,
        note: item.note || null
      }));

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/orders`, {
        session_id: sessionId,
        table_id: tableId,
        customer_id: creatorId,
        items: itemsToOrder
      });

      const data = response.data;

      if (data.success) {
        setSubmitStatus('success');
        setTimeout(() => {
          clearCart(); // Đặt món xong thì dọn sạch giỏ hàng trống trải
          setSubmitStatus('idle');
          navigate('/orders'); // Chuyển hướng qua trang xem tạm tính hóa đơn
        }, 1500);
      }
    } catch (error) {
      if (error.response && error.response.status === 403 && error.response.data.is_expired_session) {
        showAlert(
          'Lượt ăn cũ của bạn đã kết thúc hoặc bàn đã chuyển sang phiên mới! Vui lòng quét lại mã QR.',
          'Thông báo',
          'warning',
          () => {
            // Dọn sạch dữ liệu phiên cũ đang bị kẹt
            localStorage.removeItem('sessionId');
            clearCart();
            navigate('/'); // Đá khách ra màn hình quét mã/chọn bàn
          }
        );
        setSubmitStatus('idle');
        return;
      }

      // KHO KHÔNG ĐỦ SỐ LƯỢNG
      if (error.response && error.response.data && error.response.data.code === 'INSUFFICIENT_STOCK') {
        // Nạp mảng danh sách lỗi vào state
        setOutOfStockItems(error.response.data.danhsachDatLo);  
        // Mở Bung chiếc Popup Modal tùy biến lên thay vì dùng alert/confirm rác
        setIsStockModalOpen(true);
      } else {
        console.error("Lỗi hệ thống:", error);
        showAlert(
          error.response?.data?.message || "Không thể kết nối đến máy chủ nhà bếp!",
          "Lỗi hệ thống",
          "error"
        );
      }
      setSubmitStatus('idle');
    }
  };

  // HÀM XỬ LÝ KHI KHÁCH ĐỒNG Ý CẬP NHẬT LẠI SỐ LƯỢNG TỐI ĐA TRÊN POPUP
  const handleAcceptAdjustStock = () => {
    outOfStockItems.forEach(loi => {
      handleSetQuantity(loi.dish_id, loi.maxAvailable);
    });
    setIsStockModalOpen(false); // Đóng popup
  };

  return (
    <CustomerLayout>
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t('cartTitle')}</h2>
        <span className="text-xs font-bold text-neutralCustom bg-white border border-neutralCustom/20 px-3 py-1 rounded-full shadow-sm">
          {totalItems} Món
        </span>
      </div>

      <div className="px-4 pb-48">
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              onRemove={handleRemove}
              onNoteChange={handleNoteChange}
            />
          ))
        ) : (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-6xl text-neutralCustom/50 mb-2">production_quantity_limits</span>
            <p className="text-neutralCustom font-semibold">{t('emptyCart')}</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-0 w-full bg-white/90 backdrop-blur-md px-4 pt-6 pb-4 border-t border-neutralCustom/20 z-40 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-neutralCustom"><span>{t('subTotal')}</span><span>{subTotal.toLocaleString('vi-VN')}đ</span></div>
          <div className="flex justify-between text-sm text-neutralCustom"><span>{t('vatLabel')}</span><span>{vat.toLocaleString('vi-VN')}đ</span></div>
          <div className="flex justify-between items-center pt-2 border-t border-neutralCustom/20">
            <span className="text-lg font-bold text-gray-900">{t('total')}</span>
            <span className="text-xl font-bold text-primary">{finalTotal.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={submitStatus !== 'idle' || cartItems.length === 0}
          className={`w-full py-3.5 rounded-xl text-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg
            ${submitStatus === 'success' ? 'bg-green-600 text-white shadow-green-600/30' : 'bg-primary text-white shadow-primary/30'}
            ${cartItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {submitStatus === 'idle' && <><span className="material-symbols-outlined">restaurant_menu</span>{t('btnOrder')}</>}
          {submitStatus === 'loading' && <><span className="material-symbols-outlined animate-spin">progress_activity</span>...</>}
          {submitStatus === 'success' && <><span className="material-symbols-outlined">check_circle</span>{t('checkoutSuccess')}</>}
        </button>
      </div>

      {/* POPUP MODAL */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">

          {/* Hộp nội dung chính giữa */}
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-neutralCustom/10 text-center animate-scale-up relative">

            {/* Icon cảnh báo đỏ nổi bật */}
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-sm">
              <span className="material-symbols-outlined text-3xl">inventory_2</span>
            </div>

            <h3 className="text-xl font-black text-gray-950 mb-2">{t('adjustStockTitle')}</h3>
            <p className="text-xs text-neutralCustom leading-relaxed mb-4 px-2">{t('adjustStockDesc')}</p>

            {/* Danh sách các món lố kho được lặp mượt mà bằng CSS */}
            <div className="max-h-36 overflow-y-auto bg-gray-50/50 rounded-2xl border border-neutralCustom/10 p-3 space-y-2 mb-5 custom-scrollbar text-left">
              {outOfStockItems.map((loi, index) => {
                const dish = cartItems.find(item => item.id === loi.dish_id);
                return (
                  <div key={index} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-xl border border-neutralCustom/5 shadow-sm">
                    <span className="font-bold text-gray-900 truncate max-w-[180px]">
                      {dish ? dish.name : 'Món ăn không rõ'}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="material-symbols-outlined text-sm text-red-500">arrow_right_alt</span>
                      <span className="bg-red-50 text-red-600 font-extrabold px-2 py-0.5 rounded-md">Tối đa {loi.maxAvailable}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] font-medium text-neutralCustom/80 mb-5 leading-snug">{t('adjustStockConfirm')}</p>
            {/* Nút hành động ở chân Popup */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="w-full py-3 border border-neutralCustom/20 text-neutralCustom bg-white font-bold text-sm rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
              >
                {t('btnCancel')}
              </button>
              <button
                onClick={handleAcceptAdjustStock}
                className="w-full py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-secondary shadow-md hover:shadow-primary/20 active:scale-95 transition-all"
              >
                {t('btnAccept')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP ALERT MODAL */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-neutralCustom/10 text-center animate-scale-up relative">
            
            {/* Icon tương ứng với loại cảnh báo */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border shadow-sm ${
              alertModal.icon === 'error' 
                ? 'bg-red-50 text-red-500 border-red-100' 
                : alertModal.icon === 'warning'
                ? 'bg-amber-50 text-amber-500 border-amber-100'
                : 'bg-blue-50 text-blue-500 border-blue-100'
            }`}>
              <span className="material-symbols-outlined text-3xl">
                {alertModal.icon === 'error' ? 'error' : alertModal.icon === 'warning' ? 'warning' : 'info'}
              </span>
            </div>

            <h3 className="text-xl font-black text-gray-950 mb-2">{alertModal.title}</h3>
            <p className="text-xs text-neutralCustom leading-relaxed mb-6 px-2">{alertModal.message}</p>

            <button
              onClick={handleCloseAlertModal}
              className="w-full py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-secondary active:scale-95 transition-all"
            >
              Đồng ý
            </button>
          </div>
        </div>
      )}

    </CustomerLayout>
  );
};

export default CartPage;