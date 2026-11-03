import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { fulfillPayment, markPaymentFailed, verifyMomoCharge } from '../../../../lib/paychangu';

// PayChangu webhook (Settings → API & Webhooks → this URL).
// Signature = HMAC-SHA256 of the raw body with the web secret (WEBHOOK_SECRET).
// Always re-verifies with the gateway before recording anything, and returns
// 200 for everything we intentionally ignore so PayChangu stops retrying.
export async function POST(req: Request) {
  const raw = await req.text();

  const secret = process.env.WEBHOOK_SECRET?.trim();
  if (secret) {
    const signature = req.headers.get('Signature') ?? req.headers.get('signature');
    const expected = createHmac('sha256', secret).update(raw).digest('hex');
    const provided = Buffer.from(signature ?? '', 'utf8');
    const wanted = Buffer.from(expected, 'utf8');
    if (provided.length !== wanted.length || !timingSafeEqual(provided, wanted)) {
      console.warn('PayChangu webhook rejected: bad signature');
      return NextResponse.json({ received: false }, { status: 401 });
    }
  }

  let payload: any = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }

  try {
    const chargeId = String(payload?.charge_id ?? payload?.data?.charge_id ?? '');
    const status = String(payload?.status ?? payload?.data?.status ?? '').toLowerCase();

    if (!chargeId) {
      return NextResponse.json({ received: true });
    }

    if (status === 'success' || status === 'successful') {
      // Never trust the webhook alone — re-query the gateway first.
      const verdict = await verifyMomoCharge(chargeId);
      if (verdict === 'success') {
        await fulfillPayment(chargeId);
      } else if (verdict === 'failed') {
        await markPaymentFailed(chargeId);
      }
    } else if (status === 'failed' || status === 'cancelled') {
      await markPaymentFailed(chargeId);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('PayChangu webhook error:', error?.message);
    // 200 anyway: we'll reconcile through /api/payments/status polling.
    return NextResponse.json({ received: true });
  }
}
