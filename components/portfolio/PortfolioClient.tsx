"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatPercent, getPnLColor } from "@/lib/formatters";
import { STOCKS } from "@/lib/mock-market";
import Link from "next/link";
import { PieChart, TrendingUp } from "lucide-react";
import AllocationChart from "./AllocationChart";
import SectorAllocationChart from "./SectorAllocationChart";

interface PortfolioClientProps {
  initialProfile: { balance: number } | null;
  initialHoldings: any[];
  initialQuotes: any[];
}

export default function PortfolioClient({
  initialProfile,
  initialHoldings,
  initialQuotes,
}: PortfolioClientProps) {
  const [quotes, setQuotes] = useState<any[]>(initialQuotes);
  const [chartType, setChartType] = useState<"ASSET" | "SECTOR">("ASSET");

  useEffect(() => {
    if (initialHoldings.length === 0) return;

    async function fetchQuotes() {
      try {
        const symbolsParam = initialHoldings.map((h) => h.symbol).join(",");
        const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(symbolsParam)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.quotes) {
            setQuotes(data.quotes);
          }
        }
      } catch (err: any) {
        console.warn("Failed to fetch live portfolio quotes:", err?.message || err);
      }
    }

    // Poll every 5 seconds
    const interval = setInterval(fetchQuotes, 5000);
    return () => clearInterval(interval);
  }, [initialHoldings]);

  const quoteMap = new Map<string, any>();
  quotes.forEach((q) => quoteMap.set(q.symbol, q));

  let portfolioValue = 0;
  let totalInvested = 0;
  const holdingsWithLtp = initialHoldings.map((h) => {
    const quote = quoteMap.get(h.symbol) ?? { ltp: h.avg_price, changePercent: 0 };
    const currentValue = quote.ltp * h.quantity;
    const invested = h.avg_price * h.quantity;
    portfolioValue += currentValue;
    totalInvested += invested;
    return {
      ...h,
      ltp: quote.ltp,
      currentValue,
      invested,
      pnl: currentValue - invested,
      pnlPct: invested > 0 ? ((currentValue - invested) / invested) * 100 : 0,
      weight: 0, // Calculated below
    };
  });

  // Calculate portfolio weights
  if (portfolioValue > 0) {
    holdingsWithLtp.forEach((h) => {
      h.weight = (h.currentValue / portfolioValue) * 100;
    });
  }

  // Sort by weight descending
  holdingsWithLtp.sort((a, b) => b.weight - a.weight);

  const totalPnl = portfolioValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  // Calculate sector exposure allocations
  const sectorValueMap = new Map<string, number>();
  holdingsWithLtp.forEach((h) => {
    const stockInfo = STOCKS.find((s) => s.symbol === h.symbol || s.ticker === h.ticker);
    const sectorName = stockInfo?.sector || "Other";
    const currentValue = sectorValueMap.get(sectorName) ?? 0;
    sectorValueMap.set(sectorName, currentValue + h.currentValue);
  });

  const sectorsWithWeights = Array.from(sectorValueMap.entries()).map(([sector, value]) => {
    const weight = portfolioValue > 0 ? (value / portfolioValue) * 100 : 0;
    return { sector, weight };
  });

  // Sort sectors by weight descending
  sectorsWithWeights.sort((a, b) => b.weight - a.weight);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Portfolio</h1>
        <p className="text-zinc-500 text-sm">Track and analyze your holdings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.07] bg-card p-6 shadow-card">
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
            <PieChart className="w-4 h-4" /> Current Value
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            {formatCurrency(portfolioValue)}
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-card p-6 shadow-card">
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
            <TrendingUp className="w-4 h-4" /> Total Invested
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            {formatCurrency(totalInvested)}
          </div>
        </div>
        <div className={`rounded-2xl border ${totalPnl >= 0 ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"} p-6 shadow-card`}>
          <div className={`text-sm mb-2 ${totalPnl >= 0 ? "text-emerald-400/80" : "text-rose-400/80"}`}>
            Unrealized P&L
          </div>
          <div className={`text-3xl font-bold font-mono flex items-baseline gap-3 ${getPnLColor(totalPnl)}`}>
            {totalPnl >= 0 ? "+" : ""}{formatCurrency(totalPnl)}
            <span className="text-lg">
              ({totalPnl >= 0 ? "+" : ""}{formatPercent(totalPnlPct, false)})
            </span>
          </div>
        </div>
      </div>

      {/* Allocation Charts Switcher */}
      {holdingsWithLtp.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Portfolio Allocation</h3>
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-surface p-1">
              <button
                onClick={() => setChartType("ASSET")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  chartType === "ASSET"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                By Asset
              </button>
              <button
                onClick={() => setChartType("SECTOR")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  chartType === "SECTOR"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                By Sector
              </button>
            </div>
          </div>
          {chartType === "ASSET" ? (
            <AllocationChart holdings={holdingsWithLtp} />
          ) : (
            <SectorAllocationChart sectors={sectorsWithWeights} />
          )}
        </div>
      )}

      {/* Holdings Table */}
      <div className="rounded-2xl border border-white/[0.07] bg-card overflow-hidden">
        {holdingsWithLtp.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-surface border border-white/[0.05] flex items-center justify-center mx-auto mb-4">
              <PieChart className="w-6 h-6 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Your portfolio is empty</h3>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-6">
              You have {formatCurrency(initialProfile?.balance ?? 0)} in available cash. 
              Start trading to build your portfolio.
            </p>
            <Link href="/trade" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 transition-colors shadow-glow-sm">
              Explore Markets
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.05] bg-surface/50">
                  <th className="text-left px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Asset</th>
                  <th className="text-right px-4 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Qty</th>
                  <th className="text-right px-4 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Avg Price</th>
                  <th className="text-right px-4 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">LTP</th>
                  <th className="text-right px-4 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Invested</th>
                  <th className="text-right px-4 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Current</th>
                  <th className="text-right px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {holdingsWithLtp.map((h) => (
                  <tr key={h.id} className="table-row-hover transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/trade/${encodeURIComponent(h.ticker)}`} className="group flex flex-col">
                        <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">{h.ticker}</span>
                        <span className="text-xs text-zinc-500">{formatPercent(h.weight, false)} weight</span>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-zinc-300">{h.quantity}</td>
                    <td className="px-4 py-4 text-right font-mono text-zinc-300">{formatCurrency(h.avg_price)}</td>
                    <td className="px-4 py-4 text-right font-mono text-white">{formatCurrency(h.ltp)}</td>
                    <td className="px-4 py-4 text-right font-mono text-zinc-400">{formatCurrency(h.invested)}</td>
                    <td className="px-4 py-4 text-right font-mono text-white font-medium">{formatCurrency(h.currentValue)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-mono font-medium ${getPnLColor(h.pnl)}`}>
                        {h.pnl >= 0 ? "+" : ""}{formatCurrency(h.pnl)}
                      </div>
                      <div className={`text-xs font-mono mt-0.5 ${getPnLColor(h.pnlPct)}`}>
                        {formatPercent(h.pnlPct)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
