"use client";

import { motion } from "framer-motion";
import { BarChart3, BookOpen, LineChart, Lock, PieChart, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Live Market Data",
    description: "Real-time NSE & BSE prices powered by live feeds — trade with prices that reflect true market conditions, tick by tick.",
    accent: "#f59e0b",
    glow: "rgba(245,158,11,0.12)",
  },
  {
    icon: BarChart3,
    title: "Professional Charts",
    description: "TradingView-grade candlestick charts with multiple timeframes. Analyze price action exactly as professionals do.",
    accent: "#3b82f6",
    glow: "rgba(59,130,246,0.12)",
  },
  {
    icon: PieChart,
    title: "Portfolio Tracking",
    description: "All holdings in one dashboard. Real-time P&L, allocation breakdowns, and performance analytics at a glance.",
    accent: "#10b981",
    glow: "rgba(16,185,129,0.12)",
  },
  {
    icon: LineChart,
    title: "Performance Analytics",
    description: "Win rate, average gain/loss, best stocks, sector exposure — understand every dimension of your trading.",
    accent: "#a855f7",
    glow: "rgba(168,85,247,0.12)",
  },
  {
    icon: Lock,
    title: "Zero Financial Risk",
    description: "Practice with ₹10,00,000 in virtual capital. Make mistakes, refine strategies, and build real confidence.",
    accent: "#f43f5e",
    glow: "rgba(244,63,94,0.12)",
  },
  {
    icon: BookOpen,
    title: "Complete Trade History",
    description: "Every trade recorded and searchable. Filter, analyze, and spot patterns in your full transaction history.",
    accent: "#f97316",
    glow: "rgba(249,115,22,0.12)",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Features() {
  return (
    <section id="features" className="py-[100px] bg-[#09090b] px-5 relative">
      {/* subtle grid */}
      <div className="absolute inset-0 hero-grid opacity-40 pointer-events-none" />

      <div className="max-w-[980px] mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-[13px] font-semibold text-emerald-400 tracking-widest uppercase mb-4">
            Everything you need
          </span>
          <h2 className="text-[44px] sm:text-[54px] font-bold tracking-[-0.03em] text-white leading-[1.06] mb-5">
            Built for serious learners.
          </h2>
          <p className="text-[18px] text-white/45 max-w-[500px] mx-auto leading-[1.55]">
            Professional-grade tools to take you from beginner to confident, skilled trader.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] rounded-3xl overflow-hidden border border-white/[0.06]"
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group bg-[#0d0d0f] hover:bg-[#111113] p-8 transition-colors duration-300 relative overflow-hidden"
              >
                {/* Hover corner glow */}
                <div
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: feature.glow }}
                />
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: feature.glow }}
                >
                  <Icon className="w-5 h-5" style={{ color: feature.accent }} />
                </div>
                <h3 className="text-[17px] font-semibold text-white mb-2.5 tracking-[-0.01em]">
                  {feature.title}
                </h3>
                <p className="text-[14px] text-white/45 leading-[1.6]">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
