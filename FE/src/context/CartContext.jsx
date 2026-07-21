import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { listenDatabaseChanges } from '../utils/realtimeHelper';

// Khởi tạo Context để quản lý trạng thái giỏ hàng và danh sách món ăn toàn cục
const CartContext = createContext();

// Component cung cấp trạng thái giỏ hàng và các hàm thao tác cho toàn bộ ứng dụng
export const CartProvider = ({ children }) => {
  // Trạng thái lưu trữ danh sách các món ăn từ cơ sở dữ liệu
  const [menuItems, setMenuItems] = useState([]);
  
  // Trạng thái lưu trữ danh sách danh mục món ăn đã được sắp xếp
  const [categories, setCategories] = useState([]);
  
  // Trạng thái chờ tải dữ liệu món ăn và danh mục từ Backend
  const [isLoading, setIsLoading] = useState(true);

  // Tự động gọi API lấy Danh mục và Món ăn ngay khi ứng dụng khởi chạy
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setIsLoading(true);
        const [catRes, dishRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/categories`),
          fetch(`${import.meta.env.VITE_API_URL}/dishes`)
        ]);

        const catData = await catRes.json();
        const dishData = await dishRes.json();

        // Xử lý & Sắp xếp Danh mục (Món chính lên đầu, Đồ uống xuống cuối)
        if (catData && catData.length > 0) {
          let categoryNames = catData.map(c => c.name.toUpperCase());
          categoryNames.sort((a, b) => {
            const getPriority = (name) => {
              if (name === 'MÓN CHÍNH') return 1;
              if (name === 'ĐỒ UỐNG') return 100;
              return 50;
            };
            return getPriority(a) - getPriority(b);
          });
          setCategories(categoryNames);
        }

        // Định dạng lại danh sách món ăn từ database, tích hợp quantity và note
        if (dishData.success && dishData.data) {
          const formattedDishes = dishData.data.map(dish => ({
            id: dish.id,
            name: dish.name,
            price: `${dish.price.toLocaleString('vi-VN')}đ`,
            rawPrice: dish.price, // Giữ lại giá số nguyên để tính toán hóa đơn
            image: dish.image_url,
            quantity: 0, // Số lượng mặc định lúc chưa chọn
            note: '',    // Ghi chú mặc định cho từng món
            isAvailable: dish.status === 'available',
            category: dish.categories?.name?.toUpperCase() || 'KHÁC'
          }));
          setMenuItems(formattedDishes);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu hệ thống:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  // Đăng ký lắng nghe sự thay đổi trạng thái món ăn thời gian thực từ Supabase Realtime
  useEffect(() => {
    const channel = listenDatabaseChanges('menu-public-realtime', 'dishes', 'UPDATE', (payload) => {

      const updatedDish = payload.new;

      setMenuItems(prev => prev.map(item => {
        if (item.id === updatedDish.id) {
          const isNowAvailable = updatedDish.status === 'available';

          return {
            ...item,
            isAvailable: isNowAvailable,
            // Tự động ép giỏ hàng về 0 nếu món đó vừa bị chuyển thành hết hàng
            quantity: isNowAvailable ? item.quantity : 0,
            note: isNowAvailable ? item.note : ''
          };
        }
        return item;
      }));
    });

    // Dọn dẹp channel khi khách thoát trang Menu
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Tăng số lượng của một món ăn cụ thể trong giỏ hàng lên 1 đơn vị
  const handleIncrease = (id) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  };

  // Giảm số lượng của một món ăn cụ thể trong giỏ hàng đi 1 đơn vị
  const handleDecrease = (id) => {
    setMenuItems(prev => prev.map(item => item.id === id && item.quantity > 0 ? { ...item, quantity: item.quantity - 1 } : item));
  };

  // Xóa hoàn toàn một món ăn khỏi giỏ hàng (đặt số lượng về 0 và reset ghi chú)
  const handleRemove = (id) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, quantity: 0, note: '' } : item));
  };

  // Cập nhật nội dung ghi chú (VD: ít cay, nhiều đá) cho từng món ăn
  const handleNoteChange = (id, newNote) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, note: newNote } : item));
  };

  // Đặt lại số lượng của tất cả các món ăn trong giỏ hàng về 0 để làm sạch giỏ hàng
  const clearCart = () => {
    setMenuItems(prev => prev.map(item => ({ ...item, quantity: 0, note: '' })));
  };

  // Đặt trực tiếp số lượng cụ thể cho một món ăn trong giỏ hàng
  const handleSetQuantity = (id, quantity) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, quantity: quantity } : item));
  };

  // Trích xuất danh sách các món ăn đang được chọn (có số lượng lớn hơn 0)
  const cartItems = menuItems.filter(item => item.quantity > 0);

  // Tính tổng số lượng tất cả các món trong giỏ để hiển thị huy hiệu (badge) thông báo
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      menuItems,
      categories,
      cartItems,
      totalItems,
      isLoading,
      handleIncrease,
      handleDecrease,
      handleRemove,
      handleNoteChange,
      clearCart,
      handleSetQuantity
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;

// Hook tiện ích giúp các component con dễ dàng truy cập và sử dụng CartContext
export const useCart = () => useContext(CartContext);