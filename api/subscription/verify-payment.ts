import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { 
      orderId, 
      paymentId, 
      signature, 
      planId, 
      billingFrequency, 
      userId, 
      userEmail, 
      clinicName, 
      amount 
    } = req.body;

    if (!paymentId || !orderId) {
      return res.status(400).json({ error: 'Missing paymentId or orderId.' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // 1. Sandbox fallback verification
    if (!keySecret || keySecret.includes('your_secret') || orderId.startsWith('order_mock_')) {
      const isSandboxSuccess = paymentId.startsWith('pay_mock_') || paymentId.startsWith('pay_');
      if (isSandboxSuccess) {
        return res.status(200).json({
          verified: true,
          mode: 'sandbox',
          message: 'Payment verified in sandbox mode.',
          paymentId,
          orderId,
          userId,
          status: 'active'
        });
      }
      return res.status(400).json({ verified: false, error: 'Sandbox payment simulation failed.' });
    }

    // 2. Cryptographic HMAC SHA256 Signature Verification
    if (!signature) {
      return res.status(400).json({ verified: false, error: 'Missing payment signature for live verification.' });
    }

    const bodyToSign = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(bodyToSign)
      .digest('hex');

    if (Buffer.byteLength(expectedSignature) !== Buffer.byteLength(signature)) {
      console.warn(`[SECURITY ALERT] Signature length mismatch for order: ${orderId}`);
      return res.status(400).json({ verified: false, error: 'Invalid payment signature format.' });
    }

    const isAuthentic = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );

    if (!isAuthentic) {
      console.warn(`[SECURITY ALERT] Invalid payment signature for order: ${orderId}, payment: ${paymentId}`);
      return res.status(400).json({ verified: false, error: 'Invalid payment signature. Verification failed.' });
    }

    // 3. Signature is verified!
    const now = new Date();
    let daysToAdd = 30;
    if (billingFrequency === 'quarterly') daysToAdd = 90;
    if (billingFrequency === 'annual') daysToAdd = 365;

    const periodEnd = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    return res.status(200).json({
      verified: true,
      mode: 'live',
      message: 'Razorpay payment signature verified successfully.',
      paymentId,
      orderId,
      planId,
      billingFrequency,
      userId,
      userEmail,
      clinicName,
      amount,
      status: 'active',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString()
    });
  } catch (err: any) {
    console.error('Payment verification error:', err);
    return res.status(500).json({ error: 'Internal verification error', message: err.message });
  }
}
