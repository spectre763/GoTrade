"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Arjun Sharma",
    role: "Engineering Student, IIT Delhi",
    quote:
      "GoTrade changed how I understand markets. I went from knowing nothing to consistently profitable in paper trading in 3 months. The charts are exactly like what professionals use.",
    profit: "+₹2.4L",
    initials: "AS",
    color: "from-emerald-500 to-teal-600",
  },
  {
    name: "Priya Menon",
    role: "MBA Graduate, IIM Bangalore",
    quote:
      "I used GoTrade to practice before opening my Zerodha account. The realistic interface and live prices made the transition seamless. Best way to learn without burning real money.",
    profit: "+₹1.8L",
    initials: "PM",
    color: "from-violet-500 to-purple-700",
  },
  {
    name: "Rohit Patel",
    role: "Software Developer, Bengaluru",
    quote:
      "The portfolio analytics hooked me — seeing my win rate improve over time is incredibly motivating. GoTrade is the best paper trading app in India. Nothing else comes close.",
    profit: "+₹4.1L",
    initials: "RP",
    color: "from-blue-500 to-indigo-600",
  },
  {
    name: "Kavya Reddy",
    role: "Finance Analyst, Mumbai",
    quote:
      "Finally a platform that takes paper trading seriously. The P&L tracking helped me identify that I was selling too early. This insight completely transformed my real trading strategy.",
    profit: "+₹3.2L",
    initials: "KR",
    color: "from-rose-500 to-pink-600",
  },
  {
    name: "Vikram Singh",
    role: "Entrepreneur, New Delhi",
    quote:
      "I've tried 5 paper trading platforms. GoTrade wins on design, real-time data accuracy, and ease of use. The dashboard feels like a proper Bloomberg terminal.",
    profit: "+₹5.7L",
    initials: "VS",
    color: "from-amber-500 to-orange-600",
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const t = TESTIMONIALS[current];

  const prev = () => setCurrent((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const next = () => setCurrent((c) => (c + 1) % TESTIMONIALS.length);

  return (
    <section id="testimonials" className="py-[100px] bg-[#09090b] px-5 relative overflow-hidden">
      {/* bg glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-violet-500/5 blur-[100px] pointer-events-none" />

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
            Trader stories
          </span>
          <h2 className="text-[44px] sm:text-[54px] font-bold tracking-[-0.03em] text-white leading-[1.06]">
            Real results.
          </h2>
        </motion.div>

        {/* Quote card */}
        <div className="max-w-[720px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-3xl border border-white/[0.07] bg-[#111113] p-10 md:p-14 overflow-hidden"
            >
              {/* subtle bg gradient from avatar color */}
              <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 bg-gradient-to-br ${t.color} pointer-events-none`} />

              {/* Stars */}
              <div className="flex gap-1.5 mb-7">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 16 16" fill="#f59e0b">
                    <path d="M8 1l1.854 3.758 4.146.602-3 2.924.708 4.127L8 10.25 4.292 12.41l.708-4.127-3-2.924 4.146-.602z" />
                  </svg>
                ))}
              </div>

              <blockquote className="text-[19px] sm:text-[22px] text-white/80 leading-[1.55] font-normal mb-9 tracking-[-0.01em]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-[13px] font-bold text-white shadow-lg`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-white">{t.name}</div>
                    <div className="text-[12px] text-white/40">{t.role}</div>
                  </div>
                </div>
                <div className="text-[14px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5">
                  {t.profit}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-white/60" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === current ? "w-5 h-2 bg-emerald-400" : "w-2 h-2 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors duration-200"
            >
              <ChevronRight className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
