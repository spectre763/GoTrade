import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMarketQuote } from "@/lib/yahoo-finance";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { symbol, ticker, name, quantity, price, stopLoss, takeProfit } = body;

  if (!symbol || !ticker || !quantity || !price) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const qty = parseInt(quantity, 10);
  const quote = await getMarketQuote(symbol);
  const ltp = quote.ltp;
  const total = qty * ltp;

  // Fetch profile for balance check
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.balance < total) {
    return NextResponse.json(
      { error: `Insufficient balance. Need ₹${total.toFixed(2)}, have ₹${profile.balance.toFixed(2)}` },
      { status: 400 }
    );
  }

  // Check existing holding
  const { data: existingHolding } = await supabase
    .from("holdings")
    .select("*")
    .eq("user_id", user.id)
    .eq("symbol", symbol)
    .maybeSingle();

  // Update or create holding
  if (existingHolding) {
    const newQty = existingHolding.quantity + qty;
    const newAvgPrice =
      (existingHolding.avg_price * existingHolding.quantity + ltp * qty) / newQty;

    const updateData: any = {
      quantity: newQty,
      avg_price: parseFloat(newAvgPrice.toFixed(2)),
      updated_at: new Date().toISOString(),
    };
    // Only update SL/TP if provided
    if (stopLoss !== undefined && stopLoss !== null) updateData.stop_loss = stopLoss;
    if (takeProfit !== undefined && takeProfit !== null) updateData.take_profit = takeProfit;

    const { error: updateError } = await supabase
      .from("holdings")
      .update(updateData)
      .eq("id", existingHolding.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    const { error: insertError } = await supabase.from("holdings").insert({
      user_id: user.id,
      symbol,
      ticker,
      name,
      quantity: qty,
      avg_price: ltp,
      stop_loss: stopLoss ?? null,
      take_profit: takeProfit ?? null,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  // Deduct balance
  const { error: balanceError } = await supabase
    .from("profiles")
    .update({ balance: parseFloat((profile.balance - total).toFixed(2)) })
    .eq("id", user.id);

  if (balanceError) {
    return NextResponse.json({ error: balanceError.message }, { status: 500 });
  }

  // Record transaction
  await supabase.from("transactions").insert({
    user_id: user.id,
    symbol,
    ticker,
    name,
    type: "BUY",
    quantity: qty,
    price: ltp,
    total: parseFloat(total.toFixed(2)),
  });

  return NextResponse.json({ success: true, total });
}
