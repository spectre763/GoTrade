import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GoTrade – Paper Trading Simulator",
    template: "%s | GoTrade",
  },
  description:
    "Practice trading NSE & BSE stocks with ₹10,00,000 virtual capital. No real money. Professional tools. Zero risk.",
  keywords: ["paper trading", "stock market", "NSE", "BSE", "virtual trading", "India"],
  openGraph: {
    title: "GoTrade – Trade Smart. Risk Nothing.",
    description:
      "Practice with ₹10,00,000 virtual capital. Real NSE & BSE stocks. Professional tools. Zero financial risk.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#09090b] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
