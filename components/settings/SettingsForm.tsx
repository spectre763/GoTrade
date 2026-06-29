"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, AlertTriangle, LogOut } from "lucide-react";

interface Profile {
  full_name: string;
  username: string;
}

export default function SettingsForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [username, setUsername] = useState(profile.username || "");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const router = useRouter();
  const supabase = createClient();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateProfile", full_name: fullName, username }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile.");
      }

      setMessage({ text: "Profile updated successfully.", type: "success" });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetAccount = async () => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset your account? This will wipe your portfolio, transaction history, limits, and alerts, and reset your available balance to ₹10,00,000."
    );
    if (!confirmReset) return;

    setResetLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resetAccount" }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to reset account.");
      }

      setMessage({ text: "Account reset successfully.", type: "success" });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="max-w-2xl space-y-8">
      {message.text && (
        <div
          className={`p-4 rounded-xl border text-sm ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Section */}
      <section className="bg-surface border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Profile Details</h2>
            <p className="text-sm text-zinc-500">Update your basic account information.</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-5 sm:p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#111113] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#111113] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-glow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>

      {/* Danger Zone */}
      <section className="bg-surface border border-rose-500/20 rounded-2xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-rose-500/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-rose-500">Danger Zone</h2>
            <p className="text-sm text-zinc-500">Irreversible and important account actions.</p>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Reset Account</h3>
              <p className="text-sm text-zinc-500">
                Wipe all data and reset your available cash to ₹10,00,000.
              </p>
            </div>
            <button
              onClick={handleResetAccount}
              disabled={resetLoading}
              className="whitespace-nowrap bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resetLoading ? "Resetting..." : "Reset Account"}
            </button>
          </div>

          <div className="w-full h-px bg-white/[0.06]" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Sign Out</h3>
              <p className="text-sm text-zinc-500">
                Log out of your GoTrade account on this device.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="whitespace-nowrap flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
