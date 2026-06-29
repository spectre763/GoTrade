import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/formatters";
import Link from "next/link";
import { Trophy, TrendingUp, Medal } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
};

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch top traders by balance (public leaderboard)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, username, balance")
    .order("balance", { ascending: false })
    .limit(50);

  const traders = profiles ?? [];

  const rankMedal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          Leaderboard
        </h1>
        <p className="text-zinc-500 text-sm">
          Top traders ranked by portfolio balance
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-[#18181b] overflow-hidden shadow-card">
        {traders.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            No traders yet. Be the first!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#111113]/50">
                  <th className="text-left px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider w-16">
                    Rank
                  </th>
                  <th className="text-left px-4 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Trader
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {traders.map((trader, index) => {
                  const rank = index + 1;
                  const medal = rankMedal(rank);
                  const isMe = trader.id === user.id;
                  return (
                    <tr
                      key={trader.id}
                      className={`border-b border-white/[0.04] transition-all ${
                        isMe
                          ? "bg-emerald-500/[0.04] border-l-2 border-l-emerald-500/50"
                          : "table-row-hover"
                      }`}
                    >
                      <td className="px-6 py-4 text-center">
                        {medal ? (
                          <span className="text-lg">{medal}</span>
                        ) : (
                          <span className="font-mono text-zinc-500 text-sm">
                            #{rank}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          {trader.full_name ?? trader.username ?? "Anonymous"}
                          {isMe && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                              YOU
                            </span>
                          )}
                        </div>
                        {trader.username && (
                          <div className="text-xs text-zinc-500">
                            @{trader.username}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-white">
                        {formatCurrency(trader.balance ?? 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
