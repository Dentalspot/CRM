# Tasks: Audit RLS-Enabled Zero-Policies Tables

**Branch**: `012-audit-rls-enabled-zero-policies` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Date**: 2026-04-20

Tasks ejecutables del ciclo, agrupadas por Phase del plan. **Stop Points (SP-*) son gates, no tasks** — requieren 🟢 GO explícito de Danissa antes de continuar al siguiente grupo. Tiempo total estimado: **60 min** (= bound del spec).

Leyenda de columnas:

- **ID**: identificador único.
- **Phase**: Phase del plan (P1 / P2 / P3 / P4 / FINAL).
- **Task**: acción concreta.
- **File:Line**: ubicación; SQL Editor / bash para ejecuciones; paths .md para outputs.
- **Dependencies**: tasks previas o `GATE SP-N`.
- **Reference**: FR del spec, riesgo mitigado, sección del plan.
- **Est. min**: tiempo estimado.

---

## Phase 1 — Audit Live State

**Prerequisito**: plan aprobado por Danissa ✅ (commit `7df60b4`).

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P1-A` | P1 | Ejecutar **Query A** en Supabase SQL Editor (project `tomremkbuxvedliyywbo`): `pg_tables LEFT JOIN pg_policies HAVING COUNT(policyname) = 0 ON schema=public AND rowsecurity=true ORDER BY tablename`. Query completa en plan.md §P1.1. Capturar output literal — esperado ~20 tablas | Supabase SQL Editor (MCP bloqueado per shared infra policy) | — | plan.md §Phase 1 P1.1 · FR-001 | 3 |
| `TASK-P1-B` | P1 | Ejecutar **Query B** en SQL Editor con la lista del Query A: `SELECT relname, n_live_tup FROM pg_stat_user_tables WHERE schemaname='public' AND relname IN (<lista>) ORDER BY n_live_tup DESC, relname ASC`. Esperado: 1 fila por tabla de Query A con row count estimado | Supabase SQL Editor | `TASK-P1-A` (necesita lista) | plan.md §Phase 1 P1.2 · FR-002 | 3 |
| `TASK-P1-REPORT` | P1 | Persistir Phase 1 snapshot en `data-model.md §Phase 1 snapshot` con (a) output literal Query A, (b) output literal Query B, (c) discrepancias vs contexto user (tablas nuevas / ya remediadas / coincidencia). Generar Phase 1 Report con T1-T3 checks + recomendación 🟢 GO / 🔴 STOP | `specs/012-.../data-model.md` (create §Phase 1 snapshot) | `TASK-P1-A`, `TASK-P1-B` | plan.md §Phase 1 P1.3 · SC-001 | 4 |

**Tiempo Phase 1**: 10 min (budget plan).

---

### 🚧 GATE SP-1 — STOP POINT

**Criterio**: Phase 1 Report entregado con T1-T3 evaluados. **Requiere 🟢 GO explícito de Danissa**.

- **T1** (Query A retorna lista ≥1) — si 0 → audit original desactualizado; investigar.
- **T2** (Query B retorna row counts para cada tabla de A) — si falta alguna → tabla inactiva, continuar con `n_live_tup = 0`.
- **T3** (discrepancia vs contexto ≤5 tablas) — si >5 → drift material; consultar antes de Phase 2.

**Sin 🟢 GO, no se ejecuta Phase 2.**

---

## Phase 2 — Callsite Census

**Prerequisito**: GATE SP-1 superado.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P2-FRESH-FLAGS` | P2 | Leer estado actual de `src/constants/featureFlags.js` (R-03 mitigation). Identificar qué flags están en `false` HOY. Capturar set en `data-model.md §Phase 2 featureFlags snapshot` — fuente de verdad para classifier GROUP D, NO usar snapshot de sesión anterior | `src/constants/featureFlags.js` (read-only) | `GATE SP-1` | plan.md §Phase 2 P2.1 · Risk R-03 | 1 |
| `TASK-P2-GREP` | P2 | Por **cada tabla** de Phase 1 Query A, ejecutar 2 greps: (1) `grep -rn "from(['\"]\\?<table>['\"]\\?" src/` (frontend), (2) `grep -rn "from(['\"]\\?<table>['\"]\\?" supabase/functions/` (edge). Guardar output crudo en archivo temporal por tabla (ej. `/tmp/grep-012-<table>.log`) o consolidado en memoria para classifier | bash `~/Documents/DENTALSPOT` | `TASK-P2-FRESH-FLAGS` | plan.md §Phase 2 P2.2 · FR-003 | 8 |
| `TASK-P2-CLASSIFY` | P2 | Por cada match del grep, leer **3 líneas de contexto** (`-B1 -A2`) para asignar categoría a cada callsite: `edge_function` (bajo supabase/functions/) / `feature_flagged_off` (envuelto en FEATURE_FLAGS.X con X en set false de P2-FRESH-FLAGS) / `frontend_activo` (archivo user-facing o wrapper con consumer activo) / `dead_code` (wrapper sin consumer) / `edge_function_only` (wrapper invocado solo por edge) / `UNCLEAR` (no resoluble sin lectura profunda) | bash + Read | `TASK-P2-GREP`, `TASK-P2-FRESH-FLAGS` | plan.md §Phase 2 P2.3 · Risk R-01 | 7 |
| `TASK-P2-MATRIX` | P2 | Consolidar classifier en matrix CSV-like en `data-model.md §Phase 2 census`. Columnas: Tabla, Row count, Callsites totales, Frontend activo, Edge function, Feature-flagged OFF, Dead code, Edge function only, Unclear, Notas. Una fila por tabla de Query A | `specs/012-.../data-model.md` (append §Phase 2 census) | `TASK-P2-CLASSIFY` | plan.md §Phase 2 P2.4 · FR-003 | 3 |
| `TASK-P2-REPORT` | P2 | Generar reporte intermedio con T4-T6 checks: matrix cubre todas las tablas (T4), unclear ≤10% (T5), time ≤25 min (T6). Si T6 falla → aplicar heurística de reducción a top-10 por `n_live_tup` documentando los deferred en `data-model.md §Phase 2 deferred analysis` | conversación | `TASK-P2-MATRIX` | plan.md §Phase 2 P2.5 · fallback FR-006/T6 | 1 |

