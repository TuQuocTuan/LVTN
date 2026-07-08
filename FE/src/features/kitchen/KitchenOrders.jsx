import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../../config/supabase';
import StaffHeader from '../../components/layout/Staff/StaffHeader';
import { listenDatabaseChanges } from '../../utils/realtimeHelper';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState({ dishName: '', details: [] });
  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);

  const [userRole, setUserRole] = useState('');
  const [userPermissions, setUserPermissions] = useState({});

  // Xử lý âm thanh thông báo
  const audio = new Audio('/Chinese Meme Ringtone Download.mp3');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role?.toString().trim().toLowerCase());

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

  // Hàm kiểm tra quyền thao tác (Super Admin mặc định được làm mọi thứ)
  const hasPermission = (permissionKey) => {
    if (userRole === 'super_admin') return true;
    return !!userPermissions[permissionKey];
  };


  //  Hàm lấy danh sách order đang chờ
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

  // Lắng nghe Realtime Bếp
  useEffect(() => {
    fetchPendingOrders();

    const channel = listenDatabaseChanges('kitchen-realtime', 'orders', 'INSERT', (payload) => {
      audio.play().catch(err => console.log(err));

      const newNotification = {
        tableName: `Mã đơn #${String(payload.new.id).slice(0, 4)}`,
        time: new Date().toLocaleTimeString(),
        type: 'new_order',
        message: 'Vừa có order mới cần chế biến!'
      };
      setNotifications(prev => [newNotification, ...prev]);
      setTimeout(() => fetchPendingOrders(), 500);
    });

    return () => supabase.removeChannel(channel); // Cleanup
  }, []);

  // Hàm xem công thức món ăn
  const handleViewRecipe = async (dishId, dishName) => {
    if (!hasPermission('view_recipes')) {
      return alert("Tài khoản của bạn đã bị giới hạn, không có quyền xem công thức!");
    }

    if (!dishId) {
      alert("Thiếu ID món ăn để xem công thức!");
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
      alert('Món này chưa có công thức hoặc có lỗi xảy ra!');
    }
  };

  const toggleRecipe = () => setIsRecipeOpen(!isRecipeOpen);

  // Hàm hoàn thành đơn hàng
  const handleCompleteOrder = async (orderId) => {
    if (!hasPermission('process_orders')) {
      return alert("Tài khoản của bạn đã bị giới hạn, không có quyền thay đổi trạng thái món ăn!");
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/orders/completeOrder`, {
        order_id: orderId
      });

      if (response.data.success) {
        fetchPendingOrders();
      } else {
        alert("Lỗi từ server: " + response.data.message);
      }
    } catch (error) {
      console.error("Lỗi hoàn thành đơn:", error);
      alert("Không thể kết nối đến máy chủ để hoàn thành đơn!");
    } finally {
      setLoading(false);
    }
  };

  // Hàm huỷ đơn hàng
  const handleCancelOrder = async (orderId) => {
    if (!hasPermission('process_orders')) {
      return alert("Tài khoản của bạn đã bị giới hạn, không có quyền thay đổi trạng thái món ăn!");
    }

    if (!window.confirm("Bếp đã hết nguyên liệu hoặc muốn từ chối làm order này?")) return;

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/orders/cancelOrder`, {
        order_id: orderId
      });

      if (response.data.success) {
        fetchPendingOrders();
      } else {
        alert("Lỗi từ server: " + response.data.message);
      }
    } catch (error) {
      console.error("Lỗi khi hủy đơn:", error);
      alert("Không thể kết nối đến máy chủ để hủy đơn!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-culinaryBg text-neutralCustom font-sans overflow-hidden flex">
      <main className="flex-1 relative">

        {/* Header */}
        <StaffHeader
          title="Bếp & Đồ Ăn"
          subtitle="Hệ thống quản lý"
          userName="Đầu Bếp Nguyễn"
          userRole="Bếp trưởng"
          notifications={notifications}
          onDismissNotification={(index) => setNotifications(prev => prev.filter((_, i) => i !== index))}
          onClearAllNotifications={() => setNotifications([])}
          defaultNotifyText="có đơn món mới!"
        />

        {/* Danh sách Order */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.length === 0 && <p className="text-gray-500 italic col-span-full">Hiện tại không có order nào đang chờ...</p>}

          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-neutralCustom/20 rounded-xl shadow-sm overflow-hidden border-t-4 border-t-tertiary flex flex-col">

              {/* HEADER GỒM TIÊU ĐỀ VÀ NÚT HỦY GÓC TRÊN PHẢI */}
              <div className="p-5 flex justify-between items-start bg-culinaryBg">
                <div>
                  <p className="text-[10px] font-bold text-neutralCustom uppercase">
                    {order.dining_sessions?.tables?.name || 'Mang đi'} • #{String(order.id).slice(0, 4)}
                  </p>
                  <h3 className="font-bold text-lg text-gray-900">Order mới</h3>
                </div>

                <button
                  onClick={() => handleCancelOrder(order.id)}
                  disabled={loading || !hasPermission('process_orders')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-colors flex items-center gap-1 shadow-sm
                    ${hasPermission('process_orders')
                      ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'}`}
                  title={hasPermission('process_orders') ? "Hủy toàn bộ đơn này" : "Tài khoản bị giới hạn quyền hủy đơn"}
                >
                  <span className="material-symbols-outlined text-[14px]">cancel</span> HỦY
                </button>
              </div>

              <div className="p-5 space-y-3">
                {order.order_details?.map((detail, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-neutralCustom/10 pb-2 last:border-0">
                    <div className="flex gap-3 font-semibold text-primary">
                      <span>{String(detail.quantity).padStart(2, '0')}</span>
                      <div className="flex flex-col">
                        <span className="text-gray-900">{detail.dishes?.name}</span>
                        {/* Hiện ghi chú nếu khách có dặn dò */}
                        {detail.note && <span className="text-xs text-red-500 italic font-normal">*{detail.note}</span>}
                      </div>
                    </div>

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

              <div className="p-5 pt-0">
                <button
                  onClick={() => handleCompleteOrder(order.id)}
                  disabled={loading || !hasPermission('process_orders')}
                  className={`w-full py-3 rounded-xl font-bold transition-all shadow-md text-sm
                    ${hasPermission('process_orders')
                      ? 'bg-primary text-white hover:bg-secondary active:scale-[0.98] cursor-pointer'
                      : 'bg-gray-150 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'}`}
                >
                  {loading ? 'ĐANG XỬ LÝ...' : hasPermission('process_orders') ? 'HOÀN THÀNH CHẾ BIẾN' : 'HẠN CHẾ QUYỀN CHẾ BIẾN'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL XEM CÔNG THỨC */}
        {isRecipeOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
              onClick={toggleRecipe}
            ></div>

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
    </div>
  );
};

export default KitchenDashboard;