import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/Admin/AdminSidebar';
import AdminHeader from '../../components/layout/Admin/AdminHeader';
import axios from 'axios';

const ShiftManagement = () => {
  const [shiftsList, setShiftsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user`);
      const fetchedUsers = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setUsersList(fetchedUsers);
      fetchShifts(fetchedUsers);
    } catch (error) {
      console.log("Không thể tải danh sách nhân viên.");
      setUsersList([]);
      fetchShifts([]);
    }
  };

  const fetchShifts = async (fetchedUsers = []) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/shift`);
      if (response.data && response.data.success && response.data.data) {

        const parseDateTime = (timeStr) => {
          if (!timeStr) return null;
          try {
            const d = new Date(timeStr);
            if (!isNaN(d.getTime())) {
              return d.toISOString();
            }
            const parts = timeStr.split(/[\s,]+/);
            const datePart = parts.find(p => p.includes('/'));
            const timePart = parts.find(p => p.includes(':'));
            if (datePart && timePart) {
              const [day, month, year] = datePart.split('/');
              const paddedDay = day.padStart(2, '0');
              const paddedMonth = month.padStart(2, '0');
              const paddedYear = year.length === 2 ? `20${year}` : year;
              const d2 = new Date(`${paddedYear}-${paddedMonth}-${paddedDay}T${timePart}`);
              if (!isNaN(d2.getTime())) {
                return d2.toISOString();
              }
            }
          } catch (e) {
            console.error("Lỗi parse ngày tháng:", e);
          }
          return null;
        };

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

          const isoCheckIn = parseDateTime(item.login_time);
          const isoCheckOut = parseDateTime(item.logout_time);

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

        setShiftsList([...apiShifts]);
      } else {
        setShiftsList([]);
      }
    } catch (error) {
      console.log("Gặp sự cố tải ca.");
      setShiftsList([]);
    } finally {
      setIsLoading(false);
    }
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

  const displayedList = filteredCompletedShifts;
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


      <main className="ml-64 pt-20 p-6 w-[calc(100%-16rem)] flex flex-col min-h-screen">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Ca làm & Giờ công</h2>
            <p className="text-neutralCustom text-sm font-medium">Theo dõi chấm công check-in, check-out và tổng hợp lương tự động cho nhân viên thu ngân.</p>
          </div>
        </div>

        {/* Thống kê ca làm nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl flex items-center gap-5 border border-neutralCustom/20 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-green-50 text-green-600">
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            </div>
            <div>
              <p className="text-xs font-bold text-neutralCustom uppercase tracking-wider mb-1">Tổng ca hoàn thành (đã lọc)</p>
              <h4 className="text-3xl font-black text-green-600 leading-none">
                {filteredCompletedShifts.length < 10 ? `0${filteredCompletedShifts.length}` : filteredCompletedShifts.length}
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

        {/* Lịch sử ca làm việc */}
        <div className="mb-6 flex border-b border-neutralCustom/20">
          <div className="px-8 py-3.5 font-bold text-sm border-b-2 border-primary text-primary">
            Lịch sử hoàn thành ca ({filteredCompletedShifts.length})
          </div>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-neutralCustom/10">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-neutralCustom">Đang tải lịch sử ca làm...</td>
                  </tr>
                ) : currentShifts.length > 0 ? (
                  currentShifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-culinaryBg/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-gray-900 text-sm">{shift.users?.fullname || 'Ẩn danh'}</p>
                        <p className="text-xs text-neutralCustom mt-0.5 font-mono">@{shift.users?.username || 'no-username'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase border whitespace-nowrap ${shift.users?.role?.toLowerCase() === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
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
                      { }
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                        {formatDuration(shift.duration_hours)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                        {Number(shift.hourly_rate || 0).toLocaleString('vi-VN')} đ/h
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-primary whitespace-nowrap">
                        {shift.total_wage ? `${Number(shift.total_wage).toLocaleString('vi-VN')} đ` : '---'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-neutralCustom italic bg-gray-50/50">Không tìm thấy ca làm việc nào trong khoảng thời gian đã chọn.</td>
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
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${staff.role?.toLowerCase() === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                          {staff.role?.toLowerCase() === 'admin' ? 'Quản lý' : 'Thu ngân'}
                        </span>
                      </td>
                      <td className="py-3.5 font-semibold text-gray-700">
                        {staff.shift_count} ca làm
                      </td>
                      { }
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
    </div>
  );
};

export default ShiftManagement;