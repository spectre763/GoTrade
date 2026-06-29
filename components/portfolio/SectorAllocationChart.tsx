"use client";

interface SectorAllocationItem {
  sector: string;
  weight: number;
}

interface SectorAllocationChartProps {
  sectors: SectorAllocationItem[];
}

const SECTOR_COLORS: Record<string, string> = {
  Technology: "#06b6d4", // cyan
  Financial: "#10b981", // emerald
  Energy: "#f59e0b", // amber
  "Consumer Goods": "#8b5cf6", // violet
  Utilities: "#14b8a6", // teal
  Conglomerates: "#3b82f6", // blue
  Healthcare: "#ec4899", // pink
  Materials: "#f43f5e", // rose
  Services: "#a855f7", // purple
  Automobile: "#f97316", // orange
  Other: "#71717a", // zinc
};

const COLOR_PALETTE = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f43f5e",
  "#f59e0b",
  "#06b6d4",
  "#14b8a6",
  "#ec4899",
];

export default function SectorAllocationChart({ sectors }: SectorAllocationChartProps) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const validSectors = sectors.filter((s) => s.weight > 0);

  if (validSectors.length === 0) {
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
          {validSectors.map((s, i) => {
            const color = SECTOR_COLORS[s.sector] || COLOR_PALETTE[i % COLOR_PALETTE.length];
            const strokeVal = (s.weight / 100) * circumference;
            const strokeOffset = currentOffset;
            currentOffset -= strokeVal;

            return (
              <circle
                key={s.sector}
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
          <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Sectors</div>
          <div className="text-lg font-bold text-white font-mono mt-0.5">{validSectors.length} Groups</div>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1 max-w-md w-full">
        {validSectors.map((s, i) => {
          const color = SECTOR_COLORS[s.sector] || COLOR_PALETTE[i % COLOR_PALETTE.length];
          return (
            <div key={s.sector} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="font-semibold text-white truncate max-w-[140px]" title={s.sector}>
                {s.sector}
              </span>
              <span className="text-zinc-500 font-mono ml-auto">{s.weight.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
