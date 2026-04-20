# Tasks: Add Missing FK Indexes

**Branch**: `011-add-missing-fk-indexes` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Date**: 2026-04-20

Tasks ejecutables del ciclo, agrupadas por Phase del plan. **Stop Points (SP-*) son gates, no tasks** — requieren 🟢 GO explícito de Danissa antes de continuar al siguiente grupo. Tiempo total estimado: **55 min** (dentro del bound 45-60 del spec).

Leyenda de columnas:

- **ID**: identificador único.
- **Phase**: Phase del plan (P1 / P2 / P3 / FINAL).
- **Task**: acción concreta.
- **File:Line**: ubicación exacta donde aplica; MCP/SQL Editor para queries; line ranges tentativos para migration (archivo nuevo).
- **Dependencies**: tasks que deben completarse antes (o `GATE SP-N`).
- **Reference**: patrón canónico, FR del spec, riesgo mitigado.
- **Est. min**: estimación de tiempo (acumulable contra budget 55).

---

## Phase 1 — Audit Defensivo

**Prerequisito**: plan aprobado por Danissa ✅ (commit `3fcfa10`).

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P1-A` | P1 | Ejecutar **Query A** en SQL Editor (project `tomremkbuxvedliyywbo`): `SELECT conname, cl.relname, a.attname, refcl.relname, refa.attname FROM pg_constraint c JOIN pg_class cl ON ... WHERE c.contype='f' AND filtro para los 7 FKs` (query completa en plan.md §P1.1). Capturar output literal — esperado 7 filas | Supabase SQL Editor · MCP bloqueado por permisos | — | plan.md §Phase 1 P1.1 · FR-001 · Risk R-01 | 2 |
| `TASK-P1-B` | P1 | Ejecutar **Query B** en SQL Editor: `SELECT indexname, tablename, indexdef FROM pg_indexes WHERE tablename IN (4 tablas) AND indexdef LIKE` con 3 variantes por columna (solo-columna `(col)`, compuesto-primera `(col,`, compuesto-no-primera `, col)`). Query completa en plan.md §P1.2. Esperado 0 filas (o filas con distinción entre cover vs no-cover) | Supabase SQL Editor | — | plan.md §Phase 1 P1.2 · FR-002 · Risk R-02 | 2 |
| `TASK-P1-C` | P1 | Ejecutar **Query C** baseline: `SELECT relname, n_live_tup FROM pg_stat_user_tables WHERE schemaname='public' AND relname IN ('appointments','commissions','clinic_invoices','clinical_history')`. Esperado 4 filas con estimates de rows | Supabase SQL Editor | — | plan.md §Phase 1 P1.3 · FR-003 · flag para `CONCURRENTLY` si >1M | 2 |
| `TASK-P1-DATAMODEL` | P1 | Escribir `specs/011-add-missing-fk-indexes/data-model.md` con 4 secciones: §Pre-check snapshot (output literal A/B/C), §FK verification matrix (7 FKs × exists/indexed/row_count/action), §Policy strategy decision (ajustes al CREATE INDEX list + policy_count esperado post-check), §SP-1 checks (estado T1-T3) | `specs/011-add-missing-fk-indexes/data-model.md` (create) | `TASK-P1-A`, `TASK-P1-B`, `TASK-P1-C` | plan.md §Phase 1 P1.4 · FR-001/002/003 | 3 |
| `TASK-P1-REPORT` | P1 | Generar Phase 1 Report con checks T1-T3 + ajustes a CREATE INDEX list (7 default o menos si R-02 skip) + policy_count esperado + recomendación 🟢 GO / 🔴 STOP | conversación | `TASK-P1-DATAMODEL` | plan.md §Phase 1 P1.5 · FR-004 | 1 |

**Tiempo Phase 1**: 10 min (budget plan).

---

### 🚧 GATE SP-1 — STOP POINT (hard block)

**Criterio**: Phase 1 Report con checks T1-T3 evaluados. **Requiere 🟢 GO explícito de Danissa**.

- **T1** (7 FKs existen en Query A) — si `< 7` → STOP R-01.
- **T2** (0 índices pre-existentes en Query B, o cover/no-cover documentado) — si existe cover → skip ese CREATE + ajustar post-check count.
- **T3** (row counts capturados en Query C) — flag si alguna tabla > 1M rows para considerar `CONCURRENTLY`.

**Sin 🟢 GO, no se ejecuta ninguna task de Phase 2.**

---

## Phase 2 — Migration Write (no apply)

**Prerequisito**: GATE SP-1 superado. Las 5 tasks son bloques secuenciales del archivo único `supabase/migrations/20260420000003_add_missing_fk_indexes.sql`. **Ningún CREATE INDEX se ejecuta en DB** durante Phase 2.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P2-HEADER` | P2 | **Bloque 1 — Header comment**: spec 011 ref + fecha + origen (Express block audit §Performance audit) + lista de los 7 índices a crear + Constitution IV (Micro-Bloques). Tabla de reference con los 7 FKs (FK + ref target) | `supabase/migrations/20260420000003_add_missing_fk_indexes.sql:1-22` (new file) | `GATE SP-1` | plan.md §Phase 2 P2.2 Bloque 1 · estructura spec 009 `20260420000002:1-21` | 2 |
| `TASK-P2-PRECHECK` | P2 | **Bloque 2 — `DO $$ PRE-CHECK`**: `SELECT COUNT(*) INTO fk_count FROM pg_constraint` filtrado por los 7 FKs (esperar = 7). `SELECT COUNT(*) INTO idx_count FROM pg_indexes` con `indexdef LIKE` por columna (esperar = 0, o N_skip si Phase 1 detectó covers). `RAISE EXCEPTION` si falla, `RAISE NOTICE` con estado | `.../20260420000003_...sql:~24-55` | `TASK-P2-HEADER`, `TASK-P1-A`, `TASK-P1-B` | plan.md §Phase 2 P2.2 Bloque 2 · FR-001/002 · Risk R-01/R-02 | 3 |
| `TASK-P2-CREATE` | P2 | **Bloque 3 — 7 `CREATE INDEX IF NOT EXISTS`** con naming `idx_<table>_<column>` (FR-006): `idx_appointments_service_id`, `idx_commissions_therapist_id`, `idx_commissions_sale_id`, `idx_clinic_invoices_patient_id`, `idx_clinic_invoices_therapist_id`, `idx_clinical_history_entry_type`, `idx_clinical_history_diagnosis_id`. btree default sin predicado (FR-007). `IF NOT EXISTS` defense-in-depth (FR-013). `CONCURRENTLY` solo si Phase 1 Query C mostró tabla > 1M (caso excepcional) | `.../20260420000003_...sql:~57-80` | `TASK-P2-PRECHECK`, `TASK-P1-REPORT` (necesita confirmación de lista final) | plan.md §Phase 2 P2.3 · FR-006/007/013 | 4 |
| `TASK-P2-POSTCHECK` | P2 | **Bloque 4 — `DO $$ POST-CHECK`**: `SELECT COUNT(*) INTO idx_count FROM pg_indexes WHERE indexname IN (7 nombres)` (esperar = N, donde N = 7 o ajustado por skip de Phase 1). `SELECT COUNT(*) INTO fk_count FROM pg_constraint` con mismo filtro que pre-check (esperar = 7, FKs intactos). `RAISE EXCEPTION` / `RAISE NOTICE` | `.../20260420000003_...sql:~82-108` | `TASK-P2-CREATE` | plan.md §Phase 2 P2.2 Bloque 4 · FR-008 | 3 |
| `TASK-P2-ROLLBACK` | P2 | **Bloque 5 — Rollback comentado** (no ejecutable): `-- DROP INDEX IF EXISTS public.idx_<table>_<column>;` × 7 (o N ajustado). Copy-pasteable directamente al SQL Editor en caso de abort | `.../20260420000003_...sql:~110-120` | `TASK-P2-POSTCHECK` | plan.md §Phase 2 P2.4 · spec §Rollback Plan | 2 |

