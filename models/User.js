/**
 * ============================================================
 *  User.js  —  Mongoose Schema / Model
 * ============================================================
 *  Defines the shape of a user document in MongoDB.
 *  - Password is automatically hashed via a pre-save hook
 *    using bcryptjs (saltRounds = 10).
 *  - matchPassword() allows secure comparison of a plaintext
 *    password against the stored hash (used during login).
 * ============================================================
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ─── User Schema ─────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Pre-Save Hook — Hash Password ───────────────────────────
// Only re-hashes the password if it has been modified (new user
// or explicit password update). Skips hashing on other field updates.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance Method — Compare Password ──────────────────────
// Compares a plaintext password against the stored bcrypt hash.
// Returns true if they match, false otherwise.
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
