/**
 * ============================================================
 *  userRoutes.js  —  User Auth Routes
 * ============================================================
 *  POST /api/users         → Register a new user
 *  POST /api/users/login   → Login and get JWT
 *  GET  /api/users/profile → Get profile (protected)
 * ============================================================
 */

import express from 'express';
import {
  registerUser,
  authUser,
  getProfile,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Register new user
router.post('/', registerUser);

// Login
router.post('/login', authUser);

// Get own profile (requires valid JWT)
router.get('/profile', protect, getProfile);

export default router;
