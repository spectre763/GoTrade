import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your GoTrade account to start paper trading.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#09090b] flex items-center justify-center px-4 py-16 overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-100"
        >
          <source src="/chart-graph-bg.mp4" type="video/mp4" />
        </video>
      </div>
      
      {/* Dark overlays so the form is readable */}
      <div className="absolute inset-0 z-0 bg-black/60" />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/40 via-transparent to-[#09090b]/80" />

      {/* Subtle background glow */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(16,185,129,0.1),transparent)] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
