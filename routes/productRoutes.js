/**
 * ============================================================
 *  productRoutes.js  —  Product Routes
 * ============================================================
 *  GET    /api/products              → getProducts (public)
 *  POST   /api/products              → createProduct (admin)
 *  GET    /api/products/:id          → getProductById (public)
 *  GET    /api/products/:id/sizes    → getShoeDetails (public, footwear only)
 *  PUT    /api/products/:id          → updateProduct (admin)
 *  DELETE /api/products/:id          → deleteProduct (admin)
 *  POST   /api/products/:id/reviews  → createProductReview (auth)
 * ============================================================
 */

import express from 'express';
import {
  getProducts,
  getProductById,
  getShoeDetails,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route: /api/products
router
  .route('/')
  .get(getProducts)                       // Public
  .post(protect, admin, createProduct);   // Admin only

// Route: /api/products/:id
router
  .route('/:id')
  .get(getProductById)                    // Public
  .put(protect, admin, updateProduct)     // Admin only
  .delete(protect, admin, deleteProduct); // Admin only

// Route: /api/products/:id/sizes  —  Footwear shoe details with size-stock map
router.route('/:id/sizes').get(getShoeDetails); // Public

// Route: /api/products/:id/reviews
router.route('/:id/reviews').post(protect, createProductReview); // Auth users

export default router;
