import { NextResponse } from 'next/server';
import { db } from '../../../../drizzle/db';
import { paymentsTable } from '../../../../drizzle/db/schema';
import { eq } from 'drizzle-orm';
import { fulfillPayment, markPaymentFailed, serverError, verifyMomoCharge } from '../../../../lib/paychangu';

// Poll this after initiating a charge. Verifies with PayChangu server-side and
// records the sale only when the gateway says it succeeded.
// GET /api/payments/status?chargeId=ch-...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chargeId = searchParams.get('chargeId');

    if (!chargeId) {
      return serverError('chargeId query parameter is required', 400);
    }

    const payment = (
      await db.select().from(paymentsTable).where(eq(paymentsTable.chargeId, chargeId)).limit(1)
    )[0];
    if (!payment) {
      return serverError('Payment not found', 404);
    }

    // Already settled — no need to hit the gateway again.
    if (payment.status === 'success' && payment.eventId) {
      return NextResponse.json({
        success: true,
        status: 'success',
        chargeId,
        eventId: payment.eventId,
        reference: payment.gatewayReference || chargeId,
      });
    }
    if (payment.status === 'failed') {
      return NextResponse.json({ success: true, status: 'failed', chargeId });
    }

    let verdict: 'success' | 'failed' | 'pending';
    try {
      verdict = await verifyMomoCharge(chargeId);
    } catch (error: any) {
      // Transient gateway problem: report still-pending so the app keeps polling.
      console.warn('PayChangu verify warning:', error?.message);
      return NextResponse.json({ success: true, status: 'pending', chargeId });
    }

    if (verdict === 'success') {
      const result = await fulfillPayment(chargeId);
      return NextResponse.json({
        success: true,
        status: 'success',
        chargeId,
        eventId: result.eventId,
        reference: payment.gatewayReference || chargeId,
        duplicate: result.alreadyFulfilled,
      });
    }

    if (verdict === 'failed') {
      await markPaymentFailed(chargeId);
      return NextResponse.json({ success: true, status: 'failed', chargeId });
    }

    return NextResponse.json({ success: true, status: 'pending', chargeId });
  } catch (error: any) {
    console.error('Payment status error:', error);
    return serverError(error?.message || 'Could not check the payment', 500);
  }
}
