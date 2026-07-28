import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';
import htmlPdf from 'html-pdf-node';

export const bai1 = async (req, res) => {
    const { data: users, error: fetchErr } = await supabase
        .from('users')
        .select('id,name,role')
    let newArrayUser = users.map(user => ({ ...user, id: user.id }))
    if (fetchErr) {
        return res.status(500).json({ error: fetchErr.message })
    }
    return res.status(200).json({ users: newArrayUser })
}

export const bai2 = async (req, res) => {
    const { data: bills, error: fetchErr } = await supabase
        .from('bills')
        .select('*')

    const billArray = bills.filter(bill => bill.shiftId === 1)
    const tongBill = billArray.reduce((total, bill) => total + Number(bill.amount), 0)

    if (fetchErr) {
        return res.status(500).json({ error: fetchErr.message })
    }
    return res.status(200).json({ tongBill })
}

//🥩 Bài 3: Kiểm tra định lượng nguyên liệu trong kho (Thời gian: 1 phút)
// Ngữ cảnh: Khi nhận yêu cầu gọi món mới, Backend cần đối soát công thức món ăn xem tất cả các nguyên liệu trong kho (available) có đáp ứng đủ lượng cần dùng (needed) hay không.
// const checkIngredients = [
//   { name: 'Thịt ba chỉ', needed: 0.5, available: 12 },
//   { name: 'Sốt tiêu cay', needed: 0.1, available: 0.05 },
//   { name: 'Than không khói', needed: 1, available: 4 }
// ];
// Yêu cầu: Trả về true nếu mọi nguyên liệu đều đủ số lượng đáp ứng (available >= needed), ngược lại trả về false (Sử dụng .every()).
// 💡 Xem Đáp án & Giải thích

export const bai3 = async (req, res) => {
    const { data: dishes, error: fetchErr } = await supabase
        .from('ingredients')
        .select('*')
    const check = dishes.every(dish => dish.available >= dish.needed)
    if (fetchErr) {
        return res.status(500).json({ error: fetchErr.message })
    }
    return res.status(200).json({ check })

}


// 📈 Bài 4: Lấy Top 2 món ăn bán chạy nhất cho Dashboard (Thời gian: 2 phút)
// Ngữ cảnh: Tại trang dashboard của admin (dashboardRoutes), Backend cần tính toán và trả về danh sách Top 2 món ăn bán được số lượng (soldQuantity) nhiều nhất.
// const salesData = [
//   { name: 'Dẻ sườn bò', soldQuantity: 120 },
//   { name: 'Bạch tuộc nướng', soldQuantity: 45 },
//   { name: 'Pepsi lon', soldQuantity: 210 },
//   { name: 'Lẩu nấm', soldQuantity: 30 }
// ];
// Yêu cầu: Sắp xếp mảng giảm dần theo soldQuantity và lấy ra 2 phần tử đầu tiên (Gợi ý: Dùng .sort() và .slice()).
// 💡 Xem Đáp án & Giải thích
export const bai4 = async (req, res) => {
    const { data: salesData, error: fetchErr } = await supabase
        .from('salesData')
        .select('*')

    const top2banchay = salesData.sort((a, b) => b.soldQuantity - a.soldQuantity).slice(0, 2)
    if (fetchErr) {
        return res.status(500).json({ error: fetchErr.message })
    }
    return res.status(200).json({ top2banchay })
}


// 🏷️ Bài 5: Chuẩn hóa định dạng chuỗi phản hồi API (Thời gian: 1 phút)
// Ngữ cảnh: Database trả về danh sách các nguyên vật liệu tồn kho. API cần map lại dữ liệu này thành mảng chuỗi văn bản dạng "Tên - Số lượng Đơn vị" để hiển thị nhanh.
// const dbStock = [
//   { name: 'Tôm sú', qty: 5, unit: 'kg' },
//   { name: 'Rau xà lách', qty: 2.5, unit: 'kg' },
//   { name: 'Nước sốt BBQ', qty: 10, unit: 'lít' }
// ];

export const bai5 = async (req, res) => {
    const { data: stock, error: fetchErr } = await supabase
        .from('dbStock')
        .select('*')
    if (fetchErr) throw fetchErr;
    const formatStock = stock.map(item => `${item.name} - ${item.qty} ${item.unit}`)
    return res.status(200).json({ formatStock })
}

// Bài 6: Áp dụng mã giảm giá cho món ăn (Thời gian: 2 phút)
// Ngữ cảnh: Backend nhận về danh sách món ăn đã đặt và số phần trăm giảm giá (discountPercent). Backend cần tính toán giá mới (discountedPrice) cho từng món ăn để hiển thị chi tiết hóa đơn.
// Dữ liệu đầu vào:
// javascript
// const orderedDishes = [
//   { name: 'Ba chỉ bò Mỹ', price: 120000 },
//   { name: 'Bạch tuộc nướng', price: 140000 },
//   { name: 'Rau cải nướng', price: 30000 }
// ];
// const discountPercent = 10; // Giảm giá 10%
// Yêu cầu: Trả về một mảng các đối tượng món ăn mới, mỗi đối tượng có thêm thuộc tính discountedPrice (giá sau khi giảm 10% so với price) (Sử dụng .map()).
// 💡 Xem Đáp án & Giải thích
export const bai6 = async (req, res) => {
    const { data: orders, error: fetchErr } = await supabase
        .from('orderedDishes')
        .select('name,price')
    if (fetchErr) throw fetchErr;
    const discountedPrice = 0.1
    const SalesArray = orders.map(item => ({ ...item, discountedPrice: item.price- (discountedPrice * item.price) }))
    return res.status(200).json({ SalesArray });
}


