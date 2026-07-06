import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import StaffHeader from '../../components/layout/Staff/StaffHeader';
import { listenBroadcast } from '../../utils/realtimeHelper';
import axios from 'axios';

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
  const [customerVouchers, setCustomerVouchers] = useState([]);

  // State lưu trữ vai trò và quyền hạn của tài khoản đang đăng nhập
  const [userRole, setUserRole] = useState('');
  const [userPermissions, setUserPermissions] = useState({});

  const audio = new Audio('/Chinese Meme Ringtone Download.mp3');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role?.toString().trim().toLowerCase());

        let perms = {};
        if (typeof user.permissions === 'string') {
          perms = JSON.parse(user.permissions);
        } else if (typeof user.permissions === 'object' && user.permissions !== null) {
          perms = user.permissions;
        }
        setUserPermissions(perms);
      } catch (e) {
        console.error("Lỗi đọc thông tin phân quyền user trong TableManager:", e);
      }
    }
  }, []);

  // Hàm kiểm tra quyền thao tác (Super Admin mặc định được làm mọi thứ)
  const hasPermission = (permissionKey) => {
    if (userRole === 'super_admin') return true;
    return !!userPermissions[permissionKey];
  };

  // Lấy danh sách bàn từ API
  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tables`);
      const data = response.data;

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

  // Lấy dữ liệu hóa đơn tạm tính từ API
  const fetchCurrentBill = async (sessionId) => {
    if (!sessionId) return;
    try {
      setLoadingBill(true);
      setBillData(null);
      const response = await axios.get(`${API_BASE_URL}/orders/${sessionId}`);
      const result = response.data;

      if (result.success && result.data) {
        const allOrders = result.data;

        // Lọc món đã chế biến xong để tính tiền
        const completedOrders = allOrders.filter(o => o.status === 'completed');
        const calculatedSubTotal = completedOrders.reduce((acc, order) => acc + Number(order.sub_total || 0), 0);

        setBillData({
          allOrders: allOrders,
          orders: completedOrders,
          subTotal: calculatedSubTotal,
          grandTotal: calculatedSubTotal * 1.1, // VAT 10%
          originalGrandTotal: calculatedSubTotal * 1.1
        });
      }
    } catch (error) {
      console.error("Lỗi lấy tạm tính:", error);
    } finally {
      setLoadingBill(false);
    }
  };

  // Lắng nghe Khách gọi phục vụ / thanh toán
  useEffect(() => {
    fetchTables();

    const channel = listenBroadcast('restaurant-notifications', 'call_staff', (payload) => {
      const data = payload.payload;
      setNotifications((prev) => [data, ...prev]);
      audio.play().catch(err => console.log(err));
    });

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

  // Tự động tìm voucher khi có số điện thoại
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {

      if (phoneNumber.trim().length >= 10 || email.includes('@')) {
        try {
          const response = await axios.post(`${API_BASE_URL}/promotions/customer-voucher`, {
            phone_number: phoneNumber.trim(),
            email: email.trim()
          });

          if (response.data && response.data.success) {
            setCustomerVouchers(response.data.promotion || []);
          } else {
            // Trường hợp BE trả về 200 nhưng success: false
            setCustomerVouchers([]);
          }
        } catch (error) {
          setCustomerVouchers([]);
        }
      } else {
        // Nhập chưa đủ thì xóa rỗng
        setCustomerVouchers([]);
        setVoucherCode('');
      }

    }, 800);
    return () => clearTimeout(delayDebounceFn);

  }, [phoneNumber, email]);

  // Theo dõi sự thay đổi của mã voucher
  useEffect(() => {
    const updatePreviewBill = async () => {
      if (!selectedTable?.sessionId || !billData || !billData.subTotal) return;

      try {
        const response = await axios.post(`${API_BASE_URL}/orders/checkout`, {
          session_id: selectedTable.sessionId,
          voucher_code: voucherCode || null,
          phone_number: phoneNumber.trim() || null,
          email: email.trim() || null,
          is_preview: true
        });

        if (response.data) {
          setBillData(prev => ({
            ...prev,
            grandTotal: response.data.tongtien || prev.grandTotal,
            discountAmount: response.data.discount_amount || 0,
            voucherName: response.data.voucher_name
          }));
        }
      } catch (error) {
        console.error("Lỗi khi áp dụng voucher:", error);
      }
    };

    updatePreviewBill();
  }, [voucherCode, billData?.subTotal]);

  // Gọi API Mở Bàn Mới
  const handleOpenTable = async (tableId) => {
    // Kiểm tra quyền mở bàn trước khi thực hiện
    if (!hasPermission('manage_tables')) {
      return alert("Tài khoản của bạn đã bị giới hạn, không có quyền thực hiện mở bàn mới!");
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/sessions/serving`, { table_id: tableId });
      const data = response.data;

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
    if (!hasPermission('manage_tables')) {
      return alert("Tài khoản của bạn đã bị giới hạn, không có quyền đóng/hủy bàn!");
    }

    if (!window.confirm("Bạn có chắc chắn muốn đóng bàn này mà không tính tiền không?")) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/sessions/close`, { table_id: tableId });
      const data = response.data;

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

    if (!hasPermission('checkout')) {
      return alert("Tài khoản của bạn đã bị giới hạn, không có quyền thanh toán hóa đơn này!");
    }

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
      const response = await axios.post(`${API_BASE_URL}/orders/checkout`, {
        session_id: selectedTable.sessionId,
        payment_method: paymentMethod, // Truyền 'CASH' hoặc 'VNPAY' tương ứng nút bấm
        customer_name: 'Khách tại bàn',
        phone_number: phoneNumber.trim() || null,
        email: email.trim() || null,
        voucher_code: voucherCode.trim() || null,
        is_preview: false,
        close_user: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e'
      });
      const data = response.data;

      if (data.success) {
        if (paymentMethod === 'CASH') {
          alert(`Thanh toán thành công!\nSố tiền thu: ${data.tongtien.toLocaleString('vi-VN')} đ`);

          console.log("Link in nhận từ BE:", data.print_url);
          //TỰ ĐỘNG IN BILL: Kiểm tra nếu BE trả về đường link in thì tự bật tab mới để in
          if (data.html_bill) {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            // Ghi thẳng nội dung HTML vào iframe mà không cần gọi URL nào hết
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(data.html_bill);
            doc.close();

            // Kích hoạt lệnh in
            setTimeout(() => {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
              setTimeout(() => document.body.removeChild(iframe), 2000);
            }, 500);
          }

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
            const vnpayResponse = await axios.post('https://state-bobbing-faculty.ngrok-free.dev/api/payments/vnpay', {
              session_id: selectedTable.sessionId,
              amount: billData.grandTotal // Tổng tiền đã gồm VAT 10%
            });
            const vnpayData = vnpayResponse.data;

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

            {/* HEADER POPUP */}
            <div className="p-5 border-b border-neutralCustom/20 flex justify-between items-center bg-culinaryBg shrink-0">
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

            {/* BÀN TRỐNG */}
            {selectedTable?.status === 'empty' && (
              <>
                <div className="flex-1 p-6 bg-white flex flex-col items-center justify-center h-full text-center py-10">
                  <span className="material-symbols-outlined text-6xl text-neutralCustom/30 mb-3">grid_view</span>
                  <p className="text-base font-bold text-gray-900">Bàn hiện đang trống</p>
                  <p className="text-sm text-neutralCustom/70 mt-1">Chưa có phiên ăn nào được mở tại bàn này.</p>
                </div>
                <div className="p-5 bg-culinaryBg border-t border-neutralCustom/20 shrink-0">
                  {/* KIỂM TRA QUYỀN: ẨN / HIỆN HOẶC BÁO LỖI KHI MỞ BÀN MỚI */}
                  {hasPermission('manage_tables') ? (
                    <button
                      onClick={() => handleOpenTable(selectedTable.id)}
                      className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base shadow-md hover:bg-secondary transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">add_circle</span>
                      MỞ BÀN MỚI
                    </button>
                  ) : (
                    <div className="text-center text-sm text-red-600 bg-red-50 py-4 px-5 rounded-xl font-bold border border-red-200">
                      Tài khoản của bạn không được cấp quyền [Mở bàn mới]
                    </div>
                  )}
                </div>
              </>
            )}

            {/* BÀN ĐANG PHỤC VỤ / CHỜ THANH TOÁN */}
            {(selectedTable?.status === 'occupied' || selectedTable?.status === 'waiting') && (
              <>
                {/* TẦNG 1: DANH SÁCH MÓN ĂN */}
                <div className="flex-1 p-6 bg-white flex flex-col min-h-0">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm border-b pb-2 mb-4 shrink-0">
                    <span className="material-symbols-outlined text-sm">restaurant_menu</span>
                    Món ăn đã đặt tại bàn:
                  </div>

                  {loadingBill ? (
                    <div className="text-center py-4 text-xs text-neutralCustom animate-pulse shrink-0">Đang đồng bộ hóa đơn tạm tính...</div>
                  ) : billData && billData.allOrders && billData.allOrders.length > 0 ? (

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                      {(() => {
                        // 1. Chạy logic gộp món trước (Chỉ gom thuần túy dữ liệu để hiển thị)
                        const groupedDishes = [];
                        billData.allOrders.forEach(order => {
                          order.order_details.forEach(detail => {
                            const name = detail.dishes?.name;
                            const status = order.status;
                            const note = detail.note?.trim();

                            const existing = groupedDishes.find(
                              item => item.name === name && item.status === status
                            );

                            if (existing) {
                              existing.quantity += detail.quantity;
                              if (note) {
                                existing.note = existing.note ? `${existing.note} | ${note}` : note;
                              }
                            } else {
                              groupedDishes.push({
                                name,
                                status,
                                quantity: detail.quantity,
                                note: note || ''
                              });
                            }
                          });
                        });

                        // 2. Sau khi có mảng gộp độc lập hoàn toàn, mới tiến hành render UI
                        return groupedDishes.map((item, idx) => (
                          <div key={idx} className={`flex justify-between items-center text-xs p-2.5 rounded-xl border transition-all mb-2
                              ${item.status === 'pending' ? 'bg-amber-50/60 border-amber-200' : ''}
                              ${item.status === 'cancelled' ? 'bg-gray-100/80 border-gray-200 opacity-80' : ''}
                              ${item.status !== 'pending' && item.status !== 'cancelled' ? 'bg-culinaryBg/30 border-neutralCustom/10' : ''}`}
                          >
                            <div>
                              <p className={`font-bold ${item.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                {item.name}
                                {item.status === 'pending' && (
                                  <span className="ml-2 text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium animate-pulse">Đang chế biến</span>
                                )}
                                {item.status === 'cancelled' && (
                                  <span className="ml-2 text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-medium">Món bị hủy</span>
                                )}
                              </p>
                              {item.note && <p className={`text-[10px] italic mt-0.5 ${item.status === 'cancelled' ? 'text-gray-400' : 'text-orange-600'}`}>📌 {item.note}</p>}
                            </div>
                            <span className={`font-black px-2 py-0.5 rounded-md ${item.status === 'cancelled' ? 'bg-gray-200 text-gray-500' : 'bg-primary/10 text-primary'}`}>x{item.quantity}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl text-center shrink-0">Bàn đã mở nhưng chưa tạo yêu cầu gọi món nào!</p>
                  )}
                </div>

                {/* Nhập thông tin km */}
                <div className="shrink-0 bg-white border-t border-neutralCustom/20 p-5 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-10">
                  <div className="space-y-3">
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

                    <div className="relative">
                      <select
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        className={`w-full px-3 py-2 text-sm bg-white border outline-none focus:ring-2 transition-all shadow-sm font-bold rounded-xl cursor-pointer
                          ${customerVouchers.length > 0 ? 'border-primary/50 text-primary focus:ring-primary/20 focus:border-primary' : 'border-neutralCustom/30 text-gray-500'}
                        `}
                      >
                        <option value="">
                          {customerVouchers.length > 0 ? "-- Chọn mã giảm giá của khách --" : "-- Khách chưa có mã giảm giá --"}
                        </option>
                        {customerVouchers.map((v) => (
                          <option key={v.code || v.id} value={v.code || v.id}>
                            {v.code || v.id} - {v.name} (Giảm: {Number(v.discount_value).toLocaleString('vi-VN')}đ)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {billData && (
                    <div className="border-t border-dashed border-neutralCustom/30 pt-3 mt-4 space-y-2 text-sm">
                      <div className="flex justify-between text-neutralCustom">
                        <span>Tổng tiền món (Đã xuất món):</span>
                        <span className="font-bold text-gray-800">{billData.subTotal?.toLocaleString('vi-VN')} đ</span>
                      </div>

                      {billData.voucherName && billData.voucherName !== "Không áp dụng" && (
                        <div className="flex flex-col items-end mt-1.5 space-y-1">
                          {billData.voucherName.split(/\+|,/).map((promoName, idx) => {
                            const name = promoName.trim();
                            if (!name) return null;
                            return (
                              <span key={idx} className="text-[10.5px] italic opacity-90 leading-tight bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                accepted {name}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex justify-between text-gray-900 font-black text-base border-t border-neutralCustom/10 pt-2 mt-2">
                        <span>Tạm tính (Gồm VAT 10%):</span>
                        <span className="text-primary text-xl">{billData.grandTotal?.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* CÁC NÚT BUTTON */}
                <div className="p-5 bg-culinaryBg border-t border-neutralCustom/20 shrink-0">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {/* NÚT TIỀN MẶT: Khóa nếu không có quyền 'checkout' */}
                      <button
                        onClick={() => handleCheckout('CASH')}
                        disabled={!hasPermission('checkout')}
                        className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all
                          ${hasPermission('checkout')
                            ? 'bg-primary text-white hover:bg-secondary'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'}`}
                      >
                        TIỀN MẶT
                      </button>

                      {/* NÚT VN PAY: Khóa nếu không có quyền 'checkout' */}
                      <button
                        onClick={() => handleCheckout('VNPAY')}
                        disabled={!hasPermission('checkout')}
                        className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5
                          ${hasPermission('checkout')
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'}`}
                      >
                        <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                        VN PAY
                      </button>
                    </div>

                    {/* Hiển thị dòng thông báo nhắc nhở nhẹ nếu bị tắt quyền checkout */}
                    {!hasPermission('checkout') && (
                      <p className="text-[11px] text-red-500 font-bold text-center italic mt-1.5">
                        ⚠️ Tài khoản của bạn đã bị giới hạn quyền thanh toán (Checkout).
                      </p>
                    )}

                    {/* NÚT HỦY PHIÊN/ĐÓNG BÀN: Khóa nếu không có quyền 'manage_tables' */}
                    <button
                      onClick={() => handleCloseTable(selectedTable.id)}
                      disabled={!hasPermission('manage_tables')}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all border-2 bg-white
                        ${hasPermission('manage_tables')
                          ? 'border-primary text-primary hover:bg-primary/10'
                          : 'border-gray-300 text-gray-400 cursor-not-allowed opacity-60'}`}
                    >
                      ĐÓNG BÀN (HỦY PHIÊN)
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManager;