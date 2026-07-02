import React, { useState } from 'react';

const CustomerReview = () => {
  // 🌟 Mô phỏng lấy các ID từ URL hóa đơn (Ví dụ khách quét mã QR: ?session_id=1&order_id=5)
  // Trong môi trường thực tế, dùng: const [searchParams] = useSearchParams();
  const [demoMode, setDemoMode] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    comment: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      return alert('Vui lòng chọn số sao đánh giá món ăn và dịch vụ của Làng MìXì nhé!');
    }

    setIsSubmitting(true);

    // Mô phỏng hiệu ứng gửi dữ liệu lên Backend
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      alert("Cảm ơn đóng góp quý báu của Quý khách!\nLàng MìXì chúc bạn một ngày tốt lành và hẹn gặp lại!");
    }, 1500);
  };

  // 1. MÀN HÌNH CHẶN: Nếu khách tự gõ URL mà không có tham số QR (Chỉ cho phép chạy tiếp khi bật Demo Mode)
  const hasParams = false; // Giả lập chưa quét QR thực tế
  if (!hasParams && !demoMode && !isSuccess) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white max-w-md w-full rounded-3xl p-8 text-center shadow-xl border border-gray-150">
          <div className="w-20 h-24 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-orange-100">
            <span className="material-symbols-outlined text-5xl text-primary">qr_code_scanner</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Chưa tìm thấy hóa đơn!</h2>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            Vui lòng sử dụng camera trên điện thoại để quét <b>Mã QR</b> được in ở cuối tờ hóa đơn thanh toán tại bàn của bạn nhé.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => setDemoMode(true)}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-secondary transition-all active:scale-95 shadow-md text-sm"
            >
              Chạy thử giao diện (Demo Mode)
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-100 text-gray-600 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-all text-sm"
            >
              Quay về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. MÀN HÌNH THÀNH CÔNG: Sau khi khách gửi đánh giá thành công
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white max-w-md w-full rounded-3xl p-8 text-center shadow-xl border border-gray-150">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100">
            <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Gửi thành công!</h2>
          <p className="text-gray-600 mb-8 text-sm leading-relaxed">
            Ý kiến của bạn đã được gửi trực tiếp đến Ban Quản Lý Làng MìXì. Chúng tôi sẽ liên tục cải thiện để mang lại trải nghiệm ẩm thực tuyệt vời nhất cho bạn.
          </p>
          <button 
            onClick={() => {
              setIsSuccess(false);
              setRating(0);
              setFormData({ customer_name: '', phone: '', comment: '' });
            }}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-secondary transition-all text-sm shadow-md"
          >
            Đánh giá hóa đơn khác
          </button>
        </div>
      </div>
    );
  }

  // 3. GIAO DIỆN ĐÁNH GIÁ CHÍNH (Mobile-first, warm tone)
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border border-gray-150 relative">
        
        {/* Banner Cover */}
        <div className="h-36 bg-gradient-to-r from-primary to-secondary relative flex items-center justify-center overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-md"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-lg"></div>
          
          <div className="relative z-10 text-center">
            <h1 className="text-2xl font-black text-white tracking-tight uppercase mb-1">
              LÀNG <span className="text-yellow-300">MÌXÌ</span>
            </h1>
            <p className="text-white/90 text-xs font-semibold uppercase tracking-widest">Ý kiến & Góp ý dịch vụ</p>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Trải nghiệm của bạn thế nào?</h2>
            <p className="text-xs text-gray-500">Chạm vào các ngôi sao để đánh giá chất lượng món ăn và dịch vụ phục vụ</p>
          </div>

          {/* Interactive Star Rating */}
          <div className="flex justify-center gap-2.5 mb-8" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`p-0.5 transition-all duration-200 active:scale-90 ${
                  (hoverRating || rating) >= star ? 'scale-110' : 'scale-100 opacity-60'
                }`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
              >
                <span 
                  className={`material-symbols-outlined text-4xl cursor-pointer ${
                    (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  style={{ fontVariationSettings: (hoverRating || rating) >= star ? "'FILL' 1" : "'FILL' 0" }}
                >
                  star
                </span>
              </button>
            ))}
          </div>

          {/* Form Góp ý */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Tên của bạn</label>
                <input 
                  type="text" 
                  name="customer_name"
                  placeholder="VD: Anh Tuấn"
                  value={formData.customer_name} 
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-medium text-gray-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Số điện thoại</label>
                <input 
                  type="tel" 
                  name="phone"
                  placeholder="Để nhận quà tri ân"
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-medium text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Nội dung góp ý chi tiết</label>
              <textarea 
                name="comment" 
                rows="4"
                placeholder="Món mì xá xíu có hợp khẩu vị bạn không? Nhân viên phục vụ thế nào? Hãy chia sẻ cho chúng mình biết nhé..."
                value={formData.comment} 
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-medium text-gray-900 resize-none"
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl mt-4 shadow-lg shadow-primary/20 hover:bg-secondary transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isSubmitting ? 'ĐANG GỬI GÓP Ý...' : 'GỬI ĐÁNH GIÁ NGAY'}
            </button>
          </form>

          {demoMode && (
            <button 
              onClick={() => setDemoMode(false)}
              className="w-full mt-4 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Thoát Demo Mode
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerReview;