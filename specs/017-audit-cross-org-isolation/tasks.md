# Tasks: Audit Cross-Org Query Isolation

**Input**: [spec.md](./spec.md) · [plan.md](./plan.md)
**Feature branch**: `017-audit-cross-org-isolation`
**Prerequisites**: plan.md (3 phases + 4 SPs + 5 risks) · spec 013 data-model (origen hallazgo) · specs 014/015 (patrón RLS policies `patient_care_team.dentist_id`)

**Format**: `[ID] [Phase] [Task] [File:Line ó Action] [Deps] [Reference] [Est min]`

---

## Gate summary

| Gate | Trigger | Checks | Block until |
|---|---|---|---|
| **SP-0** | Pre-Phase 1 | tasks.md aprobado 6/6 | 🟢 GO Danissa |
| **SP-1** | Fin Phase 1 | T1 grep useCurrentOrganization · T2 grep tablas org_id · T3 matriz 100% completa · T4 RLS policies review · T5 preliminary verdict | 🟢 GO → Phase 2 |
| **SP-2** | Fin Phase 2 | T6 ≥3 queries ejecutadas · T7 interpretación scenario 1/2a/2b/3 · T8 matriz re-evaluada post-empirical | 🟢 GO → Phase 3 |
| **SP-3** | Fin Phase 3 | T9 verdict binario · T10 follow-up scope si CONFIRMADO · T11 architecture.md subsección ready | Decisión close / abrir follow-up |

---

## Phase 1 — Audit Estático (~15 min, pre-SP-1)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P1-GREP-USECURR | Phase 1 | Grep exhaustivo `useCurrentOrganization\|useOrganization` en `src/` vía Grep tool. Para cada match: capturar archivo+línea + contexto circundante (10 líneas) para entender uso de `currentOrganizationId`. Output raw en `data-model.md §Consumers raw output`. Expected ≥12 callsites (spec 013 baseline). | `src/**/*.{js,jsx}` (grep ejecutor) | SP-0 🟢 | plan.md §P1.1 · spec 013 data-model | 3 |
| TASK-P1-GREP-TABLES | Phase 1 | Grep tablas candidatas con `organization_id` column: `supabase.from('patients')`, `supabase.from('appointments')`, `supabase.from('billing_invoices')`, `supabase.from('therapist_services')`, etc. Para cada match: capturar full query chain (`.select(...).eq(...)`). Paralelo con GREP-USECURR. | `src/**/*.{js,jsx}` (grep ejecutor) | SP-0 🟢 (parallel) | plan.md §P1.2 | 3 |
| TASK-P1-MATRIX | Phase 1 | Clasificar cada callsite en matriz `data-model.md §Callsite matrix` con 8 columnas: `file:line`, `table`, `filter_used`, `null_handling`, `wrapper_type`, `admin_excluded`, `service_role`, `verdict` (cross-org safe / leak potencial / unclear / N/A). 100% callsites clasificados. | `specs/017-audit-cross-org-isolation/data-model.md` | TASK-P1-GREP-USECURR · TASK-P1-GREP-TABLES | plan.md §P1.3 · FR-002 | 5 |
| TASK-P1-RLS-REVIEW | Phase 1 | Grep policies RLS existentes para tablas candidatas en `supabase/migrations/`. Para cada tabla con policy: identificar si el predicate filtra por `organization_id` o via `patient_care_team.dentist_id` (NO filter por org). Documentar en `data-model.md §RLS policies review`. Alimenta R-01 evaluation. | `supabase/migrations/**/*.sql` (grep ejecutor) | SP-0 🟢 (parallel OK) | plan.md §P1.4 · R-01 | 2 |
| TASK-P1-PRELIM-VERDICT | Phase 1 | Sintetizar hipótesis preliminar (pre-empirical) basada en matriz + RLS review. ¿Apunta a (a) leak real, (b) fallback null roto, (c) coincidencia, (defense-in-depth RLS cierra)? Documentar en `data-model.md §Phase 1 preliminary verdict` + lista de queries empíricas propuestas para Phase 2 según hipótesis. | `data-model.md §Phase 1 preliminary verdict` | TASK-P1-MATRIX · TASK-P1-RLS-REVIEW | plan.md §P1.5 | 1 |
| TASK-P1-REPORT | Phase 1 | **SP-1**. Reportar formato plan.md §P1.6: callsite counts + verdict distribution + RLS snapshot + preliminary hypothesis + queries Phase 2 propuestas + checks T1-T5. Esperar 🟢 GO explícito antes de Phase 2. | — | TASK-P1-PRELIM-VERDICT | plan.md §P1.6 | 1 |

**SP-1 Stop Point**: T1-T5 PASS + preliminary hypothesis + queries Phase 2 listas → Phase 2.

---

## Phase 2 — Empirical Verification (~15 min, pre-SP-2)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P2-QUERY-ALPHA | Phase 2 | Query α: `SELECT table_name FROM information_schema.columns WHERE table_schema='public' AND column_name='organization_id' ORDER BY table_name`. Sanity check que Phase 1 cubrió todas las tablas con org_id. Danissa ejecuta, pega output. Capturar en `data-model.md §Query α output`. | `information_schema.columns` (read-only, Danissa SQL Editor) | SP-1 🟢 | plan.md §P2.1 | 2 |
| TASK-P2-QUERY-BETA | Phase 2 | Query β: para top 3-5 tablas candidatas, `SELECT organization_id, COUNT(*) FROM <tabla> WHERE therapist_id = '4e55fb74-...' GROUP BY organization_id`. Descubre si Cristóbal tiene data en 1 o ≥2 orgs (criterio de hipótesis c coincidencia). Capturar en `data-model.md §Query β output`. | `patients`, `appointments`, etc. (read-only) | TASK-P2-QUERY-ALPHA | plan.md §P2.2 · FR-003 · R-04 | 4 |
| TASK-P2-QUERY-GAMMA | Phase 2 | **Condicional** (solo si Query β revela Cristóbal con data en ≥2 orgs). Simular sesión con `SET LOCAL request.jwt.claim.sub = '4e55fb74-...'` + `SELECT DISTINCT organization_id, COUNT(*) FROM patients GROUP BY organization_id` + `RESET`. Mide qué ve el user bajo RLS sin filter manual. Capturar en `data-model.md §Query γ output`. | `patients` (read-only con JWT claim set) | TASK-P2-QUERY-BETA | plan.md §P2.3 | 4 |
| TASK-P2-INTERPRET | Phase 2 | Asignar **scenario** a los outputs Phase 2: **1** (Cristóbal 1-org, hipótesis c) / **2a** (2-org, diseño intencional multi-org therapist) / **2b** (2-org, diseño era 1-org, bug) / **3** (frontend sí filtra, null fue edge case spec 013 ya resuelto). Re-evaluar matriz Phase 1: callsites "unclear" ahora tienen evidencia empírica. Documentar en `data-model.md §Scenario interpretation`. | `data-model.md §Scenario interpretation` | TASK-P2-QUERY-BETA (+ TASK-P2-QUERY-GAMMA si ejecutada) | plan.md §P2.4 · R-01 · R-04 | 3 |
| TASK-P2-REPORT | Phase 2 | **SP-2**. Reportar formato plan.md §P2.6: queries α/β/γ outputs + scenario asignado + checks T6-T8. Esperar 🟢 GO explícito antes de Phase 3. | — | TASK-P2-INTERPRET | plan.md §P2.6 | 2 |

**SP-2 Stop Point**: T6-T8 PASS + scenario interpretado → Phase 3.

---

