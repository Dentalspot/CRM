# Data Model: Audit RLS-Enabled Zero-Policies Tables

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Tasks**: [tasks.md](./tasks.md)
**Date**: 2026-04-20
**Source of evidence**: 2 queries en Supabase SQL Editor (Phase 1) + featureFlags.js fresh read + grep batched en `src/` + `supabase/functions/` (Phase 2). MCP denegado per shared-infra policy.

---

## §Phase 1 snapshot (2026-04-20)

### Query A — tablas RLS enabled + 0 policies (live)

Output: **22 tablas** retornadas. Coincide exactamente con la lista pre-conocida en `architecture.md §RLS coverage audit` (discrepancia vs contexto user = 0 — T3 PASS clean).

Lista ordenada alfabéticamente:

```
activity_categories
ai_chat_messages
ai_conversation_analysis
ai_recommendation_feedback
availability_logs
billing_invoices
coupon_uses
course_lessons
motivational_patient
orders
patient_activities
patient_development_areas
patient_evaluations
patient_goals
patient_materials
performance_metrics
plan_template_exercises
products
search_logs
specialty_change_logs
therapist_insurances
user_favorite_phrases
```

### Query B — row counts baseline

Output: `n_live_tup = 0` para **las 22 tablas**. Ninguna tabla tiene data hoy.

**Insight crítico** (flagged por advisor en SP-1): no hay GROUP A posible en este audit porque la regla A exige `row_count > 0`. El spec pivot de "emergency fix" a "preventive policies antes de primera data". Phase 2 sigue valioso para distinguir GROUP B (frontend activo) de C (dormant) y preparar templates preventivos sin prisa.

### SP-1 checks

| T | Criterio | Estado |
|---|---|---|
| T1 | Query A retorna ≥1 | ✅ PASS (22) |
| T2 | Query B cubre todas las de Query A | ✅ PASS (22/22) |
| T3 | Discrepancia vs contexto ≤ 5 | ✅ PASS (0 — lista idéntica) |

**🟢 SP-1 cleared** (confirmado por advisor 2026-04-20).

---

## §Phase 2 featureFlags snapshot (2026-04-20)

Lectura fresh de `src/constants/featureFlags.js` (R-03 mitigation):

```js
export const FEATURE_FLAGS = {
  PIE_ESCOLAR: false,
  ADOS2: false,
  ADIR: false,
  TEA: false,
  SENSORIAL_PROFILE: false,
  EDUCATOR: false,
};
```

**6 flags false**. `VOICE_VISUALIZER` removido en spec 010 (no aparece). Este set es la fuente de verdad para clasificar GROUP D.

Observación: ninguna de las 22 tablas aparece en un callsite envuelto en `FEATURE_FLAGS.X && ...` (confirmado en P2 grep + context read). Por lo tanto **GROUP D = 0** en este audit.

---

## §Phase 2 census (matrix CSV-like)

Grep sistemático sobre las 22 tablas en `src/` + `supabase/functions/`. Patrón: `from\s*\(\s*['"](<table>)['"]`. Contexto de 3 líneas leído para classifier.

Convenciones:
- `frontend_activo`: archivo user-facing o wrapper con consumer activo (lib, hook, api wrapper importado por componente visible).
- `edge_function`: archivo bajo `supabase/functions/` — usa service_role, bypassa RLS, NO afectado por el gap.
- `feature_flagged_off`: callsite envuelto en `FEATURE_FLAGS.X && ...` con `X` en set de false.
- `dead_code`: wrapper sin consumer o callsite huérfano post-cleanup.
- `UNCLEAR`: no resoluble sin lectura profunda.

