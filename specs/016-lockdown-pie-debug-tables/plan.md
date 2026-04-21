# Implementation Plan: Lockdown PIE + debug_signup_logs Tables

**Branch**: `016-lockdown-pie-debug-tables` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-lockdown-pie-debug-tables/spec.md`

## Summary

Último P0 del RLS coverage audit. 6 tablas con `rowsecurity=DISABLED` → data leakage potencial para cualquier usuario autenticado. Fix **minimalista**: ENABLE RLS sin policies = deny-all default. Edge functions (service_role) siguen bypass. Callsites PIE wrapped en flag OFF son inocuos. Phase 1 (15 min) re-verifica live state + greps callsites + **decisión crítica FR-009** (si algún callsite NO está wrapped, STOP y reconsiderar). Phase 2 (10 min) escribe migración simple (6 ALTER TABLE + DO $$ checks, sin policies). Phase 3 (15 min) aplica en 4 partes. Total **45-60 min**. Patrón canónico ENABLE RLS replica de spec 006 migration `20260420000001`. Constitution §II driver, §IV bound enforced (sin policies complejas — reactivación PIE es spec futura).

## Technical Context

**Language/Version**: SQL (PostgreSQL 15 via Supabase). Sin cambios frontend.
**Primary Dependencies**: `pg_tables`, `pg_policies`, `information_schema.columns`.
**Storage**: Supabase project ref `tomremkbuxvedliyywbo`. 6 tablas afectadas — 5 PIE (`pie_sessions`, `pie_students`, `pie_paci`, `pie_schedule_blocks`, `pie_therapist_schools`) + 1 debug (`debug_signup_logs`). Todas con `rowsecurity=false` + 0 policies pre-spec (per audit 2026-04-20).
**Testing**: smoke manual via SQL Editor — como usuario autenticado no-admin ejecutar SELECT sobre 1 tabla PIE → expected array vacío (deny-all confirma). MCP execute_sql denegado — queries via copy-paste.
**Target Platform**: Supabase SQL Editor (Danissa aplica). GitHub para commit.
**Project Type**: SQL-only micro-bloque, más simple que specs 014/015 (sin policies, solo ALTER TABLE).
**Performance Goals**: migration aplicable en <2 segundos (6 ALTER TABLE ENABLE RLS es metadata-only, no toca datos). Sin impacto runtime: RLS enabled + 0 policies = deny-all evaluado en O(1) para cada query non-service-role (Postgres short-circuit).
**Constraints**:
- **FR-007**: 1 archivo nuevo — `supabase/migrations/20260420000006_lockdown_pie_debug_tables.sql`.
- **FR-002**: 0 policies por default. Excepción condicional solo si Phase 1 detecta callsite no-wrapped.
- **FR-006/011**: NO schema changes, NO grants, NO edits `src/**`, NO edits `FEATURE_FLAGS.*`, NO edits edge functions.
- **Deploy**: Danissa aplica, NO ejecutor.
**Scale/Scope**: ≈60-80 líneas SQL netas (mucho más corto que specs 014/015 por ausencia de CREATE POLICY).

## Constitution Check

*GATE: Must pass before Phase 0. Re-check post-Phase 2.*

| Principio | Aplica | Estado | Nota |
|---|---|---|---|
| **I. Compliance-First** | Sí (driver indirecto) | ✅ PASS | Tablas PIE contienen info sobre menores en programas educativos especiales (Ley 20.584 Art. 12 — privacidad de datos clínicos aplicable por analogía). `debug_signup_logs` expone emails + metadata cross-user. Lock-down cierra leakage potencial inmediato. |
| **II. RLS-First Security** | Sí (driver) | ✅ PASS | Driver principal. Cierra el último gap P0 del RLS coverage audit 2026-04-20. |
| **III. Append-Only Audit** | No | ✅ N/A | No toca audit tables. |
| **IV. Micro-Bloques** | Sí | ✅ PASS | 1 migration, 6 tablas, 0 policies (lock-down puro). Rechaza bundling reactivación PIE (spec futura). |
| **V. UI Honesty** | Indirecto | ⚠️ **flag** | Post-apply, si el `PIE_ESCOLAR` flag se activa sin spec de policies, UI PIE mostrará array vacío (deny-all aplica a admin también). Aceptable hoy (flag OFF). Documentar en architecture.md post-close que reactivación PIE debe escribir policies ANTES de flip flag. |
| **VI. Schema Drift Zero** | No | ✅ N/A | No referencia columnas específicas en predicates (no hay policies con predicates). |

**Resultado**: sin violaciones. Flag §V es documentación forward-looking, no bloqueante.

## Project Structure

### Documentation (this feature)

```text
specs/016-lockdown-pie-debug-tables/
├── spec.md                          # /speckit-specify (commit 2462e3b)
├── plan.md                          # este archivo
├── data-model.md                    # Phase 1 outputs (state + grep callsites + FR-009 decision)
├── checklists/
│   └── requirements.md              # 12/12 PASS
└── tasks.md                         # /speckit-tasks (próxima fase)
```

### Source Code (repository root)

**Archivos autorizados** (exactamente 1 nuevo):

```text
supabase/migrations/20260420000006_lockdown_pie_debug_tables.sql
```

**Archivos NO autorizados**:
- Cualquier `.sql` otro.
- `src/**` (FR-012 prohibe edits, incluso wrap de callsites si aparecen no-wrapped — STOP en lugar).
- `supabase/functions/**`.
- `supabase/seed.sql` / `supabase/schema.sql`.
- `.specify/memory/*` (solo post-merge para doc hygiene).

**Structure Decision**: migración SQL más simple de la serie. Sin CREATE POLICY significa menos superficie de error. Estructura: header + pre-check DO $$ + 6 ALTER TABLE + post-check DO $$ + rollback comentado.

---

## Phase 0 — Risk Register

### R-01. Callsite frontend NO wrapped descubierto (STOP per FR-009)

**Síntoma potencial**: Phase 1 grep revela una o más queries directas a `pie_*` o `debug_signup_logs` fuera de bloques `if (FEATURE_FLAGS.PIE_ESCOLAR)` o equivalentes. Ejemplos: admin tooling que lista signup logs sin wrap, componente legacy que accede a `pie_therapist_schools` incondicionalmente, debug helper que consulta `debug_signup_logs`.

**Impacto**: pure deny-all aplica a esos callsites → post-apply, la feature muestra empty state silencioso. Dispara rollback trigger #1. Si es data visible hoy con valor operativo, rollback inmediato.

**Mitigación**: FR-009 manda — Phase 1 detecta y **SP-1 bloquea** si >0 callsites no-wrapped. Decisión:
- (a) **Default (preferido)**: STOP y re-evaluar con advisor. Si callsite es admin dashboard → agregar "Admins manage <tabla>" policy mínima en Phase 2 (excepción documentada en FR-002). Si callsite es user-facing → spec debe rediseñarse (probablemente requiere policy proper).
- (b) Wrap el callsite en flag OFF — **fuera de scope spec 016** (toca `src/`).

**Probabilidad**: baja-media. Spec 010 confirmó `PIE_ESCOLAR = false`, y el módulo PIE es relativamente aislado. `debug_signup_logs` es el mayor riesgo (puede haber admin tool visible).

### R-02. Admin dashboard depende de estas tablas sin admin policy dedicada

**Síntoma potencial**: `src/features/admin/**` lista signup logs o data PIE para ops/support. Sin "Admins manage <tabla>" policy, post-lockdown esos listados quedan vacíos → admin queda ciego a signup errors.

**Impacto**: feature admin rota pero no user-facing. Mitigación inmediata: agregar `"Admins manage debug_signup_logs"` policy mínima en Phase 2 si Phase 1 lo detecta. Alternativa: documentar como "accept gap" — admin debe usar Supabase dashboard direct access (service_role implícito).

**Mitigación**: Phase 1 P1.6 grep específico `src/features/admin/**` para `debug_signup_logs` y `pie_*`. Si detectado, Phase 2 incluye 1-2 admin policies condicional (FR-002 excepción).

**Probabilidad**: media para `debug_signup_logs` (admin tooling típicamente lista logs), baja para PIE (feature dormant).

### R-03. Edge function NO usa service_role (rompería post-lockdown)

**Síntoma potencial**: Phase 1 grep `supabase/functions/**` revela edge function que hace INSERT/SELECT sobre estas tablas usando `ANON_KEY` en lugar de `SERVICE_ROLE_KEY` (configuración anómala). Post-apply, la edge function retorna `permission denied` 42501.

**Impacto**: signup flow potencialmente rompe (si `debug_signup_logs` INSERT usa anon). Rollback trigger #2.

**Mitigación**: Phase 1 P1.7 grep específico `supabase/functions/` buscando `createClient.*ANON\|createClient.*SUPABASE_ANON_KEY` que toque estas tablas. Si detectado, documentar + decidir: (a) agregar policy service_role-compatible explícita, (b) rechazar spec hasta que edge function se fixee.

**Probabilidad**: baja. Standard pattern Supabase es service_role para edge functions que escriben data sistema.

### R-04 (menor). State drift — alguien aplicó ENABLE RLS entre audit y apply

**Síntoma**: `pg_tables.rowsecurity = true` para alguna tabla pre-apply.

**Mitigación**: el pre-check DO $$ del script toma nota (sin abortar si rowsecurity=true Y policy_count=0 — es el estado target). Aborta solo si rowsecurity=true Y policy_count>0 (policies huérfanas del intervalo). El `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` es idempotente en PostgreSQL — re-run no error.

**Probabilidad**: baja. Mismo-día entre audit y apply reduce ventana.

### R-05 (menor). Tabla no existe en public (drop-recreate intermedio)

**Síntoma**: Phase 1 Query A/B devuelve < 6 rows (alguna tabla inexistente).

**Mitigación**: pre-check DO $$ verifica existencia en `pg_tables`. Si alguna falta → RAISE EXCEPTION + STOP.

**Probabilidad**: muy baja. Las 6 tablas existen per audit 2026-04-20; drop accidental raro.

---

## Phase 1 — Audit Defensivo (~15 min, STOP POINT SP-1)

**Objetivo**: re-verificar state live + greps exhaustivos de callsites + **decisión crítica FR-009**. Zero SQL de escritura.

### P1.1 — Query A: rowsecurity + policy_count (state drift PATTERNS.md §7)

```sql
SELECT
  'A' AS query,
  t.schemaname,
  t.tablename,
  t.rowsecurity,
  (SELECT COUNT(*) FROM pg_policies p
   WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename) AS policy_count
FROM pg_tables t
WHERE t.tablename IN (
  'pie_sessions', 'pie_students', 'pie_paci',
  'pie_schedule_blocks', 'pie_therapist_schools',
  'debug_signup_logs'
)
ORDER BY t.tablename;
```

**Expected**: 6 rows, todas `rowsecurity=false` + `policy_count=0`. Si alguna rowsecurity=true o policy_count>0 → drift detectado, R-04 activa.

**If rowsecurity=true Y policy_count=0 en alguna**: OK, es el estado target para esa tabla — skip ALTER TABLE en Phase 2 (idempotencia).

**If policy_count>0 en alguna**: STOP, investigar policies inesperadas.

### P1.2 — Query B: row count (contexto informativo)

```sql
SELECT 'pie_sessions' AS tbl, COUNT(*) FROM pie_sessions
UNION ALL SELECT 'pie_students', COUNT(*) FROM pie_students
UNION ALL SELECT 'pie_paci', COUNT(*) FROM pie_paci
UNION ALL SELECT 'pie_schedule_blocks', COUNT(*) FROM pie_schedule_blocks
UNION ALL SELECT 'pie_therapist_schools', COUNT(*) FROM pie_therapist_schools
UNION ALL SELECT 'debug_signup_logs', COUNT(*) FROM debug_signup_logs;
```

**Expected**: bajo (0 o pequeño para tablas PIE dormant; `debug_signup_logs` puede tener más si signup flow activo).

**Propósito**: contexto para rollback. Si alguna tiene data real inesperada (ej. pie_sessions con 100 rows), bandera amarilla — feature puede estar más activo de lo esperado.

### P1.3 — Query C: information_schema.columns (schema drift)

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'pie_sessions', 'pie_students', 'pie_paci',
    'pie_schedule_blocks', 'pie_therapist_schools',
    'debug_signup_logs'
  )
ORDER BY table_name, ordinal_position;
```

**Propósito**: verificar tablas existen y tienen columnas (catch drop-recreate anomalías). No se usan en predicates — este spec no crea policies con columnas referenciadas.

**Expected**: 6 tablas con ≥3 columnas cada una.

### P1.4 — Grep callsites frontend por tabla (FR-009 crítico)

Ejecutor vía Grep tool local:

```bash
grep -rn "pie_sessions\|pie_students\|pie_paci\|pie_schedule_blocks\|pie_therapist_schools" src/ --include="*.js" --include="*.jsx"
grep -rn "debug_signup_logs" src/ --include="*.js" --include="*.jsx"
```

**Para cada callsite encontrado**, documentar:
- Archivo + línea.
- Tipo (SELECT / INSERT / UPDATE / DELETE).
- **Contexto wrap**: leer las 10 líneas circundantes para determinar:
  - Dentro de `if (FEATURE_FLAGS.PIE_ESCOLAR)` o equivalente? → **wrapped, OK**.
  - Dentro de function que solo se llama desde PIE routes? → **transitivamente wrapped, OK**.
  - Dentro de admin route sin flag check? → **NO wrapped, R-01 activa**.
  - Fuera de cualquier flag? → **NO wrapped, R-01 activa**.

Documentar matriz en `data-model.md §Callsite wrap analysis`.

### P1.5 — Grep edge functions (R-03)

```bash
grep -rn "pie_sessions\|pie_students\|pie_paci\|pie_schedule_blocks\|pie_therapist_schools\|debug_signup_logs" supabase/functions/
```

**Para cada edge function encontrada**, verificar:
- ¿Usa `SERVICE_ROLE_KEY` / `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`?
- Si NO usa service_role → R-03 activa, documentar.

Documentar en `data-model.md §Edge functions audit`.

### P1.6 — Grep admin tooling específico (R-02)

```bash
grep -rn "pie_sessions\|pie_students\|debug_signup_logs" src/features/admin/
```

Si algún callsite → R-02 activa, decisión en Phase 2:
- (a) agregar "Admins manage <tabla>" policy mínima.
- (b) documentar gap (admin usa Supabase dashboard direct).

### P1.7 — Output `data-model.md`

Secciones:
- `§Pre-apply snapshot` — Queries A/B/C outputs.
- `§Callsite wrap analysis` — matriz por tabla: callsite count + wrapped/no-wrapped.
- `§Edge functions audit` — service_role confirmados o R-03 findings.
- `§Admin tooling audit` — R-02 findings.
- `§FR-009 Decision` — **DECISIÓN CRÍTICA**:
  - **Option 1 — Pure lock-down (default preferido)**: 0 callsites no-wrapped + 0 admin callsites requiring policy → proceed sin policies.
  - **Option 2 — Lock-down con 1-2 admin policies mínimas**: Si Phase 1 detecta admin callsites → Phase 2 incluye "Admins manage <tabla>" para las tablas afectadas.
  - **Option 3 — STOP**: Si cualquier callsite user-facing no-wrapped → spec requiere redesign, reportar + esperar decisión advisor.

### P1.8 — **STOP POINT SP-1**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T1** | 6 tablas confirmadas en DB | Query A retorna 6 rows | Si <6 → R-05, STOP |
| **T2** | rowsecurity=false para las 6 (o true + 0 policies) | Query A output | Si policy_count>0 → drift, STOP |
| **T3** | row_counts documentados | Query B output capturado | — informativo |
| **T4** | Callsites wrap analysis completo | Cada callsite clasificado wrapped/no-wrapped | Si incompleto → re-run grep |
| **T5** | **FR-009 Decision documentada** | `data-model.md §FR-009 Decision` con Option 1/2/3 elegida + rationale | **Sin decisión → no avanzar** |

**Reporte a Danissa** (bloquea Phase 2):

```markdown
## Phase 1 Report — spec 016

- Query A: [6/6 rowsecurity=false + policy_count=0 / drift en X]
- Query B: [row_counts por tabla]
- Query C: [tablas/columnas confirmadas]
- Frontend callsites:
  * pie_* tablas: [N callsites, todos wrapped en FEATURE_FLAGS.PIE_ESCOLAR / N no-wrapped]
  * debug_signup_logs: [N callsites, contexto wrap]
- Edge functions: [N edge functions, todas service_role / drift R-03]
- Admin tooling: [0 matches / N matches → decisión Phase 2]
- FR-009 Decision: [Option 1 pure / Option 2 con N admin policies / Option 3 STOP]
- Checks: T1 ✅ · T2 ✅ · T3 ✅ · T4 ✅ · T5 ✅

🟢 GO / 🔴 STOP
```

---

## Phase 2 — Migration Escrita NO Aplicada (~10 min, STOP POINT SP-2)

**Prerequisito**: SP-1 🟢 GO con FR-009 Decision documentada.

### P2.1 — Crear archivo migration

**Path**: `supabase/migrations/20260420000006_lockdown_pie_debug_tables.sql`

**Estructura canonical** (replica de spec 006 `20260420000001` ENABLE RLS pattern, adaptado):

```text
1. Header :1-20 — comentario con spec 016 title, origen (RLS coverage audit 2026-04-20),
   approach minimal (deny-all default), referencias spec 006 patrón + Constitution §II.
   Explicitar FR-009 decision: pure lock-down o con N admin policies.

2. Pre-check DO $$ :21-55 — para cada tabla en lista:
   - verificar existe en pg_tables (R-05)
   - verificar rowsecurity=false O (rowsecurity=true Y policy_count=0) — target state compatible
   - RAISE EXCEPTION si policy_count>0 en alguna (drift)
   RAISE NOTICE con estado pre.

3. ALTER TABLE block :56-80 — 6 statements:
   ALTER TABLE public.pie_sessions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.pie_students ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.pie_paci ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.pie_schedule_blocks ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.pie_therapist_schools ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.debug_signup_logs ENABLE ROW LEVEL SECURITY;

4. (CONDICIONAL según Phase 1) Admin policies :81-100 — solo si FR-009 Option 2:
   DROP + CREATE "Admins manage <tabla>" FOR ALL is_admin pattern (replica spec 014).

5. Post-check DO $$ :101-135 — assertions:
   - 6 tablas con rowsecurity=true
   - policy_count = N esperado (0 si pure, N>0 si admin policies agregadas)
   RAISE NOTICE con conteos finales.

6. Rollback block comentado :136-150 — 6 ALTER TABLE DISABLE + DROP condicional admin policies.
```

**Estimado**: 60-100 líneas según FR-009 decision (más corto en Option 1 pure).

### P2.2 — Escribir archivo completo

### P2.3 — **STOP POINT SP-2** (review SQL)

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T6** | Path correcto | `supabase/migrations/20260420000006_*.sql` | — |
| **T7** | 6 ALTER TABLE ENABLE RLS presentes | Count manual | Si ≠6 → ajustar |
| **T8** | Pre-check + post-check DO $$ presentes | 2 bloques DO $$ | — |
| **T9** | Post-check hardcodea conteo correcto | Match Option 1 (0) o Option 2 (N) según Phase 1 | — |
| **T10** | 0 archivos fuera del autorizado | `git diff --name-only` | Si otros → revert |

**Reporte a Danissa con SQL completo** (bloquea Phase 3):

```markdown
## Phase 2 Report — spec 016

- Archivo: supabase/migrations/20260420000006_*.sql
- Líneas: [N]
- FR-009 variante: [Option 1 pure / Option 2 con admin policies]
- Policies creadas: [0 / N]
- Checks: T6-T10

SQL completo:
[pegar contenido para review]

🟢 GO / 🔴 STOP
```

---

## Phase 3 — Apply + Verify 4 Partes (~15 min, STOP POINT SP-3)

**Prerequisito**: SP-2 🟢 GO con SQL reviewed.

### P3.1 — Parte 1: pre-check read-only

Re-run Query A justo antes de apply. Expected idéntico a Phase 1. Si drift → STOP.

### P3.2 — Parte 2: apply migration (atómico)

Danissa copia contenido del `.sql` al SQL Editor y ejecuta. Pre-check DO $$ aborta si drift. 6 ALTER TABLE + (opcional) admin policies. Post-check DO $$ aborta si conteo ≠ esperado.

**Expected**: `Success. No rows returned` + RAISE NOTICE confirmando 6 tablas rowsecurity=true + policy_count=[0 o N].

### P3.3 — Parte 3: post-verify independiente

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN (<6 tablas>)
ORDER BY tablename;

SELECT tablename, COUNT(*) FROM pg_policies
WHERE tablename IN (<6 tablas>)
GROUP BY tablename
ORDER BY tablename;
```

**Expected**: 6 tablas rowsecurity=true + policy_count matching Option 1/2.

### P3.4 — Parte 4: smoke opcional

**Smoke a (recomendado)**: como usuario autenticado no-admin en DevTools console del app:
```js
const { data, error } = await supabase.from('pie_sessions').select('*').limit(1);
console.log('data:', data, 'error:', error);
// Expected: data=[] (empty array, deny-all silent) o error con código 42501
```

**Smoke b (opcional)**: verificar dashboard therapist (con PIE_ESCOLAR=false) no muestra cambios — carga normal, sin console errors nuevos.

**Smoke c (si R-03 detectado Phase 1)**: invocar edge function signup con payload test → verificar INSERT a debug_signup_logs exitoso.

### P3.5 — **STOP POINT SP-3**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T11** | Pre-check (Parte 1) sin drift | Idéntico Phase 1 | Si drift → STOP |
| **T12** | Apply (Parte 2) sin error | Success + RAISE NOTICE | Si error → rollback eval |
| **T13** | Post-verify (Parte 3) confirma 6 rowsecurity=true + conteo | Match esperado | Si ≠ → rollback |
| **T14** | Smoke a: deny-all confirmado | Empty array o 42501 | Si data devuelta inesperada → policy_count mal, investigar |
| **T15** | Smoke b: dashboard therapist sin regresión | Carga normal | Si error → R-01 descubrimiento tardío, rollback trigger #1 |

**Reporte final**:

```markdown
## Phase 3 Report — spec 016

- Parte 1 pre-check: [resultado]
- Parte 2 apply: [Success / error]
- Parte 3 post-verify: [6 rowsecurity=true + conteo policies]
- Parte 4 smoke a: [deny-all confirm / data inesperada]
- Parte 4 smoke b: [dashboard OK / error]
- Parte 4 smoke c (si ejecutado): [edge function OK / error]
- Checks: T11-T15
- Regresiones: [ninguna / lista]
- Decisión: close / rollback / follow-up
```

---

## Stop Points resumen

| # | Ubicación | Criterio | Acción |
|---|---|---|---|
| **SP-0** | Pre-Phase 1 | tasks.md aprobado 6/6 | 🟢 GO Danissa |
| **SP-1** | Fin Phase 1 | T1-T5 PASS + **FR-009 Decision** documentada | 🟢 GO → Phase 2 |
| **SP-2** | Fin Phase 2 | T6-T10 PASS + SQL reviewed | 🟢 GO → Phase 3 |
| **SP-3** | Fin Phase 3 | T11-T15 PASS post-apply | Decisión close / rollback / follow-up |

---

## Time Budget

| Phase | Tiempo | Contenido |
|---|---|---|
| Phase 1 — Audit | **15 min** | 3 queries + greps frontend/edge/admin + FR-009 decision + SP-1 |
| Phase 2 — Migration | **10 min** | Write file (variante Option 1 o 2) + review + SP-2 |
| Phase 3 — Apply + verify | **15 min** | 4 partes sequential + smoke + SP-3 |
| Buffer | **10 min** | Si R-01/R-02/R-03 |
| **Total** | **50 min** | Dentro bound 45-60 spec |

Si total > **90 min**: STOP + re-evaluar.

---

## References

- `.specify/memory/architecture.md §"RLS coverage audit"` — fuente del listado 6 tablas.
- `supabase/migrations/20260420000001_*.sql` (spec 006) — patrón canónico ENABLE RLS + DO $$ pre/post-check.
- `specs/010-cleanup-fonokit-dead-code/` — fuente de confirmación `PIE_ESCOLAR = false` (feature flags inventory).
- `specs/014-apply-policies-billing-evaluations/` + `specs/015-apply-policies-goals/` — patrones de DO $$ check (re-utilizados).
- `.specify/memory/constitution.md §II` — driver.
- `.specify/memory/constitution.md §IV` — bound (sin policies complejas).
- `docs/PATTERNS.md §7` — state drift re-verification.
- `docs/PATTERNS.md §4` — audit defensivo.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | Sin violaciones. Scope tight: 1 archivo, 6 tablas, 0 policies (default) o 1-2 admin policies (excepción condicional). Approach "pure deny-all" es **más simple que specs 014/015** (no CREATE POLICY). Reactivación PIE bundle rechazada por §IV — spec futura. |
