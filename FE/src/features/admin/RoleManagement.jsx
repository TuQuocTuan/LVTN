import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';

const RoleManagement = () => {
  // Mặc định chọn tài khoản số 0 (Super Admin) vừa thêm vào
  const [activeUserId, setActiveUserId] = useState(0); 

  // State quản lý trạng thái các quyền bật/tắt của các user thông thường
  const [permissions, setPermissions] = useState({
    create_invoice: true,
    apply_discount: true,
    delete_invoice: false,
    edit_price: false,
    view_report: true,
  });

  // --- DỮ LIỆU MẪU (BỔ SUNG SUPER ADMIN) ---
  const employees = [
    { id: 0, name: 'Trần Thiên Tuệ', email: 'tue.tranthien@chefos.vn', role: 'Super Admin', roleColor: 'text-red-600 bg-red-50 border border-red-200' },
    { id: 1, name: 'Từ Quốc Tuấn', email: 'tuan.tuquoc@chefos.vn', role: 'Super Admin', roleColor: 'text-red-600 bg-red-50 border border-red-200' },
    { id: 2, name: 'Nguyễn Thị Thu La', email: 'la.thu@chefos.vn', role: 'Quản lý', roleColor: 'text-secondary bg-secondary/10' },
    { id: 3, name: 'Lê Thị Hoa', email: 'hoa.le@chefos.vn', role: 'Thu ngân', roleColor: 'text-tertiary bg-tertiary/10' },
    { id: 4, name: 'Phạm Minh Đức', email: 'duc.pham@chefos.vn', role: 'Bếp trưởng', roleColor: 'text-primary bg-primary/10' },
  ];

  const permissionCategories = [
    {
      title: 'Quản lý bán hàng & Hóa đơn',
      items: [
        { id: 'create_invoice', name: 'Tạo hóa đơn mới', desc: 'Cho phép mở bàn và thêm món vào hóa đơn', icon: 'add_shopping_cart' },
        { id: 'apply_discount', name: 'Áp dụng mã giảm giá', desc: 'Thực hiện chiết khấu trên tổng hóa đơn', icon: 'percent' },
        { id: 'delete_invoice', name: 'Xóa/Hủy hóa đơn đã thanh toán', desc: 'Chỉ dành cho quản lý cấp cao', icon: 'delete_sweep' },
      ]
    },
    {
      title: 'Quản lý thực đơn',
      items: [
        { id: 'edit_price', name: 'Chỉnh sửa giá món ăn', desc: 'Thay đổi thông tin niêm yết trên menu', icon: 'edit_note' },
        { id: 'view_report', name: 'Xem báo cáo tồn kho món', desc: 'Theo dõi số lượng món còn khả dụng', icon: 'visibility' },
      ]
    }
  ];

  const activeUser = employees.find(emp => emp.id === activeUserId);
  const isSuperAdmin = activeUser?.role === 'Super Admin';

  // Xử lý khi bật/tắt quyền (Nếu là Super Admin thì chặn không cho sửa)
  const handleToggle = (permId) => {
    if (isSuperAdmin) return;
    setPermissions(prev => ({
      ...prev,
      [permId]: !prev[permId]
    }));
  };

  // Hàm xử lý khi bấm nút Sửa
  const handleEditEmployee = (employee) => {
    alert(`Mở form sửa nhân viên: ${employee.name}`);
  };

  // Hàm xử lý khi bấm nút Xóa
  const handleDeleteEmployee = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống?")) {
      alert(`Xóa nhân viên có ID: ${id}`);
    }
  };

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex">
      
      <AdminSidebar currentTab="user" />
      <AdminHeader />

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 pt-24 p-8 min-h-screen bg-culinaryBg w-full">
        <div className="w-full">
          {/* Page Header */}
          <header className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Người dùng & Phân quyền</h2>
              <p className="text-neutralCustom text-base">Quản lý nhân viên và thiết lập quyền truy cập hệ thống ChefOS.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-secondary transition-all flex items-center gap-2 shadow-md active:scale-95">
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                Thêm nhân viên
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Danh sách nhân viên của quán */}
            <section className="md:col-span-4 flex flex-col gap-4">
              <div className="bg-white border border-neutralCustom/20 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-culinaryBg/50 border-b border-neutralCustom/20 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Danh sách nhân viên</h3>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">{employees.length} Thành viên</span>
                </div>
                <div className="divide-y divide-neutralCustom/10 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {employees.map((emp) => (
                    <div 
                      key={emp.id}
                      onClick={() => setActiveUserId(emp.id)}
                      className={`relative p-4 flex items-center gap-4 cursor-pointer transition-all group
                        ${activeUserId === emp.id ? 'bg-primary/5' : 'hover:bg-culinaryBg/50'}
                      `}
                    >
                      {activeUserId === emp.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                      )}
                      
                      <div className="flex-1">
                        <h4 className={`text-base font-bold leading-tight ${activeUserId === emp.id ? 'text-primary' : 'text-gray-900 group-hover:text-primary'}`}>
                          {emp.name}
                        </h4>
                        <p className="text-sm text-neutralCustom mt-0.5">{emp.email}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`inline-block px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${emp.roleColor}`}>
                          {emp.role}
                        </span>

                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); 
                              handleEditEmployee(emp);
                            }}
                            className="p-1.5 text-neutralCustom hover:text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200"
                            title="Chỉnh sửa thông tin"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>

                          {/* Không cho xóa tài khoản Super Admin */}
                          {emp.role !== 'Super Admin' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); 
                                handleDeleteEmployee(emp.id);
                              }}
                              className="p-1.5 text-neutralCustom hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Xóa nhân viên"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* RIGHT COLUMN: Permission Matrix */}
            <section className="md:col-span-8">
              <div className="bg-white border border-neutralCustom/20 rounded-2xl shadow-md flex flex-col h-[calc(100vh-200px)] overflow-hidden">
                {/* Header info */}
                <div className="p-6 bg-culinaryBg/30 border-b border-neutralCustom/20 flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[32px]">manage_accounts</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Vai trò: <span className="text-primary">{activeUser?.role}</span>
                      </h3>
                      <p className="text-sm text-neutralCustom mt-1">
                        Cấu hình quyền cho: <b>{activeUser?.name}</b>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Permissions List */}
                <div className="p-6 flex-grow overflow-y-auto">
                  {isSuperAdmin && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">gpp_good</span>
                      Tài khoản Super Admin mặc định sở hữu toàn bộ đặc quyền trên hệ thống và không thể sửa đổi cấu hình này.
                    </div>
                  )}

                  <div className="space-y-8">
                    {permissionCategories.map((category, catIdx) => (
                      <div key={catIdx}>
                        <h4 className="text-xs font-bold text-neutralCustom uppercase tracking-widest mb-4 border-b border-neutralCustom/20 pb-2">
                          {category.title}
                        </h4>
                        <div className="grid gap-3">
                          {category.items.map((item) => {
                            // Nếu là Super Admin thì tự động tick TRUE, ngược lại lấy từ state permissions
                            const isChecked = isSuperAdmin ? true : permissions[item.id];
                            
                            return (
                              <div 
                                key={item.id}
                                onClick={() => handleToggle(item.id)}
                                className={`flex justify-between items-center p-4 rounded-xl border transition-all duration-200 select-none cursor-pointer
                                  ${isChecked ? 'bg-white border-primary/20 shadow-sm' : 'bg-culinaryBg/50 border-neutralCustom/10 opacity-60'}
                                `}
                              >
                                <div className="flex items-center gap-4">
                                  <span className={`material-symbols-outlined text-[28px] ${isChecked ? 'text-primary' : 'text-neutralCustom'}`}>
                                    {item.icon}
                                  </span>
                                  <div>
                                    <p className={`font-bold ${isChecked ? 'text-gray-900' : 'text-neutralCustom'}`}>{item.name}</p>
                                    <p className="text-xs text-neutralCustom mt-0.5">{item.desc}</p>
                                  </div>
                                </div>
                                
                                {/* THAY ĐỔI: Sử dụng Checkbox nguyên bản của HTML được bọc style Tailwind */}
                                <div className="flex items-center pr-2">
                                  <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer disabled:opacity-50" 
                                    checked={isChecked}
                                    disabled={isSuperAdmin} // Vô hiệu hóa tương tác nếu là Super Admin
                                    onChange={() => {}} // onClick ở div ngoài đã xử lý
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 bg-culinaryBg/50 border-t border-neutralCustom/20 flex justify-between items-center">
                  <span className="text-sm text-neutralCustom">
                    <b>Lưu ý:</b> Thay đổi sẽ áp dụng vào lần đăng nhập tiếp theo.
                  </span>
                  <div className="flex gap-3">
                    <button className="px-6 py-2.5 text-neutralCustom font-bold hover:bg-neutralCustom/10 rounded-xl transition-colors">Hủy bỏ</button>
                    <button 
                      disabled={isSuperAdmin}
                      className="px-8 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-secondary active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Lưu quyền
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoleManagement;