import jwt from 'jsonwebtoken';

// Kiểm tra Token JWT xem có hợp lệ/hết hạn chưa
export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        // Chuỗi token gửi lên từ React thường có dạng "Bearer <token>"
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, message: 'Truy cập bị từ chối! Vui lòng đăng nhập.' });
        }

        // Giải mã thông tin user từ token (giống hệt secret key lúc login)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'MA_BAO_MAT_DU_PHONG');
        req.user = decoded; // Dữ liệu sẽ gồm { id, role } 
        
        next(); // Hợp lệ thì cho đi tiếp vào Controller
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Token đã hết hạn hoặc không hợp lệ!' });
    }
};

// Kiểm tra Role (Admin / Cashier / Chef / Super_admin)
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Ép về chữ thường để tránh lỗi không khớp hoa/thường
        const userRole = req.user?.role?.toLowerCase();

        if (!userRole || !allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Tài khoản của bạn không có đặc quyền truy cập tính năng này!' 
            });
        }
        next();
    };
};