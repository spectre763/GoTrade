export interface Stock {
  symbol: string;
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
}

export interface Quote {
  symbol: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

export interface OHLCVCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SearchResult {
  symbol: string;
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
}

export type ChartInterval =
  | "1minute"
  | "5minute"
  | "30minute"
  | "1day"
  | "1week"
  | "1month";
