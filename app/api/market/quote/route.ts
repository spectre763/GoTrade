import { NextRequest, NextResponse } from "next/server";
import { fetchYahooQuotes } from "@/lib/yahoo-finance";
import { STOCKS } from "@/lib/mock-market";
import { createClient } from "@/lib/supabase/server";
import { triggerPendingLimitOrders } from "@/lib/limit-order-trigger";
import { triggerHoldingSLTP } from "@/lib/sltp-trigger";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols") ?? "";

  if (!symbolsParam.trim()) {
    return NextResponse.json({ error: "symbols parameter required" }, { status: 400 });
  }

  const symbolStrings = symbolsParam.split(",").map((s) => s.trim()).filter(Boolean);

  const stocksToFetch = symbolStrings.map((sym) => {
    const stock = STOCKS.find(s => s.symbol === sym);
    return stock || { symbol: sym, ticker: sym.split(":")[1] || sym, name: sym, sector: "Other" };
  });

  try {
    const quotes = await fetchYahooQuotes(stocksToFetch);

    // Fire-and-forget: check & execute any pending limit orders or SL/TP guards
    // Uses an admin client so RLS doesn't block cross-user trigger checks
    try {
      const supabase = await createClient();
      await Promise.all([
        triggerPendingLimitOrders(supabase, quotes),
        triggerHoldingSLTP(supabase, quotes),
      ]);
    } catch (triggerErr) {
      // Never let trigger errors break the quote response
      console.error("[quote] Trigger check failed:", triggerErr);
    }

    return NextResponse.json({ quotes });
  } catch (err: any) {
    console.error("Failed to fetch yahoo quotes:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
