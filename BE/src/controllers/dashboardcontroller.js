import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';
import htmlPdf from 'html-pdf-node';

export const getDoanhThuDashboard = async (req, res) => {
    try {
        const { range } = req.body;
        const moctgian = new Date();
        moctgian.setHours(0, 0, 0, 0);

        if (range === 'week') {
            const day = moctgian.getDay();
            const diff = moctgian.getDate() - day + (day === 0 ? -6 : 1);
            moctgian.setDate(diff);
        } else if (range === 'month') {
            moctgian.setDate(1);
        } else if (range === 'year') {
            moctgian.setMonth(0, 1);
        }

        const { data: bills, error: fetchErr } = await supabase
            .from('bills')
            .select('total_amount, payment_method')
            .gte('created_at', moctgian.toISOString());
        if (fetchErr) throw fetchErr;

        const count = bills.length;
        const tongdoanhthu = bills.reduce((tong, bill) => tong + Number(bill.total_amount || 0), 0);
        const tongtienmat = bills
            .filter(bill => bill.payment_method === 'CASH')
            .reduce((tong, bill) => tong + Number(bill.total_amount || 0), 0);
        const tongchuyenkhoan = bills
            .filter(bill => bill.payment_method === 'VNPAY')
            .reduce((tong, bill) => tong + Number(bill.total_amount || 0), 0);

        const averageBill = count > 0 ? Math.round(tongdoanhthu / count) : 0;

        res.status(200).json({
            success: true,
            tongdoanhthu,
            tongtienmat,
            tongchuyenkhoan,
            averageBill
        });

    } catch (error) {
        console.error('Lỗi tính doanh thu:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi không tính được doanh thu'
        });
    }
}

export const tungngaytrongTuan = async (req, res) => {
    try {
        const mocthoigian = new Date();
        mocthoigian.setHours(0, 0, 0, 0);

        while (mocthoigian.getDay() !== 1) {
            mocthoigian.setDate(mocthoigian.getDate() - 1);
        }

        const { data: bills, error: fetchErr } = await supabase
            .from('bills')
            .select('total_amount, created_at')
            .gte('created_at', mocthoigian.toISOString());

        if (fetchErr) throw fetchErr;

        let danhsachTuan = [
            { day_name: "Thứ Hai", total: 0 },
            { day_name: "Thứ Ba", total: 0 },
            { day_name: "Thứ Tư", total: 0 },
            { day_name: "Thứ Năm", total: 0 },
            { day_name: "Thứ Sáu", total: 0 },
            { day_name: "Thứ Bảy", total: 0 },
            { day_name: "Chủ Nhật", total: 0 }
        ]

        bills?.forEach(bill => {
            const billDate = new Date(bill.created_at);
            const dayIndex = billDate.getDay();

            let i = dayIndex - 1;
            if (dayIndex === 0) {
                i = 6;
            }

            if (danhsachTuan[i]) {
                danhsachTuan[i].total += Number(bill.total_amount || 0);
            }
        });

        return res.status(200).json({
            success: true,
            start_week_date: mocthoigian.toLocaleDateString('vi-VN'),
            data: danhsachTuan
        });
    } catch (error) {
        console.error("Lỗi tính doanh thu tuần:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}