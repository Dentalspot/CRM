# Tasks: Audit MercadoPago Subscription Flow

**Input**: [spec.md](./spec.md) · [plan.md](./plan.md)
**Feature branch**: `019-audit-mercadopago-flow`
**Prerequisites**: plan.md (3 phases + 4 SPs + 6 risks) · specs 007 (evidencia $80k Cristóbal) · specs 014 (billing_invoices RLS pattern) · specs 017/018 (discovery pure pattern)

**Format**: `[ID] [Phase] [Task] [File:Line ó Action] [Deps] [Reference] [Est min]`

---

## Gate summary

| Gate | Trigger | Checks | Block until |
|---|---|---|---|
| **SP-0** | Pre-Phase 1 | tasks.md aprobado 6/6 | 🟢 GO Danissa |
| **SP-1** | Fin Phase 1 | T1 edge functions · T2 frontend · T3 schema · T4 row state · T5 RLS state | 🟢 GO → Phase 2 |
| **SP-2** | Fin Phase 2 | T6 5 críticos · T7 4 gaps · T8 findings matriz · T9 revenue estimate | 🟢 GO → Phase 3 |
| **SP-3** | Fin Phase 3 | T10 verdict 4 niveles · T11 follow-up templates · T12 meta-spec si ≥3 BLOCKERs · T13 arch draft | Decisión close / follow-up / meta-spec |

---

## Phase 1 — Inventario (~30 min, pre-SP-1)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P1-GREP-EDGE | Phase 1 | Grep `supabase/functions/` buscando `mercadopago\|MercadoPago\|MP_\|webhook\|x-signature`. Listar edge functions candidatas en `data-model.md §Inventory > Edge functions candidates`. | `supabase/functions/**` (grep ejecutor) | SP-0 🟢 | plan.md §P1.1 · FR-001a | 3 |
| TASK-P1-READ-EDGE | Phase 1 | Para cada edge function identificada por TASK-P1-GREP-EDGE, leer código completo (Read tool). Documentar: eventos MercadoPago suscritos + ¿signature validation? + ¿idempotencia handling? + ¿logging events? + error handling. Matriz en `data-model.md §Inventory > Edge functions`. Alimenta R-01 (signature) + R-02 (idempotency). | `supabase/functions/<fn>/*.ts` (Read) | TASK-P1-GREP-EDGE | plan.md §P1.1 · R-01 · R-02 | 6 |
| TASK-P1-GREP-FRONTEND | Phase 1 | Grep frontend consumers: `supabase.from('subscriptions')`, `subscriptionApi\|useSubscription\|BillingHistory\|useInvoices`, `mercadopago\|mp_`. Clasificar callsites por tipo (read/write/both) + propósito. Matriz en `data-model.md §Inventory > Frontend`. | `src/**/*.{js,jsx}` (grep ejecutor) | SP-0 🟢 (parallel con GREP-EDGE) | plan.md §P1.2 · FR-001b | 4 |
| TASK-P1-QUERY-ALFA-BETA | Phase 1 | Queries α + β (schema + RLS) para `subscriptions`. Danissa ejecuta SQL Editor. Captura en `data-model.md §Inventory > Schema + RLS`. Si β retorna `rowsecurity=false` o `policy_count=0` → **R-04 BLOCKER inmediato**, flag para Phase 2/3. | `information_schema.columns` + `pg_tables` + `pg_policies` (read-only Danissa) | SP-0 🟢 (parallel OK con greps) | plan.md §P1.3 (α+β) · R-04 | 3 |
| TASK-P1-QUERY-GAMMA-DELTA | Phase 1 | Queries γ (status distribution actual) + δ (last_payment_at ages buckets: recent/warning/stale/never). Danissa ejecuta. Captura en `data-model.md §Inventory > State distribution`. Input para revenue impact estimate Phase 2. | `subscriptions` GROUP BY (read-only) | TASK-P1-QUERY-ALFA-BETA | plan.md §P1.3 (γ+δ) | 3 |
| TASK-P1-QUERY-EPSILON | Phase 1 | **Query ε revenue-critical check**: subscriptions activas con `last_payment_at NULL` o `< NOW() - 35 days` (zombi candidates = user usando servicio sin pago reciente). Danissa ejecuta. Documenta en `data-model.md §Inventory > Zombie detection`. Si hay >0 zombis → posible BLOCKER Phase 2 (revenue leak activo). | `subscriptions` con WHERE status='active' AND stale (read-only) | TASK-P1-QUERY-GAMMA-DELTA | plan.md §P1.3 (ε) · R-02 adjacent | 2 |
| TASK-P1-QUERY-ZETA | Phase 1 | **Query ζ idempotency retrospective**: `billing_invoices` GROUP BY `mp_payment_id` HAVING COUNT(*)>1. Si existe `billing_invoices` (pendiente TASK-P1-GREP-FRONTEND confirma callsites), ejecutar. Si retorna >0 rows → R-02 idempotency gap CONFIRMED empirically. Documenta en `data-model.md §Inventory > Idempotency retrospective`. | `billing_invoices` (read-only, si existe la tabla) | TASK-P1-QUERY-GAMMA-DELTA · TASK-P1-GREP-FRONTEND | plan.md §P1.4 · R-02 | 2 |
| TASK-P1-INVENTORY | Phase 1 | Consolidar outputs en `data-model.md §Inventory` con subsecciones: Edge functions + Frontend + Schema+RLS + State + Zombie + Idempotency + Events subscribed. Cross-check: ¿todos los callsites frontend cubren los eventos de edge functions? Si gap → flag para Phase 2. | `specs/019-audit-mercadopago-flow/data-model.md` | TASK-P1-READ-EDGE · TASK-P1-GREP-FRONTEND · TASK-P1-QUERY-ALFA-BETA · -GAMMA-DELTA · -EPSILON · -ZETA | plan.md §P1.5 · SC-001 | 4 |
| TASK-P1-REPORT | Phase 1 | **SP-1**. Reportar formato plan.md §P1.6: counts (edges, callsites, columns) + state (status dist, ages) + RLS state + zombi candidates + idempotency retro + preliminary findings hint + checks T1-T5. Esperar 🟢 GO antes Phase 2. | — | TASK-P1-INVENTORY | plan.md §P1.6 | 3 |

**SP-1 Stop Point**: T1-T5 PASS + inventario completo → Phase 2. Si TASK-P1-QUERY-ALFA-BETA detecta 0 policies → R-04 BLOCKER flagged pero NO pausa (se evalúa en Phase 2).

---

## Phase 2 — Flow Analysis End-to-End (~30 min, pre-SP-2)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P2-FLOW-DIAGRAM | Phase 2 | Basado en inventario, reconstruir flow end-to-end en `data-model.md §Flow diagram`: user click subscribe → MP checkout URL → webhook → edge function → DB update → UI refresh. Para cada paso, documentar evidencia código + gaps identificados. | `data-model.md §Flow diagram` | SP-1 🟢 | plan.md §P2.1 | 5 |
| TASK-P2-CRITICAL-EVAL | Phase 2 | Evaluar 5 puntos críticos (FR-003) con verdict OK/finding+severidad: (1) webhook signature validation (R-01), (2) idempotencia duplicate events (R-02), (3) error handling edge function (5xx vs 200), (4) retry logic compatibility con MP default 3 retries/3 días, (5) audit trail / logging. Documentar en `data-model.md §Critical points`. | `data-model.md §Critical points` | TASK-P2-FLOW-DIAGRAM | plan.md §P2.2 · FR-003 · R-01 · R-02 | 8 |
| TASK-P2-GAPS | Phase 2 | Evaluar 4 gaps funcionales con severidad: dunning (failed payment + notify + grace), plan upgrade/downgrade (R-05), cancellation flow (subscription.cancelled event handling), refund handling (payment.refunded processing). Cada uno clasificado ENHANCEMENT/LATENT/BLOCKER. Documentar en `data-model.md §Functional gaps`. | `data-model.md §Functional gaps` | TASK-P2-FLOW-DIAGRAM | plan.md §P2.3 · FR-010 · R-05 | 6 |
| TASK-P2-FINDINGS-MATRIX | Phase 2 | Consolidar findings de P2-CRITICAL-EVAL + P2-GAPS en matriz única `data-model.md §Findings` con 7 columnas: [finding_id, descripción, severidad, revenue_impact, users_afectados, probabilidad, evidencia]. Severidad sin "unclear" — aplicar criterio determinístico del spec FR-005. | `data-model.md §Findings` | TASK-P2-CRITICAL-EVAL · TASK-P2-GAPS | plan.md §P2.4 · FR-005 | 5 |
| TASK-P2-REVENUE-ESTIMATE | Phase 2 | Por cada BLOCKER/LATENT del §Findings, calcular revenue impact: `users × revenue_per_user ($20k-$80k CLP/mes) × probabilidad`. Agregado como rango total (bajo-alto) en `data-model.md §Revenue at risk` con "calibrated honesty note": estimates based on code analysis + DB state, no webhook logs. | `data-model.md §Revenue at risk` | TASK-P2-FINDINGS-MATRIX | plan.md §P2.5 · FR-012 · R-06 | 4 |
| TASK-P2-REPORT | Phase 2 | **SP-2**. Reportar formato plan.md §P2.6: flow diagram outcomes + 5 críticos verdict + 4 gaps severidad + findings distribution (BLOCKER/LATENT/EDGE/ENHANCEMENT counts) + revenue at risk range + checks T6-T9. Esperar 🟢 GO antes Phase 3. | — | TASK-P2-REVENUE-ESTIMATE | plan.md §P2.6 | 2 |

