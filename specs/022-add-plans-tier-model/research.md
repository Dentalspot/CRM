# Research — Spec 022 Add Plans Tier Model

**Phase**: 0 (Outline & Research)
**Date**: 2026-04-22
**Plan**: [plan.md](./plan.md)

---

## 1. Research de mercado (ya ejecutado previamente)

Research de competencia Chile dental ejecutado vía WebSearch el 2026-04-22. Findings resumidos:

| Software | Plan base (CLP/mes) | Per-seat | Nota |
|---|---|---|---|
| CIMADent | $15.000 (dent principal) | $7.500 adicional | Transparente, dental-specific |
| AgendaPro Individual | $15.900 + IVA | — | Genérico multi-vertical |
| AgendaPro Básico | $34.900 + IVA | — | Genérico, hasta 20 users |
| Dentalink | ~$27.500 (USD $29) | Per-user | Líder chileno, cotización |
| Dentalware | N/D | — | 3 tiers (Basic 3u / Impulse 15u / Clinic 25u) |
| Nexden Esencial | GRATIS | — | Freemium |

**Conclusión de research**: DentalSpot con $14.990 / $24.990 / $39.990 se posiciona 45-84% más barato que Dentalink, matching CIMADent en Individual pero con mejor relación features/precio en Clínica.

---

## 2. Queries empíricas Phase A (a ejecutar pre-implement)

### A.1 — Estado actual `subscription_plans`

```sql
SELECT slug, name, price, is_active,
       (SELECT COUNT(*) FROM therapist_subscriptions WHERE plan_name = sp.slug) AS active_subs
FROM subscription_plans sp
ORDER BY price ASC;
```

**Expected output**:
```
slug        | name        | price | is_active | active_subs
profesional | Profesional | 20000 | true      | 1
```

(La sub activa es del cupón 100% de ayer — `brand='other'` en Query γ spec 019)

**Decisión Phase A según output**:
- Si hay **1 sub active** con `plan_name='profesional'` → Migration hace UPDATE de esa sub para `plan_name='individual'` antes de desactivar `profesional`
- Si hay **0 subs** → Migration simplemente INSERT los 4 nuevos + marca `profesional` como `is_active=false`
- Si hay **>1 subs** → detenerse, investigar qué sobreviene (improbable pero cubrir edge)

### A.2 — Estado `therapist_subscriptions`

```sql
SELECT id, therapist_id, plan_name, status, billing_cycle,
       created_at, current_period_end
FROM therapist_subscriptions
WHERE status = 'active'
ORDER BY created_at DESC;
```

**Expected**: 1 row (la del cupón 100% de ayer). Si hay más → confirmar que ninguna se rompe con la migration.

### A.3 — Estado `discount_coupons`

```sql
SELECT code, discount_type, discount_value, coupon_type, is_active,
       max_uses, current_uses, applicable_plans
FROM discount_coupons
ORDER BY created_at DESC;
```

**Expected**: varios cupones existentes (NOTIZ-FREE30, PLANTILLA-FREE30 del seed original). Ninguno debería ser `BETA-3M-2026` (nuevo de este spec).

### A.4 — Nombre exacto tabla de sillones

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name ILIKE '%box%' OR table_name ILIKE '%sillon%' OR table_name ILIKE '%chair%')
ORDER BY table_name;
```

**Expected**: probablemente `clinical_boxes` o `clinic_boxes` (confirmar).

Si no existe tabla → el enforcement de `max_boxes` se difiere (opción: crear la tabla en este spec o spec futuro).

### A.5 — Conteo de patients + appointments + clinic_therapists (baseline para enforcement)

```sql
SELECT
  (SELECT COUNT(*) FROM patients WHERE deleted_at IS NULL) AS total_patients,
  (SELECT COUNT(*) FROM appointments WHERE start_at >= DATE_TRUNC('month', NOW())) AS appointments_this_month,
  (SELECT COUNT(*) FROM clinic_therapists WHERE is_active = true) AS active_clinic_therapists;
```

Sirve como baseline de uso actual (para calibrar límites si fuera necesario) + confirmación de columnas exactas que usará el enforcement.

---

## 3. F-014 fix preservation inventory

### Líneas intactas de `create-mp-checkout/index.ts` (líneas aprox 69-148)

Lista exacta de lo que **NO puede cambiar**:

```typescript
// Línea 71: chargePrice inicializado server-side desde DB
let chargePrice = plan.price

// Línea 72: tracking del cupón validado (no del input cliente)
let validatedCouponCode: string | null = null

// Líneas 74-86: lookup coupon desde DB por code del cliente (sin aceptar precio del cliente)
if (coupon_code) {
  const { data: coupon, error } = await supabase
    .from('discount_coupons')
    .select('...')
    .eq('code', coupon_code)
    .maybeSingle()
  if (couponError || !coupon) return 400 "Cupón inválido"

// Líneas 88-127: 7 validaciones server-side del cupón
  // is_active, valid_from, expiration_date, max_uses, applicable_plans, min_purchase_amount

// Líneas 129-148: cálculo server-side de chargePrice según discount_type
  if (coupon.discount_type === 'percentage') {
    chargePrice = Math.round(basePrice * (1 - pct / 100))
  } else if (coupon.discount_type === 'fixed') {
    chargePrice = Math.max(basePrice - discount, 0)
  }
  validatedCouponCode = coupon.code  // del DB, no del input
}
```

### Puntos de extensión (Phase C)

**DESPUÉS de línea 148** (chargePrice ya calculado):

```typescript
// NEW: Billing cycle handling (FR-019, FR-020)
const billing_cycle = body.billing_cycle || 'monthly'  // default monthly
if (billing_cycle === 'annual' && plan.annual_discount_percent) {
  // Para anual: chargePrice × 12 × (1 - annual_discount_percent/100)
  chargePrice = Math.round(chargePrice * 12 * (1 - plan.annual_discount_percent / 100))
}

// NEW: Renewal counter tracking para cupones con max_renewals (FR-015)
let currentRenewalCount = 0
let appliedCouponCode: string | null = null
if (validatedCouponCode && coupon.max_renewals !== null && coupon.max_renewals !== undefined) {
  currentRenewalCount = 1  // primer pago con cupón
  appliedCouponCode = validatedCouponCode
}

// Continúa con creación de preference (líneas existentes 150+), pero:
// - el preference usa el chargePrice correcto (monthly o annual)
// - al persistir en therapist_subscriptions, incluir:
//   - billing_cycle
//   - current_renewal_count
//   - applied_coupon_code
```

### Puntos de extensión en `mercadopago-webhook/index.ts`

Dentro de `handlePayment()` cuando `payment.status === 'approved'`, **DESPUÉS de UPDATE existente** (línea ~145-159):

```typescript
// NEW: Si la sub tiene applied_coupon_code + max_renewals, incrementar counter (FR-015, FR-016)
const { data: subWithCoupon } = await supabase
  .from('therapist_subscriptions')
  .select('id, applied_coupon_code, current_renewal_count')
  .eq('external_reference', payment.external_reference)
  .maybeSingle()

if (subWithCoupon?.applied_coupon_code) {
  const { data: coupon } = await supabase
    .from('discount_coupons')
    .select('max_renewals')
    .eq('code', subWithCoupon.applied_coupon_code)
    .maybeSingle()

  if (coupon?.max_renewals && subWithCoupon.current_renewal_count < coupon.max_renewals) {
    await supabase.from('therapist_subscriptions')
      .update({ current_renewal_count: subWithCoupon.current_renewal_count + 1 })
      .eq('id', subWithCoupon.id)
  }
}
```

---

## 4. Design decisions

### D-01: Migración del placeholder `profesional` → `individual`

**Decisión**: UPDATE del plan_name en therapist_subscriptions activas antes de desactivar plan `profesional`.

**Rationale**:
- Preserva la sub activa existente sin romper RLS references
- Idempotente (el UPDATE es reversible)
- Minimiza impacto a Danissa (sub quedará nominalmente vinculada a `individual`, plan activo que sí existe)

**Alternativa rechazada**: crear plan `individual` nuevo y dejar `profesional` activo como legacy. Rechazada porque introduce noise en la tabla.

### D-02: Server-side enforcement via RPC SQL function

**Decisión**: Crear function SQL `check_plan_limit(therapist_id, resource_type)` que retorna boolean. Invocada desde frontend via `supabase.rpc()` antes de cada INSERT.

**Rationale**:
- No requiere nueva edge function (más simple, menos latencia)
- RLS ya asegura que el user solo pueda checar su propio therapist_id
- Escalable: agregar nuevos resource_types sin cambiar arquitectura

**Alternativa rechazada**: edge function dedicada `validate-plan-limit`. Rechazada por overhead innecesario.

**Alternativa futura**: RLS policy con función que bloquee INSERT directamente (más robusto, más complejo — scope de spec futuro si se detecta abuso).

### D-03: Annual billing = pago único MP, no PreApproval

**Decisión**: MVP usa `checkout/preferences` estándar con `unit_price = total_anual`. NO integra PreApproval MP para recurrencia anual automática.

**Rationale**:
- Simplifica implementación (reusar flow de checkout mensual existente)
- El usuario paga 1 vez por 12 meses, la renovación año-a-año se gestiona manualmente o vía notificación email antes del día 365 (spec futuro)
- MP Checkout Pro sin PreApproval funciona para montos hasta ~$500k CLP (bien por debajo de nuestros anuales)

**Alternativa rechazada**: PreApproval MP para recurrencia automática. Rechazada porque agrega complejidad fuera del MVP.

### D-04: Cupón BETA-3M-2026 con `max_renewals=3`

**Decisión**: Counter `current_renewal_count` en `therapist_subscriptions`, incrementado en webhook. Cuando counter ≥ max_renewals, siguiente create-mp-checkout no aplica cupón.

**Rationale**:
- Estado persistente en DB (no en cliente)
- Degradación automática a precio real sin intervención
- Audit trail via sub.current_renewal_count history

**Riesgo conocido**: F-002 idempotency del audit spec 019 sin resolver → si webhook se duplica, counter podría inflarse. Mitigación: documentar como known issue, monitoring manual, fix definitivo en meta-spec MP.

### D-05: Enforcement modals usan `PlanUpgradeModal` genérico

**Decisión**: 1 componente `PlanUpgradeModal` reusable para los 4 casos (patient, appointment, dentist, box). Props: `resourceType`, `currentPlan`, `suggestedPlan`, `onUpgrade`.

**Rationale**:
- DRY (Don't Repeat Yourself)
- Consistencia UX entre los 4 enforcement points
- Fácil de refinar copy centrally

### D-06: Sin migración de datos existentes

**Decisión**: La sub activa existente (cupón 100% yesterday) mantiene sus datos. Solo se migra `plan_name='profesional'` → `'individual'`. Campos nuevos (`current_renewal_count`, `applied_coupon_code`, `billing_cycle`) quedan NULL por default para subs existentes.

**Rationale**:
- Minimiza riesgo
- Los defaults SQL (`current_renewal_count DEFAULT 0`) cubren el caso
- La sub activa actual ya expiró (o expira pronto) — no es production data crítica

### D-07: Free plan sin checkout MP

**Decisión**: CTA "Empezar gratis" del Free plan NO invoca `create-mp-checkout`. Simplemente activa el plan directamente en DB (INSERT en therapist_subscriptions con plan_name='free').

**Rationale**:
- Free es $0, no hay razón para invocar MP
- Simplifica UX (registro directo sin fricción)
- Replica patrón de `activateFreeCouponPlan` existente

### D-08: Toggle Mensual/Anual persiste en URL query param

**Decisión**: Toggle agrega `?billing=monthly|annual` a URL. Permite linkear directo a "plan anual" desde emails/ads.

**Rationale**:
- SEO / marketing (ej. campaña "Ahorra 15% pagando anual" → link directo)
- State persistence sin cookies
- Fácil de testear

---

## 5. Pre-flight checklist Phase A

| # | Check | Comando / método | Criterio PASS |
|---|---|---|---|
| A1 | Estado `subscription_plans` | Query 2.1 | 1 row `profesional`, 1 sub activa |
| A2 | Estado `therapist_subscriptions` | Query 2.2 | 1 row activa, no-MP (cupón 100%) |
| A3 | `discount_coupons` existentes | Query 2.3 | NO existe `BETA-3M-2026` previo |
| A4 | Nombre tabla boxes | Query 2.4 | Tabla existe (confirmar nombre exacto) |
| A5 | F-014 fix intacto | `grep "chargePrice = plan.price" supabase/functions/create-mp-checkout/` | 1 match en línea ~71 |

---

## 6. NEEDS CLARIFICATION resolution

**Resultado**: 0 markers activos. Todas las decisiones ambiguas están resueltas explícitamente en D-01 a D-08 o diferidas a Phase A del plan con criterios verificables.

---

## Next

- [data-model.md](./data-model.md) — tabla exhaustiva de migration + entities extended + signatures preservation
- [quickstart.md](./quickstart.md) — guía ejecutable con 7 phases A-G
- `/speckit-tasks` o implement directo post-plan
