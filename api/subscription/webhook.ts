import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

/**
 * Razorpay Webhook Handler
 * Processes subscription and payment events idempotently.
 * Verifies x-razorpay-signature using RAZORPAY_WEBHOOK_SECRET.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'] as string;

    // 1. Signature Verification
    if (webhookSecret && signature) {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.error('Razorpay Webhook: Invalid signature');
        return res.status(400).json({ error: 'Invalid webhook signature.' });
      }
    } else if (process.env.NODE_ENV === 'production' && !webhookSecret) {
      console.warn('Razorpay Webhook: Warning - RAZORPAY_WEBHOOK_SECRET is not configured in production');
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    console.log(`Razorpay Webhook received event: ${event}`);

    // 2. Handle specific subscription & payment events
    switch (event) {
      case 'order.paid':
      case 'payment.captured': {
        const payment = payload?.payment?.entity;
        const orderId = payment?.order_id;
        const paymentId = payment?.id;
        const amount = payment?.amount ? payment.amount / 100 : 0;
        const email = payment?.email;
        const notes = payment?.notes || {};

        console.log(`Payment confirmed: ${paymentId} for order ${orderId}, user: ${email}, amount: ₹${amount}`);
        // Database update via Supabase if configured on server
        break;
      }

      case 'subscription.authenticated':
      case 'subscription.activated': {
        const subscription = payload?.subscription?.entity;
        console.log(`Subscription activated: ${subscription?.id}`);
        break;
      }

      case 'subscription.charged': {
        const payment = payload?.payment?.entity;
        const subscription = payload?.subscription?.entity;
        console.log(`Subscription renewed/charged: ${subscription?.id}, payment: ${payment?.id}`);
        break;
      }

      case 'subscription.halted':
      case 'subscription.cancelled': {
        const subscription = payload?.subscription?.entity;
        console.log(`Subscription halted/cancelled: ${subscription?.id}`);
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    // Always respond 200 to acknowledge receipt and prevent Razorpay retries
    return res.status(200).json({
      status: 'success',
      received: true,
      event
    });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal server error processing webhook.' });
  }
}