**Tiempo Phase 2**: 20 min (budget plan).

---

### 🚧 GATE SP-2 — STOP POINT (si hay desviación)

**Criterio**: matrix completa o heurística de fallback aplicada con comunicación explícita. No requiere 🟢 GO hard si todos los T-checks pasan — reporte intermedio suficiente. Solo HARD BLOCK si T5 (unclear >10%) o T6 (time >25 min sin fallback aplicado).

- **T4** (matrix cubre todas las tablas de Query A) — si falla: documentar.
- **T5** (unclear ≤10%) — si >10%: lectura manual adicional o pedir GO advisor.
- **T6** (time ≤25 min) — si >25min: aplicar top-10 heurística o comunicar y consultar.

---

## Phase 3 — Priorización Determinística

**Prerequisito**: SP-2 matrix completa o heurística aplicada.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P3-GROUPS` | P3 | Aplicar reglas GROUP A/B/C/D en **orden determinístico** (primer match gana): (1) `feature_flagged_off > 0 AND frontend_activo = 0 AND edge_function = 0` → D · (2) `frontend_activo = 0` → C · (3) `row_count > 0 AND frontend_activo > 0` → A · (4) `row_count = 0 AND frontend_activo > 0` → B · (5) otherwise → UNCLEAR_GROUP (escalate). Persistir en `data-model.md §Phase 3 priorización` | `specs/012-.../data-model.md` (append §Phase 3 priorización) | `TASK-P2-MATRIX` (necesita matrix) | plan.md §Phase 3 P3.1 · FR-004 | 6 |
| `TASK-P3-IMPACT` | P3 | Para **cada tabla en GROUP A**, documentar user impact estimation con 4 campos obligatorios: (a) qué usuarios afectados, (b) qué ven rotos, (c) frecuencia (diaria/ocasional/cold path), (d) severidad (bloqueante/degradación/cosmético). Persistir inline en la tabla `§Phase 3 priorización` | `specs/012-.../data-model.md` (extend §Phase 3 priorización) | `TASK-P3-GROUPS` | plan.md §Phase 3 P3.2 · SC-001 user story 1 | 10 |
| `TASK-P3-DECISION` | P3 | Contar tablas en GROUP A y decidir estrategia Phase 4: (a) 0 tablas → no templates (SC-002 non-failure documentado); (b) 1-5 tablas → N templates individuales `write-policies-<table>`; (c) >5 tablas → **NO** N individuales — 1 meta-spec template con criterio de agrupación por dominio (paciente/facturación/AI/contenido). Reportar SP-3 con conteos + decisión + highlight de severidad | conversación | `TASK-P3-IMPACT` | plan.md §Phase 3 P3.4 · FR-006 (anti-scope-creep) | 4 |

**Tiempo Phase 3**: 20 min (budget plan).

---

### 🚧 GATE SP-3 — STOP POINT

**Criterio**: Phase 3 Report con conteos GROUP A/B/C/D + decisión estrategia Phase 4. **Requiere 🟢 GO explícito de Danissa si GROUP A > 5** (confirmación del pivot a meta-spec). Si GROUP A ≤ 5, GO implícito con reporte.

- GROUP A = 0 → confirmar "no urgencia" y seguir a Phase 4 para docs.
- GROUP A ∈ [1, 5] → seguir a Phase 4 con N templates individuales.
- GROUP A > 5 → **HARD BLOCK** — Danissa confirma agrupación por dominio antes de Phase 4.

---

## Phase 4 — Deliverables

**Prerequisito**: GATE SP-3 superado con estrategia decidida.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P4-DATAMODEL` | P4 | Finalizar `specs/012-.../data-model.md` con **todas las secciones**: §Phase 1 snapshot, §Phase 2 featureFlags snapshot, §Phase 2 census (matrix), §Phase 3 priorización (con user impact), §Phase 4 Follow-up specs (templates), §Backlog para architecture.md (GROUP B/C/D), §Hallazgos laterales (UNCLEAR, discrepancias, drift) | `specs/012-.../data-model.md` (append secciones finales) | `TASK-P3-DECISION` | plan.md §Phase 4 P4.1 · FR-009 | 4 |
| `TASK-P4-ARCHITECTURE` | P4 | Agregar nueva subsección `### RLS enabled zero-policies audit (2026-04-20)` en `.specify/memory/architecture.md` **inmediatamente después** del bloque existente `§RLS coverage audit`. Contenido: summary table (GROUP × count × significado × acción) + referencia a `data-model.md` para detalle + highlight de 1-3 tablas más críticas | `.specify/memory/architecture.md:~post-§RLS coverage audit` (append subsección) | `TASK-P4-DATAMODEL` | plan.md §Phase 4 P4.2 · FR-010 | 4 |
| `TASK-P4-TEMPLATES` | P4 | Generar templates de follow-up spec en `data-model.md §Follow-up specs`: (a) 1-5 GROUP A → N templates `write-policies-<table>` con scope + 2-4 policies candidatas basadas en pattern de callsites + callsites literales + refs canonical (spec 006/009 + PATTERNS.md §§); (b) GROUP A > 5 → 1 meta-spec template con agrupación por dominio; (c) GROUP A = 0 → nota explícita "no urgencia detectada, SC-002 non-failure" | `specs/012-.../data-model.md` (§Follow-up specs) | `TASK-P4-DATAMODEL` | plan.md §Phase 4 P4.3 · FR-005/FR-006 | 2 |

