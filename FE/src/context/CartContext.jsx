import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tự động gọi API lấy Danh mục và Món ăn ngay khi ứng dụng khởi chạy
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setIsLoading(true);
        const [catRes, dishRes] = await Promise.all([
          fetch('http://localhost:5000/api/categories'),
          fetch('http://localhost:5000/api/dishes')
        ]);

        const catData = await catRes.json();
        const dishData = await dishRes.json();

        // 1. Xử lý & Sắp xếp Danh mục (Món chính lên đầu, Đồ uống xuống cuối)
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

        // 2. Định dạng lại danh sách món ăn từ database, tích hợp quantity và note
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

  // --- CÁC HÀM ĐIỀU KHIỂN GIỎ HÀNG TOÀN CỤC ---
  const handleIncrease = (id) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  };

  const handleDecrease = (id) => {
    setMenuItems(prev => prev.map(item => item.id === id && item.quantity > 0 ? { ...item, quantity: item.quantity - 1 } : item));
  };

  const handleRemove = (id) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, quantity: 0, note: '' } : item));
  };

  const handleNoteChange = (id, newNote) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, note: newNote } : item));
  };

  const clearCart = () => {
    setMenuItems(prev => prev.map(item => ({ ...item, quantity: 0, note: '' })));
  };

  // Lọc tự động: Món nào có số lượng lớn hơn 0 thì chính là item nằm trong giỏ hàng
  const cartItems = menuItems.filter(item => item.quantity > 0);
  
  // Tính tổng số lượng item để hiển thị lên icon quả bóng Giỏ hàng ở Header
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
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
export const useCart = () => useContext(CartContext);