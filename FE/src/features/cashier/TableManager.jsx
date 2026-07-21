import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import StaffHeader from '../../components/layout/Staff/StaffHeader';
import { listenBroadcast } from '../../utils/realtimeHelper';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TableManager = () => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const [notifications, setNotifications] = useState([]);
  
  // dialog: Trạng thái hiển thị Custom Dialog thông báo/xác nhận hành động
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'info', // 'success' (thành công) | 'error' (lỗi) | 'warning' (cảnh báo) | 'confirm' (xác nhận)
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  });

  // showDialog: Kích hoạt hiển thị hộp thoại cảnh báo/xác nhận
  const showDialog = (type, title, message, onConfirm = null, onCancel = null) => {
    setDialog({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      onCancel
    });
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  const showAlert = (message, type = 'info') => {
    let title = 'Thông báo';
    if (type === 'success') title = 'Thành công';
    if (type === 'error') title = 'Lỗi';
    if (type === 'warning') title = 'Cảnh báo';

    showDialog(type, title, message);
  };

  const showConfirm = (message, onConfirm, onCancel = null) => {
    showDialog('confirm', 'Xác nhận', message, onConfirm, onCancel);
  };
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);


  const [tables, setTables] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);

  const [billData, setBillData] = useState(null);
  
  const [loadingBill, setLoadingBill] = useState(false);
  
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [email, setEmail] = useState('');
  
  const [voucherCode, setVoucherCode] = useState('');
  
  const [customerVouchers, setCustomerVouchers] = useState([]);

  // TRẠNG THÁI MODAL ĐĂNG KÝ THÀNH VIÊN MỚI
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // showPrintVnpayBtn: Hiển thị nút "Xác nhận đã chuyển khoản và in bill" khi khách thanh toán qua VNPAY
  const [showPrintVnpayBtn, setShowPrintVnpayBtn] = useState(false);
  
  // vnpayHtmlBill: Lưu mẫu hóa đơn HTML chính thức nhận được khi chọn VNPAY
  const [vnpayHtmlBill, setVnpayHtmlBill] = useState('');

  const [userRole, setUserRole] = useState('');
  const [userPermissions, setUserPermissions] = useState({});

  const audio = new Audio('/Chinese Meme Ringtone Download.mp3');

  // Đọc thông tin phân quyền của nhân viên thu ngân từ localStorage khi load page
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

  const hasPermission = (permissionKey) => {
    if (userRole === 'super_admin') return true;
    return !!userPermissions[permissionKey];
  };

  // Gọi API lấy trạng thái sơ đồ bàn hiện tại và định dạng trạng thái
  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tables`);
      const data = response.data;

      if (data.success) {
        const formattedTables = data.tables.map(table => {
          const hasActiveSession = table.dining_sessions && table.dining_sessions.length > 0;
          const session = hasActiveSession ? table.dining_sessions[0] : null;

          let currentStatus = 'empty'; // Mặc định là bàn trống
          if (session) {
            // Trạng thái 'serving' thì bàn đang phục vụ ('occupied'), ngược lại là chờ thanh toán ('waiting')
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

        // Sắp xếp danh sách bàn theo ID tăng dần
        formattedTables.sort((a, b) => a.id - b.id);
        setTables(formattedTables);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách bàn:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Gọi API tải hóa đơn tạm tính của bàn được chọn (căn cứ vào mã phiên ăn sessionId)
  const fetchCurrentBill = async (sessionId) => {
    if (!sessionId) return;
    try {
      setLoadingBill(true);
      setBillData(null);
      const response = await axios.get(`${API_BASE_URL}/orders/${sessionId}`);
      const result = response.data;

      if (result.success && result.data) {
        const allOrders = result.data;

        // Lọc ra các order đã hoàn thành chế biến để làm cơ sở tính tiền
        const completedOrders = allOrders.filter(o => o.status === 'completed');
        // Tính tổng số tiền gốc trước thuế và giảm giá
        const calculatedSubTotal = completedOrders.reduce((acc, order) => acc + Number(order.sub_total || 0), 0);

        setBillData({
          allOrders: allOrders, // Toàn bộ các món (gồm cả món đang chế biến/hủy)
          orders: completedOrders, // Các món đã phục vụ hoàn tất
          subTotal: calculatedSubTotal,
          grandTotal: calculatedSubTotal * 1.1, // Tổng tiền cộng thêm VAT 10%
          originalGrandTotal: calculatedSubTotal * 1.1,
          vatAmount: calculatedSubTotal * 0.1,
          discountAmount: 0
        });
      }
    } catch (error) {
      console.error("Lỗi lấy tạm tính:", error);
    } finally {
      setLoadingBill(false);
    }
  };

  // Kết nối lắng nghe chuông thông báo trực tuyến qua Broadcast channel từ Supabase
  useEffect(() => {
    fetchTables();

    const channel = listenBroadcast('restaurant-notifications', 'call_staff', (payload) => {
      const data = payload.payload;
      setNotifications((prev) => [data, ...prev]);

      audio.play().catch(err => console.log(err));
    });

    // Hàm ngắt kết nối realtime khi rời trang
    return () => supabase.removeChannel(channel);
  }, []);

  // Mỗi khi nhân viên click chọn bàn ăn khác nhau, tự động tải hóa đơn tạm tính mới
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

  // Tìm kiếm thông tin voucher thành viên dựa trên Số điện thoại nhập vào
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (phoneNumber.trim().length >= 10) {
        try {
          const response = await axios.post(`${API_BASE_URL}/promotions/customer-voucher`, {
            phone_number: phoneNumber.trim()
          });

          if (response.data && response.data.success) {
            const allVouchers = response.data.promotion || [];
            // Chỉ lọc và giữ lại các voucher chưa được sử dụng
            const unusedVouchers = allVouchers.filter(v => !v.is_used);
            setCustomerVouchers(unusedVouchers);
          } else {
            setCustomerVouchers([]);
          }
        } catch (error) {
          setCustomerVouchers([]);
        }
      } else {
        // Nhập chưa đủ độ dài số điện thoại thì xóa sạch dữ liệu voucher liên quan
        setCustomerVouchers([]);
        setVoucherCode('');
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [phoneNumber]);

  // Gọi API tính toán thử hóa đơn (is_preview: true) để hiển thị chiết khấu voucher trực tiếp lên màn hình
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
            vatAmount: response.data.vat_amount || 0,
            voucherName: response.data.voucher_name
          }));
        }
      } catch (error) {
        console.error("Lỗi khi áp dụng voucher:", error);
      }
    };

    updatePreviewBill();
  }, [voucherCode, billData?.subTotal]);

  // Gửi yêu cầu đăng ký thông tin khách hàng mới
  const handleCreateCustomer = async (e) => {
    if (e) e.preventDefault();

    if (!newCustomerName.trim()) {
      return showAlert("Vui lòng nhập họ và tên khách hàng!", "warning");
    }
    if (!newCustomerPhone.trim() || newCustomerPhone.trim().length < 10) {
      return showAlert("Vui lòng nhập số điện thoại hợp lệ!", "warning");
    }
    if (!newCustomerEmail.trim()) {
      return showAlert("Vui lòng nhập địa chỉ email!", "warning");
    }

    setIsCreatingCustomer(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/customers/create`, {
        name: newCustomerName.trim(),
        phone_number: newCustomerPhone.trim(),
        email: newCustomerEmail.trim()
      });

      if (response.data && response.data.success) {
        showAlert("Thêm khách hàng thành công!", "success");
        // Reset sạch form nhập liệu và đóng modal tạo khách
        setNewCustomerName('');
        setNewCustomerPhone('');
        setNewCustomerEmail('');
        setIsCustomerModalOpen(false);
      } else {
        showAlert(response.data?.message || "Lỗi tạo khách hàng", "error");
      }
    } catch (error) {
      console.error("Lỗi khi thêm khách hàng:", error);
      showAlert(error.response?.data?.message || "Không thể kết nối đến máy chủ để tạo khách hàng.", "error");
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // Gọi API mở bàn mới (Tạo phiên ăn mới cho khách tại bàn)
  const handleOpenTable = async (tableId) => {
    if (!hasPermission('manage_tables')) {
      return showAlert("Tài khoản của bạn đã bị giới hạn, không có quyền thực hiện mở bàn mới!", "warning");
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/sessions/serving`, { table_id: tableId });
      const data = response.data;

      if (data.success) {
        showAlert("Mở bàn thành công!", "success");
        handleCloseModal();
        fetchTables();
      } else {
        showAlert("Lỗi: " + data.message, "error");
      }
    } catch (error) {
      console.error("Lỗi mở bàn:", error);
      showAlert("Không thể kết nối đến server.", "error");
    }
  };

  // Gọi API đóng bàn mà không cần thanh toán
  const handleCloseTable = async (tableId) => {
    if (!hasPermission('manage_tables')) {
      return showAlert("Tài khoản của bạn đã bị giới hạn, không có quyền đóng/hủy bàn!", "warning");
    }

    showConfirm("Bạn có chắc chắn muốn đóng bàn này mà không tính tiền không?", async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/sessions/close`, { table_id: tableId });
        const data = response.data;

        if (data.success) {
          showAlert("Đóng bàn thành công!", "success");
          handleCloseModal();
          fetchTables();
        } else {
          showAlert("Lỗi: " + data.message, "error");
        }
      } catch (error) {
        console.error("Lỗi đóng bàn:", error);
        showAlert("Không thể kết nối đến server.", "error");
      }
    });
  };

  // Chạy chức năng in hóa đơn ẩn (in nhiệt) qua thẻ iframe ẩn
  const openSilentPrint = (htmlContent) => {
    if (!htmlContent) return;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      // Loại bỏ iframe ra khỏi DOM sau khi kích hoạt in
      setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 500);
  };

  // Xử lý quy trình thanh toán hóa đơn (hỗ trợ Tiền mặt và VNPay)
  const handleCheckout = async (paymentMethod) => {
    if (!selectedTable?.sessionId) return;

    if (!hasPermission('checkout')) {
      return showAlert("Tài khoản của bạn đã bị giới hạn, không có quyền thanh toán hóa đơn này!", "warning");
    }

    if (!billData || !billData.allOrders || billData.allOrders.length === 0) {
      return showAlert("Bàn này chưa gọi món ăn nào!", "warning");
    }

    if (!billData.orders || billData.orders.length === 0) {
      return showAlert("Các món ăn tại bàn này đều ở trạng thái [Đang chế biến].\n\nPhải có ít nhất 1 món đã hoàn thành mới có thể tính tiền!", "warning");
    }

    const confirmMsg = paymentMethod === 'CASH'
      ? `Xác nhận thanh toán TIỀN MẶT cho ${selectedTable.name}?`
      : `Xác nhận tạo mã VNPAY QR cho ${selectedTable.name}?`;

    showConfirm(confirmMsg, async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/orders/checkout`, {
          session_id: selectedTable.sessionId,
          payment_method: paymentMethod,
          customer_name: 'Khách tại bàn',
          phone_number: phoneNumber.trim() || null,
          email: email.trim() || null,
          voucher_code: voucherCode.trim() || null,
          is_preview: false,
          close_user: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' // ID cứng đại diện cho thu ngân
        });
        const data = response.data;

        if (data.success) {
          if (paymentMethod === 'CASH') {
            showAlert(`Thanh toán thành công!\nSố tiền thu: ${data.tongtien.toLocaleString('vi-VN')} đ`, "success");

            // Nếu Backend trả về hóa đơn dạng HTML, thực hiện in hóa đơn nhiệt ngay lập tức
            if (data.html_bill) {
              openSilentPrint(data.html_bill);
            }

            handleCloseModal();
            fetchTables();
          } else if (paymentMethod === 'VNPAY') {
            try {
              // Gọi cổng thanh toán VNPAY của Backend để lấy link QR code
              const vnpayResponse = await axios.post(`${API_BASE_URL}/payments/vnpay`, {
                session_id: selectedTable.sessionId,
                amount: billData.grandTotal
              }, {
                headers: {
                  'ngrok-skip-browser-warning': 'true',
                  'Content-Type': 'application/json'
                }
              });
              const vnpayData = vnpayResponse.data;

              if (vnpayData.success && vnpayData.payment_url) {
                // Bật tab mới mở trang quét mã VNPay cho khách quét thanh toán
                window.open(vnpayData.payment_url, '_blank');

                setVnpayHtmlBill(data.html_bill);
                setShowPrintVnpayBtn(true); // Hiển thị nút xác nhận thu tiền VNPay thủ công

              } else {
                showAlert("Không sinh được link VNPAY: " + vnpayData.message, "error");
              }
            } catch (err) {
              console.error("Lỗi kết nối cổng thanh toán VNPAY:", err);
              showAlert("Lỗi kết nối đến cổng VNPay của máy chủ!", "error");
            }
          }
        } else {
          showAlert("Lỗi xử lý hóa đơn: " + data.message, "error");
        }
      } catch (error) {
        showAlert("Lỗi kết nối API thanh toán!", "error");
      }
    });
  };

  // Mở modal xem thông tin chi tiết của một bàn
  const handleOpenModal = (table) => {
    setSelectedTable(table);
    setIsModalOpen(true);
  };

  // Đóng modal xem chi tiết bàn và xóa bàn đang chọn ra khỏi bộ nhớ tạm
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTable(null), 300);
  };

  // Lọc danh sách bàn ăn dựa theo bộ lọc được chọn
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

        {/* Thanh tiêu đề Header */}
        <StaffHeader
          title="Bàn & Thanh Toán"
          subtitle="Hệ thống quản lý"
          notifications={notifications}
          onDismissNotification={(index) => setNotifications(prev => prev.filter((_, i) => i !== index))}
          onClearAllNotifications={() => setNotifications([])}
        />

        {/* Nội dung Sơ đồ bàn ăn */}
        <div className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Quản lý Sơ đồ bàn</h2>
              <p className="text-base text-neutralCustom mt-1">
                Tổng cộng: {tables.length} bàn | Hiện tại: {tables.filter(t => t.status === 'occupied').length} bàn đang phục vụ
              </p>
            </div>
          </div>

          {/* Các nút bấm chọn bộ lọc danh sách bàn ăn */}
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

          {/* Render danh sách bàn ăn tương ứng */}
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
                  {/* Icon Vương miện cho bàn VIP */}
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
                  
                  {/* Nhãn hiển thị trạng thái của bàn (nếu không trống) */}
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

      {/* POPUP CHI TIẾT BÀN ĂN (MODAL CHÍNH GIỮA) */}
      {isModalOpen && selectedTable && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={handleCloseModal}></div>

          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden animate-fade-in-up max-h-[90vh] z-[70]">

            {/* HEADER MODAL */}
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

            {/* GIAO DIỆN KHI BÀN ĐANG TRỐNG */}
            {selectedTable?.status === 'empty' && (
              <>
                <div className="flex-1 p-6 bg-white flex flex-col items-center justify-center h-full text-center py-10">
                  <span className="material-symbols-outlined text-6xl text-neutralCustom/30 mb-3">grid_view</span>
                  <p className="text-base font-bold text-gray-900">Bàn hiện đang trống</p>
                  <p className="text-sm text-neutralCustom/70 mt-1">Chưa có phiên ăn nào được mở tại bàn này.</p>
                </div>
                <div className="p-5 bg-culinaryBg border-t border-neutralCustom/20 shrink-0">
                  {/* Chỉ hiện nút mở bàn nếu nhân viên có quyền quản lý bàn */}
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

            {/* GIAO DIỆN KHI BÀN CÓ KHÁCH (ĐANG PHỤC VỤ HOẶC CHỜ THANH TOÁN) */}
            {(selectedTable?.status === 'occupied' || selectedTable?.status === 'waiting') && (
              <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                
                {/* CỘT TRÁI: HIỂN THỊ DANH SÁCH MÓN ĂN ĐÃ GỌI */}
                <div className="flex-1 p-6 bg-white flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-neutralCustom/10">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm border-b pb-2 mb-4 shrink-0">
                    <span className="material-symbols-outlined text-sm">restaurant_menu</span>
                    Món ăn đã đặt tại bàn:
                  </div>

                  {loadingBill ? (
                    <div className="text-center py-4 text-xs text-neutralCustom animate-pulse shrink-0">Đang đồng bộ hóa đơn tạm tính...</div>
                  ) : billData && billData.allOrders && billData.allOrders.length > 0 ? (
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                      {(() => {
                        // Nhóm các chi tiết món ăn trùng tên và trùng trạng thái để dễ quản lý hiển thị
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

                        // Render danh sách món ăn đã nhóm
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

                {/* CỘT PHẢI: THÔNG TIN KHÁCH HÀNG, ÁP VOUCHER & TÍNH TOÁN TIỀN HÓA ĐƠN */}
                <div className="w-full md:w-[360px] flex flex-col min-h-0 bg-white">
                  {/* Khách hàng & Khuyến mãi (Hỗ trợ cuộn dọc) */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Khách hàng & Khuyến mãi</p>
                      <div className="flex gap-2">
                        {/* Input số điện thoại để tra cứu thành viên */}
                        <input
                          type="text"
                          placeholder="Số điện thoại khách hàng"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          maxLength={10}
                          className="flex-1 px-3 py-2 text-sm bg-white border border-neutralCustom/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                        />
                        {/* Nút đăng ký thành viên mới */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!hasPermission('create_customer')) {
                              return showAlert("Tài khoản của bạn đã bị giới hạn, không có quyền đăng ký khách hàng mới!", "warning");
                            }
                            setNewCustomerPhone(phoneNumber);
                            setIsCustomerModalOpen(true);
                          }}
                          className="px-3.5 py-2 bg-stone-100 hover:bg-stone-250 border border-neutralCustom/25 text-gray-700 font-extrabold rounded-xl text-xs flex items-center gap-1 transition-all shadow-sm shrink-0 cursor-pointer"
                          title="Đăng ký thông tin khách hàng mới"
                        >
                          <span className="material-symbols-outlined text-[16px] text-primary">person_add</span>
                          Tạo mới
                        </button>
                      </div>

                      {/* Dropdown hiển thị các Voucher tìm được theo sđt khách */}
                      <div className="relative">
                        <select
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value)}
                          className={`w-full pl-3 pr-8 py-2 text-[10.5px] bg-white border outline-none focus:ring-2 transition-all shadow-sm font-semibold rounded-xl cursor-pointer
                            ${customerVouchers.length > 0 ? 'border-primary/50 text-primary focus:ring-primary/20 focus:border-primary' : 'border-neutralCustom/30 text-gray-500'}
                          `}
                        >
                          <option value="">
                            {customerVouchers.length > 0 ? "-- Chọn mã giảm giá của khách --" : "-- Khách chưa có mã giảm giá --"}
                          </option>
                          {customerVouchers.map((v) => (
                            <option key={v.code || v.id} value={v.code || v.id}>
                              {v.code || v.id} - {v.name} (Giảm: {v.discount_type === 'PERCENTAGE' ? `${v.discount_value}%` : `${Number(v.discount_value).toLocaleString('vi-VN')}đ`})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Chi tiết tính tiền hóa đơn tạm tính */}
                    {billData && (
                      <div className="border-t border-dashed border-neutralCustom/30 pt-3 mt-4 space-y-2 text-sm">
                        <div className="flex justify-between text-neutralCustom">
                          <span>Tổng tiền món (Đã xuất món):</span>
                          <span className="font-bold text-gray-800">{billData.subTotal?.toLocaleString('vi-VN')} đ</span>
                        </div>

                        {billData.discountAmount > 0 && (
                          <div className="flex justify-between text-red-600 font-bold">
                            <span>Giảm giá (Voucher):</span>
                            <span>-{Number(billData.discountAmount).toLocaleString('vi-VN')} đ</span>
                          </div>
                        )}

                        {billData.vatAmount !== undefined && (
                          <div className="flex justify-between text-neutralCustom">
                            <span>Thuế VAT (10%):</span>
                            <span className="font-bold text-gray-800">+{Number(billData.vatAmount).toLocaleString('vi-VN')} đ</span>
                          </div>
                        )}

                        {/* Tên khuyến mãi được áp dụng */}
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

                  {/* KHU VỰC CÁC NÚT HÀNH ĐỘNG DƯỚI ĐÁY CỦA PANEL THANH TOÁN */}
                  <div className="p-5 bg-culinaryBg border-t border-neutralCustom/20 shrink-0">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Nút bấm Thanh toán TIỀN MẶT */}
                        <button
                          onClick={() => handleCheckout('CASH')}
                          disabled={!hasPermission('checkout')}
                          className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all
                            ${hasPermission('checkout')
                              ? 'bg-primary text-white hover:bg-secondary cursor-pointer'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'}`}
                        >
                          TIỀN MẶT
                        </button>

                        {/* Nút bấm Thanh toán VN PAY */}
                        <button
                          onClick={() => handleCheckout('VNPAY')}
                          disabled={!hasPermission('checkout')}
                          className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5
                            ${hasPermission('checkout')
                              ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'}`}
                        >
                          <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                          VN PAY
                        </button>
                      </div>

                      {/* Giao diện trạng thái đang đợi khách chuyển khoản VNPay */}
                      {showPrintVnpayBtn && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-center shadow-inner animation-fade-in">
                          <p className="text-yellow-700 font-bold text-xs mb-2 animate-pulse">Đang chờ khách quét mã VNPAY...</p>
                          <button
                            onClick={async () => {
                              try {
                                const storedUser = localStorage.getItem('user');
                                const parsedUser = storedUser ? JSON.parse(storedUser) : null;
                                const userId = parsedUser?.id || null; // Lấy ID của nhân viên đang đăng nhập

                                // Xác nhận đóng phiên VNPay thủ công từ phía thu ngân
                                const response = await axios.post(`${API_BASE_URL}/orders/checkout`, {
                                  session_id: selectedTable.sessionId,
                                  payment_method: 'VNPAY',
                                  is_preview: false,
                                  close_user: userId,
                                  is_manual: true
                                });

                                if (response.data.success) {
                                  // In hóa đơn nhiệt chính thức
                                  const billToPrint = response.data.html_bill || vnpayHtmlBill;
                                  if (billToPrint) {
                                    openSilentPrint(billToPrint);
                                  }

                                  // Dọn dẹp trạng thái và cập nhật lại sơ đồ bàn trống
                                  setShowPrintVnpayBtn(false);
                                  setVnpayHtmlBill('');
                                  handleCloseModal();
                                  fetchTables();
                                }
                              } catch (error) {
                                console.error("Lỗi đóng phiên VNPAY thủ công:", error);
                                alert("Không thể đóng bàn: " + (error.response?.data?.message || error.message));
                              }
                            }}
                            className="w-full bg-green-600 text-white font-bold py-2.5 px-4 rounded-lg text-sm hover:bg-green-700 shadow transition-all cursor-pointer"
                          >
                            KHÁCH ĐÃ CHUYỂN KHOẢN - IN BILL
                          </button>
                        </div>
                      )}

                      {/* Hiển thị dòng nhắc nhở nếu thu ngân bị chặn quyền thanh toán */}
                      {!hasPermission('checkout') && (
                        <p className="text-[11px] text-red-500 font-bold text-center italic mt-1.5">
                          ⚠️ Tài khoản của bạn đã bị giới hạn quyền thanh toán (Checkout).
                        </p>
                      )}

                      {/* Nút hủy phiên ăn tại bàn (ĐÓNG BÀN) */}
                      <button
                        onClick={() => handleCloseTable(selectedTable.id)}
                        disabled={!hasPermission('manage_tables')}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all border-2 bg-white
                          ${hasPermission('manage_tables')
                            ? 'border-primary text-primary hover:bg-primary/10 cursor-pointer'
                            : 'border-gray-300 text-gray-400 cursor-not-allowed opacity-60'}`}
                      >
                        ĐÓNG BÀN (HỦY PHIÊN)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP HỘP THOẠI CUSTOM DIALOG THÔNG BÁO CHUNG */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={closeDialog}></div>
          <div className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-neutralCustom/10 text-center animate-scale-up z-[210]">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center border border-neutralCustom/10">
              {dialog.type === 'success' && (
                <span className="material-symbols-outlined text-4xl text-green-500 bg-green-50 w-full h-full rounded-full flex items-center justify-center">check_circle</span>
              )}
              {dialog.type === 'error' && (
                <span className="material-symbols-outlined text-4xl text-red-500 bg-red-50 w-full h-full rounded-full flex items-center justify-center">error</span>
              )}
              {dialog.type === 'warning' && (
                <span className="material-symbols-outlined text-4xl text-amber-500 bg-amber-50 w-full h-full rounded-full flex items-center justify-center">warning</span>
              )}
              {dialog.type === 'info' && (
                <span className="material-symbols-outlined text-4xl text-blue-500 bg-blue-50 w-full h-full rounded-full flex items-center justify-center">info</span>
              )}
              {dialog.type === 'confirm' && (
                <span className="material-symbols-outlined text-4xl text-primary bg-primary/10 w-full h-full rounded-full flex items-center justify-center">help</span>
              )}
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">{dialog.title}</h3>
            <p className="text-sm text-neutralCustom mb-6 whitespace-pre-line leading-relaxed">{dialog.message}</p>
            <div className="flex gap-3 justify-center">
              {dialog.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => {
                      if (dialog.onCancel) dialog.onCancel();
                      closeDialog();
                    }}
                    className="w-1/2 py-2.5 border border-neutralCustom/20 text-neutralCustom bg-white font-bold text-sm rounded-xl hover:bg-stone-50 transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={() => {
                      if (dialog.onConfirm) dialog.onConfirm();
                      closeDialog();
                    }}
                    className="w-1/2 py-2.5 bg-primary text-white font-black text-sm rounded-xl hover:bg-secondary transition-all cursor-pointer shadow-md shadow-primary/10"
                  >
                    Xác nhận
                  </button>
                </>
              ) : (
                <button
                  onClick={closeDialog}
                  className="px-8 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-secondary transition-all cursor-pointer shadow-md shadow-primary/10"
                >
                  Đồng ý
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐĂNG KÝ THÔNG TIN KHÁCH HÀNG MỚI */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsCustomerModalOpen(false)}
          ></div>
          
          <div className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-neutralCustom/10 animate-scale-up z-[130]">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">person_add</span>
                Đăng ký Khách hàng mới
              </h3>
              <button 
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-250 text-stone-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập họ và tên (VD: Nguyễn Văn A)"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutralCustom/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10,11}"
                  placeholder="Nhập số điện thoại (VD: 0987654321)"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutralCustom/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Nhập địa chỉ email (VD: khachhang@gmail.com)"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutralCustom/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="w-1/2 py-3 border border-neutralCustom/20 text-neutralCustom bg-white font-bold text-sm rounded-xl hover:bg-stone-50 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCustomer}
                  className="w-1/2 py-3 bg-primary text-white font-black text-sm rounded-xl hover:bg-secondary transition-all cursor-pointer shadow-md shadow-primary/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isCreatingCustomer ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      <span>Xác nhận</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManager;