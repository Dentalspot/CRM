# Implementation Plan: Apply Policies billing_invoices + patient_evaluations

**Branch**: `014-apply-policies-billing-evaluations` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-apply-policies-billing-evaluations/spec.md`

## Summary

Aplicación preventiva de 2 templates GROUP B del audit spec 012: 2 policies sobre `billing_invoices` + 3 policies sobre `patient_evaluations` = **5 policies nuevas** en 1 archivo de migración. Sin cambios a código aplicación. Phase 1 (15 min) re-verifica estado live via 4 queries de Danissa en SQL Editor (state drift PATTERNS.md §7 + schema validation Constitution §VI) + re-grep de callsites. Phase 2 (15 min) escribe la migración con pre/post-check `DO $$` y estructura canónica idéntica a specs 006/009. Phase 3 (20 min) aplica en 4 partes (pre-check, apply, post-verify, smoke opcional). Total **45-60 min**. Constitution §II driver, §IV bound enforced (1 migration + 2 tablas, rechaza `patient_goals` bundle).

## Technical Context

**Language/Version**: SQL (PostgreSQL 15 via Supabase). Sin cambios a frontend (JS/JSX).
**Primary Dependencies**: `pg_policies`, `pg_tables`, `information_schema.columns` (catalog). `auth.uid()` función (Supabase auth extension).
**Storage**: Supabase project ref `tomremkbuxvedliyywbo`. 2 tablas afectadas — `billing_invoices`, `patient_evaluations`. Ambas con RLS enabled + 0 policies + 0 rows pre-spec (per spec 012 audit).
**Testing**: smoke manual via SQL Editor (MCP execute_sql denegado para este proyecto — per CLAUDE.md y sesiones previas). Frontend callsites no se tocan — no hay test harness RLS automatizado.
**Target Platform**: Supabase SQL Editor (Danissa ejecuta). GitHub para migration file commit.
**Project Type**: SQL-only micro-bloque. 0 líneas de código aplicación.
**Performance Goals**: migration aplicable en <5 segundos (5 CREATE POLICY + 2 DO $$ check blocks). Evaluación de policy en runtime: subquery EXISTS con índice sobre `patient_care_team(user_id, patient_id)` y `patients(patient_user_id)` — debe ser <1ms per row. Si Phase 1 detecta ausencia de estos índices, documentar como follow-up.
**Constraints**:
- **FR-008**: exactamente 1 archivo nuevo — `supabase/migrations/20260420000004_apply_policies_billing_evaluations.sql`.
- **FR-006**: NO tocar `patient_goals` ni `patient_development_areas`.
- **FR-007**: NO `ENABLE RLS` (ya está), NO GRANT, NO schema changes.
- **FR-010**: Phase 1 valida esquema real de ambas tablas + `patient_care_team` + `patients` antes de escribir predicates.
- **Deploy**: Danissa aplica la migración, NO el ejecutor.
- **MCP execute_sql**: denegado — todas las queries van copy-paste al SQL Editor.
**Scale/Scope**: 5 policies, 1 archivo, ≈ 80-120 líneas SQL netas (incluyendo DO $$ blocks + comentarios + rollback block).

## Constitution Check

*GATE: Must pass before Phase 0. Re-check post-Phase 2 (migration writing).*

| Principio | Aplica | Estado | Nota |
|---|---|---|---|
| **I. Compliance-First** | Indirecto | ✅ PASS | `patient_evaluations` contiene PHI (evaluaciones clínicas). Las policies cumplen aislamiento per paciente (Ley 20.584 art. 12) y acceso clínico restringido a care_team (Ley 21.719 data minimization). Audit §III logging queda como responsabilidad del consumer (`useClinicalAccessLogger` en `patientApi.js` — follow-up si ausente). |
| **II. RLS-First Security** | Sí (driver) | ✅ PASS | Driver principal. Cierra gap fail-closed identificado en spec 012. 0 policies → 5 policies con principio least-privilege (terapeuta = own rows, paciente = own rows, admin = all). |
| **III. Append-Only Audit** | Indirecto | ⚠️ **flag** | `patientApi.js:159` (fetchPatientEvaluations) es lectura de PHI por staff clínico — debe invocar `useClinicalAccessLogger`. Phase 1 Query E (grep) verifica invocación. Si ausente → follow-up spec (no bloquea 014 per Scope Bounds). |
| **IV. Micro-Bloques** | Sí | ✅ PASS | 1 migration, 2 tablas, 0 código aplicación. `patient_goals` bundle rechazado explícitamente (spec futura). |
| **V. UI Honesty** | Indirecto | ⚠️ **flag** | Pre-spec, si `billing_invoices` recibiera data sin policy, el UI mostraría array vacío silencioso (falso "sin facturas"). Fix cierra esa posibilidad. Si Phase 3 smoke test revela que frontend NO maneja `PostgrestError` 42501 (permission denied por policy faltante), queda como follow-up spec UI honesty. No bloquea 014. |
| **VI. Schema Drift Zero** | Sí | ✅ PASS | FR-010 fuerza Phase 1 Query D (`information_schema.columns`) antes de escribir predicates. Aborta si columna referenciada no existe con el nombre asumido. |

**Resultado**: sin violaciones bloqueantes. 2 flags documentados (§III logging, §V error handling) quedan como follow-ups si Phase 1 los confirma — no bloquean el SQL.

## Project Structure

### Documentation (this feature)

```text
specs/014-apply-policies-billing-evaluations/
├── spec.md                          # /speckit-specify (commit 09409d5)
├── plan.md                          # este archivo
├── data-model.md                    # Phase 1 outputs (state + schema + callsites)
├── checklists/
│   └── requirements.md              # 12/12 PASS
└── tasks.md                         # /speckit-tasks (próxima fase)
```

### Source Code (repository root)

**Archivos autorizados** (exactamente 1 nuevo):

```text
supabase/migrations/20260420000004_apply_policies_billing_evaluations.sql
```

**Archivos NO autorizados** (dispara FR-007/008):
- Cualquier `.sql` otro (incluyendo otros en `supabase/migrations/` — no re-apply, no fix previos).
- Cualquier archivo bajo `src/**`.
- `supabase/seed.sql` o `supabase/schema.sql`.
- `.specify/memory/*` (puede editarse SOLO en close para doc hygiene, no durante implementation).

**Structure Decision**: micro-bloque SQL puro. La migración es self-contained (sin dependencias de otras migraciones excepto las que crearon las tablas — que ya están). Patrón canónico réplica de `20260420000002_restore_marketplace_purchases_policies.sql` (spec 009), adaptado para 2 tablas en lugar de 1.

---

## Phase 0 — Risk Register

### R-01. Schema drift detectado en Phase 1 — columnas asumidas no existen

**Síntoma potencial**: Phase 1 Query D reporta que `billing_invoices.therapist_id` no existe (p.ej., la columna real es `dentist_id`, `professional_id`, `user_id`). O `patient_evaluations.patient_id` tiene tipo inesperado. O `patient_care_team` tiene estructura distinta a lo asumido (p.ej., `therapist_id` en lugar de `user_id`). O `patients.patient_user_id` no existe (nombre real podría ser `user_id` o `linked_user_id`).

**Impacto**: si se escriben policies con nombre de columna equivocado, la migración aborta en `CREATE POLICY` con `column "X" does not exist` (blast radius: migration falla sin aplicar ningún CREATE — limpio, no deja estado intermedio).

**Mitigación**: Phase 1 Query D es bloqueante pre-migration write. FR-010 lo manda. SP-1 Check T4 requiere que Danissa pegue el output de Query D y los predicates SQL se escriban contra **columnas confirmadas**, no asumidas. Si nombre difiere de la asunción, documentar en `data-model.md §Schema confirmed` y ajustar el template ANTES de Phase 2.

**Probabilidad**: media. Spec 012 no validó schema de columnas (solo contó policies). El nombre `therapist_id` se asumió razonable, pero Supabase projects a veces usan `user_id` genérico.

### R-02. Callsites nuevos desde spec 012 que no están en análisis

**Síntoma potencial**: entre 2026-04-20 (fecha spec 012) y 2026-04-20 (fecha spec 014 execution — mismo día), alguien añadió un callsite adicional a `billing_invoices` o `patient_evaluations` no listado en los 5 conocidos. Si el callsite nuevo usa un patrón de acceso distinto (p.ej., lectura por `organization_id` en vez de `therapist_id`), las 2-3 policies por tabla podrían no cubrirlo → RLS fail-closed silent en el callsite nuevo.

**Impacto**: post-apply, feature del callsite nuevo muestra array vacío consistente sin error. Diagnóstico difícil si el dev del callsite nuevo no revisa spec 014 policies.

**Mitigación**: Phase 1 Task P1.5 re-grep amplio de `billing_invoices` + `patient_evaluations` en `src/` (no solo callsites conocidos). Si aparecen callsites nuevos con patrones distintos, documentar en `data-model.md §Callsites drift` y decidir:
- (a) si el patrón nuevo es admin → ya cubierto por policy "Admins manage ...";
- (b) si es therapist propio con filtro compatible → ya cubierto por "Therapists ...";
- (c) si es nuevo tipo de acceso (p.ej., shared clinic view) → **STOP** y agregar policy o postponer spec.

**Probabilidad**: baja-media. Mismo-día entre audit y apply reduce ventana.

### R-03. `patient_care_team` schema cambió entre spec 012 audit y hoy

**Síntoma potencial**: la policy "Therapists manage own patient evaluations" escribe un `EXISTS (SELECT 1 FROM patient_care_team WHERE user_id = auth.uid() AND patient_id = patient_evaluations.patient_id)`. Si entre audit (spec 012) y hoy (spec 014) una migración intermedia renombró columnas (p.ej., `user_id` → `therapist_id`) o cambió el patrón de vinculación, la policy fallará en `CREATE POLICY` (column does not exist) o pasará pero nunca matchean filas (policy silenciosa pero efectiva como deny-all para terapeutas).

**Impacto**:
- Fallo al crear: migration aborta, estado limpio — se fixea el SQL y se re-aplica.
- Silenciosamente deny-all: post-apply, terapeutas del care_team NO pueden crear/leer evaluaciones. Dispara rollback trigger #1 (feature rota) o #3 (console error en `patientApi.js:189`).

**Mitigación**: Phase 1 Query D incluye `patient_care_team` columns (no solo `billing_invoices`/`patient_evaluations`). SP-1 Check T4 valida que existen las columnas referenciadas por el EXISTS. Si schema cambió, ajustar subquery antes de Phase 2. Adicional: Phase 3 Parte 4 (smoke opcional con row manual) expone deny-all si ocurre — rollback activa antes de llegar a producción.

**Probabilidad**: baja. `patient_care_team` es tabla establecida (spec 003 migration `20260419000001_repair_patient_care_team.sql`). Pero las migraciones más recientes del repo no se han revisado explícitamente en este spec.

### R-04 (menor). `useClinicalAccessLogger` ausente en `patientApi.js:159`

**Síntoma**: Constitution §III exige logging de acceso clínico. `fetchPatientEvaluations` (`patientApi.js:159`) es lectura de PHI por staff — debe invocar el logger. Si falta, es violación §III pero no bloquea spec 014 (per Scope Bounds).

**Mitigación**: Phase 1 Query E (grep) verifica invocación. Si falta, documentar como follow-up spec `audit-evaluations-clinical-logger`, no bloquear 014. Sin impacto en la correctness del SQL de este spec.

**Probabilidad**: media. Spec 008 corrigió un gap similar en patient dashboard; `patient_evaluations` puede tener el mismo vacío sin detectar.

### R-05 (menor). Admin UI en `useInvoices.js:13` o `commissionsApi.js:30` depende de `service_role`

**Síntoma**: si el admin flow actual usa `service_role` para listar facturas (bypass RLS), la policy "Admins manage billing_invoices" es redundante pero inofensiva. Si usa `auth.uid()` de admin user, la policy es necesaria y debe funcionar.

**Mitigación**: Phase 1 Task P1.5 incluye leer los callsites para confirmar qué auth context usan. `service_role` en admin flows es anti-pattern (Constitution §II disfavors service_role bypass), pero si ya existe, documentar como follow-up separado.

**Probabilidad**: baja. Admin dashboard en DentalSpot usa session-auth estándar según patrón observado en specs previas.

---

## Phase 1 — Audit Defensivo (~15 min, STOP POINT SP-1)

**Objetivo**: re-verificar que el estado live del DB coincide con lo documentado en spec 012 + confirmar esquema real de columnas referenciadas + re-grep callsites para detectar drift. Cero SQL de escritura en esta fase.

**Regla operativa**: el ejecutor provee SQL copy-paste, Danissa ejecuta en Supabase SQL Editor y pega el output. Sin 🟢 GO al final de Phase 1, no se avanza a Phase 2.

### P1.1 — Query A: RLS enabled check (read-only)

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('billing_invoices', 'patient_evaluations')
ORDER BY tablename;
```

**Expected**: 2 rows, ambas con `rowsecurity = true`.

**If fail**: si alguna retorna `false`, el spec 014 NO aplica (requisito es "enabled + 0 policies"). STOP + ajustar (potencialmente agregar `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` a la migration, pero eso re-abre scope — consultar con advisor).

### P1.2 — Query B: policy_count pre-apply (state drift detection PATTERNS.md §7)

```sql
SELECT tablename, COUNT(*) AS policy_count
FROM pg_policies
WHERE tablename IN ('billing_invoices', 'patient_evaluations')
GROUP BY tablename
ORDER BY tablename;
```

**Expected**: 0 rows (GROUP BY sin matches → empty result).

**If fail**: si alguna retorna `policy_count > 0`, hay drift desde spec 012. Alguien creó policies manualmente. Output debe revelar qué policies existen. **STOP** — evaluar si las policies existentes son equivalentes al template (skip creation de las duplicadas) o conflictivas (consultar con advisor).

### P1.3 — Query C: row count (contexto para rollback)

```sql
SELECT 'billing_invoices' AS table_name, COUNT(*) AS row_count FROM billing_invoices
UNION ALL
SELECT 'patient_evaluations', COUNT(*) FROM patient_evaluations;
```

**Expected**: ambas con `row_count = 0` (per spec 012).

**If not 0**: investigar origen de las filas. Las policies siguen siendo correctas, pero (a) si es data de prueba en dev, OK continuar; (b) si es data real inesperada, STOP + investigar (quizás hay edge function service_role bypass previamente desconocido).

### P1.4 — Query D: schema real de columnas (FR-010, Constitution §VI)

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('billing_invoices', 'patient_evaluations', 'patient_care_team', 'patients', 'profiles')
ORDER BY table_name, ordinal_position;
```

**Expected columnas clave** (asunciones del spec):
- `billing_invoices.therapist_id` UUID
- `patient_evaluations.patient_id` UUID (FK patients)
- `patient_care_team.user_id` UUID (o `therapist_id`) + `patient_id` UUID
- `patients.patient_user_id` UUID (o `user_id`) — mapping auth.uid() → patient_id
- `profiles.id` UUID PK, `profiles.role` USER-DEFINED (enum `user_role`)

**If mismatch**: documentar en `data-model.md §Schema confirmed` con columna real. Ajustar predicates SQL en Phase 2 ANTES de escribir la migration. Si columna asumida no existe del todo, **STOP** + re-evaluar template con advisor.

### P1.5 — Re-grep callsites (callsite drift detection)

Ejecutor (sin intervención Danissa — vía Grep tool local):

```bash
grep -rn "billing_invoices" src/ --include="*.js" --include="*.jsx"
grep -rn "patient_evaluations" src/ --include="*.js" --include="*.jsx"
```

**Expected callsites conocidos**:
- `billing_invoices`: `src/features/membership/components/BillingHistory.jsx:27`, `src/features/admin/modules/billing/hooks/useInvoices.js:13`, `src/features/admin/api/commissionsApi.js:30`.
- `patient_evaluations`: `src/lib/patientApi.js:159` (SELECT), `src/lib/patientApi.js:189` (INSERT).

**If drift**:
- **Línea shifted ±5** OK (edits menores), actualizar line numbers en `data-model.md`.
- **Nuevo callsite con patrón compatible** (p.ej., admin read por `is_admin`) → documentar + validar cubierto por policies template.
- **Nuevo callsite con patrón incompatible** (p.ej., filtro por `organization_id` o `clinic_id`) → **STOP** + re-evaluar policies con advisor (posiblemente agregar policy o postponer spec).

### P1.6 — Query E (opcional, §III flag R-04): useClinicalAccessLogger en patientApi

Grep del ejecutor:

```bash
grep -n "useClinicalAccessLogger\|logClinicalAccess" src/lib/patientApi.js
```

**Expected**: al menos 1 match cerca de `:159` (fetchPatientEvaluations).

**If ausente**: documentar R-04 en `data-model.md §Audit flags` como follow-up spec. NO bloquea 014.

### P1.7 — Output `data-model.md`

Secciones a completar:
- `§Pre-apply snapshot` — Queries A/B/C outputs de Danissa.
- `§Schema confirmed` — Query D output + confirmación (o desvío) de column names.
- `§Callsites verified` — re-grep output + estado drift (ninguno / shifted / nuevo).
- `§Audit flags` — R-04 estado (logger presente o ausente).

### P1.8 — **STOP POINT SP-1**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T1** | Ambas tablas rowsecurity=true | Query A 2 rows, both true | Si false → STOP, re-evaluar scope (spec original no aplica) |
| **T2** | Ambas tablas policy_count=0 | Query B empty result (o 0) | Si >0 → STOP, investigar drift + consultar advisor |
| **T3** | Row counts = 0 (o justificados) | Query C ambos 0 | Si >0 sin justificación → investigar antes de apply |
| **T4** | Schema columnas confirmado | Query D muestra columnas asumidas existen con nombre correcto | Si mismatch → ajustar template en Phase 2 ANTES de escribir migration |
| **T5** | Callsites sin drift crítico | Re-grep retorna mismos 5 callsites ±5 líneas | Si nuevo callsite incompatible → STOP + re-evaluar |

**Reporte a Danissa** (bloquea Phase 2):

```markdown
## Phase 1 Report — spec 014

- Query A (RLS enabled): [2/2 true / hallazgo]
- Query B (policy_count=0): [confirm / drift detectado con N policies]
- Query C (row_count=0): [confirm / inesperado]
- Query D (schema): [columnas confirmadas / mismatch en X → ajuste Y]
- Callsites re-grep: [5/5 confirm / drift N=X]
- Audit §III flag: [logger presente / ausente → R-04 follow-up]
- Checks: T1 ✅ · T2 ✅ · T3 ✅ · T4 ✅ · T5 ✅

🟢 GO / 🔴 STOP
```

---

## Phase 2 — Migration escrita NO aplicada (~15 min, STOP POINT SP-2)

**Prerequisito**: SP-1 🟢 GO con schema confirmado.

### P2.1 — Crear archivo migration

**Path**: `supabase/migrations/20260420000004_apply_policies_billing_evaluations.sql`

**Estructura canónica** (réplica de `20260420000002` spec 009, adaptada para 2 tablas):

```text
1. Header con comentario + referencias:
   - Spec 014
   - Templates base: spec 012 data-model.md §Follow-up specs
   - Referencia patrón: spec 009 migration

2. Pre-check DO $$ ... END $$:
   - RAISE EXCEPTION si alguna tabla tiene rowsecurity=false
   - RAISE EXCEPTION si alguna tabla tiene policy_count>0 pre-apply
   - (Captura R-01/R-03 state drift si ocurre entre Phase 1 y apply)

3. Policies billing_invoices (2):
   - DROP POLICY IF EXISTS "Therapists read own billing_invoices" ON billing_invoices;
   - CREATE POLICY "Therapists read own billing_invoices" FOR SELECT
       USING (therapist_id = auth.uid());
   - DROP POLICY IF EXISTS "Admins manage billing_invoices" ON billing_invoices;
   - CREATE POLICY "Admins manage billing_invoices" FOR ALL
       USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role))
       WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role));

4. Policies patient_evaluations (3):
   - DROP + CREATE "Therapists manage own patient evaluations" FOR ALL
       USING (EXISTS (SELECT 1 FROM patient_care_team WHERE user_id = auth.uid()
                      AND patient_id = patient_evaluations.patient_id))
       WITH CHECK (EXISTS (...)) — mismo predicate.
   - DROP + CREATE "Patients read own evaluations" FOR SELECT
       USING (EXISTS (SELECT 1 FROM patients WHERE id = patient_evaluations.patient_id
                      AND patient_user_id = auth.uid()));
   - DROP + CREATE "Admins manage patient_evaluations" FOR ALL USING is_admin (same pattern).

5. Post-check DO $$ ... END $$:
   - SELECT policy_count billing_invoices — assert = 2
   - SELECT policy_count patient_evaluations — assert = 3
   - RAISE EXCEPTION si ≠ esperado

6. Rollback block comentado al final:
   /*
   -- Rollback spec 014:
   DROP POLICY IF EXISTS "Therapists read own billing_invoices" ON billing_invoices;
   DROP POLICY IF EXISTS "Admins manage billing_invoices" ON billing_invoices;
   DROP POLICY IF EXISTS "Therapists manage own patient evaluations" ON patient_evaluations;
   DROP POLICY IF EXISTS "Patients read own evaluations" ON patient_evaluations;
   DROP POLICY IF EXISTS "Admins manage patient_evaluations" ON patient_evaluations;
   */
```

**Ajustes según Phase 1 Query D**:
- Si `patient_care_team` usa `therapist_id` en vez de `user_id` → reemplazar.
- Si `patients` usa `user_id` en vez de `patient_user_id` → reemplazar.
- Si `billing_invoices` usa nombre distinto que `therapist_id` → reemplazar.

### P2.2 — Escribir archivo completo y capturar

Ejecutor escribe el archivo via Write tool. Cuenta líneas netas (esperado 80-120).

### P2.3 — **STOP POINT SP-2** (review SQL antes de apply)

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T6** | Archivo creado en path correcto | `supabase/migrations/20260420000004_apply_policies_billing_evaluations.sql` existe | Si path incorrecto → mover antes de report |
| **T7** | 5 CREATE POLICY + 5 DROP IF EXISTS previos | Count manual en diff | Si ≠ 5 pares → ajustar |
| **T8** | DO $$ pre-check + post-check presentes | 2 bloques DO $$ en el archivo | Si falta uno → agregar antes de report |
| **T9** | Predicates usan columnas confirmadas Phase 1 | Cross-check con §Schema confirmed | Si hay columna no confirmada → STOP, regrep + fix |
| **T10** | Sin cambios fuera del archivo autorizado | `git diff --name-only` solo muestra la migration | Si hay otros files modificados → revert esos |

**Reporte a Danissa con SQL completo** (bloquea Phase 3):

```markdown
## Phase 2 Report — spec 014

