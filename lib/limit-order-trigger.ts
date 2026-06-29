import { SupabaseClient } from "@supabase/supabase-js";
import { Quote } from "@/types/market";

export async function triggerPendingLimitOrders(supabase: SupabaseClient, quotes: Quote[]) {
  try {
    // 1. Fetch all pending limit/stop-loss orders
    const { data: pendingOrders, error: fetchError } = await supabase
      .from("limit_orders")
      .select("*")
      .eq("status", "PENDING");

    if (fetchError || !pendingOrders || pendingOrders.length === 0) {
      return;
    }

    const quoteMap = new Map<string, Quote>();
    quotes.forEach((q) => quoteMap.set(q.symbol, q));

    for (const order of pendingOrders) {
      const quote = quoteMap.get(order.symbol);
      if (!quote) continue;

      const ltp = quote.ltp;
      const target = Number(order.target_price);
      const qty = Number(order.quantity);
      const orderType: string = order.order_type ?? "LIMIT";

      let shouldTrigger = false;

      if (orderType === "LIMIT") {
        // LIMIT BUY: execute when price falls to or below target
        // LIMIT SELL: execute when price rises to or above target
        if (order.type === "BUY" && ltp <= target) shouldTrigger = true;
        else if (order.type === "SELL" && ltp >= target) shouldTrigger = true;
      } else if (orderType === "STOP_LOSS") {
        // STOP_LOSS BUY (breakout): execute when price rises to or above trigger
        // STOP_LOSS SELL (cut-loss): execute when price falls to or below trigger
        if (order.type === "BUY" && ltp >= target) shouldTrigger = true;
        else if (order.type === "SELL" && ltp <= target) shouldTrigger = true;
      }

      if (!shouldTrigger) continue;

      // Execute order!
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", order.user_id)
        .single();

      if (!profile) continue;

      if (order.type === "BUY") {
        const total = parseFloat((qty * target).toFixed(2));
        if (profile.balance >= total) {
          // Deduct balance
          const newBalance = parseFloat((profile.balance - total).toFixed(2));
          await supabase.from("profiles").update({ balance: newBalance }).eq("id", order.user_id);

          // Get existing holding
          const { data: existingHolding } = await supabase
            .from("holdings")
            .select("*")
            .eq("user_id", order.user_id)
            .eq("symbol", order.symbol)
            .maybeSingle();

          if (existingHolding) {
            const newQty = existingHolding.quantity + qty;
            const newAvgPrice = parseFloat(
              ((existingHolding.avg_price * existingHolding.quantity + target * qty) / newQty).toFixed(2)
            );
            await supabase.from("holdings").update({
              quantity: newQty,
              avg_price: newAvgPrice,
              stop_loss: order.stop_loss ?? existingHolding.stop_loss,
              take_profit: order.take_profit ?? existingHolding.take_profit,
            }).eq("id", existingHolding.id);
          } else {
            await supabase.from("holdings").insert({
              user_id: order.user_id,
              symbol: order.symbol,
              ticker: order.ticker,
              name: order.name,
              quantity: qty,
              avg_price: target,
              stop_loss: order.stop_loss,
              take_profit: order.take_profit,
            });
          }

          // Insert transaction record
          await supabase.from("transactions").insert({
            user_id: order.user_id,
            symbol: order.symbol,
            ticker: order.ticker,
            name: order.name,
            type: "BUY",
            quantity: qty,
            price: target,
            total,
          });

          // Mark order as TRIGGERED
          await supabase.from("limit_orders").update({ status: "TRIGGERED" }).eq("id", order.id);
        } else {
          // Insufficient balance — cancel
          await supabase.from("limit_orders").update({ status: "CANCELLED" }).eq("id", order.id);
        }
      } else {
        // order.type === "SELL"
        const { data: holding } = await supabase
          .from("holdings")
          .select("*")
          .eq("user_id", order.user_id)
          .eq("symbol", order.symbol)
          .maybeSingle();

        if (holding && holding.quantity >= qty) {
          const total = parseFloat((qty * target).toFixed(2));
          const newBalance = parseFloat((profile.balance + total).toFixed(2));
          await supabase.from("profiles").update({ balance: newBalance }).eq("id", order.user_id);

          const newQty = holding.quantity - qty;
          if (newQty > 0) {
            await supabase.from("holdings").update({ quantity: newQty }).eq("id", holding.id);
          } else {
            await supabase.from("holdings").delete().eq("id", holding.id);
          }

          // Insert transaction record
          await supabase.from("transactions").insert({
            user_id: order.user_id,
            symbol: order.symbol,
            ticker: order.ticker,
            name: order.name,
            type: "SELL",
            quantity: qty,
            price: target,
            total,
          });

          // Mark order as TRIGGERED
          await supabase.from("limit_orders").update({ status: "TRIGGERED" }).eq("id", order.id);
        } else {
          // No holding or insufficient shares — cancel
          await supabase.from("limit_orders").update({ status: "CANCELLED" }).eq("id", order.id);
        }
      }
    }
  } catch (err) {
    console.error("[limit-order-trigger] Execution failed:", err);
  }
}
