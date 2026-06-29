-- GoTrade Leaderboard RLS Policy Adjustment Migration
-- Run this in your Supabase SQL Editor to allow public/authenticated read access to profiles & holdings

-- 1. Profiles table policy adjustment
DROP POLICY IF EXISTS "own_profile" ON public.profiles;

-- Anyone can view profiles (required for leaderboard rankings)
CREATE POLICY "allow_read_profiles" 
  ON public.profiles FOR SELECT 
  USING (true);

-- Only the owner can modify/delete their own profile
CREATE POLICY "allow_modify_own_profile" 
  ON public.profiles FOR ALL 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);


-- 2. Holdings table policy adjustment
DROP POLICY IF EXISTS "own_holdings" ON public.holdings;

-- Anyone can view holdings (required to calculate portfolios on the leaderboard)
CREATE POLICY "allow_read_holdings" 
  ON public.holdings FOR SELECT 
  USING (true);

-- Only the owner can modify/delete their own holdings
CREATE POLICY "allow_modify_own_holdings" 
  ON public.holdings FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);