**Tiempo Phase 2**: 14 min (budget plan: 15).

---

### 🚧 GATE SP-2 — STOP POINT (review SQL, NO APPLY)

**Criterio**: archivo `20260420000003_...sql` escrito en disco (~100-120 líneas), **NO aplicado en DB**. Danissa revisa:
- 7 CREATE INDEX (o N ajustado) con naming `idx_<table>_<column>` exacto (FR-006).
- Cada CREATE INDEX referencia columna confirmada en Phase 1 Query A.
- Pre-check espera N esperado (7 por default o ajustado).
- Post-check verifica N coincide.
- Rollback block cubre mismos N (DROP INDEX IF EXISTS).
- No hay `CONCURRENTLY` inesperado (solo si Phase 1 lo justificó para tabla >1M).

**Sin 🟢 GO, no se avanza a Phase 3 (apply).**

---

## Phase 3 — Verificación en 4 Partes

**Prerequisito**: GATE SP-2 superado. Migration.sql commiteada en repo, pendiente de aplicar.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P3-PART1` | P3 | **Parte 1 — Pre-check read-only**: Danissa re-ejecuta Query A + Query B + Query C en SQL Editor **sin aplicar DDL**. Verifica que el estado live no cambió entre Phase 1 y ahora. Si hay drift (ej. nuevo índice creado manualmente) → re-evaluar SP-1 | Supabase SQL Editor | `GATE SP-2` | plan.md §Phase 3 P3.1 · Risk R-02 | 5 |
| `TASK-P3-PART2` | P3 | **Parte 2 — Apply migration**: Danissa copia `supabase/migrations/20260420000003_add_missing_fk_indexes.sql` al SQL Editor y ejecuta. Verifica `RAISE NOTICE 'Pre-check OK'` + 7 `CREATE INDEX` sin error + `RAISE NOTICE 'Post-check OK'`. Si pre/post-check hace `RAISE EXCEPTION` → transaction rollback automático, pasar a SP-3 rollback branch | Supabase SQL Editor (copy de `20260420000003_...sql`) | `TASK-P3-PART1` | plan.md §Phase 3 P3.2 · SC-001/SC-002 | 5 |
| `TASK-P3-PART3` | P3 | **Parte 3 — Post-verify**: re-ejecutar Query B sobre los 7 nombres `idx_*` esperados. Verificar (a) 7 filas (o N ajustado), (b) `indexdef` contiene `USING btree`, (c) `indexdef` contiene la columna correcta. Validar SC-001 (`COUNT(*) = 7`) y SC-002 (FKs intactos) | Supabase SQL Editor | `TASK-P3-PART2` | plan.md §Phase 3 P3.3 · SC-001/SC-002 | 3 |
| `TASK-P3-PART4` | P3 | **Parte 4 — EXPLAIN ANALYZE** × 2 queries representativas: (Q1) `EXPLAIN ANALYZE SELECT * FROM public.appointments WHERE service_id = (SELECT id FROM public.therapist_services LIMIT 1)` → esperar `Index Scan using idx_appointments_service_id`; (Q2) `EXPLAIN ANALYZE SELECT * FROM public.commissions WHERE therapist_id = (SELECT id FROM public.profiles WHERE role='therapist' LIMIT 1)` → esperar `Index Scan using idx_commissions_therapist_id`. **Decision tree Seq Scan**: tabla <100 rows → tolerado (FR-009, documentar) · tabla >100 → `ANALYZE <tabla>` + re-run; persist → R-03 abort | Supabase SQL Editor | `TASK-P3-PART3` | plan.md §Phase 3 P3.4 · SC-003/SC-004 · FR-009 · Risk R-03 | 7 |
| `TASK-P3-REPORT` | P3 | **Phase 3 Report (SP-3 evaluación)**: consolidar resultados Parte 1-4, contabilizar T4-T7 checks (post-check OK, 7 índices verificados, 2 EXPLAIN ANALYZE PASS). Evaluar vs Rollback Plan del spec (3 triggers). Decidir **close / rollback** | conversación | `TASK-P3-PART4` | plan.md §Phase 3 P3.5 · spec §Rollback Plan | 2 |

**Tiempo Phase 3**: 22 min (budget plan: 20). +2 min dentro de tolerancia.

---

### 🚧 GATE SP-3 — STOP POINT (evaluación final)

**Criterio**: Phase 3 Report entregado con T4-T7 evaluados:

- **T4** (Post-check del migration pasó) — si `RAISE EXCEPTION` → rollback automático, investigar.
- **T5** (Query post-verify retorna N índices btree) — si N < esperado → investigar.
- **T6** (EXPLAIN ANALYZE Q1 muestra Index Scan, o Seq Scan en tabla <100 tolerado) — si Seq Scan en tabla grande → R-03, ANALYZE + retry.
- **T7** (EXPLAIN ANALYZE Q2 idem) — mismo protocolo.

**Decisión post-SP-3**:
- **Close**: T4 + T5 PASS + T6/T7 Index Scan (o Seq Scan tolerado) → avanzar a `TASK-FINAL`.
- **Rollback**: T4/T5 FAIL o T6/T7 Seq Scan persistente en tabla grande → ejecutar Bloque 5 (rollback) del migration + `git revert` + abrir spec 011.1.

---

## Final — Documentación post-spec

**Prerequisito**: GATE SP-3 decisión = Close.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-FINAL` | FINAL | Actualizar `.specify/memory/architecture.md §"Performance audit (2026-04-20) — FKs sin índice"` (línea `:241`): **NO modificar la tabla histórica** del audit original con los 30+ FKs (preservar registro). Agregar subsección `#### FKs indexados post-audit (spec 011 — 2026-MM-DD)` inmediatamente después de la tabla histórica, con tabla de los 7 índices creados: `| # | Índice | Tabla · columna FK | Prioridad original | Commit |`. Incluir nota operativa sobre los ~23 FKs restantes (deferidos a spec futura). Commit con mensaje `docs: close spec 011 — architecture.md Performance audit updated` | `.specify/memory/architecture.md:~<línea post-tabla-performance-audit>` | `GATE SP-3` (close) | plan.md §References · Constitution §IV documentation pattern | 5 |

