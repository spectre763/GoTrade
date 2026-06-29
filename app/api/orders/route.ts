import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/orders — list all limit orders AND active position guards (SL/TP on holdings)
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all limit orders
  const { data: orders, error: ordersError } = await supabase
    .from("limit_orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (ordersError) return NextResponse.json({ error: ordersError.message }, { status: 500 });

  // Fetch holdings that have stop_loss or take_profit set (position guards)
  const { data: holdings, error: holdingsError } = await supabase
    .from("holdings")
    .select("*")
    .eq("user_id", user.id)
    .or("stop_loss.not.is.null,take_profit.not.is.null");

  if (holdingsError) return NextResponse.json({ error: holdingsError.message }, { status: 500 });

  return NextResponse.json({
    orders: orders ?? [],
    positionGuards: holdings ?? [],
  });
}
