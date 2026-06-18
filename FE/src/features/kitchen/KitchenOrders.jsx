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
  
  // Xử lý âm thanh thông báo
  const audio = new Audio('/Chinese Meme Ringtone Download.mp3');

  // 1. Hàm lấy danh sách order đang chờ
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
        tableName: `Mã đơn #${String(payload.new.id).slice(0,4)}`, 
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

  // 4. Hàm hoàn thành đơn hàng
  const handleCompleteOrder = async (orderId) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/orders/completeOrder`, {
        order_id: orderId
      });

      if (response.data.success) {
        console.log("Đã hoàn thành order và trừ nguyên liệu thành công:", orderId);
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

  return (
    <div className="min-h-screen bg-culinaryBg text-neutralCustom font-sans overflow-hidden flex">
      {/* Đã sửa lỗi class ml- */}
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
            <div key={order.id} className="bg-white border border-neutralCustom/20 rounded-xl shadow-sm overflow-hidden border-t-4 border-t-tertiary">
              <div className="p-5 flex justify-between items-center bg-culinaryBg">
                <div>
                  <p className="text-[10px] font-bold text-neutralCustom uppercase">
                    {order.dining_sessions?.tables?.name || 'Mang đi'} • #{String(order.id).slice(0,4)}
                  </p>
                  <h3 className="font-bold text-lg text-gray-900">Order mới</h3>
                </div>
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
                      className="p-1.5 text-neutralCustom hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Xem công thức"
                    >
                      <span className="material-symbols-outlined text-[18px]">menu_book</span>
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="p-5 pt-0">
                <button 
                  onClick={() => handleCompleteOrder(order.id)}
                  disabled={loading}
                  className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 shadow-md"
                >
                  {loading ? 'ĐANG XỬ LÝ...' : 'HOÀN THÀNH'}
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