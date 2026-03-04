/** Convert nanosecond bigint timestamp → JS Date */
export function bigintToDate(ns: bigint): Date {
  return new Date(Number(ns / 1_000_000n));
}

/** Convert JS Date → nanosecond bigint */
export function dateToBigint(d: Date): bigint {
  return BigInt(d.getTime()) * 1_000_000n;
}

/** Format a bigint nanosecond timestamp as a readable date string */
export function formatDate(ns: bigint): string {
  return bigintToDate(ns).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Format number as Indian currency */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Return today's date in YYYY-MM-DD for input[type=date] */
export function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Parse an input[type=date] string (YYYY-MM-DD) to bigint nanoseconds */
export function inputDateToBigint(s: string): bigint {
  const d = new Date(`${s}T00:00:00`);
  return dateToBigint(d);
}

/** Convert bigint nanoseconds to input[type=date] string (YYYY-MM-DD) */
export function bigintToInputDate(ns: bigint): string {
  return bigintToDate(ns).toISOString().slice(0, 10);
}

export function transactionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    paymentReceived: "Payment Received",
    materialPurchase: "Material Purchase",
    labourPayment: "Labour Payment",
    miscExpense: "Misc Expense",
  };
  return map[type] ?? type;
}

export function transactionTypeColor(type: string): string {
  const map: Record<string, string> = {
    paymentReceived:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    materialPurchase:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    labourPayment:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    miscExpense: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return map[type] ?? "bg-muted text-muted-foreground";
}
