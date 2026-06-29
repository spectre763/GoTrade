import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, Time, LineSeries } from "lightweight-charts";

interface NetWorthChartProps {
  currentNetWorth: number;
  portfolioValue?: number;
  isNewUser?: boolean;
  firstTxCreatedAt?: string | null;
}

export default function NetWorthChart({
  currentNetWorth,
  portfolioValue = 0,
  isNewUser = false,
  firstTxCreatedAt = null,
}: NetWorthChartProps) {
  const [range, setRange] = useState<"1W" | "1M" | "ALL">("1M");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#18181b" },
        textColor: "#71717a",
        fontSize: 10,
        fontFamily: "JetBrains Mono, monospace",
      },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: "#27272a" },
      },
      rightPriceScale: {
        borderColor: "transparent",
      },
      timeScale: {
        borderColor: "transparent",
      },
      width: containerRef.current.clientWidth,
      height: 160,
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: "#10b981",
      lineWidth: 2,
      crosshairMarkerVisible: true,
    });

    // Generate simulated net worth ending at currentNetWorth based on range
    const data = [];
    const now = Math.floor(Date.now() / 1000);
    const daySeconds = 24 * 60 * 60;
    const startValue = 1000000.00; // starting capital
    const firstTxTime = firstTxCreatedAt ? new Date(firstTxCreatedAt).getTime() : null;

    let days = 30;
    if (range === "1W") {
      days = 7;
    } else if (range === "1M") {
      days = 30;
    } else if (range === "ALL") {
      if (firstTxTime) {
        const diffMs = Date.now() - firstTxTime;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        days = Math.max(30, Math.min(diffDays + 5, 90));
      } else {
        days = 60;
      }
    }

    // Scale noise based on current portfolio value or transaction activity
    const noiseAmplitude = isNewUser
      ? 0
      : (portfolioValue > 0
          ? Math.min(portfolioValue * 0.15, 100000)
          : 5000);

    for (let i = days; i >= 0; i--) {
      const time = (now - i * daySeconds) as Time;
      const tMs = (now - i * daySeconds) * 1000;
      let value = startValue;

      if (firstTxTime !== null && tMs >= firstTxTime) {
        const totalTradingTime = (now * 1000) - firstTxTime;
        const elapsedTradingTime = tMs - firstTxTime;
        const progress = totalTradingTime > 0 ? Math.max(0, Math.min(1, elapsedTradingTime / totalTradingTime)) : 1;
        const baseValue = startValue + (currentNetWorth - startValue) * progress;
        const noise = (Math.random() - 0.5) * noiseAmplitude * (i / days); // noise fades as we approach today
        value = baseValue + noise;
      } else {
        // Flat before any trade
        value = startValue;
      }

      data.push({
        time,
        value: parseFloat(value.toFixed(2)),
      });
    }

    lineSeries.setData(data);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [currentNetWorth, portfolioValue, isNewUser, firstTxCreatedAt, range]);

  return (
    <div className="space-y-4">
      {/* Range filter selector */}
      <div className="flex items-center justify-end gap-1">
        {(["1W", "1M", "ALL"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono tracking-wider transition-all border ${
              range === r
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "text-zinc-500 hover:text-zinc-300 border-transparent hover:bg-white/[0.02]"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="relative w-full h-[160px]" ref={containerRef} />
    </div>
  );
}
