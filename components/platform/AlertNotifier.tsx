"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, X } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { AnimatePresence, motion } from "framer-motion";

interface AlertItem {
  id: string;
  symbol: string;
  ticker: string;
  name: string;
  condition: "ABOVE" | "BELOW";
  target_price: number;
  status: string;
}

interface ToastMessage {
  id: string;
  ticker: string;
  name: string;
  condition: string;
  targetPrice: number;
  type: "ALERT" | "STOP_LOSS" | "TAKE_PROFIT";
}

export default function AlertNotifier() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const acknowledgedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    async function checkAlerts() {
      try {
        const res = await fetch("/api/alerts");
        if (!res.ok) return;

        const data = await res.json();
        const alerts: AlertItem[] = data.alerts || [];

        const triggeredAlerts = alerts.filter((a) => a.status === "TRIGGERED");

        for (const alert of triggeredAlerts) {
          if (!acknowledgedIds.current.has(alert.id)) {
            acknowledgedIds.current.add(alert.id);

            const newToast: ToastMessage = {
              id: alert.id,
              ticker: alert.ticker,
              name: alert.name,
              condition: alert.condition,
              targetPrice: Number(alert.target_price),
              type: (alert as any).type || "ALERT",
            };
            setToasts((prev) => [...prev, newToast]);

            // Acknowledge by deleting/marking from database so it doesn't poll again
            await fetch(`/api/alerts?id=${alert.id}`, {
              method: "DELETE",
            });
          }
        }
      } catch (err: any) {
        console.warn("Failed to check price alerts:", err?.message || err);
      }
    }

    // Poll every 4 seconds
    const interval = setInterval(checkAlerts, 4000);
    return () => clearInterval(interval);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          // Styling and copy configurations based on alert type
          const isStopLoss = toast.type === "STOP_LOSS";
          const isTakeProfit = toast.type === "TAKE_PROFIT";

          let borderClass = "border-emerald-500/30";
          let shadowClass = "shadow-glow-emerald";
          let stripeClass = "bg-emerald-500";
          let iconBg = "bg-emerald-500/10";
          let iconColor = "text-emerald-400";
          let title = "Price Alert Triggered!";
          let message = (
            <>
              <span className="font-bold text-white">{toast.ticker}</span> has crossed{" "}
              <span className="font-semibold text-emerald-400">{toast.condition}</span> target price of{" "}
              <span className="font-mono font-semibold text-zinc-200">{formatCurrency(toast.targetPrice)}</span>.
            </>
          );

          if (isStopLoss) {
            borderClass = "border-rose-500/30";
            shadowClass = "shadow-glow-rose";
            stripeClass = "bg-rose-500";
            iconBg = "bg-rose-500/10";
            iconColor = "text-rose-400";
            title = "Stop-Loss Triggered!";
            message = (
              <>
                <span className="font-bold text-white">{toast.ticker}</span> auto-sold as price fell below the stop limit of{" "}
                <span className="font-mono font-semibold text-zinc-200">{formatCurrency(toast.targetPrice)}</span>.
              </>
            );
          } else if (isTakeProfit) {
            borderClass = "border-emerald-500/30";
            shadowClass = "shadow-glow-emerald";
            stripeClass = "bg-emerald-500";
            iconBg = "bg-emerald-500/10";
            iconColor = "text-emerald-400";
            title = "Take-Profit Triggered!";
            message = (
              <>
                <span className="font-bold text-white">{toast.ticker}</span> auto-sold to lock in profit as price hit target of{" "}
                <span className="font-mono font-semibold text-zinc-200">{formatCurrency(toast.targetPrice)}</span>.
              </>
            );
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className={`rounded-2xl border ${borderClass} bg-zinc-900/90 backdrop-blur-md p-4 flex gap-3 ${shadowClass} relative overflow-hidden`}
            >
              {/* Top indicator stripe */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${stripeClass} animate-pulse`} />

              <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Bell className={`w-5 h-5 ${iconColor}`} />
              </div>

              <div className="flex-grow pr-4">
                <div className="font-bold text-white text-sm flex items-center gap-1.5">
                  {title}
                </div>
                <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {message}
                </div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
