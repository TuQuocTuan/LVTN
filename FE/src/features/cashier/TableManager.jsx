import React, { useState } from 'react';

const TableManager = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
    // Bộ lọc bàn (Mặc định là 'all')
  const [activeFilter, setActiveFilter] = useState('all');

  const tables = [
    { id: 1, name: 'V-01', status: 'occupied', isVip: true, details: '4 Khách' },
    { id: 2, name: 'A-12', status: 'waiting', isVip: false, details: '1.450k' },
    { id: 3, name: 'A-13', status: 'empty', isVip: false, details: '' },
    { id: 4, name: 'V-02', status: 'occupied', isVip: true, details: '2 Khách' },
    { id: 5, name: 'A-14', status: 'occupied', isVip: false, details: '6 Khách' },
    { id: 6, name: 'A-15', status: 'empty', isVip: false, details: '' },
    { id: 7, name: 'A-16', status: 'waiting', isVip: false, details: '520k' },
    { id: 8, name: 'A-17', status: 'occupied', isVip: false, details: '3 Khách' },
    { id: 9, name: 'A-18', status: 'empty', isVip: false, details: '' },
    { id: 10, name: 'A-19', status: 'occupied', isVip: false, details: '4 Khách' },
    { id: 11, name: 'A-20', status: 'empty', isVip: false, details: '' },
    { id: 12, name: 'V-03', status: 'occupied', isVip: true, details: '8 Khách' },
    { id: 13, name: 'V-04', status: 'empty', isVip: true, details: '' },
  ];

  const handleOpenModal = (table) => {
    setSelectedTable(table);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTable(null), 300);
  };

  // Logic tự động lọc danh sách bàn dựa trên activeFilter
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
      {/*MAIN CONTENT */}
      <main className="flex-1 relative">
        {/* Top Navbar */}
        <header className="flex justify-between items-center h-16 px-8 sticky top-0 z-40 bg-white border-b border-neutralCustom/20">
          <div className="">
            <h1 className="text-2xl font-bold text-primary">Bếp & Bàn</h1>
            <p className="text-sm text-neutralCustom opacity-70">Hệ thống quản lý</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
              <span className="text-base text-primary font-bold">Live</span>
            </div>
            <div className="flex items-center gap-4 text-neutralCustom">
              <button className="material-symbols-outlined hover:text-primary transition-colors">notifications</button>
              <button className="material-symbols-outlined hover:text-primary transition-colors">account_circle</button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Header & Floor Tabs */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Quản lý Sơ đồ bàn</h2>
              <p className="text-base text-neutralCustom mt-1">Tổng cộng: 32 bàn | Hiện tại: 12 bàn đang phục vụ</p>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-8 px-4 py-3 bg-white rounded-2xl shadow-sm border border-neutralCustom/20">
            
            <button 
              onClick={() => setActiveFilter('all')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeFilter === 'all' ? 'bg-neutralCustom/10 ring-1 ring-neutralCustom/30' : 'hover:bg-culinaryBg'}`}
            >
              <span className="material-symbols-outlined text-[18px] text-neutralCustom">lists</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'all' ? 'text-gray-900' : 'text-neutralCustom'}`}>Tất cả</span>
            </button>

            <div className="h-6 w-px bg-neutralCustom/20 mx-1"></div>

            <button 
              onClick={() => setActiveFilter('empty')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeFilter === 'empty' ? 'bg-neutralCustom/10 ring-1 ring-neutralCustom/30' : 'hover:bg-culinaryBg'}`}
            >
              <div className="w-4 h-4 rounded-full border-2 border-dashed border-neutralCustom/50 bg-culinaryBg/50"></div>
              <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'empty' ? 'text-gray-900' : 'text-neutralCustom'}`}>Bàn Trống</span>
            </button>

            <button 
              onClick={() => setActiveFilter('occupied')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeFilter === 'occupied' ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-primary/5'}`}
            >
              <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_8px_rgba(254,113,5,0.4)]"></div>
              <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'occupied' ? 'text-primary' : 'text-neutralCustom'}`}>Đang Phục Vụ</span>
            </button>

            <button 
              onClick={() => setActiveFilter('waiting')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeFilter === 'waiting' ? 'bg-tertiary/10 ring-1 ring-tertiary/30' : 'hover:bg-tertiary/5'}`}
            >
              <div className="w-4 h-4 rounded-full bg-tertiary shadow-[0_0_8px_rgba(230,165,5,0.4)]"></div>
              <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'waiting' ? 'text-tertiary' : 'text-neutralCustom'}`}>Chờ Thanh Toán</span>
            </button>

            <div className="h-6 w-px bg-neutralCustom/20 mx-1"></div>

            <button 
              onClick={() => setActiveFilter('vip')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeFilter === 'vip' ? 'bg-secondary/10 ring-1 ring-secondary/30' : 'hover:bg-secondary/5'}`}
            >
              <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'vip' ? 'text-secondary' : 'text-neutralCustom'}`}>Khu vực VIP</span>
            </button>
            
          </div>

          {/* Grid of Tables */}
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
                {/* VIP Icon */}
                {table.isVip && (
                  <div className="absolute top-2 right-2">
                    <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
                  </div>
                )}

                {/* Table Name */}
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

                {/* Table Details */}
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
        </div>
      </main>

      {/* MODAL & BACKDROP */}
      {isModalOpen && (
        <>
          {/* Lớp nền mờ khi mở modal */}
          <div 
            className="fixed inset-0 bg-gray-900/40 z-[60] backdrop-blur-sm transition-opacity duration-300"
            onClick={handleCloseModal}
          ></div>
          
          {/* Panel chi tiết bàn di trượt ra */}
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-[70] flex flex-col transform transition-transform duration-300 translate-x-0 border-l border-neutralCustom/20">
            
            {/* Header chung cho mọi trạng thái bàn */}
            <div className="p-6 border-b border-neutralCustom/20 flex justify-between items-center bg-culinaryBg">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Chi tiết {selectedTable?.name}
                </h3>
                <p className="text-xs text-neutralCustom/80 mt-0.5">
                  Trạng thái: {
                    selectedTable?.status === 'empty' ? 'Bàn trống' : 
                    selectedTable?.status === 'occupied' ? 'Đang phục vụ' : 'Chờ thanh toán'
                  }
                </p>
              </div>
              <button 
                className="material-symbols-outlined text-neutralCustom hover:bg-neutralCustom/10 p-2 rounded-full transition-colors" 
                onClick={handleCloseModal}
              >
                close
              </button>
            </div>
            
            {/* BODY MODAL: Phân chia theo trạng thái bàn */}
            <div className="flex-1 p-6 overflow-y-auto">
              
              {/* TRƯỜNG HỢP 1: BÀN TRỐNG */}
              {selectedTable?.status === 'empty' && (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <span className="material-symbols-outlined text-6xl text-neutralCustom/30 mb-3">
                    grid_view
                  </span>
                  <p className="text-base font-bold text-gray-900">Bàn hiện đang trống</p>
                  <p className="text-sm text-neutralCustom/70 mt-1">
                    Chưa có phiên ăn nào được mở tại bàn này.
                  </p>
                </div>
              )}

              {/* TRƯỜNG HỢP 2 & 3: BÀN CÓ KHÁCH (ĐANG PHỤC VỤ HOẶC CHỜ THANH TOÁN) */}
              {(selectedTable?.status === 'occupied' || selectedTable?.status === 'waiting') && (
                <>
                  {/* Thông tin khách hàng */}
                  <div className="mb-6">
                    <p className="text-xs font-bold text-neutralCustom uppercase tracking-wider mb-2">Thông tin khách</p>
                    <div className="flex items-center gap-4 bg-culinaryBg border border-neutralCustom/10 p-4 rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        VA
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Nguyễn Văn A</p>
                        <p className="text-sm text-neutralCustom">0893674131231</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Danh sách món ăn hiện tại */}
                  <div className="mb-6">
                    <p className="text-xs font-bold text-neutralCustom uppercase tracking-wider mb-2">Đơn hàng hiện tại</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-neutralCustom/10 pb-2">
                        <span className="text-sm text-gray-900 font-medium">Bò Wagyu Nướng ống tre</span>
                        <span className="font-bold text-primary">x1</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-neutralCustom/10 pb-2">
                        <span className="text-sm text-gray-900 font-medium">Vang đỏ Chateau (Ly)</span>
                        <span className="font-bold text-primary">x2</span>
                      </div>
                      <div className="flex justify-between items-center text-primary font-bold mt-4 pt-2 border-t border-neutralCustom/20">
                        <span>Tổng tạm tính</span>
                        <span>{selectedTable?.status === 'waiting' ? selectedTable.details : '1.450.000đ'}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* FOOTER ACTIONS: Điều khiển các nút chức năng theo từng TH */}
            <div className="p-6 bg-culinaryBg border-t border-neutralCustom/20">
              
              {/* TH1: BÀN TRỐNG -> Hiện nút Mở bàn */}
              {selectedTable?.status === 'empty' && (
                <button className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base shadow-md hover:bg-secondary transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">add_circle</span>
                  MỞ BÀN MỚI
                </button>
              )}

              {/* TH2: BÀN ĐANG PHỤC VỤ -> Hiện Thanh toán + Đóng bàn */}
              {selectedTable?.status === 'occupied' && (
                <div className="space-y-3">
                  <button className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base shadow-md hover:bg-secondary transition-all">
                    THANH TOÁN
                  </button>
                  <button className="w-full border-2 border-primary text-primary py-3 rounded-xl font-bold text-sm hover:bg-primary/10 transition-all bg-white">
                    ĐÓNG BÀN
                  </button>
                </div>
              )}

              {/* TH3: BÀN CHỜ THANH TOÁN -> Hiện Thanh toán + In Bill + Đóng bàn */}
              {selectedTable?.status === 'waiting' && (
                <div className="space-y-3">
                  <button className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base shadow-md hover:bg-secondary transition-all">
                    THANH TOÁN ({selectedTable.details})
                  </button>
                  
                  {/* Nút in hóa đơn sử dụng màu vàng nghệ tertiary chuẩn cấu hình của bạn */}
                  <button className="w-full bg-tertiary text-white py-3 rounded-xl font-bold text-sm hover:brightness-105 transition-all shadow-sm flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">print</span>
                    IN BILL TẠM TÍNH
                  </button>
                  
                  <button className="w-full border-2 border-primary text-primary py-3 rounded-xl font-bold text-sm hover:bg-primary/10 transition-all bg-white">
                    ĐÓNG BÀN
                  </button>
                </div>
              )}
              
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TableManager;