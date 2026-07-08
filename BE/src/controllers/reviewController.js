// Xử lý đánh giá của khách hàng
// =================================

import { supabase } from '../config/supabase.js';
import moment from 'moment-timezone';

export const getReviewList = async (req, res) => {
    try {
        const { data: review, error: fetchErr } = await supabase
            .from('reviews')
            .select('session_id,customer_id,created_at,dish_id,rating,comment')
        if (fetchErr) throw fetchErr;

        const formatReview = review.map(item => {
            return {
                ...item,
                created_at: moment(item.created_at).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss")
            }
        })

        return res.status(200).json({ success: true, data: formatReview })
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message })
    }
}

export const addReview = async (req, res) => {
    try {
        const { session_id, customer_id, order_id, reviews } = req.body;

        if (!session_id || !order_id || !reviews || !Array.isArray(reviews) || reviews.length === 0) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin hoặc mảng đánh giá không hợp lệ!' });
        }

        const dishIdArray = reviews.map(item => Number(item.dish_id));

        const { data: orderDetailCheck, error: checkErr } = await supabase
            .from('orders')
            .select(`
                id,
                session_id,
                order_details!inner(dish_id),
                dining_sessions!inner(customer_id)
            `)
            .eq('id', Number(order_id))
            .in('order_details.dish_id', dishIdArray);

        if (checkErr) {
            console.error("Lỗi từ Supabase:", checkErr.message);
            return res.status(400).json({ success: false, error: checkErr.message });
        }

        if (!orderDetailCheck || orderDetailCheck.length === 0) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy các món ăn này trong đơn hàng của bạn!' });
        }

        const reviewsToInsert = reviews.map(item => ({
            session_id: session_id,
            customer_id: customer_id || null,
            dish_id: Number(item.dish_id),
            rating: Number(item.rating),
            comment: item.comment ? item.comment.trim() : null
        }));

        const { data: insertReview, error: insertErr } = await supabase
            .from('reviews')
            .insert(reviewsToInsert)
            .select();

        if (insertErr) throw insertErr;

        try {

            console.log("=== BEGIN DEBUG RATING SCORES ===");
            console.log("Mảng reviews gửi lên:", reviewsToInsert);

            const { data: allDishes, error: cacheErr } = await supabase
                .from('dishes')
                .select('id, score');

            if (!cacheErr && allDishes) {
                const reviewMap = new Map(reviewsToInsert.map(r => [r.dish_id, r.rating]));
                for (const dish of allDishes) {
                    let currentScore = dish.score !== null ? Number(dish.score) : 100.00;
                    if (reviewMap.has(dish.id)) {
                        const rating = reviewMap.get(dish.id);

                        if (rating === 1) {
                            currentScore -= 0.5;
                        } else if (rating === 2) {
                            currentScore -= 0.25;
                        } else if (rating === 3) {
                            currentScore += 0.25;
                        } else if (rating === 4) {
                            currentScore += 0.25;
                        } else if (rating === 5) {
                            currentScore += 0.25;
                        }
                    }

                    if (currentScore > 100) currentScore = 100.00;
                    if (currentScore < 0) currentScore = 0.0;

                    currentScore = Math.round(currentScore * 100) / 100;

                    await supabase
                        .from('dishes')
                        .update({ score: currentScore })
                        .eq('id', dish.id);
                }
            }


        } catch (error) {
            console.error("Lỗi thuật toán tính điểm chất lượng Dishes:", error.message);
        }

        const formatReview = insertReview.map(item => ({
            ...item,
            created_at: moment(item.created_at).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss")
        }));

        return res.status(200).json({
            success: true,
            data: formatReview,
            message: 'Đã thêm toàn bộ đánh giá chi tiết thành công!'
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}