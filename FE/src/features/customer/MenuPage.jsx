import React, { useState, useEffect } from 'react';
import CustomerLayout from '../../components/layout/Customer/CustomerLayout';
import MenuItemCard from '../../components/layout/Customer/MenuItemCard';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';

const MenuPage = () => {
  // Rút dữ liệu và hàm thao tác từ CartContext ra thay vì tự viết
  const { menuItems, categories, isLoading, handleIncrease, handleDecrease } = useCart();
  const { t } = useLanguage();

  // State quản lý Tab đang được chọn trên giao diện
  const [activeCategory, setActiveCategory] = useState('');

  // Tự động chọn Tab danh mục đầu tiên (MÓN CHÍNH) khi dữ liệu tải xong
  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // Lọc danh sách món ăn theo danh mục đang xem
  const displayedItems = menuItems.filter(item => item.category === activeCategory);

  return (
    <CustomerLayout>
      {isLoading ? (
        // Giao diện chờ tải dữ liệu
        <div className="flex flex-col items-center justify-center h-64 mt-20">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl mb-4">progress_activity</span>
          <p className="text-neutralCustom font-bold text-sm animate-pulse">{t('loadingMenuPage')}</p>
        </div>
      ) : (
        <>
          {/* THANH TABS DANH MỤC */}
          <div className="flex overflow-x-auto no-scrollbar gap-6 px-4 py-4 sticky top-16 bg-culinaryBg z-40">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex-shrink-0 text-xs font-bold uppercase pb-1 border-b-2 transition-colors ${activeCategory === category ? 'border-primary text-primary' : 'border-transparent text-neutralCustom'
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
                {t('emptyMenu')}
              </p>
            )}
          </section>
        </>
      )}
    </CustomerLayout>
  );
};

export default MenuPage;