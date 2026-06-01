//Cấu hình cho ứng dụng khách hàng
import React from 'react';

const CustomerLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-culinaryBg flex justify-center font-sans">
            {/* Giới hạn khung màn hình Mobile để hiển thị đẹp trên mọi thiết bị */}
            <div className="w-full max-w-md bg-white min-h-screen shadow-md flex flex-col relative">

                {/* Header ứng dụng */}
                <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
                        <h1 className="text-lg font-bold text-neutralCustom">Modern Culinary</h1>
                    </div>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                        Bàn 05
                    </div>
                </header>

                {/* Nội dung trang thay đổi theo Route */}
                <main className="flex-1 p-4 pb-24 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default CustomerLayout;