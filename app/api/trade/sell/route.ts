import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMarketQuote } from "@/lib/yahoo-finance";
import { getStockByTicker } from "@/lib/mock-market";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { symbol, ticker, name, quantity, price } = body;

  if (!symbol || !ticker || !quantity || !price) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const qty = parseInt(quantity, 10);
  const quote = await getMarketQuote(symbol);
  const total = quote.ltp * qty;

  // Fetch the holding
  const { data: holding } = await supabase
    .from("holdings")
    .select("*")
    .eq("user_id", user.id)
    .eq("symbol", symbol)
    .maybeSingle();

  if (!holding || holding.quantity < qty) {
    return NextResponse.json(
      {
        error: `Insufficient shares. You have ${holding?.quantity ?? 0}, trying to sell ${qty}`,
      },
      { status: 400 }
    );
  }

  const remainingQty = holding.quantity - qty;

  if (remainingQty === 0) {
    // Delete the holding entirely
    const { error: deleteError } = await supabase
      .from("holdings")
      .delete()
      .eq("id", holding.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  } else {
    // Update remaining quantity (keep avg_price unchanged on partial sell)
    const { error: updateError } = await supabase
      .from("holdings")
      .update({
        quantity: remainingQty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", holding.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  // Add proceeds to balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (profile) {
    await supabase
      .from("profiles")
      .update({ balance: parseFloat(((profile.balance ?? 0) + total).toFixed(2)) })
      .eq("id", user.id);
  }

  // Record transaction
  await supabase.from("transactions").insert({
    user_id: user.id,
    symbol,
    ticker,
    name,
    type: "SELL",
    quantity: qty,
    price: quote.ltp,
    total: parseFloat(total.toFixed(2)),
  });

  return NextResponse.json({ success: true, total });
}
