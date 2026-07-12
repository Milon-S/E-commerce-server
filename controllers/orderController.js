/**
 * ============================================================
 *  orderController.js  —  Order Controllers
 * ============================================================
 *  Handles business logic for placing orders and retrieving order details.
 * ============================================================
 */

import Order from '../models/Order.js';
import Product from '../models/Product.js';

// @desc    Create a new order
// @route   POST /api/orders
// @access  Public (in production, usually Protected)
export const createOrder = async (req, res, next) => {
  try {
    const {
      customer,
      items,
      promoCode,
      subtotal,
      shipping,
      tax,
      discount,
      total,
      paymentIntentId,
      paymentMethod,
      isPaid,
    } = req.body;

    // Basic Validation
    if (!customer || !items || items.length === 0) {
      return res.status(400).json({ message: 'Customer details and order items are required' });
    }

    // Verify products exist in DB (best-effort integrity check)
    // If productId is not a valid ObjectId (e.g. legacy mock id), skip the check
    for (const item of items) {
      try {
        const dbProduct = await Product.findById(item.productId);
        if (!dbProduct) {
          // Log warning but don't block the order — product may exist under a different ID format
          console.warn(`[createOrder] Product not found in DB: ${item.title} (${item.productId}) — proceeding anyway`);
        }
      } catch (castErr) {
        // Non-ObjectId productId — skip DB check, trust the client data
        console.warn(`[createOrder] Skipping DB check for non-ObjectId productId: ${item.productId}`);
      }
    }

    // Create the order in the database
    const order = new Order({
      customer,
      items,
      promoCode,
      subtotal,
      shipping,
      tax,
      discount,
      total,
      paymentIntentId: paymentIntentId || '',
      paymentMethod: paymentMethod || 'card',
      isPaid: isPaid || false,
      paidAt: isPaid ? new Date() : null,
    });

    const savedOrder = await order.save();

    res.status(201).json({
      success: true,
      orderId: savedOrder._id,
      message: `Order ${savedOrder._id} placed successfully!`,
      order: savedOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Public (usually protected/restricted to the ordering user in production)
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Order not found (Invalid ID format)' });
    }
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Admin (protect + admin)
export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Admin (protect + admin)
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Order not found (Invalid ID format)' });
    }
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const userEmail = req.user.email.toLowerCase().trim();
    const orders = await Order.find({
      'customer.email': { $regex: new RegExp(`^${userEmail}$`, 'i') }
    }).sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

