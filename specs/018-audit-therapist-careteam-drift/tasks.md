# Tasks: Audit therapist_id vs care_team Drift

**Input**: [spec.md](./spec.md) · [plan.md](./plan.md)
**Feature branch**: `018-audit-therapist-careteam-drift`
**Prerequisites**: plan.md (3 phases + 4 SPs + 5 risks) · spec 017 (origen hallazgo) · spec 003 migration 20260419000001 (trigger sync date boundary)

**Format**: `[ID] [Phase] [Task] [File:Line ó Action] [Deps] [Reference] [Est min]`

---

## Gate summary

| Gate | Trigger | Checks | Block until |
|---|---|---|---|
| **SP-0** | Pre-Phase 1 | tasks.md aprobado 6/6 | 🟢 GO Danissa |
| **SP-1** | Fin Phase 1 | T1 Query α count · T2 Query β per-therapist · T3 Query γ per-org · T4 Query δ 5 hipótesis | 🟢 GO → Phase 2 |
| **SP-2** | Fin Phase 2 | T5 severidad asignada · T6 hipótesis dominante (o "mixed") · T7 user impact estimado | 🟢 GO → Phase 3 |
| **SP-3** | Fin Phase 3 | T8 verdict completo · T9 follow-up scope si MEDIA/ALTA · T10 architecture.md draft | Decisión close / abrir follow-up |

---

## Phase 1 — Quantification + Categorization (~15 min, pre-SP-1)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P1-QUERY-ALFA | Phase 1 | Query α global count del drift. Ejecutor provee SQL (plan.md §P1.1), Danissa ejecuta en SQL Editor + pega output. Expected: N ≥0. Capturar en `data-model.md §Quantification`. | `patients` + `patient_care_team` (read-only, Danissa) | SP-0 🟢 | plan.md §P1.1 · FR-001 | 2 |
| TASK-P1-QUERY-BETA | Phase 1 | Query β per-therapist distribution (TOP 20). Danissa ejecuta. Capturar en `data-model.md §Breakdown`. | `patients` GROUP BY therapist_id (read-only) | SP-0 🟢 (parallel OK) | plan.md §P1.2 · FR-002 | 2 |
| TASK-P1-QUERY-GAMMA | Phase 1 | Query γ per-organization distribution. Danissa ejecuta. Capturar en `data-model.md §Breakdown`. | `patients` GROUP BY organization_id | SP-0 🟢 (parallel OK) | plan.md §P1.3 · FR-002 | 2 |
| TASK-P1-QUERY-DELTA | Phase 1 | Query δ categorización en 5 hipótesis + unclear bucket. CASE WHEN ordenado por especificidad (a→b→d→c→e→unclear, first-match-wins). Danissa ejecuta. Capturar resultado categorizado + agregado `GROUP BY hypothesis` en `data-model.md §Hypothesis distribution`. | `patients` + `patient_care_team` + `organization_members` (subqueries) | TASK-P1-QUERY-ALFA | plan.md §P1.4 · FR-003 · R-02 | 4 |
| TASK-P1-MATRIX | Phase 1 | Consolidar outputs en `data-model.md`: `§Quantification` + `§Breakdown` (β + γ) + `§Hypothesis distribution` (δ con %). Incluir criterio determinístico en `§Hypothesis criteria` (cómo se asigna cada hipótesis). | `specs/018-audit-therapist-careteam-drift/data-model.md` | TASK-P1-QUERY-ALFA · -BETA · -GAMMA · -DELTA | plan.md §P1.5 · FR-003 | 3 |
| TASK-P1-REPORT | Phase 1 | **SP-1**. Reportar formato plan.md §P1.6: count α + tops β/γ + hipótesis distribution + preliminary severidad + hipótesis dominante hint + checks T1-T4. Esperar 🟢 GO advisor antes Phase 2. | — | TASK-P1-MATRIX | plan.md §P1.6 | 2 |

**SP-1 Stop Point**: T1-T4 PASS + matriz consolidada → Phase 2.

---

