"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/formatters";
import {
  ClipboardList,
  Timer,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Trash2,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Zap,
  Link,
} from "lucide-react";

interface LimitOrder {
  id: string;
  symbol: string;
  ticker: string;
  name: string;
  type: "BUY" | "SELL";
  quantity: number;
  target_price: number;
  order_type: "LIMIT" | "STOP_LOSS";
  status: "PENDING" | "TRIGGERED" | "CANCELLED";
  stop_loss?: number | null;
  take_profit?: number | null;
  created_at: string;
}

interface PositionGuard {
  id: string;
  symbol: string;
  ticker: string;
  name: string;
  quantity: number;
  avg_price: number;
  stop_loss?: number | null;
  take_profit?: number | null;
  created_at: string;
}

type StatusTab = "PENDING" | "TRIGGERED" | "CANCELLED";

export default function OrdersPageClient() {
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [positionGuards, setPositionGuards] = useState<PositionGuard[]>([]);
  const [quotes, setQuotes] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<StatusTab>("PENDING");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
        setPositionGuards(data.positionGuards ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Fetch live quotes for all relevant symbols
  useEffect(() => {
    const pendingSymbols = orders
      .filter((o) => o.status === "PENDING")
      .map((o) => o.symbol);
    const guardSymbols = positionGuards.map((g) => g.symbol);
    const symbols = [...new Set([...pendingSymbols, ...guardSymbols])];
    if (symbols.length === 0) return;

    async function fetchQuotes() {
      try {
        const res = await fetch(
          `/api/market/quote?symbols=${encodeURIComponent(symbols.join(","))}`
        );
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, number> = {};
          for (const q of data.quotes ?? []) {
            map[q.symbol] = q.ltp;
          }
          setQuotes(map);
        }
      } catch {
        // silent
      }
    }

    fetchQuotes();
    const interval = setInterval(fetchQuotes, 5000);
    return () => clearInterval(interval);
  }, [orders, positionGuards]);

  async function cancelOrder(id: string) {
    setCancelling(id);
    try {
      await fetch(`/api/trade/limit?id=${id}`, { method: "DELETE" });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "CANCELLED" } : o))
      );
    } finally {
      setCancelling(null);
    }
  }

  const filtered = orders.filter((o) => o.status === activeTab);

  const counts: Record<StatusTab, number> = {
    PENDING: orders.filter((o) => o.status === "PENDING").length,
    TRIGGERED: orders.filter((o) => o.status === "TRIGGERED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
  };

  const tabConfig: Record<
    StatusTab,
    { label: string; icon: React.ReactNode; color: string; activeBg: string }
  > = {
    PENDING: {
      label: "Pending",
      icon: <Clock className="w-3.5 h-3.5" />,
      color: "text-amber-400",
      activeBg: "bg-amber-500/10 border-amber-500/30",
    },
    TRIGGERED: {
      label: "Triggered",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      color: "text-emerald-400",
      activeBg: "bg-emerald-500/10 border-emerald-500/30",
    },
    CANCELLED: {
      label: "Cancelled",
      icon: <XCircle className="w-3.5 h-3.5" />,
      color: "text-zinc-400",
      activeBg: "bg-zinc-500/10 border-zinc-500/30",
    },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-400" />
            Orders
          </h1>
          <p className="text-zinc-500 text-sm">
            Manage your limit orders and active position stop-loss / take-profit guards
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white text-xs font-medium transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Section 1: Position Guards (SL/TP on holdings) ── */}
      {!loading && positionGuards.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Active Position Guards
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25">
              {positionGuards.length} active
            </span>
          </div>
          <p className="text-xs text-zinc-600 mb-4">
            Auto-sell triggers attached to your current holdings. These fire automatically when the live price hits the level you set.
          </p>
          <div className="space-y-3">
            {positionGuards.map((guard) => {
              const ltp = quotes[guard.symbol];
              return (
                <div
                  key={guard.id}
                  className="rounded-2xl border border-orange-500/15 bg-card p-5 transition-all hover:border-orange-500/25"
                >
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{guard.ticker}</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            Position Guard
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{guard.name}</p>
                      </div>
                    </div>
                    {ltp && (
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-zinc-600 mb-0.5">Live Price</div>
                        <div className="font-mono text-sm font-semibold text-white flex items-center gap-1 justify-end">
                          <Zap className="w-3 h-3 text-emerald-500" />
                          {formatCurrency(ltp)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Stop-Loss */}
                    <div className={`rounded-xl p-3 border ${guard.stop_loss ? "border-rose-500/20 bg-rose-500/5" : "border-white/[0.04] bg-white/[0.02]"}`}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <TrendingDown className="w-3 h-3 text-rose-400" />
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                          Stop-Loss
                        </span>
                      </div>
                      {guard.stop_loss ? (
                        <>
                          <div className="font-mono text-sm font-bold text-white">
                            {formatCurrency(guard.stop_loss)}
                          </div>
                          {ltp && (
                            <div className="text-[10px] text-rose-400/70 mt-0.5">
                              {(((ltp - guard.stop_loss) / ltp) * 100).toFixed(1)}% below market
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-zinc-600">Not set</div>
                      )}
                    </div>

                    {/* Take-Profit */}
                    <div className={`rounded-xl p-3 border ${guard.take_profit ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/[0.04] bg-white/[0.02]"}`}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Take-Profit
                        </span>
                      </div>
                      {guard.take_profit ? (
                        <>
                          <div className="font-mono text-sm font-bold text-white">
                            {formatCurrency(guard.take_profit)}
                          </div>
                          {ltp && (
                            <div className="text-[10px] text-emerald-400/70 mt-0.5">
                              {(((guard.take_profit - ltp) / ltp) * 100).toFixed(1)}% above market
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-zinc-600">Not set</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-zinc-600">
                    <span>{guard.quantity} shares · avg {formatCurrency(guard.avg_price)}</span>
                    <a
                      href={`/trade/${encodeURIComponent(guard.ticker)}`}
                      className="text-sky-400 hover:underline"
                    >
                      Edit on Trade page →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section 2: Limit Orders ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Timer className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">Limit Orders</h2>
        </div>

        {/* Status tabs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {(["PENDING", "TRIGGERED", "CANCELLED"] as StatusTab[]).map((tab) => {
            const tc = tabConfig[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  activeTab === tab
                    ? `${tc.activeBg} ${tc.color}`
                    : "border-white/[0.06] bg-card text-zinc-500 hover:border-white/10"
                }`}
              >
                <div className={`flex items-center gap-1.5 mb-2 ${activeTab === tab ? tc.color : "text-zinc-500"}`}>
                  {tc.icon}
                  <span className="text-xs font-semibold uppercase tracking-wider">{tc.label}</span>
                </div>
                <div className={`text-3xl font-bold font-mono ${activeTab === tab ? tc.color : "text-zinc-300"}`}>
                  {counts[tab]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] bg-card h-24 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-card py-16 text-center">
            <Timer className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No {activeTab.toLowerCase()} limit orders</p>
            {activeTab === "PENDING" && (
              <p className="text-zinc-600 text-xs mt-1">
                Go to Trade → select a stock → choose "Limit Order" to place one
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const ltp = quotes[order.symbol];
              const isBuy = order.type === "BUY";
              const distancePct =
                ltp && ltp > 0
                  ? (((order.target_price - ltp) / ltp) * 100).toFixed(1)
                  : null;

              let distanceLabel = "";
              if (distancePct !== null) {
                const num = parseFloat(distancePct);
                distanceLabel =
                  num >= 0 ? `${num}% above market` : `${Math.abs(num)}% below market`;
              }

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-white/[0.06] bg-card p-5 transition-all hover:border-white/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0">
                        <Timer className="w-4 h-4 text-sky-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{order.ticker}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isBuy ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                          }`}>
                            {order.type}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border text-sky-400 border-sky-500/30 bg-sky-500/10">
                            Limit
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{order.name}</p>
                      </div>
                    </div>

                    {order.status === "PENDING" && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        disabled={cancelling === order.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/8 text-rose-400 text-xs font-medium hover:bg-rose-500/15 transition-all disabled:opacity-50 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                        {cancelling === order.id ? "..." : "Cancel"}
                      </button>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-[10px] text-zinc-600 mb-0.5">Quantity</div>
                      <div className="font-mono text-sm font-semibold text-white">{order.quantity}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-600 mb-0.5">Target Price</div>
                      <div className="font-mono text-sm font-semibold text-white">{formatCurrency(order.target_price)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-600 mb-0.5">Total Value</div>
                      <div className="font-mono text-sm font-semibold text-white">{formatCurrency(order.quantity * order.target_price)}</div>
                    </div>
                  </div>

                  {/* Live distance indicator — pending only */}
                  {order.status === "PENDING" && ltp && (
                    <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <Zap className="w-3 h-3 text-emerald-500" />
                          Live:{" "}
                          <span className="font-mono text-zinc-300">{formatCurrency(ltp)}</span>
                        </div>
                        <span className="text-zinc-700">·</span>
                        <span className={`text-[11px] font-medium flex items-center gap-0.5 ${
                          parseFloat(distancePct ?? "0") < 0 ? "text-rose-400" : "text-emerald-400"
                        }`}>
                          {parseFloat(distancePct ?? "0") < 0 ? (
                            <ArrowDownRight className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {distanceLabel}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-600">
                        {Math.abs(parseFloat(distancePct ?? "0")) < 2
                          ? "🎯 Near trigger!"
                          : Math.abs(parseFloat(distancePct ?? "0")) < 5
                          ? "⚡ Approaching"
                          : "Waiting..."}
                      </div>
                    </div>
                  )}

                  {/* Triggered / Cancelled status */}
                  {order.status !== "PENDING" && (
                    <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center gap-2">
                      {order.status === "TRIGGERED" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                      <span className={`text-xs font-medium ${
                        order.status === "TRIGGERED" ? "text-emerald-400" : "text-zinc-500"
                      }`}>
                        {order.status === "TRIGGERED"
                          ? "Order executed successfully"
                          : "Order was cancelled"}
                      </span>
                      <span className="text-zinc-700 text-[10px] ml-auto">
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
