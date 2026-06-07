import React, { useState } from 'react';

const KitchenDashboard = () => {
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);

  const toggleRecipe = () => setIsRecipeOpen(!isRecipeOpen);

  return (
    <div className="min-h-screen bg-culinaryBg text-neutralCustom font-sans overflow-hidden flex">

      {/* Main Content */}
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

        {/* Content */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-neutralCustom/20 rounded-xl shadow-sm overflow-hidden border-t-4 border-t-tertiary">
            <div className="p-5 flex justify-between items-center bg-culinaryBg">
              <div>
                <p className="text-[10px] font-bold text-neutralCustom uppercase">BÀN 05 • #4282</p>
                <h3 className="font-bold text-lg">Order mới</h3>
              </div>
              <span className="text-tertiary font-bold">08:22</span>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex gap-3 font-semibold text-primary"><span>02</span><span>Phở Bò Đặc Biệt</span></div>
                <span className="material-symbols-outlined cursor-pointer hover:text-primary" onClick={toggleRecipe}>menu_book</span>
              </div>
            </div>
            <div className="p-5 pt-0"><button className="w-full py-2 bg-primary text-white rounded-lg font-bold hover:bg-secondary transition-colors">HOÀN THÀNH</button></div>
          </div>
        </div>

        {/* Drawer */}
        <div className={`fixed inset-0 z-50 transition-opacity ${isRecipeOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-neutralCustom/20 backdrop-blur-sm" onClick={toggleRecipe}></div>
          <div className={`w-full max-w-2xl bg-white h-full ml-auto shadow-2xl transition-transform ${isRecipeOpen ? 'translate-x-0' : 'translate-x-full'}`}>
             <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold text-primary">Phở Bò Đặc Biệt</h2>
                <button onClick={toggleRecipe}><span className="material-symbols-outlined">close</span></button>
             </div>
             <div className="p-6">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMPMk77GW-8o8X9-lZ1gwWMSxXSg9cllrx9Vf1wjpSjReYGooZo0FKsEFBA9Ar2-HvnRG7-5pw7_vGIXi29V33Z5hGQc00TfGGO3x-BBso1ibfRiNLqRJYuKVsLhvTCJmHfqsjNul7B4AcCyuLjHvYG08NNGUEEeiqkBbnlCHNTdbyR2I7gENG-YyJ1ld_Nlx4BrhbHC5Mc_8g5qOz0W28lnq_QbL0paaJk9PLIv1IP77HPOp7Pjqw2w6axphNbtZAsJM6V-n0tIY" className="rounded-xl w-full mb-4" alt="recipe" />
                <button onClick={toggleRecipe} className="w-full py-4 bg-primary text-white rounded-xl font-bold">ĐÓNG LẠI</button>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default KitchenDashboard;    