## Phase 3 — Verdict + Follow-up Docs (~10 min, pre-SP-3)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P3-VERDICT | Phase 3 | **Veredicto binario FR-004**. Basado en scenario Phase 2: **LEAK CONFIRMADO** (scenario 2b) / **LEAK DESCARTADO** (scenario 1 o 2a) / **LEAK PARCIAL** (scenario 3). Sin ambigüedad — 1 de 3 valores. Documentar en `data-model.md §Verdict` con rationale 2-3 sentences. | `data-model.md §Verdict` | SP-2 🟢 | plan.md §P3.1 · FR-004 · SC-003 | 2 |
| TASK-P3-FOLLOWUP-TEMPLATE | Phase 3 | **Condicional** (solo si CONFIRMADO o PARCIAL). Preparar `data-model.md §Follow-up spec scope` con: lista archivos a editar + línea, tablas afectadas + columna filter faltante, decisión recomendada (RLS tightening vs frontend filter), estimación S/M/L, split suggestion si L (ej. "2 specs: P0 patients + P1 appointments"). Copy-paste ready al `/speckit-specify`. | `data-model.md §Follow-up spec scope` | TASK-P3-VERDICT | plan.md §P3.2 · FR-005 · SC-004 · R-05 | 3 |
| TASK-P3-ARCH-UPDATE | Phase 3 | Preparar **pending draft** de la subsección nueva `§"Cross-org isolation audit (2026-04-20, spec 017)"` para `.specify/memory/architecture.md`. Contenido: origen (spec 013 hallazgo), metodología (grep + empirical), findings (N callsites + scenario + RLS pattern observado), verdict, action. **No aplicar el edit todavía** — TASK-FINAL-COMMIT lo hace. Documentar draft en `data-model.md §architecture.md update draft`. | `data-model.md §architecture.md update draft` | TASK-P3-VERDICT | plan.md §P3.3 · FR-006 · SC-005 | 3 |
| TASK-P3-REPORT | Phase 3 | **SP-3**. Reportar formato plan.md §P3.4: verdict + follow-up (preparado o N/A) + architecture.md update ready + checks T9-T11. Decisión explícita: close / abrir follow-up / abrir follow-up con split / re-evaluate. | — | TASK-P3-VERDICT · TASK-P3-FOLLOWUP-TEMPLATE · TASK-P3-ARCH-UPDATE | plan.md §P3.4 | 2 |

**SP-3 Stop Point**: decisión explícita del advisor antes de TASK-FINAL.

---

## Post-SP-3 — Close (~6 min, solo si SP-3 = close)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-FINAL-VALIDATE | Close | **Validación discovery pure (SC-003 / FR-007 / FR-008)**: ejecutar `git diff --name-only main..017-audit-cross-org-isolation` + verificar que el output **NO incluye ningún archivo bajo `src/`, `supabase/migrations/`, o `supabase/functions/`**. Solo autorizados: `specs/017-*/**` + `.specify/memory/architecture.md`. Si falla → abort y reportar regression (spec se dispersó fuera de discovery). | `git diff --name-only main..017-audit-cross-org-isolation` | SP-3 🟢 close | FR-007 · FR-008 · spec.md §Scope Bounds | 1 |
| TASK-FINAL-COMMIT | Close | Editar `architecture.md` con el draft de TASK-P3-ARCH-UPDATE (agregar subsección `§"Cross-org isolation audit (2026-04-20, spec 017)"` + bump Last updated). Luego `git add specs/017-audit-cross-org-isolation/data-model.md .specify/memory/architecture.md` + `git commit` **único** con mensaje `docs: spec 017 cross-org isolation audit — [VERDICT]` describiendo: verdict, scenario, N callsites, follow-up spec status (abierto/N-A). **Sin commits separados fix/docs** — es discovery pure. | `.specify/memory/architecture.md` + `specs/017-*/data-model.md` | TASK-FINAL-VALIDATE | plan.md §P3.3 · criterio user "1 commit único" | 2 |
| TASK-FINAL-MERGE | Close | `git checkout main && git merge --no-ff 017-audit-cross-org-isolation -m "merge: spec 017 cross-org isolation audit ([VERDICT])"`. **NO push — Danissa lo hace post-review**. | — | TASK-FINAL-COMMIT | Constitution §Development Workflow | 2 |

