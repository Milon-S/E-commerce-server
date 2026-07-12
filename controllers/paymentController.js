/**
 * ============================================================
 *  paymentController.js  —  Stripe Payment Controller
 * ============================================================
 *  Handles Stripe-related backend operations, such as creating
 *  payment intents to facilitate client checkout processes.
 * ============================================================
 */

import Stripe from 'stripe';

// Initialize stripe instance
const getStripeInstance = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not defined in backend environment variables');
  }
  return new Stripe(secretKey);
};

// @desc    Create a Stripe PaymentIntent
// @route   POST /api/payments/payment-intent
// @access  Public (Billing info holds authentication in Stripe)
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (amount === undefined || amount === null || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const stripe = getStripeInstance();

    // Stripe expects amount in the smallest currency unit (cents for USD)
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: { integration_check: 'accept_a_payment' },
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('[Stripe Error] createPaymentIntent failed:', error.message);
    next(error);
  }
};
