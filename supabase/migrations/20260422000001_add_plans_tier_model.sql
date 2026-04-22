-- Migration: Add subscription plans tier model (spec 022)
-- Date: 2026-04-22
-- Scope: 4 planes (Free, Individual, Clinic Pro, Clinic Premium) + extensiones schema
-- Follow-up: spec 019 audit + spec 020 MP rebrand + spec 021 cleanup FonoKit
-- Ref: specs/022-add-plans-tier-model/data-model.md

-- ============================================================
-- PRE-CHECK: tablas requeridas existen
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename='subscription_plans' AND schemaname='public') THEN
    RAISE EXCEPTION 'subscription_plans table missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename='discount_coupons' AND schemaname='public') THEN
    RAISE EXCEPTION 'discount_coupons table missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename='therapist_subscriptions' AND schemaname='public') THEN
    RAISE EXCEPTION 'therapist_subscriptions table missing';
  END IF;

  -- RLS debe estar activo en subscription_plans (warning si no)
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'subscription_plans' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    RAISE WARNING 'subscription_plans does not have RLS enabled — review security posture';
  END IF;

  RAISE NOTICE 'Pre-check passed: 3 required tables exist';
END $$;

-- ============================================================
-- SECTION 1: ALTER TABLE subscription_plans
-- ============================================================
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS max_dentists integer,
  ADD COLUMN IF NOT EXISTS max_boxes integer,
  ADD COLUMN IF NOT EXISTS patient_limit integer,
  ADD COLUMN IF NOT EXISTS appointment_limit integer,
  ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT 30 NOT NULL,
  ADD COLUMN IF NOT EXISTS annual_discount_percent integer DEFAULT 15 NOT NULL;

-- CHECK constraints (IF NOT EXISTS lógico — reversibles)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_plans_max_dentists_positive'
  ) THEN
    ALTER TABLE public.subscription_plans
      ADD CONSTRAINT subscription_plans_max_dentists_positive
      CHECK (max_dentists IS NULL OR max_dentists >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_plans_max_boxes_positive'
  ) THEN
    ALTER TABLE public.subscription_plans
      ADD CONSTRAINT subscription_plans_max_boxes_positive
      CHECK (max_boxes IS NULL OR max_boxes >= 0);
  END IF;
END $$;

-- ============================================================
-- SECTION 2: ALTER TABLE discount_coupons
-- ============================================================
ALTER TABLE public.discount_coupons
  ADD COLUMN IF NOT EXISTS max_renewals integer;

COMMENT ON COLUMN public.discount_coupons.max_renewals IS
  'NULL = un solo uso. N = cupón aplicable durante N ciclos de renovación consecutivos. Post-N-ciclos, el siguiente pago usa precio real.';

-- ============================================================
-- SECTION 3: ALTER TABLE therapist_subscriptions
-- ============================================================
ALTER TABLE public.therapist_subscriptions
  ADD COLUMN IF NOT EXISTS current_renewal_count integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS applied_coupon_code text;

COMMENT ON COLUMN public.therapist_subscriptions.current_renewal_count IS
  'Contador de ciclos de renovación con cupón aplicado. Se incrementa en webhook cuando un pago con cupón se procesa. 0 si no hay cupón.';

COMMENT ON COLUMN public.therapist_subscriptions.applied_coupon_code IS
  'Código del cupón aplicado a esta suscripción (si alguno). NULL si sin cupón.';

