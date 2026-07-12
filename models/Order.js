/**
 * ============================================================
 *  Order.js  —  Mongoose Schema / Model
 * ============================================================
 *  Stores completed orders with customer info, line items,
 *  pricing breakdown, and status tracking.
 * ============================================================
 */

import mongoose from 'mongoose';

// ─── Order Item Sub-Schema ───────────────────────────────────
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    variation: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

// ─── Customer Sub-Schema ─────────────────────────────────────
const customerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    zip: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true,
    },
  },
  { _id: false }
);

// ─── Main Order Schema ───────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: customerSchema,
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    promoCode: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shipping: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Processing',
    },
    paymentIntentId: {
      type: String,
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'cod', 'bkash'],
      default: 'card',
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    estimatedDelivery: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 days
    },

  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.orderId = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ─────────────────────────────────────────────────
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
