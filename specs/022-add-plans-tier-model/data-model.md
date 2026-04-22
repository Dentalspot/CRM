# Data Model — Spec 022 Add Plans Tier Model

**Phase**: 1 (Design & Contracts)
**Date**: 2026-04-22
**Plan**: [plan.md](./plan.md)
**Research**: [research.md](./research.md)

---

## Overview

Este spec **extiende 3 tablas existentes** + inserta seed data (4 planes + 1 cupón). **No crea tablas nuevas**. Incluye también: function SQL `check_plan_limit` para enforcement server-side (RPC).

---

## 1. Schema changes (migration única)

### 1.1 Nombre de archivo
```
supabase/migrations/20260422230000_add_plans_tier_model.sql
```
(Timestamp aproximado, ajustar al momento exacto de creación para idempotencia orden)

### 1.2 ALTER TABLE `subscription_plans`

| Columna nueva | Tipo | Default | Nullable | Propósito |
|---|---|---|---|---|
| `max_dentists` | integer | NULL | YES | NULL=ilimitado. Aplica enforcement de invitaciones a clínica. |
| `max_boxes` | integer | NULL | YES | NULL=ilimitado. Aplica enforcement de sillones. |
| `patient_limit` | integer | NULL | YES | NULL=ilimitado. Aplica enforcement de pacientes. |
| `appointment_limit` | integer | NULL | YES | NULL=ilimitado. Aplica por mes calendario. |
| `trial_days` | integer | 30 | NO | 0 para Free (permanente), 30 para paid plans. |
| `annual_discount_percent` | integer | 15 | NO | % descuento si billing_cycle='annual'. 0 para Free. |

**SQL**:
```sql
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS max_dentists integer,
  ADD COLUMN IF NOT EXISTS max_boxes integer,
  ADD COLUMN IF NOT EXISTS patient_limit integer,
  ADD COLUMN IF NOT EXISTS appointment_limit integer,
  ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT 30 NOT NULL,
  ADD COLUMN IF NOT EXISTS annual_discount_percent integer DEFAULT 15 NOT NULL;

-- Opcional: CHECK constraints (reversibles)
ALTER TABLE public.subscription_plans
  ADD CONSTRAINT IF NOT EXISTS subscription_plans_max_dentists_positive
    CHECK (max_dentists IS NULL OR max_dentists >= 0);
ALTER TABLE public.subscription_plans
  ADD CONSTRAINT IF NOT EXISTS subscription_plans_max_boxes_positive
    CHECK (max_boxes IS NULL OR max_boxes >= 0);
```

### 1.3 ALTER TABLE `discount_coupons`

| Columna nueva | Tipo | Default | Nullable | Propósito |
|---|---|---|---|---|
| `max_renewals` | integer | NULL | YES | NULL = sin límite de renovaciones (un solo uso). Si N, se aplica hasta N ciclos consecutivos. |

**SQL**:
```sql
ALTER TABLE public.discount_coupons
  ADD COLUMN IF NOT EXISTS max_renewals integer;
```

### 1.4 ALTER TABLE `therapist_subscriptions`

| Columna nueva | Tipo | Default | Nullable | Propósito |
|---|---|---|---|---|
| `current_renewal_count` | integer | 0 | NO | Contador de ciclos procesados con cupón. Incrementa en cada pago recurrente. |
| `applied_coupon_code` | text | NULL | YES | Referencia al cupón aplicado (si alguno). NULL si sin cupón. |

**SQL**:
```sql
ALTER TABLE public.therapist_subscriptions
  ADD COLUMN IF NOT EXISTS current_renewal_count integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS applied_coupon_code text;
```

---

## 2. Seed data

### 2.1 Seed 4 planes (UPSERT idempotente)

```sql
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
  is_active = EXCLUDED.is_active,
  max_dentists = EXCLUDED.max_dentists,
  max_boxes = EXCLUDED.max_boxes,
  patient_limit = EXCLUDED.patient_limit,
  appointment_limit = EXCLUDED.appointment_limit,
  trial_days = EXCLUDED.trial_days,
  annual_discount_percent = EXCLUDED.annual_discount_percent,
  updated_at = NOW();
```

### 2.2 Migración placeholder `profesional` (D-01)

```sql
-- Si hay suscripción activa con plan_name='profesional', actualizar a 'individual'
UPDATE public.therapist_subscriptions
SET plan_name = 'individual',
    updated_at = NOW()
WHERE plan_name = 'profesional'
  AND status = 'active';

-- Desactivar el plan 'profesional' obsoleto
UPDATE public.subscription_plans
SET is_active = false,
    updated_at = NOW()
WHERE slug = 'profesional'
  AND is_active = true;
```

### 2.3 Seed cupón BETA-3M-2026

```sql
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
  'Cupón beta DentalSpot — 3 meses gratis para primeros 30 dentistas. Renueva automáticamente a precio real post-3 ciclos.'
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
```

---

## 3. Pre-check + Post-check DO $ blocks

### 3.1 Pre-check (antes de ALTERs)

```sql
DO $$
BEGIN
  -- Tablas requeridas existen
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename='subscription_plans' AND schemaname='public') THEN
    RAISE EXCEPTION 'subscription_plans table missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename='discount_coupons' AND schemaname='public') THEN
    RAISE EXCEPTION 'discount_coupons table missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename='therapist_subscriptions' AND schemaname='public') THEN
    RAISE EXCEPTION 'therapist_subscriptions table missing';
  END IF;

  -- RLS está activo en subscription_plans (debe mantenerse)
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname='subscription_plans' AND n.nspname='public' AND c.relrowsecurity=true
  ) THEN
    RAISE WARNING 'subscription_plans does not have RLS enabled';
  END IF;
END $$;
```

### 3.2 Post-check (después de seed)

```sql
DO $$
DECLARE
  expected_plans TEXT[] := ARRAY['free', 'individual', 'clinic_pro', 'clinic_premium'];
  s TEXT;
  plan_count INTEGER;
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

  -- Verificar exactly 4 planes activos (ni más ni menos)
  SELECT COUNT(*) INTO plan_count
  FROM public.subscription_plans
  WHERE is_active = true
    AND slug IN ('free', 'individual', 'clinic_pro', 'clinic_premium');
  IF plan_count != 4 THEN
    RAISE EXCEPTION 'Expected 4 active plans, found %', plan_count;
  END IF;

  -- Verificar cupón BETA-3M-2026 existe
  IF NOT EXISTS (
    SELECT 1 FROM public.discount_coupons
    WHERE code = 'BETA-3M-2026' AND is_active = true AND max_renewals = 3
  ) THEN
    RAISE EXCEPTION 'BETA-3M-2026 coupon missing or misconfigured';
  END IF;

  -- Verificar plan 'profesional' desactivado (si existía)
  IF EXISTS (
    SELECT 1 FROM public.subscription_plans
    WHERE slug = 'profesional' AND is_active = true
  ) THEN
    RAISE WARNING 'profesional plan still active after migration — check if intentional';
  END IF;

  -- Verificar no quedó ninguna sub activa apuntando al plan 'profesional'
  IF EXISTS (
    SELECT 1 FROM public.therapist_subscriptions
    WHERE plan_name = 'profesional' AND status = 'active'
  ) THEN
    RAISE WARNING 'Active subscriptions still referencing profesional plan';
  END IF;

  RAISE NOTICE 'Post-check passed: 4 plans active, coupon BETA-3M-2026 OK';
END $$;
```

---

## 4. RPC function `check_plan_limit` (server-side enforcement)

### 4.1 Function definition

