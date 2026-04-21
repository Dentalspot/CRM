# Tasks: Apply Policies billing_invoices + patient_evaluations

**Input**: [spec.md](./spec.md) · [plan.md](./plan.md)
**Feature branch**: `014-apply-policies-billing-evaluations`
**Prerequisites**: plan.md (3 phases + 4 SPs + 5 risks) · spec 012 data-model §Follow-up specs (templates base) · specs 006/009 migrations (patrón canónico)

**Format**: `[ID] [Phase] [Task] [File:Line ó Action] [Deps] [Reference] [Est min]`

---

## Gate summary

| Gate | Trigger | Checks | Block until |
|---|---|---|---|
| **SP-0** | Pre-Phase 1 | tasks.md aprobado 6/6 | 🟢 GO Danissa |
| **SP-1** | Fin Phase 1 | T1 rowsecurity=true · T2 policy_count=0 · T3 row_count=0 · T4 schema confirmado · T5 callsites sin drift crítico | 🟢 GO explícito |
| **SP-2** | Fin Phase 2 | review SQL: T6 path correcto · T7 5 DROP+5 CREATE · T8 pre+post DO $$ · T9 columnas confirmadas · T10 solo 1 file modificado | 🟢 GO advisor (hard block — Danissa valida predicates) |
| **SP-3** | Fin Phase 3 | T11 pre-check sin drift · T12 apply Success · T13 post-verify 5 policies + rowsecurity · T14 sin rollback trigger activado | Decisión close / rollback / follow-up |

---

## Phase 1 — Audit Defensivo (~15 min, pre-SP-1)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P1-QUERY-A | Phase 1 | Ejecutor provee Query A (rowsecurity check). Danissa pega output en thread. Capturar en `data-model.md §Pre-apply snapshot`. Expected: 2 rows, ambas rowsecurity=true. | `pg_tables` (read-only via Danissa SQL Editor) | SP-0 🟢 | plan.md §P1.1 · spec.md FR-004 | 2 |
| TASK-P1-QUERY-B | Phase 1 | Query B (policy_count pre-apply — state drift PATTERNS.md §7). Expected: empty result (0 policies both tables). | `pg_policies` (read-only) | — (parallel OK con QUERY-A) | plan.md §P1.2 · PATTERNS.md §7 | 2 |
| TASK-P1-QUERY-C | Phase 1 | Query C (row_count billing + evaluations). Expected: ambas con 0 rows. Si >0, investigar origen antes de apply. | `billing_invoices`, `patient_evaluations` (read-only COUNT) | — (parallel OK) | plan.md §P1.3 | 1 |
| TASK-P1-QUERY-D | Phase 1 | **Query D schema validation (FR-010)**: `information_schema.columns` para las 5 tablas (`billing_invoices`, `patient_evaluations`, `patient_care_team`, `patients`, `profiles`). Confirmar columnas asumidas existen con nombre canónico. Documentar en `data-model.md §Schema confirmed`. | `information_schema.columns` (read-only) | — (parallel OK con A/B/C) | plan.md §P1.4 · spec.md FR-010 · Constitution §VI | 3 |
| TASK-P1-GREP | Phase 1 | Re-grep callsites ampliado. Ejecutor local via Grep tool: `billing_invoices` + `patient_evaluations` en `src/`. Comparar vs lista conocida (5 callsites). Documentar nuevos o shifted en `data-model.md §Callsites verified`. | `src/**/*.{js,jsx}` (grep ejecutor) | SP-0 🟢 | plan.md §P1.5 · spec 012 data-model §callsites | 3 |
| TASK-P1-QUERY-E | Phase 1 | **Opcional** (§III flag R-04). Grep: `useClinicalAccessLogger\|logClinicalAccess` en `src/lib/patientApi.js`. Documentar presencia/ausencia en `data-model.md §Audit flags`. NO bloquea — follow-up spec si ausente. | `src/lib/patientApi.js` (grep ejecutor) | TASK-P1-GREP | plan.md §P1.6 · Constitution §III · R-04 | 2 |
| TASK-P1-REPORT | Phase 1 | **SP-1 HARD BLOCK**. Reportar formato plan.md §P1.8: outputs A/B/C/D + callsites + §III flag + checks T1-T5. Esperar 🟢 GO explícito antes de Phase 2. Si T4 mismatch (schema drift) → ajustar template en P2 ANTES de escribir migration. | — | TASK-P1-QUERY-A · -B · -C · -D · -GREP · -E | plan.md §P1.7-P1.8 | 2 |

