/**
 * Formats a number as Indian Rupee currency
 * e.g. 1000000 → ₹10,00,000
 */
export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1e7) return `₹${(value / 1e7).toFixed(2)}Cr`;
    if (Math.abs(value) >= 1e5) return `₹${(value / 1e5).toFixed(2)}L`;
    if (Math.abs(value) >= 1e3) return `₹${(value / 1e3).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a percentage value with sign
 * e.g. 2.45 → "+2.45%", -1.23 → "-1.23%"
 */
export function formatPercent(value: number, showSign = true): string {
  const sign = showSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Formats a large number in Indian numbering system
 * e.g. 1234567 → "12,34,567"
 */
export function formatIndianNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

/**
 * Formats volume for display
 * e.g. 1200000 → "12L", 1500000000 → "150Cr"
 */
export function formatVolume(volume: number): string {
  if (volume >= 1e7) return `${(volume / 1e7).toFixed(1)}Cr`;
  if (volume >= 1e5) return `${(volume / 1e5).toFixed(1)}L`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
  return volume.toString();
}

/**
 * Returns Tailwind CSS classes based on positive/negative value
 */
export function getPnLColor(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-rose-400";
  return "text-zinc-400";
}

/**
 * Returns bg color class for badges
 */
export function getPnLBg(value: number): string {
  if (value > 0) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  if (value < 0) return "bg-rose-500/15 text-rose-400 border-rose-500/20";
  return "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
}

/**
 * Formats a date string to readable format
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats a date to short time format
 */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
