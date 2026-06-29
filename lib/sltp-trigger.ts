import { SupabaseClient } from "@supabase/supabase-js";
import { Quote } from "@/types/market";

export async function triggerHoldingSLTP(supabase: SupabaseClient, quotes: Quote[]) {
  try {
    // Fetch holdings with either stop_loss or take_profit set
    const { data: holdings, error: fetchError } = await supabase
      .from("holdings")
      .select("*");

    if (fetchError || !holdings || holdings.length === 0) {
      return;
    }

    const quoteMap = new Map<string, Quote>();
    quotes.forEach((q) => quoteMap.set(q.symbol, q));

    for (const holding of holdings) {
      const quote = quoteMap.get(holding.symbol);
      if (!quote) continue;

      const ltp = quote.ltp;
      const quantity = Number(holding.quantity);
      const stopLoss = holding.stop_loss ? Number(holding.stop_loss) : null;
      const takeProfit = holding.take_profit ? Number(holding.take_profit) : null;

      let triggered = false;
      let triggerType: "STOP_LOSS" | "TAKE_PROFIT" | null = null;
      let triggerPrice = 0;

      if (stopLoss !== null && ltp <= stopLoss) {
        triggered = true;
        triggerType = "STOP_LOSS";
        triggerPrice = stopLoss;
      } else if (takeProfit !== null && ltp >= takeProfit) {
        triggered = true;
        triggerType = "TAKE_PROFIT";
        triggerPrice = takeProfit;
      }

      if (!triggered || !triggerType) continue;

      // Fetch user profile balance to execute transaction
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", holding.user_id)
        .single();

      if (!profile) continue;

      const total = parseFloat((quantity * ltp).toFixed(2));
      const newBalance = parseFloat((Number(profile.balance) + total).toFixed(2));

      // 1. Update user profile balance
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", holding.user_id);
      if (profileError) throw profileError;

      // 2. Delete holding position
      const { error: deleteError } = await supabase
        .from("holdings")
        .delete()
        .eq("id", holding.id);
      if (deleteError) throw deleteError;

      // 3. Insert transaction record
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: holding.user_id,
          symbol: holding.symbol,
          ticker: holding.ticker,
          name: holding.name,
          type: "SELL",
          quantity,
          price: ltp,
          total,
        });
      if (txError) throw txError;

      // 4. Insert triggered alert into price_alerts table so the AlertNotifier UI picks it up
      const { error: alertError } = await supabase
        .from("price_alerts")
        .insert({
          user_id: holding.user_id,
          symbol: holding.symbol,
          ticker: holding.ticker,
          name: holding.name,
          condition: triggerType === "STOP_LOSS" ? "BELOW" : "ABOVE",
          target_price: triggerPrice,
          status: "TRIGGERED",
          type: triggerType,
        });
      if (alertError) throw alertError;

      console.log(`[sltp-trigger] Executed automatic ${triggerType} sell for ${holding.ticker}: sold ${quantity} shares at ₹${ltp}`);
    }
  } catch (err) {
    console.error("[sltp-trigger] Execution failed:", err);
  }
}
