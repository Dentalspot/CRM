-- 1. RLS policies for user_addons (INSERT/UPDATE for free coupon activation)
CREATE POLICY "Users can insert own addons"
  ON public.user_addons FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own addons"
  ON public.user_addons FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Create coupons for Notiz and Template Generator add-ons
INSERT INTO public.discount_coupons (
  code, discount_type, discount_value, coupon_type, is_active,
  valid_from, expiration_date, max_uses, applicable_plans, description
) VALUES
(
  'NOTIZ-FREE30', 'percentage', 100, 'membership', true,
  NOW(), NOW() + INTERVAL '90 days', 500,
  '{notiz}',
  'Cupón DentalSpot: IA Notiz gratis por 30 días. Un solo uso por usuario.'
),
(
  'PLANTILLA-FREE30', 'percentage', 100, 'membership', true,
  NOW(), NOW() + INTERVAL '90 days', 500,
  '{planGenerator}',
  'Cupón DentalSpot: Generador de Plantillas gratis por 30 días. Un solo uso por usuario.'
)
ON CONFLICT (code) DO NOTHING;
