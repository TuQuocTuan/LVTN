import React from 'react';

const KitchenDashboard = () => {
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-neutralCustom mb-4">Màn Hình Nhà Bếp (Real-time)</h1>
            <div className="bg-yellow-50 border border-tertiary p-4 rounded-xl text-secondary">
                Chưa có đơn hàng mới nào được gửi xuống...
            </div>
        </div>
    );
};

export default KitchenDashboard;