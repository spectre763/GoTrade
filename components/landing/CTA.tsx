"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-[100px] bg-[#0d0d0f] px-5 relative overflow-hidden">
      <div className="max-w-[980px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-[32px] overflow-hidden"
        >
          {/* Dark background with emerald/violet gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a0e] via-[#0d0d0f] to-[#0e0814]" />
          {/* Glow orbs */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[300px] rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] rounded-full bg-violet-500/10 blur-[80px] pointer-events-none" />
          {/* Border */}
          <div className="absolute inset-0 rounded-[32px] border border-emerald-500/15" />

          {/* Content */}
          <div className="relative z-10 text-center px-8 py-20 md:py-28">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-[13px] font-medium text-emerald-300 mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Free forever. No credit card.
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="text-[44px] sm:text-[60px] lg:text-[72px] font-bold tracking-[-0.035em] leading-[1.04] text-white mb-6"
            >
              Your trading journey
              <br />
              <span className="hero-gradient-text">starts today.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-[18px] text-white/45 max-w-[440px] mx-auto leading-[1.55] mb-10"
            >
              Join thousands of Indian traders building real skills with{" "}
              <span className="text-white font-semibold">₹10,00,000</span> in virtual capital.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link
                href="/register"
                className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full px-8 py-4 text-[17px] transition-all duration-300 shadow-[0_0_28px_rgba(16,185,129,0.45)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] hover:-translate-y-0.5"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
              <Link
                href="/login"
                className="text-[16px] text-white/45 hover:text-white/80 transition-colors duration-200 font-medium"
              >
                Already have an account?{" "}
                <span className="text-emerald-400 underline underline-offset-4">Log in</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