**SP-2 Stop Point**: T6-T9 PASS + findings matriz completa → Phase 3.

---

## Phase 3 — Verdict + Follow-up Scope (~20 min, pre-SP-3)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P3-VERDICT | Phase 3 | Asignar verdict 4 niveles según findings distribution (plan.md §P3.1): **AUDIT PASSED** (0B, 0L) / **MINOR GAPS** (0B, ≥1L) / **CRITICAL FINDINGS** (1-2B) / **SYSTEMIC ISSUES** (≥3B). Documentar en `data-model.md §Verdict` con rationale 2-3 sentences + acción recomendada. | `data-model.md §Verdict` | SP-2 🟢 | plan.md §P3.1 · FR-005 | 3 |
| TASK-P3-FOLLOWUP-TEMPLATES | Phase 3 | **Condicional** (solo si ≥1 BLOCKER o ≥1 LATENT). Para cada BLOCKER/LATENT, template copy-paste ready en `data-model.md §Follow-up specs`: file afectado + fix proposal + priority P0/P1 + estimated size S/M/L + dependencies + rollback plan breve + pre-filled prompt `/speckit-specify`. Verificable: count(templates) == count(BLOCKER + LATENT). | `data-model.md §Follow-up specs` | TASK-P3-VERDICT | plan.md §P3.2 · FR-006 · SC-005 | 5 |
| TASK-P3-META-SPEC-PROPOSAL | Phase 3 | **Condicional** (solo si verdict = SYSTEMIC ISSUES, ≥3 BLOCKERs). Proponer meta-spec `fix-mercadopago-critical-bugs` P0 en `data-model.md §Meta-spec proposal` con: nombre + rationale agrupación (testing integral + rollback atómico + comunicación "hardened") + list de bugs incluidos. **NO escribir spec file** — solo propuesta escrita en data-model. Advisor decide meta vs specs separados. | `data-model.md §Meta-spec proposal` | TASK-P3-VERDICT | plan.md §P3.3 · FR-007 | 3 |
| TASK-P3-ARCH-UPDATE | Phase 3 | Preparar **pending draft** de subsección nueva `§"MercadoPago subscription flow audit (spec 019 — 2026-04-21)"` para `.specify/memory/architecture.md`. Contenido: origen ($80k evidencia) + metodología (inventario + 6 queries + 5 críticos + gaps) + findings distribution + revenue at risk + action + known limitation (logs no accesibles via MCP). **No aplicar edit todavía** — TASK-FINAL-COMMIT lo hace. | `data-model.md §architecture.md update draft` | TASK-P3-VERDICT | plan.md §P3.4 · FR-009 | 4 |
| TASK-P3-REPORT | Phase 3 | **SP-3**. Reportar formato plan.md §P3.5: verdict + distribution (B/L/E/EN counts) + revenue at risk + follow-up templates count + meta-spec sugerido (sí/no) + arch draft ready + checks T10-T13. Decisión explícita advisor: close / abrir N follow-ups / abrir meta-spec. | — | TASK-P3-VERDICT · TASK-P3-FOLLOWUP-TEMPLATES · TASK-P3-META-SPEC-PROPOSAL · TASK-P3-ARCH-UPDATE | plan.md §P3.5 | 2 |

**SP-3 Stop Point**: decisión explícita del advisor antes de TASK-FINAL.

---

## Post-SP-3 — Close (~5 min, solo si SP-3 = close)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-FINAL-VALIDATE | Close | **Validación discovery pure** (patrón specs 017/018): `git diff --name-only main..019-audit-mercadopago-flow`. Output DEBE incluir SOLO paths bajo `specs/019-*/` + `.specify/memory/architecture.md`. Si aparece path bajo `src/`, `supabase/functions/`, o `supabase/migrations/` → ABORT + reportar scope violation. | `git diff --name-only main..019-audit-mercadopago-flow` | SP-3 🟢 close | FR-008 · spec.md §Scope Bounds | 1 |
| TASK-FINAL-COMMIT | Close | Editar `.specify/memory/architecture.md` aplicando el draft de TASK-P3-ARCH-UPDATE (subsección nueva + bump Last updated). Luego `git add specs/019-audit-mercadopago-flow/data-model.md .specify/memory/architecture.md` + `git commit` **único** con mensaje `docs: close spec 019 — MercadoPago flow audit ([VERDICT])` describiendo verdict + findings distribution + revenue at risk + follow-up status. Sin commits separados — discovery pure. | `.specify/memory/architecture.md` + `specs/019-*/data-model.md` | TASK-FINAL-VALIDATE | plan.md §P3.4 · criterio "1 commit único" | 2 |
| TASK-FINAL-MERGE | Close | `git checkout main && git merge --no-ff 019-audit-mercadopago-flow -m "merge: spec 019 MercadoPago flow audit ([VERDICT])"`. **NO push — Danissa lo hace post-review**. | — | TASK-FINAL-COMMIT | Constitution §Development Workflow | 2 |

---

## Summary

| Phase | Tasks | Est min | Gate |
|---|---|---|---|
| Phase 1 (inventario) | 9 | 30 | SP-1 T1-T5 |
| Phase 2 (flow analysis) | 6 | 30 | SP-2 T6-T9 |
| Phase 3 (verdict + docs) | 5 | 20 | SP-3 T10-T13 |
| Close | 3 | 5 | — |
| **Total** | **23** | **85 min** | 4 gates |

Dentro bound 90 min del spec (max 120 antes de STOP).

---

## Dependencies graph

```text
SP-0 🟢
 ↓
┌─ TASK-P1-GREP-EDGE → TASK-P1-READ-EDGE ──┐
├─ TASK-P1-GREP-FRONTEND ───────────────────┼→ TASK-P1-INVENTORY → TASK-P1-REPORT (SP-1) →
├─ TASK-P1-QUERY-ALFA-BETA ─────────────────┤                                              │
├─ TASK-P1-QUERY-GAMMA-DELTA ───────────────┤                                              │
├─ TASK-P1-QUERY-EPSILON ───────────────────┤                                              │
└─ TASK-P1-QUERY-ZETA ──────────────────────┘                                              │
 ┌────────────────────────────────────────────────────────────────────────────────────────┘
 ↓ 🟢 GO
TASK-P2-FLOW-DIAGRAM ─┬→ TASK-P2-CRITICAL-EVAL ─┐
                      └→ TASK-P2-GAPS ───────────┼→ TASK-P2-FINDINGS-MATRIX → TASK-P2-REVENUE-ESTIMATE → TASK-P2-REPORT (SP-2) →
                                                                                                                                 │
 ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
 ↓ 🟢 GO
TASK-P3-VERDICT ─┬→ TASK-P3-FOLLOWUP-TEMPLATES (cond) ─┐
                 ├→ TASK-P3-META-SPEC-PROPOSAL (cond) ─┼→ TASK-P3-REPORT (SP-3) →
                 └→ TASK-P3-ARCH-UPDATE ────────────────┘                          │ si close
 ┌───────────────────────────────────────────────────────────────────────────────────┘
 ↓
TASK-FINAL-VALIDATE → TASK-FINAL-COMMIT (1 único) → TASK-FINAL-MERGE
```

---

## Notes

- **Discovery pure enforced via TASK-FINAL-VALIDATE**: `git diff --name-only` verifica 0 edits fuera de `specs/019-*/` + `architecture.md`. Patrón idéntico a specs 017/018.
- **1 commit único en close**: data-model + architecture.md juntos. No split porque es discovery pure.
- **MCP execute_sql denegado**: Queries α/β/γ/δ/ε/ζ Phase 1 van por Danissa en SQL Editor.
- **Paralelización Phase 1**: 6 tasks paralelas (GREP-EDGE + GREP-FRONTEND + 4 queries) — Danissa puede ejecutar SQL en 1 round-trip, ejecutor corre greps local simultáneamente. READ-EDGE depende de GREP-EDGE; INVENTORY depende de todo.
- **Phase 2 bifurcada**: CRITICAL-EVAL + GAPS paralelos desde FLOW-DIAGRAM. Ambos convergen en FINDINGS-MATRIX.
- **Condicionales Phase 3**:
  - TASK-P3-FOLLOWUP-TEMPLATES solo si ≥1 BLOCKER o LATENT.
  - TASK-P3-META-SPEC-PROPOSAL solo si ≥3 BLOCKERs.
  - Si verdict = AUDIT PASSED → ambas skip, solo VERDICT + ARCH-UPDATE + REPORT.
- **Meta-spec NO ESCRITO**: solo propuesta documental en data-model.md. Constitution §IV strict.
- **23 tasks** vs specs 017 (18) / 018 (16): +5/7 por multi-surface complexity (edge + frontend + DB + external API) y 6 queries empíricas vs 3-4.
- **Ejecutor NO ejecuta queries ni pushea main**: Phase 1 queries via Danissa. TASK-FINAL-MERGE local; Danissa pushea post-review.