---

## Summary

| Phase | Tasks | Est min | Gate |
|---|---|---|---|
| Phase 1 (audit estático) | 6 | 15 | SP-1 T1-T5 |
| Phase 2 (empirical) | 5 | 15 | SP-2 T6-T8 |
| Phase 3 (verdict + docs draft) | 4 | 10 | SP-3 T9-T11 |
| Close (validate + 1 commit + merge) | 3 | 5 | — |
| **Total** | **18** | **45 min** | 4 gates |

Dentro bound 30-45 min del spec (max 60 antes de STOP).

---

## Dependencies graph

```text
SP-0 🟢
 ↓
┌─ TASK-P1-GREP-USECURR ──┐
├─ TASK-P1-GREP-TABLES ───┼→ TASK-P1-MATRIX ──┐
└─ TASK-P1-RLS-REVIEW ────┘                    ├→ TASK-P1-PRELIM-VERDICT → TASK-P1-REPORT (SP-1) →
                                                                                                   │
 ┌────────────────────────────────────────────────────────────────────────────────────────────────┘
 ↓ 🟢 GO
TASK-P2-QUERY-ALPHA → TASK-P2-QUERY-BETA → [TASK-P2-QUERY-GAMMA condicional] → TASK-P2-INTERPRET → TASK-P2-REPORT (SP-2) →
                                                                                                                           │
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
 ↓ 🟢 GO
TASK-P3-VERDICT ─┬→ TASK-P3-FOLLOWUP-TEMPLATE (condicional) ─┐
                 └→ TASK-P3-ARCH-UPDATE ──────────────────────┼→ TASK-P3-REPORT (SP-3) →
                                                                                         │ si close
 ┌───────────────────────────────────────────────────────────────────────────────────────┘
 ↓
TASK-FINAL-VALIDATE (discovery pure check) → TASK-FINAL-COMMIT (1 único) → TASK-FINAL-MERGE
```

---

## Notes

- **Discovery pure enforced via TASK-FINAL-VALIDATE**: `git diff --name-only` verifica 0 edits fuera de `specs/017-*/` + `architecture.md`. Si el ejecutor accidentalmente modifica `src/` o `supabase/`, el gate bloquea el commit.
- **1 commit único en close** (criterio user): data-model + architecture.md juntos. NO pattern specs 013-016 de 2 commits (fix + arch) — aquí NO hay fix, es discovery.
- **MCP execute_sql denegado**: Queries α/β/γ Phase 2 van por Danissa en Supabase SQL Editor. Ejecutor provee SQL copy-paste.
- **Paralelización Phase 1**: TASK-P1-GREP-USECURR / -GREP-TABLES / -RLS-REVIEW son independientes (ejecutor local). MATRIX depende de los 2 greps. PRELIM-VERDICT depende de MATRIX + RLS-REVIEW.
- **Query γ condicional**: solo si β revela Cristóbal multi-org real. Si β retorna 1 org → hipótesis c confirmada sin necesidad de γ.
- **TASK-P3-FOLLOWUP-TEMPLATE condicional**: solo si verdict = CONFIRMADO o PARCIAL. Si DESCARTADO, skip (N/A aceptable).
- **Ejecutor NO ejecuta Queries α/β/γ ni pushea main**: Phase 2 lo ejecuta Danissa. TASK-FINAL-MERGE es local; Danissa pushea post-review.
- **Ajuste vs criterio user**: user pidió "Phase 2 granularidad 4 tasks" y "Phase 3 granularidad 3 tasks" pero listó 5 y 4 items respectivamente. Mantengo 5 y 4 para granularidad ejecutable (cada query como task separada + interpret + report). Si advisor prefiere bundle, fácil ajuste.
