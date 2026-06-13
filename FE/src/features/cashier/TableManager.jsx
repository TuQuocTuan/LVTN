import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';  

// Cấu hình URL Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TableManager = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  const [notifications, setNotifications] = useState([]);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);
  
  // Quản lý danh sách bàn từ API
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // File âm thanh của bạn
  const audio = new Audio('/Chinese Meme Ringtone Download.mp3');

  // Lấy danh sách bàn từ API
  const fetchTables = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tables`);
      const data = await response.json();
      
      if (data.success) {
        const formattedTables = data.tables.map(table => {
          const hasActiveSession = table.dining_sessions && table.dining_sessions.length > 0;
          const session = hasActiveSession ? table.dining_sessions[0] : null;
          
          let currentStatus = 'empty';
          if (session) {
            currentStatus = session.status === 'serving' ? 'occupied' : 'waiting';
          }

          return {
            id: table.id,
            name: table.name,
            isVip: table.type?.toLowerCase() === 'vip',
            status: currentStatus,
            details: hasActiveSession ? 'Đang phục vụ' : '', 
            sessionId: session?.id || null
          };
        });
        
        formattedTables.sort((a, b) => a.id - b.id);
        setTables(formattedTables);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách bàn:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables(); 

    const channel = supabase.channel('restaurant-notifications')
      .on('broadcast', { event: 'call_staff' }, (payload) => {
          const data = payload.payload;
          setNotifications((prev) => [data, ...prev]);
          audio.play().catch(err => console.log("Lỗi phát âm thanh:", err));
      }).subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Gọi API Mở Bàn Mới
  const handleOpenTable = async (tableId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/serving`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: tableId })
      });
      const data = await response.json();
      
      if (data.success) {
        alert("Mở bàn thành công!");
        handleCloseModal();
        fetchTables(); 
      } else {
        alert("Lỗi: " + data.message);
      }
    } catch (error) {
      console.error("Lỗi mở bàn:", error);
      alert("Không thể kết nối đến server.");
    }
  };

  // Gọi API Đóng Bàn
  const handleCloseTable = async (tableId) => {
    if (!window.confirm("Bạn có chắc chắn muốn đóng bàn này không?")) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: tableId })
      });
      const data = await response.json();
      
      if (data.success) {
        alert("Đóng bàn thành công!");
        handleCloseModal();
        fetchTables(); 
      } else {
        alert("Lỗi: " + data.message);
      }
    } catch (error) {
      console.error("Lỗi đóng bàn:", error);
      alert("Không thể kết nối đến server.");
    }
  };

  const handleOpenModal = (table) => {
    setSelectedTable(table);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTable(null), 300);
  };

  const filteredTables = tables.filter(table => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'empty') return table.status === 'empty';
    if (activeFilter === 'occupied') return table.status === 'occupied';
    if (activeFilter === 'waiting') return table.status === 'waiting';
    if (activeFilter === 'vip') return table.isVip;
    return true;
  });

  return (
    <div className="bg-culinaryBg text-neutralCustom font-sans min-h-screen flex">
      <main className="flex-1 relative">
        {/* Header */}
        <header className="flex justify-between items-center h-16 px-8 sticky top-0 z-40 bg-white border-b border-neutralCustom/20">
          <div>
            <h1 className="text-2xl font-bold text-primary">Bàn & Thanh Toán</h1>
            <p className="text-sm text-neutralCustom opacity-70">Hệ thống quản lý</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 relative">
              <button 
                onClick={() => setShowNotiDropdown(!showNotiDropdown)}
                className={`hover:text-primary transition-colors relative p-1.5 rounded-full flex items-center justify-center ${showNotiDropdown ? 'text-primary bg-primary/10' : 'text-neutralCustom'}`}
              >
                <span className="material-symbols-outlined text-2xl">notifications</span>
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotiDropdown && (
                <div className="absolute -right-16 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-neutralCustom/20 py-3 z-50">
                  <div className="flex justify-between items-center px-4 pb-2 border-b border-neutralCustom/10">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                      Danh sách gọi phục vụ
                    </h4>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => setNotifications([])}
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto mt-2 px-2 space-y-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-sm text-neutralCustom opacity-60 flex flex-col items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-3xl opacity-40">notifications_off</span>
                        Không có thông báo mới
                      </div>
                    ) : (
                      notifications.map((note, index) => (
                        <div key={index} className="flex justify-between items-start p-2.5 rounded-xl hover:bg-culinaryBg/60 transition-colors border-b border-gray-50 last:border-none">
                          <div className="flex gap-2.5">
                            <span className="material-symbols-outlined text-primary text-xl mt-0.5">notifications_active</span>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{note.tableName} gọi phục vụ!</p>
                              <p className="text-[11px] text-neutralCustom opacity-80 mt-0.5">{note.time}</p>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setNotifications(prev => prev.filter((_, i) => i !== index)); }}
                            className="text-neutralCustom hover:text-red-500 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-neutralCustom/20">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 leading-none">Thu Ngân Nguyễn</p>
                <p className="text-[10px] text-neutralCustom uppercase tracking-wider mt-1">Nhân viên thu ngân</p>
              </div>
              <div className="flex items-center gap-4 text-neutralCustom">
                <button className="material-symbols-outlined hover:text-primary transition-colors">account_circle</button>
              </div>
            </div>
          </div>
        </header>

        {/* Nôi dung chính */}
        <div className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Quản lý Sơ đồ bàn</h2>
              <p className="text-base text-neutralCustom mt-1">
                Tổng cộng: {tables.length} bàn | Hiện tại: {tables.filter(t => t.status === 'occupied').length} bàn đang phục vụ
              </p>
            </div>
          </div>

          {/* Bộ Lọc */}
          <div className="flex flex-wrap items-center gap-2 mb-8 px-4 py-3 bg-white rounded-2xl shadow-sm border border-neutralCustom/20">
            <button onClick={() => setActiveFilter('all')} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeFilter === 'all' ? 'bg-neutralCustom/10 ring-1 ring-neutralCustom/30' : 'hover:bg-culinaryBg'}`}>
              <span className="material-symbols-outlined text-[18px] text-neutralCustom">lists</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'all' ? 'text-gray-900' : 'text-neutralCustom'}`}>Tất cả</span>
            </button>
            <div className="h-6 w-px bg-neutralCustom/20 mx-1"></div>
            <button onClick={() => setActiveFilter('empty')} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeFilter === 'empty' ? 'bg-neutralCustom/10 ring-1 ring-neutralCustom/30' : 'hover:bg-culinaryBg'}`}>
              <div className="w-4 h-4 rounded-full border-2 border-dashed border-neutralCustom/50 bg-culinaryBg/50"></div>
              <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'empty' ? 'text-gray-900' : 'text-neutralCustom'}`}>Bàn Trống</span>
            </button>
            <button onClick={() => setActiveFilter('occupied')} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeFilter === 'occupied' ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-primary/5'}`}>
              <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_8px_rgba(254,113,5,0.4)]"></div>
              <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'occupied' ? 'text-primary' : 'text-neutralCustom'}`}>Đang Phục Vụ</span>
            </button>
            <button onClick={() => setActiveFilter('waiting')} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeFilter === 'waiting' ? 'bg-tertiary/10 ring-1 ring-tertiary/30' : 'hover:bg-tertiary/5'}`}>
              <div className="w-4 h-4 rounded-full bg-tertiary shadow-[0_0_8px_rgba(230,165,5,0.4)]"></div>
              <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'waiting' ? 'text-tertiary' : 'text-neutralCustom'}`}>Chờ Thanh Toán</span>
            </button>
            <div className="h-6 w-px bg-neutralCustom/20 mx-1"></div>
            <button onClick={() => setActiveFilter('vip')} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeFilter === 'vip' ? 'bg-secondary/10 ring-1 ring-secondary/30' : 'hover:bg-secondary/5'}`}>
              <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'vip' ? 'text-secondary' : 'text-neutralCustom'}`}>Khu vực VIP</span>
            </button>
          </div>

          {/* Render Sơ đồ bàn */}
          {isLoading ? (
            <div className="flex justify-center py-20 text-neutralCustom">Đang tải dữ liệu bàn...</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {filteredTables.map((table) => (
                <div 
                  key={table.id} 
                  onClick={() => handleOpenModal(table)}
                  className={`relative group cursor-pointer transition-all duration-300 hover:-translate-y-1 aspect-square rounded-2xl flex flex-col items-center justify-between p-4 shadow-sm
                    ${table.status === 'empty' ? 'bg-culinaryBg/40 border-2 border-dashed border-neutralCustom/30 opacity-80 hover:bg-white hover:border-solid hover:border-primary hover:opacity-100' : ''}
                    ${table.status === 'occupied' ? 'bg-white border-2 border-primary' : ''}
                    ${table.status === 'waiting' ? 'bg-white border-2 border-tertiary' : ''}
                  `}
                >
                  {table.isVip && (
                    <div className="absolute top-2 right-2">
                      <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
                    </div>
                  )}
                  <div className="text-center mt-auto mb-auto">
                    <span className="text-xs font-bold text-neutralCustom/70 uppercase tracking-wider block mb-1">TABLE</span>
                    <span className={`text-xl font-bold
                      ${table.status === 'empty' ? 'text-neutralCustom' : ''}
                      ${table.status === 'occupied' ? 'text-primary' : ''}
                      ${table.status === 'waiting' ? 'text-tertiary' : ''}
                    `}>
                      {table.name}
                    </span>
                    {table.status === 'empty' && (
                       <span className="material-symbols-outlined text-neutralCustom/40 mt-2 block group-hover:text-primary transition-colors">add_circle</span>
                    )}
                  </div>
                  {table.status !== 'empty' && (
                    <div className={`w-full rounded-lg py-1.5 px-1 text-center 
                      ${table.status === 'occupied' ? 'bg-primary/10' : ''}
                      ${table.status === 'waiting' ? 'bg-tertiary/10 animate-pulse' : ''}
                    `}>
                      <span className={`text-sm font-bold 
                        ${table.status === 'occupied' ? 'text-primary' : ''}
                        ${table.status === 'waiting' ? 'text-tertiary' : ''}
                      `}>
                        {table.details}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal & Backdrop */}
      <div className={`fixed inset-0 z-[60] transition-all duration-300 ${isModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={handleCloseModal}></div>
        <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-[70] flex flex-col transform transition-transform duration-300 border-l border-neutralCustom/20 ${isModalOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 border-b border-neutralCustom/20 flex justify-between items-center bg-culinaryBg">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Chi tiết {selectedTable?.name}</h3>
              <p className="text-xs text-neutralCustom/80 mt-0.5">
                Trạng thái: {selectedTable?.status === 'empty' ? 'Bàn trống' : selectedTable?.status === 'occupied' ? 'Đang phục vụ' : 'Chờ thanh toán'}
              </p>
            </div>
            <button className="material-symbols-outlined text-neutralCustom hover:bg-neutralCustom/10 p-2 rounded-full transition-colors" onClick={handleCloseModal}>close</button>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedTable?.status === 'empty' && (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <span className="material-symbols-outlined text-6xl text-neutralCustom/30 mb-3">grid_view</span>
                <p className="text-base font-bold text-gray-900">Bàn hiện đang trống</p>
                <p className="text-sm text-neutralCustom/70 mt-1">Chưa có phiên ăn nào được mở tại bàn này.</p>
              </div>
            )}
            
            {(selectedTable?.status === 'occupied' || selectedTable?.status === 'waiting') && (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                 <span className="material-symbols-outlined text-6xl text-primary/30 mb-3">restaurant</span>
                 <p className="text-base font-bold text-gray-900">Bàn đang có khách</p>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-culinaryBg border-t border-neutralCustom/20">
            {/* TH1: MỞ BÀN */}
            {selectedTable?.status === 'empty' && (
              <button 
                onClick={() => handleOpenTable(selectedTable.id)}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base shadow-md hover:bg-secondary transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">add_circle</span>
                MỞ BÀN MỚI
              </button>
            )}

            {/* TH2: BÀN CÓ KHÁCH (ĐÓNG BÀN) */}
            {(selectedTable?.status === 'occupied' || selectedTable?.status === 'waiting') && (
              <div className="space-y-3">
                <button className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base shadow-md hover:bg-secondary transition-all">THANH TOÁN</button>
                <button 
                  onClick={() => handleCloseTable(selectedTable.id)}
                  className="w-full border-2 border-primary text-primary py-3 rounded-xl font-bold text-sm hover:bg-primary/10 transition-all bg-white"
                >
                  ĐÓNG BÀN
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableManager;