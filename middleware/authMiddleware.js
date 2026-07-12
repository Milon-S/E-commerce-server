/**
 * ============================================================
 *  authMiddleware.js  —  JWT Auth & Admin Guard Middleware
 * ============================================================
 *  protect : Verifies the JWT from the Authorization header
 *            and attaches the decoded user (sans password)
 *            to req.user for downstream handlers.
 *
 *  admin   : Must come after protect. Blocks access if
 *            req.user.isAdmin is not true.
 * ============================================================
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ─── protect ─────────────────────────────────────────────────
/**
 * Middleware: protect
 * Reads the Bearer token from the Authorization header,
 * verifies it, and populates req.user.
 */
export const protect = async (req, res, next) => {
  let token;

  // Check for Authorization: Bearer <token>
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from DB and strip the password field
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    next();
  } catch (error) {
    console.error('[protect] Token verification failed:', error.message);
    return res.status(401).json({ message: 'Not authorized, token is invalid or expired' });
  }
};

// ─── admin ───────────────────────────────────────────────────
/**
 * Middleware: admin
 * Must be used after protect. Allows access only if the
 * authenticated user has isAdmin === true.
 */
export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Admin access required' });
};