-- ============================================================
-- SECTION 4: CREATE OR REPLACE FUNCTION check_plan_limit
-- (Server-side enforcement RPC — spec 022 FR-014)
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_plan_limit(
  p_therapist_id uuid,
  p_resource_type text  -- 'patient' | 'appointment' | 'dentist' | 'box'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_slug text;
  v_max_dentists integer;
  v_max_boxes integer;
  v_patient_limit integer;
  v_appointment_limit integer;
  v_current_usage integer;
  v_limit integer;
BEGIN
  -- Obtener plan activo del therapist
  SELECT ts.plan_name INTO v_plan_slug
  FROM public.therapist_subscriptions ts
  WHERE ts.therapist_id = p_therapist_id
    AND ts.status = 'active'
  ORDER BY ts.created_at DESC
  LIMIT 1;

  -- Si no tiene sub activa, asume Free
  IF v_plan_slug IS NULL THEN
    v_plan_slug := 'free';
  END IF;

  -- Obtener límites del plan
  SELECT max_dentists, max_boxes, patient_limit, appointment_limit
  INTO v_max_dentists, v_max_boxes, v_patient_limit, v_appointment_limit
  FROM public.subscription_plans
  WHERE slug = v_plan_slug AND is_active = true;

  -- Si el plan no existe o no está activo, fail-safe a Free limits
  IF NOT FOUND THEN
    v_max_dentists := 1;
    v_max_boxes := 0;
    v_patient_limit := 5;
    v_appointment_limit := 15;
  END IF;

  -- Resolver límite según resource_type
  CASE p_resource_type
    WHEN 'patient' THEN v_limit := v_patient_limit;
    WHEN 'appointment' THEN v_limit := v_appointment_limit;
    WHEN 'dentist' THEN v_limit := v_max_dentists;
    WHEN 'box' THEN
      -- SCOPE NOTE (spec 022 Phase A hallazgo): tabla de boxes no existe en schema actual.
      -- Enforcement de max_boxes diferido a spec futuro (create-clinical-boxes-table-and-enforcement).
      -- Por ahora retorna true siempre para no bloquear flujos (límite documentado en DB pero no enforced).
      RETURN true;
    ELSE
      RAISE WARNING 'Unknown resource_type: %', p_resource_type;
      RETURN false;
  END CASE;

  -- NULL = ilimitado → siempre OK
  IF v_limit IS NULL THEN
    RETURN true;
  END IF;

  -- Calcular uso actual según resource_type
  CASE p_resource_type
    WHEN 'patient' THEN
      SELECT COUNT(*) INTO v_current_usage
      FROM public.patients
      WHERE therapist_id = p_therapist_id
        AND (deleted_at IS NULL);
    WHEN 'appointment' THEN
      SELECT COUNT(*) INTO v_current_usage
      FROM public.appointments
      WHERE therapist_id = p_therapist_id
        AND start_at >= DATE_TRUNC('month', NOW())
        AND start_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month';
    WHEN 'dentist' THEN
      -- Contar dentistas activos en clínicas del therapist (si es admin de clínica)
      SELECT COUNT(*) INTO v_current_usage
      FROM public.clinic_therapists ct
      WHERE ct.clinic_id IN (
        SELECT c.id FROM public.clinics c WHERE c.therapist_id = p_therapist_id
      )
      AND ct.is_active = true;
  END CASE;

  -- Si no se pudo calcular usage (table might not exist), fail-safe OK
  IF v_current_usage IS NULL THEN
    RETURN true;
  END IF;

  RETURN v_current_usage < v_limit;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'check_plan_limit error: % — %', SQLSTATE, SQLERRM;
    -- Fail-safe OPEN (permitir operación) en caso de error inesperado para no romper UX.
    -- Trade-off: bug podría permitir exceso temporal, pero preserva continuidad operacional.
    RETURN true;
END $$;

-- Grant execute al rol authenticated
GRANT EXECUTE ON FUNCTION public.check_plan_limit(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.check_plan_limit(uuid, text) IS
  'Verifica si un therapist puede crear un nuevo recurso sin exceder límites de su plan activo. resource_type: patient | appointment | dentist | box. Retorna true si permitido. SCOPE: box siempre retorna true (enforcement diferido).';

-- ============================================================
-- SECTION 5: SEED 4 planes (UPSERT idempotente)
-- ============================================================
-- NOTA: usamos slug como ON CONFLICT key. Confirmar que existe unique constraint.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.subscription_plans'::regclass
      AND contype = 'u'
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.subscription_plans'::regclass AND attname = 'slug')]
  ) THEN
    -- Si no hay unique constraint en slug, crear uno (defensive)
    ALTER TABLE public.subscription_plans ADD CONSTRAINT subscription_plans_slug_unique UNIQUE (slug);
    RAISE NOTICE 'Added unique constraint on subscription_plans.slug';
  END IF;
END $$;

INSERT INTO public.subscription_plans (
  slug, name, price, billing_cycle, is_active,
  max_dentists, max_boxes, patient_limit, appointment_limit,
  trial_days, annual_discount_percent
)
VALUES
  ('free',           'Free',            0,     'monthly', true,  1,    0,    5,    15,   0,  0),
  ('individual',     'Individual',      14990, 'monthly', true,  1,    1,    NULL, NULL, 30, 15),
  ('clinic_pro',     'Clínica Pro',     24990, 'monthly', true,  5,    3,    NULL, NULL, 30, 15),
  ('clinic_premium', 'Clínica Premium', 39990, 'monthly', true,  NULL, NULL, NULL, NULL, 30, 15)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  billing_cycle = EXCLUDED.billing_cycle,
  is_active = EXCLUDED.is_active,
  max_dentists = EXCLUDED.max_dentists,
  max_boxes = EXCLUDED.max_boxes,
  patient_limit = EXCLUDED.patient_limit,
  appointment_limit = EXCLUDED.appointment_limit,
  trial_days = EXCLUDED.trial_days,
  annual_discount_percent = EXCLUDED.annual_discount_percent,
  updated_at = NOW();

-- ============================================================
-- SECTION 6: Migración del placeholder 'profesional' (D-01)
-- Phase A confirmó: 1 sub activa con plan_name='profesional' (therapist 4e55fb74...)
-- ============================================================
UPDATE public.therapist_subscriptions
SET plan_name = 'individual',
    updated_at = NOW()
WHERE plan_name = 'profesional'
  AND status = 'active';

UPDATE public.subscription_plans
SET is_active = false,
    updated_at = NOW()
WHERE slug = 'profesional';

-- ============================================================
-- SECTION 7: Seed cupón BETA-3M-2026
-- ============================================================
INSERT INTO public.discount_coupons (
  code, discount_type, discount_value, coupon_type, is_active,
  valid_from, expiration_date, max_uses, current_uses,
  max_renewals, applicable_plans, description
)
VALUES (
  'BETA-3M-2026',
  'percentage',
  100,
  'membership',
  true,
  NOW(),
  NOW() + INTERVAL '180 days',
  30,
  0,
  3,
  ARRAY['individual', 'clinic_pro'],
  'Cupón beta DentalSpot — 3 meses gratis para primeros 30 dentistas. Se renueva automáticamente a precio real del plan post-3 ciclos mensuales.'
)
ON CONFLICT (code) DO UPDATE SET
  discount_value = EXCLUDED.discount_value,
  coupon_type = EXCLUDED.coupon_type,
  is_active = EXCLUDED.is_active,
  valid_from = EXCLUDED.valid_from,
  expiration_date = EXCLUDED.expiration_date,
  max_uses = EXCLUDED.max_uses,
  max_renewals = EXCLUDED.max_renewals,
  applicable_plans = EXCLUDED.applicable_plans,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================
-- POST-CHECK: validaciones de estado final
-- ============================================================
DO $$
DECLARE
  expected_plans TEXT[] := ARRAY['free', 'individual', 'clinic_pro', 'clinic_premium'];
  s TEXT;
  plan_count INTEGER;
  coupon_renewals INTEGER;
BEGIN
  -- Verificar los 4 planes existen con is_active=true
  FOREACH s IN ARRAY expected_plans LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.subscription_plans
      WHERE slug = s AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Plan % missing or not active after seed', s;
    END IF;
  END LOOP;

  -- Verificar exactly 4 planes activos en scope (pueden haber más activos fuera del scope MVP)
  SELECT COUNT(*) INTO plan_count
  FROM public.subscription_plans
  WHERE is_active = true
    AND slug IN ('free', 'individual', 'clinic_pro', 'clinic_premium');
  IF plan_count != 4 THEN
    RAISE EXCEPTION 'Expected 4 active plans in scope, found %', plan_count;
  END IF;

  -- Verificar cupón BETA-3M-2026 existe + max_renewals=3
  SELECT max_renewals INTO coupon_renewals
  FROM public.discount_coupons
  WHERE code = 'BETA-3M-2026' AND is_active = true;
  IF coupon_renewals != 3 THEN
    RAISE EXCEPTION 'BETA-3M-2026 coupon missing or max_renewals != 3 (got %)', coupon_renewals;
  END IF;

  -- Verificar plan 'profesional' desactivado
  IF EXISTS (
    SELECT 1 FROM public.subscription_plans
    WHERE slug = 'profesional' AND is_active = true
  ) THEN
    RAISE WARNING 'profesional plan still active — check if intentional';
  END IF;

  -- Verificar que ninguna sub activa quedó apuntando a 'profesional'
  IF EXISTS (
    SELECT 1 FROM public.therapist_subscriptions
    WHERE plan_name = 'profesional' AND status = 'active'
  ) THEN
    RAISE WARNING 'Active subscription(s) still reference profesional plan_name';
  END IF;

  -- Verificar que la función check_plan_limit se creó
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'check_plan_limit' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname='public')
  ) THEN
    RAISE EXCEPTION 'check_plan_limit RPC function missing';
  END IF;

  RAISE NOTICE '✓ Post-check passed: 4 plans active, BETA-3M-2026 configured, RPC check_plan_limit ready';
END $$;
