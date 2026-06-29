import { Quote, OHLCVCandle, ChartInterval } from "@/types/market";
import { STOCKS } from "@/lib/mock-market";
import YahooFinance from "yahoo-finance2";

export const yf = new YahooFinance({
  suppressNotices: ["yahooSurvey", "ripHistorical"],
});

// Map our internal interval type → Yahoo Finance interval + default range params
const INTERVAL_MAP: Record<ChartInterval, { interval: "1m" | "5m" | "30m" | "1d" | "1wk" | "1mo"; durationMs: number }> = {
  "1minute": { interval: "1m",  durationMs: 1 * 24 * 3600 * 1000 },
  "5minute": { interval: "5m",  durationMs: 5 * 24 * 3600 * 1000 },
  "30minute": { interval: "30m", durationMs: 5 * 24 * 3600 * 1000 },
  "1day":     { interval: "1d",  durationMs: 90 * 24 * 3600 * 1000 },
  "1week":    { interval: "1wk", durationMs: 180 * 24 * 3600 * 1000 },
  "1month":   { interval: "1mo", durationMs: 730 * 24 * 3600 * 1000 },
};

/**
 * Convert our internal NSE symbol (e.g. "NSE_EQ|INE002A01018")
 * to a Yahoo Finance ticker (e.g. "RELIANCE.NS").
 */
function toYahooTicker(symbol: string): string {
  const stock = STOCKS.find((s) => s.symbol === symbol);
  if (!stock) return symbol;
  // Yahoo Finance uses .NS suffix for NSE and .BO for BSE
  return stock.exchange === "BSE" ? `${stock.ticker}.BO` : `${stock.ticker}.NS`;
}

/**
 * Fetch live market quotes from Yahoo Finance for one or more symbols.
 */