**SP-1 Stop Point**: hard block. Danissa confirma T1-T5 PASS → Phase 2. Si schema drift detectado en T4, ajuste en TASK-P2-* antes de escribir predicates.

---

## Phase 2 — Migration Escrita NO Aplicada (~15 min, pre-SP-2)

**Archivo único**: `supabase/migrations/20260420000004_apply_policies_billing_evaluations.sql` (nuevo, ≈80-120 líneas netas)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P2-HEADER | Phase 2 | Write líneas ~1-15: header comment block con título ("Spec 014 — apply policies billing_invoices + patient_evaluations"), referencias (spec 012 templates + specs 006/009 patrón canónico + Constitution §II), fecha 2026-04-20, breve resumen de las 5 policies a crear. | `supabase/migrations/20260420000004_*.sql:1-15` | SP-1 🟢 | plan.md §P2.1 item 1 · spec 009 migration header | 2 |
| TASK-P2-PRECHECK | Phase 2 | Write líneas ~16-45: `DO $$ BEGIN ... END $$;` block con assertion: (a) rowsecurity=true para ambas tablas (RAISE EXCEPTION si false), (b) policy_count=0 pre-apply (RAISE EXCEPTION si >0 — detecta drift Phase 1→apply). Incluye RAISE NOTICE con estado pre-apply capturado. | `supabase/migrations/20260420000004_*.sql:16-45` | TASK-P2-HEADER | plan.md §P2.1 item 2 · PATTERNS.md §7 · spec 006/009 patrón DO $$ | 3 |
| TASK-P2-BILLING | Phase 2 | Write líneas ~46-75: 2 policies sobre billing_invoices. Estructura: `DROP POLICY IF EXISTS "Therapists read own billing_invoices" ON billing_invoices;` + `CREATE POLICY "Therapists read own billing_invoices" ON billing_invoices FOR SELECT USING (therapist_id = auth.uid());` · luego `DROP + CREATE "Admins manage billing_invoices" FOR ALL` con is_admin predicate (`EXISTS SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role`) USING + WITH CHECK. Ajustar `therapist_id` si TASK-P1-QUERY-D detectó otro nombre. | `supabase/migrations/20260420000004_*.sql:46-75` | TASK-P2-PRECHECK | plan.md §P2.1 item 3 · spec 012 Template 1 | 3 |
| TASK-P2-EVALUATIONS | Phase 2 | Write líneas ~76-120: 3 policies sobre patient_evaluations. (1) `"Therapists manage own patient evaluations" FOR ALL` via `EXISTS (SELECT 1 FROM patient_care_team WHERE user_id = auth.uid() AND patient_id = patient_evaluations.patient_id)` USING + WITH CHECK mismo predicate. (2) `"Patients read own evaluations" FOR SELECT` via `EXISTS (SELECT 1 FROM patients WHERE id = patient_evaluations.patient_id AND patient_user_id = auth.uid())`. (3) `"Admins manage patient_evaluations" FOR ALL` is_admin pattern. Todos con DROP IF EXISTS prefix. Ajustar `user_id`/`patient_user_id` según TASK-P1-QUERY-D. | `supabase/migrations/20260420000004_*.sql:76-120` | TASK-P2-BILLING | plan.md §P2.1 item 4 · spec 012 Template 2 · R-03 mitigation | 5 |
| TASK-P2-POSTCHECK | Phase 2 | Write líneas ~121-160: (a) post-check `DO $$ ... END $$;` con assertions `policy_count billing_invoices = 2` + `policy_count patient_evaluations = 3`, RAISE EXCEPTION si ≠. Incluye RAISE NOTICE con resultado final. (b) rollback block comentado `/* ... */` con 5 DROP POLICY IF EXISTS (copy-paste del spec.md §Rollback Plan). Cerrar con comentario "Spec 014 END". | `supabase/migrations/20260420000004_*.sql:121-160` | TASK-P2-EVALUATIONS | plan.md §P2.1 items 5-6 · spec.md §Rollback Plan | 3 |
| TASK-P2-REPORT | Phase 2 | **SP-2 HARD BLOCK** (advisor review SQL). Reportar formato plan.md §P2.3: path, líneas, 5 pares DROP+CREATE, 2 DO $$ blocks, checks T6-T10. **Pegar contenido completo del archivo** para review por Danissa ANTES de apply. Esperar 🟢 GO explícito antes de Phase 3. | — | TASK-P2-HEADER · -PRECHECK · -BILLING · -EVALUATIONS · -POSTCHECK | plan.md §P2.3 | 2 |

**SP-2 Stop Point**: hard block. Danissa recibe SQL completo + valida predicates contra schema confirmado → 🟢 GO Phase 3.

---

## Phase 3 — Apply + Verify 4 Partes (~20 min, pre-SP-3)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P3-PART1-PRECHECK | Phase 3 | Parte 1 pre-check read-only. Danissa ejecuta Query A + B re-run justo antes de apply (detect drift de Phase 1 → apply window). Expected: idéntico a Phase 1. | `pg_tables` + `pg_policies` (read-only, Danissa) | SP-2 🟢 | plan.md §P3.1 | 2 |
| TASK-P3-PART2-APPLY | Phase 3 | Parte 2 apply migration. Danissa copy-paste contenido completo de `20260420000004_*.sql` al SQL Editor y ejecuta. El pre-check DO $$ del script aborta si drift; el post-check DO $$ aborta si policy_count ≠ esperado. Expected: `Success. No rows returned` + RAISE NOTICE confirmando `billing=2, evaluations=3`. | Danissa SQL Editor ejecuta `supabase/migrations/20260420000004_*.sql` | TASK-P3-PART1-PRECHECK | plan.md §P3.2 | 5 |
| TASK-P3-PART3-VERIFY | Phase 3 | Parte 3 post-verify independiente. Danissa ejecuta: (a) `SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename IN (...)` → expected 5 rows con nombres canónicos; (b) `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN (...)` → expected 2 rows ambas true. Documentar output en `data-model.md §Post-apply snapshot`. | `pg_policies` + `pg_tables` (read-only) | TASK-P3-PART2-APPLY | plan.md §P3.3 · spec.md SC-001/SC-002 | 4 |
| TASK-P3-PART4-SMOKE | Phase 3 | **Opcional** Parte 4 smoke con rows de test. SET request.jwt.claim.sub para simular terapeuta, INSERT row test, SELECT como owner/non-owner/admin, verificar aislamiento. Luego DELETE + RESET claim. Si Danissa prefiere skip (Part 3 metadata suficiente para SC-001/SC-002), documentar skip y proceed a report. | Danissa SQL Editor: INSERT + SET claim + SELECT + cleanup | TASK-P3-PART3-VERIFY | plan.md §P3.4 · spec.md SC-004 | 6 |
| TASK-P3-REPORT | Phase 3 | **SP-3**. Reportar formato plan.md §P3.5: Parts 1-4 resultados, checks T11-T14, regresiones detectadas (o ninguna), evaluación vs 3 rollback triggers del spec.md §Rollback Plan. **Decisión explícita**: close / rollback / follow-up. Si rollback → ejecutar batch del spec.md §Rollback Plan. | — | TASK-P3-PART3-VERIFY (+ TASK-P3-PART4-SMOKE si ejecutado) | plan.md §P3.5 · spec.md §Rollback Plan | 3 |

**SP-3 Stop Point**: decisión explícita del usuario antes de TASK-FINAL.

---

## Post-SP-3 — Close (~8 min, solo si SP-3 = close)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-FINAL-COMMIT | Close | `git add supabase/migrations/20260420000004_apply_policies_billing_evaluations.sql specs/014-apply-policies-billing-evaluations/data-model.md` + `git commit` con mensaje `fix(security): apply RLS policies billing_invoices + patient_evaluations (spec 014)` describiendo las 5 policies creadas, schema adjustments si hubo (Phase 1 Query D hallazgos), y Phase 3 verification outcome. **1 commit único**. | `supabase/migrations/20260420000004_*.sql` + `specs/014-*/data-model.md` | SP-3 🟢 close | Constitution §IV (micro-bloque) | 2 |
| TASK-FINAL-ARCH | Close | Update `.specify/memory/architecture.md §RLS enabled zero-policies audit` (líneas ~327-359): **preservar tabla histórica GROUP A/B/C/D** (contexto de auditoría pre-spec 014 — no reescribir) + agregar bullet/nota al final indicando "✅ 2 tablas resueltas spec 014 (billing_invoices + patient_evaluations). Queda `patient_goals` + `patient_development_areas` como único GROUP B restante (spec futura Template 3)". Opcionalmente agregar ✅ marker junto a las entries de las 2 tablas en la lista GROUP B sin borrarlas. | `.specify/memory/architecture.md:~327-359` | TASK-FINAL-COMMIT | plan.md §References · architecture.md existing §RLS audit | 3 |
| TASK-FINAL-COMMIT-ARCH | Close | `git add .specify/memory/architecture.md` + commit separado `docs: architecture.md marca spec 014 resuelto — queda patient_goals en GROUP B`. (Separado de TASK-FINAL-COMMIT para mantener el commit del fix quirúrgicamente enfocado en el SQL + data-model.) | `.specify/memory/architecture.md` | TASK-FINAL-ARCH | Constitution §IV · convención specs previas | 1 |
| TASK-FINAL-MERGE | Close | `git checkout main && git merge --no-ff 014-apply-policies-billing-evaluations -m "merge: spec 014 apply policies billing_invoices + patient_evaluations"`. **NO push — Danissa lo hace post-review**. | — | TASK-FINAL-COMMIT-ARCH | Constitution §Development Workflow (ejecutor NO pushea) | 2 |

---

## Summary

| Phase | Tasks | Est min | Gate |
|---|---|---|---|
| Phase 1 (audit) | 7 | 15 | SP-1 T1-T5 (hard block) |
| Phase 2 (migration write) | 6 | 18 | SP-2 T6-T10 (hard block — review SQL) |
| Phase 3 (apply + verify) | 5 | 20 | SP-3 T11-T14 |
| Close | 4 | 8 | — |
| **Total** | **22** | **61 min** | 4 gates |

Dentro bound 45-60 min del spec (con buffer 10 min plan.md §Time Budget = 70 min superior absoluto antes de STOP).

---

## Dependencies graph

```text
SP-0 🟢
 ↓
┌─ TASK-P1-QUERY-A (rowsecurity) ──┐
├─ TASK-P1-QUERY-B (policy_count) ─┼→ TASK-P1-REPORT (SP-1 hard block) →
├─ TASK-P1-QUERY-C (row_count) ────┤                                    │
├─ TASK-P1-QUERY-D (schema) ───────┤                                    │
├─ TASK-P1-GREP (callsites) ───────┘                                    │
└─ TASK-P1-QUERY-E (§III flag) depends on GREP                          │
 ┌────────────────────────────────────────────────────────────────────┘
 ↓ 🟢 GO
TASK-P2-HEADER → -PRECHECK → -BILLING → -EVALUATIONS → -POSTCHECK → -REPORT (SP-2 hard block) →
                                                                                              │
 ┌────────────────────────────────────────────────────────────────────────────────────────────┘
 ↓ 🟢 GO advisor
TASK-P3-PART1-PRECHECK → TASK-P3-PART2-APPLY → TASK-P3-PART3-VERIFY →
                                                                    ├→ TASK-P3-PART4-SMOKE (opcional) →
                                                                    └→ TASK-P3-REPORT (SP-3) →
                                                                                              │ si close
 ┌────────────────────────────────────────────────────────────────────────────────────────────┘
 ↓
TASK-FINAL-COMMIT → TASK-FINAL-ARCH → TASK-FINAL-COMMIT-ARCH → TASK-FINAL-MERGE
```

---

## Notes

- **Scope tight**: FR-008 = 1 archivo nuevo exclusivamente. TASK-P2-* escriben incrementalmente ese único archivo, NO crean archivos adicionales.
- **MCP execute_sql denegado**: todas las Query A/B/C/D + Parts 1/2/3/4 Phase 3 van por Danissa en Supabase SQL Editor. Ejecutor provee SQL copy-paste.
- **Paralelización Phase 1**: TASK-P1-QUERY-A/B/C/D/GREP son independientes entre sí — Danissa puede ejecutar las 4 queries en un solo round-trip del SQL Editor (concatenar con `;`) mientras el ejecutor corre GREP en paralelo.
- **Hard blocks SP-1 y SP-2**: no avanzar sin 🟢 GO explícito. SP-2 es review de SQL antes de apply — Danissa valida predicates.
- **Rollback disponible en spec.md §Rollback Plan**: batch copy-pasteable. Si SP-3 decisión = rollback, ejecutar batch directo sin esperar nueva spec.
- **Ejecutor NO aplica migration ni pushea main**: TASK-P3-PART2-APPLY lo ejecuta Danissa. TASK-FINAL-MERGE es local en branch + main (sin push). Push post-review es responsabilidad de Danissa.
- **TASK-FINAL-ARCH preserva historia**: la tabla GROUP A/B/C/D del audit spec 012 NO se reescribe — solo se anexan ✅ markers + nota de cierre parcial (queda `patient_goals` como último GROUP B).
