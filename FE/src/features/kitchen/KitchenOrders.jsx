import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../../config/supabase';

const API_URL = import.meta.env.VITE_API_URL; 

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState({ dishName: '', details: [] });
  const [loading, setLoading] = useState(false);
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

  // Gọi API lấy dữ liệu lần đầu khi vào trang
  // Gọi API lấy dữ liệu lần đầu và lắng nghe Realtime
  useEffect(() => {
    // 1. Tải danh sách đơn khi vừa vào trang
    fetchPendingOrders();
    
    // 2. Kích hoạt "chuông báo" từ Supabase
    const orderSubscription = supabase
      .channel('kitchen-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', // Lắng nghe mọi hành động Thêm/Sửa/Xóa
          schema: 'public', 
          table: 'orders' // Lắng nghe trên bảng orders
        },
        (payload) => {
          console.log('Có order mới hoặc cập nhật từ Database:', payload);
          audio.play().catch(err => console.log(err));
          // Khi nghe chuông, chờ nửa giây (để DB lưu xong chi tiết món) rồi lấy danh sách mới
          setTimeout(() => {
            fetchPendingOrders(); 
          }, 500);
        }
      )
      .subscribe();

    // 3. Dọn dẹp bộ nhớ khi tắt giao diện Bếp
    return () => {
      supabase.removeChannel(orderSubscription);
    };
  }, []);

  // 3. Hàm xem công thức món ăn
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

  return (
    <div className="min-h-screen bg-culinaryBg text-neutralCustom font-sans overflow-hidden flex">
      <main className="flex-1 ml- relative">
        <header className="flex justify-between items-center h-16 px-8 bg-white border-b border-neutralCustom/20 sticky top-0 z-40">
          <div>
            <h1 className="text-lg font-bold text-primary leading-none">Bếp & Bàn</h1>
            <p className="text-xs text-neutralCustom opacity-70">Hệ thống quản lý</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-neutralCustom hover:text-primary"><span className="material-symbols-outlined">notifications</span></button>
            <div className="flex items-center gap-2 font-semibold text-primary">
              <span className="material-symbols-outlined">account_circle</span>
              <span>Bếp trưởng</span>
            </div>
          </div>
        </header>

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
                  <h3 className="font-bold text-lg">Order mới</h3>
                </div>
              </div>
              
              <div className="p-5 space-y-3">
                {order.order_details?.map((detail, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0">
                    <div className="flex gap-3 font-semibold text-primary">
                      <span>{String(detail.quantity).padStart(2, '0')}</span>
                      <div className="flex flex-col">
                        <span>{detail.dishes?.name}</span>
                        {/* Hiện ghi chú nếu khách có dặn dò */}
                        {detail.note && <span className="text-xs text-red-500 italic font-normal">*{detail.note}</span>}
                      </div>
                    </div>
                    <span 
                      className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors text-gray-400" 
                      onClick={() => handleViewRecipe(detail.dish_id, detail.dishes?.name)}
                      title="Xem công thức"
                    >
                      menu_book
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="p-5 pt-0">
                <button 
                  onClick={() => handleCompleteOrder(order.id)}
                  disabled={loading}
                  className="w-full py-2 bg-primary text-white rounded-lg font-bold hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  {loading ? 'ĐANG XỬ LÝ...' : 'HOÀN THÀNH'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Drawer xem công thức */}
        <div className={`fixed inset-0 z-50 transition-opacity ${isRecipeOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-neutralCustom/20 backdrop-blur-sm" onClick={toggleRecipe}></div>
          <div className={`w-full max-w-2xl bg-white h-full ml-auto shadow-2xl transition-transform ${isRecipeOpen ? 'translate-x-0' : 'translate-x-full'}`}>
             <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold text-primary">{currentRecipe.dishName}</h2>
                <button onClick={toggleRecipe}><span className="material-symbols-outlined">close</span></button>
             </div>
             
             <div className="p-6">
                <h3 className="font-bold text-lg mb-4">Thành phần nguyên liệu:</h3>
                {currentRecipe.details.length > 0 ? (
                  <ul className="space-y-3 mb-8">
                    {currentRecipe.details.map((item) => (
                      <li key={item.id} className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-700">{item.ingredients?.name}</span>
                        <span className="font-bold text-primary">{item.amount_required} {item.ingredients?.unit}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="italic text-gray-500 mb-8">Chưa có dữ liệu nguyên liệu.</p>
                )}
                
                <button onClick={toggleRecipe} className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90">
                  ĐÓNG LẠI
                </button>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default KitchenDashboard;