- Archivo: supabase/migrations/20260420000004_*.sql
- Líneas: [N]
- Policies creadas: 2 billing + 3 evaluations = 5
- Schema adjustments from Phase 1: [ninguno / lista]
- Checks: T6 ✅ · T7 ✅ · T8 ✅ · T9 ✅ · T10 ✅

SQL completo para review:
[pegar el contenido del archivo aquí — Danissa valida predicates antes de apply]

🟢 GO / 🔴 STOP
```

---

## Phase 3 — Apply + Verify en 4 Partes (~20 min, STOP POINT SP-3)

**Prerequisito**: SP-2 🟢 GO con SQL reviewed por advisor.

### P3.1 — Parte 1: Pre-check read-only (re-confirma pre-apply state)

Danissa en SQL Editor:

```sql
-- Re-verificar justo antes de apply (detect drift de Phase 1 → apply window)
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('billing_invoices', 'patient_evaluations');

SELECT tablename, COUNT(*) FROM pg_policies
WHERE tablename IN ('billing_invoices', 'patient_evaluations')
GROUP BY tablename;
```

**Expected**: idéntico a Phase 1 Query A/B.

**If drift**: STOP (policies creadas en el intervalo Phase 1→apply).

### P3.2 — Parte 2: Apply migration

Danissa copia el contenido completo de `20260420000004_*.sql` al SQL Editor y ejecuta. El pre-check DO $$ aborta si detecta drift (seguridad en profundidad). El resto crea las 5 policies. El post-check DO $$ aborta si policy_count final ≠ esperado.

**Expected**: `Success. No rows returned` con mensaje del RAISE NOTICE del post-check confirmando `policy_count billing=2, evaluations=3`.

**If error en apply**: NO hay estado parcial (DO $$ abort es atómico pre-check; CREATE POLICY dentro de transacción implícita). Reportar error + rollback trigger evaluación.

### P3.3 — Parte 3: Post-verify independiente

Danissa en SQL Editor:

```sql
-- Verificar 5 policies creadas
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('billing_invoices', 'patient_evaluations')
ORDER BY tablename, policyname;

