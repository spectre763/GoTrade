import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency, formatDateTime, getPnLColor } from "@/lib/formatters";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions",
};

export default async function TransactionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const txList = transactions ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Transactions</h1>
        <p className="text-zinc-500 text-sm">
          {txList.length} trade{txList.length !== 1 ? "s" : ""} in your history
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-[#18181b] overflow-hidden shadow-card">
        {txList.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <Clock className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No transactions yet</h3>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-6">
              Your trading history will appear here after your first buy or sell order.
            </p>
            <Link
              href="/trade"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 text-sm transition-colors shadow-glow-sm"
            >
              Explore Markets
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#111113]/50">
                  <th className="text-left px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-left px-4 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-right px-4 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="text-right px-4 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-right px-4 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {txList.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-white/[0.04] table-row-hover transition-all"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/trade/${encodeURIComponent(tx.ticker)}`}
                        className="group"
                      >
                        <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {tx.ticker}
                        </div>
                        <div className="text-xs text-zinc-500 truncate max-w-[140px]">
                          {tx.name}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold border uppercase tracking-wider ${
                          tx.type === "BUY"
                            ? "bg-emerald-500/8 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/8 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-zinc-300">
                      {tx.quantity}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-zinc-300">
                      {formatCurrency(tx.price)}
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-medium text-white">
                      {formatCurrency(tx.total)}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-zinc-500">
                      {formatDateTime(tx.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