| # | Tabla | Row count | Callsites frontend | Callsites edge | Feature-flagged OFF | Dead code | UNCLEAR | Notas |
|---|---|---|---|---|---|---|---|---|
| 1 | `activity_categories` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites. Tabla lookup probable. |
| 2 | `ai_chat_messages` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites. Dormant AI feature. |
| 3 | `ai_conversation_analysis` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites. Dormant AI feature. |
| 4 | `ai_recommendation_feedback` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites. Dormant AI feature. |
| 5 | `availability_logs` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites. |
| 6 | **`billing_invoices`** | 0 | **3** | 0 | 0 | 0 | 0 | `BillingHistory.jsx:27` (membership, therapist-facing SELECT), `useInvoices.js:13` (admin billing), `commissionsApi.js:30` (admin commissions). |
| 7 | `coupon_uses` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites. |
| 8 | `course_lessons` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites. Asociado a `EDUCATOR` flag OFF pero no aparece en código. |
| 9 | `motivational_patient` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites. |
| 10 | `orders` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites. |
| 11 | `patient_activities` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites directo. Hay `patient_activity_logs` (tabla distinta) con callsite en `patientApi.js:174`. |
| 12 | `patient_development_areas` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites `from('patient_development_areas')`. Aparece solo como FK embed en `patient_goals` select. |
| 13 | **`patient_evaluations`** | 0 | **2** | 0 | 0 | 0 | 0 | `patientApi.js:159` (SELECT fetch), `patientApi.js:189` (INSERT save). Wrapper exportado a consumers frontend. |
| 14 | **`patient_goals`** | 0 | **2** | **4** | 0 | 0 | 0 | `patientApi.js:115` (fetchPatientGoals SELECT con FK embed), `usePatientsPanel.js:259` (UPDATE transfer). Edge functions: suggest-treatment, rag-query, analyze-progress, recommend-purchases (service_role bypass, no afectadas). |
| 15 | `patient_materials` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites. |
| 16 | `performance_metrics` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites. |
| 17 | `plan_template_exercises` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites. Posible asociado a EDUCATOR pero sin código. |
| 18 | `products` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites `from('products')`. (Hay `marketplace_plans` / `marketplace_purchases` que son tablas distintas.) |
| 19 | `search_logs` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites. |
| 20 | `specialty_change_logs` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites. |
| 21 | `therapist_insurances` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites. |
| 22 | `user_favorite_phrases` | 0 | 0 | 0 | 0 | 0 | 0 | Sin callsites. |

**Totales**:
- Tablas con callsites frontend: **3** (`billing_invoices`, `patient_evaluations`, `patient_goals`).
- Tablas con callsites edge function únicamente: 0.
- Tablas con feature-flagged OFF callsites: 0.
- Tablas dead code / UNCLEAR: 0.
- Tablas sin callsites (dormant): **19**.

### SP-2 checks

| T | Criterio | Estado |
|---|---|---|
| T4 | Matrix cubre todas las tablas de Phase 1 | ✅ PASS (22/22) |
| T5 | UNCLEAR ≤ 10% | ✅ PASS (0%) |
| T6 | Time Phase 2 ≤ 25 min | ✅ PASS (~5 min, grep batched + 6 context reads) |

**🟢 SP-2 cleared** (soft gate, reporte intermedio suficiente).

---

## §Phase 3 priorización

Reglas determinísticas aplicadas (primer match gana, FR-004):

```
IF feature_flagged_off > 0 AND frontend_activo = 0 AND edge_function = 0:
  → GROUP D (dormant por flag)
ELSE IF frontend_activo = 0:
  → GROUP C (0 callsites frontend activos)
ELSE IF row_count > 0 AND frontend_activo > 0:
  → GROUP A (usuarios impactados HOY)
ELSE IF row_count = 0 AND frontend_activo > 0:
  → GROUP B (feature pre-launch)
```

### Distribución GROUPS

| GROUP | Count | Tablas |
|---|---|---|
| 🔴 **A** (rojo — activa rota hoy) | **0** | — (ninguna tabla con row_count > 0) |
| 🟡 **B** (amarillo — pre-launch, fix preventivo) | **3** | `billing_invoices`, `patient_evaluations`, `patient_goals` |
| 🟢 **C** (verde — intencional / dormant) | **19** | `activity_categories`, `ai_chat_messages`, `ai_conversation_analysis`, `ai_recommendation_feedback`, `availability_logs`, `coupon_uses`, `course_lessons`, `motivational_patient`, `orders`, `patient_activities`, `patient_development_areas`, `patient_materials`, `performance_metrics`, `plan_template_exercises`, `products`, `search_logs`, `specialty_change_logs`, `therapist_insurances`, `user_favorite_phrases` |
| ⚪ **D** (gris — flag OFF) | **0** | — (ningún callsite envuelto en FEATURE_FLAGS.X; el código de features flag-OFF no existe o ya fue removido) |
| UNCLEAR_GROUP | 0 | — |

**Total**: 22 ✓.

### User impact estimation

- **GROUP A (0 tablas)**: no hay impacto de usuario HOY. El audit confirma que la vulnerabilidad RLS-enabled-zero-policies es **latente**, no activa — ningún usuario ve empty silencioso porque no hay data.
- **GROUP B (3 tablas)**: impact **preventivo**. Cuando la primera factura/meta/evaluación se cree (tabla recibe su primera fila), el user que la consulte desde frontend verá empty silencioso a menos que las policies estén en su lugar para ese momento. **Ventana de acción**: cualquier momento antes del primer INSERT real.
- **GROUP C (19 tablas)**: sin impact. 18 tablas no tienen código que las consuma y 1 (`patient_development_areas`) solo aparece como FK embed de `patient_goals`, cubierta indirectamente si `patient_goals` tiene policies. Seguras de dejar.

### Notas adicionales sobre GROUP B

**`billing_invoices`** (severidad: **alta preventiva**):
- User impact: terapeutas verían lista de facturas vacía al abrir "Historial de facturación" + admin vería dashboard sin facturas ni comisiones calculables.
- Frecuencia esperada post-data: diaria (therapist dashboard + admin billing panel son consultados rutinariamente).
- Callsites: `BillingHistory.jsx`, `useInvoices.js`, `commissionsApi.js`.

**`patient_evaluations`** (severidad: **alta preventiva**):
- User impact: terapeutas no podrían guardar evaluaciones clínicas (INSERT rechazaría silencioso) + no aparecerían en ficha del paciente.
- Frecuencia esperada post-data: por sesión clínica con evaluación.
- Callsites: `patientApi.js:159` (fetch), `patientApi.js:189` (save — INSERT).

**`patient_goals`** (severidad: **alta preventiva**):
- User impact: metas del paciente aparecerían vacías + el flujo de merge/transfer de pacientes (`usePatientsPanel.js:259` — UPDATE) no podría migrar goals entre pacientes.
- Frecuencia esperada post-data: por plan clínico del paciente.
- Callsites: `patientApi.js:115` (SELECT), `usePatientsPanel.js:259` (UPDATE). Además 4 edge functions consumen con service_role (no afectadas).

### Decisión Phase 4 (SP-3)

**FR-006 check**: GROUP A = 0 ≤ 5. **No se requiere meta-spec**. Phase 4 genera **3 templates individuales** `write-policies-<table>` como **preventivos** (no urgentes).

**Razón para NO rebajar a "no urgencia":** aunque GROUP A = 0 hoy, las 3 tablas GROUP B son candidatas ciertas a convertirse en A en cuanto reciban su primer INSERT en producción (facturas emitidas, evaluaciones guardadas, metas asignadas). Preparar los templates **ahora** — cuando hay bandwidth — es más barato que improvisarlos cuando aparezca el primer reporte de usuario.

---

## §Phase 4 Follow-up specs

3 templates preventivos para GROUP B. Copy-pasteable al input de `/speckit-specify`.

### Template 1: spec `write-policies-billing-invoices`

**Contexto**: `billing_invoices` está en GROUP B del audit 012 (commit TBD). Row count = 0, 3 callsites frontend activos, severidad alta preventiva. Ver `specs/012-.../data-model.md §Phase 3 priorización`.

**Scope sugerido** (para `/speckit-specify`):

- Archivo autorizado: `supabase/migrations/<timestamp>_write_policies_billing_invoices.sql`.
- Policies candidatas basadas en patrón de callsites:
  - `"Therapists read own billing_invoices"` FOR SELECT USING (`auth.uid() = therapist_id`) — cubre `BillingHistory.jsx:27`.
  - `"Admin manage billing_invoices"` FOR ALL con `is_admin` via `profiles.role = 'admin'::user_role` — cubre `useInvoices.js:13` + `commissionsApi.js:30` (admin dashboard + commissions).
  - (Opcional) `"Service role manage billing_invoices"` — para edge functions de facturación si existen en el futuro.
- Estructura canonical: réplica spec 009 `20260420000002_restore_marketplace_purchases_policies.sql` con DO $$ pre-check + CREATE POLICY + post-check + rollback comentado.
- Phase 3 verification: smoke test de BillingHistory con therapist de prueba (empty state correcto).

**Callsites literales a validar post-fix**:
- `src/features/membership/components/BillingHistory.jsx:27`
- `src/features/admin/modules/billing/hooks/useInvoices.js:13`
- `src/features/admin/api/commissionsApi.js:30`

### Template 2: spec `write-policies-patient-evaluations`

**Contexto**: `patient_evaluations` en GROUP B. Row count = 0, 2 callsites frontend (SELECT + INSERT), severidad alta preventiva.

**Scope sugerido**:

- Archivo: `supabase/migrations/<timestamp>_write_policies_patient_evaluations.sql`.
- Policies candidatas:
  - `"Therapists manage own patient evaluations"` FOR ALL **vía care_team** — patrón: EXISTS subquery a `patient_care_team` verificando que `auth.uid()` pertenece al equipo clínico del `patient_id`. Ventaja vs `therapist_id = auth.uid()` directo: soporta clínicas multi-terapeuta donde varios profesionales colaboran sobre el mismo paciente. Phase 1 del spec confirma esquema real de `patient_care_team` para escribir el subquery correcto.
  - `"Patients read own evaluations"` FOR SELECT con match `patient_id` → perfil del usuario (subquery a `patients.patient_user_id = auth.uid()` o equivalente según esquema real; Phase 1 del spec lo confirma).
  - `"Admin manage patient_evaluations"` FOR ALL con `is_admin` via `profiles.role = 'admin'::user_role`.
  - Considerar audit §III: las lecturas por staff clínico deben invocar `useClinicalAccessLogger` (Constitution §III v1.1.0 post spec 008 clarifica que auto-acceso del paciente NO requiere logging).
- Phase 3 verification: test con terapeuta del care_team creando evaluación (INSERT funciona), paciente leyendo la suya (SELECT devuelve), otro terapeuta NO en el care_team intentando leer (SELECT vacío correcto).

**Callsites literales**:
- `src/lib/patientApi.js:159` (fetchPatientEvaluations)
- `src/lib/patientApi.js:189` (savePatientEvaluation)

### Template 3: spec `write-policies-patient-goals` (bundled con `patient_development_areas`)

**Contexto**: `patient_goals` en GROUP B. Row count = 0, 2 callsites frontend + 4 edge functions (service_role, no afectadas), severidad alta preventiva. Bundle: `patient_development_areas` se incluye en el mismo spec porque aparece como FK embed en `patient_goals` SELECT — sin policies sobre `patient_development_areas`, el embed fallaría aunque `patient_goals` esté cubierto.

**Scope sugerido** (1 migration cubriendo 2 tablas):

- Archivo: `supabase/migrations/<timestamp>_write_policies_patient_goals_and_development_areas.sql`.
- Policies candidatas:
  - Para `patient_goals`:
    - `"Therapists manage own patient goals"` FOR ALL **vía care_team** — EXISTS subquery a `patient_care_team` verificando `auth.uid()` en el equipo del `patient_id`. Soporta colaboración multi-terapeuta.
    - `"Patients read own goals"` FOR SELECT con match `patient_id → patients.patient_user_id = auth.uid()`.
    - `"Admin manage patient_goals"` FOR ALL con `is_admin`.
  - Para `patient_development_areas`:
    - `"Therapists manage own patient development areas"` FOR ALL **vía care_team** — mismo patrón (EXISTS sobre `patient_care_team`). Necesario para que el FK embed desde `patient_goals` resuelva.
    - `"Patients read own development areas"` FOR SELECT — permite al paciente leer vía embed en su propia consulta de goals.
    - `"Admin manage patient_development_areas"` FOR ALL con `is_admin`.
  - Edge functions (4 en `patient_goals`) usan service_role → bypass RLS, no requieren policy dedicada.
- Phase 3 verification: (a) terapeuta del care_team crea meta con área — INSERT OK y SELECT via embed devuelve `area.name`; (b) paciente lee goals propios — SELECT devuelve goals + development_areas embebidos; (c) terapeuta NO en care_team intenta leer — SELECT vacío correcto; (d) merge de pacientes (`usePatientsPanel.js:259` UPDATE) transfiere goals entre pacientes correctamente.

**Callsites literales** (de `patient_goals` + embed implícito de `patient_development_areas`):
- `src/lib/patientApi.js:115` (fetchPatientGoals — SELECT con `area:patient_development_areas!...` embed)
- `src/features/patients/hooks/usePatientsPanel.js:259` (UPDATE transfer entre pacientes)
- `supabase/functions/suggest-treatment/index.ts:49` (service_role, no requiere policy)
- `supabase/functions/rag-query/index.ts:143` (service_role)
- `supabase/functions/analyze-progress/index.ts:42` (service_role)
- `supabase/functions/recommend-purchases/index.ts:27` (service_role)

### Priorización sugerida entre los 3 templates

1. **`write-policies-billing-invoices`** — la feature de billing está más cerca de recibir data (suscripciones, facturas admin). El gap dolería primero.
2. **`write-policies-patient-evaluations`** — flujo clínico core. Alta probabilidad de uso post-onboarding.
3. **`write-policies-patient-goals`** — similar prioridad que evaluations, mismo flujo clínico. Considerar agrupar en 1 sola spec "write-policies-patient-clinical" si el equipo prefiere reducir overhead (pero respetando Principio IV: mantener PRs chicos).

---

## §Backlog para architecture.md

19 tablas GROUP C — dejar como-están, documentar en architecture.md sección nueva.

**Categorización interna** (para referencia futura):

- **Dormant features completas** (9): `ai_chat_messages`, `ai_conversation_analysis`, `ai_recommendation_feedback`, `motivational_patient`, `performance_metrics`, `search_logs`, `specialty_change_logs`, `therapist_insurances`, `user_favorite_phrases`.
- **Infra / lookup tables** (3): `activity_categories`, `availability_logs`, `coupon_uses`.
- **Asociadas a EDUCATOR** (feature flag OFF, pero sin código hoy) (2): `course_lessons`, `plan_template_exercises`.
- **Clínicas no-conectadas** (4): `patient_activities`, `patient_development_areas`, `patient_materials`, `products`.
- **Transactional no-conectada** (1): `orders`.

Si alguna de estas recibe código o flag se activa → mover a GROUP B y re-evaluar.

---

## §Hallazgos laterales

- **Discrepancias vs contexto user = 0**: lista de 22 tablas coincide exactamente con `architecture.md §RLS coverage audit`. No hay drift.
- **Confusión potential entre `patient_activities` y `patient_activity_logs`**: son tablas distintas. `patient_activities` está en el audit (0 callsites), `patient_activity_logs` NO está (tiene callsite en `patientApi.js:174` pero esa tabla no está en Query A — probablemente tiene policies o RLS disabled). No requiere acción en este spec.
- **`patient_development_areas` indirectamente cubierta**: aparece en un FK embed de `patient_goals` (`from('patient_goals').select('*, area:patient_development_areas!...')`). Técnicamente podría ser leída vía el embed si patient_goals tiene policy — pero PostgREST requiere que la tabla joined también tenga policies (o RLS disabled). Vale la pena documentarlo para spec futuro.
- **Edge functions de `patient_goals` (4 callsites)**: service_role bypassa RLS. Sin embargo, si en el futuro se añade policy a `patient_goals`, las queries del edge function seguirán funcionando (service_role supera RLS). No requiere coordinación.
- **`products` ≠ `marketplace_plans` ≠ `marketplace_purchases`**: las 3 son tablas distintas. Solo `products` está en este audit (0 callsites). `marketplace_plans` es pública (no requiere policies complejas). `marketplace_purchases` fue remediada en spec 009.

---

## §Pending SP checks (resumen)

| SP | Criterio | Estado |
|---|---|---|
| SP-1 | Phase 1 snapshot + T1-T3 | ✅ cleared |
| SP-2 | Matrix + T4-T6 | ✅ cleared (unclear 0%, time ~5 min) |
| SP-3 | GROUP counts + decisión Phase 4 | ✅ GROUP A=0, no meta-spec, 3 templates individuales preventivos |
