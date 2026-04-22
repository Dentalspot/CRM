# Implementation Plan: Add Subscription Plans Tier Model

**Branch**: `022-add-plans-tier-model` | **Date**: 2026-04-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/022-add-plans-tier-model/spec.md`

## Summary

Implementar el modelo tier de 4 planes de suscripción (Free, Individual, Clínica Pro, Clínica Premium) con trial 30 días + descuento anual 15% + cupón beta renovable 3 meses. Último bloqueante operacional pre-launch real de cobros a dentistas.

**Approach**: 7 phases secuenciales con stop points. Migration DB idempotente (patrón canonical DentalSpot) + extensión de edge functions MP ya rebrandeadas (preservando F-014) + rebuild frontend `MembershipPlansPage` + enforcement híbrido (UX modals + server-side validation).

**Estimate**: 9-12 h técnico, partible en 2-3 sesiones. Spec más complejo de los recientes (20 FRs vs ~13 en 020/021).

---

## Technical Context

**Language/Version**: TypeScript (Deno para edge functions) + React 18 + SQL PostgreSQL (Supabase)
**Primary Dependencies**:
- Backend: `@supabase/supabase-js@2`, MercadoPago Checkout Pro API, Deno fetch nativo
- Frontend: React 18, shadcn/ui, react-hook-form (existente), tailwind
- DB: PostgreSQL 15 (Supabase managed)
**Storage**: Supabase PostgreSQL — `subscription_plans` (extendida), `discount_coupons` (extendida), `therapist_subscriptions` (extendida), `patients`/`appointments`/`clinics`/`clinical_boxes` (read-only para enforcement)
**Testing**: Smoke tests manuales post-deploy (patrón specs 020/021). Tests unitarios frontend opcionales si Vitest disponible (existente en repo).
**Target Platform**: Supabase Edge Functions (Deno hosted, proyecto `tomremkbuxvedliyywbo`) + Vercel (frontend DentalSpot)
**Project Type**: Feature completa end-to-end — DB + backend + frontend + enforcement lógica
**Performance Goals**:
- Página de planes carga en <2s (SC-008)
- Modal enforcement aparece en <1s (SC-003)
- Checkout completo desde click plan hasta MP sandbox en <3s (SC-001 implícito)
**Constraints**:
- **F-014 fix preservation** (FR-018) — ningún edit puede romper validación server-side de precio
- **Enforcement server-side obligatorio** (FR-014) — no solo UX, backend debe bloquear creaciones que excedan límites
- **0 impacto a specs 020/021 ya deployados** — MP flow sigue funcionando sin regression
- **Migration idempotente** — debe poder aplicarse varias veces sin romper data existente
- **Placeholder `profesional`** existente debe migrarse sin romper referencias (single active sub del Query γ spec 019)
**Scale/Scope**: 20 FRs, ~5-7 archivos frontend modificados/creados, ~2 edge functions extendidas, 1 migration nueva, 0-1 hooks nuevos

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Aplica | Estado | Justificación |
|---|---|---|---|
| **I. Compliance-First (Ley 20.584 / 21.719)** | No | ✅ PASS | Planes y límites no tocan PHI ni datos clínicos. Los límites (pacientes, citas) son metadata de uso, no contenido clínico. |
| **II. RLS-First Security** | Sí | ✅ PASS | `subscription_plans` ya tiene RLS existente (read-only para users, manage para admin). Nuevas columnas heredan policies. `therapist_subscriptions` extensión `current_renewal_count` hereda RLS de la tabla (5 policies, spec 019 Query β). Zero cambios a policies. |
| **III. Append-Only Clinical Audit** | No | ✅ PASS | Planes y enforcement no leen PHI. `patient_limit` enforcement cuenta rows de `patients` pero sin leer PHI (solo `COUNT(*)` con filtro by therapist/clinic). |
| **IV. Micro-Bloques** | **Sí (driver principal)** | ✅ PASS | Scope tight: pricing + enforcement básico. 9 items Out of Scope explícitos (triage IA, downgrade flow detallado, proración, features enterprise más allá de límites, meta-spec MP fixes, Stripe, facturación electrónica, multi-currency, IVA automático). Commit único al cierre per patrón specs 020/021. |
| **V. UI Honesty** | Sí | ✅ PASS | Enforcement modals MUST dar mensaje claro (FR-010/011/012/013). Server-side validation previene "toast éxito sin validar" (.select().length > 0 pattern existente en repo). Errores 400 desde edge functions con JSON body descriptivo. |
| **VI. Schema Drift Zero** | Sí | ✅ PASS | 1 migration nueva con pre-check/post-check DO $ blocks (patrón canónico DentalSpot). Columnas nuevas agregadas con `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (idempotente). Seed data con `ON CONFLICT DO UPDATE` (UPSERT). |

**Resultado inicial**: Todos los gates PASS. Sin `[CONSTITUTION-EXCEPTION]` requerido.

**Re-check post-Phase 1**: ejecutado al final del plan — ver sección "Post-Phase 1 Constitution Re-check".

---

## Project Structure

### Documentation (this feature)

```text
specs/022-add-plans-tier-model/
├── plan.md              # Este archivo
├── spec.md              # /speckit-specify output (264 líneas)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (entities + migration + signatures)
├── quickstart.md        # Phase 1 output (guía ejecutable 7 phases)
├── contracts/           # Phase 1 output (vacío — no APIs nuevas externas)
├── checklists/
│   └── requirements.md  # 13/13 PASS
└── tasks.md             # /speckit-tasks output (si se genera)
```

### Source Code (repository root)

**Archivos a crear** (nuevos):

```text
supabase/migrations/
└── 2026MMDDhhmmss_add_plans_tier_model.sql    # Migration nueva (schema + seed)

src/hooks/
└── useActivePlanLimits.js                     # Hook para enforcement UX

src/components/membership/ (si no existe, crear)
├── PlanCard.jsx                               # Componente card individual (reusable)
├── PlanUpgradeModal.jsx                       # Modal bloqueante para upgrade
└── BillingCycleToggle.jsx                     # Toggle Mensual/Anual -15%
```

**Archivos a editar** (existentes):

```text
supabase/functions/
├── create-mp-checkout/index.ts       # Extender: renewal counter logic + annual discount
└── mercadopago-webhook/index.ts      # Extender: incrementar current_renewal_count

src/features/membership/
├── pages/MembershipPlansPage.jsx     # REBUILD completo con 4 cards + toggle
└── api/membershipApi.js              # Extender: soporte billing_cycle annual

src/features/patients/ (o donde vive el create)
└── <componente de crear paciente>    # Integrar enforcement con useActivePlanLimits

src/components/calendar/
└── NewAppointmentForm.jsx            # Integrar enforcement appointment_limit

src/components/clinic/ (o features/clinic-dashboard/)
└── ClinicInvitationsPanel.jsx        # Integrar enforcement max_dentists

src/features/clinic-dashboard/ (o donde vive box create)
└── <componente de crear sillón>      # Integrar enforcement max_boxes
```

**Archivos a NO tocar** (scope bound):
- Ninguna edge function fuera de create-mp-checkout + mercadopago-webhook
- `supabase/policies.sql` (sin cambios RLS)
- Otros components no relacionados a planes/enforcement
- Código de Triage IA (preservar como está, oculto via configuración actual)

**Archivos a actualizar** (post-implement):
- `.specify/memory/architecture.md` — subsección §"Subscription plans tier model (spec 022)"
- `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md` — Parte 8 final
- `CLAUDE.md` — Active feature pointer

---

## Phase 0: Research & Discovery

### Research tasks

1. **Estado actual de `subscription_plans`** (post-spec 020 smoke test):
   - Query: `SELECT slug, name, price, is_active FROM subscription_plans`
   - Resultado esperado: 1 row (`profesional @ $20.000 is_active=true`)
   - Decisión Phase A: UPDATE a `individual` o desactivar + insertar 4 nuevos

2. **Estado actual de `therapist_subscriptions`** (para preservación):
   - Query: `SELECT id, therapist_id, plan_name, status FROM therapist_subscriptions WHERE status='active'`
   - Resultado esperado: 1 row (Query γ spec 019) — la active del cupón 100% que bypasseó MP
   - Verificar que columna `current_renewal_count` no existe (ALTER ADD COLUMN IF NOT EXISTS es seguro)

3. **Estado actual de `discount_coupons`**:
   - Query: `SELECT code, discount_type, discount_value, coupon_type, applicable_plans, max_uses, current_uses FROM discount_coupons`
   - Resultado esperado: varios cupones existentes (NOTIZ-FREE30, PLANTILLA-FREE30 vistos en spec 020)
   - Verificar que columna `max_renewals` no existe

4. **Verificación F-014 fix** (crítico preservation):
   - Leer `create-mp-checkout/index.ts` líneas ~69-148
   - Confirmar lógica: `chargePrice = plan.price` + coupon validation 7 checks + NUNCA usar final_price cliente
   - Identificar puntos de extensión: después de líneas 145-148 (chargePrice calculado), agregar lógica de `max_renewals`

5. **Inventory del frontend actual de planes**:
   - `src/features/membership/pages/MembershipPlansPage.jsx` — estado actual (¿qué planes muestra hoy?)
   - Componentes relacionados existentes que podemos reusar vs crear nuevos
   - Estilo visual vigente (tailwind + shadcn)

6. **Tabla de límites — fuentes de verdad**:
   - Para `patient_limit`: `SELECT COUNT(*) FROM patients WHERE therapist_id=... AND deleted_at IS NULL`
   - Para `appointment_limit`: `SELECT COUNT(*) FROM appointments WHERE therapist_id=... AND DATE_TRUNC('month', start_at) = DATE_TRUNC('month', NOW())`
   - Para `max_dentists`: `SELECT COUNT(*) FROM clinic_therapists WHERE clinic_id=... AND is_active=true`
   - Para `max_boxes`: `SELECT COUNT(*) FROM clinical_boxes WHERE clinic_id=...` (confirmar nombre exacto de tabla de sillones en Phase A)

7. **Annual billing con MercadoPago Checkout Pro — research**:
   - ¿MP soporta pago único anual vía `checkout/preferences` estándar, o requiere PreApproval (suscripción recurrente MP)?
   - Decisión Phase 0: MVP usa **pago único anual** (preference con unit_price = anual_total, sin recurrencia MP). La renovación año-a-año se gestiona manualmente o via spec futuro.
   - Alternativa (out of scope): integrar PreApproval MP para recurrencia automática anual.

### Output

`research.md` con:
- Findings empíricos (queries Phase A anticipadas con expected output)
- Decisión sobre migración del `profesional` placeholder
- Verificación F-014 fix inventory (líneas exactas a preservar)
- Design decisions (D-01 a D-08)

---

## Phase 1: Design & Contracts

### 1. Data model (`data-model.md`)

Documenta:
- **Migration detail** — cada ALTER + UPSERT con SQL exacto
- **Entities extended** — subscription_plans (+6 columnas), discount_coupons (+1 columna), therapist_subscriptions (+1 columna)
- **Seed data** — 4 planes + cupón BETA-3M-2026 con valores exactos
- **Enforcement logic** — queries SQL para contar uso actual por plan
- **F-014 preservation map** — líneas intactas vs puntos de extensión en create-mp-checkout
- **Annual pricing calculation** — tabla precio_mensual × 12 × 0.85 = precio_anual_total
- **Renewal counter flow** — state diagram para cupón BETA

### 2. Contracts (`contracts/`)

**No aplica** — este spec no introduce APIs públicas nuevas. Las extensiones de edge functions mantienen mismos body requests + response formats (FR-008 equivalente a "signatures preservadas" del spec 020).

Directorio queda vacío.

### 3. Quickstart (`quickstart.md`)

Guía ejecutable con 7 phases (A-G) + comandos SQL + Edit instructions + smoke test commands + rollback procedures.

### 4. Agent context update

Actualizar CLAUDE.md `Active feature` para apuntar a `specs/022-add-plans-tier-model/plan.md`.

---

## Phase 2: Implementation Strategy

### Fases de ejecución (para `/speckit-tasks` o implement directo)

#### **Phase A — Pre-flight (~30 min)**

Zero risk:
- Queries empíricas a DB (subscription_plans, therapist_subscriptions, discount_coupons) para estado actual
- Verificación F-014 fix intacto (grep + diff review)
- Identificar nombre exacto de tabla de sillones/boxes
- Confirmar dominio + Supabase CLI OK
- Decisión de migración del `profesional` placeholder

**T-checks A1-A5** → **SP-A**

#### **Phase B — Migration + seed (~1-1.5 h)**

Crear `supabase/migrations/2026MMDDhhmmss_add_plans_tier_model.sql`:

1. **Pre-check DO $ block**:
   ```sql
   DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename='subscription_plans') THEN
       RAISE EXCEPTION 'subscription_plans table missing';
     END IF;
     -- Similar para discount_coupons, therapist_subscriptions
   END $$;
   ```

2. **ALTER TABLE statements** (idempotentes):
   - `subscription_plans`: + max_dentists, max_boxes, patient_limit, appointment_limit, trial_days, annual_discount_percent
   - `discount_coupons`: + max_renewals
   - `therapist_subscriptions`: + current_renewal_count (DEFAULT 0), + applied_coupon_code (para tracking)

3. **Seed UPSERT 4 planes**:
   ```sql
   INSERT INTO subscription_plans (slug, name, price, max_dentists, max_boxes, patient_limit, appointment_limit, trial_days, annual_discount_percent, is_active)
   VALUES
     ('free',           'Free',            0,     1,    0,    5,    15,   0,  0,  true),
     ('individual',     'Individual',      14990, 1,    1,    NULL, NULL, 30, 15, true),
     ('clinic_pro',     'Clínica Pro',     24990, 5,    3,    NULL, NULL, 30, 15, true),
     ('clinic_premium', 'Clínica Premium', 39990, NULL, NULL, NULL, NULL, 30, 15, true)
   ON CONFLICT (slug) DO UPDATE SET
     name = EXCLUDED.name, price = EXCLUDED.price, max_dentists = EXCLUDED.max_dentists,
     max_boxes = EXCLUDED.max_boxes, patient_limit = EXCLUDED.patient_limit,
     appointment_limit = EXCLUDED.appointment_limit, trial_days = EXCLUDED.trial_days,
     annual_discount_percent = EXCLUDED.annual_discount_percent, is_active = EXCLUDED.is_active,
     updated_at = NOW();
   ```

4. **Migración del placeholder `profesional`**:
   - Decisión según Phase A: si hay sub activa con `plan_name='profesional'`, actualizar `plan_name='individual'` para preservar referencia. Luego desactivar `profesional` (`is_active=false`).

5. **Seed cupón BETA-3M-2026**:
   ```sql
   INSERT INTO discount_coupons (
     code, discount_type, discount_value, coupon_type, is_active,
     valid_from, expiration_date, max_uses, current_uses,
     max_renewals, applicable_plans, description
   ) VALUES (
     'BETA-3M-2026', 'percentage', 100, 'membership', true,
     NOW(), NOW() + INTERVAL '180 days', 30, 0,
     3, ARRAY['individual','clinic_pro'],
     'Cupón beta DentalSpot — 3 meses gratis para primeros dentistas'
   ) ON CONFLICT (code) DO UPDATE SET
     max_renewals = EXCLUDED.max_renewals,
     applicable_plans = EXCLUDED.applicable_plans,
     updated_at = NOW();
   ```

6. **Post-check DO $ block** (valida que todos los planes existen):
   ```sql
   DO $$
   DECLARE expected TEXT[] := ARRAY['free', 'individual', 'clinic_pro', 'clinic_premium'];
   DECLARE s TEXT;
   BEGIN
     FOREACH s IN ARRAY expected LOOP
       IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE slug=s AND is_active=true) THEN
         RAISE EXCEPTION 'Plan % missing or not active', s;
       END IF;
     END LOOP;
   END $$;
   ```

7. **Aplicar**: `supabase db push --project-ref tomremkbuxvedliyywbo` (o SQL Editor si no hay Docker)

**T-checks B1-B4** → **SP-B**

#### **Phase C — Edge functions update (~2-2.5 h)**

1. **`create-mp-checkout/index.ts`** — agregar lógica POST-coupon-validation:
   - Si coupon tiene `max_renewals IS NOT NULL`, persistir `current_renewal_count=1` + `applied_coupon_code=coupon.code` en la suscripción creada/actualizada
   - Agregar soporte para `billing_cycle` en body request (monthly | annual). Si annual: `chargePrice = chargePrice * 12 * 0.85` (usar `plan.annual_discount_percent`).
   - Preservar F-014: chargePrice siempre derivado server-side, NUNCA del cliente
   - Deploy via `supabase functions deploy create-mp-checkout`

2. **`mercadopago-webhook/index.ts`** — extender handlePayment:
   - Cuando payment approved, buscar la sub por external_reference
   - Si sub tiene `applied_coupon_code` + `current_renewal_count < coupon.max_renewals`, incrementar counter en +1
   - Si counter >= max_renewals, el siguiente ciclo no aplicará el cupón (lógica ya en create-mp-checkout Phase C step 1)
   - Deploy via `supabase functions deploy mercadopago-webhook`

3. **Verificación F-014 preservation** (crítico):
   - `git diff create-mp-checkout/index.ts` — debe mostrar ADICIONES, NO modificación de lógica existente (líneas 69-148)
   - Smoke test mini: request con `{final_price: 1}` → debe ignorar + usar plan.price

**T-checks C1-C3** → **SP-C**

#### **Phase D — Frontend MembershipPlansPage rebuild (~3-4 h)**

1. **Crear componentes reusables**:
   - `src/components/membership/PlanCard.jsx` — card con nombre, precio, features, CTA
   - `src/components/membership/BillingCycleToggle.jsx` — toggle Mensual/Anual -15%
   - `src/components/membership/PlanUpgradeModal.jsx` — modal bloqueante genérico para enforcement

2. **Rebuild `MembershipPlansPage.jsx`**:
   - Query a `subscription_plans` (is_active=true, order by price ASC) → 4 planes
   - Render 4 PlanCards en grid responsive (4 columnas desktop, stack en mobile)
   - Badge "POPULAR" hardcoded en Clínica Pro
   - Toggle Anual recalcula precios en JS (usando `annual_discount_percent` de cada plan)
   - CTAs:
     - Free: invoca flujo de activación free (sin checkout MP)
     - Paid: invoca `supabase.functions.invoke('create-mp-checkout')` con body incluyendo `billing_cycle`
   - Tooltip en "sillón" con explicación

3. **Extender `membershipApi.js`**:
   - Agregar parámetro `billing_cycle` en función `createCheckoutSession`
   - Preservar firma de function para no romper callsites existentes

**T-checks D1-D4** → **SP-D**

#### **Phase E — Enforcement integration (~2-3 h)**

1. **Crear `src/hooks/useActivePlanLimits.js`**:
   ```javascript
   // Retorna: { plan, limits, usage, canCreate }
   // - plan: current active subscription plan object
   // - limits: { max_dentists, max_boxes, patient_limit, appointment_limit }
   // - usage: { current_dentists, current_boxes, current_patients, current_appointments_month }
   // - canCreate: (type: 'patient'|'appointment'|'dentist'|'box') => boolean
   ```

2. **Integrar en flujos de creación**:
   - Patient creation: antes de llamar API, chequear `canCreate('patient')`. Si false, mostrar `PlanUpgradeModal` con context "pacientes".
   - Appointment creation: chequear `canCreate('appointment')`. Modal si false.
   - Clinic invitation (`ClinicInvitationsPanel`): chequear `canCreate('dentist')`. Modal si false.
   - Box creation: chequear `canCreate('box')`. Modal si false.

3. **Server-side enforcement (FR-014)** — crítico:
   - Opción A: nueva edge function `validate-plan-limit` invocada antes de cada create
   - Opción B: RLS policy con función `plan_limit_exceeded(therapist_id, resource_type)` que bloquee INSERT
   - Opción C: agregar check en hooks/triggers existentes si algún create ya usa edge function
   - **Decisión Phase 0**: Opción B (RLS) es más robusta pero más compleja. MVP va con **Opción A** (edge function dedicada) o **Opción C** (integrar en flows existentes).
   - **Default para MVP**: si el create de paciente/appointment usa directly supabase-js (no edge function), el enforcement server-side se hace via **RPC function SQL** llamada desde el cliente: `SELECT check_plan_limit(therapist_id, 'patient')` → retorna boolean; frontend solo intenta INSERT si RPC retorna true.

4. **Testing enforcement**:
   - Crear dentista test con plan Free
   - Crear 5 pacientes (OK)
   - Intentar crear 6º (MODAL + server-side bloquea)

**T-checks E1-E3** → **SP-E**

#### **Phase F — Smoke test end-to-end (~1-2 h)**

1. **Test F1 — Flow completo Individual mensual**:
   - Dentista test → plan Individual → checkout MP → sandbox pago → sub active
   - Verificar DB: plan_name='individual', billing_cycle='monthly', current_period_end ~30 days

2. **Test F2 — Flow completo Clínica Pro anual**:
   - Clínica test → plan Clinic Pro → toggle anual → checkout MP con monto anual
   - Verificar precio correcto: $24990 × 12 × 0.85 = $254898
   - Verificar DB: billing_cycle='annual', current_period_end ~365 days

3. **Test F3 — Cupón BETA-3M-2026**:
   - Checkout con cupón → precio $0
   - Verificar DB: applied_coupon_code='BETA-3M-2026', current_renewal_count=1
   - Simular webhook de 2º pago (via MP CLI o manual) → verificar counter=2
   - (Test completo de 3 ciclos requiere 3 meses reales; smoke conceptual con 1-2 ciclos simulados)

4. **Test F4 — F-014 regression**:
   - Request con `{final_price: 1, plan: 'individual'}` → verificar que MP preference tiene unit_price=14990 (no 1)

5. **Test F5 — Enforcement Free plan**:
   - Dentista Free → crear 5 pacientes (OK) → intentar 6º (BLOQUEADO con modal)
   - Intentar crear 16 cita mes (BLOQUEADO)

6. **Test F6 — Enforcement Clinic Pro**:
   - Clínica con 5 dentistas → invitar 6º (BLOQUEADO con modal upgrade)

**T-checks F1-F6** → **SP-F**

#### **Phase G — Close (~30 min)**

- Update `.specify/memory/architecture.md` con subsección `§"Subscription plans tier model (spec 022 — 2026-04-22)"`
- Update `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md` con Parte 8
- Update CLAUDE.md Active feature
- Commit único en rama + merge a main (Danissa hace push)

**T-checks G1-G3** → **SP-G**

### Risk Register

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| **R-01** | Migración del placeholder `profesional` rompe sub activa existente | Baja | Medio | Phase A verifica la sub activa. Migration usa UPDATE plan_name='individual' antes de desactivar profesional. Verificado con post-check DO $ block. |
| **R-02** | Enforcement solo client-side (bypass via DevTools si user técnicamente hábil) | Alta (sin mitigación) | Medio (usuario free puede crear >5 pacientes) | **FR-014 explícita server-side**. Phase E step 3 implementa check via RPC SQL o edge function. Testing Phase F5 valida. |
| **R-03** | Cupón renewal counter desincronizado (F-002 idempotency sin resolver) | Media | Medio (usuario obtiene más meses gratis de los debidos) | Logging explícito + dashboard admin para revisar counter. Fix permanente en meta-spec MP futuro. Aceptable riesgo pre-launch con <30 dentistas beta. |
| **R-04** | Pago anual flow no validable en MP sandbox (preference única de gran monto puede tener limits) | Baja | Bajo (smoke test anual queda conceptual) | Documentar como known limitation. Validación real con primer pago anual real post-launch. Revertible si hay problema. |
| **R-05** | `clinical_boxes` table no existe o se llama distinto | Baja | Medio (enforcement max_boxes roto) | Phase A verificación empírica del nombre exacto de tabla. Si no existe, `max_boxes` enforcement se difiere a spec futuro y se marca como "enforcement N/A" por ahora. |
| **R-06** | F-014 fix regression durante edit de create-mp-checkout | Baja | **CRÍTICO** (exploit reintroducido) | Diff review manual Phase C + smoke test Phase F4 explícito. Rollback immediate si regression detectada. |
| **R-07** | Rebuild de MembershipPlansPage rompe usuarios existentes con sub activa | Baja | Alto | Phase D testing manual con la sub activa existente (cupón 100%). Verificar que su dashboard sigue mostrando estado correcto. |
| **R-08** | Modal enforcement UX aparece en loops (ej. reintentar crear paciente 10 veces abre modal 10 veces) | Media | Bajo (annoying pero no breaking) | Modal se cierra automáticamente tras click en X o upgrade. Estado local en componente previene re-abrir automático. |

### Stop Points

| SP | Trigger | T-checks | Acción si fail |
|---|---|---|---|
| **SP-A** | Post pre-flight | A1-A5: estado DB actual + F-014 + nombre tabla boxes + dominios OK | Pausa + resolución. Si F-014 roto → detener spec. |
| **SP-B** | Post migration | B1: pre/post-check DO $ blocks pass · B2: 4 planes is_active · B3: cupón BETA-3M-2026 insertado · B4: placeholder profesional migrado sin romper sub activa | ROLLBACK migration via reverso del SQL. Investigar antes de retry. |
| **SP-C** | Post edge functions | C1: grep F-014 preservation OK · C2: deploy exitoso · C3: diff review muestra ADICIONES no modificaciones | ROLLBACK: `git checkout supabase/functions/` + redeploy versión previa. |
| **SP-D** | Post frontend rebuild | D1: MembershipPlansPage renderiza 4 cards · D2: toggle Mensual/Anual funciona · D3: CTAs invocan correctamente · D4: responsive mobile OK | ROLLBACK edits. Re-review UX. |
| **SP-E** | Post enforcement | E1: hook useActivePlanLimits retorna valores correctos · E2: modal aparece correctamente · E3: server-side bloquea creaciones que exceden límites | ROLLBACK enforcement. User flows quedan SIN enforcement pero funcionales. |
| **SP-F** | Post smoke tests | F1-F6: 6 tests PASS · F4 F-014 regression CRÍTICO PASS | Si F4 falla → URGENT ROLLBACK Phase C edge functions. Otros fallos → investigar + fix. |
| **SP-G** | Post close | G1: docs actualizados · G2: commit único · G3: merge a main (sin push) | - |

---

## Time Budget

| Phase | Tiempo estimado | Actividad |
|---|---|---|
| Phase A — Pre-flight | 30 min | Queries DB + F-014 verification + dominios |
| Phase B — Migration + seed | 1-1.5 h | Escribir + aplicar + verificar |
| Phase C — Edge functions update | 2-2.5 h | create-mp-checkout + webhook extensions + deploy |
| Phase D — Frontend rebuild | 3-4 h | MembershipPlansPage + componentes reusables |
| Phase E — Enforcement integration | 2-3 h | Hook + 4 integration points + server-side validation |
| Phase F — Smoke tests | 1-2 h | 6 tests end-to-end |
| Phase G — Close | 30 min | Docs + commit + merge |
| Buffer | 30 min-1 h | Imprevistos (R-01, R-05, R-06) |
| **Total técnico** | **10.5-14.5 h** | Partible en 2-3 sesiones |

**Distribución sugerida**:
- Sesión 1 (4-5h): Phase A + B + C (backend completo)
- Sesión 2 (4-5h): Phase D (frontend principal)
- Sesión 3 (3-4h): Phase E + F + G (enforcement + smoke + close)

---

## References

- Spec: [spec.md](./spec.md)
- Research: [research.md](./research.md) (Phase 0 output)
- Data model: [data-model.md](./data-model.md) (Phase 1 output)
- Quickstart: [quickstart.md](./quickstart.md) (Phase 1 output)
- Spec 019 audit MP: `specs/019-audit-mercadopago-flow/data-model.md`
- Spec 020 MP rebrand: `specs/020-migrate-mp-brand/`
- Spec 021 FonoKit cleanup: `specs/021-cleanup-fonokit-legacy/`
- Session log: `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md`
- F-014 fix commit: `3593b12`
- Constitution: `.specify/memory/constitution.md`
- Architecture: `.specify/memory/architecture.md`

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | **Sin violaciones**. Scope tight preservado — 9 items explícitos Out of Scope. Complejidad intrínseca del spec (DB + backend + frontend + enforcement) se descompone en 7 phases con stop points claros. No hay mezcla de features no relacionados. |

---

## Post-Phase 1 Constitution Re-check

Ejecutado al final de Phase 1 design:

- §I Compliance-First: ✅ sin cambios (enforcement lee counts, no PHI)
- §II RLS-First: ✅ sin cambios (todas las extensiones de schema heredan RLS existente)
- §III Audit Append-Only: ✅ sin cambios
- §IV Micro-Bloques: ✅ **reafirmado** — scope tight + 9 items OOS + commit único
- §V UI Honesty: ✅ enforcement modals claros, errores 400 con JSON body
- §VI Schema Drift Zero: ✅ 1 migration con patrón canónico (pre/post-check DO $ blocks + IF NOT EXISTS + ON CONFLICT UPSERT)

**Resultado**: PASS. Plan listo para `/speckit-tasks` o implement directo.

---

## Next Step

**Opción 1**: `/speckit-tasks` → genera tasks.md con 40-50 tasks mapeados a phases A-G (más formal, útil para auditoría)
**Opción 2**: Implement directo siguiendo quickstart.md (más rápido, similar a spec 021)

**Hook optional antes de `/speckit-tasks` o `/speckit-implement`**: `speckit.git.commit` (recomendado — commit de plan + research + data-model + quickstart + requirements).
