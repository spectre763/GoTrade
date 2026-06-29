import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { fetchStockByTicker, getMarketQuote } from "@/lib/yahoo-finance";
import StockHeader from "@/components/trading/StockHeader";
import PriceChart from "@/components/trading/PriceChart";
import OrderForm from "@/components/trading/OrderForm";
import PriceAlertForm from "@/components/trading/PriceAlertForm";
import SymbolNews from "@/components/trading/SymbolNews";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ ticker: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params;
  const decoded = decodeURIComponent(ticker);
  return {
    title: `${decoded} – Trade`,
  };
}

export default async function StockPage({ params }: Props) {
  const { ticker } = await params;
  const decoded = decodeURIComponent(ticker).toUpperCase();

  const stock = await fetchStockByTicker(decoded);
  if (!stock) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, holdingRes, watchlistRes] = await Promise.all([
    supabase.from("profiles").select("balance").eq("id", user.id).single(),
    supabase
      .from("holdings")
      .select("*")
      .eq("user_id", user.id)
      .eq("symbol", stock.symbol)
      .maybeSingle(),
    supabase
      .from("watchlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("symbol", stock.symbol)
      .maybeSingle(),
  ]);

  const profile = profileRes.data;
  const holding = holdingRes.data;
  const isWatched = !!watchlistRes.data;
  const quote = await getMarketQuote(stock.symbol);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Chart + Stock Info + News */}
        <div className="xl:col-span-2 space-y-6">
          <StockHeader
            stock={stock}
            initialQuote={quote}
            initialIsWatched={isWatched}
          />
          <PriceChart symbol={stock.symbol} ticker={stock.ticker} />
          <SymbolNews symbol={stock.symbol} />
        </div>

        {/* Right: Order form */}
        <div className="xl:col-span-1 space-y-6">
          <OrderForm
            stock={stock}
            quote={quote}
            holding={holding ?? undefined}
            availableBalance={profile?.balance ?? 0}
          />
          <PriceAlertForm stock={stock} quote={quote} />
        </div>
      </div>
    </div>
  );
}