-- Verificar rowsecurity preservado
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('billing_invoices', 'patient_evaluations');
```

**Expected**:
- 5 rows en pg_policies (2 billing + 3 evaluations) con nombres canónicos.
- 2 rows en pg_tables, ambas `rowsecurity=true`.

### P3.4 — Parte 4: Smoke opcional con rows de test

**Opcional** (si Danissa quiere confianza extra). SQL para insertar 1 row de test en cada tabla y verificar aislamiento:

```sql
-- Setup: obtener UUIDs
-- cristobal_uuid = '4e55fb74-b3b5-4233-9b5d-88d7a01a9046'
-- otro terapeuta_uuid = (alguno distinto)
-- paciente test_uuid = (uno existente en patients)

-- Insertar row billing
INSERT INTO billing_invoices (therapist_id, amount) VALUES ('4e55fb74-...', 1000);

-- Como Cristóbal (set session)
SET request.jwt.claim.sub = '4e55fb74-...';
SELECT * FROM billing_invoices;
-- Expected: 1 row

-- Como otro terapeuta
SET request.jwt.claim.sub = '<otro_uuid>';
SELECT * FROM billing_invoices;
-- Expected: 0 rows

-- Cleanup
RESET request.jwt.claim.sub;
DELETE FROM billing_invoices WHERE therapist_id = '4e55fb74-...';
```

**If smoke skip**: OK, Parte 3 (post-verify metadata) es suficiente para SC-001/SC-002. SC-004 queda pendiente de validación empírica pero spec no lo bloquea.

### P3.5 — **STOP POINT SP-3**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T11** | Pre-check (Parte 1) sin drift | Resultado idéntico a Phase 1 | Si drift → STOP + investigar |
| **T12** | Apply (Parte 2) sin error | `Success. No rows returned` + RAISE NOTICE post-check | Si error → rollback evaluation |
| **T13** | Post-verify (Parte 3) confirma 5 policies | 5 rows en pg_policies + 2 rowsecurity=true | Si ≠ → rollback inmediato |
| **T14** | Rollback trigger no activado | Sin crash de callsites, sin PostgrestError 42501 | Si trigger activado → rollback |

**Reporte final a Danissa**:

```markdown
## Phase 3 Report — spec 014

