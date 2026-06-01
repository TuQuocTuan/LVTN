import express from 'express';
import cors from 'cors';
import dishRoutes from './src/routes/dishRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Gắn phân hệ Route vào Server chính
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`BBQ Server chuẩn kiến trúc đang chạy tại cổng ${PORT}`));