/**
 * ============================================================
 *  server.js  —  Main Entry Point for the Backend Server
 * ============================================================
 *  Starts the Express server, connects to MongoDB, mounts middleware,
 *  routes API endpoints, and hooks the global error handler.
 * ============================================================
 */

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import promoRoutes from './routes/promoRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import errorHandler from './middleware/errorHandler.js';


// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// ─── Middleware ──────────────────────────────────────────────
// CORS configuration
app.use(cors());

// HTTP Request logging in dev environment
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check Endpoint ───────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'AURA API Server is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/users',    userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/promo',    promoRoutes);
app.use('/api/payments', paymentRoutes);

// ─── 404 handler for unmatched routes ───────────────────────
app.use((req, res, next) => {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
});

// ─── Global Error Handler ───────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`
  );
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