// 🚨 Bài 7: Kiểm tra sự tồn tại của đơn hàng chờ xử lý (Thời gian: 1 phút)
// Ngữ cảnh: Màn hình Bếp cần kiểm tra xem trong hàng đợi các món ăn hiện tại, có bất kỳ món nào đang ở trạng thái chờ chế biến (status: 'pending') hay không để phát âm thanh cảnh báo.
// Dữ liệu đầu vào:
// javascript
// const ordersQueue = [
//   { id: 1, dish: 'Thịt bò', status: 'completed' },
//   { id: 2, dish: 'Bạch tuộc', status: 'cooking' },
//   { id: 3, dish: 'Rau củ', status: 'pending' },
//   { id: 4, dish: 'Nước ngọt', status: 'completed' }
// ];
// Yêu cầu: Kiểm tra xem mảng có chứa phần tử nào có status === 'pending' hay không và trả về giá trị Boolean (Sử dụng .some()).
// 💡 Xem Đáp án & Giải thích
export const bai7 = async(req, res)=>{
    const{data:orders, error:fetchErr} = await supabase
        .from('ordersQueue')
        .select('*')
    if(fetchErr) throw fetchErr;
    const kiemtra = orders.some(order => order.status('pending'))
    return res.status(200).json({kiemtra});
}

// 🗺️ Bài 8: Phẳng hóa danh sách món ăn từ nhiều hóa đơn (Thời gian: 1.5 phút)
// Ngữ cảnh: API báo cáo doanh thu cuối ca cần gom tất cả các tên món ăn đã bán từ danh sách các hóa đơn ngày hôm nay. Mỗi hóa đơn có một thuộc tính items chứa mảng tên các món.
// Dữ liệu đầu vào:
// javascript
// const bills = [
//   { billId: 1, items: ['Ba chỉ bò Mỹ', 'Bạch tuộc nướng'] },
//   { billId: 2, items: ['Lẩu nấm', 'Pepsi lon'] },
//   { billId: 3, items: ['Ba chỉ bò Mỹ', 'Nước suối'] }
// ];
// Yêu cầu: Trả về một mảng phẳng (mảng 1 chiều) chứa tất cả tên món ăn đã được bán ra (Sử dụng .flatMap()).
// 💡 Xem Đáp án & Giải thích
export const bai8 = async(req, res) => {
    const {data: bills, error:fetchErr} = await supabase
        .from('bills')
        .select('*')
    if(fetchErr) throw fetchErr;
    const flatBills = bills.flatMap(bill => bill.items)
    return res.status(200).json({flatBills})
}

// 🍉 Bài 9: Lọc danh sách món ăn độc nhất (Thời gian: 1.5 phút)
// Ngữ cảnh: Tiếp tục từ danh sách món ăn thu được ở Bài 8, quản lý cần xuất ra một danh sách các món ăn đã bán nhưng không được trùng lặp để xem hôm nay nhà hàng đã phục vụ những loại món nào.
// Dữ liệu đầu vào:
// javascript
// const allSoldItems = ['Ba chỉ bò Mỹ', 'Bạch tuộc nướng', 'Lẩu nấm', 'Pepsi lon', 'Ba chỉ bò Mỹ', 'Nước suối'];
// Yêu cầu: Loại bỏ tất cả các phần tử trùng lặp trong mảng allSoldItems để chỉ giữ lại danh sách duy nhất (Gợi ý: Sử dụng đối tượng Set).
// 💡 Xem Đáp án & Giải thích
export const bai9 = async(req, res) => {
    const {data: bills, error:fetchErr} = await supabase
        .from('bills')
        .select('*')
    if(fetchErr) throw fetchErr;
    const flatBills = bills.flatMap(bill => bill.items)
    const distinctItems = [...new Set(flatBills)]
    return res.status(200).json({distinctItems})
}


// 🔌 Bài 10: Tìm vị trí để xóa kết nối Socket khi ngắt kết nối (Thời gian: 1 phút)
// Ngữ cảnh: Trong file xử lý real-time của Socket.io, khi một bàn ăn đóng trình duyệt (ngắt kết nối socket), backend cần tìm vị trí (chỉ số index) của kết nối này để tiến hành xóa khỏi mảng đang quản lý.
// Dữ liệu đầu vào:
// javascript
// const activeSockets = [
//   { socketId: 'sock_01', tableId: 2 },
//   { socketId: 'sock_02', tableId: 5 },
//   { socketId: 'sock_03', tableId: 8 }
// ];
// const disconnectedTableId = 5;
// Yêu cầu: Tìm vị trí index của đối tượng trong mảng activeSockets có thuộc tính tableId === 5 (Sử dụng .findIndex()).