/**
 * market-utils.ts
 * Trading validation helpers: market hours, holiday calendar, and order sanity checks.
 */

// ── NSE 2025 Market Holiday List (YYYY-MM-DD in IST) ─────────────────────────
const NSE_HOLIDAYS_2025: Set<string> = new Set([
  "2025-01-26", // Republic Day
  "2025-02-26", // Mahashivratri
  "2025-03-14", // Holi
  "2025-03-31", // Id-Ul-Fitr (Ramzan Eid)
  "2025-04-10", // Shri Ram Navami
  "2025-04-14", // Dr. Baba Saheb Ambedkar Jayanti
  "2025-04-18", // Good Friday
  "2025-05-01", // Maharashtra Day
  "2025-08-15", // Independence Day
  "2025-08-27", // Ganesh Chaturthi
  "2025-10-02", // Gandhi Jayanti / Mahatma Gandhi Jayanti
  "2025-10-02", // Dussehra
  "2025-10-21", // Diwali Laxmi Puja (Muhurat Trading — market open for 1 hr; blocking for simplicity)
  "2025-10-22", // Diwali Balipratipada
  "2025-11-05", // Prakash Gurpurab (Guru Nanak Jayanti)
  "2025-12-25", // Christmas
]);

// ── NSE 2026 Market Holiday List ─────────────────────────────────────────────
const NSE_HOLIDAYS_2026: Set<string> = new Set([
  "2026-01-26", // Republic Day
  "2026-03-03", // Mahashivratri
  "2026-03-20", // Holi
  "2026-04-02", // Shri Ram Navami
  "2026-04-03", // Good Friday
  "2026-04-14", // Dr. Baba Saheb Ambedkar Jayanti
  "2026-05-01", // Maharashtra Day
  "2026-06-19", // Id-Ul-Fitr
  "2026-08-17", // Independence Day (observed)
  "2026-09-16", // Ganesh Chaturthi
  "2026-10-02", // Gandhi Jayanti
  "2026-10-20", // Dussehra
  "2026-11-10", // Diwali Laxmi Puja
  "2026-11-11", // Diwali Balipratipada
  "2026-11-24", // Guru Nanak Jayanti
  "2026-12-25", // Christmas
]);

function getISTDate(): { date: Date; dateStr: string; hours: number; minutes: number; dayOfWeek: number } {
  // IST = UTC+5:30
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);

  const year = ist.getUTCFullYear();
  const month = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const day = String(ist.getUTCDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const dayOfWeek = ist.getUTCDay(); // 0=Sun, 6=Sat

  return { date: ist, dateStr, hours, minutes, dayOfWeek };
}

/**
 * Returns whether the NSE/BSE markets are currently open.
 * Trading hours: 9:15 AM – 3:30 PM IST, Monday to Friday, excluding public holidays.
 */
export function isMarketOpen(): boolean {
  const { dateStr, hours, minutes, dayOfWeek } = getISTDate();

  // Weekend check
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  // Holiday check
  if (NSE_HOLIDAYS_2025.has(dateStr) || NSE_HOLIDAYS_2026.has(dateStr)) return false;

  // Time check: 09:15 to 15:30
  const totalMinutes = hours * 60 + minutes;
  const marketOpen = 9 * 60 + 15;   // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM

  return totalMinutes >= marketOpen && totalMinutes < marketClose;
}

/**
 * Returns a human-readable explanation of why the market is closed.
 */
export function getMarketClosedReason(): string {
  const { dateStr, hours, minutes, dayOfWeek } = getISTDate();

  if (dayOfWeek === 0) return "Markets are closed on Sundays.";
  if (dayOfWeek === 6) return "Markets are closed on Saturdays.";
  if (NSE_HOLIDAYS_2025.has(dateStr) || NSE_HOLIDAYS_2026.has(dateStr)) {
    return "Markets are closed today for a public holiday.";
  }

  const totalMinutes = hours * 60 + minutes;
  const marketOpen = 9 * 60 + 15;
  const marketClose = 15 * 60 + 30;

  if (totalMinutes < marketOpen) {
    const minsUntilOpen = marketOpen - totalMinutes;
    const h = Math.floor(minsUntilOpen / 60);
    const m = minsUntilOpen % 60;
    return `Markets open at 9:15 AM IST. Opens in ${h > 0 ? `${h}h ` : ""}${m}m.`;
  }
  if (totalMinutes >= marketClose) {
    return "Markets have closed for today. Trading resumes tomorrow at 9:15 AM IST (or next trading day).";
  }

  return "Markets are currently closed.";
}

/** Maximum value (INR) allowed per single order — anti-fat-finger protection */
const MAX_ORDER_VALUE = 5_000_000; // ₹50,00,000

export interface OrderValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a BUY order.
 */
export function validateBuyOrder(params: {
  quantity: number;
  price: number;
  availableBalance: number;
}): OrderValidationResult {
  // 1. Market hours
  if (!isMarketOpen()) {
    return { valid: false, error: getMarketClosedReason() };
  }

  // 2. Quantity must be a positive whole number
  if (!Number.isInteger(params.quantity) || params.quantity <= 0) {
    return { valid: false, error: "Quantity must be a positive whole number." };
  }

  // 3. Price must be positive
  if (!params.price || params.price <= 0) {
    return { valid: false, error: "Price must be a positive number." };
  }

  const total = params.quantity * params.price;

  // 4. Max order value cap
  if (total > MAX_ORDER_VALUE) {
    return {
      valid: false,
      error: `Single order value cannot exceed ₹${(MAX_ORDER_VALUE / 100000).toFixed(0)} lakh. Your order value is ₹${total.toLocaleString("en-IN")}.`,
    };
  }

  // 5. Sufficient balance
  if (params.availableBalance < total) {
    return {
      valid: false,
      error: `Insufficient balance. Required ₹${total.toLocaleString("en-IN")}, available ₹${params.availableBalance.toLocaleString("en-IN")}.`,
    };
  }

  return { valid: true };
}

/**
 * Validates a SELL order.
 */
export function validateSellOrder(params: {
  quantity: number;
  price: number;
  ownedQuantity: number;
}): OrderValidationResult {
  // 1. Market hours
  if (!isMarketOpen()) {
    return { valid: false, error: getMarketClosedReason() };
  }

  // 2. Quantity must be a positive whole number
  if (!Number.isInteger(params.quantity) || params.quantity <= 0) {
    return { valid: false, error: "Quantity must be a positive whole number." };
  }

  // 3. Price must be positive
  if (!params.price || params.price <= 0) {
    return { valid: false, error: "Price must be a positive number." };
  }

  const total = params.quantity * params.price;

  // 4. Max order value cap
  if (total > MAX_ORDER_VALUE) {
    return {
      valid: false,
      error: `Single order value cannot exceed ₹${(MAX_ORDER_VALUE / 100000).toFixed(0)} lakh. Your order value is ₹${total.toLocaleString("en-IN")}.`,
    };
  }

  // 5. Must own the stock
  if (params.ownedQuantity <= 0) {
    return { valid: false, error: "You don't own any shares of this stock." };
  }

  // 6. Cannot sell more than owned
  if (params.quantity > params.ownedQuantity) {
    return {
      valid: false,
      error: `Cannot sell ${params.quantity} shares. You only own ${params.ownedQuantity} shares.`,
    };
  }

  return { valid: true };
}
