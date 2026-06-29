import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PortfolioClient from "@/components/portfolio/PortfolioClient";
import { STOCKS } from "@/lib/mock-market";
import { fetchYahooQuotes } from "@/lib/yahoo-finance";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio",
};

export default async function PortfolioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, holdingsRes] = await Promise.all([
    supabase.from("profiles").select("balance").eq("id", user.id).single(),
    supabase.from("holdings").select("*").eq("user_id", user.id).order("created_at"),
  ]);

  const profile = profileRes.data;
  const holdings = holdingsRes.data ?? [];
  
  const stocksToFetch = holdings.map(h => {
    const stock = STOCKS.find(s => s.symbol === h.symbol);
    return stock || { symbol: h.symbol, ticker: h.ticker, name: h.name, sector: "Other", exchange: "NSE" as const };
  });

  const initialQuotes = stocksToFetch.length > 0 ? await fetchYahooQuotes(stocksToFetch) : [];

  return (
    <PortfolioClient
      initialProfile={profile}
      initialHoldings={holdings}
      initialQuotes={initialQuotes}
    />
  );
}
