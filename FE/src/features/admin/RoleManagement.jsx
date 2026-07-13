import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import axios from 'axios';

const RoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State cho Modal Thêm User
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '', password: '', fullname: '', role: 'cashier', email: '', phone_number: '', is_active: true
  });

  // State cho Modal Sửa Thông Tin Cá Nhân
  const [isEditInfoModalOpen, setIsEditInfoModalOpen] = useState(false);
  const [editInfoForm, setEditInfoForm] = useState({
    id: '', fullname: '', username: '', email: '', phone_number: ''
  });

  // State cho phần Edit Quyền (Cột bên phải)
  const [editData, setEditData] = useState({ role: '', is_active: true, permissions: {} });

  // --- STATES CHỐT CHẶN BẢO MẬT THAY THẾ ALERT/CONFIRM TRÌNH DUYỆT ---
  const [alertModal, setAlertModal] = useState({ show: false, message: '', title: 'Thông báo', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  const showAlert = (message, type = 'success', title = 'Thông báo') => {
    setAlertModal({ show: true, message, title, type });
  };

  // ĐỊNH NGHĨA CÁC QUYỀN
  const permissionCategories = [
    {
      title: 'Nhóm Quyền Quản Trị (Admin)',
      items: [
        { id: 'manage_menu', name: 'Quản lý Menu', desc: 'Thêm xoá sửa món', icon: 'menu_book' },
        { id: 'view_reports', name: 'Xem báo cáo doanh thu', desc: 'Xem thống kê, lợi nhuận, hóa đơn,...', icon: 'bar_chart' },
        { id: 'manage_ingredients', name: 'Quản lý nguyên vật liệu', desc: 'Thêm, xoá, sửa nguyên vật liệu,...', icon: 'inventory' },
        { id: 'promotions', name: 'Ưu đãi & Tặng quà', desc: 'Quản lý các khuyến mãi,...', icon: 'campaign' },
        { id: 'manage_news', name: 'Quản lý tin tức', desc: 'Quản lý các bài viết, tin tức,...', icon: 'news' },
        { id: 'manage_shift', name: 'Quản lý lịch làm', desc: 'Quản lý ca làm việc của nhân viên,...', icon: 'shift' },
        { id: 'manage_review', name: 'Quản lý đánh giá khách hàng', desc: 'Quản lý và phản hồi các đánh giá của khách hàng,...', icon: 'comment' },
      ]
    },
    {
      title: 'Nhóm Quyền Đầu Bếp (Chef)',
      items: [
        { id: 'view_recipes', name: 'Xem công thức', desc: 'Xem bảng định lượng công thức', icon: 'soup_kitchen' },
        { id: 'process_orders', name: 'Xử lý Order', desc: 'Xem danh sách order và thao tác trạng thái món ăn', icon: 'room_service' },
      ]
    },
    {
      title: 'Nhóm Quyền Thu Ngân (Cashier)',
      items: [
        { id: 'checkout', name: 'Tính tiền & In hóa đơn', desc: 'Xử lý thanh toán', icon: 'point_of_sale' },
        { id: 'manage_tables', name: 'Quản lý bàn', desc: 'Mở bàn, đóng bàn', icon: 'table_restaurant' },
        { id: 'view_reviews', name: 'Xem đánh giá', desc: 'Đọc phản hồi khách hàng', icon: 'reviews' },
      ]
    },
    {
      title: 'Nhóm Quyền Quản Trị Hệ Thống (Super_Admin)',
      items: [
        { id: 'manage_users', name: 'Phân quyền & Tài khoản', desc: 'Tạo, xóa, cấp quyền nhân viên', icon: 'manage_accounts' },
      ]
    }
  ];

  // Màu sắc cho nhãn Role
  const roleColors = {
    super_admin: 'text-red-600 bg-red-50 border border-red-200',
    admin: 'text-secondary bg-secondary/10',
    chef: 'text-primary bg-primary/10',
    cashier: 'text-tertiary bg-tertiary/10'
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/user`);
      const data = res.data.data || res.data;
      setUsers(data);
      if (data.length > 0 && !activeUserId) {
        handleSelectUser(data[0]);
      } else if (activeUserId) {
        // Refresh lại activeUser nếu đang có
        const currentUser = data.find(u => u.id === activeUserId);
        if (currentUser) handleSelectUser(currentUser);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setActiveUserId(user.id);
    let userPermissions = {};
    try {
      // Cố gắng parse an toàn
      if (typeof user.permissions === 'string') {
        userPermissions = JSON.parse(user.permissions);
      } else if (typeof user.permissions === 'object' && user.permissions !== null) {
        userPermissions = user.permissions;
      }
    } catch (e) {
      console.error("Lỗi parse JSON permissions:", e);
      userPermissions = {};
    }

    setEditData({
      role: user.role || 'cashier',
      is_active: user.is_active,
      permissions: userPermissions
    });
  };

  // Lấy User hiện tại (từ Cột Trái)
  const activeUser = users.find(u => u.id === activeUserId);

  // KIỂM TRA SUPER_ADMIN BẰNG DỮ LIỆU ĐANG EDIT BÊN PHẢI
  const isSuperAdmin = editData.role?.toLowerCase() === 'super_admin';

  // XỬ LÝ KHI CLICK VÀO CHECKBOX QUYỀN
  const handleTogglePermission = (permId) => {
    if (isSuperAdmin) return;

    setEditData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permId]: !prev.permissions[permId]
      }
    }));
  };

  // KHI ĐỔI ROLE TỪ SELECT BOX -> TỰ ĐỘNG CẬP NHẬT LẠI CHECKBOX MẶC ĐỊNH
  const handleRoleChange = (newRole) => {
    let newPerms = { ...editData.permissions };

    if (newRole === 'admin') newPerms = { manage_menu: true, view_reports: true, manage_ingredients: true, manage_news: true };
    if (newRole === 'chef') newPerms = { view_recipes: true, process_orders: true };
    if (newRole === 'cashier') newPerms = { checkout: true, manage_tables: true, view_reviews: true };
    if (newRole === 'super_admin') {
      permissionCategories.forEach(cat => cat.items.forEach(item => newPerms[item.id] = true));
    }

    setEditData(prev => ({
      ...prev,
      role: newRole,
      permissions: newPerms
    }));
  };

  // CẬP NHẬT PHÂN QUYỀN VÀ ROLE
  const handleUpdateRole = async () => {
    setIsSaving(true);
    try {
      const payload = {
        id: activeUserId,
        role: editData.role,
        is_active: editData.is_active,
        permissions: JSON.stringify(editData.permissions)
      };

      const res = await axios.put(`${import.meta.env.VITE_API_URL}/user/update`, payload);
      if (res.data.success) {
        showAlert("Cập nhật phân quyền thành công!", "success", "Thành công");
        fetchUsers();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || "Lỗi cập nhật!", "error", "Thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  // MỞ MODAL SỬA THÔNG TIN
  const handleOpenEditInfo = (emp) => {
    setEditInfoForm({
      id: emp.id,
      fullname: emp.fullname,
      username: emp.username,
      email: emp.email || '',
      phone_number: emp.phone_number || ''
    });
    setIsEditInfoModalOpen(true);
  };

  // CẬP NHẬT THÔNG TIN CÁ NHÂN
  const handleUpdateInfoSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Vì API updateRoleUser đang dùng chung, cần gửi kèm lại role/permissions để ko bị mất
      const currentUser = users.find(u => u.id === editInfoForm.id);

      const payload = {
        id: editInfoForm.id,
        fullname: editInfoForm.fullname,
        email: editInfoForm.email,
        phone_number: editInfoForm.phone_number,
        role: currentUser.role,
        is_active: currentUser.is_active,
        permissions: JSON.stringify(typeof currentUser.permissions === 'string' ? JSON.parse(currentUser.permissions || '{}') : (currentUser.permissions || {}))
      };

      const res = await axios.put(`${import.meta.env.VITE_API_URL}/user/update`, payload);
      if (res.data.success) {
        showAlert("Cập nhật thông tin thành công!", "success", "Thành công");
        setIsEditInfoModalOpen(false);
        fetchUsers();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || "Lỗi khi cập nhật thông tin!", "error", "Thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let defaultPerms = {};
      if (newUser.role === 'super_admin') {
        permissionCategories.forEach(cat => cat.items.forEach(item => defaultPerms[item.id] = true));
      } else if (newUser.role === 'admin') {
        defaultPerms = { manage_menu: true, view_reports: true, manage_ingredients: true, manage_news: true };
      } else if (newUser.role === 'chef') {
        defaultPerms = { view_recipes: true, process_orders: true };
      } else if (newUser.role === 'cashier') {
        defaultPerms = { checkout: true, manage_tables: true, view_reviews: true };
      }

      const payload = {
        ...newUser,
        permissions: JSON.stringify(defaultPerms),
        created_at: new Date().toISOString()
      };

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/add`, payload);
      if (res.data.success) {
        showAlert(res.data.message || "Đã thêm nhân viên và gửi Email thành công!", "success", "Thành công");
        setIsAddModalOpen(false);
        setNewUser({ username: '', password: '', fullname: '', role: 'cashier', email: '', phone_number: '', is_active: true });
        fetchUsers();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || "Lỗi khi thêm nhân viên!", "error", "Thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleLockUser = async (emp) => {
    if (emp.role?.toLowerCase() === 'super_admin') return showAlert("Không thể thao tác trên tài khoản Super Admin!", "error", "Không cho phép");

    const confirmMessage = emp.is_active
      ? `Bạn có chắc chắn muốn KHÓA tài khoản của "${emp.fullname}"?`
      : `Bạn có chắc chắn muốn MỞ KHÓA tài khoản của "${emp.fullname}"?`;

    setConfirmModal({
      show: true,
      title: emp.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
      message: confirmMessage,
      onConfirm: async () => {
        try {
          if (emp.is_active) {
            // Trường hợp KHÓA: Gọi API delete để soft lock (Backend sẽ đổi is_active = false)
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/user/delete/${emp.id}`);
            if (res.data.success) {
              showAlert("Đã khóa tài khoản thành công!", "success", "Khóa thành công");
              fetchUsers();
            }
          } else {
            // Trường hợp MỞ KHÓA: Gọi API update truyền is_active = true
            const payload = {
              id: emp.id,
              role: emp.role,
              is_active: true,
              permissions: typeof emp.permissions === 'string' ? emp.permissions : JSON.stringify(emp.permissions || {})
            };
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/user/update`, payload);
            if (res.data.success) {
              showAlert("Đã mở khóa tài khoản thành công!", "success", "Mở khóa thành công");
              fetchUsers();
            }
          }
        } catch (error) {
          showAlert("Lỗi khi cập nhật trạng thái hoạt động tài khoản!", "error", "Lỗi cập nhật");
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans h-screen flex overflow-hidden">
      <AdminSidebar currentTab="user" />
      <AdminHeader />

      <main className="flex-1 ml-64 pt-20 p-6 h-screen flex flex-col bg-culinaryBg w-[calc(100%-16rem)] overflow-hidden">
        <div className="w-full flex flex-col h-full overflow-hidden">
          {/* Page Header */}
          <header className="mb-4 flex justify-between items-end shrink-0">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Người dùng & Phân quyền</h2>
              <p className="text-neutralCustom text-xs md:text-sm">Quản lý nhân viên, gán vai trò và thiết lập quyền truy cập bằng Checkbox.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsAddModalOpen(true)} className="px-5 py-2 md:px-6 md:py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-secondary transition-all flex items-center gap-2 shadow-md active:scale-95 text-xs md:text-sm">
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">person_add</span>
                Thêm nhân viên mới
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden mb-4">
            {/* CỘT TRÁI: DANH SÁCH NHÂN VIÊN */}
            <section className="md:col-span-4 flex flex-col h-full overflow-hidden">
              <div className="bg-white border border-neutralCustom/20 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
                <div className="p-3.5 bg-culinaryBg/50 border-b border-neutralCustom/20 flex justify-between items-center shrink-0">
                  <h3 className="text-base font-bold text-gray-900">Danh sách tài khoản</h3>
                  <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[11px] font-bold">{users.length} User</span>
                </div>

                <div className="divide-y divide-neutralCustom/10 overflow-y-auto flex-1 custom-scrollbar">
                  {isLoading ? (
                    <div className="p-6 text-center text-neutralCustom text-xs">Đang tải dữ liệu...</div>
                  ) : users.length === 0 ? (
                    <div className="p-6 text-center text-neutralCustom text-xs">Chưa có dữ liệu nhân viên.</div>
                  ) : (
                    users.map((emp) => {
                      const colorClass = roleColors[emp.role?.toLowerCase()] || 'bg-gray-100 text-gray-700';
                      return (
                        <div
                          key={emp.id}
                          onClick={() => handleSelectUser(emp)}
                          className={`relative p-2.5 flex flex-col gap-1 cursor-pointer transition-all group ${activeUserId === emp.id ? 'bg-primary/5 shadow-inner' : 'hover:bg-culinaryBg/50'} ${!emp.is_active ? 'opacity-60' : ''}`}
                        >
                          {activeUserId === emp.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}

                          <div className="flex justify-between items-center">
                            <div className="min-w-0 pr-2">
                              <h4 className={`text-sm md:text-base font-bold leading-tight flex items-center gap-1.5 truncate ${activeUserId === emp.id ? 'text-primary' : 'text-gray-900 group-hover:text-primary'}`}>
                                {emp.fullname}
                                {!emp.is_active && <span className="text-[9px] bg-red-50 text-red-650 px-1 py-0.2 rounded font-extrabold uppercase scale-90">Khóa</span>}
                              </h4>
                              <p className="text-[10px] md:text-xs text-neutralCustom mt-0.5 font-medium">Username: <b>{emp.username}</b></p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setIsEditInfoModalOpen(true); setEditInfoForm(emp); }}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <span className="material-symbols-outlined text-[16px]">edit</span></button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleLockUser(emp); }}
                                  className={`transition-colors ${emp.is_active ? 'text-red-400 hover:text-red-650' : 'text-green-500 hover:text-green-700'}`}
                                  title={emp.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    {emp.is_active ? 'lock' : 'lock_open'}
                                  </span>
                                </button>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${roleColors[emp.role] || 'bg-gray-100'}`}>{emp.role}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </section>

            {/* CỘT PHẢI: GÁN QUYỀN (CHECKBOX) & TRẠNG THÁI */}
            <section className="md:col-span-8 flex flex-col h-full overflow-hidden">
              {activeUser ? (
                <div className="bg-white border border-neutralCustom/20 rounded-2xl shadow-md flex flex-col h-full overflow-hidden">

                  {/* Header info */}
                  <div className="p-4 bg-culinaryBg/30 border-b border-neutralCustom/20 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{activeUser.fullname}</h3>
                        <p className="text-xs text-neutralCustom mt-0.5">Tick chọn để bật/tắt quyền truy cập từng tính năng.</p>
                      </div>
                    </div>
                    {/* Trạng thái hoạt động */}
                    <div className="flex items-center gap-2">
                      <select
                        value={editData.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        disabled={isSuperAdmin}
                        className="px-2.5 py-1 text-xs font-bold border border-neutralCustom/30 rounded-lg outline-none bg-white cursor-pointer disabled:opacity-50"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Quản lý (Admin)</option>
                        <option value="chef">Đầu bếp (Chef)</option>
                        <option value="cashier">Thu ngân (Cashier)</option>
                      </select>
                    </div>
                  </div>

                  {/* Body: Form Gán Quyền (CHECKBOX) */}
                  <div className="p-4 flex-grow overflow-y-auto custom-scrollbar">
                    {isSuperAdmin && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">gpp_good</span>
                        Tài khoản Super Admin mặc định sở hữu toàn bộ đặc quyền (đã được tick sẵn) và không thể thay đổi.
                      </div>
                    )}

                    <div className="space-y-4">
                      {permissionCategories.map((category, catIdx) => (
                        <div key={catIdx}>
                          <h4 className="text-[10px] md:text-xs font-bold text-neutralCustom uppercase tracking-wider mb-2 border-b border-neutralCustom/10 pb-1.5">
                            {category.title}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {category.items.map((item) => {
                              // Dùng biến isSuperAdmin (dựa theo Role đang sửa) để quyết định tick
                              const isChecked = isSuperAdmin ? true : !!editData.permissions?.[item.id];

                              return (
                                <div
                                  key={item.id}
                                  onClick={() => handleTogglePermission(item.id)}
                                  className={`flex items-start gap-2.5 p-2.5 md:p-3 rounded-xl border transition-all cursor-pointer select-none
                                    ${isChecked ? 'bg-primary/5 border-primary/30' : 'bg-white border-neutralCustom/15 hover:border-primary/40'}
                                    ${isSuperAdmin ? 'opacity-65 cursor-not-allowed' : ''}
                                  `}
                                >
                                  <div className="mt-0.5 shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      readOnly
                                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary pointer-events-none"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`font-bold text-xs md:text-sm truncate ${isChecked ? 'text-primary' : 'text-gray-900'}`}>{item.name}</p>
                                    <p className="text-[10px] md:text-xs text-neutralCustom mt-0.5 leading-tight">{item.desc}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Trạng thái tài khoản */}
                    <div className="mt-6 border-t border-neutralCustom/10 pt-4">
                      <h4 className="text-[10px] font-bold text-neutralCustom uppercase tracking-wider mb-2">Trạng thái đăng nhập</h4>
                      <div className={`flex items-center gap-2.5 p-3 rounded-xl border w-fit transition-all ${editData.is_active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} ${isSuperAdmin ? 'opacity-50 pointer-events-none' : ''}`}>
                        <input
                          type="checkbox"
                          id="acc_active"
                          checked={editData.is_active}
                          onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                          className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                        />
                        <label htmlFor="acc_active" className={`font-bold text-xs cursor-pointer ${editData.is_active ? 'text-green-700' : 'text-red-750'}`}>
                          {editData.is_active ? 'Tài khoản đang Hoạt động (Cho phép Login)' : 'Tài khoản đã bị Khóa (Không thể Login)'}
                        </label>
                      </div>
                    </div>

                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 bg-culinaryBg/50 border-t border-neutralCustom/20 flex justify-between items-center shrink-0">
                    <span className="text-[11px] text-neutralCustom italic">
                      Quyền sẽ có tác dụng khi nhân viên tải lại trang.
                    </span>
                    <button
                      onClick={handleUpdateRole}
                      disabled={isSuperAdmin || isSaving} // Không cho phép Lưu nếu đang là Super Admin
                      className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-secondary active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-xs"
                    >
                      {isSaving ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> : <span className="material-symbols-outlined text-[16px]">save</span>}
                      {isSaving ? 'Đang lưu...' : 'Lưu cấu hình quyền'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-neutralCustom/20 rounded-2xl h-full flex flex-col items-center justify-center text-neutralCustom">
                  <span className="material-symbols-outlined text-6xl opacity-20 mb-4">manage_accounts</span>
                  <p>Chọn một nhân viên bên trái để xem và gán quyền.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* MODAL THÊM USER MỚI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-neutralCustom/20 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Thêm nhân viên mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutralCustom hover:text-gray-900 p-1 rounded-full hover:bg-gray-200 transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Họ và Tên <span className="text-red-500">*</span></label>
                  <input required type="text" value={newUser.fullname} onChange={(e) => setNewUser({ ...newUser, fullname: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Tên đăng nhập <span className="text-red-500">*</span></label>
                  <input required type="text" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Mật khẩu cấp phát <span className="text-red-500">*</span></label>
                  <input required type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Email (Nhận thông báo) <span className="text-red-500">*</span></label>
                  <input required type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Số điện thoại <span className="text-red-500">*</span></label>
                  <input required type="tel" value={newUser.phone_number} onChange={(e) => setNewUser({ ...newUser, phone_number: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Vai trò cơ sở (Title) <span className="text-red-500">*</span></label>
                  <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer">
                    <option value="cashier">Thu Ngân (Cashier)</option>
                    <option value="chef">Đầu Bếp (Chef)</option>
                    <option value="admin">Quản Lý Cơ Sở (Admin)</option>
                    <option value="super_admin">Quản Trị Hệ Thống (Super_Admin)</option>
                  </select>
                  <p className="text-[11px] text-neutralCustom mt-1">Sau khi tạo, bạn có thể chỉnh sửa lại các quyền Checkbox chi tiết ở bên ngoài.</p>
                </div>
              </div>
            </form>

            <div className="p-5 border-t border-neutralCustom/20 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors">Hủy</button>
              <button onClick={handleAddSubmit} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-secondary shadow-md flex items-center gap-2 transition-all disabled:opacity-50">
                {isSaving ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">person_add</span>}
                {isSaving ? 'Đang xử lý...' : 'Tạo tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SỬA THÔNG TIN CÁ NHÂN */}
      {isEditInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsEditInfoModalOpen(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-neutralCustom/20 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Sửa thông tin cá nhân</h3>
              <button onClick={() => setIsEditInfoModalOpen(false)} className="text-neutralCustom hover:text-gray-900 p-1 rounded-full hover:bg-gray-200 transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>

            <form onSubmit={handleUpdateInfoSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Tên đăng nhập (Chỉ đọc)</label>
                  <input type="text" value={editInfoForm.username} disabled className="w-full px-4 py-2.5 bg-gray-100 border border-neutralCustom/30 rounded-xl text-sm outline-none text-gray-500 cursor-not-allowed font-medium" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Họ và Tên <span className="text-red-500">*</span></label>
                  <input required type="text" value={editInfoForm.fullname} onChange={(e) => setEditInfoForm({ ...editInfoForm, fullname: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Email</label>
                  <input type="email" value={editInfoForm.email} onChange={(e) => setEditInfoForm({ ...editInfoForm, email: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Số điện thoại</label>
                  <input type="tel" value={editInfoForm.phone_number} onChange={(e) => setEditInfoForm({ ...editInfoForm, phone_number: e.target.value })} className="w-full px-4 py-2.5 border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            </form>

            <div className="p-5 border-t border-neutralCustom/20 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsEditInfoModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors">Hủy</button>
              <button onClick={handleUpdateInfoSubmit} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-secondary shadow-md flex items-center gap-2 transition-all disabled:opacity-50">
                {isSaving ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                {isSaving ? 'Đang xử lý...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 HỆ THỐNG ALERT MODAL THAY THẾ TOAST (Bảo mật, có nút bấm Đồng ý) */}
      {alertModal.show && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-neutralCustom/10 text-center animate-scale-up">
            <div className={`w-16 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              alertModal.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              <span className="material-symbols-outlined text-3xl">
                {alertModal.type === 'success' ? 'check_circle' : 'error'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{alertModal.title}</h3>
            <p className="text-sm text-neutralCustom mb-6 leading-relaxed">{alertModal.message}</p>
            <button 
              onClick={() => setAlertModal({ show: false, message: '', title: 'Thông báo', type: 'success' })} 
              className={`w-full py-3 text-white font-bold rounded-xl text-sm transition-all shadow-md ${
                alertModal.type === 'success' ? 'bg-primary hover:bg-secondary' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              Đồng ý
            </button>
          </div>
        </div>
      )}

      {/* 🌟 HỆ THỐNG HỘP THOẠI XÁC NHẬN THAY THẾ CONFIRM */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-neutralCustom/10 text-center animate-scale-up">
            <div className="w-16 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
              <span className="material-symbols-outlined text-3xl">info</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-neutralCustom mb-6 leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })} 
                className="w-1/2 py-3 border border-neutralCustom/20 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={confirmModal.onConfirm} 
                className="w-1/2 py-3 bg-primary text-white font-bold rounded-xl text-sm hover:bg-secondary transition-all"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoleManagement;