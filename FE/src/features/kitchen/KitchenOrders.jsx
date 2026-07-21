import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../../config/supabase';
import StaffHeader from '../../components/layout/Staff/StaffHeader';
import { listenDatabaseChanges } from '../../utils/realtimeHelper';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const KitchenDashboard = () => {

  // orders: Danh sách các đơn hàng đang chờ chế biến
  const [orders, setOrders] = useState([]);

  // isRecipeOpen: Trạng thái đóng/mở của cửa sổ (modal) xem công thức nấu ăn
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);

  // currentRecipe: Lưu thông tin chi tiết công thức đang xem (tên món và danh sách định lượng nguyên liệu)
  const [currentRecipe, setCurrentRecipe] = useState({ dishName: '', details: [] });

  // processingId: Dùng để lưu ID của tác vụ đang chạy (vd: 'complete-123' cho hoàn thành, 'cancel-123' cho hủy toàn bộ, 'detail-456' cho hủy món lẻ).
  // Mục đích: Khóa tất cả các nút khi đang gọi API để tránh click đúp (double-click) và chỉ hiện chữ "ĐANG XỬ LÝ..." trên đúng nút được bấm.
  const [processingId, setProcessingId] = useState(null);

  // notifications: Danh sách thông báo khi có đơn hàng mới
  const [notifications, setNotifications] = useState([]);

  // dialog: Cấu hình hiển thị cho hộp thoại thông báo tùy chỉnh (Custom Dialog)
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'info',
    title: '', 
    message: '', 
    onConfirm: null, // Callback chạy khi người dùng chọn Đồng ý / Xác nhận
    onCancel: null // Callback chạy khi người dùng chọn Hủy bỏ
  });

  const showDialog = (type, title, message, onConfirm = null, onCancel = null) => {
    setDialog({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      onCancel
    });
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  // showAlert: Hiển thị nhanh một hộp thoại cảnh báo với nút "Đồng ý"
  const showAlert = (message, type = 'info') => {
    let title = 'Thông báo';
    if (type === 'success') title = 'Thành công';
    if (type === 'error') title = 'Lỗi';
    if (type === 'warning') title = 'Cảnh báo';
    
    showDialog(type, title, message);
  };

  // showConfirm: Hiển thị hộp thoại xác nhận gồm 2 lựa chọn (Hủy bỏ / Xác nhận) trước khi chạy tác vụ quan trọng
  const showConfirm = (message, onConfirm, onCancel = null) => {
    showDialog('confirm', 'Xác nhận', message, onConfirm, onCancel);
  };

  // showNotiDropdown: Đóng/mở danh sách thông báo trên Header
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);

  const [userRole, setUserRole] = useState('');
  const [userPermissions, setUserPermissions] = useState({});

  const audio = new Audio('/Chinese Meme Ringtone Download.mp3');

  // ĐỌC THÔNG TIN NGƯỜI DÙNG KHI COMPONENT ĐƯỢC LOAD
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Lưu vai trò của user (viết thường, loại bỏ khoảng trắng)
        setUserRole(user.role?.toString().trim().toLowerCase());

        // Đọc danh sách các quyền hạn được phân
        let perms = {};
        if (typeof user.permissions === 'string') {
          perms = JSON.parse(user.permissions);
        } else if (typeof user.permissions === 'object' && user.permissions !== null) {
          perms = user.permissions;
        }
        setUserPermissions(perms);
      } catch (e) {
        console.error("Lỗi đọc thông tin phân quyền user trong TableManager:", e);
      }
    }
  }, []);

  // Hàm kiểm tra nhanh xem người dùng có quyền cụ thể nào đó không
  const hasPermission = (permissionKey) => {
    if (userRole === 'super_admin') return true;
    return !!userPermissions[permissionKey];
  };

  // fetchPendingOrders: Lấy danh sách các đơn hàng đang chờ chế biến từ máy chủ
  const fetchPendingOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/pendingOrders`);
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách order:', error);
    }
  };

  // LẤY DANH SÁCH ORDER BAN ĐẦU VÀ LẮNG NGHE REALTIME DATABASE TỪ SUPABASE
  useEffect(() => {
    fetchPendingOrders();

    // Kênh realtime lắng nghe sự kiện INSERT vào bảng 'orders' (có đơn hàng mới)
    const channel = listenDatabaseChanges('kitchen-realtime', 'orders', 'INSERT', (payload) => {
      // Phát âm thanh báo hiệu
      audio.play().catch(err => console.log(err));

      // Tạo đối tượng thông báo mới đưa vào danh sách trên Header
      const newNotification = {
        tableName: `Mã đơn #${String(payload.new.id).slice(0, 4)}`,
        time: new Date().toLocaleTimeString(),
        type: 'new_order',
        message: 'Vừa có order mới cần chế biến!'
      };
      setNotifications(prev => [newNotification, ...prev]);

      setTimeout(() => fetchPendingOrders(), 500);
    });

    // Hàm dọn dẹp (Cleanup) khi component bị unmount: ngắt kết nối realtime channel
    return () => supabase.removeChannel(channel);
  }, []);

  // handleViewRecipe: Lấy và hiển thị công thức nguyên liệu chi tiết của món ăn
  const handleViewRecipe = async (dishId, dishName) => {
    if (!hasPermission('view_recipes')) {
      return showAlert("Tài khoản của bạn đã bị giới hạn, không có quyền xem công thức!", "warning");
    }

    if (!dishId) {
      showAlert("Thiếu ID món ăn để xem công thức!", "warning");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/recipes/${dishId}`);
      if (response.data.success) {
        setCurrentRecipe({
          dishName: dishName,
          details: response.data.data
        });
        setIsRecipeOpen(true);
      }
    } catch (error) {
      console.error('Lỗi khi lấy công thức:', error);
      showAlert('Món này chưa có công thức hoặc có lỗi xảy ra!', "error");
    }
  };

  // toggleRecipe: Hàm bật/tắt (đóng/mở) nhanh modal công thức
  const toggleRecipe = () => setIsRecipeOpen(!isRecipeOpen);

  // handleCompleteOrder: Hoàn thành chế biến tất cả các món ăn chưa bị hủy trong đơn
  const handleCompleteOrder = async (orderId) => {
    if (!hasPermission('process_orders')) {
      return showAlert("Tài khoản của bạn đã bị giới hạn, không có quyền thay đổi trạng thái món ăn!", "warning");
    }

    try {
      // Đánh dấu đơn hàng này đang thực hiện hoàn thành để hiển thị trạng thái loading riêng biệt trên nút của nó
      setProcessingId('complete-' + orderId);
      const response = await axios.post(`${API_URL}/orders/completeOrder`, {
        order_id: orderId
      });

      if (response.data.success) {
        fetchPendingOrders();
      } else {
        showAlert("Lỗi từ server: " + response.data.message, "error");
      }
    } catch (error) {
      console.error("Lỗi hoàn thành đơn:", error);
      showAlert("Không thể kết nối đến máy chủ để hoàn thành đơn!", "error");
    } finally {
      // Xóa trạng thái xử lý sau khi hoàn tất API call
      setProcessingId(null);
    }
  };

  // Hủy toàn bộ đơn hàng
  const handleCancelOrder = async (orderId) => {
    if (!hasPermission('process_orders')) {
      return showAlert("Tài khoản của bạn đã bị giới hạn, không có quyền thay đổi trạng thái món ăn!", "warning");
    }

    showConfirm("Bếp đã hết nguyên liệu hoặc muốn từ chối làm order này?", async () => {
      try {
        // Đánh dấu đơn hàng đang thực hiện hủy toàn bộ
        setProcessingId('cancel-' + orderId);
        const response = await axios.post(`${API_URL}/orders/cancelOrder`, {
          order_id: orderId
        });

        if (response.data.success) {
          fetchPendingOrders();
        } else {
          showAlert("Lỗi từ server: " + response.data.message, "error");
        }
      } catch (error) {
        console.error("Lỗi khi hủy đơn:", error);
        showAlert("Không thể kết nối đến máy chủ để hủy đơn!", "error");
      } finally {
        // Xóa trạng thái xử lý sau khi hoàn tất API call
        setProcessingId(null);
      }
    });
  };

  // Hủy một món ăn cụ thể trong đơn hàng (Hủy lẻ)
  const handleCancelOrderDetail = async (orderId, orderDetailId, dishName) => {
    if (!hasPermission('process_orders')) {
      return showAlert("Tài khoản của bạn đã bị giới hạn, không có quyền hủy món ăn!", "warning");
    }

    showConfirm(`Bạn có chắc chắn muốn hủy món "${dishName}" này không?`, async () => {
      try {
        // Đánh dấu chi tiết món ăn cụ thể đang thực hiện hủy lẻ
        setProcessingId('detail-' + orderDetailId);
        const response = await axios.post(`${API_URL}/orders/cancelOrder`, {
          order_id: orderId,
          order_detail_id: orderDetailId
        });

        if (response.data.success) {
          fetchPendingOrders();
        } else {
          showAlert("Lỗi từ server: " + response.data.message, "error");
        }
      } catch (error) {
        console.error("Lỗi khi hủy món riêng biệt:", error);
        showAlert("Không thể kết nối đến máy chủ để hủy món!", "error");
      } finally {
        // Xóa trạng thái xử lý sau khi hoàn tất API call
        setProcessingId(null);
      }
    });
  };

  return (
    <div className="min-h-screen bg-culinaryBg text-neutralCustom font-sans overflow-hidden flex">
      <main className="flex-1 relative overflow-y-auto custom-scrollbar">

        {/* Thanh Header của nhân viên */}
        <StaffHeader
          title="Bếp & Đồ Ăn"
          subtitle="Hệ thống quản lý"
          notifications={notifications}
          onDismissNotification={(index) => setNotifications(prev => prev.filter((_, i) => i !== index))}
          onClearAllNotifications={() => setNotifications([])}
          defaultNotifyText="có đơn món mới!"
        />

        {/* Danh sách các Order được chia theo Grid */}
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {orders.length === 0 && <p className="text-gray-500 italic col-span-full">Hiện tại không có order nào đang chờ...</p>}

          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-neutralCustom/20 rounded-xl shadow-sm overflow-hidden border-t-4 border-t-tertiary flex flex-col">

              {/* HEADER CỦA ORDER BOX (Số bàn/Mang đi & Nút HỦY TOÀN BỘ ĐƠN) */}
              <div className="p-5 flex justify-between items-start bg-culinaryBg">
                <div>
                  <p className="text-[10px] font-bold text-neutralCustom uppercase">
                    {order.dining_sessions?.tables?.name || 'Mang đi'} • #{String(order.id).slice(0, 4)}
                  </p>
                  <h3 className="font-bold text-lg text-gray-900">Order mới</h3>
                </div>

                {/* Nút hủy toàn bộ đơn (Bị vô hiệu hóa khi đang chạy tác vụ hoặc không đủ quyền) */}
                <button
                  onClick={() => handleCancelOrder(order.id)}
                  disabled={!!processingId || !hasPermission('process_orders')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-colors flex items-center gap-1 shadow-sm
                    ${hasPermission('process_orders')
                      ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'}`}
                  title={hasPermission('process_orders') ? "Hủy toàn bộ đơn này" : "Tài khoản bị giới hạn quyền hủy đơn"}
                >
                  <span className="material-symbols-outlined text-[14px]">cancel</span> HỦY
                </button>
              </div>

              {/* THÂN BOX: Danh sách các món lẻ của đơn */}
              <div className="p-5 space-y-3">
                {/* Lặp qua danh sách chi tiết các món trong đơn hàng */}
                {order.order_details?.map((detail, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-neutralCustom/10 pb-2 last:border-0">
                    <div className="flex gap-3 font-semibold text-primary">
                      {/* Nếu món đã bị hủy, hiển thị số lượng với kiểu gạch ngang chữ mờ */}
                      <span className={detail.status === 'cancelled' ? 'text-gray-400 line-through' : ''}>
                        {String(detail.quantity).padStart(2, '0')}
                      </span>
                      <div className="flex flex-col">
                        {/* Nếu món đã bị hủy, hiển thị tên món với kiểu gạch ngang chữ mờ */}
                        <span className={`text-gray-900 ${detail.status === 'cancelled' ? 'text-gray-400 line-through' : ''}`}>
                          {detail.dishes?.name}
                        </span>
                        {/* Hiện ghi chú nếu khách có dặn dò */}
                        {detail.note && <span className="text-xs text-red-500 italic font-normal">*{detail.note}</span>}
                        {/* Hiện nhãn đã hủy màu đỏ nếu món này bị hủy lẻ */}
                        {detail.status === 'cancelled' && (
                          <span className="text-[10px] text-red-500 font-bold bg-red-50 border border-red-200 px-1.5 py-0.5 rounded w-max mt-1">
                            Đã hủy
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Nút xem công thức chế biến */}
                      <button
                        onClick={() => handleViewRecipe(detail.dish_id, detail.dishes?.name)}
                        disabled={!hasPermission('view_recipes')}
                        className={`p-1.5 rounded-lg transition-all
                          ${hasPermission('view_recipes')
                            ? 'text-neutralCustom hover:text-primary hover:bg-primary/10 cursor-pointer'
                            : 'text-gray-300 cursor-not-allowed opacity-40'}`}
                        title={hasPermission('view_recipes') ? "Xem công thức chi tiết" : "Tài khoản không được cấp quyền xem công thức"}
                      >
                        <span className="material-symbols-outlined text-[18px]">menu_book</span>
                      </button>

                      {/* Nút hủy món riêng biệt (chỉ hiển thị khi món chưa bị hủy) */}
                      {detail.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancelOrderDetail(order.id, detail.id, detail.dishes?.name)}
                          disabled={!!processingId || !hasPermission('process_orders')}
                          className={`p-1.5 rounded-lg transition-all
                            ${hasPermission('process_orders')
                              ? 'text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer'
                              : 'text-gray-300 cursor-not-allowed opacity-40'}`}
                          title={hasPermission('process_orders') ? "Hủy món này" : "Tài khoản không được cấp quyền hủy món"}
                        >
                          <span className="material-symbols-outlined text-[18px]">cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* THÔNG BÁO HẠN CHẾ: Hiện cảnh báo nhỏ trong thẻ nếu tài khoản bị khóa quyền */}
              {!hasPermission('process_orders') && (
                <div className="mx-5 mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-600 font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">gpp_maybe</span>
                  Tài khoản bị giới hạn quyền xử lý đơn này.
                </div>
              )}

              {/* NÚT HOÀN THÀNH CHẾ BIẾN CỦA ĐƠN HÀNG */}
              <div className="p-5 pt-0">
                {/* Nút Hoàn thành chế biến đơn hàng (Khóa khi có tác vụ bất kỳ đang chạy, chỉ đổi chữ sang 'ĐANG XỬ LÝ...' khi chính nút này được nhấn) */}
                <button
                  onClick={() => handleCompleteOrder(order.id)}
                  disabled={!!processingId || !hasPermission('process_orders')}
                  className={`w-full py-3 rounded-xl font-bold transition-all shadow-md text-sm
                    ${hasPermission('process_orders')
                      ? 'bg-primary text-white hover:bg-secondary active:scale-[0.98] cursor-pointer'
                      : 'bg-gray-150 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'}`}
                >
                  {processingId === 'complete-' + order.id ? 'ĐANG XỬ LÝ...' : hasPermission('process_orders') ? 'HOÀN THÀNH CHẾ BIẾN' : 'HẠN CHẾ QUYỀN CHẾ BIẾN'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL XEM CÔNG THỨC */}
        {isRecipeOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Lớp phủ làm mờ nền */}
            <div
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
              onClick={toggleRecipe}
            ></div>

            {/* Khung modal chi tiết công thức */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden transform transition-all border border-neutralCustom/20">
              <div className="p-6 border-b border-neutralCustom/20 flex justify-between items-center bg-culinaryBg">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Công thức chi tiết
                  </h3>
                  <p className="text-primary font-bold mt-1">
                    {currentRecipe.dishName}
                  </p>
                </div>
                <button
                  className="material-symbols-outlined text-neutralCustom hover:bg-neutralCustom/10 p-2 rounded-full transition-colors"
                  onClick={toggleRecipe}
                >
                  close
                </button>
              </div>

              {/* Danh sách định lượng nguyên liệu cần chuẩn bị */}
              <div className="p-6 overflow-y-auto max-h-[60vh] bg-white">
                {currentRecipe.details && currentRecipe.details.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-neutralCustom uppercase tracking-wider border-b border-neutralCustom/20 pb-2 mb-4">
                      <span>Nguyên liệu</span>
                      <span>Định lượng</span>
                    </div>

                    {currentRecipe.details.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-culinaryBg/40 rounded-xl border border-neutralCustom/10 hover:bg-culinaryBg/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary/70">kitchen</span>
                          <span className="font-bold text-gray-900">
                            {item.ingredients?.name || 'Nguyên liệu không xác định'}
                          </span>
                        </div>
                        <div className="font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                          {item.amount_required} {item.ingredients?.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <span className="material-symbols-outlined text-5xl text-neutralCustom/30 mb-3">
                      restaurant_menu
                    </span>
                    <p className="text-neutralCustom font-medium">Món ăn này chưa có công thức.</p>
                  </div>
                )}
              </div>

              <div className="p-5 bg-culinaryBg border-t border-neutralCustom/20 flex justify-end">
                <button
                  onClick={toggleRecipe}
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-secondary active:scale-95 transition-all"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Hộp thoại thông báo tùy chỉnh (Custom Dialog) */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={closeDialog}></div>
          <div className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-neutralCustom/10 text-center animate-scale-up z-[130]">
            
            {/* Vòng tròn hiển thị Icon tương ứng với loại Dialog */}
            <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center border border-neutralCustom/10">
              {dialog.type === 'success' && (
                <span className="material-symbols-outlined text-4xl text-green-500 bg-green-50 w-full h-full rounded-full flex items-center justify-center">check_circle</span>
              )}
              {dialog.type === 'error' && (
                <span className="material-symbols-outlined text-4xl text-red-500 bg-red-50 w-full h-full rounded-full flex items-center justify-center">error</span>
              )}
              {dialog.type === 'warning' && (
                <span className="material-symbols-outlined text-4xl text-amber-500 bg-amber-50 w-full h-full rounded-full flex items-center justify-center">warning</span>
              )}
              {dialog.type === 'info' && (
                <span className="material-symbols-outlined text-4xl text-blue-500 bg-blue-50 w-full h-full rounded-full flex items-center justify-center">info</span>
              )}
              {dialog.type === 'confirm' && (
                <span className="material-symbols-outlined text-4xl text-primary bg-primary/10 w-full h-full rounded-full flex items-center justify-center">help</span>
              )}
            </div>
            
            <h3 className="text-lg font-black text-gray-900 mb-2">{dialog.title}</h3>
            <p className="text-sm text-neutralCustom mb-6 whitespace-pre-line leading-relaxed">{dialog.message}</p>
            
            {/* Các nút hành động của Dialog (Hủy bỏ / Xác nhận hoặc nút Đồng ý đơn giản) */}
            <div className="flex gap-3 justify-center">
              {dialog.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => {
                      if (dialog.onCancel) dialog.onCancel();
                      closeDialog();
                    }}
                    className="w-1/2 py-2.5 border border-neutralCustom/20 text-neutralCustom bg-white font-bold text-sm rounded-xl hover:bg-stone-50 transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={() => {
                      if (dialog.onConfirm) dialog.onConfirm();
                      closeDialog();
                    }}
                    className="w-1/2 py-2.5 bg-primary text-white font-black text-sm rounded-xl hover:bg-secondary transition-all cursor-pointer shadow-md shadow-primary/10"
                  >
                    Xác nhận
                  </button>
                </>
              ) : (
                <button
                  onClick={closeDialog}
                  className="px-8 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-secondary transition-all cursor-pointer shadow-md shadow-primary/10"
                >
                  Đồng ý
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;