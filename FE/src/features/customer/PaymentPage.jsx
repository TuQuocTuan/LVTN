import React, { useState, useEffect } from 'react';
import CustomerLayout from '../../components/layout/Customer/CustomerLayout';
// Import supabase client để gọi thông báo realtime cho thu ngân
import { supabase } from '../../config/supabase';
import { initBroadcastChannel } from '../../utils/realtimeHelper';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PaymentPage = () => {
  // Lấy thông tin bàn và phiên ăn hiện tại từ localStorage
  const sessionId = localStorage.getItem('sessionId');
  const tableName = localStorage.getItem('table_name') || 'Bàn của bạn';
  const { t } = useLanguage();

  // State lưu dữ liệu hóa đơn thật từ API
  const [billData, setBillData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State UI
  const [isCallingPayment, setIsCallingPayment] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentCalled, setPaymentCalled] = useState(false);

  // Hộp thoại Alert tùy biến
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    icon: 'info'
  });

  // State lưu kênh thông báo
  const [channel, setChannel] = useState(null);

  // Khởi tạo kênh báo thu ngân bằng hàm helper
  useEffect(() => {
    const notifyChannel = initBroadcastChannel('restaurant-notifications');
    setChannel(notifyChannel);

    return () => supabase.removeChannel(notifyChannel);
  }, []);

  // GỌI API LẤY HÓA ĐƠN TẠM TÍNH KHI VÀO TRANG
  useEffect(() => {
    const fetchPreviewBill = async () => {
      if (!sessionId) {
        setIsLoading(false); // Không có session thì tắt loading luôn
        return;
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/orders/checkout`, {
          session_id: sessionId,
          is_preview: true // Báo cho BE biết đây là luồng xem trước tạm tính
        });

        const data = response.data;

        if (data.success) {
          setBillData(data); // Nạp dữ liệu hóa đơn vào màn hình
        } else {
          console.error("Backend báo lỗi:", data.message);
          setBillData(null);
        }
      } catch (error) {
        console.error("Lỗi kết nối API mạng:", error);
        setBillData(null);
      } finally {
        // ĐẢM BẢO CHẮC CHẮN: Dù thành công hay lỗi đều phải tắt chữ "Đang tải..."
        setIsLoading(false);
      }
    };

    fetchPreviewBill();
  }, [sessionId]);

  // HÀM XỬ LÝ KHI KHÁCH BẤM YÊU CẦU THANH TOÁN
  const handleCallPayment = async () => {
    setIsCallingPayment(true);
    try {
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'call_staff',
          payload: {
            tableName: tableName,
            type: 'checkout',
            time: new Date().toLocaleTimeString(),
            message: 'Khách yêu cầu thanh toán'
          }
        });
      }
      setPaymentCalled(true);
      setShowConfirm(false);
    } catch (error) {
      console.error("Lỗi khi gọi thanh toán:", error);
      setAlertModal({
        isOpen: true,
        title: "Lỗi hệ thống",
        message: "Có lỗi xảy ra, vui lòng gọi nhân viên trực tiếp.",
        icon: "error"
      });
      setShowConfirm(false);
    } finally {
      setIsCallingPayment(false);
    }
  };

  // NẾU CHƯA CÓ SESSION ID HOẶC ĐANG LOAD
  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="flex justify-center items-center h-[70vh]">
          <p className="text-neutralCustom">{t('loadingOrders')}</p>
        </div>
      </CustomerLayout>
    );
  }

  if (!billData) {
    return (
      <CustomerLayout>
        <div className="flex justify-center items-center h-[70vh] flex-col gap-2">
          <span className="material-symbols-outlined text-5xl text-neutralCustom/50">receipt_long</span>
          <p className="text-neutralCustom">{t('emptyOrders')}</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="px-4 py-6 pb-32">
        {/* Tiêu đề trang */}
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary text-3xl">receipt_long</span>
          <h2 className="text-xl font-bold text-gray-900">{t('previewBillTitle')}</h2>
        </div>

        {/* THÔNG TIN BÀN & TRẠNG THÁI */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-neutralCustom font-bold uppercase tracking-wider">{t('seatingPosition')}</p>
            <p className="text-lg font-bold text-gray-900">{tableName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutralCustom font-bold uppercase tracking-wider">{t('paymentStatus')}</p>
            <span className={`text-sm font-bold ${paymentCalled ? 'text-green-600' : 'text-primary'}`}>
              {paymentCalled ? t('statusWaiting') : t('statusServing')}
            </span>
          </div>
        </div>

        {/* DANH SÁCH MÓN ĐÃ DÙNG THỰC TẾ TỪ API */}
        <div className="space-y-4 mb-8">
          <p className="text-sm font-bold text-neutralCustom ml-1">Chi tiết món ăn</p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Vì BE trả về billData.items là Object { "Tên món": { price, quantity, sub_total } } nên phải dùng Object.entries để map */}
            {billData.items && Object.entries(billData.items).map(([dishName, detail], index, array) => (
              <div key={index} className={`flex justify-between items-center p-4 ${index !== array.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex gap-3 items-center">
                  <span className="bg-orange-50 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    {detail.quantity}
                  </span>
                  <div>
                    <p className="font-bold text-gray-900 text-sm break-words">{dishName}</p>
                    <p className="text-xs text-neutralCustom">{detail.price.toLocaleString()}đ / {t('perDish')}</p>
                  </div>
                </div>
                <p className="font-bold text-gray-900 text-sm">
                  {(detail.quantity * detail.price).toLocaleString('vi-VN')}đ
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* TỔNG KẾT TIỀN BẠC THỰC TẾ TỪ API */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutralCustom">{t('subTotal')}</span>
            <span className="font-bold text-gray-900">{billData.sub_total?.toLocaleString()}đ</span>
          </div>

          {/* Chỉ hiện dòng giảm giá nếu có áp dụng khuyến mãi */}
          {billData.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{t('discountLabel')} ({billData.voucher_name})</span>
              <span className="font-bold">-{billData.discount_amount.toLocaleString()}đ</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-neutralCustom">{t('vatRateLabel')}</span>
            <span className="font-bold text-gray-900">{billData.vat_amount?.toLocaleString()}đ</span>
          </div>

          <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center">
            <span className="font-bold text-gray-900 text-lg">{t('finalAmount')}</span>
            <span className="font-bold text-primary text-2xl">{billData.tongtien?.toLocaleString()}đ</span>
          </div>
        </div>

        {/* NÚT GỌI THANH TOÁN */}
        <div className="fixed bottom-24 left-0 w-full px-4 bg-transparent">
          <button
            onClick={() => !paymentCalled && setShowConfirm(true)}
            disabled={paymentCalled}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
              paymentCalled
                ? 'bg-green-500 text-white cursor-default'
                : 'bg-primary text-white shadow-primary/30 hover:bg-orange-800'
              }`}
          >
            <span className="material-symbols-outlined">
              {paymentCalled ? 'check_circle' : 'payments'}
            </span>
            {paymentCalled ? t('btnRequested') : t('btnRequestPayment')}
          </button>
        </div>

        {/* POPUP XÁC NHẬN THANH TOÁN */}
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isCallingPayment && setShowConfirm(false)}></div>
            <div className="relative bg-white w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-4xl">payments</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('confirmPaymentTitle')}</h3>
              <p className="text-sm text-neutralCustom mb-6">
                {t('confirmPaymentDesc')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 text-sm font-bold text-neutralCustom bg-gray-100 rounded-xl"
                >
                  {t('btnNo')}
                </button>
                <button
                  onClick={handleCallPayment}
                  className="flex-1 py-3 text-sm font-bold text-white bg-primary rounded-xl flex items-center justify-center"
                >
                  {isCallingPayment ? '...' : t('btnYes')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* POPUP ALERT MODAL */}
        {alertModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}></div>
            <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl border border-neutralCustom/10 animate-scale-up">
              
              {/* Icon tương ứng với loại cảnh báo */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border shadow-sm ${
                alertModal.icon === 'error' 
                  ? 'bg-red-50 text-red-500 border-red-100' 
                  : 'bg-blue-50 text-blue-500 border-blue-100'
              }`}>
                <span className="material-symbols-outlined text-3xl">
                  {alertModal.icon === 'error' ? 'error' : 'info'}
                </span>
              </div>

              <h3 className="text-xl font-black text-gray-950 mb-2">{alertModal.title}</h3>
              <p className="text-xs text-neutralCustom leading-relaxed mb-6 px-2">{alertModal.message}</p>

              <button
                onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-secondary active:scale-95 transition-all"
              >
                Đồng ý
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-neutralCustom mt-8 italic">
          {t('footerThankYou')}
        </p>
      </div>
    </CustomerLayout>
  );
};

export default PaymentPage;