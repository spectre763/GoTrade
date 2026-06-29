-- GoTrade Initial Schema Migration
-- Run this in your Supabase SQL Editor

-- ── Profiles ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  username    TEXT UNIQUE NOT NULL DEFAULT '',
  balance     NUMERIC(15, 2) NOT NULL DEFAULT 1000000.00,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Holdings ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.holdings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symbol      TEXT NOT NULL,
  ticker      TEXT NOT NULL,
  name        TEXT NOT NULL,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  avg_price   NUMERIC(12, 2) NOT NULL CHECK (avg_price > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- ── Transactions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symbol      TEXT NOT NULL,
  ticker      TEXT NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  price       NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  total       NUMERIC(15, 2) NOT NULL CHECK (total > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Watchlist ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.watchlist (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symbol      TEXT NOT NULL,
  ticker      TEXT NOT NULL,
  name        TEXT NOT NULL,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS holdings_user_id_idx ON public.holdings(user_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_created_idx ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_symbol_idx ON public.transactions(symbol);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist    ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "own_profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "own_holdings"
  ON public.holdings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "own_transactions"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "own_watchlist"
  ON public.watchlist FOR ALL
  USING (auth.uid() = user_id);

-- ── Auto-create profile on registration ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    1000000.00
  );
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger to avoid duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- ── Updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER holdings_updated_at
  BEFORE UPDATE ON public.holdings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
