import { db } from '../drizzle/db';
import { itemsTable } from '../drizzle/db/schema';
import { eq, sql, and, inArray } from 'drizzle-orm';

// The drizzle database and its transaction handle expose the same query API,
// so every helper accepts either and callers pass their transaction handle.
type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type StockExecutor = typeof db | DbTx;

export interface StockLine {
  itemId: number;
  quantity: number;
}

// Domain error carrying the HTTP status the route should respond with.
// 409 = insufficient stock, 400 = malformed/unknown item.
export class StockError extends Error {
  constructor(message: string, public status: number = 409) {
    super(message);
    this.name = 'StockError';
  }
}

function toPositiveInt(value: unknown, label: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    throw new StockError(`${label} must be a positive whole number`, 400);
  }
  return n;
}

/**
 * Validate a set of stock lines against current quantities BEFORE any
 * mutation happens. Aggregates duplicate lines for the same item, rejects
 * unknown items, negative/zero quantities, and — when a source branch is
 * given — items that don't belong to that branch.
 *
 * Throws StockError with a user-facing message (409/400) on failure.
 */
export async function assertStockAvailable(
  lines: StockLine[],
  opts: { branchId?: number } = {},
  executor: StockExecutor = db
): Promise<void> {
  const totals = new Map<number, number>();
  for (const line of lines) {
    const itemId = Number(line.itemId);
    if (!Number.isFinite(itemId) || !Number.isInteger(itemId) || itemId <= 0) {
      throw new StockError('Invalid item in request', 400);
    }
    const qty = toPositiveInt(line.quantity, 'Quantity');
    totals.set(itemId, (totals.get(itemId) ?? 0) + qty);
  }
  if (totals.size === 0) return;

  const rows = await executor
    .select()
    .from(itemsTable)
    .where(inArray(itemsTable.id, [...totals.keys()]));
  const byId = new Map(rows.map((r) => [r.id, r]));

  for (const [itemId, qty] of totals) {
    const row = byId.get(itemId);
    if (!row) {
      throw new StockError('One of the items no longer exists', 400);
    }
    if (opts.branchId !== undefined && row.branchId !== opts.branchId) {
      throw new StockError(`"${row.name}" is not stocked at the selected branch`, 400);
    }
    const available = Number(row.quantity ?? 0);
    if (available < qty) {
      throw new StockError(
        available <= 0
          ? `Insufficient stock: "${row.name}" is out of stock`
          : `Insufficient stock: "${row.name}" has only ${available} available (requested ${qty})`,
        409
      );
    }
  }
}

/**
 * Atomic, guarded deduction: the UPDATE only applies when the row still has
 * enough stock (`WHERE quantity >= n`), so concurrent requests can never
 * drive the balance negative. Throws StockError (409) when stock runs out.
 */
export async function deductStock(
  executor: StockExecutor,
  itemId: number,
  quantity: number
): Promise<{ id: number; name: string; quantity: number }> {
  const qty = toPositiveInt(quantity, 'Quantity');

  const updated = await executor
    .update(itemsTable)
    .set({ quantity: sql`quantity - ${qty}` })
    .where(and(eq(itemsTable.id, Number(itemId)), sql`quantity >= ${qty}`))
    .returning({ id: itemsTable.id, name: itemsTable.name, quantity: itemsTable.quantity });

  if (updated.length === 0) {
    // Distinguish "item vanished" from "not enough stock" for a clear message.
    const row = await executor
      .select({ name: itemsTable.name, quantity: itemsTable.quantity })
      .from(itemsTable)
      .where(eq(itemsTable.id, Number(itemId)))
      .limit(1);
    if (row.length === 0) {
      throw new StockError('One of the items no longer exists', 400);
    }
    const available = Number(row[0].quantity ?? 0);
    throw new StockError(
      available <= 0
        ? `Insufficient stock: "${row[0].name}" is out of stock`
        : `Insufficient stock: "${row[0].name}" has only ${available} available (requested ${qty})`,
      409
    );
  }

  return updated[0];
}

/** Add stock (receiving, sale revert, transfer credit). Always safe. */
export async function addStock(
  executor: StockExecutor,
  itemId: number,
  quantity: number
): Promise<void> {
  const qty = toPositiveInt(quantity, 'Quantity');
  await executor
    .update(itemsTable)
    .set({ quantity: sql`quantity + ${qty}` })
    .where(eq(itemsTable.id, Number(itemId)));
}
