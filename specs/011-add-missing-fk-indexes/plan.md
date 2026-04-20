# Implementation Plan: Add Missing FK Indexes

**Branch**: `011-add-missing-fk-indexes` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-add-missing-fk-indexes/spec.md`

## Summary

Performance optimization DB quirúrgica: crear 7 índices btree estándar sobre FKs sin índice identificados en Express block audit 2026-04-20. Phase 1 confirma live state (existencia de FKs + ausencia de índices + row counts baseline) vía 3 queries a catálogos postgres. Phase 2 escribe migration idempotente `20260420000003_add_missing_fk_indexes.sql` replicando estructura canonical de spec 006/009. Phase 3 aplica en SQL Editor + verifica con `EXPLAIN ANALYZE` sobre 2 queries representativas. Tiempo estimado: **45–60 min** (Phase 1: 10 · Phase 2: 15 · Phase 3: 20 · buffer: 10). Patrón canónico de referencia: migration `20260420000002_restore_marketplace_purchases_policies.sql` (spec 009, commit `0b89ba3`).

## Technical Context

**Language/Version**: SQL (PostgreSQL 15 de Supabase). No código JS/TS.
**Primary Dependencies**: Supabase Postgres. `EXPLAIN ANALYZE` para verificación.
**Storage**: 7 tablas afectadas en schema `public`: `appointments`, `commissions`, `clinic_invoices`, `clinical_history`. Sin cambios de schema — solo nuevos objetos `INDEX`.
**Testing**: Manual en Supabase SQL Editor (pre-check + apply + post-check + EXPLAIN ANALYZE × 2).
**Target Platform**: producción Supabase (`tomremkbuxvedliyywbo`).
**Project Type**: Performance optimization DB. No introduce features ni toca runtime behavior.
**Performance Goals**: reducir sequential scans en queries con filtro/JOIN por los 7 FKs. Beneficio mensurable con `EXPLAIN ANALYZE`.
**Constraints**:
- **FR-010**: 0 cambios de schema de tablas.
- **FR-011**: 0 cambios en `src/**`.
- **FR-012**: 0 índices sobre los ~23 FKs excluidos (spec futura).
- **FR-013**: `CREATE INDEX IF NOT EXISTS` defense-in-depth.
- El deploy (aplicar migration vía SQL Editor) lo hace Danissa; el ejecutor prepara queries y el archivo.
**Scale/Scope**: 1 archivo nuevo (migration). 7 índices creados. Regression: 0 callsites frontend afectados (índices transparentes al cliente).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Aplica | Estado | Nota |
|---|---|---|---|
| **I. Compliance-First** | No | ✅ N/A | No toca PHI ni auth ni consent. |
| **II. RLS-First Security** | No | ✅ N/A | Índices son transparentes a RLS — no cambian visibilidad ni policies. |
| **III. Append-Only Audit** | No | ✅ N/A | No toca `clinical_audit_log` ni hook. |
| **IV. Micro-Bloques** | Sí | ✅ PASS con guardrails | FR-010/011/012 formalizan scope (1 migration, 7 índices). ~23 FKs excluidos con grouping por prefijo. |
| **V. UI Honesty** | No | ✅ N/A | No UI change. |
| **VI. Schema Drift Zero** | Parcial | ✅ PASS | Agregar índices no cambia columnas referenciadas por código. Índices son metadata pura del storage engine, no estructura lógica. |

**Resultado**: sin violaciones. Plan respeta scope tight.

## Project Structure

### Documentation (this feature)

```text
specs/011-add-missing-fk-indexes/
├── spec.md                    # /speckit-specify (commit 13b0015)
├── plan.md                    # este archivo
├── data-model.md              # Phase 1 output — matrix 7 FKs × [exists, indexed, row_count]
├── checklists/
│   └── requirements.md        # /speckit-specify (12/12 pass)
└── tasks.md                   # /speckit-tasks (próxima fase)
```

### Source Code (repository root)

```text
supabase/migrations/
└── 20260420000003_add_missing_fk_indexes.sql   # NUEVO — único artefacto code
```

**Archivos NO autorizados** (dispara FR-010/011/012):
- `src/**` — FR-011.
- `supabase/migrations/*` pre-existentes — append-only.
- `supabase/policies.sql` — fuera de scope (índices no se listan ahí).
- Cualquier otro FK fuera de los 7 listados.

**Structure Decision**: migration timestamped con convención `YYYYMMDDHHMMSS_snake_case.sql`. Estructura interna replica `20260420000002_restore_marketplace_purchases_policies.sql` (spec 009, última migration con DO $$ pre/post checks).

---

## Phase 0 — Risk Register

### R-01. FK listado fue renombrado o removido entre audit y apply

**Síntoma potencial**: Phase 1 Query A no retorna una fila esperada (ej. `commissions.therapist_id` fue renombrada a `commissions.therapist_profile_id` entre el audit del 2026-04-20 y el momento de apply). Migration fallaría con `column "therapist_id" does not exist` al `CREATE INDEX`.

**Mitigación**: Phase 1 Query A es hard-gate de SP-1 — si cualquier FK listado no aparece, STOP + reportar antes de escribir migration. Ajustar lista basado en Query A antes de Phase 2.

### R-02. Índice ya existe con nombre no estándar (colisión potential)

**Síntoma potencial**: alguien creó manualmente un índice sobre `appointments.service_id` con un nombre distinto a `idx_appointments_service_id` (ej. `appointments_service_idx` o `appointments_service_id_key`). Phase 1 Query B debe detectarlo — buscar por `indexdef LIKE '%service_id%'` y no solo por `indexname = idx_...`. Si existe índice no estándar, no hay colisión técnica con `CREATE INDEX IF NOT EXISTS idx_...` (nombre distinto crea un nuevo índice), pero duplicaría storage sin beneficio adicional.

**Mitigación**: Phase 1 Query B busca `pg_indexes` con `indexdef LIKE '%<columna>%'` (no solo `indexname`). Si retorna índice con nombre distinto → documentar en `data-model.md`. Decisión default: skip el CREATE INDEX del FR-006 para esa columna (ya cubierto por índice existente); ajustar post-check count. FR-002 del spec lo formaliza.

### R-03. EXPLAIN ANALYZE muestra Seq Scan en tabla grande post-apply

**Síntoma potencial**: tras crear el índice, el query planner decide usar Seq Scan en lugar del índice. Causas posibles:
- **Tabla muy chica** (< ~100 rows): Seq Scan es objetivamente más rápido que random seek. Este es el caso esperado y tolerado (FR-009 + edge case en spec). **NO es falla**.
- **Estadísticas desactualizadas**: el planner necesita `ANALYZE` tras crear índice para considerar usarlo. `CREATE INDEX` debería disparar auto-analyze, pero si no, un `ANALYZE <tabla>` explícito resuelve.
- **Corrupción de índice** (extremadamente raro): índice se creó pero catálogo inconsistente. Requiere `REINDEX`.

**Mitigación**: Phase 3 Parte 4 ejecuta EXPLAIN ANALYZE. Si aparece Seq Scan:
1. Verificar row count de la tabla — si < 100 rows, **documentar y pasar** (no-rollback trigger).
2. Si > 100 rows, correr `ANALYZE <tabla>` explícito y re-ejecutar EXPLAIN ANALYZE.
3. Si persiste Seq Scan con tabla grande → R-03 abort trigger, investigar con Danissa antes de commit.

---

## Phase 1 — Audit Defensivo (obligatorio, ~10 min, STOP POINT SP-1)

**Objetivo**: confirmar live state de los 7 FKs y ausencia de índices pre-existentes. Producir `data-model.md` con matrix verificable.

**Regla operativa** (`docs/PATTERNS.md §4`): cero DDL productivo hasta que Phase 1 termine y SP-1 valide scope.

### P1.1 — Query A: existencia de los 7 FKs en live state

Objetivo: confirmar que los 7 FKs listados en el spec están vigentes (nombres de tabla + columna + referencia).

```sql
SELECT
  c.conname AS constraint_name,
  cl.relname AS table_name,
  a.attname AS column_name,
  refcl.relname AS ref_table,
  refa.attname AS ref_column
FROM pg_constraint c
JOIN pg_class cl         ON cl.oid = c.conrelid
JOIN pg_attribute a      ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
JOIN pg_class refcl      ON refcl.oid = c.confrelid
JOIN pg_attribute refa   ON refa.attrelid = c.confrelid AND refa.attnum = ANY(c.confkey)
WHERE c.contype = 'f'
  AND cl.relnamespace = 'public'::regnamespace
  AND (
    (cl.relname = 'appointments'     AND a.attname = 'service_id')     OR
    (cl.relname = 'commissions'      AND a.attname = 'therapist_id')   OR
    (cl.relname = 'commissions'      AND a.attname = 'sale_id')        OR
    (cl.relname = 'clinic_invoices'  AND a.attname = 'patient_id')     OR
    (cl.relname = 'clinic_invoices'  AND a.attname = 'therapist_id')   OR
    (cl.relname = 'clinical_history' AND a.attname = 'entry_type')     OR
    (cl.relname = 'clinical_history' AND a.attname = 'diagnosis_id')
  )
ORDER BY table_name, column_name;
```

**Output esperado**: 7 filas (1 por cada FK).

**Scope check**: si retorna `< 7` → **SP-1 STOP trigger R-01**, identificar qué FK falta y consultar con Danissa. Si retorna `> 7` → hallazgo (hay FKs adicionales a los listados, probablemente otros; documentar para spec futura).

### P1.2 — Query B: existencia de índices pre-existentes

Objetivo: confirmar que **ninguna** de las 7 columnas tiene índice previo (evita duplicados + valida la premisa del spec).

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('appointments', 'commissions', 'clinic_invoices', 'clinical_history')
  AND (
    indexdef LIKE '%(service_id)%'    OR indexdef LIKE '%, service_id)%'    OR indexdef LIKE '%(service_id,%'    OR
    indexdef LIKE '%(therapist_id)%'  OR indexdef LIKE '%, therapist_id)%'  OR indexdef LIKE '%(therapist_id,%'  OR
    indexdef LIKE '%(sale_id)%'       OR indexdef LIKE '%, sale_id)%'       OR indexdef LIKE '%(sale_id,%'       OR
    indexdef LIKE '%(patient_id)%'    OR indexdef LIKE '%, patient_id)%'    OR indexdef LIKE '%(patient_id,%'    OR
    indexdef LIKE '%(entry_type)%'    OR indexdef LIKE '%, entry_type)%'    OR indexdef LIKE '%(entry_type,%'    OR
    indexdef LIKE '%(diagnosis_id)%'  OR indexdef LIKE '%, diagnosis_id)%'  OR indexdef LIKE '%(diagnosis_id,%'
  )
ORDER BY tablename, indexname;
```

**Output esperado**: 0 filas (ningún índice pre-existente sobre las 7 columnas objetivo).

**Scope check**:
- Si retorna `0 filas` → **T2 PASS** para las 7 columnas.
- Si retorna filas con columna en el índice → identificar:
  - **Índice sobre columna objetivo sola (`(service_id)`)**: duplicado directo. Skip ese CREATE INDEX en Phase 2; documentar.
  - **Índice compuesto donde la columna es la PRIMERA (`(service_id, other)`)**: cubre nuestro caso (Postgres puede usar prefijo). Skip ese CREATE INDEX; documentar.
  - **Índice compuesto donde la columna NO es la primera (`(other, service_id)`)**: NO cubre equality por service_id solo; CREATE INDEX sigue siendo necesario. Documentar y proceder.

Nota: la query usa `indexdef LIKE` con 3 variantes por columna para capturar los casos anteriores con diferenciación.

### P1.3 — Query C: row counts baseline (no-bloqueante)

Objetivo: baseline para dimensionar apply time + expectativa de beneficio. `pg_stat_user_tables.n_live_tup` es una estimación (no exacta) pero suficiente.

```sql
SELECT
  relname AS table_name,
  n_live_tup AS estimated_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN ('appointments', 'commissions', 'clinic_invoices', 'clinical_history')
ORDER BY n_live_tup DESC;
```

**Output esperado**: 4 filas con `estimated_rows` variable.

**Uso**: si alguna tabla muestra > 1M rows, considerar `CREATE INDEX CONCURRENTLY` en Phase 2 (FR-005 del spec). Si todas < 100K, apply será instantáneo. Informativo, no bloqueante.

### P1.4 — Persistir en `data-model.md`

Al cierre de Phase 1, escribir con 4 secciones:

1. **§Phase 1 Pre-check snapshot** — output literal de Query A (7 filas esperadas) + Query B (0 o N filas) + Query C.
2. **§FK verification matrix** — tabla:

   | # | FK (table.column → ref) | Exists (A) | Pre-existing index (B) | Row count (C) | Action in Phase 2 |
   |---|---|---|---|---|---|
   | 1 | `appointments.service_id → therapist_services.id` | ✅ / ❌ | none / idx_name | N | CREATE / skip |
   | 2 | `commissions.therapist_id → profiles.id` | ✅ / ❌ | ... | N | ... |
   | ... | ... | ... | ... | ... | ... |

3. **§Policy strategy decision** — ajustes al conteo esperado post-check (default: 7 nuevos índices; si algún CREATE se skip por R-02 parcial, post-check espera menor N).
4. **§SP-1 checks** — estado de T1..T3.

### P1.5 — **STOP POINT SP-1**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T1** | Los 7 FKs aparecen en Query A | `COUNT(*) = 7` | STOP R-01, investigar FK missing. |
| **T2** | 0 índices pre-existentes sobre las 7 columnas | Query B retorna 0 o solo índices compuestos no-cubrientes | Si cubren → ajustar lista (skip CREATE INDEX) y documentar; si parcial cover, decidir con Danissa. |
| **T3** | Row counts capturados para las 4 tablas | Query C retorna 4 filas con valores numéricos | — (captura, no scope check). Si alguna > 1M → flag para considerar `CONCURRENTLY`. |

**Reporte a Danissa** (bloquea Phase 2 sin 🟢 GO):

```markdown
## Phase 1 Report — spec 011

- Query A output: [N FKs encontrados, lista resumida]
- Query B output: [M índices pre-existentes, lista o "ninguno"]
- Query C baseline: [row counts por tabla]
- Ajustes a CREATE INDEX list: [lista final — 7 default o menos si R-02 skip]
- policy_count esperado post-check: [7 o menor]
- Scope check: T1 ✅ · T2 ✅ · T3 ✅
- Recomendación: proceder a Phase 2 / ajustar / abortar

🟢 GO / 🔴 STOP
```

---

## Phase 2 — Migration Write (~15 min, STOP POINT SP-2)

**Prerequisito**: SP-1 🟢 GO.

### P2.1 Archivo a crear

`supabase/migrations/20260420000003_add_missing_fk_indexes.sql`

### P2.2 Estructura canonical (réplica de `20260420000002_restore_marketplace_purchases_policies.sql`)

```text
1. HEADER comment
   - Spec 011 ref + fecha
   - Origen (Express block audit §Performance audit — FKs sin índice)
   - Lista de los 7 índices a crear
   - Tabla de reference (target FKs)
   - Constitution IV (Micro-Bloques)

2. DO $$ PRE-CHECK
   - Confirmar 7 FKs existen en pg_constraint (cuenta)
   - Confirmar 0 índices pre-existentes sobre las 7 columnas (o N_skip)
   - RAISE EXCEPTION si alguna falla, RAISE NOTICE con estado

3. CREATE INDEX IF NOT EXISTS × 7 (default; o menos si Phase 1 reportó duplicado)
   - idx_appointments_service_id
   - idx_commissions_therapist_id
   - idx_commissions_sale_id
   - idx_clinic_invoices_patient_id
   - idx_clinic_invoices_therapist_id
   - idx_clinical_history_entry_type
   - idx_clinical_history_diagnosis_id

4. DO $$ POST-CHECK
   - Verificar 7 índices existen en pg_indexes (o N esperado)
   - Verificar 7 FK constraints siguen en pg_constraint (intactos)
   - RAISE EXCEPTION / RAISE NOTICE

5. Rollback block (comentado, no ejecutable)
   - DROP INDEX IF EXISTS × 7
```

### P2.3 Templates de CREATE INDEX (FR-006 + FR-007 + FR-013)

```sql
-- btree default, sin predicado, IF NOT EXISTS defense-in-depth
CREATE INDEX IF NOT EXISTS idx_appointments_service_id
  ON public.appointments (service_id);

CREATE INDEX IF NOT EXISTS idx_commissions_therapist_id
  ON public.commissions (therapist_id);

CREATE INDEX IF NOT EXISTS idx_commissions_sale_id
  ON public.commissions (sale_id);

CREATE INDEX IF NOT EXISTS idx_clinic_invoices_patient_id
  ON public.clinic_invoices (patient_id);

CREATE INDEX IF NOT EXISTS idx_clinic_invoices_therapist_id
  ON public.clinic_invoices (therapist_id);

CREATE INDEX IF NOT EXISTS idx_clinical_history_entry_type
  ON public.clinical_history (entry_type);

CREATE INDEX IF NOT EXISTS idx_clinical_history_diagnosis_id
  ON public.clinical_history (diagnosis_id);
```

**Nota sobre `CONCURRENTLY`**: omitido por default porque las 7 tablas se esperan < 100K rows (Query C confirma en Phase 1). Si Phase 1 revela alguna > 1M → se agrega `CONCURRENTLY` a ese CREATE específico (requiere también sacar la sentencia del DO $$ block si aplica — `CONCURRENTLY` no se puede ejecutar dentro de DO blocks ni transactions).

### P2.4 Rollback block (al final del archivo, comentado)

```sql
-- Rollback (NO ejecutar, solo referencia):
-- DROP INDEX IF EXISTS public.idx_appointments_service_id;
-- DROP INDEX IF EXISTS public.idx_commissions_therapist_id;
-- DROP INDEX IF EXISTS public.idx_commissions_sale_id;
-- DROP INDEX IF EXISTS public.idx_clinic_invoices_patient_id;
-- DROP INDEX IF EXISTS public.idx_clinic_invoices_therapist_id;
-- DROP INDEX IF EXISTS public.idx_clinical_history_entry_type;
-- DROP INDEX IF EXISTS public.idx_clinical_history_diagnosis_id;
```

### P2.5 **STOP POINT SP-2** · review de SQL sin aplicar

**Criterio**: migration escrita en disco, NO aplicada en DB. Danissa revisa y confirma:

- Los 7 `CREATE INDEX IF NOT EXISTS` siguen la naming convention `idx_<table>_<column>` exacta (FR-006).
- Cada `CREATE INDEX` referencia la columna real confirmada en Phase 1 Query A.
- Pre-check espera N esperado (7 por default o el ajustado por R-02).
- Post-check verifica N coincide.
- Rollback block cubre los mismos 7 (o ajustado) DROP INDEX IF EXISTS.
- No hay `CONCURRENTLY` inesperado (solo si Phase 1 lo justificó).

**Sin 🟢 GO, no se avanza a Phase 3 (apply).**

---

## Phase 3 — Verificación (~20 min)

**Prerequisito**: SP-2 🟢 GO + migration.sql commiteada en repo (no aplicada).

### P3.1 — Parte 1: Pre-check read-only en SQL Editor (~5 min)

Danissa re-ejecuta Query A + Query B + Query C en producción sin aplicar DDL.

**Expectativa**: mismo output que Phase 1 (nada cambió entre Phase 1 y ahora). Si hay drift (ej. un nuevo índice creado manualmente desde Phase 1) → re-evaluar SP-1 antes de apply.

### P3.2 — Parte 2: Aplicar migration (~5 min)

Danissa copia `supabase/migrations/20260420000003_add_missing_fk_indexes.sql` al SQL Editor y ejecuta.

**Expectativa**:
- `RAISE NOTICE 'Pre-check OK — ...'` en Messages.
- 7 (o N ajustado) `CREATE INDEX` retornan sin error.
- `RAISE NOTICE 'Post-check OK — 7 índices creados, FKs intactos'`.

**Stop trigger**: si `RAISE EXCEPTION` dispara en pre o post check → transaction rollback automático. Notar mensaje exacto → SP-3.

### P3.3 — Parte 3: Post-verify (~3 min)

Re-ejecutar Query B (índices) para confirmar los 7 nombres esperados aparecen:

```sql
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_appointments_service_id',
    'idx_commissions_therapist_id',
    'idx_commissions_sale_id',
    'idx_clinic_invoices_patient_id',
    'idx_clinic_invoices_therapist_id',
    'idx_clinical_history_entry_type',
    'idx_clinical_history_diagnosis_id'
  )
ORDER BY indexname;
```

**Expectativa**: 7 filas (o N ajustado). `indexdef` contiene `USING btree` y `(columna)`.

### P3.4 — Parte 4: EXPLAIN ANALYZE sobre queries representativas (~7 min)

Ejecutar 2 queries (uno de appointments P1, uno de commissions P2) para confirmar que el planner usa Index Scan.

**Query 1 — appointments (P1)**:

```sql
EXPLAIN ANALYZE
SELECT * FROM public.appointments
WHERE service_id = (SELECT id FROM public.therapist_services LIMIT 1);
```

**Expectativa**: plan contiene `Index Scan using idx_appointments_service_id on appointments`. Si tabla tiene > 100 rows y aparece `Seq Scan` → R-03 trigger, correr `ANALYZE public.appointments` y re-ejecutar. Si persiste → SP-3 abort.

**Query 2 — commissions (P2)**:

```sql
EXPLAIN ANALYZE
SELECT * FROM public.commissions
WHERE therapist_id = (SELECT id FROM public.profiles WHERE role = 'therapist' LIMIT 1);
```

**Expectativa**: plan contiene `Index Scan using idx_commissions_therapist_id on commissions`. Mismo edge case si tabla < 100 rows.

**Tolerancia**: si alguna tabla tiene < 100 rows al momento de apply, `Seq Scan` es **tolerado** (FR-009 + edge case spec). Documentar como non-failure.

### P3.5 — **STOP POINT SP-3** · evaluación final

| Check | Criterio | Acción si falla |
|---|---|---|
| **T4** | Post-check del migration pasó (RAISE NOTICE OK) | Si `RAISE EXCEPTION` → rollback automático, investigar |
| **T5** | Query post-verify retorna 7 (o N ajustado) índices con `btree` | Si N < esperado → investigar qué CREATE no se aplicó |
| **T6** | EXPLAIN ANALYZE query 1 muestra Index Scan (o Seq Scan en tabla < 100 rows) | Si Seq Scan en tabla grande → R-03, `ANALYZE` + re-run; si persiste → rollback |
| **T7** | EXPLAIN ANALYZE query 2 idem | Mismo protocolo T6 |

**Reporte a Danissa**:

```markdown
## Phase 3 Report — spec 011

- Parte 1 pre-check: [PASS/FAIL + notas de drift si existe]
- Parte 2 apply: [PASS/FAIL, mensajes RAISE NOTICE]
- Parte 3 post-verify: [N índices confirmados]
- Parte 4 EXPLAIN ANALYZE: [Q1 Index/Seq + row count · Q2 Index/Seq + row count]
- Decision: close / rollback
```

### P3.6 — Evaluación vs Rollback Plan (del spec)

**Rollback triggers** (del spec §Rollback Plan):

1. Pre-check FAIL en migration (FK no existe o índice pre-existente detectado en runtime) → transaction rollback automático.
2. Post-check FAIL (# índices ≠ esperado o FK mutado) → ejecutar bloque rollback del migration.
3. EXPLAIN ANALYZE Seq Scan persistente en tabla grande post-ANALYZE → investigar; si rollback necesario, ejecutar bloque DROP INDEX IF EXISTS.

**Non-rollback triggers** (documentar, no abortar):
- Seq Scan en tabla < 100 rows.
- Apply time entre 30s y 5min (SC-006 excedido pero tolerable).
- Primer EXPLAIN ANALYZE antes de ANALYZE no usa índice; post-ANALYZE sí.

---

## Stop Points resumen

| # | Ubicación | Criterio | Acción |
|---|---|---|---|
| **SP-0** | Inicio de Phase 1 | Plan aprobado por Danissa | Ejecutar Queries A + B + C |
| **SP-1** | Fin de Phase 1 | Phase 1 Report con 🟢 GO | Solo entonces → Phase 2 (migration write) |
| **SP-2** | Fin de Phase 2 (pre-apply) | migration.sql revisada por Danissa sin aplicar | Solo entonces → Phase 3 Parte 2 (apply DDL) |
| **SP-3** | Fin de Phase 3 | T4-T7 PASS (post-check + verify + EXPLAIN ANALYZE OK) | Close / rollback / follow-up |

---

## Time Budget

| Phase | Tiempo | Contenido |
|---|---|---|
| Phase 1 — Audit | **10 min** | Queries A + B + C + data-model.md + SP-1 report |
| Phase 2 — Migration write | **15 min** | 20260420000003 escrito replicando 20260420000002 + review SP-2 |
| Phase 3 — Verification | **20 min** | Parte 1 (5) + Parte 2 (5) + Parte 3 (3) + Parte 4 EXPLAIN (7) |
| Buffer | **10 min** | R-01/R-02/R-03 si se disparan |
| **Total** | **55 min** | Dentro del bound 45-60 del spec |

Si total real > **90 min**: STOP implícito, revisar con Danissa.

---

## References

- `.specify/memory/constitution.md §IV` (Micro-Bloques) — fundamento del scope tight.
- `docs/PATTERNS.md §4` (audit defensivo Phase 1) — obliga a Query A/B/C antes de CREATE INDEX.
- `docs/PATTERNS.md §5` (preventive mini-audit con information_schema/pg_catalog) — pattern de Query A/B.
- `supabase/migrations/20260420000002_restore_marketplace_purchases_policies.sql` (spec 009, commit `0b89ba3`) — estructura canonical réplica.
- `supabase/migrations/20260420000001_enable_rls_quick_wins.sql` (spec 006, commit `9e15c80`) — referencia adicional.
- `.specify/memory/architecture.md §Performance audit (2026-04-20) — FKs sin índice` — origen del hallazgo.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | Sin violaciones. Scope tight de 1 archivo + 7 índices. Los 3 riesgos tienen mitigación sin ampliar scope. |