**Plantilla para la subsección**:

```markdown
#### FKs indexados post-audit (spec 011 — 2026-MM-DD)

7 FKs de alta prioridad cerrados con migration `20260420000003_add_missing_fk_indexes.sql`. Commit `<hash>`.

| # | Índice | Tabla · columna FK | Prioridad original | Commit |
|---|---|---|---|---|
| 1 | `idx_appointments_service_id` | `appointments.service_id → therapist_services` | P1 (calendar render) | `<hash>` |
| 2 | `idx_commissions_therapist_id` | `commissions.therapist_id → profiles` | P2 (dashboard therapist) | `<hash>` |
| 3 | `idx_commissions_sale_id` | `commissions.sale_id → sales` | P2 (admin commissions) | `<hash>` |
| 4 | `idx_clinic_invoices_patient_id` | `clinic_invoices.patient_id → patients` | P3 (patient file) | `<hash>` |
| 5 | `idx_clinic_invoices_therapist_id` | `clinic_invoices.therapist_id → profiles` | P3 (dashboard therapist) | `<hash>` |
| 6 | `idx_clinical_history_entry_type` | `clinical_history.entry_type → clinical_entry_types` | P3 (patient file filter) | `<hash>` |
| 7 | `idx_clinical_history_diagnosis_id` | `clinical_history.diagnosis_id → patient_diagnoses` | P3 (diagnosis lookup) | `<hash>` |

**Pendiente (spec futura dedicada)**: ~23 FKs de prioridad media/baja excluidos de spec 011 por scope tight (admin_*, arco_*, blog_*, cookie_consents, coupon_uses, course_*, educator_*, legal_*, marketing_*, marketplace_review_votes, membership_*, meta_*, patient_reviews, pie_*, plan_*, session_activities.* excepto cubiertos, specialty_*, therapist_* excepto cubiertos, wallet_*). Trigger para nueva spec: primera regresión observable de performance en esos flows O backlog dedicado.

EXPLAIN ANALYZE post-apply (SC-003/SC-004): `appointments.service_id` + `commissions.therapist_id` confirmaron `Index Scan` (o `Seq Scan` tolerado si tabla < 100 rows, documentado non-failure per FR-009).
```

---

## Resumen ejecutivo de tasks

| Phase | # tasks | Tiempo | Gate posterior |
|---|---|---|---|
| Phase 1 (audit defensivo) | 5 | 10 min | **SP-1** (hard block, Danissa 🟢 GO) |
| Phase 2 (migration write) | 5 | 14 min | **SP-2** (review SQL, NO apply) |
| Phase 3 (verification 4 parts) | 5 | 22 min | **SP-3** (close/rollback) |
| Final | 1 | 5 min | — |
| **Total ejecutable** | **16 tasks** | **51 min** | 3 gates explícitos (SP-1, SP-2, SP-3) + SP-0 implícito |

Buffer de 4-9 min para desvíos menores (Query retry, ANALYZE + re-EXPLAIN). Si total real > **90 min** → STOP implícito y consultar.

---

## Referencias cruzadas

- `plan.md` — queries SQL exactas (A/B/C), canonical blocks, stop points, risk register.
- `spec.md` — FRs (001-013), Rollback Plan (3 triggers + non-rollback).
- `supabase/migrations/20260420000002_restore_marketplace_purchases_policies.sql` (spec 009, commit `0b89ba3`) — estructura canonical réplica.
- `supabase/migrations/20260420000001_enable_rls_quick_wins.sql` (spec 006, commit `9e15c80`) — referencia adicional.
- `.specify/memory/constitution.md §IV` (Micro-Bloques) — fundamento scope bound.
- `docs/PATTERNS.md §4` (audit defensivo Phase 1) · `§5` (preventive mini-audit).
- `.specify/memory/architecture.md §Performance audit (2026-04-20) — FKs sin índice` (línea 241) — origen + target de TASK-FINAL.
