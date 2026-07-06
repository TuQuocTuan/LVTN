import htmlPdf from 'html-pdf-node';
import { supabase } from '../config/supabase.js';
import moment from 'moment-timezone';
import { createVnPayUrl } from '../controllers/paymentController.js';
import { kiemtraMinStock } from './dishController.js';
import e from 'express';

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