- Parte 1 pre-check: [resultado]
- Parte 2 apply: [Success / error]
- Parte 3 post-verify: [5 policies listadas + rowsecurity confirm]
- Parte 4 smoke opcional: [ejecutado/skipped, resultado si ejecutado]
- Checks: T11 ✅ · T12 ✅ · T13 ✅ · T14 ✅
- Regresiones detectadas: [ninguna / lista]
- Decisión: close / rollback / follow-up
```

---

## Stop Points resumen

| # | Ubicación | Criterio | Acción |
|---|---|---|---|
| **SP-0** | Pre-Phase 1 | tasks.md aprobado 6/6 | 🟢 GO explícito en thread |
| **SP-1** | Fin Phase 1 | T1-T5 PASS + schema confirmado | 🟢 GO → Phase 2 |
| **SP-2** | Fin Phase 2 | T6-T10 PASS + SQL reviewed por advisor | 🟢 GO → Phase 3 apply |
| **SP-3** | Fin Phase 3 | T11-T14 PASS post-apply | Decisión close / rollback / follow-up |

---

## Time Budget

| Phase | Tiempo | Contenido |
|---|---|---|
| Phase 1 — Audit defensivo | **15 min** | 4 queries Danissa + re-grep + data-model.md + SP-1 |
| Phase 2 — Migration escrita | **15 min** | Write file + review + SP-2 |
| Phase 3 — Apply + verify | **20 min** | 4 partes sequential + SP-3 |
| Buffer | **10 min** | Si se dispara R-01/R-02/R-03 |
| **Total** | **60 min** | Dentro del bound 45-60 del spec |

Si total real > **90 min** (bound superior spec): STOP implícito, re-evaluar con advisor.

---

## References

- `specs/012-audit-rls-enabled-zero-policies/data-model.md` §Follow-up specs (líneas 198-234) — templates base.
- `supabase/migrations/20260420000002_restore_marketplace_purchases_policies.sql` (spec 009) — patrón canónico de estructura.
- `supabase/migrations/20260420000001_*.sql` (spec 006) — patrón DO $$ pre-check.
- `.specify/memory/constitution.md §II` (RLS-First Security) — driver.
- `.specify/memory/constitution.md §VI` (Schema Drift Zero) — fundamento FR-010.
- `docs/PATTERNS.md §7` (state drift re-verification) — fundamento pre-check DO $$.
- `docs/PATTERNS.md §4` (audit defensivo) — fundamento Phase 1.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | Sin violaciones. Scope tight (1 archivo SQL, 2 tablas, 5 policies). `patient_goals` bundle rechazado explícitamente (Constitution §IV). 2 flags (§III logger, §V error handling) quedan como follow-ups sin bloquear. |
