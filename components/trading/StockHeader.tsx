"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatPercent, getPnLColor } from "@/lib/formatters";
import { Stock, Quote } from "@/types/market";
import { ArrowUpRight, ArrowDownRight, Clock, Star } from "lucide-react";

interface StockHeaderProps {
  stock: Stock;
  initialQuote: Quote;
  initialIsWatched: boolean;
}

export default function StockHeader({ stock, initialQuote, initialIsWatched }: StockHeaderProps) {
  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [isWatched, setIsWatched] = useState(initialIsWatched);
  const [togglingWatch, setTogglingWatch] = useState(false);

  async function toggleWatch() {
    if (togglingWatch) return;
    setTogglingWatch(true);
    try {
      if (isWatched) {
        const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(stock.symbol)}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setIsWatched(false);
        }
      } else {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: stock.symbol,
            ticker: stock.ticker,
            name: stock.name,
          }),
        });
        if (res.ok) {
          setIsWatched(true);
        }
      }
    } catch (e: any) {
      console.warn("Failed to toggle watchlist:", e?.message || e);
    } finally {
      setTogglingWatch(false);
    }
  }

  useEffect(() => {
    // Initial fetch to make sure we load the real price quickly on mount
    async function fetchQuote() {
      try {
        const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(stock.symbol)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.quotes && data.quotes[0]) {
            setQuote(data.quotes[0]);
          }
        }
      } catch (err: any) {
        console.warn("Failed to fetch stock quote:", err?.message || err);
      }
    }
    fetchQuote();

    const interval = setInterval(fetchQuote, 5000);
    return () => clearInterval(interval);
  }, [stock.symbol]);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white">{stock.ticker}</h1>
            <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-xs font-medium text-zinc-400 border border-white/[0.08]">
              {stock.exchange}
            </span>
            <button
              onClick={toggleWatch}
              disabled={togglingWatch}
              title={isWatched ? "Remove from Watchlist" : "Add to Watchlist"}
              className={`p-1.5 rounded-xl border transition-all ${
                isWatched
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30"
              }`}
            >
              <Star className={`w-4 h-4 ${isWatched ? "fill-amber-400" : ""}`} />
            </button>
          </div>
          <div className="text-zinc-500 text-sm">{stock.name}</div>
          <div className="flex items-center gap-4 mt-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-zinc-500" /> Market Open
            </div>
            <span>•</span>
            <span>{stock.sector}</span>
          </div>
        </div>

        <div className="md:text-right">
          <div className="text-xs text-zinc-500 mb-1">Last Traded Price</div>
          <div className="flex items-baseline md:justify-end gap-3">
            <span className="text-4xl font-bold font-mono text-white">
              {formatCurrency(quote.ltp)}
            </span>
            <span className={`flex items-center text-lg font-medium ${getPnLColor(quote.changePercent)}`}>
              {quote.changePercent >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              {formatPercent(quote.changePercent, false)}
            </span>
          </div>
          <div className={`text-sm md:text-right font-mono mt-1 ${getPnLColor(quote.change)}`}>
            {quote.change >= 0 ? "+" : ""}{formatCurrency(quote.change)} Today
          </div>
        </div>
      </div>

      {/* Quote stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/[0.06]">
        <div>
          <div className="text-xs text-zinc-500 mb-1">Open</div>
          <div className="font-mono text-white">{formatCurrency(quote.open)}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-1">High</div>
          <div className="font-mono text-white">{formatCurrency(quote.high)}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-1">Low</div>
          <div className="font-mono text-white">{formatCurrency(quote.low)}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-1">Prev Close</div>
          <div className="font-mono text-white">{formatCurrency(quote.close)}</div>
        </div>
      </div>
    </div>
  );
}
