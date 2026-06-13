import React, { useState, useEffect } from 'react';
import CustomerLayout from '../../components/layout/Customer/CustomerLayout';
// Import supabase client để gọi thông báo realtime cho thu ngân
import { supabase } from '../../config/supabase'; 

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PaymentPage = () => {
  // Lấy thông tin bàn và phiên ăn hiện tại từ localStorage (Hoặc context/Redux của bạn)
  const sessionId = localStorage.getItem('sessionId'); 
  const tableName = localStorage.getItem('table_name') || 'Bàn của bạn';

  // State lưu dữ liệu hóa đơn thật từ API
  const [billData, setBillData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State UI
  const [isCallingPayment, setIsCallingPayment] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentCalled, setPaymentCalled] = useState(false);

  // State lưu kênh thông báo
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    const notifyChannel = supabase.channel('restaurant-notifications');
    notifyChannel.subscribe();
    setChannel(notifyChannel);

    return () => {
      supabase.removeChannel(notifyChannel);
    };
  }, []);

  // GỌI API LẤY HÓA ĐƠN TẠM TÍNH KHI MỞ TRANG
  useEffect(() => {
    const fetchPreviewBill = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/orders/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            is_preview: true // Báo cho Backend biết đây chỉ là xem tạm tính
          })
        });

        const data = await response.json();
        
        if (data.success) {
          setBillData(data);
        } else {
          console.error("Lỗi lấy hóa đơn:", data.message);
        }
      } catch (error) {
        console.error("Lỗi kết nối API:", error);
      } finally {
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
            tableName: `${tableName} (Tính tiền)`, 
            time: new Date().toLocaleTimeString(),
            message: 'Khách yêu cầu thanh toán'
          }
        });
      }
      setPaymentCalled(true);
      setShowConfirm(false);
    } catch (error) {
      console.error("Lỗi khi gọi thanh toán:", error);
      alert("Có lỗi xảy ra, vui lòng gọi nhân viên trực tiếp.");
    } finally {
      setIsCallingPayment(false);
    }
  };

  // NẾU CHƯA CÓ SESSION ID HOẶC ĐANG LOAD
  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="flex justify-center items-center h-[70vh]">
          <p className="text-neutralCustom">Đang tải hóa đơn...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (!billData) {
    return (
      <CustomerLayout>
        <div className="flex justify-center items-center h-[70vh] flex-col gap-2">
          <span className="material-symbols-outlined text-5xl text-neutralCustom/50">receipt_long</span>
          <p className="text-neutralCustom">Không tìm thấy hóa đơn nào.</p>
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
          <h2 className="text-xl font-bold text-gray-900">Tạm tính hóa đơn</h2>
        </div>

        {/* THÔNG TIN BÀN & TRẠNG THÁI */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-neutralCustom font-bold uppercase tracking-wider">Vị trí</p>
            <p className="text-lg font-bold text-gray-900">{tableName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutralCustom font-bold uppercase tracking-wider">Trạng thái</p>
            <span className={`text-sm font-bold ${paymentCalled ? 'text-green-600' : 'text-primary'}`}>
              {paymentCalled ? 'Đang chờ thu ngân...' : 'Đang phục vụ'}
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
                    <p className="font-bold text-gray-900 text-sm max-w-[160px] truncate">{dishName}</p>
                    <p className="text-xs text-neutralCustom">{detail.price.toLocaleString()}đ / món</p>
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
            <span className="text-neutralCustom">Tạm tính</span>
            <span className="font-bold text-gray-900">{billData.sub_total?.toLocaleString()}đ</span>
          </div>
          
          {/* Chỉ hiện dòng giảm giá nếu có áp dụng khuyến mãi */}
          {billData.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Khuyến mãi ({billData.voucher_name})</span>
              <span className="font-bold">-{billData.discount_amount.toLocaleString()}đ</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-neutralCustom">Thuế VAT (10%)</span>
            <span className="font-bold text-gray-900">{billData.vat_amount?.toLocaleString()}đ</span>
          </div>
          
          <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center">
            <span className="font-bold text-gray-900 text-lg">Tổng cộng</span>
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
            {paymentCalled ? 'Đã báo thu ngân' : 'Yêu cầu thanh toán'}
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận thanh toán?</h3>
              <p className="text-sm text-neutralCustom mb-6">
                Nhân viên sẽ mang hóa đơn đến bàn và hỗ trợ bạn thanh toán.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 text-sm font-bold text-neutralCustom bg-gray-100 rounded-xl"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleCallPayment}
                  className="flex-1 py-3 text-sm font-bold text-white bg-primary rounded-xl flex items-center justify-center"
                >
                  {isCallingPayment ? 'Đang gửi...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-neutralCustom mt-8 italic">
          Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi!
        </p>
      </div>
    </CustomerLayout>
  );
};

export default PaymentPage;