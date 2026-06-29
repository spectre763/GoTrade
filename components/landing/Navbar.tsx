"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#testimonials", label: "Testimonials" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/70 backdrop-blur-2xl border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[980px] mx-auto px-5 h-[52px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[9px] bg-emerald-500 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.5)]">
            <TrendingUp className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="text-[16px] font-semibold tracking-tight text-white">GoTrade</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] text-white/60 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-[13px] text-white/60 hover:text-white transition-colors duration-200"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="text-[13px] font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-full px-4 py-1.5 transition-all duration-200 shadow-[0_0_14px_rgba(52,211,153,0.35)]"
          >
            Start Free
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-1 text-white/70"
          aria-label="Toggle menu"
        >
          <div className="flex flex-col gap-[5px] w-5">
            <span className={`block h-[1.5px] bg-white rounded-full transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-[6.5px]" : ""}`} />
            <span className={`block h-[1.5px] bg-white rounded-full transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-[1.5px] bg-white rounded-full transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-[6.5px]" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 bg-black/90 backdrop-blur-2xl border-b border-white/[0.06] ${menuOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-5 py-5 flex flex-col gap-5">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="text-[17px] text-white/80 font-medium">
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-3 border-t border-white/[0.08]">
            <Link href="/login" onClick={() => setMenuOpen(false)} className="text-[17px] text-white/60">Log in</Link>
            <Link href="/register" onClick={() => setMenuOpen(false)} className="text-center text-[15px] font-semibold text-black bg-emerald-400 rounded-full py-2.5">Start Free</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
