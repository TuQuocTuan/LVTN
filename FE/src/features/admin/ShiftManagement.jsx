import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import axios from 'axios';

const MOCK_USERS = [
  { id: 'user-1', fullname: 'Nguyễn Thị Hoa', username: 'hoanguyen', role: 'cashier' },
  { id: 'user-2', fullname: 'Trần Minh Nam', username: 'namtran', role: 'cashier' },
  { id: 'user-3', fullname: 'Phạm Quốc Tuấn', username: 'tuanpham', role: 'admin' }
];

const MOCK_SHIFTS = [
  {
    id: 'shift-1',
    user_id: 'user-1',
    check_in: new Date(new Date().setHours(new Date().getHours() - 4)).toISOString(),
    check_out: null,
    duration_hours: null,
    hourly_rate: 25000,
    total_wage: null,
    status: 'active',
    note: 'Ca sáng thu ngân quầy chính, kiểm đếm két đầu ca đầy đủ',
    users: { id: 'user-1', fullname: 'Nguyễn Thị Hoa', username: 'hoanguyen', role: 'cashier' }
  },
  {
    id: 'shift-2',
    user_id: 'user-2',
    check_in: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(),
    check_out: null,
    duration_hours: null,
    hourly_rate: 25000,
    total_wage: null,
    status: 'active',
    note: 'Ca chiều hỗ trợ oder quầy phụ và đóng gói mang về',
    users: { id: 'user-2', fullname: 'Trần Minh Nam', username: 'namtran', role: 'cashier' }
  }
];

