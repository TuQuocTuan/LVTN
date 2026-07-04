import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';

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
            .select('total_amount')
            .gte('created_at', moctgian.toISOString());
        if (fetchErr) throw fetchErr;

        const tongdoanhthu = bills.reduce((tong, bill) => tong + bill.total_amount, 0);

        res.status(200).json({
            success: true,
            tongdoanhthu
        });

    } catch (error) {
        console.error('Lỗi tính doanh thu:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi không tính được doanh thu'
        });
    }
}