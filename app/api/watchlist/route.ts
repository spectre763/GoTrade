import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchYahooQuotes } from "@/lib/yahoo-finance";

// GET /api/watchlist
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: watchlist, error } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const wl = watchlist ?? [];
  if (wl.length === 0) return NextResponse.json({ watchlist: [] });

  const stocksToFetch = wl.map(item => ({
    symbol: item.symbol,
    ticker: item.ticker,
    name: item.name,
    sector: "Other"
  }));

  try {
    const quotes = await fetchYahooQuotes(stocksToFetch);
    const withQuotes = wl.map((item, i) => {
      const q = quotes[i];
      return { ...item, ltp: q.ltp, changePercent: q.changePercent };
    });
    return NextResponse.json({ watchlist: withQuotes });
  } catch (err) {
    return NextResponse.json({ watchlist: wl }); // fallback gracefully
  }
}

// POST /api/watchlist — add stock to watchlist
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { symbol, ticker, name } = body;

  if (!symbol || !ticker) {
    return NextResponse.json({ error: "symbol and ticker required" }, { status: 400 });
  }

  // Upsert to avoid duplicates
  const { error } = await supabase.from("watchlist").upsert(
    { user_id: user.id, symbol, ticker, name },
    { onConflict: "user_id,symbol" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// DELETE /api/watchlist?symbol= — remove from watchlist
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", user.id)
    .eq("symbol", symbol);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
