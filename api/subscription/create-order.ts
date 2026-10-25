import type { VercelRequest, VercelResponse } from '../_types';

// Server-side Plan Configuration (Never trust client prices)
const PLAN_PRICES: Record<string, Record<string, number>> = {
  starter: {
    monthly: 499,
    quarterly: 1347, // 10% off
    annual: 4788     // 20% off
  },
  professional: {
    monthly: 999,
    quarterly: 2697,
    annual: 9588
  },
  enterprise: {
    monthly: 1999,
    quarterly: 5397,
    annual: 19188
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { planId, billingFrequency, clinicName, userEmail, userName, userPhone, gstin } = req.body;

    if (!planId || !billingFrequency) {
      return res.status(400).json({ error: 'Missing planId or billingFrequency.' });
    }

    const planTier = PLAN_PRICES[planId];
    if (!planTier || !planTier[billingFrequency]) {
      return res.status(400).json({ error: 'Invalid plan or billing frequency.' });
    }

    const baseAmount = planTier[billingFrequency];
    const gstAmount = Math.round(baseAmount * 0.18);
    const totalAmount = baseAmount + gstAmount;
    const amountInPaise = totalAmount * 100;

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Sandbox / Test Mode fallback if keys not configured
    if (!keyId || !keySecret || keyId.includes('your_key') || keySecret.includes('your_secret')) {
      const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return res.status(200).json({
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: 'INR',
        keyId: keyId || 'rzp_test_placeholder',
        mode: 'sandbox',
        breakdown: { baseAmount, gstAmount, totalAmount }
      });
    }

    // Call official Razorpay Orders API server-side
    const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_sub_${Date.now()}`,
        notes: {
          planId,
          billingFrequency,
          clinicName: clinicName || '',
          userEmail: userEmail || '',
          userName: userName || '',
          userPhone: userPhone || '',
          gstin: gstin || ''
        }
      })
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json();
      console.error('Razorpay Order API error:', errorData);
      return res.status(500).json({ error: 'Failed to create Razorpay order', details: errorData });
    }

    const orderData = await razorpayResponse.json();

    return res.status(200).json({
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId,
      mode: 'live',
      breakdown: { baseAmount, gstAmount, totalAmount }
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
