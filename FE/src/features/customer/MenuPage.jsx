import React, { useState } from 'react';
import { Utensils, ShoppingCart, Minus, Plus, BookOpen, Receipt, CreditCard } from 'lucide-react';

const MenuPage = () => {
    const [activeTab, setActiveTab] = useState('KHAI VỊ');
    const [quantities, setQuantities] = useState({ phoBo: 1, goiCuon: 0, banhXeo: 2 });

    const handleQty = (dish, type) => {
        setQuantities(p => ({ ...p, [dish]: type === 'add' ? p[dish] + 1 : Math.max(0, p[dish] - 1) }));
    };

    return (
        <div className="bg-[#fff4ef] min-h-screen pb-24 font-sans text-[#492505]">
            {/* 1. TOP BAR */}
            <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 py-2 bg-[#fff4ef] shadow-sm border-b border-[#daa176]">
                <div className="flex items-center gap-2">
                    <Utensils className="text-[#994100] w-6 h-6" />
                    <div>
                        <h1 className="text-xl font-bold text-[#994100]">Bàn 12</h1>
                        <span className="text-[10px] text-[#7e512d] uppercase font-bold">● Đã kết nối</span>
                    </div>
                </div>
                <div className="relative">
                    <ShoppingCart className="text-[#7e512d] w-7 h-7" />
                    <span className="absolute -top-1 -right-1 bg-[#ff7a26] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                        {Object.values(quantities).reduce((a, b) => a + b, 0)}
                    </span>
                </div>
            </header>

            {/* 2. CATEGORY TABS */}
            <main className="pt-14">
                <div className="flex gap-6 px-4 py-4 overflow-x-auto no-scrollbar sticky top-12 bg-[#fff4ef] z-40 border-b">
                    {['KHAI VỊ', 'MÓN CHÍNH', 'ĐỒ UỐNG', 'TRÁNG MIỆNG'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`text-xs font-bold pb-1 ${activeTab === tab ? 'border-b-2 border-[#994100] text-[#994100]' : 'text-[#7e512d]'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                {/* 3. MENU GRID */}
                <section className="px-4 grid grid-cols-2 gap-4 mt-4">
                    {/* Món 1: Phở Bò */}
                    <div className="bg-[#fff4ef] rounded-xl overflow-hidden border border-[#daa176] p-3 flex flex-col">
                        <img className="w-full aspect-square object-cover rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCb5_qHHyMW2RVemQJO9B6T4IyHhdeySlyChhfpIgTqgYOhORuCpUrJv1XuoYVEC38ehZXnZWv5Q2yG9TaWLiCzNB088qsvI5F9kXDBIu1xR5kpDIdAPF_ZemNI-4aRb5jOLw7TBU8NsFJYZKv5X8C_VlaOTzcZ1tgHTfZURXTGlqhHl9jmJ6RjfoNqYGqA5CC37CXge-o62vRwInuW70tE4O0qVzTRfgqGq8G0y8ntIHVF8WcrqHZhi7DaP_h9_Y4pqjKjwAEQRbQ" alt="" />
                        <h3 className="font-bold mt-2 text-sm">Phở Bò</h3>
                        <p className="text-sm text-[#994100] font-bold mb-2">65.000đ</p>
                        <div className="mt-auto flex items-center justify-between bg-[#ffede3] rounded-full p-1">
                            <button onClick={() => handleQty('phoBo', 'sub')} className="w-7 h-7 bg-[#ffe3d1] rounded-full flex justify-center items-center"><Minus className="w-4 h-4" /></button>
                            <span className="text-sm font-bold">{quantities.phoBo}</span>
                            <button onClick={() => handleQty('phoBo', 'add')} className="w-7 h-7 bg-[#994100] text-white rounded-full flex justify-center items-center"><Plus className="w-4 h-4" /></button>
                        </div>
                    </div>

                    {/* Món 2: Gỏi Cuốn */}
                    <div className="bg-[#fff4ef] rounded-xl overflow-hidden border border-[#daa176] p-3 flex flex-col">
                        <img className="w-full aspect-square object-cover rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBofR7UloycBL8cykNjqbvSgJRZKnjKNhIwhn-9gbaJgazvQ1ZabmR-cTTvKvz3GY1DKOdW7CIWJkyCPGpZNotwibDGaJV8yniLaIqvM-951WgHUXQSYmNsN9fkam2-3sSSkFZl-nOHl428ygudjrk10qvOVnPbDo8ET0ZUGDs4I1O1YzSdLUEpnCgt06ujTANMPv3PQizqYh_YIAbEKP_zE583UNGfO4NNh5b0VYzeO8e0u6E3eZUzYR0iXP4y4R4pVJL5zqQbyN0" alt="" />
                        <h3 className="font-bold mt-2 text-sm">Gỏi Cuốn</h3>
                        <p className="text-sm text-[#994100] font-bold mb-2">45.000đ</p>
                        <div className="mt-auto flex items-center justify-between bg-[#ffede3] rounded-full p-1">
                            <button onClick={() => handleQty('goiCuon', 'sub')} className="w-7 h-7 bg-[#ffe3d1] rounded-full flex justify-center items-center"><Minus className="w-4 h-4" /></button>
                            <span className="text-sm font-bold">{quantities.goiCuon}</span>
                            <button onClick={() => handleQty('goiCuon', 'add')} className="w-7 h-7 bg-[#994100] text-white rounded-full flex justify-center items-center"><Plus className="w-4 h-4" /></button>
                        </div>
                    </div>
                </section>
            </main>

            {/* 4. BOTTOM NAVIGATION */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-[#fff4ef] border-t border-[#daa176] shadow-md">
                <div className="flex flex-col items-center text-[#994100] font-bold border-t-2 border-[#994100] h-full justify-center px-4">
                    <BookOpen className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] uppercase">Thực đơn</span>
                </div>
                <div className="flex flex-col items-center text-[#8e4900] h-full justify-center px-4 opacity-70">
                    <Receipt className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] uppercase">Đơn hàng</span>
                </div>
                <div className="flex flex-col items-center text-[#8e4900] h-full justify-center px-4 opacity-70">
                    <CreditCard className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] uppercase">Thanh toán</span>
                </div>
            </nav>
        </div>
    );
};

export default MenuPage;