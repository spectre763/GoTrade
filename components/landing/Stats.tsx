"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const STATS = [
  { value: 50000, suffix: "+", label: "Active Traders", prefix: "" },
  { value: 10, suffix: "L", label: "Virtual Capital", prefix: "₹" },
  { value: 1500, suffix: "+", label: "Stocks Available", prefix: "" },
  { value: 99.9, suffix: "%", label: "Platform Uptime", prefix: "" },
];

const STEPS = [
  {
    step: "01",
    title: "Create your account",
    body: "Sign up in seconds — no credit card, no KYC. Instant access to the full platform.",
  },
  {
    step: "02",
    title: "Start with ₹10L virtual capital",
    body: "Your account is pre-loaded with ₹10,00,000 in paper money ready to trade immediately.",
  },
  {
    step: "03",
    title: "Trade, learn & grow",
    body: "Execute real trades on live NSE & BSE prices. Review analytics. Build true expertise.",
  },
];

function AnimatedCounter({
  value,
  suffix,
  prefix,
  inView,
}: {
  value: number;
  suffix: string;
  prefix: string;
  inView: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, value);
      setCount(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  const display =
    value % 1 !== 0
      ? count.toFixed(1)
      : Math.floor(count).toLocaleString("en-IN");

  return (
    <span>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="py-[100px] bg-[#0d0d0f] px-5 relative overflow-hidden">
      {/* Glow backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

      <div className="max-w-[980px] mx-auto relative">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-[13px] font-semibold text-emerald-400 tracking-widest uppercase mb-4">
            By the numbers
          </span>
          <h2 className="text-[44px] sm:text-[54px] font-bold tracking-[-0.03em] text-white leading-[1.06]">
            Trusted across India.
          </h2>
        </motion.div>

        {/* Stat counters */}
        <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="text-center group"
            >
              <div className="text-[44px] sm:text-[52px] font-bold tracking-[-0.035em] leading-none mb-2 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                  inView={inView}
                />
              </div>
              <div className="text-[13px] text-white/40 uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-20" />

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-[13px] font-semibold text-emerald-400 tracking-widest uppercase mb-4">
            How it works
          </span>
          <h2 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.03em] text-white leading-[1.06]">
            Up and running in minutes.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-2xl border border-white/[0.07] bg-[#111113] p-8 overflow-hidden group hover:border-emerald-500/20 transition-colors duration-300"
            >
              {/* step glow */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-emerald-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="text-[42px] font-black text-white/5 leading-none mb-4 select-none">
                {item.step}
              </div>
              <div className="w-8 h-px bg-emerald-500/50 mb-5" />
              <h3 className="text-[18px] font-semibold text-white mb-3 tracking-[-0.01em]">
                {item.title}
              </h3>
              <p className="text-[14px] text-white/45 leading-[1.6]">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
