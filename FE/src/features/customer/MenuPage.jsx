import React, { useState } from 'react';
import CustomerLayout from '../../components/layout/CustomerLayout';
import MenuItemCard from '../../components/layout/MenuItemCard';

// DATA MỚI: Đã bổ sung thuộc tính "category" và thêm các món cho đủ danh mục
const initialMenuItems = [
  // --- KHAI VỊ ---
  { id: 1, name: 'Gỏi Cuốn', price: '45.000đ', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBofR7UloycBL8cykNjqbvSgJRZKnjKNhIwhn-9gbaJgazvQ1ZabmR-cTTvKvz3GY1DKOdW7CIWJkyCPGpZNotwibDGaJV8yniLaIqvM-951WgHUXQSYmNsN9fkam2-3sSSkFZl-nOHl428ygudjrk10qvOVnPbDo8ET0ZUGDs4I1O1YzSdLUEpnCgt06ujTANMPv3PQizqYh_YIAbEKP_zE583UNGfO4NNh5b0VYzeO8e0u6E3eZUzYR0iXP4y4R4pVJL5zqQbyN0', quantity: 0, isAvailable: true, category: 'KHAI VỊ' },
  { id: 2, name: 'Nem Rán', price: '55.000đ', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD51VKW_zMlu0RqxyMJH0mnsCJgi1ClFYVCQ-HgwVmhwSCR_fWLivuB9Yn2zv_-yJBAsU0M-XLKerkOjALs0vPmcpQGAzDgQX7O8Uc4lK6zq6f8OLL85sYau63FAH_eDlNcJAhp8R165TnNceHX6WadTY96oxgHTAALoqWtsG82qKn_WFIMnWbvj5t-bsK_5E3jJsndmykwhcyjz0eH2e7z4Ggu-O1G_ky-WWsN_XmiO7YNzZXqXL2BvQv9wx7IoQTloQljoYKjg2Q', quantity: 0, isAvailable: false, category: 'KHAI VỊ' },
  
  // --- MÓN CHÍNH ---
  { id: 3, name: 'Phở Bò', price: '65.000đ', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCb5_qHHyMW2RVemQJO9B6T4IyHhdeySlyChhfpIgTqgYOhORuCpUrJv1XuoYVEC38ehZXnZWv5Q2yG9TaWLiCzNB088qsvI5F9kXDBIu1xR5kpDIdAPF_ZemNI-4aRb5jOLw7TBU8NsFJYZKv5X8C_VlaOTzcZ1tgHTfZURXTGlqhHl9jmJ6RjfoNqYGqA5CC37CXge-o62vRwInuW70tE4O0qVzTRfgqGq8G0y8ntIHVF8WcrqHZhi7DaP_h9_Y4pqjKjwAEQRbQ', quantity: 1, isAvailable: true, category: 'MÓN CHÍNH' },
  { id: 4, name: 'Bánh Xèo', price: '75.000đ', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD91oZJ0EV1Et89JlGGJ-9GfVO2-g7DF_5sXU1C52wG5NcfegIXZH7_4OY8frCsvzBqAKFZkLchGxxA6hjfv_2F6JUQtG0k2_3cMFf7F2kYwZPAsqLhA3Oi6mqvEh6FJI_UQAoyhLCSJIgxjav2dtU62iqvAel_d4mIuu0IwhDN-XwYjAgS3Bwg8o_7_zDQrXcq8n7PD0r8Py9oya5X9DS97bCE7hZ109DHswCy4YxeDk56Z9hehv69W2QoFLMzJiFjGrBq2cfP6TQ', quantity: 2, isAvailable: true, category: 'MÓN CHÍNH' },
  { id: 5, name: 'Bánh Mì Kẹp', price: '35.000đ', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCx1xvwqiz5k5LtsXiRt3iaiGRftvoL7yIFMVsIM8dy9hskZBtcIrUnLPpt9Ksm-dBcyuXuO5ITNZgHNz5Q7aLUFmXNbFWAo33erCgllSv2YQMjgrcgzu9qs0MHMJqSwXDiP1Uy5aTAGoSU4vRvB9rIBrJV7IYo0L7I5M68MTMTeLiGst9gIQebBAAMftFZEEgCzVs3kl50Mk_x1U8xZJSD_UpT1F9Q_ViV-MHYsLEKC5yZQDyR_0P1MPPJi94ahxu-7hHzvi3RUW0', quantity: 0, isAvailable: true, category: 'MÓN CHÍNH' },
  
  // --- ĐỒ UỐNG ---
  { id: 6, name: 'Trà Sữa', price: '45.000đ', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCosiDF-ZJJQ8qhjqiQeZe3IbNSFvwfpUtXxuJQvKWBxhv9N0g_HTuWZS2gnaROUZlVOfmnXfiZgD66m1TOmT0SYAG2LZTWplymNEzajZnobdn0Pg7llA9IMe-tf7zlXSjo3Ctf__6xyjm2IwuitBvIXOFhhK6HnEYCGczig0AdSNP3veoYZCrwUjdpW_0upWGxmvGjWK0__DbwJ6yK6VmArWw7HxNXHlbKZazl1t0pr88rCqkJA9YR7ax-cifeTDx4HLZTg2D1pp0', quantity: 0, isAvailable: true, category: 'ĐỒ UỐNG' },
  { id: 7, name: 'Cà Phê Sữa', price: '29.000đ', image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=500&q=80', quantity: 0, isAvailable: true, category: 'ĐỒ UỐNG' },
  
  // --- TRÁNG MIỆNG ---
  { id: 8, name: 'Bánh Flan', price: '20.000đ', image: 'https://images.unsplash.com/photo-1590137876181-2a5a7e340308?w=500&q=80', quantity: 0, isAvailable: true, category: 'TRÁNG MIỆNG' },
];

const categories = ['KHAI VỊ', 'MÓN CHÍNH', 'ĐỒ UỐNG', 'TRÁNG MIỆNG'];

const MenuPage = () => {
  const [activeCategory, setActiveCategory] = useState('KHAI VỊ');
  const [menuItems, setMenuItems] = useState(initialMenuItems);

  // Logic Tăng/Giảm số lượng
  const handleIncrease = (id) => {
    setMenuItems((prevItems) => prevItems.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  };

  const handleDecrease = (id) => {
    setMenuItems((prevItems) => prevItems.map((item) => item.id === id && item.quantity > 0 ? { ...item, quantity: item.quantity - 1 } : item));
  };

  // LOGIC MỚI: Lọc danh sách món ăn dựa trên danh mục đang chọn
  const displayedItems = menuItems.filter(item => item.category === activeCategory);

  return (
    <CustomerLayout>
      {/* THANH TABS DANH MỤC */}
      <div className="flex overflow-x-auto no-scrollbar gap-6 px-4 py-4 sticky top-16 bg-culinaryBg z-40">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`flex-shrink-0 text-xs font-bold uppercase pb-1 border-b-2 transition-colors ${
              activeCategory === category ? 'border-primary text-primary' : 'border-transparent text-neutralCustom'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* LƯỚI DANH SÁCH MÓN ĂN */}
      <section className="px-4 grid grid-cols-2 gap-4 pb-8">
        {displayedItems.length > 0 ? (
          displayedItems.map((item) => (
            <MenuItemCard 
              key={item.id} 
              item={item} 
              onIncrease={handleIncrease} 
              onDecrease={handleDecrease} 
            />
          ))
        ) : (
          <p className="col-span-2 text-center text-neutralCustom mt-10 text-sm">
            Chưa có món ăn nào trong danh mục này.
          </p>
        )}
      </section>
    </CustomerLayout>
  );
};

export default MenuPage;