/**
 * ============================================================
 *  Product.js  —  Mongoose Schema / Model
 * ============================================================
 *  Defines the shape of a product document in MongoDB.
 *  This schema mirrors the data structure used in the React
 *  frontend (apiService.js mock data).
 *
 *  Categories: 'electronics' | 'clothing' | 'footwear'
 *
 *  Footwear-specific fields (only populated when category === 'footwear'):
 *    stockBySize   — Map<euSize(string), qty(number)>
 *                    e.g. { "40": 5, "41": 0, "42": 3 }
 *    ukSizes       — Array<Number>  e.g. [6, 7, 8, 9]
 *    soleMaterial  — String  e.g. "Rubber Outsole"
 *    upperMaterial — String  e.g. "Full-Grain Leather"
 * ============================================================
 */

import mongoose from 'mongoose';

// ─── Variation Sub-Schema ────────────────────────────────────
// Products can have either color or size variations.
// Color options: [{ name, value (hex), active }]
// Size options:  ['S', 'M', 'L', 'XL'] (plain strings)
const variationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['color', 'size'],
      required: true,
    },
    options: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

// ─── Review Sub-Schema ─────────────────────────────────────
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// ─── Main Product Schema ─────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: {
        // ── 'footwear' added alongside existing categories ──
        values: ['electronics', 'clothing', 'footwear'],
        message: '{VALUE} is not a valid category',
      },
      lowercase: true,
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    image: {
      type: String,
      required: [true, 'Product image path is required'],
    },
    images: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    specs: {
      type: Map,
      of: String,
      default: {},
    },
    variations: {
      type: variationSchema,
      default: null,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    // ─── Stock & Reviews ──────────────────────────────────────
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    reviews: [reviewSchema],
    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Footwear-Specific Fields ──────────────────────────────
    /**
     * stockBySize: A Map where:
     *   key   = EU shoe size as a string (e.g. "40", "41", "42")
     *   value = quantity in stock for that exact size (Number)
     *
     * Example: { "39": 0, "40": 5, "41": 3, "42": 0, "43": 8 }
     *
     * The frontend reads this to render each size badge and
     * immediately marks out-of-stock sizes (value === 0) as disabled.
     * Only populated for category === 'footwear'.
     */
    stockBySize: {
      type: Map,
      of: Number,
      default: {},
    },

    /**
     * ukSizes: Array of UK shoe size numbers that correspond
     * positionally to the EU sizes in stockBySize.
     * EU 40 → UK 6 | EU 41 → UK 7 | EU 42 → UK 8, etc.
     * Only populated for category === 'footwear'.
     */
    ukSizes: {
      type: [Number],
      default: [],
    },

    /**
     * soleMaterial: Material of the shoe's outsole.
     * E.g. "Vulcanised Rubber", "TPU", "EVA Foam Compound"
     * Only populated for category === 'footwear'.
     */
    soleMaterial: {
      type: String,
      trim: true,
      default: '',
    },

    /**
     * upperMaterial: Material of the shoe's upper body.
     * E.g. "Full-Grain Leather", "Engineered Mesh Knit", "Suede"
     * Only populated for category === 'footwear'.
     */
    upperMaterial: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    // Transform _id to id in JSON responses for frontend compatibility
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        // Convert Mongoose Map to a plain JS object so JSON.stringify
        // serializes it correctly as { "40": 5, "41": 0, ... }
        if (ret.stockBySize instanceof Map) {
          ret.stockBySize = Object.fromEntries(ret.stockBySize);
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Text Index for Search ───────────────────────────────────
productSchema.index({ title: 'text', description: 'text' });

// ─── Category Index for Filtering ────────────────────────────
productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });

// ─── Virtual: name (alias for title) ───────────────────────
// Provides a 'name' field in JSON responses to satisfy API contracts
// that expect 'name', while keeping 'title' for the existing frontend.
productSchema.virtual('name').get(function () {
  return this.title;
});

const Product = mongoose.model('Product', productSchema);

export default Product;