## Phase 2 — Análisis + Verdict (~10 min, pre-SP-2)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P2-SEVERITY | Phase 2 | Asignar severidad ternaria (+ NULA) según plan.md §P2.1: NULA (count=0) / BAJA (1-5) / MEDIA (6-50 o ≥1 post-trigger) / ALTA (>50 o ≥5 post-trigger). Calcular "pacientes post-trigger" = Query δ bucket NO-legacy (a). Documentar en `data-model.md §Severity` con rationale. | `data-model.md §Severity` | SP-1 🟢 | plan.md §P2.1 · FR-004 | 3 |
| TASK-P2-HYPOTHESIS | Phase 2 | Identificar hipótesis dominante según plan.md §P2.2: clear winner (≥60%) / 2-way split (≥35% c/u) / distribuida (<35% cada, >40% unclear → mixed approach). Documentar en `data-model.md §Dominant hypothesis` con rationale. Plus: estimate user impact = count DISTINCT therapist_id con subscription activa (plan.md §P2.3 SQL). | `data-model.md §Dominant hypothesis` + `§User impact` | TASK-P2-SEVERITY | plan.md §P2.2-P2.3 · R-02 | 4 |
| TASK-P2-REPORT | Phase 2 | **SP-2**. Reportar formato plan.md §P2.5: severidad + hipótesis + impact + checks T5-T7. Esperar 🟢 GO advisor antes Phase 3. | — | TASK-P2-SEVERITY · TASK-P2-HYPOTHESIS | plan.md §P2.5 | 2 |

**SP-2 Stop Point**: T5-T7 PASS → Phase 3.

---

## Phase 3 — Docs + Follow-up Condicional (~10 min, pre-SP-3)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P3-VERDICT | Phase 3 | Consolidar verdict en `data-model.md §Verdict` con: severidad + hipótesis dominante + user impact + rationale 2-3 sentencias + decisión explícita (close NULA/BAJA / follow-up MEDIA / follow-up P0 ALTA). | `data-model.md §Verdict` | SP-2 🟢 | plan.md §P3.1 · FR-004 | 2 |
| TASK-P3-FOLLOWUP-TEMPLATE | Phase 3 | **Condicional** (solo si severidad = MEDIA o ALTA). Preparar `data-model.md §Follow-up fix scope` template copy-paste ready con Option X (backfill idempotent patient_care_team) + Option Y (cleanup therapist_id) + recomendación según hipótesis dominante + estimated size + priority P0/P1. Si severidad = NULA o BAJA, documentar "N/A — close sin follow-up". | `data-model.md §Follow-up fix scope` | TASK-P3-VERDICT | plan.md §P3.1 · FR-005 · R-03 | 3 |
| TASK-P3-ARCH-UPDATE | Phase 3 | Preparar **pending draft** de subsección nueva `§"Therapist_id vs care_team drift audit (spec 018 — 2026-04-21)"` para `.specify/memory/architecture.md`. Contenido: origen (spec 017 hallazgo), metodología (4 queries), findings (counts + hipótesis), verdict, action. **No aplicar el edit todavía** — TASK-FINAL-COMMIT lo hace. Documentar draft en `data-model.md §architecture.md update draft`. | `data-model.md §architecture.md update draft` | TASK-P3-VERDICT | plan.md §P3.2 · FR-006 | 2 |
| TASK-P3-REPORT | Phase 3 | **SP-3**. Reportar formato plan.md §P3.3: verdict + follow-up (preparado o N/A) + architecture.md update ready + checks T8-T10. Decisión explícita advisor: close / abrir follow-up P0 / abrir follow-up P1. | — | TASK-P3-VERDICT · TASK-P3-FOLLOWUP-TEMPLATE · TASK-P3-ARCH-UPDATE | plan.md §P3.3 | 1 |

**SP-3 Stop Point**: decisión explícita del advisor antes de TASK-FINAL.

---