```sql
CREATE OR REPLACE FUNCTION public.check_plan_limit(
  p_therapist_id uuid,
  p_resource_type text  -- 'patient' | 'appointment' | 'dentist' | 'box'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_slug text;
  v_plan_limits record;
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
  SELECT
    max_dentists, max_boxes, patient_limit, appointment_limit
  INTO v_plan_limits
  FROM public.subscription_plans
  WHERE slug = v_plan_slug AND is_active = true;

  -- Resolver límite según resource_type
  CASE p_resource_type
    WHEN 'patient' THEN v_limit := v_plan_limits.patient_limit;
    WHEN 'appointment' THEN v_limit := v_plan_limits.appointment_limit;
    WHEN 'dentist' THEN v_limit := v_plan_limits.max_dentists;
    WHEN 'box' THEN v_limit := v_plan_limits.max_boxes;
    ELSE RETURN false;
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
        AND (deleted_at IS NULL OR deleted_at > NOW());
    WHEN 'appointment' THEN
      SELECT COUNT(*) INTO v_current_usage
      FROM public.appointments
      WHERE therapist_id = p_therapist_id
        AND start_at >= DATE_TRUNC('month', NOW())
        AND start_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month';
    WHEN 'dentist' THEN
      -- Contar dentistas activos en la clínica del therapist (si aplica)
      -- Simplificación: si no es admin de clínica, siempre OK
      SELECT COUNT(*) INTO v_current_usage
      FROM public.clinic_therapists ct
      WHERE ct.clinic_id IN (
        SELECT c.id FROM public.clinics c WHERE c.therapist_id = p_therapist_id
      )
      AND ct.is_active = true;
    WHEN 'box' THEN
      -- Nombre exacto de tabla confirmar Phase A (clinical_boxes, clinic_boxes, boxes?)
      -- Placeholder:
      SELECT COUNT(*) INTO v_current_usage
      FROM public.clinical_boxes cb
      WHERE cb.clinic_id IN (
        SELECT c.id FROM public.clinics c WHERE c.therapist_id = p_therapist_id
      );
  END CASE;

  RETURN v_current_usage < v_limit;
END $$;

-- Grant execute al rol authenticated
GRANT EXECUTE ON FUNCTION public.check_plan_limit(uuid, text) TO authenticated;
```

### 4.2 Uso desde frontend

```javascript
// Antes de crear un paciente:
const { data: canCreate, error } = await supabase.rpc('check_plan_limit', {
  p_therapist_id: currentUser.id,
  p_resource_type: 'patient'
})

if (!canCreate) {
  // Mostrar PlanUpgradeModal
  return
}
// Continuar con INSERT
```

### 4.3 Security considerations

- `SECURITY DEFINER` → función corre con permisos del owner (evita RLS issues para queries internas)
- `GRANT EXECUTE` solo a `authenticated` (no anon) → previene abuse sin auth
- El parámetro `p_therapist_id` viene del client, pero RLS en las tablas underlying (patients, appointments, etc.) asegura que el user solo pueda leer sus propios recursos (defense in depth)
- Si user malicioso invoca con `p_therapist_id` de otro user, obtendrá su count, pero no puede actuar sobre él (INSERTs protegidos por RLS separadas)

---

## 5. Entities extended

### 5.1 `subscription_plans` (post-migration)

```typescript
interface SubscriptionPlan {
  id: uuid
  slug: 'free' | 'individual' | 'clinic_pro' | 'clinic_premium' | 'profesional' (deprecated)
  name: string
  price: number  // CLP sin IVA
  billing_cycle: 'monthly' | 'annual'  // existente
  is_active: boolean
  max_dentists: number | null  // NEW (NULL = ∞)
  max_boxes: number | null  // NEW
  patient_limit: number | null  // NEW
  appointment_limit: number | null  // NEW (por mes calendario)
  trial_days: number  // NEW (0 para Free)
  annual_discount_percent: number  // NEW (15 para paid, 0 para Free)
  created_at, updated_at
}
```

### 5.2 `discount_coupons` (post-migration)

