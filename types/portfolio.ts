export interface Holding {
  id: string;
  user_id: string;
  symbol: string;
  ticker: string;
  name: string;
  quantity: number;
  avg_price: number;
  stop_loss?: number | null;
  take_profit?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  symbol: string;
  ticker: string;
  name: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  balance: number;
  created_at: string;
}
