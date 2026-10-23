import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Server-side Subscription Status Endpoint
 * Returns reliable server timestamp, evaluates trial expiry,
 * and prevents clients from spoofing local system clocks.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  try {
    const serverTime = new Date().toISOString();
    const serverTimestamp = Date.now();

    const userId = (req.query.userId || req.body?.userId) as string;
    const expiryDateStr = (req.query.expiryDate || req.body?.expiryDate) as string;
    const currentStatus = (req.query.status || req.body?.status) as string;

    let remainingDays = 0;
    let isExpired = false;
    let evaluatedStatus = currentStatus || 'trialing';

    if (expiryDateStr) {
      const expiry = new Date(expiryDateStr).getTime();
      const diffMs = expiry - serverTimestamp;
      remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      isExpired = serverTimestamp > expiry;

      if (isExpired && (evaluatedStatus === 'trialing' || evaluatedStatus === 'trial_expired')) {
        evaluatedStatus = 'trial_expired';
      }
    }

    return res.status(200).json({
      serverTime,
      serverTimestamp,
      userId,
      remainingDays,
      isExpired,
      evaluatedStatus,
      canAccessApp: evaluatedStatus === 'active' || (evaluatedStatus === 'trialing' && !isExpired)
    });
  } catch (error: any) {
    console.error('Error in status endpoint:', error);
    return res.status(500).json({ error: 'Failed to verify subscription status.' });
  }
}
