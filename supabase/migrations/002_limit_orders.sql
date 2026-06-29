-- GoTrade Limit Orders Schema Migration

CREATE TABLE IF NOT EXISTS public.limit_orders (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symbol      TEXT NOT NULL,
  ticker      TEXT NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  target_price NUMERIC(12, 2) NOT NULL CHECK (target_price > 0),
  status      TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'TRIGGERED', 'CANCELLED')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS limit_orders_user_id_idx ON public.limit_orders(user_id);
CREATE INDEX IF NOT EXISTS limit_orders_status_idx ON public.limit_orders(status);

-- Enable RLS
ALTER TABLE public.limit_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/modify their own limit orders
DROP POLICY IF EXISTS own_limit_orders ON public.limit_orders;
CREATE POLICY "own_limit_orders"
  ON public.limit_orders FOR ALL
  USING (auth.uid() = user_id);
