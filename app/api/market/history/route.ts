import { NextRequest, NextResponse } from "next/server";
import { fetchYahooHistory } from "@/lib/yahoo-finance";
import type { ChartInterval } from "@/types/market";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";
  const interval = (searchParams.get("interval") ?? "1day") as ChartInterval;
  const days = parseInt(searchParams.get("days") ?? "90", 10);

  if (!symbol.trim()) {
    return NextResponse.json({ error: "symbol parameter required" }, { status: 400 });
  }

  try {
    const candles = await fetchYahooHistory(symbol, interval, days);
    return NextResponse.json({ candles });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
