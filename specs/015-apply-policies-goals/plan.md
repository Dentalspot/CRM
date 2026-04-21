# Implementation Plan: Apply Policies patient_goals + patient_development_areas

**Branch**: `015-apply-policies-goals` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-apply-policies-goals/spec.md`

## Summary

Último GROUP B de spec 012. Bundled 2 tablas (`patient_goals` + `patient_development_areas`) en 1 migración por FK embed — policies coordinadas evitan inconsistencia. **4-5 policies totales** (rango determinado por Phase 1 Query D: si `patient_development_areas` tiene `patient_id` → per-patient con 5 policies; si es catálogo shared → 4 policies con "Everyone read"). Réplica directa del patrón canónico spec 014 migration `20260420000004` — mismos ajustes schema ya validados (`patient_care_team.dentist_id` + `is_active=true`, `patients.profile_id = auth.uid()`). Phase 1 (10-15 min) re-verifica state + schema + resuelve decisión shared vs per-patient. Phase 2 (15 min) escribe migración. Phase 3 (20 min) apply en 4 partes. Total **45-60 min** dentro bound spec. Post-close, GROUP B = 3/3 resueltos, `architecture.md §RLS enabled zero-policies audit` se actualiza a "completed".

## Technical Context

**Language/Version**: SQL (PostgreSQL 15 via Supabase). Sin cambios frontend.
**Primary Dependencies**: `pg_policies`, `pg_tables`, `information_schema.columns`, `information_schema.table_constraints`, `auth.uid()`.
**Storage**: Supabase project ref `tomremkbuxvedliyywbo`. 2 tablas afectadas — ambas RLS enabled + 0 policies + 0 rows pre-spec (per spec 012 + re-verify Phase 1).
**Testing**: smoke manual via SQL Editor (MCP execute_sql denegado). Opcional smoke de 1 edge function service_role para confirmar bypass intacto.
**Target Platform**: Supabase SQL Editor (Danissa ejecuta). GitHub para commit.
**Project Type**: SQL-only micro-bloque. 0 líneas de código aplicación.
**Performance Goals**: <5 segundos para apply (4-5 CREATE POLICY + 2 DO $$). Runtime: EXISTS subquery vs `patient_care_team(dentist_id, patient_id)` — <1ms per row si índice existe (ya cubierto por spec 011 FK indexes prioritarios, confirmar en Phase 1 Query D).
**Constraints**:
- **FR-008**: exactamente 1 archivo nuevo — `supabase/migrations/20260420000005_apply_policies_goals_development_areas.sql`.
- **FR-006/007**: NO ALTER TABLE ni ENABLE RLS (ya está) ni grants ni cambios schema.
- **FR-010**: Phase 1 Query D valida esquema real + decide shared vs per-patient.
- **FR-011**: NO tocar edge functions ni service_role grants.
- **Deploy**: Danissa aplica, NO ejecutor.
- **MCP execute_sql denegado** — SQL via copy-paste.
**Scale/Scope**: 4-5 policies, 1 archivo, ≈90-140 líneas SQL netas (mayor que spec 014 por post-check con conteo condicional).

## Constitution Check

*GATE: Must pass before Phase 0. Re-check post-Phase 2.*

| Principio | Aplica | Estado | Nota |
|---|---|---|---|
| **I. Compliance-First** | Indirecto | ✅ PASS | `patient_goals` contiene plan terapéutico (data clínica sensible, Ley 20.584). User Story 2 garantiza derecho del paciente a leer su propio plan (art. 12). Policies cumplen data minimization Ley 21.719 via care_team aislamiento. |
| **II. RLS-First Security** | Sí (driver) | ✅ PASS | Driver principal. Cierra 3ra y última tabla GROUP B. |
| **III. Append-Only Audit** | Indirecto | ⚠️ **flag** | Lecturas de `patient_goals` por staff clínico deberían invocar `useClinicalAccessLogger`. Phase 1 grep verifica. Si ausente → follow-up spec (no bloquea 015). Mismo criterio aplicado en spec 014 para `patient_evaluations`. |
| **IV. Micro-Bloques** | Sí | ✅ PASS | 1 migration, 2 tablas bundled por FK embed (justificado — policies coordinadas evitan inconsistencia), 0 código aplicación. |
| **V. UI Honesty** | Indirecto | ⚠️ **flag** | Pre-spec, si `patient_goals` recibiera data sin policy, UI mostraría array vacío silencioso. Fix cierra esa posibilidad. Follow-up UI honesty si detectan comportamiento no defendido. |
| **VI. Schema Drift Zero** | Sí | ✅ PASS | FR-010 fuerza Phase 1 Query D. Decisión shared vs per-patient apoyada en schema observable (presencia/ausencia de `patient_id`). |

**Resultado**: sin violaciones bloqueantes. 2 flags heredados del patrón spec 014 — follow-ups si Phase 1 los confirma.

## Project Structure

### Documentation (this feature)

```text
specs/015-apply-policies-goals/
├── spec.md                          # /speckit-specify (commit 3b1d0d9)
├── plan.md                          # este archivo
├── data-model.md                    # Phase 1 outputs (state + schema + decisión shared/per-patient)
├── checklists/
│   └── requirements.md              # 12/12 PASS
└── tasks.md                         # /speckit-tasks (próxima fase)
```

### Source Code (repository root)

**Archivos autorizados** (exactamente 1 nuevo):

```text
supabase/migrations/20260420000005_apply_policies_goals_development_areas.sql
```

**Archivos NO autorizados**:
- Cualquier `.sql` otro.
- `src/**`, `supabase/functions/**` (edge functions permanecen intactas).
- `supabase/seed.sql` o `supabase/schema.sql`.
- `.specify/memory/*` (solo en close para doc hygiene, post-merge).

**Structure Decision**: micro-bloque SQL puro. Réplica directa de spec 014 migration — mismos DO $$ pre/post-check, mismos ajustes schema ya validados en producción. Conteo final de policies determinístico post-Phase 1.

---

## Phase 0 — Risk Register

### R-01. Schema drift — columnas asumidas no existen

**Síntoma potencial**: Phase 1 Query D reporta que `patient_goals.patient_id` no existe, o `patient_goals.development_area_id` no existe (nombre distinto), o FK constraint `patient_goals_development_area_id_fkey` tiene otro nombre. O `patient_development_areas.id` no existe. O `patient_care_team`/`patients` cambiaron schema desde spec 014 (improbable — 0 días entre).

**Impacto**: si los predicates referencian columnas inexistentes, `CREATE POLICY` aborta con `column does not exist` (estado limpio, no parcial). Rollback automático por aborto de transacción DDL.

**Mitigación**: Phase 1 Query D es bloqueante pre-Phase 2. SP-1 T4 requiere que Danissa confirme schema real antes de escribir predicates. Ajustar nombres en Phase 2 según findings. `patient_care_team.dentist_id + is_active` y `patients.profile_id` ya fueron validados en spec 014 (mismo día) — bajo riesgo de drift.

**Probabilidad**: baja. Spec 014 validó las tablas compartidas hace horas. Schema de `patient_goals` y `patient_development_areas` aún no confirmado — dependencia crítica de Query D.

### R-02. Decisión shared vs per-patient para `patient_development_areas` incorrecta

**Síntoma potencial**: Phase 1 Query D detecta ausencia de `patient_id` en `patient_development_areas` → se asume catálogo shared → se crea policy "Everyone read ..." FOR SELECT USING (true) + "Admins manage". Pero en runtime, alguna feature espera filtrar por patient (feature que no se detectó en grep porque usa la embed). Resultado: todos los therapeutas ven todas las áreas (potencial over-sharing) donde el diseño intended era per-patient.

Alternativa invertida: tabla es shared pero se eligió per-patient → "Therapists manage own ..." via care_team falla deny-all para todas las lecturas, rompiendo el embed desde `patient_goals`.

**Impacto**:
- Over-sharing (shared elegido erróneamente): potencial violación data minimization Ley 21.719. Baja severidad si las áreas son genéricas (p.ej. "estética", "funcionalidad"); alta si contienen data per-patient.
- Deny-all (per-patient elegido erróneamente): embed desde `patient_goals` retorna `area: null` → User Story 1 Acceptance 2 falla → regression trigger #1.

**Mitigación**: Phase 1 Query D no solo observa `patient_id` — también observa cardinalidad: `SELECT COUNT(DISTINCT CASE WHEN patient_id IS NULL THEN 'global' ELSE patient_id::text END) FROM patient_development_areas` (si la tabla está vacía, usar `information_schema.columns` solamente; si tiene data, cardinalidad decide). Phase 2 doc decision with rationale. Smoke test en Phase 3 Parte 4 cubre User Story 1 Acceptance 2 — si el embed devuelve null, rollback.

**Probabilidad**: media. Sin data real en las tablas, decidir "shared vs per-patient" es inferencia de schema — puede fallar si semántica es ambigua.

### R-03. Edge functions se rompen post-apply (service_role debería bypassar pero verificar)

**Síntoma potencial**: spec 012 confirma 4 edge functions usan service_role y por ende bypassan RLS. Si una edge function se actualizó entre spec 012 y 015 para usar `anon` o user-auth en lugar de service_role (mal configuración), post-apply la query fallará con `permission denied` cuando pre-apply pasaba.

**Impacto**: feature AI rota (suggest-treatment, rag-query, analyze-progress, recommend-purchases). Si rompe una UI activa, dispara rollback trigger #3 del spec.

**Mitigación**: Phase 1 Query E opcional lista las edge functions que consumen las 2 tablas (via grep en `supabase/functions/**` o consulta API Supabase). Phase 3 Parte 4 smoke opcional invoca 1 edge function (p.ej. `suggest-treatment` con payload mínimo) para verificar 200 OK post-apply. Si alguna edge no tiene service_role, documentar como bug pre-existente (no introducido por spec 015) y flag para follow-up.

**Probabilidad**: baja-media. Edge functions típicamente no se modifican casualmente, pero 0 validación explícita desde spec 012.

### R-04 (menor). `useClinicalAccessLogger` ausente en consumidores de `patient_goals`

**Síntoma**: Constitution §III exige logging de acceso clínico PHI. `patient_goals` contiene data de plan terapéutico — lectura por staff debería loggear. Spec 014 confirmó que el logger NO está presente en `patientApi.js` (R-04 de ese spec). Muy probable que `patient_goals` consumers tampoco lo invoquen.

**Mitigación**: Phase 1 grep verifica. Si ausente → documentar como follow-up spec `audit-clinical-phi-logging` (bundle `patient_evaluations` + `patient_goals` + otros), NO bloquea 015. Consumer responsibility, no policy responsibility.

**Probabilidad**: alta. Spec 008 hallazgo + spec 014 confirm + sin fix intermedio = probablemente gap en todo PHI read en frontend.

### R-05 (menor). FK embed constraint name mismatch en consumidores

**Síntoma**: si el consumer frontend embed usa `area:patient_development_areas!<constraint_name>(...)` y el constraint_name real en Supabase difiere (p.ej. auto-generado con hash distinto), el embed devuelve null aun con policies correctas.

**Mitigación**: Phase 1 re-grep revela el constraint name usado en código. Query D (extended) lee `information_schema.table_constraints` para comparar. No afecta las policies (son del lado DB) — solo diagnóstico preventivo. No bloquea.

**Probabilidad**: baja. El constraint name lo genera Supabase determinísticamente por nombre de tabla + columna.

---

## Phase 1 — Audit Defensivo (~10-15 min, STOP POINT SP-1)

**Objetivo**: re-verificar estado + confirmar schema real + decidir shared vs per-patient para `patient_development_areas`. Cero SQL de escritura.

### P1.1 — Query A: RLS enabled check

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('patient_goals', 'patient_development_areas')
ORDER BY tablename;
```

**Expected**: 2 rows, ambas rowsecurity=true. Si false en alguna → STOP, consultar advisor.

### P1.2 — Query B: policy_count pre-apply (PATTERNS.md §7)

```sql
SELECT tablename, COUNT(*) AS policy_count
FROM pg_policies
WHERE tablename IN ('patient_goals', 'patient_development_areas')
GROUP BY tablename
ORDER BY tablename;
```

**Expected**: empty result (0 both). Si >0 → drift, STOP.

### P1.3 — Query C: row count

```sql
SELECT 'patient_goals' AS t, COUNT(*) FROM patient_goals
UNION ALL
SELECT 'patient_development_areas', COUNT(*) FROM patient_development_areas;
```

**Expected**: ambas con 0. Si >0, validar origen antes de apply.

### P1.4 — Query D: schema validation + shared/per-patient decision (FR-010, CRITICAL)

```sql
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'patient_goals', 'patient_development_areas',
    'patient_care_team', 'patients', 'profiles'
  )
ORDER BY table_name, ordinal_position;
```

**Expected columnas clave**:
- `patient_goals`: `id`, `patient_id` UUID (FK patients), `development_area_id` UUID (FK patient_development_areas), + campos goal.
- `patient_development_areas`: `id`, `name` TEXT, + **¿`patient_id` presente?** ← decisión critica.
- `patient_care_team.dentist_id` + `patient_id` + `is_active` (re-confirm spec 014).
- `patients.profile_id` (re-confirm spec 014).
- `profiles.id` + `role` enum.

**Decisión shared vs per-patient**:
- **Si `patient_development_areas` TIENE `patient_id`** → **per-patient**. 5 policies totales (3 goals + 2 development_areas replicando patrón care_team). Batch rollback usa "Therapists manage own patient development areas".
- **Si `patient_development_areas` NO TIENE `patient_id`** → **shared catalog**. 4 policies totales (3 goals + 2 development_areas: "Everyone read patient_development_areas" FOR SELECT USING (true) + "Admins manage"). Batch rollback usa "Everyone read".

**If mismatch con asunciones spec 014** (`patient_care_team.dentist_id` renombrado, `patients.profile_id` renombrado): STOP + re-evaluar.

### P1.5 — Query D extended: FK constraints validation

```sql
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('patient_goals', 'patient_development_areas');
```

**Expected**:
- `patient_goals_patient_id_fkey` → patients(id)
- `patient_goals_development_area_id_fkey` → patient_development_areas(id)
- Si `patient_development_areas` tiene `patient_id` → `patient_development_areas_patient_id_fkey` → patients(id)

Esto mitiga R-05 (FK embed naming consumer) documentando el constraint name canónico.

### P1.6 — Re-grep callsites frontend

```bash
grep -rn "patient_goals" src/ --include="*.js" --include="*.jsx"
grep -rn "patient_development_areas" src/ --include="*.js" --include="*.jsx"
```

**Expected**: 2 callsites frontend de `patient_goals` (spec 012 lista) + embed de `patient_development_areas` vía FK. Si nuevos callsites con patrones distintos, documentar en `data-model.md §Callsites drift`.

### P1.7 — Query E (opcional, R-03): edge functions con service_role

```bash
grep -rn "patient_goals\|patient_development_areas" supabase/functions/
```

Confirmar 4 edge functions listadas en spec 012 + verificar uso de `SERVICE_ROLE_KEY` o `createClient(..., serviceRoleKey)` en cada una. Documentar en `data-model.md §Edge functions bypass`. No bloquea pero informa smoke test Phase 3 Parte 4.

### P1.8 — Query F (opcional, R-04): clinical logger en consumidores

```bash
grep -n "useClinicalAccessLogger\|logClinicalAccess" src/ --include="*.js" --include="*.jsx" | grep -i "goal"
```

**Expected si Constitution §III cumplido**: al menos 1 match en los callsites de `patient_goals`. Si 0 matches → R-04 follow-up spec (no bloquea 015).

### P1.9 — Output `data-model.md`

Secciones:
- `§Pre-apply snapshot` — Queries A/B/C outputs.
- `§Schema confirmed` — Query D output + decisión shared vs per-patient con rationale.
- `§FK constraints` — Query D extended output.
- `§Callsites verified` — frontend grep + edge functions status.
- `§Audit flags` — R-04 logger status.
- `§Decision log` — shared vs per-patient + conteo final de policies (4 o 5).

### P1.10 — **STOP POINT SP-1**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T1** | Ambas tablas rowsecurity=true | Query A 2 rows, both true | Si false → STOP, re-evaluar scope |
| **T2** | Ambas tablas policy_count=0 | Query B empty (o 0) | Si >0 → drift, STOP |
| **T3** | Row counts = 0 (o justificados) | Query C | Si >0 sin justificación → investigar |
| **T4** | Schema Query D confirma columnas (patient_goals.patient_id, .development_area_id, patient_care_team.dentist_id + is_active, patients.profile_id) | Columnas existentes con nombre canónico | Si mismatch → ajustar predicates Phase 2 |
| **T5** | Decisión shared vs per-patient para patient_development_areas documentada con rationale | Query D muestra presencia/ausencia de patient_id + decisión en `§Decision log` | Si decisión ambigua → consultar advisor |

**Reporte a Danissa** (bloquea Phase 2):

```markdown
## Phase 1 Report — spec 015

- Query A: [2/2 rowsecurity=true]
- Query B: [confirm 0/0]
- Query C: [confirm row_count=0 ambas]
- Query D: [columnas clave confirmadas / mismatch]
- Decisión shared vs per-patient: [shared / per-patient] porque [razón]
- Conteo final policies: [4 / 5]
- FK constraints: [confirmados / mismatch]
- Callsites frontend: [2 conocidos confirm / drift N]
- Edge functions service_role: [4 confirm / drift]
- §III logger flag: [presente / ausente → R-04 follow-up]
- Checks: T1 ✅ · T2 ✅ · T3 ✅ · T4 ✅ · T5 ✅

🟢 GO / 🔴 STOP
```

---

## Phase 2 — Migration Escrita NO Aplicada (~15 min, STOP POINT SP-2)

**Prerequisito**: SP-1 🟢 GO con shared vs per-patient decidido.

### P2.1 — Crear archivo migration

**Path**: `supabase/migrations/20260420000005_apply_policies_goals_development_areas.sql`

**Estructura canonical** (réplica directa de `20260420000004` spec 014, adaptada):

```text
1. Header :1-20 — spec 015 context + referencias spec 012 Template 3 + spec 014 patrón + decisión Phase 1 (shared o per-patient) + conteo policies esperado (4 o 5).

2. Pre-check DO $$ :21-55 — rowsecurity=true + policy_count=0 para ambas tablas. Mismo patrón que spec 014.

3. patient_goals policies :56-105 — 3 policies:
   (a) "Therapists manage own patient goals" FOR ALL via care_team (dentist_id + is_active=true + patient_id match).
   (b) "Patients read own goals" FOR SELECT via patients.profile_id = auth.uid().
   (c) "Admins manage patient_goals" FOR ALL is_admin pattern.

4. patient_development_areas policies :106-145 (variante según Phase 1):
   Si per-patient (5 policies total):
     (d) "Therapists manage own patient development areas" FOR ALL via care_team.
     (e) "Admins manage patient_development_areas" FOR ALL is_admin.
   Si shared catalog (4 policies total):
     (d) "Everyone read patient_development_areas" FOR SELECT USING (true).
     (e) "Admins manage patient_development_areas" FOR ALL is_admin.

5. Post-check DO $$ :146-180 — assertions policy_count:
   patient_goals = 3
   patient_development_areas = 2
   Total = 5 (per-patient) o 4 (shared) — el DO $$ verifica el total esperado hardcoded basado en Phase 1 decision.
   rowsecurity=true preservado en ambas.

6. Rollback block comentado :181-200 — 5 DROP POLICY IF EXISTS (ajustado según variante elegida).
```

**Ajustes schema según Phase 1 Query D**:
- Si `patient_care_team` NO usa `dentist_id` (improbable per spec 014) → reemplazar.
- Si `patient_goals.patient_id` NO existe con ese nombre → re-evaluar.
- Si `patient_development_areas` tiene `patient_id` → usar per-patient variant.

### P2.2 — Escribir archivo + conteo líneas

Ejecutor escribe via Write tool. Esperado 180-200 líneas (mayor que spec 014's 169 por 1 tabla extra y post-check más robusto).

### P2.3 — **STOP POINT SP-2** (review SQL)

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T6** | Path correcto | `supabase/migrations/20260420000005_*.sql` | — |
| **T7** | 4-5 DROP IF EXISTS + 4-5 CREATE POLICY | Count manual del diff coincide con decisión Phase 1 | Si ≠ → ajustar |
| **T8** | Pre-check + Post-check DO $$ presentes | 2 bloques DO $$ en el archivo | Si falta → agregar |
| **T9** | Predicates usan columnas confirmadas Phase 1 | Cross-check con `§Schema confirmed` | Si columna no confirmada → STOP |
| **T10** | Post-check hardcodea conteo correcto (4 o 5) | Match decisión Phase 1 | Si no match → corregir |
| **T11** | 0 archivos fuera del autorizado modificados | `git diff --name-only` solo muestra la migration | Si hay otros → revert |

**Reporte a Danissa con SQL completo** (bloquea Phase 3):

```markdown
## Phase 2 Report — spec 015

- Archivo: supabase/migrations/20260420000005_*.sql
- Líneas: [N]
- Policies creadas: 3 patient_goals + 2 patient_development_areas = [4 o 5] según Phase 1
- Variante patient_development_areas: [per-patient / shared catalog]
- Schema adjustments: [ninguno / lista]
- Checks: T6 ✅ · T7 ✅ · T8 ✅ · T9 ✅ · T10 ✅ · T11 ✅

SQL completo para review:
[pegar contenido del archivo — Danissa valida predicates y variante elegida]

🟢 GO / 🔴 STOP
```

---

## Phase 3 — Apply + Verify 4 Partes (~20 min, STOP POINT SP-3)

**Prerequisito**: SP-2 🟢 GO con SQL reviewed.

### P3.1 — Parte 1: pre-check read-only

Re-run Query A + B justo antes de apply (detect drift Phase 1→apply window). Expected idéntico a Phase 1.

### P3.2 — Parte 2: apply (atómico, ambas tablas juntas)

Danissa pega contenido completo del `.sql` al SQL Editor y ejecuta. Pre-check DO $$ aborta si drift. Post-check DO $$ aborta si count ≠ esperado. Statements entre DO $$ se ejecutan en transacción implícita.

**Nota operativa**: aunque el user mencionó "Parte 2 apply patient_goals policies" + "Parte 3 apply patient_development_areas policies" separados para trazabilidad, el archivo canonical se aplica como 1 único bloque para garantizar atomicidad. La trazabilidad viene del post-check discriminando conteos por tabla.

**Expected**: `Success. No rows returned` + RAISE NOTICE confirmando `patient_goals=3, patient_development_areas=2, total=[4 o 5]`.

### P3.3 — Parte 3: post-verify independiente

```sql
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('patient_goals', 'patient_development_areas')
ORDER BY tablename, policyname;

SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('patient_goals', 'patient_development_areas');
```

**Expected**: 4 o 5 rows en pg_policies + 2 rows pg_tables ambas rowsecurity=true. Documentar en `data-model.md §Post-apply snapshot`.

### P3.4 — Parte 4: smoke opcional — edge functions bypass + FK embed

**Sub-parte 4a** (opcional R-03): invocar 1 edge function (p.ej. `suggest-treatment` con payload mínimo seguro). Verificar 200 OK.

**Sub-parte 4b** (recomendado — SC-005): SQL con rows de test:
```sql
-- Setup
-- cristobal_uuid = '4e55fb74-b3b5-4233-9b5d-88d7a01a9046'
-- paciente_test = <existing patient en care_team>

INSERT INTO patient_development_areas (name, ...) VALUES ('Test Area', ...) RETURNING id;
-- Si per-patient, también INSERT patient_id
-- Capturar el ID retornado como DA_ID

INSERT INTO patient_goals (patient_id, development_area_id, ...) VALUES (paciente_test, DA_ID, ...);

-- Como Cristóbal (en care_team)
SET request.jwt.claim.sub = '4e55fb74-...';
SELECT *, area:patient_development_areas!patient_goals_development_area_id_fkey(name)
FROM patient_goals WHERE patient_id = paciente_test;
-- Expected: 1 row con area.name poblada

-- Cleanup
RESET request.jwt.claim.sub;
DELETE FROM patient_goals WHERE patient_id = paciente_test;
DELETE FROM patient_development_areas WHERE id = DA_ID;
```

Si el embed retorna null → R-02 confirmado (decisión shared/per-patient errónea) → rollback.

### P3.5 — **STOP POINT SP-3**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T12** | Pre-check (Parte 1) sin drift | Idéntico a Phase 1 | Si drift → STOP |
| **T13** | Apply (Parte 2) sin error | Success + RAISE NOTICE | Si error → rollback eval |
| **T14** | Post-verify (Parte 3) confirma conteos | 3+2=5 (per-patient) o 3+2=4 (shared) + rowsecurity=true | Si ≠ → rollback |
| **T15** | Smoke 4b (si ejecutado) muestra embed poblado | `area:patient_development_areas.name` no null | Si null → R-02, rollback |
| **T16** | Edge function smoke 4a (si ejecutado) 200 OK | Sin regression | Si error → R-03 investigar |

**Reporte final**:

```markdown
## Phase 3 Report — spec 015

- Parte 1 pre-check: [resultado]
- Parte 2 apply: [Success / error]
- Parte 3 post-verify: [4 o 5 policies + rowsecurity confirm]
- Parte 4a edge function: [ejecutado/skipped, resultado]
- Parte 4b SQL smoke: [ejecutado/skipped, embed populated yes/no]
- Checks: T12-T16
- Regresiones: [ninguna / lista]
- Decisión: close / rollback / follow-up
```

---

## Stop Points resumen

| # | Ubicación | Criterio | Acción |
|---|---|---|---|
| **SP-0** | Pre-Phase 1 | tasks.md aprobado 6/6 | 🟢 GO Danissa |
| **SP-1** | Fin Phase 1 | T1-T5 PASS + decisión shared/per-patient + schema confirmado | 🟢 GO → Phase 2 |
| **SP-2** | Fin Phase 2 | T6-T11 PASS + SQL reviewed (hard block — incluye decisión variante) | 🟢 GO → Phase 3 |
| **SP-3** | Fin Phase 3 | T12-T16 PASS post-apply + smoke validation | Decisión close / rollback / follow-up |

---

## Time Budget

| Phase | Tiempo | Contenido |
|---|---|---|
| Phase 1 — Audit | **10-15 min** | Queries A/B/C/D/D-ext + greps + decisión + SP-1 |
| Phase 2 — Migration | **15 min** | Write file (variante elegida) + review + SP-2 |
| Phase 3 — Apply + verify | **20 min** | 4 partes + smoke opcional + SP-3 |
| Buffer | **10 min** | Si dispara R-01/R-02/R-03 |
| **Total** | **55-60 min** | Dentro bound 45-60 del spec |

Si total > **90 min**: STOP + re-evaluar.

---

## References

- `specs/012-audit-rls-enabled-zero-policies/data-model.md` §Follow-up specs Template 3 — scope original.
- `supabase/migrations/20260420000004_apply_policies_billing_evaluations.sql` (spec 014) — patrón canónico directo, replica.
- `supabase/migrations/20260420000002_restore_marketplace_purchases_policies.sql` (spec 009) — patrón base DO $$.
- `specs/014-apply-policies-billing-evaluations/data-model.md` — schema ya validado para `patient_care_team.dentist_id/is_active` y `patients.profile_id`.
- `.specify/memory/constitution.md §II` — driver.
- `.specify/memory/constitution.md §VI` — fundamento FR-010.
- `docs/PATTERNS.md §7` — state drift re-verification.
- `docs/PATTERNS.md §4` — audit defensivo.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Bundle 2 tablas en 1 migration | FK embed requiere policies coordinadas. Separar rompe el embed transiently entre apply 1 y apply 2. | Rechazado: 2 migrations separadas crearían ventana de inconsistencia donde `patient_goals` está cubierto pero `patient_development_areas` embed devuelve null. |
