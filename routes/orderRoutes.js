/**
 * ============================================================
 *  orderRoutes.js  —  Order Routes
 * ============================================================
 *  Maps URLs to order controllers.
 * ============================================================
 */

import express from 'express';
import {
  createOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
  getMyOrders,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route: /api/orders
router
  .route('/')
  .post(createOrder)
  .get(protect, admin, getOrders);

// Route: /api/orders/myorders
router.route('/myorders').get(protect, getMyOrders);

// Route: /api/orders/:id
router.route('/:id').get(getOrderById);


// Route: /api/orders/:id/status
router.route('/:id/status').put(protect, admin, updateOrderStatus);

export default router;
