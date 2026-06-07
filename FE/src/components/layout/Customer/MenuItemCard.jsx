import React from 'react';

const MenuItemCard = ({ item, onIncrease, onDecrease }) => {
  return (
    <div
      className={`bg-white rounded-xl overflow-hidden shadow-sm border border-neutralCustom/20 flex flex-col transition-all active:scale-[0.98] ${
        !item.isAvailable ? 'opacity-60 grayscale-[0.5] relative' : ''
      }`}
    >
      {/* Lớp phủ khi hết hàng */}
      {!item.isAvailable && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <span className="bg-gray-900/80 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
            Hết hàng
          </span>
        </div>
      )}

      {/* Ảnh món ăn */}
      <div className="relative">
        <img
          alt={item.name}
          src={item.image}
          className="w-full aspect-square object-cover"
        />
        {/* Chấm tròn nhỏ góc phải báo hiệu món đã được thêm vào giỏ */}
        {item.quantity > 0 && (
          <span className="absolute top-2 right-2 bg-primary text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md animate-fade-in">
            {item.quantity}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-1 leading-tight">
          {item.name}
        </h3>
        <p className="text-sm text-primary font-bold mb-3">{item.price}</p>

        {/* LOGIC HIỂN THỊ NÚT THÔNG MINH */}
        {item.isAvailable ? (
          item.quantity === 0 ? (
            // 1. Nếu chưa chọn món -> Hiện nút "Đặt món"
            <button
              onClick={() => onIncrease(item.id)}
              className="mt-auto w-full py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-1 text-sm shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
              Đặt món
            </button>
          ) : (
            // 2. Nếu đã bấm đặt -> Hiện thanh tăng giảm số lượng
            <div className="mt-auto flex items-center justify-between bg-orange-50 border border-primary/20 rounded-lg p-1">
              <button
                onClick={() => onDecrease(item.id)}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-primary shadow-sm active:bg-gray-100"
              >
                <span className="material-symbols-outlined text-lg">remove</span>
              </button>
              <span className="font-bold text-sm text-primary">{item.quantity}</span>
              <button
                onClick={() => onIncrease(item.id)}
                className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-md active:scale-90 transition-transform shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">add</span>
              </button>
            </div>
          )
        ) : (
          <div className="mt-auto flex items-center justify-center py-2 bg-gray-100 rounded-lg">
            <span className="text-xs font-bold uppercase text-neutralCustom">
              Tạm ngưng
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItemCard;