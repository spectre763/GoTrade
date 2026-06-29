import { Stock, Quote, OHLCVCandle, SearchResult, ChartInterval } from "@/types/market";

// ─── NSE Nifty 50 + popular stocks ────────────────────────────────────────────

import nseStocks from "./nse-stocks.json";
import bseStocks from "./bse-stocks.json";

export const STOCKS: Stock[] = [...nseStocks, ...bseStocks] as Stock[];

// Realistic base prices (INR) for each ticker
const BASE_PRICES: Record<string, number> = {
  RELIANCE: 2850.75, TCS: 4125.30, HDFCBANK: 1678.45, INFY: 1842.60,
  ICICIBANK: 1245.80, SBIN: 812.35, WIPRO: 568.90, BHARTIARTL: 1923.45,
  HCLTECH: 1756.20, LT: 3845.60, BAJFINANCE: 7234.50, KOTAKBANK: 1923.45,
  NESTLEIND: 2456.80, HINDUNILVR: 2678.90, ITC: 478.35, ADANIENT: 3456.78,
  ONGC: 289.45, POWERGRID: 312.80, TATAMOTORS: 1023.45, TATASTEEL: 167.35,
  SUNPHARMA: 1823.60, DRREDDY: 6789.45, BAJAJFINSV: 1923.45, TITAN: 3845.60,
  MARUTI: 12456.78, ULTRACEMCO: 11234.56, AXISBANK: 1234.56, ASIANPAINT: 2890.34,
  ADANIPORTS: 1345.67, INDUSINDBK: 1567.89, "M&M": 3234.56, NTPC: 389.45,
  CIPLA: 1567.89, GRASIM: 2890.34, COALINDIA: 478.90, TECHM: 1678.45,
  HEROMOTOCO: 5678.90, JSWSTEEL: 956.78, HDFCLIFE: 789.45, EICHERMOT: 4567.89,
  SBILIFE: 1890.34, TATACONSUM: 1123.45, DIVISLAB: 5678.90, BPCL: 389.45,
  BRITANNIA: 5678.90, APOLLOHOSP: 7234.56, SHREECEM: 27890.34, ZOMATO: 234.56,
};

function getBasePrice(ticker: string): number {
  if (BASE_PRICES[ticker] !== undefined) {
    return BASE_PRICES[ticker];
  }
  // Simple deterministic hash of the ticker to generate a consistent mock price
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
  }
  const price = 50 + (Math.abs(hash) % 1950);
  const cents = (Math.abs(hash) % 100) / 100;
  return parseFloat((price + cents).toFixed(2));
}

// In-memory price state with simulated fluctuations
const priceState: Record<string, { price: number; seed: number }> = {};

function initPriceState() {
  STOCKS.forEach((s) => {
    const base = getBasePrice(s.ticker);
    priceState[s.symbol] = { price: base, seed: Math.random() };
  });
}
initPriceState();

// Removed getMockQuote and getMockHistory as they have been migrated to Yahoo Finance.
export const POPULAR_TICKERS = [
  "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", 
  "SBIN", "WIPRO", "BHARTIARTL", "HCLTECH", "LT", 
  "BAJFINANCE", "KOTAKBANK", "NESTLEIND", "HINDUNILVR", "ITC", 
  "ADANIENT", "ONGC", "POWERGRID", "TATAMOTORS", "TATASTEEL", 
  "SUNPHARMA", "DRREDDY", "BAJAJFINSV", "TITAN", "MARUTI", 
  "ULTRACEMCO", "AXISBANK", "ASIANPAINT", "ADANIPORTS", "INDUSINDBK", 
  "M&M", "NTPC", "CIPLA", "GRASIM", "COALINDIA", 
  "TECHM", "HEROMOTOCO", "JSWSTEEL", "HDFCLIFE", "EICHERMOT", 
  "SBILIFE", "TATACONSUM", "DIVISLAB", "BPCL", "BRITANNIA", 
  "APOLLOHOSP", "SHREECEM", "ZOMATO"
];

export function searchStocks(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) {
    return POPULAR_TICKERS.map(ticker => STOCKS.find(s => s.ticker === ticker))
      .filter((s): s is Stock => !!s)
      .slice(0, 20)
      .map(s => ({ symbol: s.symbol, ticker: s.ticker, name: s.name, exchange: s.exchange, sector: s.sector }));
  }

  return STOCKS
    .map((s) => {
      const tickerLower = s.ticker.toLowerCase();
      const nameLower = s.name.toLowerCase();
      
      let score = 0;
      
      // Exact ticker match: highest priority
      if (tickerLower === q) {
        score = 100;
      }
      // Ticker starts with query
      else if (tickerLower.startsWith(q)) {
        score = 80;
      }
      // Ticker contains query
      else if (tickerLower.includes(q)) {
        score = 60;
      }
      // Name starts with query
      else if (nameLower.startsWith(q)) {
        score = 40;
      }
      // Name contains query (excluding common noise unless query is longer)
      else if (nameLower.includes(q)) {
        // If query is just a single letter, avoid matching common noise like "limited" or "ltd"
        if (q.length === 1 && (q === "l" || q === "t" || q === "d" || q === "i" || q === "m" || q === "e")) {
          const cleanName = nameLower.replace(/\blimited\b|\bltd\b|\bcorp\b|\bcorporation\b/g, "");
          if (cleanName.includes(q)) {
            score = 10;
          }
        } else {
          score = 20;
        }
      }

      return { stock: s, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      // Sort by score descending
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If scores are equal, sort alphabetically by ticker
      return a.stock.ticker.localeCompare(b.stock.ticker);
    })
    .map((item) => ({
      symbol: item.stock.symbol,
      ticker: item.stock.ticker,
      name: item.stock.name,
      exchange: item.stock.exchange,
      sector: item.stock.sector,
    }));
}

export function getStockBySymbol(symbol: string): Stock | undefined {
  return STOCKS.find((s) => s.symbol === symbol);
}

export function getStockByTicker(ticker: string): Stock | undefined {
  return STOCKS.find((s) => s.ticker === ticker);
}

