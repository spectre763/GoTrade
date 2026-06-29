import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Ticker from "@/components/landing/Ticker";
import Features from "@/components/landing/Features";
import Stats from "@/components/landing/Stats";
import Testimonials from "@/components/landing/Testimonials";
import CTA from "@/components/landing/CTA";

export default function LandingPage() {
  return (
    <div className="bg-[#050507] text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Ticker />
      <Features />
      <Stats />
      <Testimonials />
      <CTA />
    </div>
  );
}
