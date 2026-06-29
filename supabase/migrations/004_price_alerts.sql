-- GoTrade Price Alerts Schema Migration
-- Run this in your Supabase SQL Editor to support price alerts

CREATE TABLE IF NOT EXISTS public.price_alerts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symbol       TEXT NOT NULL,
  ticker       TEXT NOT NULL,
  name         TEXT NOT NULL,
  condition    TEXT NOT NULL CHECK (condition IN ('ABOVE', 'BELOW')),
  target_price NUMERIC(12, 2) NOT NULL CHECK (target_price > 0),
  status       TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'TRIGGERED', 'CANCELLED')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS price_alerts_user_id_idx ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS price_alerts_status_idx ON public.price_alerts(status);

-- Enable RLS
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/modify their own price alerts
DROP POLICY IF EXISTS own_price_alerts ON public.price_alerts;
CREATE POLICY "own_price_alerts"
  ON public.price_alerts FOR ALL
  USING (auth.uid() = user_id);
