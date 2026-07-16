/** Converts Prisma Decimal/Date fields to plain numbers/strings so an object
 * can safely cross the Server -> Client Component boundary. */
export function toPlainRow<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value && typeof value === "object" && "toNumber" in value && typeof (value as { toNumber: unknown }).toNumber === "function") {
      out[key] = (value as { toNumber: () => number }).toNumber();
    } else if (value instanceof Date) {
      out[key] = value.toISOString();
    } else {
      out[key] = value;
    }
  }
  return out;
}
