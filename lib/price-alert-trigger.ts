import { SupabaseClient } from "@supabase/supabase-js";
import { Quote } from "@/types/market";

export async function triggerPriceAlerts(supabase: SupabaseClient, quotes: Quote[]) {
  try {
    // 1. Fetch pending price alerts
    const { data: pendingAlerts, error: fetchError } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("status", "PENDING");

    if (fetchError || !pendingAlerts || pendingAlerts.length === 0) {
      return;
    }

    const quoteMap = new Map<string, Quote>();
    quotes.forEach((q) => quoteMap.set(q.symbol, q));

    for (const alert of pendingAlerts) {
      const quote = quoteMap.get(alert.symbol);
      if (!quote) continue;

      const ltp = quote.ltp;
      const target = Number(alert.target_price);

      let shouldTrigger = false;
      if (alert.condition === "ABOVE" && ltp >= target) {
        shouldTrigger = true;
      } else if (alert.condition === "BELOW" && ltp <= target) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        // Mark alert as TRIGGERED
        await supabase
          .from("price_alerts")
          .update({ status: "TRIGGERED" })
          .eq("id", alert.id);
      }
    }
  } catch (err) {
    console.error("[price-alert-trigger] Failed checking price alerts:", err);
  }
}
