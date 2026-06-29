"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  TrendingUp,
  LayoutDashboard,
  LineChart,
  PieChart,
  Clock,
  LogOut,
  Menu,
  X,
  Trophy,
  Newspaper,
  Settings,
  ClipboardList,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface Profile {
  full_name?: string | null;
  username?: string | null;
  balance?: number | null;
}

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

export default function MobileNav({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const currentPage = NAV_ITEMS.find(
    (n) => pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href))
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-white/[0.06] bg-surface sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-white">GoTrade</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-emerald-400 font-semibold">
            {formatCurrency(profile?.balance ?? 0, true)}
          </span>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-64 bg-surface border-r border-white/[0.06] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 px-5 h-14 border-b border-white/[0.06]">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-white">GoTrade</span>
            </div>

            {profile && (
              <div className="px-4 py-4 border-b border-white/[0.06]">
                <div className="text-sm font-medium text-white">{profile.full_name}</div>
                <div className="text-xs text-zinc-500">@{profile.username}</div>
                <div className="mt-2 font-mono text-sm font-semibold text-emerald-400">
                  {formatCurrency(profile.balance ?? 0)} available
                </div>
              </div>
            )}

            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-emerald-500/12 text-emerald-400"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="px-3 py-4 border-t border-white/[0.06]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/8 transition-all"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop page title bar */}
      {currentPage && (
        <div className="hidden lg:flex items-center justify-between px-8 h-14 border-b border-white/[0.06] bg-surface/50">
          <div className="flex items-center gap-3">
            <currentPage.icon className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-300">{currentPage.label}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-rose-400 border border-white/10 px-4 py-2 text-xs font-semibold transition-colors shadow-glow-sm"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            Log out
          </button>
        </div>
      )}
    </>
  );
}
