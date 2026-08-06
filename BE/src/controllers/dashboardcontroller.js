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
            .select('total_amount, payment_method, cost_amount, vat_amount')
            .gte('created_at', moctgian.toISOString());
        if (fetchErr) throw fetchErr;

        const { data: wastes, error: wasteErr } = await supabase
            .from('ingredient_wastes')
            .select('total_cost')
            .gte('created_at', moctgian.toISOString());
        if (wasteErr) throw wasteErr;

        const tongTienHuy = wastes ? wastes.reduce((tong, w) => tong + Number(w.total_cost || 0), 0) : 0;

        const count = bills.length;
        const tongdoanhthu = bills.reduce((tong, bill) => tong + Number(bill.total_amount || 0), 0);
        const tongvat = bills.reduce((tong, bill) => tong + Number(bill.vat_amount || 0), 0);
        const tongdoanhthuthuan = tongdoanhthu - tongvat;
        const tongcost = bills.reduce((tong, bill) => tong + Number(bill.cost_amount || 0), 0);
        const doanhthuthucte = tongdoanhthuthuan - tongcost - tongTienHuy;

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
            tongvat,
            tongdoanhthuthuan,
            tongcost,
            tongtienhuy: tongTienHuy,
            doanhthuthucte,
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
            .select('total_amount, cost_amount, vat_amount, created_at')
            .gte('created_at', mocthoigian.toISOString());

        if (fetchErr) throw fetchErr;

        let danhsachTuan = [
            { day_name: "Thứ Hai", total: 0, cost: 0, waste: 0, doanhthuthucte: 0 },
            { day_name: "Thứ Ba", total: 0, cost: 0, waste: 0, doanhthuthucte: 0 },
            { day_name: "Thứ Tư", total: 0, cost: 0, waste: 0, doanhthuthucte: 0 },
            { day_name: "Thứ Năm", total: 0, cost: 0, waste: 0, doanhthuthucte: 0 },
            { day_name: "Thứ Sáu", total: 0, cost: 0, waste: 0, doanhthuthucte: 0 },
            { day_name: "Thứ Bảy", total: 0, cost: 0, waste: 0, doanhthuthucte: 0 },
            { day_name: "Chủ Nhật", total: 0, cost: 0, waste: 0, doanhthuthucte: 0 }
        ];

        bills?.forEach(bill => {
            const billDate = new Date(bill.created_at);
            const dayIndex = billDate.getDay();

            let i = dayIndex - 1;
            if (dayIndex === 0) {
                i = 6;
            }

            if (danhsachTuan[i]) {
                const total = Number(bill.total_amount || 0);
                const vat = Number(bill.vat_amount || 0);
                const cost = Number(bill.cost_amount || 0);
                danhsachTuan[i].total += total;
                danhsachTuan[i].cost += cost;
                danhsachTuan[i].doanhthuthucte += ((total - vat) - cost);
            }
        });

        const { data: wastes, error: wasteErr } = await supabase
            .from('ingredient_wastes')
            .select('total_cost, created_at')
            .gte('created_at', mocthoigian.toISOString());
        if (wasteErr) throw wasteErr;

        wastes?.forEach(waste => {
            const wasteDate = new Date(waste.created_at);
            const dayIndex = wasteDate.getDay();
            let i = dayIndex - 1;
            if (dayIndex === 0) {
                i = 6;
            }

            if (danhsachTuan[i]) {
                const costVal = Number(waste.total_cost || 0);
                danhsachTuan[i].waste += costVal;
                danhsachTuan[i].doanhthuthucte -= costVal;
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

export const tungngaytrongThang = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        const { data: bills, error: fetchErr } = await supabase
            .from('bills')
            .select('total_amount, cost_amount, vat_amount, created_at')
            .gte('created_at', startOfMonth.toISOString());

        if (fetchErr) throw fetchErr;

        let danhsachThang = Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,
            day_name: `Ngày ${i + 1}`,
            total: 0,
            cost: 0,
            waste: 0,
            doanhthuthucte: 0
        }));

        bills?.forEach(bill => {
            const billDate = new Date(bill.created_at);
            const dayNum = billDate.getDate();
            const idx = dayNum - 1;

            if (danhsachThang[idx]) {
                const total = Number(bill.total_amount || 0);
                const vat = Number(bill.vat_amount || 0);
                const cost = Number(bill.cost_amount || 0);
                danhsachThang[idx].total += total;
                danhsachThang[idx].cost += cost;
                danhsachThang[idx].doanhthuthucte += ((total - vat) - cost);
            }
        });

        const { data: wastes, error: wasteErr } = await supabase
            .from('ingredient_wastes')
            .select('total_cost, created_at')
            .gte('created_at', startOfMonth.toISOString());
        if (wasteErr) throw wasteErr;

        wastes?.forEach(waste => {
            const wasteDate = new Date(waste.created_at);
            const dayNum = wasteDate.getDate();
            const idx = dayNum - 1;

            if (danhsachThang[idx]) {
                const costVal = Number(waste.total_cost || 0);
                danhsachThang[idx].waste += costVal;
                danhsachThang[idx].doanhthuthucte -= costVal;
            }
        });

        return res.status(200).json({
            success: true,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            data: danhsachThang
        });
    } catch (error) {
        console.error("Lỗi tính doanh thu tháng:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const tungthangtrongNam = async (req, res) => {
    try {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0);

        const { data: bills, error: fetchErr } = await supabase
            .from('bills')
            .select('total_amount, cost_amount, vat_amount, created_at')
            .gte('created_at', startOfYear.toISOString());

        if (fetchErr) throw fetchErr;

        let danhsachNam = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            month_name: `Tháng ${i + 1}`,
            total: 0,
            cost: 0,
            waste: 0,
            doanhthuthucte: 0
        }));

        bills?.forEach(bill => {
            const billDate = new Date(bill.created_at);
            const monthIdx = billDate.getMonth();

            if (danhsachNam[monthIdx]) {
                const total = Number(bill.total_amount || 0);
                const vat = Number(bill.vat_amount || 0);
                const cost = Number(bill.cost_amount || 0);
                danhsachNam[monthIdx].total += total;
                danhsachNam[monthIdx].cost += cost;
                danhsachNam[monthIdx].doanhthuthucte += ((total - vat) - cost);
            }
        });

        const { data: wastes, error: wasteErr } = await supabase
            .from('ingredient_wastes')
            .select('total_cost, created_at')
            .gte('created_at', startOfYear.toISOString());
        if (wasteErr) throw wasteErr;

        wastes?.forEach(waste => {
            const wasteDate = new Date(waste.created_at);
            const monthIdx = wasteDate.getMonth();

            if (danhsachNam[monthIdx]) {
                const costVal = Number(waste.total_cost || 0);
                danhsachNam[monthIdx].waste += costVal;
                danhsachNam[monthIdx].doanhthuthucte -= costVal;
            }
        });

        return res.status(200).json({
            success: true,
            year: now.getFullYear(),
            data: danhsachNam
        });
    } catch (error) {
        console.error("Lỗi tính doanh thu năm:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const layDSmonHomnay = async (req, res) => {
    try {
        const mocTgian = new Date();
        mocTgian.setHours(0, 0, 0, 0);

        const { data: items, error: err } = await supabase
            .from('order_details')
            .select('dishes(name),quantity,price,created_at,status')
            .gte('created_at', mocTgian.toISOString())
            .or('status.is.null, status.neq.cancelled');
        if (err) throw err;

        let danhsachMon = items.reduce((laphientai, item) => {
            let tenmon = item.dishes.name;
            let tongtien = item.quantity * item.price;

            let checktontai = laphientai.find(item => item.name === tenmon);

            if (checktontai) {
                checktontai.quantity += item.quantity;
                checktontai.tongtien += tongtien;
            } else {
                laphientai.push({
                    name: tenmon,
                    quantity: item.quantity,
                    price: item.price,
                    tongtien
                })
            }

            return laphientai;
        }, []);

        return res.status(200).json({
            success: true,
            data: danhsachMon,
            message: "Lấy danh sách món thành công"
        })
    } catch (error) {
        console.error("Lỗi tính doanh thu tuần:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

//Tính tiền vốn
export const tinhtienvon = async (req, res) => {
    try {
        const mocTgian = new Date();
        mocTgian.setHours(0, 0, 0, 0);

        const { data: items, error: err } = await supabase
            .from('order_details')
            .select('dishes(name),quantity,price,created_at,status,dish_id')
            .gte('created_at', mocTgian.toISOString())
            .or('status.is.null, status.neq.cancelled');
        if (err) throw err;

        if (!items || items.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: "Hôm nay chưa bán được món nào"
            });
        }

        const listDishIds = [...new Set(items.map(item => item.dish_id))];
        let mapsoluong = items.reduce((laphientai, item) => {
            laphientai[item.dish_id] = item.quantity;
            return laphientai;
        }, {});

        const { data: ingredients, error: ingredientsErr } = await supabase
            .from('recipes')
            .select('dish_id,dishes(name),amount_required,ingredients(name,price)')
            .in('dish_id', listDishIds)
        if (ingredientsErr) throw ingredientsErr;

        let danhsachMon = ingredients.reduce((laphientai, ingredient) => {
            let tenmon = ingredient.dishes.name;
            let tennguyenlieu = ingredient.ingredients.name;
            let soluongmon = mapsoluong[ingredient.dish_id] || 0;
            let soluong = ingredient.amount_required;
            let giatien = ingredient.ingredients.price || 0;
            let giavon = (giatien / 1000) * soluong * soluongmon;
            laphientai.push({
                tenmon,
                tennguyenlieu,
                soluong,
                giatien,
                soluongmon,
                giavon: Math.round(giavon)
            });
            return laphientai;
        }, []);

        let tonggiavon = danhsachMon.reduce((sum, item) => sum + item.giavon, 0);

        return res.status(200).json({
            success: true,
            data: danhsachMon,
            tonggiavon: Math.round(tonggiavon),
            message: "Lấy nguyên liệu món thành công"
        })
    }


    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