export async function fetchYahooQuotes(
  symbols: { symbol: string; ticker: string; name: string; sector: string }[]
): Promise<Quote[]> {
  // Guard: yf.quote crashes on empty array
  if (symbols.length === 0) return [];

  const yahooTickers = symbols.map((s) => toYahooTicker(s.symbol));

  // yf.quote supports fetching multiple tickers in one call
  const results = await yf.quote(yahooTickers);

  // Build a map from Yahoo ticker (uppercase) → result
  const resultMap = new Map<string, any>();
  for (const r of results) {
    if (r && r.symbol) {
      resultMap.set(r.symbol.toUpperCase(), r);
    }
  }

  return symbols.map((stock) => {
    const yahooTicker = toYahooTicker(stock.symbol).toUpperCase();
    const r = resultMap.get(yahooTicker);

    if (!r) {
      return {
        symbol: stock.symbol,
        ltp: 0,
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        timestamp: Date.now(),
      };
    }

    const ltp: number = r.regularMarketPrice ?? 0;
    const close: number = r.regularMarketPreviousClose ?? ltp;
    const change: number = r.regularMarketChange ?? parseFloat((ltp - close).toFixed(2));
    const changePercent: number = r.regularMarketChangePercent ?? (close > 0 ? (change / close) * 100 : 0);

    return {
      symbol: stock.symbol,
      ltp: parseFloat(ltp.toFixed(2)),
      open: parseFloat((r.regularMarketOpen ?? ltp).toFixed(2)),
      high: parseFloat((r.regularMarketDayHigh ?? ltp).toFixed(2)),
      low: parseFloat((r.regularMarketDayLow ?? ltp).toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: r.regularMarketVolume ?? 0,
      timestamp: r.regularMarketTime ? new Date(r.regularMarketTime).getTime() : Date.now(),
    };
  });
}

/**
 * Fetch a live market quote for a single symbol.
 */
export async function getMarketQuote(symbol: string): Promise<Quote> {
  const stock = STOCKS.find((s) => s.symbol === symbol) || {
    symbol,
    ticker: symbol.split(":")[1] || symbol,
    name: symbol,
    sector: "Other",
  };
  const quotes = await fetchYahooQuotes([stock as any]);
  return quotes[0];
}

/**
 * Fetch OHLCV historical candle data from Yahoo Finance.
 */
export async function fetchYahooHistory(
  symbol: string,
  interval: ChartInterval,
  days: number = 90
): Promise<OHLCVCandle[]> {
  const yahooTicker = toYahooTicker(symbol);
  
  let lookbackMs = 30 * 24 * 3600 * 1000;
  let yInterval: "1m" | "5m" | "30m" | "1d" | "1wk" | "1mo" = "1d";

  if (interval === "1minute") {
    yInterval = "1m";
    lookbackMs = 1 * 24 * 3600 * 1000;
  } else if (interval === "5minute") {
    yInterval = "5m";
    lookbackMs = 5 * 24 * 3600 * 1000;
  } else if (interval === "30minute") {
    yInterval = "30m";
    lookbackMs = 5 * 24 * 3600 * 1000;
  } else if (interval === "1day") {
    yInterval = "1d";
    lookbackMs = Math.max(days, 30) * 24 * 3600 * 1000;
  } else if (interval === "1week") {
    yInterval = "1wk";
    lookbackMs = Math.max(days, 180) * 24 * 3600 * 1000;
  } else if (interval === "1month") {
    yInterval = "1mo";
    lookbackMs = Math.max(days, 730) * 24 * 3600 * 1000;
  }

  const period1 = new Date(Date.now() - lookbackMs);

  const result = await yf.chart(yahooTicker, {
    period1: period1,
    interval: yInterval,
  });

  const quotes = result.quotes ?? [];

  return quotes
    .map((q) => ({
      time: Math.floor(new Date(q.date).getTime() / 1000), // Unix seconds
      open: parseFloat((q.open ?? 0).toFixed(2)),
      high: parseFloat((q.high ?? 0).toFixed(2)),
      low: parseFloat((q.low ?? 0).toFixed(2)),
      close: parseFloat((q.close ?? 0).toFixed(2)),
      volume: q.volume ?? 0,
    }))
    .filter((c) => c.open > 0 && c.close > 0) // Filter null candles
    .sort((a, b) => a.time - b.time);
}

/**
 * Dynamically fetch a stock's metadata by ticker from Yahoo Finance.
 * Attempts to resolve ticker.NS (NSE) first, then ticker.BO (BSE).
 */
export async function fetchStockByTicker(ticker: string) {
  // 1. Try local list first
  const local = STOCKS.find((s) => s.ticker === ticker);
  if (local) return local;

  // 2. Try NSE on Yahoo Finance
  try {
    const qNSE = await yf.quote(`${ticker}.NS`);
    if (qNSE) {
      return {
        symbol: `${ticker}.NS`,
        ticker: ticker,
        name: qNSE.longName || qNSE.shortName || ticker,
        exchange: "NSE" as const,
        sector: qNSE.sectorDisp || qNSE.sector || "Other",
        isin: "",
      };
    }
  } catch (e) {
    // Ignore and try BSE
  }

  // 3. Try BSE on Yahoo Finance
  try {
    const qBSE = await yf.quote(`${ticker}.BO`);
    if (qBSE) {
      return {
        symbol: `${ticker}.BO`,
        ticker: ticker,
        name: qBSE.longName || qBSE.shortName || ticker,
        exchange: "BSE" as const,
        sector: qBSE.sectorDisp || qBSE.sector || "Other",
        isin: "",
      };
    }
  } catch (e) {
    // Ignore
  }

  return undefined;
}

/**
 * Fetch Yahoo Finance news articles based on a search query.
 */
export async function fetchStockNews(query: string) {
  try {
    const result = await yf.search(query, { newsCount: 6 });
    return result.news || [];
  } catch (err) {
    console.error(`Failed to fetch Yahoo Finance news for query "${query}":`, err);
    return [];
  }
}


