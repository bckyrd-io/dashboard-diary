// PayChangu Direct Charge (Mobile Money) integration.
//
// Flow: initiate() creates a pending payment intent and asks PayChangu to
// charge the customer's handset; verify()/fulfill() confirm the result
// server-side before any sale is recorded. Fulfillment is idempotent — the
// sale event carries clientOpId = chargeId, which is a unique column, so
// webhook + polling can race without ever recording the sale twice.

import { db } from '../drizzle/db';
import {
  eventsTable,
  eventItemsTable,
  itemsTable,
  notificationsTable,
  performanceTable,
  paymentsTable,
  usersTable,
} from '../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';

const OPERATOR_REF_IDS: Record<string, string> = {
  airtel_money: '20be6c20-adeb-4b5b-a7ba-0769820df4fb', // Airtel Money
  tnm_mpamba: '27494cb5-ba9e-437f-a114-4e7a7686bcca', // TNM Mpamba
};

export function paychanguConfig() {
  const secretKey = process.env.PAYCHANGU_SECRET_KEY?.trim();
  const baseUrl = (process.env.PAYCHANGU_BASE_URL?.trim() || 'https://api.paychangu.com').replace(/\/$/, '');
  return { secretKey, baseUrl };
}

export function isMobileMoneyMethod(method: unknown): method is 'airtel_money' | 'tnm_mpamba' {
  return method === 'airtel_money' || method === 'tnm_mpamba';
}

