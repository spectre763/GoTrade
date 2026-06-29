"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

const TICKER_ITEMS = [
  { ticker: "RELIANCE", price: "₹2,850.75", change: "+1.23%", positive: true },
  { ticker: "TCS", price: "₹4,125.30", change: "+0.87%", positive: true },
  { ticker: "HDFCBANK", price: "₹1,678.45", change: "-0.42%", positive: false },
  { ticker: "INFY", price: "₹1,842.60", change: "+2.14%", positive: true },
  { ticker: "ICICIBANK", price: "₹1,245.80", change: "+0.65%", positive: true },
  { ticker: "SBIN", price: "₹812.35", change: "-0.91%", positive: false },
  { ticker: "BHARTIARTL", price: "₹1,923.45", change: "+1.55%", positive: true },
  { ticker: "BAJFINANCE", price: "₹7,234.50", change: "-1.08%", positive: false },
  { ticker: "WIPRO", price: "₹568.90", change: "+0.34%", positive: true },
  { ticker: "LT", price: "₹3,845.60", change: "+0.78%", positive: true },
  { ticker: "TATAMOTORS", price: "₹1,023.45", change: "+3.21%", positive: true },
  { ticker: "SUNPHARMA", price: "₹1,823.60", change: "-0.55%", positive: false },
  { ticker: "TITAN", price: "₹3,845.60", change: "+1.90%", positive: true },
  { ticker: "MARUTI", price: "₹12,456.78", change: "+0.44%", positive: true },
  { ticker: "ASIANPAINT", price: "₹2,890.34", change: "-0.78%", positive: false },
  { ticker: "HCLTECH", price: "₹1,756.20", change: "+1.12%", positive: true },
  { ticker: "ONGC", price: "₹289.45", change: "-1.34%", positive: false },
  { ticker: "ADANIENT", price: "₹3,456.78", change: "+2.45%", positive: true },
  { ticker: "NTPC", price: "₹389.45", change: "+0.22%", positive: true },
  { ticker: "AXISBANK", price: "₹1,234.56", change: "-0.34%", positive: false },
];

function TickerItem({ item }: { item: typeof TICKER_ITEMS[0] }) {
  return (
    <div className="flex items-center gap-2.5 px-6 shrink-0">
      <span className="text-[12px] font-bold text-white/80 tracking-wide">{item.ticker}</span>
      <span className="text-[12px] font-mono text-white/50">{item.price}</span>
      <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${item.positive ? "text-emerald-400" : "text-rose-400"}`}>
        {item.positive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
        {item.change}
      </span>
      <span className="text-white/20 ml-1">·</span>
    </div>
  );
}

export default function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="border-y border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden py-2.5">
      <div className="flex animate-ticker">
        {items.map((item, i) => (
          <TickerItem key={i} item={item} />
        ))}
      </div>
    </div>
  );
}
