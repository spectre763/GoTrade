"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Shield, Zap, TrendingUp, TrendingDown } from "lucide-react";

/* ─── Floating stock cards data ─────────────────────────────────────────── */
const CARDS = [
  { ticker: "RELIANCE", price: "₹2,850.75", change: "+1.23%", up: true },
  { ticker: "TCS",      price: "₹4,125.30", change: "+0.87%", up: true  },
  { ticker: "HDFC",     price: "₹1,678.45", change: "-0.42%", up: false },
  { ticker: "INFY",     price: "₹1,842.60", change: "+2.14%", up: true  },
  { ticker: "BAJFIN",   price: "₹7,234.50", change: "-1.08%", up: false },
  { ticker: "TATAMTRS", price: "₹1,023.45", change: "+3.21%", up: true  },
];

function StockCard({
  ticker, price, change, up, delay,
}: { ticker: string; price: string; change: string; up: boolean; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className="hero-float-card rounded-2xl px-4 py-3 min-w-[156px] animate-float"
      style={{ animationDelay: `${delay * 0.6}s` }}
    >
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="text-[11px] font-bold text-white/50 tracking-widest uppercase">{ticker}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${up ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
          {up ? "▲" : "▼"}
        </span>
      </div>
      <div className="text-[15px] font-semibold text-white tracking-tight leading-none mb-1">{price}</div>
      <div className={`text-[12px] font-semibold ${up ? "text-emerald-400" : "text-rose-400"}`}>{change}</div>
    </motion.div>
  );
}

/* ─── Animated canvas chart background ──────────────────────────────────── */
function ChartCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Draw multiple sine-wave chart lines
    const lines = [
      { color: "rgba(16,185,129,0.18)",  offset: 0,    amp: 80,  freq: 0.006, phase: Date.now() * 0.0003 },
      { color: "rgba(16,185,129,0.10)",  offset: 60,   amp: 60,  freq: 0.009, phase: Date.now() * 0.0002 },
      { color: "rgba(139,92,246,0.12)",  offset: -40,  amp: 100, freq: 0.004, phase: Date.now() * 0.00025 },
      { color: "rgba(59,130,246,0.08)",  offset: 120,  amp: 50,  freq: 0.012, phase: Date.now() * 0.00035 },
    ];

    lines.forEach(({ color, offset, amp, freq, phase }) => {
      ctx.beginPath();
      ctx.moveTo(0, H / 2 + offset);

      for (let x = 0; x <= W; x++) {
        const y = H / 2 + offset + amp * Math.sin(x * freq + phase) * Math.cos(x * freq * 0.4 + phase * 0.7);
        ctx.lineTo(x, y);
      }

      // Fill gradient under the line
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, color);
      grad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Stroke
      ctx.beginPath();
      for (let x = 0; x <= W; x++) {
        const y = H / 2 + offset + amp * Math.sin(x * freq + phase) * Math.cos(x * freq * 0.4 + phase * 0.7);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color.replace("0.18", "0.6").replace("0.10", "0.4").replace("0.12", "0.45").replace("0.08", "0.3");
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Vertical grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.025)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    // Horizontal grid lines
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }, []);

  useEffect(() => {
    let animId: number;
    const loop = () => { draw(); animId = requestAnimationFrame(loop); };
    loop();

    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.85 }}
    />
  );
}

/* ─── Hero section ───────────────────────────────────────────────────────── */
export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y       = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  const [mounted, setMounted]         = useState(false);
  const [videoReady, setVideoReady]   = useState(false);

  useEffect(() => {
    setMounted(true);
    if (videoRef.current) videoRef.current.playbackRate = 0.65;
  }, []);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050507]"
    >
      {/* ── Background Video ── */}
      <motion.div style={{ scale: videoScale }} className="absolute inset-0 w-full h-full z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-1000 ${videoReady ? "opacity-100" : "opacity-0"}`}
          onCanPlay={() => setVideoReady(true)}
        >
          <source src="/chart-graph-bg.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* ── Dark + emerald overlay ── */}
      <div className="absolute inset-0 z-[1] bg-black/40" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/30 via-transparent to-[#09090b]" />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_70%_55%_at_50%_55%,rgba(16,185,129,0.1),transparent)]" />

      {/* ── Floating cards — left ── */}
      {mounted && (
        <div className="absolute left-[4%] top-[22%] hidden lg:flex flex-col gap-3 z-[5]">
          {CARDS.slice(0, 3).map((c, i) => (
            <StockCard key={c.ticker} {...c} delay={0.7 + i * 0.15} />
          ))}
        </div>
      )}

      {/* ── Floating cards — right ── */}
      {mounted && (
        <div className="absolute right-[4%] top-[22%] hidden lg:flex flex-col gap-3 z-[5]">
          {CARDS.slice(3).map((c, i) => (
            <StockCard key={c.ticker} {...c} delay={0.85 + i * 0.15} />
          ))}
        </div>
      )}

      {/* ── Main content ── */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-[6] text-center px-5 max-w-[720px] mx-auto"
      >
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm px-4 py-1.5 text-[13px] font-medium text-emerald-300 mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          NSE &amp; BSE Live Market Data
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="text-[52px] sm:text-[72px] lg:text-[88px] font-bold tracking-[-0.035em] leading-[1.03] text-white mb-6"
        >
          Trade smart.
          <br />
          <span className="hero-gradient-text">Risk nothing.</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-[18px] sm:text-[20px] text-white/50 leading-[1.6] mb-10 max-w-[540px] mx-auto"
        >
          Practice with{" "}
          <span className="text-white font-semibold">₹10,00,000</span> virtual capital.
          Real NSE &amp; BSE stocks. Professional tools. Zero financial risk.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/register"
            className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full px-8 py-3.5 text-[16px] transition-all duration-300 shadow-[0_0_28px_rgba(16,185,129,0.45)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] hover:-translate-y-0.5"
          >
            Start Trading Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
          <Link
            href="#features"
            className="flex items-center gap-1.5 text-[16px] font-medium text-white/65 hover:text-white transition-all duration-200 backdrop-blur-sm bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 rounded-full px-6 py-3.5"
          >
            Explore Platform
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-10 text-[13px] text-white/35"
        >
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />No real money
          </span>
          <span className="w-px h-3.5 bg-white/15" />
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />Live market data
          </span>
          <span className="w-px h-3.5 bg-white/15" />
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />NSE &amp; BSE stocks
          </span>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[6] flex flex-col items-center gap-2"
      >
        <span className="text-[10px] tracking-[0.22em] uppercase text-white/25">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="w-[1px] h-8 bg-gradient-to-b from-white/25 to-transparent"
        />
      </motion.div>
    </section>
  );
}