// PayChangu wants a plain Malawi number (nine digits, optionally with a
// leading 0) — it explicitly rejects the +265 E.164 form:
//   0991234567 -> 991234567
//   +265991234567 -> 991234567
//   899817565 -> 899817565
export function normalizeMobile(raw: string): string {
  let digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('265')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export function generateChargeId(): string {
  return `ch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function paychanguFetch(path: string, init?: RequestInit, timeoutMs = 20000) {
  const { secretKey, baseUrl } = paychanguConfig();
  if (!secretKey) throw new Error('PAYCHANGU_SECRET_KEY is not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json, text };
  } finally {
    clearTimeout(timer);
  }
}

export interface CartItem {
  itemId: number;
  quantity: number;
  unitPriceAtSale?: number;
}

export interface InitiateInput {
  chargeId: string;
  amount: number;
  mobile: string;
  paymentMethod: 'airtel_money' | 'tnm_mpamba';
  items: CartItem[];
  description?: string;
  userId?: number;
  clientOpId?: string;
}

// Create the pending intent locally, then push the charge to PayChangu.
export async function initiateMomoCharge(input: InitiateInput) {
  const operatorRef = OPERATOR_REF_IDS[input.paymentMethod];
  if (!operatorRef) throw new Error('Unsupported mobile money method');

  // Store the intent first so the payment exists even if the gateway call fails
  // mid-flight (the customer can then be told to retry without ambiguity).
  await db
    .insert(paymentsTable)
    .values({
      chargeId: input.chargeId,
      amount: Math.round(input.amount),
      paymentMethod: input.paymentMethod,
      mobile: normalizeMobile(input.mobile),
      status: 'pending',
      items: JSON.stringify(input.items ?? []),
      description: input.description ?? null,
      userId: input.userId ?? null,
      clientOpId: input.clientOpId ?? null,
    })
    .onConflictDoNothing({ target: paymentsTable.chargeId });

  const response = await paychanguFetch('/mobile-money/payments/initialize', {
    method: 'POST',
    body: JSON.stringify({
      mobile: normalizeMobile(input.mobile),
      mobile_money_operator_ref_id: operatorRef,
      amount: String(Math.round(input.amount)),
      charge_id: input.chargeId,
      email: undefined,
      first_name: undefined,
      last_name: undefined,
    }),
  });

  if (!response.ok || !response.json || response.json.status !== 'success') {
    // Keep the raw gateway body for debugging (their `message` is sometimes
    // an object, which would otherwise stringify to "[object Object]").
    console.error(
      'PayChangu initiate rejected:',
      response.status,
      (response.text || '').slice(0, 1000)
    );
    const rawMessage = response.json?.message;
    const message =
      typeof rawMessage === 'string' && rawMessage
        ? rawMessage
        : rawMessage
          ? JSON.stringify(rawMessage)
          : response.text || `PayChangu error (HTTP ${response.status})`;
    await db
      .update(paymentsTable)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(paymentsTable.chargeId, input.chargeId));
    const err = new Error(message) as Error & { status?: number };
    err.status = response.status >= 500 ? 502 : 400;
    throw err;
  }

  return {
    chargeId: input.chargeId,
    status: String(response.json?.data?.status ?? 'pending'),
    message: response.json?.message ?? 'Payment initiated',
  };
}

type VerifyResult = 'success' | 'failed' | 'pending';

// Ask PayChangu for the authoritative charge status.
export async function verifyMomoCharge(chargeId: string): Promise<VerifyResult> {
  const response = await paychanguFetch(
    `/mobile-money/payments/${encodeURIComponent(chargeId)}/verify`,
    { method: 'GET' }
  );

  if (!response.ok && response.status !== 404) {
    // Gateway hiccup — treat as still pending rather than failing the sale.
    throw new Error(response.json?.message || `Verification failed (HTTP ${response.status})`);
  }

  const status = String(response.json?.data?.status ?? response.json?.status ?? '').toLowerCase();
  if (status === 'success' || status === 'successful') return 'success';
  if (status === 'failed' || status === 'cancelled' || status === 'expired') return 'failed';
  return 'pending';
}

// Record the sale exactly like /api/checkout does: event + line items + stock
// deduction + low-stock notifications + performance attribution. Idempotent via
// events.clientOpId = chargeId.
export async function fulfillPayment(chargeId: string) {
  const payment = (
    await db.select().from(paymentsTable).where(eq(paymentsTable.chargeId, chargeId)).limit(1)
  )[0];
  if (!payment) throw new Error('Payment not found');
  if (payment.status === 'success' && payment.eventId) {
    return { alreadyFulfilled: true as const, eventId: payment.eventId };
  }

  let items: CartItem[] = [];
  try {
    items = payment.items ? (JSON.parse(payment.items) as CartItem[]) : [];
  } catch {
    items = [];
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPriceAtSale || 0),
    0
  );

  // Idempotency guard: if a previous attempt already created the event, reuse it.
  const existingEvent = (
    await db
      .select({ id: eventsTable.id })
      .from(eventsTable)
      .where(eq(eventsTable.clientOpId, chargeId))
      .limit(1)
  )[0];

  let eventId = existingEvent?.id;

  if (!eventId) {
    const newEvent = await db
      .insert(eventsTable)
      .values({
        eventType: 'sale',
        financialType: 'Revenue',
        description: payment.description || `Sale - ${items.length} item(s)`,
        amount: totalAmount,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: payment.paymentMethod,
        paymentReference: payment.gatewayReference || chargeId,
        paymentStatus: 'success',
        clientOpId: chargeId,
      })
      .returning();
    eventId = newEvent[0].id;

    if (payment.userId) {
      const sellingUser = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.id, Number(payment.userId)))
        .limit(1);
      if (sellingUser.length > 0) {
        await db.insert(performanceTable).values({
          userId: sellingUser[0].id,
          activityId: eventId,
          status: 'Completed',
        });
      }
    }

    for (const item of items) {
      await db.insert(eventItemsTable).values({
        eventId,
        itemId: Number(item.itemId),
        quantity: Number(item.quantity),
        unitPriceAtSale: Number(item.unitPriceAtSale || 0),
      });
      await db
        .update(itemsTable)
        .set({ quantity: sql`quantity - ${Number(item.quantity)}` })
        .where(eq(itemsTable.id, Number(item.itemId)));
    }

    // Low-stock notifications (same behaviour as /api/checkout)
    for (const item of items) {
      const itemData = await db
        .select()
        .from(itemsTable)
        .where(eq(itemsTable.id, Number(item.itemId)))
        .limit(1);
      if (
        itemData[0] &&
        itemData[0].reorderThreshold &&
        itemData[0].quantity <= itemData[0].reorderThreshold
      ) {
        const admins = await db.select().from(usersTable).where(eq(usersTable.role, 'admin'));
        for (const admin of admins) {
          await db.insert(notificationsTable).values({
            userId: admin.id,
            type: 'low_stock',
            title: 'Low Stock Alert',
            body: `${itemData[0].name} is running low (${itemData[0].quantity} remaining)`,
            relatedItemId: Number(item.itemId),
          });
        }
      }
    }
  }

  await db
    .update(paymentsTable)
    .set({ status: 'success', eventId, updatedAt: new Date() })
    .where(eq(paymentsTable.chargeId, chargeId));

  return { alreadyFulfilled: false as const, eventId: eventId! };
}

export async function markPaymentFailed(chargeId: string) {
  await db
    .update(paymentsTable)
    .set({ status: 'failed', updatedAt: new Date() })
    .where(eq(paymentsTable.chargeId, chargeId));
}

export function serverError(message: string, status = 500) {
  return NextResponse.json({ success: false, message }, { status });
}
