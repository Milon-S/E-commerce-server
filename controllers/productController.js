/**
 * ============================================================
 *  productController.js  —  Product Controllers
 * ============================================================
 *  Handles business logic for product-related API endpoints.
 *
 *  getProducts         : Public  — List with search, filter & pagination
 *  getProductById      : Public  — Single product by ID
 *  getShoeDetails      : Public  — Shoe size-stock map for footwear products
 *  createProduct       : Admin   — Create a new product (supports footwear fields)
 *  updateProduct       : Admin   — Update a product   (supports footwear fields)
 *  createProductReview : Auth    — Add a review to a product
 * ============================================================
 */

import Product from '../models/Product.js';

// ─── PAGE SIZE constant ────────────────────────────────────────
const PAGE_SIZE = 8;

// @desc    Get all products (search, category filter, pagination)
// @route   GET /api/products?keyword=&category=&page=&maxPrice=&sort=&featured=
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const {
      keyword,
      q,
      category,
      maxPrice,
      sort,
      featured,
      page,
      limit,
    } = req.query;

    const query = {};
    const searchTerm = keyword || q;

    // ── Search via $regex on title and description ──────────────
    if (searchTerm && searchTerm.trim() !== '') {
      query.$or = [
        { title:       { $regex: searchTerm.trim(), $options: 'i' } },
        { description: { $regex: searchTerm.trim(), $options: 'i' } },
      ];
    }

    // ── Category filter ─────────────────────────────────────────
    if (category && category !== 'all') {
      query.category = category;
    }

    // ── Max price filter ────────────────────────────────────────
    if (maxPrice) {
      const priceCeil = parseFloat(maxPrice);
      if (!isNaN(priceCeil)) {
        query.price = { $lte: priceCeil };
      }
    }

    // ── Featured filter ─────────────────────────────────────────
    if (featured === 'true') {
      query.featured = true;
    }

    const totalCount = await Product.countDocuments(query);

    // ── Determine pagination limits ─────────────────────────────
    let limitVal = null;
    let skip = 0;
    let pageNum = null;
    let totalPages = 1;

    if (page) {
      pageNum = Math.max(1, parseInt(page, 10) || 1);
      limitVal = limit ? parseInt(limit, 10) || PAGE_SIZE : PAGE_SIZE;
      skip = (pageNum - 1) * limitVal;
      totalPages = Math.ceil(totalCount / limitVal);
    } else if (limit) {
      limitVal = limit === 'all' ? null : parseInt(limit, 10) || null;
    }

    // ── Build and sort the query ────────────────────────────────
    let productQuery = Product.find(query);
    if (skip > 0) productQuery = productQuery.skip(skip);
    if (limitVal !== null) productQuery = productQuery.limit(limitVal);

    if (sort) {
      if (sort === 'price-asc')  productQuery = productQuery.sort({ price: 1 });
      else if (sort === 'price-desc') productQuery = productQuery.sort({ price: -1 });
      else if (sort === 'rating')     productQuery = productQuery.sort({ rating: -1 });
      else if (sort === 'featured')   productQuery = productQuery.sort({ featured: -1, createdAt: -1 });
    } else {
      productQuery = productQuery.sort({ createdAt: -1 });
    }

    const products = await productQuery;

    res.status(200).json({
      products,
      page:     pageNum || 1,
      pages:    totalPages,
      total:    totalCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    if (error.name === 'CastError') {
      return res
        .status(404)
        .json({ message: 'Product not found (Invalid ID format)' });
    }
    next(error);
  }
};

// @desc    Get shoe size-stock details for a footwear product
// @route   GET /api/products/:id/sizes
// @access  Public
//
// Returns a clean, frontend-ready object:
// {
//   productId, title, category,
//   sizeStock: [ { euSize: "40", ukSize: 6, stock: 5, inStock: true }, ... ]
// }
// If the product is not a footwear item, a 400 error is returned.
export const getShoeDetails = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Guard: only footwear products carry size-stock data
    if (product.category !== 'footwear') {
      return res.status(400).json({
        message: `Product '${product.title}' is not a footwear item (category: ${product.category})`,
      });
    }

    // Resolve the Mongoose Map to a plain object
    const rawMap =
      product.stockBySize instanceof Map
        ? Object.fromEntries(product.stockBySize)
        : product.stockBySize || {};

    // Build a sorted, structured array so the frontend can iterate cleanly
    const euSizes = Object.keys(rawMap).sort(
      (a, b) => parseInt(a, 10) - parseInt(b, 10)
    );

    const sizeStock = euSizes.map((euSize, idx) => {
      const qty = rawMap[euSize];
      return {
        euSize,                                 // EU size string  e.g. "41"
        ukSize: product.ukSizes[idx] ?? null,   // UK size number  e.g. 7
        stock: qty,                             // Exact qty in stock
        inStock: qty > 0,                       // Boolean shortcut for UI
      };
    });

    res.status(200).json({
      productId:    product._id,
      title:        product.title,
      category:     product.category,
      soleMaterial:  product.soleMaterial,
      upperMaterial: product.upperMaterial,
      sizeStock,   // Clean structured array ready for badge rendering
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res
        .status(404)
        .json({ message: 'Product not found (Invalid ID format)' });
    }
    next(error);
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Admin (protect + admin)
export const createProduct = async (req, res, next) => {
  try {
    const {
      title,
      name,           // accept 'name' as alias for 'title'
      price,
      description,
      image,
      images,
      category,
      stock,
      specs,
      variations,
      featured,
      // ── Footwear-specific fields ──────────────────────────
      stockBySize,   // { "40": 5, "41": 0, "42": 3 }
      ukSizes,       // [6, 7, 8]
      soleMaterial,
      upperMaterial,
    } = req.body;

    // Accept either 'name' or 'title' for product name
    const productTitle = title || name;

    if (!productTitle || !price || !description || !image || !category) {
      return res.status(400).json({
        message: 'Please provide title/name, price, description, image, and category',
      });
    }

    const product = new Product({
      title:        productTitle,
      price,
      description,
      image,
      images:       images || [image],
      category,
      stock:        stock ?? 0,
      specs:        specs || {},
      variations:   variations || null,
      featured:     featured ?? false,
      // Footwear fields — only saved when category === 'footwear'
      stockBySize:  stockBySize  || {},
      ukSizes:      ukSizes      || [],
      soleMaterial: soleMaterial  || '',
      upperMaterial: upperMaterial || '',
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product review
// @route   POST /api/products/:id/reviews
// @access  Protected (logged-in users only)
export const createProductReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Please provide a rating and comment' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if this user has already reviewed this product
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ message: 'You have already reviewed this product' });
    }

    // Build and push the review sub-document
    const review = {
      user:    req.user._id,
      name:    req.user.name,
      rating:  Number(rating),
      comment: comment.trim(),
    };
    product.reviews.push(review);

    // Recompute aggregated rating and numReviews
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, r) => acc + r.rating, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Product not found (Invalid ID format)' });
    }
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Admin (protect + admin)
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const {
      title, name, price, description, image, images,
      category, stock, specs, variations, featured,
      // ── Footwear-specific fields ──────────────────────────
      stockBySize, ukSizes, soleMaterial, upperMaterial,
    } = req.body;

    // Accept either 'name' or 'title'
    if (title || name)             product.title       = title || name;
    if (price !== undefined)       product.price       = price;
    if (description !== undefined) product.description = description;
    if (image !== undefined)       product.image       = image;
    if (images !== undefined)      product.images      = images;
    if (category !== undefined)    product.category    = category;
    if (stock !== undefined)       product.stock       = stock;
    if (specs !== undefined)       product.specs       = specs;
    if (variations !== undefined)  product.variations  = variations;
    if (featured !== undefined)    product.featured    = featured;
    // Footwear fields
    if (stockBySize !== undefined)   product.stockBySize   = stockBySize;
    if (ukSizes !== undefined)       product.ukSizes       = ukSizes;
    if (soleMaterial !== undefined)  product.soleMaterial  = soleMaterial;
    if (upperMaterial !== undefined) product.upperMaterial = upperMaterial;

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Product not found (Invalid ID format)' });
    }
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Admin (protect + admin)
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await product.deleteOne();
    res.status(200).json({ message: 'Product removed successfully', id: req.params.id });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Product not found (Invalid ID format)' });
    }
    next(error);
  }
};
