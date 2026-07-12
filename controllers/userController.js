/**
 * ============================================================
 *  userController.js  —  User Auth Controllers
 * ============================================================
 *  registerUser : Create a new user account and return a JWT.
 *  authUser     : Authenticate credentials and return a JWT.
 *  getProfile   : Return the logged-in user's profile.
 * ============================================================
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ─── Helper — Generate JWT ────────────────────────────────────
/**
 * generateToken(id)
 * Creates a signed JWT for the given user ID.
 * Expiry is read from JWT_EXPIRES_IN env var (default 30d).
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// ─── Helper — User Response Shape ────────────────────────────
const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  isAdmin: user.isAdmin,
  token: generateToken(user._id),
});

// ─── registerUser ─────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/users
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // Create the user — password hashing handled by the pre-save hook
    const user = await User.create({ name, email, password });

    res.status(201).json(userResponse(user));
  } catch (error) {
    next(error);
  }
};

// ─── authUser (Login) ─────────────────────────────────────────
// @desc    Authenticate user and return token
// @route   POST /api/users/login
// @access  Public
export const authUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Validate password using the schema instance method
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(200).json(userResponse(user));
  } catch (error) {
    next(error);
  }
};

// ─── getProfile ───────────────────────────────────────────────
// @desc    Get logged-in user profile
// @route   GET /api/users/profile
// @access  Protected
export const getProfile = async (req, res) => {
  // req.user is already populated by the protect middleware
  res.status(200).json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    isAdmin: req.user.isAdmin,
  });
};
