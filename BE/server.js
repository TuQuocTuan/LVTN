import express from 'express';
import cors from 'cors';
import dishRoutes from './src/routes/dishRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import ingredientRoutes from './src/routes/ingredientRoutes.js';
import recipeRoutes from './src/routes/recipeRoutes.js';
import tableRoutes from './src/routes/tableRoutes.js';
import sessionRoutes from './src/routes/sessionRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Gắn phân hệ Route vào Server chính
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
const PORT = 5000;
app.listen(PORT, () => console.log(`BBQ Server chuẩn kiến trúc đang chạy tại cổng ${PORT}`));