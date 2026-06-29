"use client";

interface AllocationItem {
  ticker: string;
  weight: number;
}

interface AllocationChartProps {
  holdings: AllocationItem[];
}

const COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f43f5e", // rose
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#14b8a6", // teal
];

export default function AllocationChart({ holdings }: AllocationChartProps) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const validHoldings = holdings.filter((h) => h.weight > 0);

  if (validHoldings.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-card p-6 flex flex-col md:flex-row items-center justify-around gap-8">
      {/* SVG Donut */}
      <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="#27272a"
            strokeWidth="12"
          />
          {validHoldings.map((h, i) => {
            const color = COLORS[i % COLORS.length];
            const strokeVal = (h.weight / 100) * circumference;
            const strokeOffset = currentOffset;
            currentOffset -= strokeVal;

            return (
              <circle
                key={h.ticker}
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth="12"
                strokeDasharray={`${strokeVal} ${circumference}`}
                strokeDashoffset={strokeOffset}
                className="transition-all duration-500 ease-out hover:stroke-[14px]"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Allocation</div>
          <div className="text-lg font-bold text-white font-mono mt-0.5">{validHoldings.length} Assets</div>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1 max-w-md w-full">
        {validHoldings.map((h, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <div key={h.ticker} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="font-semibold text-white">{h.ticker}</span>
              <span className="text-zinc-500 font-mono ml-auto">{h.weight.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
