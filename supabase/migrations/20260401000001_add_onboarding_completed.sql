-- Add onboarding_completed flag to profiles
-- Run this in Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Mark existing users as already onboarded (they're not new)
UPDATE profiles SET onboarding_completed = true WHERE created_at < NOW() - INTERVAL '1 hour';