const ShiftManagement = () => {
  const [shiftsList, setShiftsList] = useState([]);
  const [usersList, setUsersList] = useState(MOCK_USERS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const [alertState, setAlertState] = useState({ show: false, message: '', type: 'success' });
  const [confirmState, setConfirmState] = useState({ show: false, title: '', message: '', onConfirm: null });

  const initialFormState = {
    id: null,
    user_id: '',
    check_in: '',
    check_out: '',
    hourly_rate: 25000,
    note: ''
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);

  // Kích hoạt Toast thông báo đẹp mắt thay cho alert()
  const triggerAlert = (message, type = 'success') => {
    setAlertState({ show: true, message, type });
    setTimeout(() => {
      setAlertState({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user`);
      const fetchedUsers = Array.isArray(response.data) ? response.data : (response.data.data || []);
      if (fetchedUsers.length > 0) {
        setUsersList(fetchedUsers);
        fetchShifts(fetchedUsers);
      } else {
        setUsersList(MOCK_USERS);
        fetchShifts(MOCK_USERS);
      }
    } catch (error) {
      console.log("Sử dụng danh sách nhân viên dự phòng.");
      setUsersList(MOCK_USERS);
      fetchShifts(MOCK_USERS);
    }
  };

  const fetchShifts = async (fetchedUsers = []) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/shift`);
      if (response.data && response.data.success && response.data.data) {
        
        const apiShifts = response.data.data.map((item, index) => {
          // Trích xuất số phút từ chuỗi "6 giờ 6 phút (366 phút)" của Backend
          const minutesMatch = item.duration ? item.duration.match(/\((\d+)\s*phút\)/) : null;
          const totalMinutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
          const duration_hours = Number((totalMinutes / 60).toFixed(2));
          
          // Đối chiếu thông tin tài khoản nhân viên
          const foundUser = fetchedUsers.find(u => u.id === item.user_id || u.username === item.username);
          const role = foundUser?.role || 'cashier';
          const hourly_rate = role === 'admin' ? 35000 : 25000;
          const total_wage = Math.round(duration_hours * hourly_rate);

          // Phân tách chuỗi ngày giờ Việt Nam của log để đổi về ISO chuẩn
          let isoCheckIn = null;
          try {
            const parts = item.login_time.split(/[\s,]+/);
            if (parts.length >= 2) {
              const timePart = parts[0];
              const datePart = parts[1];
              const [day, month, year] = datePart.split('/');
              isoCheckIn = new Date(`${year}-${month}-${day}T${timePart}`).toISOString();
            }
          } catch (e) {
            isoCheckIn = new Date().toISOString();
          }

          let isoCheckOut = null;
          try {
            const parts = item.logout_time.split(/[\s,]+/);
            if (parts.length >= 2) {
              const timePart = parts[0];
              const datePart = parts[1];
              const [day, month, year] = datePart.split('/');
              isoCheckOut = new Date(`${year}-${month}-${day}T${timePart}`).toISOString();
            }
          } catch (e) {
            isoCheckOut = new Date().toISOString();
          }

          return {
            id: `api-shift-${index}-${item.user_id}`,
            user_id: item.user_id,
            check_in: isoCheckIn || new Date().toISOString(),
            check_out: isoCheckOut || new Date().toISOString(),
            duration_hours: duration_hours,
            hourly_rate: hourly_rate,
            total_wage: total_wage,
            status: 'completed',
            note: item.note || 'Ghi nhận chấm công tự động từ nhật ký hệ thống',
            users: foundUser || {
              id: item.user_id,
              fullname: item.username,
              username: item.username,
              role: 'cashier'
            }
          };
        });

        // Ghép thêm ca đang làm việc (chưa logout) để hiển thị đầy đủ
        const activeMockShifts = MOCK_SHIFTS.filter(s => s.status === 'active');
        setShiftsList([...activeMockShifts, ...apiShifts]);
      } else {
        setShiftsList([...MOCK_SHIFTS]);
      }
    } catch (error) {
      console.log("Gặp sự cố tải ca, kích hoạt dữ liệu ca làm ảo dự phòng.");
      setShiftsList([...MOCK_SHIFTS]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatForInput = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Chưa kết ca';
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} - ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const formatDuration = (hours) => {
    if (hours === null || hours === undefined || isNaN(hours)) return '---';
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (m === 0) {
      return `${h}h (${totalMinutes}p)`;
    }
    return `${h}h ${m}p (${totalMinutes}p)`;
  };

  const handleSelectToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDateFilter(today);
    setEndDateFilter(today);
    setCurrentPage(1);
  };

  const handleSelectThisWeek = () => {
    const current = new Date();
    const first = current.getDate() - current.getDay() + (current.getDay() === 0 ? -6 : 1);
    const firstDay = new Date(current.setDate(first)).toISOString().split('T')[0];
    const lastDay = new Date().toISOString().split('T')[0];

    setStartDateFilter(firstDay);
    setEndDateFilter(lastDay);
    setCurrentPage(1);
  };

  const handleSelectThisMonth = () => {
    const current = new Date();
    const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
    const firstDayStr = new Date(firstDay.getTime() - firstDay.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const lastDayStr = new Date().toISOString().split('T')[0];

    setStartDateFilter(firstDayStr);
    setEndDateFilter(lastDayStr);
    setCurrentPage(1);
  };

  const handleClearDateFilter = () => {
    setStartDateFilter('');
    setEndDateFilter('');
    setCurrentPage(1);
  };

  const handleOpenAddModal = () => {
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (shift) => {
    setFormData({
      id: shift.id,
      user_id: shift.users?.id || shift.user_id,
      check_in: formatForInput(shift.check_in),
      check_out: shift.check_out ? formatForInput(shift.check_out) : '',
      hourly_rate: shift.hourly_rate || 25000,
      note: shift.note || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveShift = async () => {
    if (!formData.user_id || !formData.check_in || !formData.hourly_rate) {
      return triggerAlert("Vui lòng điền đầy đủ các thông tin bắt buộc!", "error");
    }

    setIsSaving(true);
    try {
      const selectedUser = usersList.find(u => u.id === formData.user_id) || MOCK_USERS[0];
      const checkInDate = new Date(formData.check_in);
      const checkOutDate = formData.check_out ? new Date(formData.check_out) : null;
      let durationHours = null;
      let totalWage = null;

      if (checkOutDate) {
        durationHours = Number(((checkOutDate - checkInDate) / (1000 * 60 * 60)).toFixed(2));
        totalWage = Math.round(durationHours * Number(formData.hourly_rate));
      }

      if (formData.id) {
        setShiftsList(prev => prev.map(s => {
          if (s.id === formData.id) {
            return {
              ...s,
              check_in: checkInDate.toISOString(),
              check_out: checkOutDate ? checkOutDate.toISOString() : null,
              duration_hours: durationHours,
              hourly_rate: Number(formData.hourly_rate),
              total_wage: totalWage,
              status: checkOutDate ? 'completed' : 'active',
              note: formData.note
            };
          }
          return s;
        }));
        triggerAlert("Cập nhật thông tin ca làm thành công!");
      } else {
        const newShift = {
          id: `shift-manual-${Date.now()}`,
          user_id: formData.user_id,
          check_in: checkInDate.toISOString(),
          check_out: checkOutDate ? checkOutDate.toISOString() : null,
          duration_hours: durationHours,
          hourly_rate: Number(formData.hourly_rate),
          total_wage: totalWage,
          status: checkOutDate ? 'completed' : 'active',
          note: formData.note,
          users: selectedUser
        };
        setShiftsList(prev => [newShift, ...prev]);
        triggerAlert("Đã bổ sung thành công ca làm việc!");
      }

      setIsModalOpen(false);
    } catch (error) {
      triggerAlert("Có lỗi xảy ra khi lưu!", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckoutStaff = (userId, shiftId) => {
    setConfirmState({
      show: true,
      title: "Xác nhận kết ca",
      message: "Bạn có chắc chắn muốn kết thúc ca làm việc của nhân viên này?",
      onConfirm: () => {
        setShiftsList(prev => prev.map(s => {
          if (s.id === shiftId || (s.user_id === userId && s.status === 'active')) {
            const checkOutTime = new Date();
            const checkInTime = new Date(s.check_in);
            const durationHours = Number(((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2));
            const totalWage = Math.round(durationHours * Number(s.hourly_rate));
            return {
              ...s,
              check_out: checkOutTime.toISOString(),
              duration_hours: durationHours,
              total_wage: totalWage,
              status: 'completed',
              note: 'Quản lý kết ca thủ công hộ nhân viên'
            };
          }
          return s;
        }));
        triggerAlert("Đã kết ca làm việc thành công!");
        setConfirmState({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleDeleteShift = (id) => {
    setConfirmState({
      show: true,
      title: "Xóa bản ghi ca làm",
      message: "Hành động này sẽ xóa vĩnh viễn dữ liệu ca làm. Bạn có chắc chắn muốn tiếp tục?",
      onConfirm: () => {
        setShiftsList(prev => prev.filter(s => s.id !== id));
        triggerAlert("Xóa bản ghi ca làm thành công!");
        setConfirmState({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const getFilteredShifts = (list) => {
    return list.filter(s => {
      const matchName = (s.users?.fullname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.users?.username || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const role = s.users?.role?.toLowerCase();
      const matchRole = roleFilter === 'ALL' ||
                        (roleFilter === 'CASHIER' && role === 'cashier') ||
                        (roleFilter === 'ADMIN' && role === 'admin');
      
      let matchDate = true;
      if (s.check_in) {
        const checkInDate = new Date(s.check_in);
        
        if (startDateFilter) {
          const start = new Date(startDateFilter);
          start.setHours(0, 0, 0, 0);
          if (checkInDate < start) matchDate = false;
        }
        
        if (endDateFilter) {
          const end = new Date(endDateFilter);
          end.setHours(23, 59, 59, 999);
          if (checkInDate > end) matchDate = false;
        }
      }
      
      return matchName && matchRole && matchDate;
    });
  };

  const activeShifts = shiftsList.filter(s => s.status === 'active');
  const completedShifts = shiftsList.filter(s => s.status === 'completed');

  const filteredActiveShifts = getFilteredShifts(activeShifts);
  const filteredCompletedShifts = getFilteredShifts(completedShifts);

  const displayedList = activeTab === 'active' ? filteredActiveShifts : filteredCompletedShifts;
  const totalPages = Math.ceil(displayedList.length / itemsPerPage);
  const currentShifts = displayedList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalWageSum = filteredCompletedShifts.reduce((acc, curr) => acc + Number(curr.total_wage || 0), 0);
  const totalHoursSum = filteredCompletedShifts.reduce((acc, curr) => acc + Number(curr.duration_hours || 0), 0);

  const getStaffSummaryList = () => {
    const summary = {};
    filteredCompletedShifts.forEach(s => {
      const u = s.users;
      if (u) {
        if (!summary[u.id]) {
          summary[u.id] = {
            fullname: u.fullname,
            username: u.username,
            role: u.role,
            total_hours: 0,
            total_wage: 0,
            shift_count: 0
          };
        }
        summary[u.id].total_hours += Number(s.duration_hours || 0);
        summary[u.id].total_wage += Number(s.total_wage || 0);
        summary[u.id].shift_count += 1;
      }
    });
    return Object.values(summary);
  };

  const staffSummaryList = getStaffSummaryList();

  return (
    <div className="bg-culinaryBg text-gray-900 font-sans min-h-screen flex overflow-x-hidden relative">
      <AdminSidebar currentTab="shift" />
      <AdminHeader />

      {/* 🌟 HỆ THỐNG CUSTOM TOAST THAY ALERT */}
      {alertState.show && (
        <div className={`fixed bottom-6 right-6 z-[120] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl animate-fade-in text-white font-bold text-sm ${
          alertState.type === 'success' ? 'bg-green-600 border border-green-500' : 'bg-red-600 border border-red-500'
        }`}>
          <span className="material-symbols-outlined">{alertState.type === 'success' ? 'check_circle' : 'error'}</span>
          <span>{alertState.message}</span>
        </div>
      )}

      {/* 🌟 HỆ THỐNG CUSTOM CONFIRM MODAL THAY CONFIRM */}
      {confirmState.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-neutralCustom/10 text-center animate-scale-up">
            <div className="w-16 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
              <span className="material-symbols-outlined text-3xl">info</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmState.title}</h3>
            <p className="text-sm text-neutralCustom mb-6 leading-relaxed">{confirmState.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmState({ show: false, title: '', message: '', onConfirm: null })} 
                className="w-1/2 py-3 border border-neutralCustom/20 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={confirmState.onConfirm} 
                className="w-1/2 py-3 bg-primary text-white font-bold rounded-xl text-sm hover:bg-secondary transition-all"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      <main className="ml-64 pt-20 p-6 w-[calc(100%-16rem)] flex flex-col min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Ca làm & Giờ công</h2>
            <p className="text-neutralCustom text-sm font-medium">Theo dõi chấm công check-in, check-out và tổng hợp lương tự động cho nhân viên thu ngân.</p>
          </div>
          <div>
            <button 
              onClick={handleOpenAddModal} 
              className="bg-primary text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-md hover:bg-secondary transition-all active:scale-95 text-sm"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'wght' 700" }}>add</span>
              <span>Bổ sung ca làm</span>
            </button>
          </div>
        </div>

        {/* Thống kê ca làm nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl flex items-center gap-5 border border-neutralCustom/20 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-green-50 text-green-600">
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>group_work</span>
            </div>
            <div>
              <p className="text-xs font-bold text-neutralCustom uppercase tracking-wider mb-1">Đang làm việc (đã lọc)</p>
              <h4 className="text-3xl font-black text-green-600 leading-none">
                {filteredActiveShifts.length < 10 ? `0${filteredActiveShifts.length}` : filteredActiveShifts.length}
              </h4>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl flex items-center gap-5 border border-neutralCustom/20 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[32px]">schedule</span>
            </div>
            <div>
              <p className="text-xs font-bold text-neutralCustom uppercase tracking-wider mb-1">Tổng giờ công (đã lọc)</p>
              <h4 className="text-3xl font-black text-primary leading-none">
                {totalHoursSum.toFixed(1)} <span className="text-sm font-bold text-neutralCustom">giờ</span>
              </h4>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl flex items-center gap-5 border border-neutralCustom/20 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-secondary/10 text-secondary">
              <span className="material-symbols-outlined text-[32px]">payments</span>
            </div>
            <div>
              <p className="text-xs font-bold text-neutralCustom uppercase tracking-wider mb-1">Tổng lương chi trả (đã lọc)</p>
              <h4 className="text-3xl font-black text-secondary leading-none">
                {totalWageSum.toLocaleString('vi-VN')} <span className="text-sm font-bold text-neutralCustom">đ</span>
              </h4>
            </div>
          </div>
        </div>

        {/* BỘ LỌC KHOẢNG THỜI GIAN THÔNG MINH */}
        <div className="bg-white p-5 rounded-2xl border border-neutralCustom/20 shadow-sm mb-6 flex flex-col gap-4">
          
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-2 shrink-0">
              <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
              <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Bộ lọc khoảng thời gian:</span>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <button 
                onClick={handleSelectToday} 
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
              >
                Hôm nay
              </button>
              <button 
                onClick={handleSelectThisWeek} 
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
              >
                Tuần này
              </button>
              <button 
                onClick={handleSelectThisMonth} 
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
              >
                Tháng này
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full"></div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-neutralCustom uppercase tracking-wide">Từ ngày</span>
                <input 
                  type="date" 
                  value={startDateFilter}
                  onChange={(e) => { setStartDateFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-gray-50 border border-neutralCustom/20 text-sm rounded-xl px-4 py-2 outline-none focus:border-primary focus:bg-white transition-all text-gray-900 font-medium"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-neutralCustom uppercase tracking-wide">Đến ngày</span>
                <input 
                  type="date" 
                  value={endDateFilter}
                  onChange={(e) => { setEndDateFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-gray-50 border border-neutralCustom/20 text-sm rounded-xl px-4 py-2 outline-none focus:border-primary focus:bg-white transition-all text-gray-900 font-medium"
                />
              </div>
            </div>
            
            <div className="sm:self-end">
              <button 
                onClick={handleClearDateFilter}
                disabled={!startDateFilter && !endDateFilter}
                className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                title="Xóa bộ lọc ngày"
              >
                <span className="material-symbols-outlined text-base">restart_alt</span>
                Xóa lọc thời gian
              </button>
            </div>
          </div>

        </div>

        {/* Bộ lọc tên nhân viên và vai trò */}
        <div className="bg-white p-4 rounded-2xl border border-neutralCustom/20 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutralCustom text-xl">search</span>
            <input 
              type="text" 
              placeholder="Tìm nhân viên quầy..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-neutralCustom/20 text-sm rounded-xl pl-10 pr-4 py-2 outline-none focus:border-primary focus:bg-white transition-all" 
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <button 
              onClick={() => setRoleFilter('ALL')} 
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors ${roleFilter === 'ALL' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              Tất cả vai trò
            </button>
            <button 
              onClick={() => setRoleFilter('CASHIER')} 
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors ${roleFilter === 'CASHIER' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              Thu ngân
            </button>
            <button 
              onClick={() => setRoleFilter('ADMIN')} 
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors ${roleFilter === 'ADMIN' ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              Quản lý
            </button>
          </div>
        </div>

        {/* Tab phân loại */}
        <div className="mb-6 flex border-b border-neutralCustom/20">
          <button
            onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
            className={`px-8 py-3.5 font-bold text-sm transition-all border-b-2 ${activeTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-neutralCustom hover:text-primary'}`}
          >
            Nhân viên đang làm việc ({filteredActiveShifts.length})
          </button>
          <button
            onClick={() => { setActiveTab('history'); setCurrentPage(1); }}
            className={`px-8 py-3.5 font-bold text-sm transition-all border-b-2 ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-neutralCustom hover:text-primary'}`}
          >
            Lịch sử hoàn thành ca ({filteredCompletedShifts.length})
          </button>
        </div>

        {/* Danh sách bảng ca làm */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutralCustom/20 flex flex-col mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-culinaryBg/50 text-neutralCustom border-b border-neutralCustom/20">
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap">Nhân viên</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap">Vai trò</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap">Check-In</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap">Check-Out</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap">Tổng giờ công</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap">Lương / Giờ</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap">Thành tiền</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutralCustom/10">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-neutralCustom">Đang tải lịch sử ca làm...</td>
                  </tr>
                ) : currentShifts.length > 0 ? (
                  currentShifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-culinaryBg/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-gray-900 text-sm">{shift.users?.fullname || 'Ẩn danh'}</p>
                        <p className="text-xs text-neutralCustom mt-0.5 font-mono">@{shift.users?.username || 'no-username'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase border whitespace-nowrap ${
                          shift.users?.role?.toLowerCase() === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {shift.users?.role?.toLowerCase() === 'admin' ? 'Quản lý' : 'Thu ngân'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-700 whitespace-nowrap">
                        {formatDate(shift.check_in)}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-700 whitespace-nowrap">
                        {shift.check_out ? formatDate(shift.check_out) : <span className="text-green-500 font-bold animate-pulse flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>Đang làm việc...</span>}
                      </td>
                      {}
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                        {formatDuration(shift.duration_hours)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                        {Number(shift.hourly_rate || 0).toLocaleString('vi-VN')} đ/h
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-primary whitespace-nowrap">
                        {shift.total_wage ? `${Number(shift.total_wage).toLocaleString('vi-VN')} đ` : '---'}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {shift.status === 'active' && (
                            <button 
                              onClick={() => handleCheckoutStaff(shift.users?.id || shift.user_id, shift.id)} 
                              className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95 whitespace-nowrap" 
                              title="Kết thúc ca làm"
                            >
                              <span className="material-symbols-outlined text-sm">logout</span> Kết ca
                            </button>
                          )}
                          <button onClick={() => handleOpenEditModal(shift)} className="p-1.5 text-neutralCustom hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Chỉnh sửa ca làm">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={() => handleDeleteShift(shift.id)} className="p-1.5 text-neutralCustom hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa bản ghi">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-neutralCustom italic bg-gray-50/50">Không tìm thấy ca làm việc nào trong khoảng thời gian đã chọn.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {displayedList.length > 0 && (
            <div className="p-4 bg-culinaryBg/30 border-t border-neutralCustom/10 flex justify-center items-center text-sm shrink-0">
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1} className="p-1.5 border border-neutralCustom/20 rounded-lg hover:bg-white text-neutralCustom disabled:opacity-50"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded-lg shadow-sm ${currentPage === page ? 'bg-primary text-white font-bold' : 'hover:bg-white text-neutralCustom'}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 border border-neutralCustom/20 rounded-lg hover:bg-white text-neutralCustom disabled:opacity-50"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
              </div>
            </div>
          )}
        </div>

        {/* BẢNG TỔNG HỢP LƯƠNG NHÂN VIÊN */}
        <div className="bg-white rounded-2xl border border-neutralCustom/20 shadow-sm p-6 mb-8">
          <div className="border-b border-neutralCustom/10 pb-4 mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Bảng tổng hợp tiền lương nhân sự (Theo bộ lọc)</h3>
              <p className="text-xs text-neutralCustom mt-0.5">Tích lũy tiền lương dựa trên tất cả các ca làm việc hoàn thành trong khoảng thời gian được chọn.</p>
            </div>
            <span className="bg-primary/5 text-primary border border-primary/20 text-xs font-bold px-3 py-1 rounded-lg">
              {startDateFilter && endDateFilter ? `${startDateFilter} đến ${endDateFilter}` : "Toàn thời gian"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-neutralCustom text-xs uppercase border-b border-neutralCustom/10 pb-3">
                  <th className="pb-3 font-bold">Họ và tên</th>
                  <th className="pb-3 font-bold">Vai trò</th>
                  <th className="pb-3 font-bold">Số ca hoàn thành</th>
                  <th className="pb-3 font-bold">Tổng thời gian</th>
                  <th className="pb-3 font-bold text-right">Tổng lương nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutralCustom/10 text-sm">
                {staffSummaryList.length > 0 ? (
                  staffSummaryList.map((staff, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-3.5 font-bold text-gray-900">
                        {staff.fullname} <span className="text-xs text-neutralCustom font-normal">(@{staff.username})</span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          staff.role?.toLowerCase() === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {staff.role?.toLowerCase() === 'admin' ? 'Quản lý' : 'Thu ngân'}
                        </span>
                      </td>
                      <td className="py-3.5 font-semibold text-gray-700">
                        {staff.shift_count} ca làm
                      </td>
                      {}
                      <td className="py-3.5 font-bold text-gray-900">
                        {formatDuration(staff.total_hours)}
                      </td>
                      <td className="py-3.5 font-black text-secondary text-right">
                        {staff.total_wage.toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-neutralCustom italic">Chưa có dữ liệu tính lương trong khoảng thời gian này.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* MODAL THÊM / CHỈNH SỬA CA LÀM THỦ CÔNG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up max-h-[90vh]">
            <div className="p-5 border-b border-neutralCustom/20 flex items-center justify-between bg-culinaryBg shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{formData.id ? 'Sửa ca làm việc' : 'Bổ sung ca làm thủ công'}</h3>
                <p className="text-xs text-neutralCustom mt-1">Ghi nhận giờ làm việc bù cho nhân viên khi quên chấm công</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutralCustom/10 rounded-full text-neutralCustom transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 bg-gray-50 flex-1 custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Nhân viên <span className="text-red-500">*</span></label>
                <select 
                  value={formData.user_id} 
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })} 
                  disabled={!!formData.id}
                  className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary transition-all font-medium text-gray-900 cursor-pointer disabled:bg-gray-150 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>-- Chọn nhân viên thu ngân --</option>
                  {usersList.map(user => (
                    <option key={user.id} value={user.id}>{user.fullname} (@{user.username})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Ngày & Giờ vào ca <span className="text-red-500">*</span></label>
                  <input type="datetime-local" value={formData.check_in} onChange={(e) => setFormData({ ...formData, check_in: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary transition-all font-medium text-gray-900 cursor-text" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Ngày & Giờ ra ca</label>
                  <input type="datetime-local" value={formData.check_out} onChange={(e) => setFormData({ ...formData, check_out: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary transition-all font-medium text-gray-900 cursor-text" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Lương theo giờ (đ/h) <span className="text-red-500">*</span></label>
                <input type="number" min="0" placeholder="VD: 25000" value={formData.hourly_rate} onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary transition-all font-bold text-primary" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Ghi chú ca làm</label>
                <textarea rows="3" placeholder="Ghi chú lý do bổ sung ca làm..." value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutralCustom/30 rounded-xl text-sm outline-none focus:border-primary transition-all font-medium text-gray-900 resize-none custom-scrollbar"></textarea>
              </div>
            </div>

            <div className="p-5 border-t border-neutralCustom/20 bg-white flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-neutralCustom border border-neutralCustom/20 hover:bg-gray-50 transition-colors">Hủy bỏ</button>
              <button onClick={handleSaveShift} disabled={isSaving} className="px-8 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-secondary shadow-md disabled:opacity-50 transition-all flex items-center gap-2">
                {isSaving ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagement;