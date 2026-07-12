/**
 * ============================================================
 *  promoRoutes.js  —  Promo Code Routes
 * ============================================================
 *  Maps URLs to promo code controllers.
 * ============================================================
 */

import express from 'express';
import {
  validatePromoCode,
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
} from '../controllers/promoController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to validate code
router.route('/validate').post(validatePromoCode);

// Admin-only CRUD routes
router
  .route('/')
  .get(protect, admin, getPromoCodes)
  .post(protect, admin, createPromoCode);

router
  .route('/:id')
  .put(protect, admin, updatePromoCode)
  .delete(protect, admin, deletePromoCode);

export default router;
