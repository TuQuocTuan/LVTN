import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import StaffHeader from '../../components/layout/Staff/StaffHeader';

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

  const [billData, setBillData] = useState(null);
  const [loadingBill, setLoadingBill] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [voucherCode, setVoucherCode] = useState('');

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

  // FETCH: Lấy dữ liệu hóa đơn tạm tính từ API
  const fetchCurrentBill = async (sessionId) => {
    if (!sessionId) return;
    try {
      setLoadingBill(true);
      setBillData(null);
      const response = await fetch(`${API_BASE_URL}/orders/${sessionId}`);
      const result = await response.json();

      if (result.success && result.data) {
        const allOrders = result.data;

        // Lọc món đã chế biến xong để tính tiền
        const completedOrders = allOrders.filter(o => o.status === 'completed');
        const calculatedSubTotal = completedOrders.reduce((acc, order) => acc + Number(order.sub_total || 0), 0);

        setBillData({
          allOrders: allOrders,
          orders: completedOrders,
          subTotal: calculatedSubTotal,
          grandTotal: calculatedSubTotal * 1.1 // VAT 10%
        });
      }
    } catch (error) {
      console.error("Lỗi lấy tạm tính:", error);
    } finally {
      setLoadingBill(false);
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

  // Lắng nghe hành động click chọn bàn để nạp thông tin hóa đơn tương ứng
  useEffect(() => {
    if (selectedTable && selectedTable.sessionId && selectedTable.status !== 'empty') {
      fetchCurrentBill(selectedTable.sessionId);
    } else {
      setBillData(null);
      setPhoneNumber('');
      setEmail('');
      setVoucherCode('');
    }
  }, [selectedTable]);

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

  // CHỨC NĂNG ĐÓNG BÀN (Huỷ không thu tiền)
  const handleCloseTable = async (tableId) => {
    if (!window.confirm("Bạn có chắc chắn muốn đóng bàn này mà không tính tiền không?")) return;

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

  // CHỨC NĂNG THANH TOÁN (Trực tuyến & Tiền mặt)
  const handleCheckout = async (paymentMethod) => {
    if (!selectedTable?.sessionId) return;

    if (!billData || !billData.allOrders || billData.allOrders.length === 0) {
      return alert("Bàn này chưa gọi món ăn nào!");
    }

    if (!billData.orders || billData.orders.length === 0) {
      return alert("Các món ăn tại bàn này đều ở trạng thái [Đang chế biến].\n\nPhải có ít nhất 1 món đã hoàn thành mới có thể tính tiền!");
    }

    const confirmMsg = paymentMethod === 'CASH'
      ? `Xác nhận thanh toán TIỀN MẶT cho ${selectedTable.name}?`
      : `Xác nhận tạo mã VNPAY QR cho ${selectedTable.name}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: selectedTable.sessionId,
          payment_method: paymentMethod, // Truyền 'CASH' hoặc 'VNPAY' tương ứng nút bấm
          customer_name: 'Khách tại bàn',
          phone_number: phoneNumber.trim() || null,
          email: email.trim() || null,
          voucher_code: voucherCode.trim() || null,
          is_preview: false,
          close_user: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e'
        })
      });
      const data = await response.json();

      if (data.success) {
        if (paymentMethod === 'CASH') {
          alert(`Thanh toán thành công!\nSố tiền thu: ${data.tongtien.toLocaleString('vi-VN')} đ`);
          handleCloseModal();
          fetchTables();
        } else if (paymentMethod === 'VNPAY') {
          // if (data.payment_url) {
          //   window.open(data.payment_url, '_blank');
          //   handleCloseModal();
          //   fetchTables();
          // } else {
          //   alert("Không sinh được link VNPAY: " + data.message);
          // }
          try {
            const vnpayResponse = await fetch('https://state-bobbing-faculty.ngrok-free.dev/api/payments/vnpay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                session_id: selectedTable.sessionId,
                amount: billData.grandTotal // Tổng tiền đã gồm VAT 10%
              })
            });
            const vnpayData = await vnpayResponse.json();

            if (vnpayData.success && vnpayData.payment_url) {
              // Mở link cổng thanh toán tại tab hiện tại để thu ngân lấy QR cho khách quét
              window.location.href = vnpayData.payment_url;
              handleCloseModal();
            } else {
              alert("Không sinh được link VNPAY qua Ngrok: " + vnpayData.message);
            }
          } catch (err) {
            console.error("Lỗi kết nối tunnel VNPAY:", err);
            alert("Lỗi kết nối đến cổng Ngrok Backend!");
          }
        }
      } else {
        alert("Lỗi xử lý hóa đơn: " + data.message);
      }
    } catch (error) {
      alert("Lỗi kết nối API thanh toán!");
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
        <StaffHeader
          title="Bàn & Thanh Toán"
          subtitle="Hệ thống quản lý"
          userName="Thu Ngân Nguyễn"
          userRole="Nhân viên thu ngân"
          notifications={notifications}
          onDismissNotification={(index) => setNotifications(prev => prev.filter((_, i) => i !== index))}
          onClearAllNotifications={() => setNotifications([])}
        />

        {/* Nội dung chính Sơ đồ bàn */}
        <div className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Quản lý Sơ đồ bàn</h2>
              <p className="text-base text-neutralCustom mt-1">
                Tổng cộng: {tables.length} bàn | Hiện tại: {tables.filter(t => t.status === 'occupied').length} bàn đang phục vụ
              </p>
            </div>
          </div>

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

      {/* KHU VỰC MODAL POPUP CHÍNH GIỮA MÀN HÌNH */}
      {isModalOpen && selectedTable && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={handleCloseModal}></div>

          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden animate-fade-in-up max-h-[90vh] z-[70]">

            {/* Header Popup */}
            <div className="p-5 border-b border-neutralCustom/20 flex justify-between items-center bg-culinaryBg">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Chi tiết {selectedTable?.name}</h3>
                <p className="text-xs text-neutralCustom/80 mt-0.5">
                  Trạng thái: {selectedTable?.status === 'empty' ? 'Bàn trống' : selectedTable?.status === 'occupied' ? 'Đang phục vụ' : 'Chờ thanh toán'}
                </p>
              </div>
              <button className="material-symbols-outlined text-neutralCustom hover:bg-neutralCustom/10 p-2 rounded-full transition-colors" onClick={handleCloseModal}>
                close
              </button>
            </div>

            {/* Nội dung Popup */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white">
              {selectedTable?.status === 'empty' && (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <span className="material-symbols-outlined text-6xl text-neutralCustom/30 mb-3">grid_view</span>
                  <p className="text-base font-bold text-gray-900">Bàn hiện đang trống</p>
                  <p className="text-sm text-neutralCustom/70 mt-1">Chưa có phiên ăn nào được mở tại bàn này.</p>
                </div>
              )}

              {(selectedTable?.status === 'occupied' || selectedTable?.status === 'waiting') && (
                <div className="h-full flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm border-b pb-2">
                      <span className="material-symbols-outlined text-sm">restaurant_menu</span>
                      Món ăn đã đặt tại bàn:
                    </div>

                    {loadingBill ? (
                      <div className="text-center py-4 text-xs text-neutralCustom animate-pulse">Đang đồng bộ hóa đơn tạm tính...</div>
                    ) : billData && billData.allOrders && billData.allOrders.length > 0 ? (
                      <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                        {billData.allOrders.map((order, oIdx) =>
                          order.order_details.map((detail, dIdx) => (
                            <div key={`${oIdx}-${dIdx}`} className={`flex justify-between items-center text-xs p-2.5 rounded-xl border transition-all mb-2
                                ${order.status === 'pending' ? 'bg-amber-50/60 border-amber-200' : 'bg-culinaryBg/30 border-neutralCustom/10'}`}
                            >
                              <div>
                                <p className="font-bold text-gray-900">
                                  {detail.dishes?.name}
                                  {order.status === 'pending' && (
                                    <span className="ml-2 text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium animate-pulse">Đang chế biến</span>
                                  )}
                                </p>
                                {detail.note && <p className="text-[10px] text-orange-600 italic mt-0.5">📌 {detail.note}</p>}
                              </div>
                              <span className="bg-primary/10 text-primary font-black px-2 py-0.5 rounded-md">x{detail.quantity}</span>
                            </div>
                          ))
                        )}

                        {/* KHU VỰC THÔNG TIN KHÁCH HÀNG & EMAIL */}
                        <div className="pt-4 border-t border-neutralCustom/10 space-y-3 mt-4">
                          <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Khách hàng & Khuyến mãi</p>

                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Số điện thoại"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-white border border-neutralCustom/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                            <input
                              type="email"
                              placeholder="Email nhận hóa đơn"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-white border border-neutralCustom/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                          </div>

                          <input
                            type="text"
                            placeholder="Mã giảm giá / Voucher"
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-neutralCustom/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase"
                          />
                        </div>

                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl text-center">Bàn đã mở nhưng chưa tạo yêu cầu gọi món nào!</p>
                    )}
                  </div>

                  {/* Tính tiền các món nấu chín */}
                  {billData && (
                    <div className="border-t border-dashed pt-4 space-y-1 text-sm">
                      <div className="flex justify-between text-neutralCustom">
                        <span>Cộng tiền món (Đã chín):</span>
                        <span className="font-bold text-gray-800">{billData.subTotal?.toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div className="flex justify-between text-gray-900 font-black text-base border-t pt-2 mt-2">
                        <span>Tạm tính (Gồm VAT 10%):</span>
                        <span className="text-primary text-xl">{billData.grandTotal?.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FOOTER POPUP - VỚI 3 NÚT TÁCH BIỆT RÕ RÀNG */}
            <div className="p-5 bg-culinaryBg border-t border-neutralCustom/20">
              {selectedTable?.status === 'empty' && (
                <button
                  onClick={() => handleOpenTable(selectedTable.id)}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base shadow-md hover:bg-secondary transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">add_circle</span>
                  MỞ BÀN MỚI
                </button>
              )}

              {(selectedTable?.status === 'occupied' || selectedTable?.status === 'waiting') && (
                <div className="space-y-3">
                  {/* Nút 2 & 3: Thanh toán Tiền Mặt / Thanh toán VNPay */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleCheckout('CASH')}
                      className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-secondary transition-all"
                    >
                      TIỀN MẶT
                    </button>
                    <button
                      onClick={() => handleCheckout('VNPAY')}
                      className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                      VN PAY
                    </button>
                  </div>

                  {/* Nút 1: Đóng bàn */}
                  <button
                    onClick={() => handleCloseTable(selectedTable.id)}
                    className="w-full border-2 border-primary text-primary py-3 rounded-xl font-bold text-sm hover:bg-primary/10 transition-all bg-white"
                  >
                    ĐÓNG BÀN (HỦY PHIÊN)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManager;