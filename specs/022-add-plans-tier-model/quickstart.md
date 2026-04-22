# Quickstart — Spec 022 Add Plans Tier Model

**Phase**: 1 (Design & Contracts — Ejecución guide)
**Date**: 2026-04-22
**Plan**: [plan.md](./plan.md)

Guía step-by-step ejecutable para `/speckit-implement` o ejecución manual. 7 phases A-G. **Tiempo total estimado: 10.5-14.5 h** partibles en 2-3 sesiones.

---

## Pre-requisitos ✅

### Ya completados en sesiones previas
- ✅ Supabase CLI v2.90.0 autenticado + proyecto linked
- ✅ Branch `022-add-plans-tier-model` checked out
- ✅ Dominio `dentalspot.cl` responde
- ✅ Cuenta MP DentalSpot configurada (specs 020/021)
- ✅ F-014 fix aplicado (commit 3593b12) — preservación mandatoria

### Antes de arrancar Phase A
- [ ] Terminal en `/Users/danissaklagges/Documents/DENTALSPOT/`
- [ ] Acceso a SQL Editor Supabase
- [ ] 9-14 h disponibles (o plan de 2-3 sesiones)

---

## Phase A — Pre-flight verification (~30 min)

### A1. Estado actual `subscription_plans`

```sql
SELECT slug, name, price, is_active,
       (SELECT COUNT(*) FROM therapist_subscriptions WHERE plan_name = sp.slug) AS active_subs
FROM subscription_plans sp ORDER BY price ASC;
```

**Anotar output** — si hay sub activa con `plan_name='profesional'`, confirmar para migración en Phase B.

### A2. Estado `therapist_subscriptions` activas

```sql
SELECT id, therapist_id, plan_name, status, billing_cycle
FROM therapist_subscriptions WHERE status = 'active';
```

### A3. Cupones existentes (verificar que BETA-3M-2026 no existe aún)

```sql
SELECT code FROM discount_coupons WHERE code = 'BETA-3M-2026';
```
**Expected**: 0 rows.

### A4. Nombre exacto tabla de sillones/boxes

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name ILIKE '%box%' OR table_name ILIKE '%sillon%' OR table_name ILIKE '%chair%')
ORDER BY table_name;
```

**Anotar resultado** — usar el nombre exacto en RPC function de Phase B.

### A5. F-014 fix preservation check

```bash
grep -n "let chargePrice = plan.price" supabase/functions/create-mp-checkout/index.ts
```
**Expected**: 1 match en línea ~71. Si NO está, STOP — F-014 se perdió, necesita restore antes de continuar.

### A6. Working tree limpio

```bash
git status --short && git branch --show-current
```

### 🟢 SP-A checkpoint

- [ ] A1-A6 completados
- [ ] Decisión tomada sobre migración del placeholder `profesional`
- [ ] Nombre exacto tabla boxes confirmado

---

## Phase B — Migration + seed (~1-1.5 h)

### B1. Crear archivo de migración

```bash
TIMESTAMP=$(date +%Y%m%d%H%M%S)
touch "supabase/migrations/${TIMESTAMP}_add_plans_tier_model.sql"
```

### B2. Contenido del archivo

Copiar de `data-model.md §1, §2, §3, §4` en orden:
1. Pre-check DO $ block (§3.1)
2. ALTER TABLE subscription_plans (§1.2)
3. ALTER TABLE discount_coupons (§1.3)
4. ALTER TABLE therapist_subscriptions (§1.4)
5. CREATE OR REPLACE FUNCTION check_plan_limit (§4.1) — ajustar nombre de tabla boxes según A4
6. Seed 4 planes UPSERT (§2.1)
7. Migración placeholder profesional (§2.2)
8. Seed cupón BETA-3M-2026 (§2.3)
9. Post-check DO $ block (§3.2)

### B3. Aplicar migración

**Opción A — Via SQL Editor Supabase** (si no hay Docker):
- Copy-paste el archivo completo en SQL Editor
- Click Run
- Verificar que ejecuta sin errors (los DO $ blocks deben retornar NOTICE)

**Opción B — Via CLI** (requiere Docker):
```bash
supabase db push --project-ref tomremkbuxvedliyywbo
```

### B4. Verificación post-aplicación

```sql
-- Verificar 4 planes activos
SELECT slug, name, price, max_dentists, max_boxes, patient_limit, appointment_limit, trial_days
FROM subscription_plans
WHERE is_active = true
ORDER BY price ASC;
-- Expected: 4 rows (free, individual, clinic_pro, clinic_premium)

-- Verificar cupón
SELECT code, discount_value, max_renewals, applicable_plans
FROM discount_coupons
WHERE code = 'BETA-3M-2026';
-- Expected: 1 row con max_renewals=3, applicable_plans={individual,clinic_pro}

-- Verificar migración profesional
SELECT slug, is_active FROM subscription_plans WHERE slug = 'profesional';
-- Expected: is_active=false

-- Verificar sub migrada (si existía con profesional)
SELECT plan_name, status FROM therapist_subscriptions WHERE status='active';
-- Expected: plan_name='individual' (no 'profesional')

-- Verificar RPC function
SELECT check_plan_limit('00000000-0000-0000-0000-000000000000'::uuid, 'patient');
-- Expected: true (sin sub, defaults a Free, patient_limit=5, current_usage=0)
```

### 🟢 SP-B checkpoint

- [ ] B1-B4 PASS
- [ ] 4 planes activos confirmados
- [ ] Cupón BETA-3M-2026 insertado
- [ ] RPC check_plan_limit callable

---

## Phase C — Edge functions update (~2-2.5 h)

### C1. `create-mp-checkout/index.ts`

Editar **después de la línea 148** (chargePrice ya calculado por F-014 logic):

```typescript
// ============================
// NEW: Billing cycle + renewal counter (spec 022)
// ============================
const { billing_cycle = 'monthly' } = body

// Annual discount: chargePrice × 12 × (1 - annual_discount_percent/100)
if (billing_cycle === 'annual' && plan.annual_discount_percent > 0) {
  chargePrice = Math.round(
    chargePrice * 12 * (1 - plan.annual_discount_percent / 100)
  )
}

// Coupon renewal tracking
let currentRenewalCount = 0
let appliedCouponCode: string | null = null
if (validatedCouponCode && coupon?.max_renewals !== null && coupon?.max_renewals !== undefined) {
  currentRenewalCount = 1
  appliedCouponCode = validatedCouponCode
}
```

Luego, cuando se INSERT/UPDATE a `therapist_subscriptions`, agregar los campos nuevos:

```typescript
// En el INSERT (línea ~223):
await supabase.from('therapist_subscriptions').insert({
  // ... campos existentes
  billing_cycle,
  current_renewal_count: currentRenewalCount,
  applied_coupon_code: appliedCouponCode,
})

// En el UPDATE (línea ~208):
await supabase.from('therapist_subscriptions').update({
  // ... campos existentes
  billing_cycle,
  current_renewal_count: currentRenewalCount,
  applied_coupon_code: appliedCouponCode,
}).eq('id', existing.id)
```

### C2. `mercadopago-webhook/index.ts`

En `handlePayment` dentro del `if (payment.status === 'approved')` y **DESPUÉS del UPDATE existente**:

```typescript
// NEW: Increment renewal counter if coupon applied (spec 022)
const { data: sub } = await supabase
  .from('therapist_subscriptions')
  .select('id, applied_coupon_code, current_renewal_count')
  .eq('external_reference', payment.external_reference)
  .maybeSingle()

if (sub?.applied_coupon_code && sub.current_renewal_count !== null) {
  const { data: coupon } = await supabase
    .from('discount_coupons')
    .select('max_renewals')
    .eq('code', sub.applied_coupon_code)
    .maybeSingle()

  if (coupon?.max_renewals && sub.current_renewal_count < coupon.max_renewals) {
    await supabase.from('therapist_subscriptions')
      .update({ current_renewal_count: sub.current_renewal_count + 1 })
      .eq('id', sub.id)
    console.log(`Coupon renewal count incremented to ${sub.current_renewal_count + 1} for sub ${sub.id}`)
  } else if (coupon?.max_renewals && sub.current_renewal_count >= coupon.max_renewals) {
    console.log(`Coupon ${sub.applied_coupon_code} exhausted for sub ${sub.id} — next billing uses full price`)
  }
}
```

### C3. Deploy

```bash
supabase functions deploy create-mp-checkout mercadopago-webhook \
  --project-ref tomremkbuxvedliyywbo
```

### C4. F-014 regression check

```bash
curl -X POST "https://tomremkbuxvedliyywbo.supabase.co/functions/v1/create-mp-checkout" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"plan_name":"individual","therapist_id":"<UUID>","payer_email":"test@dentalspot.cl","final_price":1}'
```

Luego verificar la preference creada via MP API:
```bash
curl -s "https://api.mercadopago.com/checkout/preferences/<preference_id>" \
  -H "Authorization: Bearer <MP_ACCESS_TOKEN>" | jq '.items[0].unit_price'
```

**Expected**: `14990` (no `1`). F-014 preservado ✅.

### 🟢 SP-C checkpoint

- [ ] C1 + C2 edits aplicados
- [ ] C3 deploy exitoso
- [ ] C4 F-014 regression PASS

---

## Phase D — Frontend MembershipPlansPage rebuild (~3-4 h)

### D1. Crear componentes reusables

**`src/components/membership/PlanCard.jsx`** — card de plan con CTA
**`src/components/membership/BillingCycleToggle.jsx`** — toggle Mensual/Anual -15%
**`src/components/membership/PlanUpgradeModal.jsx`** — modal bloqueante genérico

(Leer ejemplos existentes de cards en `src/components/ui/card.jsx` para estilo consistente)

### D2. Rebuild `MembershipPlansPage.jsx`

Estructura high-level:
```jsx
export default function MembershipPlansPage() {
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [plans, setPlans] = useState([])

  useEffect(() => {
    supabase.from('subscription_plans')
      .select('*').eq('is_active', true)
      .order('price', { ascending: true })
      .then(({ data }) => setPlans(data))
  }, [])

  return (
    <>
      <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map(plan => (
          <PlanCard
            key={plan.slug}
            plan={plan}
            billingCycle={billingCycle}
            isPopular={plan.slug === 'clinic_pro'}
          />
        ))}
      </div>
    </>
  )
}
```

### D3. Extender `membershipApi.js`

Agregar parámetro `billingCycle` a función de checkout:
```javascript
export async function createCheckoutSession({ planName, therapistId, payerEmail, couponCode, billingCycle = 'monthly' }) {
  const { data, error } = await supabase.functions.invoke('create-mp-checkout', {
    body: { plan_name: planName, therapist_id: therapistId, payer_email: payerEmail, coupon_code: couponCode, billing_cycle: billingCycle }
  })
  // ... rest unchanged
}
```

### D4. Smoke UX

- `npm run dev` → abrir `/dashboard/membership/plans`
- Verificar 4 cards visibles
- Toggle Anual cambia precios correctamente
- Click en "Prueba 30 días" de Individual → checkout MP sandbox
- Click en "Empezar gratis" de Free → activa plan free sin MP

### 🟢 SP-D checkpoint

- [ ] D1-D4 completados
- [ ] 4 cards render responsive
- [ ] Toggle funciona
- [ ] CTAs invocan correctamente
- [ ] Badge POPULAR en Clínica Pro

---

## Phase E — Enforcement integration (~2-3 h)

### E1. Crear `src/hooks/useActivePlanLimits.js`

```javascript
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

export function useActivePlanLimits() {
  const { user } = useAuth()
  const [state, setState] = useState({ plan: null, loading: true })

  useEffect(() => {
    if (!user) return
    // Fetch active sub + plan
    // ...
  }, [user])

  const canCreate = async (resourceType) => {
    if (!user) return false
    const { data } = await supabase.rpc('check_plan_limit', {
      p_therapist_id: user.id,
      p_resource_type: resourceType
    })
    return data === true
  }

  return { ...state, canCreate }
}
```

### E2. Integrar en 4 flows de creación

Identificar los componentes/hooks de creación en repo (Phase 0 research):
- Patient: `src/features/patients/**` o equivalente
- Appointment: `src/components/calendar/NewAppointmentForm.jsx`
- Dentist invitation: `src/components/clinic/ClinicInvitationsPanel.jsx`
- Box: `src/features/clinic-dashboard/**` o equivalente

Pattern de integración:
```javascript
const { canCreate } = useActivePlanLimits()
const [showUpgradeModal, setShowUpgradeModal] = useState(false)

async function handleCreate(...) {
  const allowed = await canCreate('patient')
  if (!allowed) {
    setShowUpgradeModal(true)
    return
  }
  // proceed with INSERT normal
}

return (
  <>
    {/* existing form */}
    {showUpgradeModal && (
      <PlanUpgradeModal
        resourceType="patient"
        onClose={() => setShowUpgradeModal(false)}
      />
    )}
  </>
)
```

### E3. Test enforcement manual

- Login como dentista test con plan Free
- Crear 5 pacientes (OK)
- Intentar crear 6º → MODAL aparece ✅
- Click "Upgrade" → redirect a `/membership/plans`
- Aplicar cupón BETA-3M-2026 → upgrade a Individual
- Volver a crear paciente → OK sin modal

### 🟢 SP-E checkpoint

- [ ] E1 hook creado y retorna data
- [ ] E2 integrado en 4 flows
- [ ] E3 test manual PASS (paciente 6º bloqueado)

---

## Phase F — Smoke test end-to-end (~1-2 h)

### F1. Flow Individual mensual

Dentista test → plan Individual → checkout MP sandbox → pago aprobado (tarjeta `5031 7557 3453 0604`, CVV 123, titular APRO).

**Verificar**:
- DB: `therapist_subscriptions` → `plan_name='individual'`, `billing_cycle='monthly'`, `status='active'`
- Preference MP muestra precio $14.990

### F2. Flow Clínica Pro anual

Toggle "Anual -15%" → elegir Clínica Pro → checkout.

**Verificar**:
- Precio en MP = $24.990 × 12 × 0.85 = **$254.898**
- DB: `billing_cycle='annual'`, `current_period_end` ~365 días

### F3. Cupón BETA-3M-2026

Checkout Individual con cupón `BETA-3M-2026`.

**Verificar**:
- Precio MP = $0
- DB: `applied_coupon_code='BETA-3M-2026'`, `current_renewal_count=1`

(Simulación de renovaciones requiere esperar 30 días reales o manipular webhooks manualmente — smoke conceptual con 1 ciclo suficiente)

### F4. F-014 regression (CRÍTICO)

Ya ejecutado en Phase C4. Re-verificar con tabla de tests:

| Test input | Expected output |
|---|---|
| `{plan: 'individual', final_price: 1}` | unit_price en preference = $14.990 |
| `{plan: 'clinic_pro', coupon: 'FAKE-CODE'}` | 400 "Cupón inválido" |
| `{plan: 'individual', coupon: 'BETA-3M-2026'}` | unit_price = $0, sub con counter=1 |

### F5. Enforcement Free plan

Manual browser test:
- Free user intenta crear pacientes 1-5: OK
- 6º paciente: MODAL
- Agendar 15 citas/mes: OK
- 16ª cita: MODAL

### F6. Enforcement Clínica Pro max_dentists

Manual: clínica con 5 dentistas invita al 6º → MODAL "upgrade a Premium".

### 🟢 SP-F checkpoint

- [ ] F1-F6 PASS (o documentados como diferidos si Phase F3/F5/F6 requieren más tiempo)
- [ ] F4 F-014 regression CRITICAL PASS

---

## Phase G — Close (~30 min)

### G1. Update `.specify/memory/architecture.md`

Agregar subsección al final:

```markdown
### Subscription plans tier model (spec 022 — 2026-04-22)

**Verdict**: ✅ RESUELTO. Modelo de 4 planes (Free/Individual/Clinic Pro/Clinic Premium)
+ trial 30 días + descuento anual 15% + cupón beta renovable 3 meses.
Último bloqueante operacional pre-launch real de cobros a dentistas.

[Resumen ejecutado + links a spec + smoke tests + follow-ups pending]
```

### G2. Update `CLAUDE.md`

Active feature pointer → entre ciclos, último cerrado spec 022.

### G3. Update session log

Agregar Parte 8 a `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md`.

### G4. Commit único

```bash
git add supabase/migrations/*_add_plans_tier_model.sql \
        supabase/functions/create-mp-checkout/index.ts \
        supabase/functions/mercadopago-webhook/index.ts \
        src/components/membership/ \
        src/features/membership/ \
        src/hooks/useActivePlanLimits.js \
        src/features/patients/ src/components/calendar/ src/components/clinic/ \
        .specify/memory/architecture.md \
        CLAUDE.md \
        docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md \
        specs/022-add-plans-tier-model/

git commit -m "feat(plans): subscription tier model + trial + annual + beta coupon (spec 022 close)

[detalle per Constitution §IV Micro-Bloques]"
```

### G5. Merge + push (push delegado a Danissa)

```bash
git checkout main
git merge --no-ff 022-add-plans-tier-model -m "merge: spec 022 subscription plans tier model (CLOSED)"
# NO push — Danissa
```

### 🟢 SP-G checkpoint

- [ ] G1-G5 completados
- [ ] Working tree clean post-merge

---

## ❗ Rollback procedures

### Phase B rollback

```sql
-- Revertir seed
UPDATE subscription_plans SET is_active=false WHERE slug IN ('free','individual','clinic_pro','clinic_premium');
UPDATE subscription_plans SET is_active=true WHERE slug='profesional';
UPDATE therapist_subscriptions SET plan_name='profesional' WHERE plan_name='individual' AND ...;
DELETE FROM discount_coupons WHERE code='BETA-3M-2026';

-- Revertir ALTERs (más destructivo, solo si es crítico)
ALTER TABLE subscription_plans DROP COLUMN IF EXISTS max_dentists;
-- ... etc
```

### Phase C rollback

```bash
git checkout HEAD -- supabase/functions/create-mp-checkout/index.ts
git checkout HEAD -- supabase/functions/mercadopago-webhook/index.ts
supabase functions deploy create-mp-checkout mercadopago-webhook --project-ref tomremkbuxvedliyywbo
```

### Phase D/E rollback

```bash
git checkout HEAD -- src/
```

---

## Time tracking

| Phase | Planned | Actual |
|---|---|---|
| A | 30 min | __ |
| B | 1-1.5 h | __ |
| C | 2-2.5 h | __ |
| D | 3-4 h | __ |
| E | 2-3 h | __ |
| F | 1-2 h | __ |
| G | 30 min | __ |
| **Total** | **10.5-14.5 h** | __ |

---

## Next después de SP-G

Spec 022 cerrado. Push delegado a Danissa.

**Follow-ups roadmap**:
- **Meta-spec `fix-mercadopago-critical-bugs`** (P0 siempre pendiente — 16-22h). Los 4 BLOCKERs restantes del audit spec 019 (F-001 signature, F-002 idempotency, F-003 silent-200, F-005 dunning).
- **Pago anual recurrente (PreApproval MP)** si el pago anual simple se prueba insuficiente.
- **Downgrade flow detallado** si usuarios abusan de downgrade mid-cycle.
- **Features enterprise que diferencien Premium vs Pro** más allá de límites.
- **Facturación electrónica SII** si DentalSpot cruza umbral que lo requiera.
