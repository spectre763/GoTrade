"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatPercent, getPnLColor } from "@/lib/formatters";
import { Stock, Quote } from "@/types/market";
import { Holding } from "@/types/portfolio";
import {
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  CheckCircle2,
  Timer,
} from "lucide-react";
import { useRouter } from "next/navigation";

type OrderType = "MARKET" | "LIMIT";

interface OrderFormProps {
  stock: Stock;
  quote: Quote;
  holding?: Holding;
  availableBalance: number;
  onSuccess?: () => void;
}

export default function OrderForm({
  stock,
  quote: initialQuote,
  holding,
  availableBalance,
  onSuccess,
}: OrderFormProps) {
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [quantity, setQuantity] = useState<number | "">("");
  const [targetPrice, setTargetPrice] = useState<number | "">(initialQuote.ltp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [quote, setQuote] = useState<Quote>(initialQuote);
  const router = useRouter();

  // SL/TP states — attached to buy orders
  const [advancedEnabled, setAdvancedEnabled] = useState(false);
  const [stopLoss, setStopLoss] = useState<number | "">("");
  const [takeProfit, setTakeProfit] = useState<number | "">("");

  // Managing active position triggers
  const [editStopLoss, setEditStopLoss] = useState<number | "">("");
  const [editTakeProfit, setEditTakeProfit] = useState<number | "">("");
  const [triggerMessage, setTriggerMessage] = useState("");
  const [updatingTriggers, setUpdatingTriggers] = useState(false);

  useEffect(() => {
    if (holding) {
      setEditStopLoss(holding.stop_loss ?? "");
      setEditTakeProfit(holding.take_profit ?? "");
    } else {
      setEditStopLoss("");
      setEditTakeProfit("");
    }
  }, [holding]);

  async function handleUpdateTriggers(e: React.FormEvent) {
    e.preventDefault();
    if (!holding) return;
    setUpdatingTriggers(true);
    setTriggerMessage("");
    try {
      const res = await fetch("/api/trade/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdingId: holding.id,
          stopLoss: editStopLoss === "" ? null : editStopLoss,
          takeProfit: editTakeProfit === "" ? null : editTakeProfit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update triggers");
      setTriggerMessage("Triggers updated successfully!");
      setTimeout(() => setTriggerMessage(""), 4000);
      router.refresh();
    } catch (err: any) {
      setTriggerMessage(err.message || "Failed to update triggers");
    } finally {
      setUpdatingTriggers(false);
    }
  }

  useEffect(() => {
    async function fetchQuote() {
      try {
        const res = await fetch(
          `/api/market/quote?symbols=${encodeURIComponent(stock.symbol)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.quotes && data.quotes[0]) {
            setQuote(data.quotes[0]);
          }
        }
      } catch (err: any) {
        console.warn("Failed to fetch order form quote:", err?.message || err);
      }
    }
    const interval = setInterval(fetchQuote, 5000);
    return () => clearInterval(interval);
  }, [stock.symbol]);

  const qty = typeof quantity === "number" ? quantity : 0;
  const effectivePrice =
    orderType === "MARKET"
      ? quote.ltp
      : typeof targetPrice === "number"
      ? targetPrice
      : 0;
  const total = qty * effectivePrice;
  const canBuy = total > 0 && total <= availableBalance;
  const canSell = qty > 0 && (holding?.quantity ?? 0) >= qty;
  const maxBuyQty = effectivePrice > 0 ? Math.floor(availableBalance / effectivePrice) : 0;

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 5000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (qty <= 0) return;

    if (type === "BUY" && !canBuy) {
      setError(`Insufficient balance. You need ${formatCurrency(total)}`);
      return;
    }
    if (type === "SELL" && !canSell) {
      setError(`Insufficient shares. You only have ${holding?.quantity ?? 0}`);
      return;
    }

    setLoading(true);
    try {
      if (orderType === "MARKET") {
        const res = await fetch(`/api/trade/${type.toLowerCase()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: stock.symbol,
            ticker: stock.ticker,
            name: stock.name,
            quantity: qty,
            price: quote.ltp,
            stopLoss: type === "BUY" && advancedEnabled && stopLoss !== "" ? stopLoss : null,
            takeProfit: type === "BUY" && advancedEnabled && takeProfit !== "" ? takeProfit : null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Order failed");
        showSuccess(
          `✓ ${type} order executed! ${qty} shares of ${stock.ticker} at ${formatCurrency(quote.ltp)}`
        );
      } else {
        // LIMIT order
        const res = await fetch("/api/trade/limit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: stock.symbol,
            ticker: stock.ticker,
            name: stock.name,
            type,
            quantity: qty,
            targetPrice: effectivePrice,
            orderType: "LIMIT",
            stopLoss: type === "BUY" && advancedEnabled && stopLoss !== "" ? stopLoss : null,
            takeProfit: type === "BUY" && advancedEnabled && takeProfit !== "" ? takeProfit : null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Limit order placement failed");
        showSuccess(
          `✓ Limit ${type} order placed! ${qty} × ${stock.ticker} @ ${formatCurrency(effectivePrice)}`
        );
      }

      setQuantity("");
      setStopLoss("");
      setTakeProfit("");
      setAdvancedEnabled(false);
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Order failed");
    } finally {
      setLoading(false);
    }
  }

  // Holding P&L
  let holdingValue = 0;
  let holdingPnl = 0;
  let holdingPnlPct = 0;
  if (holding) {
    const invested = holding.avg_price * holding.quantity;
    holdingValue = quote.ltp * holding.quantity;
    holdingPnl = holdingValue - invested;
    holdingPnlPct = invested > 0 ? (holdingPnl / invested) * 100 : 0;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.07] bg-card flex flex-col h-full">
        {/* Buy / Sell toggle */}
        <div className="flex p-1 border-b border-white/[0.06]">
          <button
            onClick={() => setType("BUY")}
            className={`flex-1 py-3 text-sm font-semibold rounded-t-xl transition-all ${
              type === "BUY"
                ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-400/5"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => setType("SELL")}
            className={`flex-1 py-3 text-sm font-semibold rounded-t-xl transition-all ${
              type === "SELL"
                ? "text-rose-400 border-b-2 border-rose-400 bg-rose-400/5"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
            }`}
          >
            SELL
          </button>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          {/* Live quote */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/[0.06]">
            <div>
              <div className="text-xs text-zinc-500 mb-1">Market Price</div>
              <div className="text-2xl font-bold font-mono text-white flex items-center gap-2">
                {formatCurrency(quote.ltp)}
                <span className={`text-sm flex items-center ${getPnLColor(quote.changePercent)}`}>
                  {quote.changePercent >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {formatPercent(quote.changePercent, false)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Zap className="w-3 h-3" /> Live
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            {/* Success toast */}
            {successMsg && (
              <div className="mb-4 flex items-start gap-2 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                {successMsg}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Order Type — Market / Limit */}
            <div className="mb-5">
              <label className="text-sm font-medium text-zinc-300 block mb-2">Order Type</label>
              <div className="grid grid-cols-2 gap-2 bg-surface p-1 rounded-xl border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setOrderType("MARKET")}
                  className={`py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    orderType === "MARKET"
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Market
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderType("LIMIT");
                    if (typeof targetPrice !== "number") setTargetPrice(quote.ltp);
                  }}
                  className={`py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    orderType === "LIMIT"
                      ? "bg-white/10 text-sky-400"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  Limit Order
                </button>
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">
                {orderType === "MARKET"
                  ? "⚡ Executes instantly at current market price"
                  : type === "BUY"
                  ? "🎯 Buy when price drops to your target"
                  : "🎯 Sell when price rises to your target"}
              </p>
            </div>

            {/* Quantity */}
            <div className="mb-4">
              <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-medium text-zinc-300">Quantity</label>
                {type === "BUY" ? (
                  <button
                    type="button"
                    onClick={() => setQuantity(maxBuyQty)}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Max: {maxBuyQty}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setQuantity(holding?.quantity ?? 0)}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Max: {holding?.quantity ?? 0}
                  </button>
                )}
              </div>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                required
                onChange={(e) =>
                  setQuantity(e.target.value === "" ? "" : parseInt(e.target.value))
                }
                placeholder="0"
                className="w-full text-right font-mono text-2xl rounded-xl border border-white/[0.08] bg-surface px-4 py-3 text-white placeholder-zinc-700 transition-all focus:outline-none focus:border-white/20"
              />
            </div>

            {/* Target Price — Limit only */}
            {orderType === "LIMIT" && (
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-zinc-300">Target Price (INR)</label>
                  {typeof targetPrice === "number" && quote.ltp > 0 && (
                    <span className="text-[11px] font-mono text-zinc-500">
                      {targetPrice > quote.ltp
                        ? `+${(((targetPrice - quote.ltp) / quote.ltp) * 100).toFixed(1)}% above`
                        : `${(((targetPrice - quote.ltp) / quote.ltp) * 100).toFixed(1)}% below`}{" "}
                      market
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0.05"
                  step="0.05"
                  required
                  value={targetPrice}
                  onChange={(e) =>
                    setTargetPrice(e.target.value === "" ? "" : parseFloat(e.target.value))
                  }
                  placeholder="0.00"
                  className="w-full text-right font-mono text-2xl rounded-xl border border-sky-500/30 bg-surface px-4 py-3 text-white placeholder-zinc-700 transition-all focus:outline-none focus:border-sky-500/60"
                />
              </div>
            )}

            {/* Attach SL/TP — only for BUY orders */}
            {type === "BUY" && (
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => setAdvancedEnabled(!advancedEnabled)}
                  className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {advancedEnabled
                    ? "Hide Stop-Loss / Take-Profit ↑"
                    : "Attach Stop-Loss / Take-Profit ↓"}
                </button>

                {advancedEnabled && (
                  <div className="mt-3 p-4 rounded-xl border border-white/[0.05] bg-surface/50 space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-zinc-400">
                          Stop-Loss Price (INR)
                        </label>
                        {stopLoss !== "" && effectivePrice > 0 && (
                          <span className="text-[10px] text-rose-400 font-mono">
                            -{(((effectivePrice - Number(stopLoss)) / effectivePrice) * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="0.05"
                        step="0.05"
                        value={stopLoss}
                        onChange={(e) =>
                          setStopLoss(e.target.value === "" ? "" : parseFloat(e.target.value))
                        }
                        placeholder="₹ Auto-sell if price drops here"
                        className="w-full text-right font-mono text-sm rounded-lg border border-white/[0.08] bg-surface px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500/30"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-zinc-400">
                          Take-Profit Price (INR)
                        </label>
                        {takeProfit !== "" && effectivePrice > 0 && (
                          <span className="text-[10px] text-emerald-400 font-mono">
                            +{(((Number(takeProfit) - effectivePrice) / effectivePrice) * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="0.05"
                        step="0.05"
                        value={takeProfit}
                        onChange={(e) =>
                          setTakeProfit(e.target.value === "" ? "" : parseFloat(e.target.value))
                        }
                        placeholder="₹ Auto-sell when profit target hit"
                        className="w-full text-right font-mono text-sm rounded-lg border border-white/[0.08] bg-surface px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/30"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order Summary */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Execution</span>
                <span className={`font-medium text-xs px-2 py-0.5 rounded-full border ${
                  orderType === "MARKET"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-sky-400 bg-sky-500/10 border-sky-500/20"
                }`}>
                  {orderType === "MARKET" ? "Instant" : "On target"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">
                  {orderType === "MARKET" ? "Total Cost" : "Reserved Amount"}
                </span>
                <span className="font-mono font-medium text-white">
                  {formatCurrency(total)}
                </span>
              </div>
              {type === "BUY" ? (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Available Balance</span>
                  <span className={`font-mono ${canBuy || qty === 0 ? "text-zinc-300" : "text-rose-400"}`}>
                    {formatCurrency(availableBalance)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Current Holdings</span>
                  <span className={`font-mono ${canSell || qty === 0 ? "text-zinc-300" : "text-rose-400"}`}>
                    {holding?.quantity ?? 0} shares
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (type === "BUY" ? !canBuy : !canSell) || qty <= 0}
              className={`w-full py-4 rounded-xl font-bold text-sm transition-all shadow-glow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                type === "BUY"
                  ? "bg-emerald-500 text-black hover:bg-emerald-400"
                  : "bg-rose-500 text-white hover:bg-rose-400"
              }`}
            >
              {loading
                ? "PROCESSING..."
                : orderType === "LIMIT"
                ? `PLACE LIMIT ${type} ORDER`
                : `${type} ${stock.ticker}`}
            </button>
          </form>
        </div>
      </div>

      {/* Active Position Card */}
      {holding && (
        <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
          <h3 className="font-semibold text-white mb-4">Your Position</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-500">Shares</span>
              <span className="font-mono text-white">{holding.quantity}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-500">Avg Price</span>
              <span className="font-mono text-white">{formatCurrency(holding.avg_price)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-500">Invested</span>
              <span className="font-mono text-white">
                {formatCurrency(holding.avg_price * holding.quantity)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-500">Current Value</span>
              <span className="font-mono text-white">{formatCurrency(holdingValue)}</span>
            </div>
            <div className="pt-4 border-t border-white/[0.06] flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-300">Total Return</span>
              <div className={`text-right ${getPnLColor(holdingPnl)}`}>
                <div className="font-mono font-bold">
                  {holdingPnl >= 0 ? "+" : ""}
                  {formatCurrency(holdingPnl)}
                </div>
                <div className="text-xs font-mono">{formatPercent(holdingPnlPct)}</div>
              </div>
            </div>
          </div>

          {/* Manage SL/TP on active position */}
          <form onSubmit={handleUpdateTriggers} className="mt-6 pt-5 border-t border-white/[0.06] space-y-4">
            <h4 className="text-xs font-bold text-zinc-400 tracking-wider uppercase">
              Position Guards (SL / TP)
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-zinc-500 block mb-1">
                  STOP-LOSS (SL)
                </label>
                <input
                  type="number"
                  min="0.05"
                  step="0.05"
                  value={editStopLoss}
                  onChange={(e) =>
                    setEditStopLoss(e.target.value === "" ? "" : parseFloat(e.target.value))
                  }
                  placeholder="Auto-sell below"
                  className="w-full text-center font-mono text-xs rounded-lg border border-white/[0.08] bg-surface py-2 text-white placeholder-zinc-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-zinc-500 block mb-1">
                  TAKE-PROFIT (TP)
                </label>
                <input
                  type="number"
                  min="0.05"
                  step="0.05"
                  value={editTakeProfit}
                  onChange={(e) =>
                    setEditTakeProfit(e.target.value === "" ? "" : parseFloat(e.target.value))
                  }
                  placeholder="Auto-sell above"
                  className="w-full text-center font-mono text-xs rounded-lg border border-white/[0.08] bg-surface py-2 text-white placeholder-zinc-700 focus:outline-none"
                />
              </div>
            </div>

            {triggerMessage && (
              <div className={`text-[10px] font-medium text-center py-1.5 px-2.5 rounded ${
                triggerMessage.includes("success")
                  ? "text-emerald-400 bg-emerald-500/5 border border-emerald-500/10"
                  : "text-rose-400 bg-rose-500/5 border border-rose-500/10"
              }`}>
                {triggerMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={updatingTriggers}
              className="w-full py-2 rounded-lg font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
            >
              {updatingTriggers ? "SAVING..." : "UPDATE TRIGGERS"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
