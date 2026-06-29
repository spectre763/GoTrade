import { NextRequest, NextResponse } from "next/server";

// Sample financial news articles for Indian markets
const SAMPLE_NEWS = [
  {
    title: "Nifty 50 scales new highs as FII inflows surge in domestic markets",
    publisher: "Economic Times",
    link: "https://economictimes.indiatimes.com/markets",
    providerPublishTime: Math.floor(Date.now() / 1000) - 3600,
  },
  {
    title: "RBI holds repo rate steady; market participants eye inflation data",
    publisher: "Mint",
    link: "https://www.livemint.com/market",
    providerPublishTime: Math.floor(Date.now() / 1000) - 7200,
  },
  {
    title: "IT sector leads gains as US tech rally boosts Indian software stocks",
    publisher: "Business Standard",
    link: "https://www.business-standard.com/markets",
    providerPublishTime: Math.floor(Date.now() / 1000) - 10800,
  },
  {
    title: "Reliance Industries Q4 results beat estimates; stock rises 2%",
    publisher: "NDTV Profit",
    link: "https://ndtvprofit.com",
    providerPublishTime: Math.floor(Date.now() / 1000) - 14400,
  },
  {
    title: "Sensex, Nifty end higher on positive global cues; banking stocks shine",
    publisher: "Financial Express",
    link: "https://www.financialexpress.com/market",
    providerPublishTime: Math.floor(Date.now() / 1000) - 18000,
  },
  {
    title: "SEBI tightens F&O regulations; focus shifts to equity cash segment",
    publisher: "MoneyControl",
    link: "https://www.moneycontrol.com",
    providerPublishTime: Math.floor(Date.now() / 1000) - 21600,
  },
  {
    title: "Auto stocks rally as monthly sales data shows strong consumer demand",
    publisher: "Business Today",
    link: "https://www.businesstoday.in",
    providerPublishTime: Math.floor(Date.now() / 1000) - 25200,
  },
  {
    title: "Pharma majors surge on strong export data; Sun Pharma hits 52-week high",
    publisher: "Economic Times",
    link: "https://economictimes.indiatimes.com/markets",
    providerPublishTime: Math.floor(Date.now() / 1000) - 28800,
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";

  // Return curated sample news (in production, integrate Yahoo Finance or NewsAPI)
  const news = SAMPLE_NEWS.map((n) => ({
    ...n,
    // Slightly vary timestamp per symbol to make it feel dynamic
    providerPublishTime: n.providerPublishTime - (symbol.length * 100),
  }));

  return NextResponse.json({ news });
}
