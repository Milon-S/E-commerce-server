/**
 * ============================================================
 *  promoController.js  —  Promo Code Controllers
 * ============================================================
 *  Handles business logic for promo code validation.
 * ============================================================
 */

import PromoCode from '../models/PromoCode.js';

// @desc    Validate a promo code
// @route   POST /api/promo/validate
// @access  Public
export const validatePromoCode = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        valid: false,
        message: 'Promo code is required'
      });
    }

    const upperCode = String(code).trim().toUpperCase();
    const promo = await PromoCode.findOne({ code: upperCode, active: true });

    if (promo) {
      return res.status(200).json({
        valid: true,
        code: upperCode,
        discountPercent: promo.discountPercent,
        description: promo.description
      });
    }

    // Code is not valid or not active
    return res.status(200).json({
      valid: false,
      code: upperCode,
      discountPercent: 0,
      description: ''
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all promo codes
// @route   GET /api/promo
// @access  Admin (protect + admin)
export const getPromoCodes = async (req, res, next) => {
  try {
    const promos = await PromoCode.find({}).sort({ createdAt: -1 });
    res.status(200).json(promos);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a promo code
// @route   POST /api/promo
// @access  Admin (protect + admin)
export const createPromoCode = async (req, res, next) => {
  try {
    const { code, discountPercent, description, active } = req.body;

    if (!code || !discountPercent || !description) {
      return res.status(400).json({ message: 'Code, discount percentage, and description are required' });
    }

    const upperCode = String(code).trim().toUpperCase();
    const existing = await PromoCode.findOne({ code: upperCode });
    if (existing) {
      return res.status(400).json({ message: `Promo code "${upperCode}" already exists` });
    }

    const promo = new PromoCode({
      code: upperCode,
      discountPercent,
      description,
      active: active ?? true,
    });

    const savedPromo = await promo.save();
    res.status(201).json(savedPromo);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a promo code
// @route   PUT /api/promo/:id
// @access  Admin (protect + admin)
export const updatePromoCode = async (req, res, next) => {
  try {
    const { code, discountPercent, description, active } = req.body;

    // The _id is in params.id. Find promo code by matching code or searching by id
    // Mongoose toJSON deletes _id on query output but it still exists in the DB
    const promo = await PromoCode.findById(req.params.id);
    if (!promo) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    if (code) {
      const upperCode = String(code).trim().toUpperCase();
      if (upperCode !== promo.code) {
        const existing = await PromoCode.findOne({ code: upperCode });
        if (existing) {
          return res.status(400).json({ message: `Promo code "${upperCode}" already exists` });
        }
        promo.code = upperCode;
      }
    }
    
    if (discountPercent !== undefined) promo.discountPercent = discountPercent;
    if (description !== undefined)     promo.description = description;
    if (active !== undefined)          promo.active = active;

    const updatedPromo = await promo.save();
    res.status(200).json(updatedPromo);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a promo code
// @route   DELETE /api/promo/:id
// @access  Admin (protect + admin)
export const deletePromoCode = async (req, res, next) => {
  try {
    const promo = await PromoCode.findById(req.params.id);
    if (!promo) {
      return res.status(404).json({ message: 'Promo code not found' });
    }
    await promo.deleteOne();
    res.status(200).json({ message: 'Promo code deleted successfully' });
  } catch (error) {
    next(error);
  }
};
