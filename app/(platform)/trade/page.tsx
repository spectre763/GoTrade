"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatPercent, getPnLColor } from "@/lib/formatters";
import { searchStocks } from "@/lib/mock-market";
import { Search, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchResult {
  symbol: string;
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
}

export default function TradePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 200);

  // Search stocks client-side
  useEffect(() => {
    const found = searchStocks(debouncedQuery);
    const limited = found.slice(0, 24);
    setResults(limited);

    // Quotes will be fetched by fetchLiveQuotes
  }, [debouncedQuery]);

  // Fetch live quotes from API
  const fetchLiveQuotes = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return;
    try {
      const res = await fetch(
        `/api/market/quote?symbols=${encodeURIComponent(symbols.join(","))}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.quotes) {
          const newQuotes: Record<string, any> = {};
          data.quotes.forEach((q: any) => { newQuotes[q.symbol] = q; });
          setQuotes(newQuotes);
        }
      }
    } catch {
      // API error handling can go here
    }
  }, []);

  useEffect(() => {
    const symbols = results.map((r) => r.symbol);
    fetchLiveQuotes(symbols);
    const interval = setInterval(() => fetchLiveQuotes(symbols), 5000);
    return () => clearInterval(interval);
  }, [results, fetchLiveQuotes]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Markets</h1>
        <p className="text-zinc-500 text-sm">Search and trade NSE &amp; BSE stocks</p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          id="stock-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ticker or company name…"
          autoComplete="off"
          className="w-full rounded-2xl border border-white/[0.08] bg-[#18181b] pl-11 pr-5 py-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {results.map((stock) => {
          const q = quotes[stock.symbol];
          const isPos = q ? q.changePercent >= 0 : true;
          return (
            <Link
              key={stock.symbol}
              href={`/trade/${encodeURIComponent(stock.ticker)}`}
              className="group rounded-2xl border border-white/[0.06] bg-[#18181b]/80 p-5 hover:border-emerald-500/30 hover:bg-[#18181b] transition-all duration-200 shadow-card"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                    {stock.ticker}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5 line-clamp-1 max-w-[160px]">
                    {stock.name}
                  </div>
                </div>
                <span className="text-[10px] font-medium text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-md">
                  {stock.exchange}
                </span>
              </div>

              {q ? (
                <div className="flex items-end justify-between">
                  <div className="font-mono font-semibold text-white text-base">
                    {formatCurrency(q.ltp)}
                  </div>
                  <div className={`flex items-center gap-0.5 text-sm font-mono font-medium ${getPnLColor(q.changePercent)}`}>
                    {isPos
                      ? <ArrowUpRight className="w-3.5 h-3.5" />
                      : <ArrowDownRight className="w-3.5 h-3.5" />
                    }
                    {formatPercent(q.changePercent, false)}
                  </div>
                </div>
              ) : (
                <div className="h-6 bg-zinc-800 rounded animate-pulse w-24" />
              )}

              <div className="text-[10px] text-zinc-600 mt-2">{stock.sector}</div>
            </Link>
          );
        })}

        {results.length === 0 && query.length > 0 && (
          <div className="col-span-full py-16 text-center text-zinc-600 text-sm">
            No stocks found for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
