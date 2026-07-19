import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            return setErrorMsg('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu!');
        }

        setIsLoading(true);
        setErrorMsg('');

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
                username: username.trim(),
                password: password
            });

            if (res.data.success) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));

                const userRole = res.data.user.role?.toUpperCase();

                switch (userRole) {
                    case 'SUPER_ADMIN':
                    case 'ADMIN':
                        navigate('/admin/dashboard');
                        break;
                    case 'CASHIER':
                        navigate('/cashier');
                        break;
                    case 'CHEF':
                        navigate('/kitchen');
                        break;
                    default:
                        navigate('/');
                }
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-culinaryBg font-sans p-4 relative overflow-hidden">

            {/* Khối hiệu ứng ánh sáng mờ trang trí phía sau */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>

            {/* Hộp Form chính */}
            <div className="w-full max-w-md bg-white rounded-2xl border border-neutralCustom/15 p-8 sm:p-10 shadow-xl shadow-gray-200/50 relative z-10 animate-scale-up">

                {/* Logo & Tiêu đề */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">
                        LÀNG <span className="text-primary">MÌXI</span>
                    </h1>
                    <div className="h-1 w-12 bg-primary rounded-full mx-auto mb-4"></div>
                    <p className="text-sm font-medium text-neutralCustom">Hệ thống quản trị và vận hành nội bộ</p>
                </div>

                {errorMsg && (
                    <div className="mb-6 bg-red-50 border border-red-150 text-red-600 rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-2 animate-fade-in">
                        <span className="material-symbols-outlined text-[18px]">error</span>
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Input Tài khoản */}
                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Tên đăng nhập</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutralCustom/60 text-[20px] select-none">account_circle</span>
                            <input
                                type="text"
                                placeholder="Nhập tên tài khoản..."
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isLoading}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50/40 border border-neutralCustom/20 rounded-xl text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Input Mật khẩu */}
                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mật khẩu</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutralCustom/60 text-[20px] select-none">lock</span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nhập mật khẩu..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                className="w-full pl-11 pr-11 py-3 bg-gray-50/40 border border-neutralCustom/20 rounded-xl text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-900 tracking-wide"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutralCustom/60 hover:text-primary transition-colors flex items-center justify-center p-1"
                            >
                                <span className="material-symbols-outlined text-[18px] select-none">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Nút Đăng nhập */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-white font-bold py-3.5 px-5 rounded-xl shadow-lg shadow-primary/15 hover:bg-secondary hover:shadow-secondary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98] mt-2 text-sm cursor-pointer"
                    >
                        {isLoading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                <span>Đang xác thực...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">login</span>
                                <span>Đăng nhập hệ thống</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Bản quyền dưới chân */}
                <div className="mt-8 text-center text-[11px] text-neutralCustom/60 font-medium border-t border-gray-100 pt-4">
                    © 2026 BBQ Làng MìXi. All rights reserved.
                </div>

            </div>
        </div>
    );
};

export default Login;