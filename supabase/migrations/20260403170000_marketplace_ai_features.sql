-- Add AI-generated SEO columns to marketplace_items
ALTER TABLE public.marketplace_items ADD COLUMN IF NOT EXISTS ai_benefits jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.marketplace_items ADD COLUMN IF NOT EXISTS ai_target_audience jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.marketplace_items ADD COLUMN IF NOT EXISTS ai_use_cases jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.marketplace_items ADD COLUMN IF NOT EXISTS ai_generated_at timestamptz;
