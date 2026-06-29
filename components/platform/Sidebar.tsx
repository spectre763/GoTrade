"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp,
  LayoutDashboard,
  LineChart,
  PieChart,
  Clock,
  ChevronRight,
  Trophy,
  Newspaper,
  Settings,
  ClipboardList,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trade", label: "Trade", icon: LineChart },
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/transactions", label: "Transactions", icon: Clock },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/news", label: "Market News", icon: Newspaper },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-white/[0.06] bg-surface min-h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-glow-sm">
          <TrendingUp className="w-4 h-4 text-black" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-white text-lg">GoTrade</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3">Menu</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-emerald-500/12 text-emerald-400"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {label}
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-emerald-400/60" />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
