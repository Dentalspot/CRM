-- 1. Create per-user coupon redemption tracking table
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id uuid NOT NULL REFERENCES public.discount_coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at timestamp with time zone DEFAULT now() NOT NULL,
  plan_name text,
  UNIQUE(coupon_id, user_id) -- One use per user per coupon
);

-- RLS
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions"
  ON public.coupon_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemptions"
  ON public.coupon_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Insert the DentalSpot profesional coupon (100% discount, 30 days, single use per user)
INSERT INTO public.discount_coupons (
  code, discount_type, discount_value, coupon_type, is_active,
  valid_from, expiration_date, max_uses, applicable_plans,
  description
) VALUES (
  'DENTALSPOT2025', 'percentage', 100, 'membership', true,
  NOW(), NOW() + INTERVAL '90 days', 500,
  '{profesional}',
  'Cupón DentalSpot: Plan Profesional gratis por 30 días. Un solo uso por usuario.'
)
ON CONFLICT (code) DO NOTHING;
