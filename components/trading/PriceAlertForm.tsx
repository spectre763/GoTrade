"use client";

import { useState } from "react";
import { Stock, Quote } from "@/types/market";
import { formatCurrency } from "@/lib/formatters";
import { Bell, ArrowUp, ArrowDown } from "lucide-react";

interface PriceAlertFormProps {
  stock: Stock;
  quote: Quote;
}

export default function PriceAlertForm({ stock, quote }: PriceAlertFormProps) {
  const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [targetPrice, setTargetPrice] = useState<string>(quote.ltp.toString());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSetAlert(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      setMessage({ type: "error", text: "Please enter a valid target price" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: stock.symbol,
          ticker: stock.ticker,
          name: stock.name,
          condition,
          targetPrice: price,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set alert");

      setMessage({ type: "success", text: `Alert set successfully for ${stock.ticker} crossing ${condition} ${formatCurrency(price)}` });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-card p-5">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm">
        <Bell className="w-4.5 h-4.5 text-emerald-400" />
        Set Price Alert
      </h3>

      <form onSubmit={handleSetAlert} className="space-y-4">
        {message && (
          <div className={`p-3 rounded-lg text-xs font-medium border ${
            message.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}>
            {message.text}
          </div>
        )}

        {/* Condition Toggle */}
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1.5">Condition</label>
          <div className="grid grid-cols-2 gap-2 bg-surface p-1 rounded-xl border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setCondition("ABOVE")}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                condition === "ABOVE" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <ArrowUp className="w-3 h-3 text-emerald-400" />
              Goes Above
            </button>
            <button
              type="button"
              onClick={() => setCondition("BELOW")}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                condition === "BELOW" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <ArrowDown className="w-3 h-3 text-rose-400" />
              Goes Below
            </button>
          </div>
        </div>

        {/* Target Price */}
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1.5">Trigger Price (INR)</label>
          <input
            type="number"
            step="0.05"
            min="0.05"
            required
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            className="w-full text-right font-mono text-lg rounded-xl border border-white/[0.08] bg-surface px-4 py-2.5 text-white placeholder-zinc-700 transition-all focus:outline-none focus:border-white/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-glow-sm disabled:opacity-50"
        >
          {loading ? "CREATING ALERT..." : "CREATE PRICE ALERT"}
        </button>
      </form>
    </div>
  );
}
