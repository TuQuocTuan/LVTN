import htmlPdf from 'html-pdf-node';
import { supabase } from '../config/supabase.js';
import moment from 'moment-timezone';
import { createVnPayUrl } from '../controllers/paymentController.js';
import { kiemtraMinStock } from './dishController.js';
import e from 'express';
import QRCode from 'qrcode';

export const inBill = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: bill, error: fetchErr } = await supabase
            .from('bills')
            .select('*')
            .eq('id', id)
            .single()

        if (fetchErr || !bill) return res.status(404).json({ success: false, message: 'Hóa đơn không tồn tại' });

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Arial', sans-serif; font-size: 12px; width: 80mm; margin: 0; padding: 10px; }
                .text-center { text-align: center; }
                .bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; }
                .text-right { text-align: right; }
            </style>
        </head>
        <body>
            <div class="text-center">
                <h3 style="margin: 0;">NHÀ HÀNG LÀNG XÌ MI</h3>
                <p style="margin: 5px 0;">HOÁ ĐƠN THANH TOÁN</p>
                <p>Mã HĐ: #${bill.id}</p>
            </div>
            <div class="divider"></div>
            <p>Ngày: ${new Date(bill.created_at).toLocaleString('vi-VN')}</p>
            <p>Hình thức: ${bill.payment_method}</p>
            <div class="divider"></div>
            
            <table>
                <thead>
                    <tr class="bold">
                        <td>Tên món</td>
                        <td class="text-center">SL</td>
                        <td class="text-right">T.Tiền</td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Món ăn demo A</td>
                        <td class="text-center">1</td>
                        <td class="text-right">${Number(bill.sub_total).toLocaleString('vi-VN')}đ</td>
                    </tr>
                </tbody>
            </table>

            <div class="divider"></div>
            <table>
                <tr>
                    <td>Tạm tính:</td>
                    <td class="text-right">${Number(bill.sub_total).toLocaleString('vi-VN')}đ</td>
                </tr>
                <tr>
                    <td>Giảm giá:</td>
                    <td class="text-right">-${Number(bill.discount_amount).toLocaleString('vi-VN')}đ</td>
                </tr>
                <tr>
                    <td>Thuế VAT (10%):</td>
                    <td class="text-right">${Number(bill.vat_amount).toLocaleString('vi-VN')}đ</td>
                </tr>
                <tr class="bold" style="font-size: 14px;">
                    <td>TỔNG CỘNG:</td>
                    <td class="text-right">${Number(bill.total_amount).toLocaleString('vi-VN')}đ</td>
                </tr>
            </table>
            <div class="divider"></div>
            <div class="text-center bold">CẢM ƠN QUÝ KHÁCH & HẸN GẶP LẠI</div>
        </body>
        </html>
        `;

        // 3. Cấu hình file PDF xuất ra theo size hóa đơn nhiệt K80
        const options = {
            width: '80mm',
            printBackground: true,
            margin: { top: '0mm', right: '2mm', bottom: '0mm', left: '2mm' }
        };
        const file = { content: htmlContent };

        // 4. Tiến hành render HTML thành Buffer PDF
        htmlPdf.generatePdf(file, options).then(pdfBuffer => {
            // Thiết lập Header để trình duyệt/Postman hiểu đây là file PDF
            res.contentType("application/pdf");
            return res.send(pdfBuffer);
        });

    } catch (error) {
        console.error("Lỗi in hóa đơn:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const generateBillHtml = async (session_id, table_id) => {
    // 1. Tạo đường dẫn dẫn đến trang review của bạn (thêm session_id để FE biết đang review cho phiên nào)
    // Nếu deploy thực tế thì thay localhost thành domain của bạn
    const reviewUrl = `http://localhost:5173/review?session_id=${session_id}`;

    // 2. Sinh mã QR dưới dạng chuỗi DataURL (Base64 Image)
    const qrCodeImageBase64 = await QRCode.toDataURL(reviewUrl, {
        width: 150, // Độ rộng của mã QR trên hóa đơn (px)
        margin: 1,
        color: {
            dark: '#000000', // Màu mã QR
            light: '#ffffff' // Màu nền
        }
    });

    // 3. Chèn cái biến `qrCodeImageBase64` này vào trong chuỗi HTML Bill của bạn
    const html_bill = `
        <div style="text-align: center; font-family: monospace; width: 100%;">
            <h2>HÓA ĐƠN THANH TOÁN</h2>
            <p>Mã phiên: ${session_id}</p>
            <hr/>
            <div style="margin: 20px 0;">
                <p>Tạm tính: ...</p>
                <h3>Tổng tiền: ...</h3>
            </div>
            <hr/>
            
            <div style="text-align: center; margin-top: 15px; margin-bottom: 15px;">
                <p style="font-size: 12px; margin-bottom: 5px;">Quét mã này để đánh giá món ăn nhận ưu đãi!</p>
                <img src="${qrCodeImageBase64}" alt="Review QR Code" style="width: 130px; height: 130px;"/>
            </div>
            
            <p style="text-align: center;">Cảm ơn quý khách. Hẹn gặp lại!</p>
        </div>
    `;

    return html_bill;
};