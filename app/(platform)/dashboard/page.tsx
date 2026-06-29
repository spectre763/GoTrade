import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { STOCKS, POPULAR_TICKERS } from "@/lib/mock-market";
import { fetchYahooQuotes } from "@/lib/yahoo-finance";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch all data in parallel
  const [profileRes, holdingsRes, txRes, watchlistRes, limitOrdersRes, alertsRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("holdings").select("*").eq("user_id", user.id).order("created_at"),
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("watchlist").select("*").eq("user_id", user.id),
      supabase
        .from("limit_orders")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "PENDING")
        .order("created_at", { ascending: false }),
      supabase
        .from("price_alerts")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "PENDING")
        .order("created_at", { ascending: false }),
    ]);

  const profile = profileRes.data;
  const holdings = holdingsRes.data ?? [];
  const transactions = txRes.data ?? [];
  const watchlist = watchlistRes.data ?? [];
  const limitOrders = limitOrdersRes.data ?? [];
  const alerts = alertsRes.data ?? [];

  // Build initial quotes using Yahoo Finance
  const holdingsSymbols = holdings.map((h) => h.symbol);
  const moversStocks = POPULAR_TICKERS.map((ticker) =>
    STOCKS.find((s) => s.ticker === ticker)
  ).filter(Boolean) as typeof STOCKS;
  const moversSymbols = moversStocks.map((s) => s.symbol);
  const uniqueSymbols = Array.from(new Set([...holdingsSymbols, ...moversSymbols]));

  const stocksToFetch = uniqueSymbols.map((sym) => {
    const stock = STOCKS.find(s => s.symbol === sym);
    return stock || { symbol: sym, ticker: sym.split(":")[1] || sym, name: sym, sector: "Other", exchange: "NSE" as const };
  });

  const quotes = await fetchYahooQuotes(stocksToFetch);
  const quotesMap = new Map();
  quotes.forEach(q => quotesMap.set(q.symbol, q));

  const initialHoldingsQuotes = holdingsSymbols.map((sym) => quotesMap.get(sym)).filter(Boolean);
  const initialMoversQuotes = moversSymbols.map((sym) => quotesMap.get(sym)).filter(Boolean);

  // Find earliest transaction date for chart
  const firstTx = transactions.length > 0
    ? transactions[transactions.length - 1]
    : null;

  return (
    <DashboardClient
      initialProfile={profile}
      initialHoldings={holdings}
      initialTransactions={transactions}
      initialQuotes={initialHoldingsQuotes}
      initialMoversQuotes={initialMoversQuotes}
      initialWatchlist={watchlist}
      initialLimitOrders={limitOrders}
      initialAlerts={alerts}
      firstTxCreatedAt={firstTx?.created_at ?? null}
    />
  );
}
