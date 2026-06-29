-- Database Migration: Add Stop-Loss / Take-Profit (SL/TP) and Price Alert Type

-- 1. Modify public.holdings to add stop_loss and take_profit columns
ALTER TABLE public.holdings
ADD COLUMN IF NOT EXISTS stop_loss NUMERIC(12, 2) CHECK (stop_loss > 0),
ADD COLUMN IF NOT EXISTS take_profit NUMERIC(12, 2) CHECK (take_profit > 0);

-- 2. Modify public.limit_orders to add stop_loss and take_profit columns
ALTER TABLE public.limit_orders
ADD COLUMN IF NOT EXISTS stop_loss NUMERIC(12, 2) CHECK (stop_loss > 0),
ADD COLUMN IF NOT EXISTS take_profit NUMERIC(12, 2) CHECK (take_profit > 0);

-- 3. Modify public.price_alerts to add type column with constraint
ALTER TABLE public.price_alerts
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'ALERT' CHECK (type IN ('ALERT', 'STOP_LOSS', 'TAKE_PROFIT'));
