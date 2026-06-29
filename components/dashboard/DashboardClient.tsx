"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatPercent, getPnLColor, formatDateTime } from "@/lib/formatters";
import { STOCKS, POPULAR_TICKERS } from "@/lib/mock-market";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Clock,
  Star,
  Trash2,
  XCircle,
  Sparkles,
  Bell,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import NetWorthChart from "./NetWorthChart";

interface DashboardClientProps {
  initialProfile: any;
  initialHoldings: any[];
  initialTransactions: any[];
  initialQuotes: any[];
  initialMoversQuotes: any[];
  initialWatchlist: any[];
  initialLimitOrders: any[];
  initialAlerts: any[];
  firstTxCreatedAt?: string | null;
}

export default function DashboardClient({
  initialProfile,
  initialHoldings,
  initialTransactions,
  initialQuotes,
  initialMoversQuotes,
  initialWatchlist,
  initialLimitOrders,
  initialAlerts,
  firstTxCreatedAt = null,
}: DashboardClientProps) {
  const [quotes, setQuotes] = useState<any[]>(initialQuotes);
  const [moversQuotes, setMoversQuotes] = useState<any[]>(initialMoversQuotes);
  const [watchlist, setWatchlist] = useState<any[]>(initialWatchlist);
  const [limitOrders, setLimitOrders] = useState<any[]>(initialLimitOrders);
  const [priceAlerts, setPriceAlerts] = useState<any[]>(initialAlerts);
  const [activeTriggerTab, setActiveTriggerTab] = useState<"LIMIT" | "ALERT">("LIMIT");

  async function cancelPriceAlert(id: string) {
    try {
      const res = await fetch(`/api/alerts?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPriceAlerts((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (e) {
      console.error("Failed to cancel price alert:", e);
    }
  }

  async function cancelLimitOrder(id: string) {
    try {
      const res = await fetch(`/api/trade/limit?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setLimitOrders((prev) => prev.filter((o) => o.id !== id));
      }
    } catch (e) {
      console.error("Failed to cancel limit order:", e);
    }
  }

  useEffect(() => {
    async function fetchAllQuotes() {
      try {
        const holdingsSymbols = initialHoldings.map((h) => h.symbol);
        const moversStocks = POPULAR_TICKERS.map(ticker => STOCKS.find(s => s.ticker === ticker)).filter((s): s is typeof STOCKS[0] => !!s);
        const moversSymbols = moversStocks.map((s) => s.symbol);
        const uniqueSymbols = Array.from(new Set([...holdingsSymbols, ...moversSymbols]));

        if (uniqueSymbols.length > 0) {
          const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(uniqueSymbols.join(","))}`);
          if (res.ok) {
            const data = await res.json();
            if (data.quotes) {
              const quoteMap = new Map<string, any>();
              data.quotes.forEach((q: any) => quoteMap.set(q.symbol, q));

              const newHoldingsQuotes = initialHoldings.map((h) => quoteMap.get(h.symbol)).filter(Boolean);
              const newMoversQuotes = moversStocks.map((s) => quoteMap.get(s.symbol)).filter(Boolean);

              if (newHoldingsQuotes.length > 0) setQuotes(newHoldingsQuotes);
              if (newMoversQuotes.length > 0) setMoversQuotes(newMoversQuotes);
            }
          }
        }

        // Fetch latest watchlist
        const watchRes = await fetch("/api/watchlist");
        if (watchRes.ok) {
          const wData = await watchRes.json();
          setWatchlist(wData.watchlist || []);
        }

        // Fetch latest pending limit orders
        const limitRes = await fetch("/api/trade/limit");
        if (limitRes.ok) {
          const lData = await limitRes.json();
          setLimitOrders(lData.orders || []);
        }

        // Fetch latest price alerts
        const alertsRes = await fetch("/api/alerts");
        if (alertsRes.ok) {
          const aData = await alertsRes.json();
          setPriceAlerts(aData.alerts || []);
        }
      } catch (err: any) {
        console.warn("Failed to fetch live dashboard quotes:", err?.message || err);
      }
    }

    const interval = setInterval(fetchAllQuotes, 5000);
    return () => clearInterval(interval);
  }, [initialHoldings]);

  // Map quotes for holdings
  const quoteMap = new Map<string, any>();
  quotes.forEach((q) => quoteMap.set(q.symbol, q));

  // Compute portfolio value using live quotes
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
      pnl: currentValue - invested,
      pnlPct: invested > 0 ? ((currentValue - invested) / invested) * 100 : 0,
      change: quote.changePercent,
    };
  });

  const totalPnl = portfolioValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const netWorth = (initialProfile?.balance ?? 0) + portfolioValue;

  // Market movers
  const moversStocks = POPULAR_TICKERS.map(ticker => STOCKS.find(s => s.ticker === ticker)).filter((s): s is typeof STOCKS[0] => !!s);
  const moversQuoteMap = new Map<string, any>();
  moversQuotes.forEach((q) => moversQuoteMap.set(q.symbol, q));

  const movers = moversStocks.map((s) => {
    const q = moversQuoteMap.get(s.symbol) ?? { ltp: 0, changePercent: 0 };
    return { ticker: s.ticker, name: s.name, ltp: q.ltp, changePercent: q.changePercent };
  }).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 6);

  // Asset allocation percentages for Wealth Card
  const cashBalance = initialProfile?.balance ?? 0;
  const totalAssets = cashBalance + portfolioValue;
  const cashPct = totalAssets > 0 ? (cashBalance / totalAssets) * 100 : 100;
  const stockPct = totalAssets > 0 ? (portfolioValue / totalAssets) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {getGreeting()},{" "}
            <span className="gradient-text">{initialProfile?.full_name?.split(" ")[0] ?? "Trader"}</span> 👋
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Here's your portfolio overview</p>
        </div>
        <Link
          href="/trade"
          className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-2.5 text-sm transition-all shadow-glow-sm hover:shadow-glow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Trade
        </Link>
      </div>

      {/* Row 1: Chart & Account Wealth Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart (2/3 width) */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.05] bg-gradient-to-b from-[#18181b]/70 to-[#09090b]/90 p-6 shadow-card backdrop-blur-md hover:border-white/[0.1] transition-all duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Net Worth Performance
                </h3>
                <p className="text-zinc-500 text-xs mt-0.5">Historical net worth summary</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {formatCurrency(netWorth)}
                </div>
                <div className={`text-xs font-mono font-medium ${getPnLColor(totalPnl)}`}>
                  {totalPnl >= 0 ? "+" : ""}{formatPercent(totalPnlPct)}
                </div>
              </div>
            </div>
            <NetWorthChart 
              currentNetWorth={netWorth} 
              portfolioValue={portfolioValue} 
              isNewUser={initialTransactions.length === 0} 
              firstTxCreatedAt={firstTxCreatedAt}
            />
          </div>
        </div>

        {/* Account Wealth Card (1/3 width) */}
        <div className="rounded-2xl border border-white/[0.05] bg-gradient-to-b from-[#18181b]/70 to-[#09090b]/90 p-6 shadow-card backdrop-blur-md hover:border-white/[0.1] transition-all duration-300">
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-white flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Account Summary
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">Live assets & returns breakdown</p>
            </div>

            <div className="py-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Net Worth</span>
              <div className="text-3xl font-bold font-mono text-white mt-1">
                {formatCurrency(netWorth)}
              </div>
            </div>

            {/* Asset Allocation Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-500 font-medium">
                <span>Asset Allocation</span>
                <span className="font-mono text-zinc-400">
                  {cashPct.toFixed(0)}% Cash / {stockPct.toFixed(0)}% Stocks
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden flex">
                <div 
                  className="bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${cashPct}%` }} 
                  title={`Cash: ${cashPct.toFixed(1)}%`}
                />
                <div 
                  className="bg-violet-500 transition-all duration-500" 
                  style={{ width: `${stockPct}%` }} 
                  title={`Stocks: ${stockPct.toFixed(1)}%`}
                />
              </div>
            </div>

            {/* Breakdown details */}
            <div className="space-y-3 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-zinc-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Available Cash</span>
                </div>
                <span className="font-semibold font-mono text-white">{formatCurrency(cashBalance)}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-zinc-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                  <span>Stock Investments</span>
                </div>
                <span className="font-semibold font-mono text-white">{formatCurrency(portfolioValue)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-zinc-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                  <span>Total Invested</span>
                </div>
                <span className="font-semibold font-mono text-zinc-300">{formatCurrency(totalInvested)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-zinc-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>All-Time P&L</span>
                </div>
                <div className={`font-semibold font-mono flex items-center gap-0.5 ${getPnLColor(totalPnl)}`}>
                  {totalPnl >= 0 ? "+" : ""}{formatCurrency(totalPnl)}
                  <span className="text-xs font-normal opacity-85 ml-1">({formatPercent(totalPnlPct)})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Holdings & Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings (Left 2/3) */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.05] bg-gradient-to-b from-[#18181b]/70 to-[#09090b]/90 overflow-hidden shadow-card hover:border-white/[0.08] transition-all duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h2 className="font-semibold text-white flex items-center gap-1.5">
              <BarChart3 className="w-4.5 h-4.5 text-violet-400" />
              Holdings
            </h2>
            <Link href="/portfolio" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              View all →
            </Link>
          </div>
          {holdingsWithLtp.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <TrendingUp className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No holdings yet</p>
              <Link href="/trade" className="text-emerald-400 text-sm hover:underline mt-2 inline-block">
                Start trading →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Stock</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">LTP</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Change</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Value</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingsWithLtp.slice(0, 6).map((h) => (
                    <tr key={h.id} className="border-b border-white/[0.04] table-row-hover transition-all duration-200">
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-white">{h.ticker}</div>
                        <div className="text-xs text-zinc-500">{h.quantity} shares</div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-white">
                        {formatCurrency(h.ltp)}
                      </td>
                      <td className={`px-4 py-3.5 text-right font-mono text-sm ${getPnLColor(h.change)}`}>
                        {formatPercent(h.change)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-white text-sm">
                        {formatCurrency(h.currentValue)}
                      </td>
                      <td className={`px-6 py-3.5 text-right font-mono text-sm ${getPnLColor(h.pnl)}`}>
                        <div className="font-semibold">{h.pnl >= 0 ? "+" : ""}{formatCurrency(h.pnl)}</div>
                        <div className="text-xs opacity-80">{formatPercent(h.pnlPct)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Watchlist (Right 1/3) */}
        <div className="rounded-2xl border border-white/[0.05] bg-gradient-to-b from-[#18181b]/70 to-[#09090b]/90 overflow-hidden shadow-card hover:border-white/[0.08] transition-all duration-300">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4.5 h-4.5 text-amber-400 fill-amber-400" />
              <h2 className="font-semibold text-white">Watchlist</h2>
            </div>
            <Link href="/trade" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              Add Stock
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04] max-h-[350px] overflow-y-auto">
            {watchlist.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-zinc-600">
                Your watchlist is empty. Tap the star icon on any stock page to add it here.
              </div>
            ) : (
              watchlist.map((item) => {
                const isPos = (item.changePercent ?? 0) >= 0;
                return (
                  <Link
                    key={item.id}
                    href={`/trade/${encodeURIComponent(item.ticker)}`}
                    className={`relative flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.015] transition-all duration-200 border-l-3 border-transparent ${
                      isPos ? "hover:border-emerald-500/50" : "hover:border-rose-500/50"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">{item.ticker}</div>
                      <div className="text-xs text-zinc-500 truncate max-w-[120px]">{item.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-white">
                        {item.ltp ? formatCurrency(item.ltp) : "—"}
                      </div>
                      {item.changePercent != null && (
                        <div className={`text-xs font-mono font-medium flex items-center gap-0.5 justify-end ${getPnLColor(item.changePercent)}`}>
                          {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {formatPercent(item.changePercent)}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Pending Triggers & Market Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Triggers Tabbed Widget (Left 2/3) */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.05] bg-gradient-to-b from-[#18181b]/70 to-[#09090b]/90 overflow-hidden shadow-card hover:border-white/[0.08] transition-all duration-300">
          <div className="flex border-b border-white/[0.06] bg-surface/30">
            <button
              type="button"
              onClick={() => setActiveTriggerTab("LIMIT")}
              className={`flex-grow flex items-center justify-center gap-2 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                activeTriggerTab === "LIMIT"
                  ? "text-emerald-400 border-emerald-400 bg-emerald-400/5"
                  : "text-zinc-500 hover:text-zinc-300 border-transparent"
              }`}
            >
              <Clock className="w-4 h-4" />
              Pending Limit Orders
              <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400 font-mono font-medium ml-1">
                {limitOrders.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTriggerTab("ALERT")}
              className={`flex-grow flex items-center justify-center gap-2 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                activeTriggerTab === "ALERT"
                  ? "text-emerald-400 border-emerald-400 bg-emerald-400/5"
                  : "text-zinc-500 hover:text-zinc-300 border-transparent"
              }`}
            >
              <Bell className="w-4 h-4" />
              Active Price Alerts
              <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400 font-mono font-medium ml-1">
                {priceAlerts.filter((a) => a.status === "PENDING").length}
              </span>
            </button>
          </div>

          <div className="p-1">
            {activeTriggerTab === "LIMIT" ? (
              limitOrders.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-sm">
                  <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-2 animate-pulse" />
                  No pending limit orders
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.05]">
                        <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Stock</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Type</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Qty</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Target Price</th>
                        <th className="text-center px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-20">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {limitOrders.map((o) => (
                        <tr key={o.id} className="border-b border-white/[0.04] table-row-hover transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-white">
                            {o.ticker}
                            <div className="text-xs text-zinc-500 truncate max-w-[150px] font-normal">{o.name}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold border uppercase tracking-wider ${
                              o.type === "BUY"
                                ? "bg-emerald-500/8 text-emerald-400 border-emerald-500/15"
                                : "bg-rose-500/8 text-rose-400 border-rose-500/15"
                            }`}>
                              {o.type}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-zinc-300">{o.quantity}</td>
                          <td className="px-4 py-3.5 text-right font-mono text-white font-medium">{formatCurrency(o.target_price)}</td>
                          <td className="px-5 py-3.5 text-center">
                            <button
                              onClick={() => cancelLimitOrder(o.id)}
                              title="Cancel Limit Order"
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors border border-rose-500/20"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              priceAlerts.filter((a) => a.status === "PENDING").length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-sm">
                  <Bell className="w-8 h-8 text-zinc-700 mx-auto mb-2 animate-pulse" />
                  No active price alerts
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.05]">
                        <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Stock</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Condition</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Trigger Price</th>
                        <th className="text-center px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-20">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceAlerts.filter((a) => a.status === "PENDING").map((alert) => (
                        <tr key={alert.id} className="border-b border-white/[0.04] table-row-hover transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-white">
                            {alert.ticker}
                            <div className="text-xs text-zinc-500 truncate max-w-[150px] font-normal">{alert.name}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-0.5 rounded px-2.5 py-0.5 text-xs font-bold border ${
                              alert.condition === "ABOVE"
                                ? "bg-emerald-500/8 text-emerald-400 border-emerald-500/15"
                                : "bg-rose-500/8 text-rose-400 border-rose-500/15"
                            }`}>
                              {alert.condition === "ABOVE" ? <ArrowUp className="w-3 h-3 animate-bounce" /> : <ArrowDown className="w-3 h-3 animate-bounce" />}
                              {alert.condition}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-white font-medium">{formatCurrency(alert.target_price)}</td>
                          <td className="px-5 py-3.5 text-center">
                            <button
                              onClick={() => cancelPriceAlert(alert.id)}
                              title="Cancel Alert"
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors border border-rose-500/20"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>

        {/* Market Movers (Right 1/3) */}
        <div className="rounded-2xl border border-white/[0.05] bg-gradient-to-b from-[#18181b]/70 to-[#09090b]/90 overflow-hidden shadow-card hover:border-white/[0.08] transition-all duration-300">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-400" />
            <h2 className="font-semibold text-white">Market Movers</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {movers.map((m) => {
              const isPos = m.changePercent >= 0;
              return (
                <Link
                  key={m.ticker}
                  href={`/trade/${encodeURIComponent(m.ticker)}`}
                  className={`relative flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.015] transition-all duration-200 border-l-3 border-transparent ${
                    isPos ? "hover:border-emerald-500/50" : "hover:border-rose-500/50"
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-white">{m.ticker}</div>
                    <div className="text-xs text-zinc-500 truncate max-w-[100px]">{m.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-white">{formatCurrency(m.ltp)}</div>
                    <div className={`text-xs font-mono font-medium flex items-center gap-0.5 justify-end ${getPnLColor(m.changePercent)}`}>
                      {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {formatPercent(m.changePercent)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 4: Recent Transactions (Full Width) */}
      {initialTransactions.length > 0 && (
        <div className="rounded-2xl border border-white/[0.05] bg-gradient-to-b from-[#18181b]/70 to-[#09090b]/90 overflow-hidden shadow-card hover:border-white/[0.08] transition-all duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500" />
              <h2 className="font-semibold text-white">Recent Transactions</h2>
            </div>
            <Link href="/transactions" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Type</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Qty</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Price</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Total</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {initialTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/[0.04] table-row-hover transition-all duration-200">
                    <td className="px-6 py-3">
                      <div className="font-semibold text-white">{tx.ticker}</div>
                      <div className="text-xs text-zinc-500 truncate max-w-[120px]">{tx.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold border uppercase tracking-wider ${
                        tx.type === "BUY"
                          ? "bg-emerald-500/8 text-emerald-400 border-emerald-500/15"
                          : "bg-rose-500/8 text-rose-400 border-rose-500/15"
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-300">{tx.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-300">{formatCurrency(tx.price)}</td>
                    <td className="px-6 py-3 text-right font-mono text-white font-medium">{formatCurrency(tx.total)}</td>
                    <td className="px-6 py-3 text-right text-xs text-zinc-500">{formatDateTime(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
