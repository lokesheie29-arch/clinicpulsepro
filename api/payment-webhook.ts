import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hucxgzofsothuiqgxcfv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Webhooks only accept POST requests.' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signature = req.headers['x-razorpay-signature'] as string || req.headers['x-webhook-signature'] as string;

    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'whsec_clinicpulse_default';

    // 1. Verify HMAC-SHA256 Signature
    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );

      if (!isValid) {
        console.error('[WEBHOOK ERROR] Invalid HMAC-SHA256 Signature');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const payload = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
    const event = payload.event;
    console.log(`[PAYMENT WEBHOOK] Received event: ${event}`);

    // 2. Handle payment captured / successful event
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity || payload.data?.payment;
      const orderId = paymentEntity?.order_id || payload.data?.order?.order_id;
      const amountInRupees = (paymentEntity?.amount ? paymentEntity.amount / 100 : Number(paymentEntity?.amount_paid || 0));
      const invoiceId = paymentEntity?.notes?.invoice_id || paymentEntity?.description?.split('-')[1];

      if (invoiceId) {
        // Update Invoice in Supabase
        await supabase
          .from('invoices')
          .update({ payment_status: 'Paid' })
          .eq('id', invoiceId);

        // Record transaction in database
        await supabase
          .from('payment_transactions')
          .upsert({
            id: `txn_${paymentEntity?.id || Date.now()}`,
            order_id: orderId || `order_${Date.now()}`,
            invoice_id: invoiceId,
            patient_name: paymentEntity?.notes?.patient_name || 'Customer',
            patient_phone: paymentEntity?.contact || '',
            organization_type: paymentEntity?.notes?.org_type || 'hospital',
            organization_name: paymentEntity?.notes?.org_name || 'ClinicPulse Facility',
            bill_category: paymentEntity?.notes?.category || 'opd',
            amount: amountInRupees,
            currency: 'INR',
            payment_method: paymentEntity?.method === 'upi' ? 'upi_intent' : 'card',
            gateway_provider: 'razorpay',
            gateway_payment_id: paymentEntity?.id || `pay_${Date.now()}`,
            gateway_fee: Number((amountInRupees * 0.02).toFixed(2)),
            gateway_fee_gst: Number((amountInRupees * 0.02 * 0.18).toFixed(2)),
            net_settlement_amount: Number((amountInRupees * 0.9764).toFixed(2)),
            status: 'success',
            settlement_status: 'processing',
            signature_verified: true,
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString()
          });
      }
    }

    // 3. Handle payment failed event
    if (event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const invoiceId = paymentEntity?.notes?.invoice_id;

      if (invoiceId) {
        await supabase
          .from('payment_transactions')
          .insert({
            id: `txn_fail_${Date.now()}`,
            order_id: paymentEntity?.order_id || 'order_failed',
            invoice_id: invoiceId,
            patient_name: paymentEntity?.notes?.patient_name || 'Customer',
            organization_type: paymentEntity?.notes?.org_type || 'hospital',
            organization_name: paymentEntity?.notes?.org_name || 'ClinicPulse Facility',
            amount: paymentEntity?.amount ? paymentEntity.amount / 100 : 0,
            currency: 'INR',
            payment_method: 'upi_intent',
            gateway_provider: 'razorpay',
            gateway_payment_id: paymentEntity?.id || 'pay_failed',
            gateway_fee: 0,
            gateway_fee_gst: 0,
            net_settlement_amount: 0,
            status: 'failed',
            settlement_status: 'unsettled',
            failure_reason: paymentEntity?.error_description || 'Transaction declined by bank',
            signature_verified: true,
            created_at: new Date().toISOString()
          });
      }
    }

    return res.status(200).json({ status: 'ok', receivedEvent: event });
  } catch (error: any) {
    console.error('[WEBHOOK EXCEPTION]', error);
    return res.status(500).json({ error: error.message || 'Webhook processing failed' });
  }
}
