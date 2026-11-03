import { NextResponse } from 'next/server';
import {
  generateChargeId,
  initiateMomoCharge,
  isMobileMoneyMethod,
  serverError,
} from '../../../../lib/paychangu';

// Start a PayChangu Direct Charge for mobile money.
// Body: { amount, mobile, paymentMethod, items, description, userId, clientOpId }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, mobile, paymentMethod, items, description, userId, clientOpId } = body;

    if (!isMobileMoneyMethod(paymentMethod)) {
      return serverError('Only mobile money payments can be initiated online', 400);
    }
    if (!mobile || !String(mobile).trim()) {
      return serverError('A customer phone number is required', 400);
    }
    const numericAmount = Math.round(Number(amount));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return serverError('A valid amount is required', 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      return serverError('The cart is empty', 400);
    }

    const chargeId = generateChargeId();
    const result = await initiateMomoCharge({
      chargeId,
      amount: numericAmount,
      mobile: String(mobile),
      paymentMethod,
      items,
      description,
      userId: userId ? Number(userId) : undefined,
      clientOpId: clientOpId ? String(clientOpId) : undefined,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Payment initiate error:', error);
    return serverError(error?.message || 'Could not start the payment', error?.status || 500);
  }
}
