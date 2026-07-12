/**
 * ============================================================
 *  PromoCode.js  —  Mongoose Schema / Model
 * ============================================================
 *  Stores promo/discount codes with discount percentages.
 *  Used for validating codes during checkout.
 * ============================================================
 */

import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Promo code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    discountPercent: {
      type: Number,
      required: [true, 'Discount percentage is required'],
      min: [1, 'Discount must be at least 1%'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        delete ret._id;
        return ret;
      },
    },
  }
);

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

export default PromoCode;
