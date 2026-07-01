import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { initBroadcastChannel } from '../../../utils/realtimeHelper';

const CallService = ({ tableName = "Bàn 2" }) => {
  const [showModal, setShowModal] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [called, setCalled] = useState(false);
  const [channel, setChannel] = useState(null);

  // Khởi tạo kênh gửi tín hiệu gọi phục vụ
  useEffect(() => {
    const notifyChannel = initBroadcastChannel('restaurant-notifications');
    setChannel(notifyChannel);

    return () => supabase.removeChannel(notifyChannel); // Cleanup
  }, []);

  // HÀM XỬ LÝ GỌI PHỤC VỤ
  const handleCall = async () => {
    setIsCalling(true);

    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'call_staff',
        payload: { 
          tableName: tableName, 
          time: new Date().toLocaleTimeString(),
          message: 'Khách cần hỗ trợ'
        }
      });
    } else {
      console.error("Lỗi: Kênh kết nối chưa sẵn sàng!");
    }

    setTimeout(() => {
      setIsCalling(false);
      setCalled(true);
      setShowModal(false);
      
      setTimeout(() => setCalled(false), 4000);
    }, 1000);
  };

  return (
    <>
      {/* 1. NÚT CHUÔNG TRÊN HEADER */}
      <button
        onClick={() => setShowModal(true)}
        className="relative p-2 text-primary hover:bg-orange-50 rounded-full transition-colors flex items-center justify-center"
      >
        <span className={`material-symbols-outlined text-[32px] ${called ? 'text-green-500' : 'text-primary'}`}>
          {called ? 'person_check' : 'notifications'}
        </span>
      </button>

      {/* 2. THÔNG BÁO NHẸ NHÀNG (Đã dời lên trên) */}
      {called && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded-full shadow-md text-xs font-medium w-max animate-fade-in">
          Nhân viên đang đến hỗ trợ!
        </div>
      )}

      {/* 3. POPUP XÁC NHẬN CƠ BẢN */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/30"
            onClick={() => !isCalling && setShowModal(false)}
          ></div>
          
          <div className="relative bg-white w-full max-w-xs rounded-xl p-5 text-center shadow-lg">
            <span className="material-symbols-outlined text-primary text-4xl mb-2">
              notifications_active
            </span>
            
            <h3 className="text-lg font-bold text-gray-900 mb-1">Gọi phục vụ?</h3>
            <p className="text-sm text-neutralCustom mb-5">
              Nhân viên sẽ đến bàn của bạn ngay lập tức.
            </p>

            <div className="flex gap-2">
              <button
                disabled={isCalling}
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg active:bg-gray-200"
              >
                Hủy
              </button>
              <button
                disabled={isCalling}
                onClick={handleCall}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg active:bg-orange-700 flex items-center justify-center"
              >
                {isCalling ? 'Đang gửi...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CallService;