**Tiempo Phase 4**: 10 min (budget plan).

---

## Final — Commit + Merge

**Prerequisito**: Phase 4 completa.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-FINAL` | FINAL | **1 commit único** cubriendo los 2 artefactos (data-model.md create + architecture.md append). Validar `git diff src/` + `git diff supabase/` vacíos (SC-003). Mensaje: `docs: close spec 012 — RLS enabled zero-policies audit + [N] follow-up templates`. Luego `git checkout main && git merge 012-audit-rls-enabled-zero-policies --no-ff -m "merge: spec 012 audit rls enabled zero policies"`. Reportar hashes + status + log | `git` operations | `TASK-P4-TEMPLATES` | plan.md §Phase 4 P4.4 · SC-003 validation | 3 |

**Tiempo FINAL**: 3 min.

---

## Resumen ejecutivo de tasks

| Phase | # tasks | Tiempo | Gate posterior |
|---|---|---|---|
| Phase 1 (audit live state) | 3 | 10 min | **SP-1** (hard block, T1-T3) |
| Phase 2 (callsite census) | 5 | 20 min | **SP-2** (soft, T4-T6 con fallback) |
| Phase 3 (priorización) | 3 | 20 min | **SP-3** (hard block solo si GROUP A > 5) |
| Phase 4 (deliverables) | 3 | 10 min | — |
| Final (commit + merge) | 1 | 3 min | — |
| **Total ejecutable** | **15 tasks** | **63 min** | 3 gates explícitos (SP-1/2/3) + SP-0 implícito |

Buffer de ~0-3 min: el plan estima 60 min exactos, tasks suman 63 min. La holgura viene de tasks de Phase 3-4 que pueden cerrar más rápido si GROUP A es chico (0-2 tablas). Si total real > 90 min → STOP implícito y consultar.

---

## Referencias cruzadas

- `plan.md` — 2 queries SQL exactas, classifier 6-categorías, reglas GROUP determinísticas, stop points, risk register.
- `spec.md` — FRs (001-011), Success Criteria (001-006), Scope Bounds.
- `.specify/memory/constitution.md §II` (RLS-First Security) · `§IV` (Micro-Bloques anti-scope-creep FR-006).
- `docs/PATTERNS.md §4` (audit defensivo Phase 1) · `§5` (preventive mini-audit).
- `.specify/memory/architecture.md §RLS coverage audit (2026-04-20)` — punto de partida con lista pre-conocida.
- Spec 006 commit `9e15c80` — patrón canónico enable RLS con policies existentes.
- Spec 009 commit `0b89ba3` — patrón canónico escribir policies + enable RLS.
