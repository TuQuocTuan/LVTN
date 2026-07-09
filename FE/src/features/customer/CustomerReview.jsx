import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

// Thiết lập URL kết nối đến API Backend của Tuấn

const API_URL = import.meta.env.VITE_API_URL;
const axiosConfig = { headers: { 'ngrok-skip-browser-warning': 'true' } };

const CustomerReview = () => {
  const [searchParams] = useSearchParams();
  // 🌟 Đọc trực tiếp mã session_id được sinh ra tự động từ QR trên hóa đơn
  const urlSessionId = searchParams.get('session_id');

  const [tableName, setTableName] = useState('');
  const [dishList, setDishList] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAlreadyReviewed, setIsAlreadyReviewed] = useState(false);

  useEffect(() => {
    if (urlSessionId) {
      checkSessionReviewStatus(urlSessionId);
    } else {
      setErrorMsg("Vui lòng quét mã QR in trên hóa đơn thanh toán để thực hiện đánh giá món ăn!");
    }
  }, [urlSessionId]);

  // Hàm check xem session_id này đã được gửi đánh giá lên Database của Tuấn chưa
  const checkSessionReviewStatus = async (targetSessionId) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await axios.get(`${API_URL}/review`, axiosConfig);
      if (response.data && response.data.success) {
        const reviews = response.data.data || [];
        // Tìm xem đã có bản ghi đánh giá nào trùng với session_id này chưa
        const hasReviewed = reviews.some(r => r.session_id === targetSessionId);

        if (hasReviewed) {
          setIsAlreadyReviewed(true);
          setIsSuccess(true); // Hiển thị thẳng màn hình Cảm ơn
        } else {
          // Nếu chưa đánh giá thì mới đi lấy danh sách món ăn của hóa đơn
          fetchDishesFromSession(targetSessionId);
        }
      } else {
        fetchDishesFromSession(targetSessionId);
      }
    } catch (error) {
      console.error("Lỗi kiểm tra trạng thái đánh giá:", error);
      // Fallback: nếu lỗi API kiểm tra thì vẫn cho khách tải danh sách món ăn để đánh giá bình thường
      fetchDishesFromSession(targetSessionId);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDishesFromSession = async (targetSessionId) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await axios.get(`${API_URL}/orders/${targetSessionId}`, axiosConfig);

      if (response.data && response.data.success && response.data.data.length > 0) {
        const orderDataList = response.data.data;

        // Lấy thông tin tên bàn nướng tự động
        const firstOrder = orderDataList[0];
        if (firstOrder.dining_sessions?.tables?.name) {
          setTableName(firstOrder.dining_sessions.tables.name);
        } else {
          setTableName('Bàn ăn');
        }

        // Bóc tách toàn bộ món ăn từ các order_details
        let rawDishes = [];
        orderDataList.forEach(order => {
          // Chỉ lấy các món ăn đã được bếp báo hoàn thành chế biến xong phục vụ (completed)
          if (order.status === 'completed' && order.order_details) {
            order.order_details.forEach(detail => {
              rawDishes.push({
                dish_id: detail.dish_id,
                dish_name: detail.dishes?.name || 'Món ăn',
                quantity: detail.quantity,
                rating: 5, // 🌟 Mặc định 5 sao cho tất cả món ăn xuất hiện
                comment: '',
                order_id: order.id // Lưu lại order_id để xử lý gửi đánh giá an toàn
              });
            });
          }
        });

        // Gộp các món ăn trùng lặp (trường hợp khách gọi cùng một món nhiều lần trong bữa)
        const mergedDishes = [];
        rawDishes.forEach(item => {
          const exist = mergedDishes.find(d => d.dish_id === item.dish_id);
          if (exist) {
            exist.quantity += item.quantity;
          } else {
            mergedDishes.push(item);
          }
        });

        if (mergedDishes.length === 0) {
          setErrorMsg("Hóa đơn này chưa có món ăn nào được hoàn thành để thực hiện đánh giá!");
        } else {
          setDishList(mergedDishes);
        }
      } else {
        setErrorMsg("Không tìm thấy thông tin đơn hàng nào cho hóa đơn này.");
      }
    } catch (error) {
      console.error("Lỗi lấy đơn hàng:", error);
      setErrorMsg("Không thể đồng bộ dữ liệu hóa đơn nướng. Vui lòng quét lại mã QR!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = (dishId, newRating) => {
    setDishList(prev => prev.map(dish =>
      dish.dish_id === dishId ? { ...dish, rating: newRating } : dish
    ));
  };

  const handleCommentChange = (dishId, newComment) => {
    setDishList(prev => prev.map(dish =>
      dish.dish_id === dishId ? { ...dish, comment: newComment } : dish
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (dishList.length === 0) {
      return setErrorMsg("Chưa tải xong dữ liệu món ăn, không thể gửi đánh giá!");
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 🌟 KHẮC PHỤC LỖI CHỒNG CHÉO SUPABASE: Phân nhóm mảng gửi theo từng order_id riêng biệt
      const orderGroups = {};
      dishList.forEach(dish => {
        if (!orderGroups[dish.order_id]) {
          orderGroups[dish.order_id] = [];
        }
        orderGroups[dish.order_id].push({
          dish_id: dish.dish_id,
          rating: dish.rating,
          // Gửi trực tiếp comment thuần túy, không chèn thêm SĐT rườm rà
          comment: dish.comment.trim()
        });
      });

      // Thực hiện gửi đồng loạt bằng Promise.all
      const submitPromises = Object.entries(orderGroups).map(([orderIdKey, reviewsPayload]) => {
        const payload = {
          session_id: urlSessionId,
          order_id: Number(orderIdKey),
          customer_id: null,
          reviews: reviewsPayload
        };
        return axios.post(`${API_URL}/review/add`, payload, axiosConfig);
      });

      await Promise.all(submitPromises);
      setIsSuccess(true);
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      setErrorMsg(error.response?.data?.message || 'Có lỗi xảy ra khi truyền thông tin lên máy chủ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInteractiveStars = (dish) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="transition-transform active:scale-90 p-1"
            onClick={() => handleRatingChange(dish.dish_id, star)}
          >
            <span
              className={`material-symbols-outlined text-[32px] sm:text-[38px] ${dish.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
              style={{ fontVariationSettings: dish.rating >= star ? "'FILL' 1" : "'FILL' 0" }}
            >
              star
            </span>
          </button>
        ))}
      </div>
    );
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans w-full selection:bg-orange-600 selection:text-white">
        <div className="bg-white max-w-md w-full rounded-3xl p-8 sm:p-10 text-center shadow-xl border border-stone-200/60 animate-scale-up">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100 animate-bounce">
            <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 tracking-tight">
            {isAlreadyReviewed ? 'Đã ghi nhận đánh giá!' : 'Gửi thành công!'}
          </h2>
          <p className="text-stone-600 mb-2 text-sm leading-relaxed font-semibold">
            {isAlreadyReviewed
              ? 'Hóa đơn này của bạn đã được thực hiện đánh giá trước đó.'
              : 'Làng MÌXI BBQ chân thành cảm ơn ý kiến đóng góp quý báu của bạn!'}
          </p>
          <p className="text-stone-500 text-xs leading-relaxed">
            Mọi ý kiến của quý khách là nguồn động lực và tư liệu to lớn giúp đội ngũ phát triển món ăn cải thiện dịch vụ nướng lẩu ngày một tốt hơn. Chúc bạn có một ngày vui vẻ!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-6 px-4 font-sans flex items-center justify-center w-full selection:bg-orange-600 selection:text-white">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-stone-200/60 overflow-hidden">

        {/* Banner tiêu đề BBQ ấm áp */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-6 text-white text-center relative">
          <span className="text-[9px] font-black uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full">
            Khảo sát ý kiến khách hàng
          </span>
          <h1 className="text-2xl font-black uppercase mt-3 tracking-tight">LÀNG MÌXI BBQ</h1>
          <p className="text-xs text-orange-100/90 mt-1 leading-relaxed max-w-xs mx-auto">
            Hãy để lại cảm nhận chân thực nhất của bạn để Làng MÌXI ngày một phục vụ tốt hơn nhé!
          </p>
        </div>

        <div className="p-5">
          {/* Hộp thoại thông báo lỗi khi đường dẫn hỏng hoặc QR thiếu thông số */}
          {errorMsg && (
            <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold text-center border border-red-100 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span> {errorMsg}
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-orange-500 text-4xl mb-3">progress_activity</span>
              <p className="text-xs font-bold text-stone-500 animate-pulse">Đang đồng bộ thực đơn hóa đơn của bạn...</p>
            </div>
          )}

          {/* Form chính chỉ hiển thị khi đã bóc tách thành công món ăn */}
          {!isLoading && dishList.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Thẻ hiển thị số bàn nướng dùng bữa tự động */}
              {tableName && (
                <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl flex justify-between items-center shadow-inner">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-500">table_restaurant</span>
                    <span className="text-xs font-black text-stone-700 uppercase tracking-wider">Bàn dùng bữa hôm nay:</span>
                  </div>
                  <span className="bg-orange-600 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-sm">
                    {tableName}
                  </span>
                </div>
              )}

              {/* Danh sách các món ăn cần khảo sát */}
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
                <label className="block text-xs font-black text-orange-600 uppercase tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">star</span> Chấm điểm món ăn (Mặc định 5 sao)
                </label>

                {dishList.map((dish, idx) => (
                  <div key={idx} className="bg-stone-50 border border-stone-200/80 p-3.5 rounded-2xl shadow-sm space-y-2.5">
                    <div className="flex justify-between items-start">
                      <p className="font-extrabold text-stone-900 text-xs sm:text-sm pr-2 leading-tight">
                        {dish.dish_name} <span className="text-xs text-orange-500 font-bold ml-0.5">(x{dish.quantity})</span>
                      </p>
                      {renderInteractiveStars(dish)}
                    </div>
                    <input
                      type="text"
                      placeholder="Góp ý vị nướng, nước chấm... (Không bắt buộc)"
                      value={dish.comment}
                      onChange={(e) => handleCommentChange(dish.dish_id, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 focus:border-orange-500 rounded-xl text-xs outline-none transition-colors font-medium text-stone-950 shadow-inner"
                    />
                  </div>
                ))}
              </div>

              {/* Nút gửi đánh giá */}
              <button
                type="submit"
                disabled={isSubmitting || dishList.length === 0}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-black py-3.5 rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-1.5 uppercase tracking-wide text-xs sm:text-sm"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    <span>Đang truyền thông tin...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Gửi Đánh Giá Ngay</span>
                  </>
                )}
              </button>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default CustomerReview;