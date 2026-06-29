import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/trade/triggers — update SL/TP on an existing holding
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { holdingId, stopLoss, takeProfit } = body;

  if (!holdingId) {
    return NextResponse.json({ error: "holdingId required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("holdings")
    .update({
      stop_loss: stopLoss ?? null,
      take_profit: takeProfit ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", holdingId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
