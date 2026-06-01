import React from 'react';

// Thông tin hiển thị của món ăn
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
      <img
        alt={item.name}
        src={item.image}
        className="w-full aspect-square object-cover"
      />

      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-1">
          {item.name}
        </h3>
        <p className="text-sm text-primary font-bold mb-3">{item.price}</p>

        {/* Nút điều khiển số lượng */}
        {item.isAvailable ? (
          <div className="mt-auto flex items-center justify-between bg-culinaryBg rounded-full p-1">
            <button
              onClick={() => onDecrease(item.id)}
              className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-neutralCustom shadow-sm active:bg-gray-100"
            >
              <span className="material-symbols-outlined text-lg">remove</span>
            </button>
            <span className="font-semibold text-sm">{item.quantity}</span>
            <button
              onClick={() => onIncrease(item.id)}
              className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full active:scale-90 transition-transform shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
          </div>
        ) : (
          <div className="mt-auto flex items-center justify-center py-2 bg-gray-100 rounded-full">
            <span className="text-[10px] font-bold uppercase text-neutralCustom">
              Tạm ngưng
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItemCard;