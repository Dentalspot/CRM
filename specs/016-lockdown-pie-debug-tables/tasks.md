# Tasks: Lockdown PIE + debug_signup_logs Tables

**Input**: [spec.md](./spec.md) · [plan.md](./plan.md)
**Feature branch**: `016-lockdown-pie-debug-tables`
**Prerequisites**: plan.md (3 phases + 4 SPs + 5 risks) · spec 006 migration `20260420000001` (patrón ENABLE RLS canónico) · spec 010 (feature flags inventory confirmed OFF)

**Format**: `[ID] [Phase] [Task] [File:Line ó Action] [Deps] [Reference] [Est min]`

---

## Gate summary

| Gate | Trigger | Checks | Block until |
|---|---|---|---|
| **SP-0** | Pre-Phase 1 | tasks.md aprobado 6/6 | 🟢 GO Danissa |
| **SP-1** | Fin Phase 1 | T1 6 tablas existen · T2 rowsecurity=false (o true+0 policies) · T3 row_counts capturados · T4 callsites wrap analysis · T5 **FR-009 Decision** documentada | 🟢 GO explícito (CRÍTICO — Option 1/2/3) |
| **SP-2** | Fin Phase 2 | review SQL: T6 path · T7 6 ALTER TABLE · T8 2 DO $$ · T9 post-check conteo match decisión · T10 solo 1 file modificado | 🟢 GO advisor (hard block) |
| **SP-3** | Fin Phase 3 | T11 pre-check sin drift · T12 apply Success · T13 post-verify 6/6 + conteo · T14 smoke a deny-all confirm · T15 smoke b dashboard sin regresión | Decisión close / rollback / follow-up |

---

## Phase 1 — Audit Defensivo (~15 min, pre-SP-1)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P1-A | Phase 1 | Query A rowsecurity + policy_count para 6 tablas (con subquery JOIN). Ejecutor provee SQL; Danissa pega output. Captura en `data-model.md §Pre-apply snapshot`. Expected: 6 rows rowsecurity=false + policy_count=0. | `pg_tables` + `pg_policies` (read-only) | SP-0 🟢 | plan.md §P1.1 · PATTERNS.md §7 | 2 |
| TASK-P1-B | Phase 1 | Query B row counts (UNION ALL 6 tablas). Contexto informativo para rollback. Expected: bajo (0 PIE dormant, variable `debug_signup_logs`). | 6 tablas COUNT (read-only) | — (parallel con A) | plan.md §P1.2 | 1 |
| TASK-P1-C | Phase 1 | Query C `information_schema.columns` para 6 tablas (schema drift / existence check). Propósito: catch drop-recreate anomalías (R-05). Predicates no referencian columnas (sin policies). | `information_schema.columns` (read-only) | — (parallel OK) | plan.md §P1.3 · R-05 | 2 |
| TASK-P1-GREP-FRONTEND | Phase 1 | **Grep callsites frontend** para las 6 tablas en `src/`. Para cada match: documentar archivo+línea + tipo (SELECT/INSERT/...) + **contexto wrap** (dentro de `FEATURE_FLAGS.PIE_ESCOLAR`? admin route sin flag? fuera de cualquier flag?). Documentar matriz en `data-model.md §Callsite wrap analysis`. Crítico para FR-009. | `src/**/*.{js,jsx}` (grep ejecutor) | SP-0 🟢 | plan.md §P1.4 · R-01 · R-02 · FR-009 | 4 |
| TASK-P1-GREP-EDGE | Phase 1 | Grep edge functions `supabase/functions/**` para las 6 tablas. Para cada match verificar uso de `SERVICE_ROLE_KEY` (estándar) vs `ANON_KEY` (anómalo). Documentar en `data-model.md §Edge functions audit`. R-03 mitigation. | `supabase/functions/**` (grep ejecutor) | SP-0 🟢 (parallel con FRONTEND) | plan.md §P1.5 · R-03 | 2 |
| TASK-P1-DECISION | Phase 1 | **DECISIÓN CRÍTICA FR-009** basada en outputs GREP-FRONTEND + GREP-EDGE + admin tooling scan (`src/features/admin/**`). Documentar en `data-model.md §FR-009 Decision` con rationale + opción elegida: Option 1 Pure lock-down (0 callsites no-wrapped, 0 admin) / Option 2 Lock-down + N admin policies / Option 3 STOP (callsite user-facing no-wrapped → re-evaluar). | `data-model.md §FR-009 Decision` | TASK-P1-GREP-FRONTEND · TASK-P1-GREP-EDGE | plan.md §P1.7 · FR-009 · R-01 · R-02 | 3 |
| TASK-P1-REPORT | Phase 1 | **SP-1 HARD BLOCK**. Reportar formato plan.md §P1.8: outputs A/B/C + callsites wrap + edge functions + admin + **FR-009 Decision** + checks T1-T5. Esperar 🟢 GO antes Phase 2. | — | TASK-P1-A · -B · -C · -GREP-FRONTEND · -GREP-EDGE · -DECISION | plan.md §P1.8 | 1 |

**SP-1 Stop Point**: hard block. T1-T5 PASS + FR-009 Decision → Phase 2.

---

## Phase 2 — Migration Escrita NO Aplicada (~10 min, pre-SP-2)

**Archivo único**: `supabase/migrations/20260420000006_lockdown_pie_debug_tables.sql` (nuevo, ≈60-100 líneas según FR-009 decision)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P2-HEADER | Phase 2 | Write líneas ~1-20: comment block con spec 016 title, fecha 2026-04-20, origen (último P0 RLS coverage audit), approach minimal (deny-all default), referencias spec 006 patrón canónico + Constitution §II. Explicitar **FR-009 Decision** elegida en Phase 1 (Option 1/2). | `supabase/migrations/20260420000006_*.sql:1-20` | SP-1 🟢 | plan.md §P2.1 item 1 · spec 006 header pattern | 1 |
| TASK-P2-PRECHECK | Phase 2 | Write líneas ~21-55: `DO $$ BEGIN ... END $$;` con assertions: (a) 6 tablas existen en pg_tables (R-05 mitigation), (b) rowsecurity=false O (rowsecurity=true AND policy_count=0) — target state compatible con re-run, (c) RAISE EXCEPTION si policy_count>0 en alguna (drift). RAISE NOTICE con estado pre. | `supabase/migrations/20260420000006_*.sql:21-55` | TASK-P2-HEADER | plan.md §P2.1 item 2 · PATTERNS.md §7 | 2 |
| TASK-P2-LOCKDOWN | Phase 2 | Write líneas ~56-80: 6 `ALTER TABLE public.<tabla> ENABLE ROW LEVEL SECURITY;` exactas. Orden alfabético: debug_signup_logs, pie_paci, pie_schedule_blocks, pie_sessions, pie_students, pie_therapist_schools. **Si Phase 1 = Option 2**, agregar 1-2 `DROP + CREATE POLICY "Admins manage <tabla>"` inmediatamente después (patrón is_admin replica spec 014 lines 67-73). | `supabase/migrations/20260420000006_*.sql:56-100` (más largo si Option 2) | TASK-P2-PRECHECK · TASK-P1-DECISION | plan.md §P2.1 item 3-4 · FR-001/FR-002 | 3 |
| TASK-P2-POSTCHECK | Phase 2 | Write líneas ~101-150: (a) post-check `DO $$` con assertions 6 tablas rowsecurity=true + policy_count matching decisión (0 para Option 1, N>0 para Option 2). RAISE NOTICE con conteo final + cierre "último P0 RLS coverage audit resuelto". (b) Rollback block comentado `/* ... */` con 6 DISABLE ROW LEVEL SECURITY + (si Option 2) DROP POLICY condicional. Cerrar con comentario "Spec 016 END — RLS coverage audit P0 closed". | `supabase/migrations/20260420000006_*.sql:101-150` | TASK-P2-LOCKDOWN | plan.md §P2.1 items 5-6 · spec.md §Rollback Plan | 2 |
| TASK-P2-REPORT | Phase 2 | **SP-2 HARD BLOCK** (advisor review SQL). Reportar formato plan.md §P2.3: path, líneas, 6 ALTER TABLE + N policies (según Option), checks T6-T10. **Pegar contenido completo del archivo** para review por Danissa ANTES de apply. Esperar 🟢 GO. | — | TASK-P2-HEADER · -PRECHECK · -LOCKDOWN · -POSTCHECK | plan.md §P2.3 | 2 |

**SP-2 Stop Point**: hard block. Danissa valida SQL + variante → 🟢 GO Phase 3.

---

## Phase 3 — Apply + Verify 4 Partes (~15 min, pre-SP-3)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P3-PART1 | Phase 3 | Parte 1 pre-check read-only. Danissa re-ejecuta Query A justo antes de apply. Detecta drift Phase 1 → apply window. Expected: idéntico Phase 1. | `pg_tables` + `pg_policies` (read-only) | SP-2 🟢 | plan.md §P3.1 | 2 |
| TASK-P3-PART2 | Phase 3 | Parte 2 apply migration atómica. Danissa copy-paste completo del `.sql` al SQL Editor. Pre-check DO $$ aborta si drift; 6 ALTER TABLE + (si Option 2) admin policies; post-check DO $$ aborta si conteo ≠. Expected: Success + RAISE NOTICE confirmando `6 tablas rowsecurity=true + policy_count=[0/N]`. | Danissa ejecuta `supabase/migrations/20260420000006_*.sql` SQL Editor | TASK-P3-PART1 | plan.md §P3.2 | 3 |
| TASK-P3-PART3 | Phase 3 | Parte 3 post-verify independiente. Danissa re-ejecuta `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN (<6>)` + `SELECT tablename, COUNT(*) FROM pg_policies WHERE tablename IN (<6>) GROUP BY tablename`. Expected: 6 rows rowsecurity=true + policy counts matching Option. Documentar en `data-model.md §Post-apply snapshot`. | `pg_tables` + `pg_policies` (read-only) | TASK-P3-PART2 | plan.md §P3.3 · spec.md SC-001/SC-002 | 2 |
| TASK-P3-PART4 | Phase 3 | Parte 4 smoke opcional: **(a) recomendado**: DevTools console del app logueado no-admin → `supabase.from('pie_sessions').select('*').limit(1)` → expected empty array o 42501 (deny-all confirm). **(b) recomendado**: navegar dashboard therapist (PIE_ESCOLAR=false) → verificar carga normal sin console errors nuevos. **(c) opcional si R-03**: invocar edge function signup con payload test → verificar INSERT a debug_signup_logs exitoso. | Browser DevTools + dev server + opcional edge function invoke | TASK-P3-PART3 | plan.md §P3.4 · spec.md SC-003/SC-004 | 6 |
| TASK-P3-REPORT | Phase 3 | **SP-3**. Reportar formato plan.md §P3.5: Parts 1-4 resultados, checks T11-T15, regresiones detectadas, evaluación vs 3 rollback triggers del spec.md §Rollback Plan. **Decisión explícita**: close / rollback / follow-up. Si rollback → ejecutar batch del spec.md §Rollback Plan (6 DISABLE). | — | TASK-P3-PART4 | plan.md §P3.5 · spec.md §Rollback Plan | 2 |

**SP-3 Stop Point**: decisión explícita antes de TASK-FINAL.

---

## Post-SP-3 — Close (~8 min, solo si SP-3 = close)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-FINAL-COMMIT | Close | `git add supabase/migrations/20260420000006_lockdown_pie_debug_tables.sql specs/016-lockdown-pie-debug-tables/data-model.md` + commit `feat(rls): lockdown pie + debug_signup_logs tables (spec 016)`. Mensaje describe: 6 tablas con rowsecurity=true post-apply, FR-009 decision elegida (Option 1/2), policies creadas (0 o N), Phase 3 verification outcome, cierre del último P0 del RLS coverage audit 2026-04-20. | `supabase/migrations/20260420000006_*.sql` + `specs/016-*/data-model.md` | SP-3 🟢 close | Constitution §IV | 2 |
| TASK-FINAL-ARCH | Close | Update `.specify/memory/architecture.md §RLS coverage audit` marcando las **6 tablas como ✅ resueltos spec 016** (deny-all default via ENABLE RLS). **Preservar tabla histórica intacta**. Marcar audit P0 como COMPLETAMENTE RESUELTO (0 tablas restantes con rowsecurity=false + 0 policies en scope del audit original). Agregar **nota forward-looking §V**: "Reactivación PIE futura debe escribir policies ANTES de activar FEATURE_FLAGS.PIE_ESCOLAR — deny-all con admin sin policy causaría empty state silencioso (violación UI Honesty)". Bump "Last updated" con referencia spec 016 + cierre completo audit P0. | `.specify/memory/architecture.md` secciones §RLS coverage audit + footer Last updated | TASK-FINAL-COMMIT | plan.md §References · architecture.md existing §RLS coverage audit · Constitution §V | 3 |
| TASK-FINAL-COMMIT-ARCH | Close | `git add .specify/memory/architecture.md` + commit separado `docs: architecture.md — audit P0 RLS coverage RESUELTO (spec 016 cierra 6/6)`. Separado del fix commit por higiene (patrón specs 013/014/015). | `.specify/memory/architecture.md` | TASK-FINAL-ARCH | Constitution §IV · convención specs previas | 1 |
| TASK-FINAL-MERGE | Close | `git checkout main && git merge --no-ff 016-lockdown-pie-debug-tables -m "merge: spec 016 lockdown pie + debug_signup_logs tables"`. **NO push — Danissa lo hace post-review**. | — | TASK-FINAL-COMMIT-ARCH | Constitution §Development Workflow | 2 |

---

## Summary

| Phase | Tasks | Est min | Gate |
|---|---|---|---|
| Phase 1 (audit + decision) | 7 | 15 | SP-1 T1-T5 (hard block — FR-009) |
| Phase 2 (migration write) | 5 | 10 | SP-2 T6-T10 (hard block — review SQL) |
| Phase 3 (apply + verify) | 5 | 15 | SP-3 T11-T15 |
| Close | 4 | 8 | — |
| **Total** | **21** | **48 min** | 4 gates |

Dentro bound 45-60 min del spec (buffer 10 min plan.md §Time Budget = 58 min superior absoluto antes de STOP).

---

## Dependencies graph

```text
SP-0 🟢
 ↓
┌─ TASK-P1-A (rowsecurity+policy_count) ──┐
├─ TASK-P1-B (row_count) ──────────────────┤
├─ TASK-P1-C (schema columns) ─────────────┼→ TASK-P1-DECISION → TASK-P1-REPORT (SP-1) →
├─ TASK-P1-GREP-FRONTEND ──────────────────┤                                              │
├─ TASK-P1-GREP-EDGE ──────────────────────┘                                              │
 ┌──────────────────────────────────────────────────────────────────────────────────────┘
 ↓ 🟢 GO
TASK-P2-HEADER → -PRECHECK → -LOCKDOWN → -POSTCHECK → -REPORT (SP-2 hard block) →
                                                                                  │
 ┌────────────────────────────────────────────────────────────────────────────────┘
 ↓ 🟢 GO advisor
TASK-P3-PART1 → TASK-P3-PART2 → TASK-P3-PART3 → TASK-P3-PART4 → TASK-P3-REPORT (SP-3) →
                                                                                        │ si close
 ┌──────────────────────────────────────────────────────────────────────────────────────┘
 ↓
TASK-FINAL-COMMIT → TASK-FINAL-ARCH → TASK-FINAL-COMMIT-ARCH → TASK-FINAL-MERGE
```

---

## Notes

- **Scope tight**: FR-007 = 1 archivo nuevo exclusivamente (`20260420000006_*.sql`). TASK-P2-* escriben incrementalmente ese único archivo.
- **MCP execute_sql denegado**: Query A/B/C + Parts 1/3 Phase 3 van por Danissa en Supabase SQL Editor. Ejecutor provee SQL copy-paste.
- **Paralelización Phase 1**: TASK-P1-A/B/C independientes entre sí (Danissa ejecuta 3 queries en 1 round-trip). TASK-P1-GREP-FRONTEND y -GREP-EDGE paralelos por ejecutor. TASK-P1-DECISION depende de GREP outputs.
- **Phase 2 más corto que specs 014/015**: 0 CREATE POLICY por default (Option 1). Si Option 2 → +1-2 admin policies (pattern is_admin replica spec 014).
- **Smoke Phase 3 Parte 4 tiene 3 sub-partes** (a deny-all en DevTools, b dashboard sin regresión, c edge function si R-03). (a) + (b) son recomendados, (c) solo si Phase 1 detectó R-03.
- **TASK-FINAL-ARCH marca cierre del audit P0**: architecture.md §RLS coverage audit se actualiza a "COMPLETAMENTE RESUELTO" para P0. Nota §V forward-looking previene violación UX futura cuando PIE reactive.
- **2 commits en close** (fix + arch) por higiene, patrón specs 013/014/015.
- **Ejecutor NO aplica migration ni pushea main**: TASK-P3-PART2 lo ejecuta Danissa. TASK-FINAL-MERGE es local; Danissa pushea post-review.
