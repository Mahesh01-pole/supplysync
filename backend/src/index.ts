import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import trackingRoutes from './routes/tracking';
import matchRoutes from './routes/match';
import analyticsRoutes from './routes/analytics';
import ordersRoutes from './routes/orders';
import suppliersRoutes from './routes/suppliers';
import productsRoutes from './routes/products';
import { setupWebSocket } from './websocket/ws-server';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SupplySync API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/products', productsRoutes);

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

setupWebSocket(server);