```typescript
interface DiscountCoupon {
  id: uuid
  code: string  // ej: 'BETA-3M-2026'
  discount_type: 'percentage' | 'fixed'
  discount_value: number  // 100 para BETA (100%)
  coupon_type: 'membership' | 'marketplace' | ...
  is_active: boolean
  valid_from, expiration_date: timestamptz
  max_uses, current_uses: number
  max_renewals: number | null  // NEW (NULL = un solo uso, N = aplicable N ciclos)
  applicable_plans: text[]  // ej: ['individual', 'clinic_pro']
  // ... otros campos existentes
}
```

### 5.3 `therapist_subscriptions` (post-migration)

```typescript
interface TherapistSubscription {
  id: uuid
  therapist_id: uuid
  plan_name: string  // slug del plan
  status: 'pending' | 'active' | 'cancelled' | 'expired' | ...
  billing_cycle: 'monthly' | 'annual'
  price: number
  external_reference: string  // 'dentalspot_sub_*' (post-spec 020)
  preference_id: string
  current_period_start, current_period_end: date
  payment_status, payment_method: string | null
  current_renewal_count: number  // NEW (default 0)
  applied_coupon_code: string | null  // NEW
  // ... otros campos existentes
}
```

---

## 6. Signatures preservadas (F-014 + spec 020)

### `create-mp-checkout` input (preservado 100%)

```typescript
// Body request actual (NO se modifica):
{
  plan_name: string,        // slug del plan
  therapist_id: string,     // UUID
  payer_email: string,
  payer_name?: string,
  coupon_code?: string
}

// Body request EXTENDIDO (opcional, backward-compatible):
{
  ...above,
  billing_cycle?: 'monthly' | 'annual'  // NEW (default 'monthly')
}
```

### `create-mp-checkout` output (preservado + 1 campo NEW)

```typescript
{
  success: boolean,
  init_point: string,
  sandbox_init_point: string,
  preference_id: string,
  external_reference: string,
  // NEW field (optional):
  applied_coupon_info?: {
    code: string,
    renewals_remaining: number  // max_renewals - current_renewal_count
  }
}
```

### `mercadopago-webhook` (sin cambios en signature)

- Body request: mismo formato MP event
- Response: 200 OK siempre (preservando F-003 legacy — fix pendiente en meta-spec)
- Internamente: logic extendida para incrementar `current_renewal_count`

---

## 7. Enforcement flow diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ Usuario intenta crear paciente (o appointment/dentist/box)         │
└──────────────────────┬──────────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: useActivePlanLimits.canCreate('patient')                  │
│  → RPC supabase.rpc('check_plan_limit', {...})                      │
└──────────────────────┬──────────────────────────────────────────────┘
                       ▼
               ┌───────┴────────┐
               │ canCreate?     │
               └───┬─────────┬──┘
                   │ false   │ true
                   ▼         ▼
         ┌─────────────┐   ┌───────────────────────────┐
         │ Mostrar     │   │ Continuar INSERT normal   │
         │ PlanUpgrade │   │ (RLS policies existentes) │
         │ Modal       │   └───────────────────────────┘
         └─────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │ User clicks     │
         │ "Upgrade"       │
         │ → redirect a    │
         │ /membership/    │
         │ plans           │
         └─────────────────┘
```

---

## 8. Annual pricing calculation

**Fórmula**: `annual_total = price × 12 × (1 - annual_discount_percent/100)`

### Ejemplos

| Plan | Precio mensual | × 12 | × 0.85 (15% off) | = Anual total |
|---|---|---|---|---|
| Individual | $14.990 | $179.880 | × 0.85 | **$152.898** |
| Clínica Pro | $24.990 | $299.880 | × 0.85 | **$254.898** |
| Clínica Premium | $39.990 | $479.880 | × 0.85 | **$407.898** |

**Display UX** (toggle Anual):
- Mostrar "$12.742/mes* facturado anual" (para Individual)
- `*` pie de página: "Cobrado como pago único de $152.898 al año"

---

## Next

- [quickstart.md](./quickstart.md) — guía ejecutable con 7 phases A-G, comandos copy-paste, rollback procedures
- `/speckit-tasks` (opcional) o implement directo
