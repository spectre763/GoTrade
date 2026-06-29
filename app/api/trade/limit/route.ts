import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/trade/limit — list pending limit orders for user
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: orders, error } = await supabase
    .from("limit_orders")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ orders: orders ?? [] });
}

// POST /api/trade/limit — place a new limit order
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { symbol, ticker, name, type, quantity, targetPrice, stopLoss, takeProfit, orderType } = body;

  if (!symbol || !ticker || !type || !quantity || !targetPrice) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const qty = parseInt(quantity, 10);
  const price = parseFloat(targetPrice);
  const resolvedOrderType = orderType === "STOP_LOSS" ? "STOP_LOSS" : "LIMIT";

  // For BUY limit/stop-loss orders, check balance
  if (type === "BUY") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
      .single();

    const total = qty * price;
    if (!profile || profile.balance < total) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }
  }

  // For STOP_LOSS SELL, verify user actually has the holding
  if (type === "SELL" && resolvedOrderType === "STOP_LOSS") {
    const { data: holding } = await supabase
      .from("holdings")
      .select("quantity")
      .eq("user_id", user.id)
      .eq("symbol", symbol)
      .maybeSingle();

    if (!holding || holding.quantity < qty) {
      return NextResponse.json({ error: "Insufficient shares to place stop-loss" }, { status: 400 });
    }
  }

  const { data: order, error } = await supabase
    .from("limit_orders")
    .insert({
      user_id: user.id,
      symbol,
      ticker,
      name,
      type,
      quantity: qty,
      target_price: price,
      stop_loss: stopLoss ?? null,
      take_profit: takeProfit ?? null,
      order_type: resolvedOrderType,
      status: "PENDING",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, order });
}

// DELETE /api/trade/limit?id= — cancel a limit order
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase
    .from("limit_orders")
    .update({ status: "CANCELLED" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