## Post-SP-3 — Close (~5 min, solo si SP-3 = close)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-FINAL-VALIDATE | Close | **Validación discovery pure**: `git diff --name-only main..018-audit-therapist-careteam-drift`. Output DEBE incluir SOLO paths bajo `specs/018-*/` + `.specify/memory/architecture.md`. Si aparece path bajo `src/`, `supabase/migrations/`, o `supabase/functions/` → ABORT + reportar scope violation. Patrón identical a spec 017. | `git diff --name-only main..018-audit-therapist-careteam-drift` | SP-3 🟢 close | FR-007 · spec.md §Scope Bounds · spec 017 pattern | 1 |
| TASK-FINAL-COMMIT | Close | Editar `.specify/memory/architecture.md` aplicando el draft de TASK-P3-ARCH-UPDATE (subsección nueva + bump Last updated). Luego `git add specs/018-audit-therapist-careteam-drift/data-model.md .specify/memory/architecture.md` + `git commit` **único** con mensaje `docs: close spec 018 — therapist_id drift audit ([SEVERITY])` describiendo severidad + hipótesis + counts + follow-up status. **Sin commits separados fix/docs** — discovery pure. | `.specify/memory/architecture.md` + `specs/018-*/data-model.md` | TASK-FINAL-VALIDATE | spec 017 close pattern · criterio user "1 commit único" | 2 |
| TASK-FINAL-MERGE | Close | `git checkout main && git merge --no-ff 018-audit-therapist-careteam-drift -m "merge: spec 018 therapist_id drift audit ([SEVERITY])"`. **NO push — Danissa lo hace post-review**. | — | TASK-FINAL-COMMIT | Constitution §Development Workflow | 2 |

---

## Summary

| Phase | Tasks | Est min | Gate |
|---|---|---|---|
| Phase 1 (quantification) | 6 | 15 | SP-1 T1-T4 |
| Phase 2 (análisis) | 3 | 10 | SP-2 T5-T7 |
| Phase 3 (docs + draft) | 4 | 10 | SP-3 T8-T10 |
| Close (validate + 1 commit + merge) | 3 | 5 | — |
| **Total** | **16** | **40 min** | 4 gates |

Dentro bound 30-45 min del spec (bound superior 60 min antes de STOP).

---

## Dependencies graph

```text
SP-0 🟢
 ↓
TASK-P1-QUERY-ALFA ──┐
TASK-P1-QUERY-BETA ──┼→ TASK-P1-QUERY-DELTA → TASK-P1-MATRIX → TASK-P1-REPORT (SP-1) →
TASK-P1-QUERY-GAMMA ─┘                                                                  │
 ┌──────────────────────────────────────────────────────────────────────────────────────┘
 ↓ 🟢 GO
TASK-P2-SEVERITY → TASK-P2-HYPOTHESIS → TASK-P2-REPORT (SP-2) →
                                                                 │
 ┌───────────────────────────────────────────────────────────────┘
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

- **Discovery pure enforced via TASK-FINAL-VALIDATE**: `git diff --name-only` verifica 0 edits fuera de `specs/018-*/` + `architecture.md`. Patrón idéntico a spec 017.
- **1 commit único en close**: data-model + architecture.md juntos. NO pattern fix+arch split (específico a specs con code changes).
- **MCP execute_sql denegado**: Queries α/β/γ/δ Phase 1 + plan.md §P2.3 (user impact) van por Danissa en Supabase SQL Editor.
- **Paralelización Phase 1**: QUERY-ALFA/BETA/GAMMA son independientes — Danissa puede ejecutar las 3 en un round-trip. DELTA depende de ALFA conceptualmente (usa misma subquery) pero puede ejecutarse paralelo si SQL Editor permite múltiples.
- **TASK-P3-FOLLOWUP-TEMPLATE condicional**: solo si severidad MEDIA o ALTA. Si NULA/BAJA, documentar "N/A close" (no saltar task — confirmar decisión).
- **Severity NULA adicional**: plan.md §P2.1 agrega NULA al range cuando Query α = 0 (R-01 transitorio). Spec originalmente definía 3 niveles (BAJA/MEDIA/ALTA), plan extendió a 4.
- **Ejecutor NO ejecuta queries ni pushea main**: Phase 1 queries las ejecuta Danissa. TASK-FINAL-MERGE es local; Danissa pushea post-review.
- **Total 16 tasks** vs spec 017's 18 tasks: -2 porque Phase 1 de spec 018 no tiene grep local ni RLS review (4 queries + matrix + report). Phase 2 tiene 3 tasks vs spec 017's 5 (sin query γ empirical separado + sin interpret porque severity asignment es directo).
