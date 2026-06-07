import React from 'react';

const CartItem = ({ item, onIncrease, onDecrease, onRemove, onNoteChange }) => {
  return (
    <div className="bg-white border border-neutralCustom/20 rounded-xl p-4 shadow-sm mb-4 transition-all">
      <div className="flex gap-4">
        {/* Ảnh món ăn */}
        <img 
          className="w-20 h-20 rounded-lg object-cover" 
          src={item.image} 
          alt={item.name} 
        />
        
        <div className="flex-1">
          {/* Tên và Giá */}
          <div className="flex justify-between items-start">
            <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
            <span className="text-base font-semibold text-primary">
            </span>
          </div>
          
          {/* Khu vực điều khiển: Cộng/Trừ và Xóa */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4 bg-culinaryBg rounded-lg px-3 py-1">
              <button 
                onClick={() => onDecrease(item.id)}
                className="text-primary hover:bg-gray-200 rounded transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">remove</span>
              </button>
              <span className="font-bold text-gray-900 text-sm">{item.quantity}</span>
              <button 
                onClick={() => onIncrease(item.id)}
                className="text-primary hover:bg-gray-200 rounded transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            </div>
            
            {/* Nút thùng rác để xóa món khỏi giỏ */}
            <button 
              onClick={() => onRemove(item.id)}
              className="text-neutralCustom hover:text-red-600 transition-colors"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Ô nhập ghi chú */}
      <div className="mt-4 flex items-center gap-2 bg-culinaryBg rounded-lg px-3 py-2 border border-neutralCustom/10">
        <span className="material-symbols-outlined text-sm text-neutralCustom">edit_note</span>
        <input 
          className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-neutralCustom/60 text-gray-900 outline-none p-0" 
          placeholder="Ghi chú: Không hành, ít đá..." 
          type="text" 
          value={item.note}
          onChange={(e) => onNoteChange(item.id, e.target.value)}
        />
      </div>
    </div>
  );
};

export default CartItem;