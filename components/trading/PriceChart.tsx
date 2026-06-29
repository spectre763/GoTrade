"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ChartInterval, OHLCVCandle } from "@/types/market";
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from "lightweight-charts";
import { formatCurrency } from "@/lib/formatters";

const INTERVALS: { label: string; value: ChartInterval; days: number }[] = [
  { label: "1D", value: "1day", days: 30 },
  { label: "1W", value: "1week", days: 90 },
  { label: "1M", value: "1month", days: 365 },
];

interface PriceChartProps {
  symbol: string;
  ticker: string;
}

function PriceChartInner({ symbol, ticker }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const [chartInterval, setChartInterval] = useState<{ label: string; value: ChartInterval; days: number }>(INTERVALS[0]);
  const [loading, setLoading] = useState(true);
  const [candlesData, setCandlesData] = useState<OHLCVCandle[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);

  // Poll live price from API
  useEffect(() => {
    let active = true;
    async function fetchPrice() {
      try {
        const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(symbol)}`);
        if (res.ok && active) {
          const data = await res.json();
          if (data.quotes && data.quotes[0]) {
            setLivePrice(data.quotes[0].ltp);
          }
        }
      } catch (err: any) {
        console.warn("Chart failed to fetch live price:", err?.message || err);
      }
    }
    fetchPrice();
    const intervalId = setInterval(fetchPrice, 5000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [symbol]);

  // Keep the last candle close synced with the live quote price
  useEffect(() => {
    if (!livePrice || candlesData.length === 0 || !seriesRef.current) return;
    const lastCandle = candlesData[candlesData.length - 1];
    seriesRef.current.update({
      time: lastCandle.time as Time,
      open: lastCandle.open,
      high: Math.max(lastCandle.high, livePrice),
      low: Math.min(lastCandle.low, livePrice),
      close: livePrice,
    });
  }, [livePrice, candlesData]);

  // Update timeScale options dynamically based on interval type (intraday vs daily)
  useEffect(() => {
    if (!chartRef.current) return;
    const isIntraday =
      chartInterval.value === "1minute" ||
      chartInterval.value === "5minute" ||
      chartInterval.value === "30minute";
    chartRef.current.timeScale().applyOptions({
      timeVisible: isIntraday,
    });
  }, [chartInterval]);

  const loadChart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/market/history?symbol=${encodeURIComponent(symbol)}&interval=${chartInterval.value}&days=${chartInterval.days}`
      );
      const { candles } = await res.json() as { candles: OHLCVCandle[] };
      const validCandles = candles || [];
      setCandlesData(validCandles);

      if (seriesRef.current) {
        const data: CandlestickData[] = validCandles.map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));
        seriesRef.current.setData(data);
        chartRef.current?.timeScale().fitContent();
      }
    } finally {
      setLoading(false);
    }
  }, [symbol, chartInterval]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#18181b" },
        textColor: "#71717a",
        fontSize: 11,
        fontFamily: "JetBrains Mono, monospace",
      },
      grid: {
        vertLines: { color: "#27272a" },
        horzLines: { color: "#27272a" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#52525b", labelBackgroundColor: "#27272a" },
        horzLine: { color: "#52525b", labelBackgroundColor: "#27272a" },
      },
      rightPriceScale: {
        borderColor: "#27272a",
        scaleMargins: { top: 0.05, bottom: 0.2 },
      },
      timeScale: {
        borderColor: "#27272a",
        timeVisible:
          chartInterval.value === "1minute" ||
          chartInterval.value === "5minute" ||
          chartInterval.value === "30minute",
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: 380,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#f43f5e",
      borderUpColor: "#10b981",
      borderDownColor: "#f43f5e",
      wickUpColor: "#10b981",
      wickDownColor: "#f43f5e",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => { loadChart(); }, [loadChart]);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-card overflow-hidden">
      {/* Chart header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white">{ticker}</span>
          <span className="text-xs text-zinc-500">Candlestick</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-surface p-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv.value}
              onClick={() => setChartInterval(iv)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                chartInterval.value === iv.value
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
            <div className="w-6 h-6 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}
        <div ref={containerRef} className="w-full" style={{ minHeight: 380 }} />
      </div>

      {/* TradingView attribution */}
      <div className="px-5 py-2 border-t border-white/[0.04] flex justify-end">
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Charts by TradingView
        </a>
      </div>
    </div>
  );
}

// Export with SSR disabled (required for TradingView Lightweight Charts)
export default dynamic(() => Promise.resolve(PriceChartInner), { ssr: false });
