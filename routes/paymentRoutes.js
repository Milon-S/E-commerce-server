/**
 * ============================================================
 *  paymentRoutes.js  —  Stripe Payment Routes
 * ============================================================
 *  Maps endpoints to Stripe payment controllers.
 * ============================================================
 */

import express from 'express';
import { createPaymentIntent } from '../controllers/paymentController.js';

const router = express.Router();

// Route: /api/payments/payment-intent
router.post('/payment-intent', createPaymentIntent);

export default router;
