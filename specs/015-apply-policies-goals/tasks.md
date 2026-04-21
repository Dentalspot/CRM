# Tasks: Apply Policies patient_goals + patient_development_areas

**Input**: [spec.md](./spec.md) · [plan.md](./plan.md)
**Feature branch**: `015-apply-policies-goals`
**Prerequisites**: plan.md (3 phases + 4 SPs + 5 risks) · spec 012 Template 3 · spec 014 migration `20260420000004` (patrón canónico replica)

**Format**: `[ID] [Phase] [Task] [File:Line ó Action] [Deps] [Reference] [Est min]`

---

## Gate summary

| Gate | Trigger | Checks | Block until |
|---|---|---|---|
| **SP-0** | Pre-Phase 1 | tasks.md aprobado 6/6 | 🟢 GO Danissa |
| **SP-1** | Fin Phase 1 | T1 rowsecurity=true · T2 policy_count=0 · T3 row_count=0 · T4 schema confirmado · T5 decisión shared/per-patient documentada | 🟢 GO explícito |
| **SP-2** | Fin Phase 2 | review SQL: T6 path · T7 4-5 DROP+CREATE · T8 2 DO $$ · T9 columnas confirmadas · T10 post-check conteo = decisión · T11 solo 1 file modificado | 🟢 GO advisor (hard block) |
| **SP-3** | Fin Phase 3 | T12 pre-check sin drift · T13 apply Success · T14 post-verify 4 o 5 policies + rowsecurity · T15 smoke 4b embed populated · T16 edge function smoke 4a (si ejecutado) sin regression | Decisión close / rollback / follow-up |

---

## Phase 1 — Audit Defensivo (~10-15 min, pre-SP-1)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P1-A | Phase 1 | Query A (rowsecurity check ambas tablas). Ejecutor provee SQL; Danissa pega output. Capturar en `data-model.md §Pre-apply snapshot`. Expected: 2 rows, both true. | `pg_tables` (read-only, Danissa SQL Editor) | SP-0 🟢 | plan.md §P1.1 · spec.md FR-005 | 1 |
| TASK-P1-B | Phase 1 | Query B (policy_count=0 both). state drift PATTERNS.md §7. Expected: empty result. | `pg_policies` (read-only) | — (parallel con A) | plan.md §P1.2 · PATTERNS.md §7 | 1 |
| TASK-P1-C | Phase 1 | Query C (row_count ambas tablas). Expected: ambas 0. Si >0 investigar antes de apply. | `patient_goals` + `patient_development_areas` COUNT (read-only) | — (parallel OK) | plan.md §P1.3 | 1 |
| TASK-P1-D | Phase 1 | **Query D CRITICAL (FR-010)**: `information_schema.columns` de 5 tablas (`patient_goals`, `patient_development_areas`, `patient_care_team`, `patients`, `profiles`). Validar columnas clave. **Observar presencia/ausencia de `patient_id` en `patient_development_areas`** — input para TASK-P1-DECISION. Documentar en `data-model.md §Schema confirmed`. | `information_schema.columns` (read-only) | — (parallel OK) | plan.md §P1.4 · spec.md FR-010 · Constitution §VI | 4 |
| TASK-P1-D-EXT | Phase 1 | Query D-extended: `information_schema.table_constraints` + `key_column_usage` para FKs de ambas tablas. Mitiga R-05 (FK constraint naming). Documentar en `data-model.md §FK constraints`. Opcional pero recomendado. | `information_schema.table_constraints` (read-only) | TASK-P1-D | plan.md §P1.5 · R-05 | 2 |
| TASK-P1-GREP | Phase 1 | Re-grep callsites ambas tablas en `src/` (frontend) + `supabase/functions/` (edge functions R-03). Confirmar 2 callsites frontend conocidos + 4 edge functions service_role. Documentar drift/nuevos callsites. | `src/**/*.{js,jsx}` + `supabase/functions/**` (grep ejecutor) | SP-0 🟢 | plan.md §P1.6-P1.7 · R-03 · R-04 | 3 |
| TASK-P1-DECISION | Phase 1 | **DECISIÓN CRÍTICA**: con outputs Query D + D-ext, decidir **shared catalog** vs **per-patient** para `patient_development_areas`. Criterio determinístico: si tiene `patient_id` column → per-patient (5 policies totales); si no → shared catalog (4 policies totales). Documentar en `data-model.md §Decision log` con rationale + conteo final. | `data-model.md §Decision log` | TASK-P1-D · TASK-P1-D-EXT | plan.md §P1.4 · R-02 · spec.md §Edge Cases | 2 |
| TASK-P1-REPORT | Phase 1 | **SP-1 HARD BLOCK**. Reportar formato plan.md §P1.10: outputs A/B/C/D/D-ext + callsites + decisión shared/per-patient + conteo final 4 o 5 + checks T1-T5. Esperar 🟢 GO explícito antes de Phase 2. | — | TASK-P1-A · -B · -C · -D · -D-EXT · -GREP · -DECISION | plan.md §P1.10 | 1 |

**SP-1 Stop Point**: hard block. T1-T5 PASS + decisión documentada → Phase 2.

---

## Phase 2 — Migration Escrita NO Aplicada (~15 min, pre-SP-2)

**Archivo único**: `supabase/migrations/20260420000005_apply_policies_goals_development_areas.sql` (nuevo, ≈180-200 líneas estimadas)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P2-HEADER | Phase 2 | Write líneas ~1-20: comment block con spec 015 title, referencias (spec 012 Template 3 + spec 014 patrón canónico + Constitution §II), fecha 2026-04-20, resumen 4 o 5 policies según decisión Phase 1, ajustes schema (`dentist_id`/`is_active`/`profile_id` de spec 014). Explicitar variante elegida (per-patient o shared). | `supabase/migrations/20260420000005_*.sql:1-20` | SP-1 🟢 | plan.md §P2.1 item 1 · spec 014 migration header | 2 |
| TASK-P2-PRECHECK | Phase 2 | Write líneas ~21-55: `DO $$ BEGIN ... END $$;` con assertions (a) rowsecurity=true ambas tablas RAISE EXCEPTION si false, (b) policy_count=0 ambas RAISE EXCEPTION si >0 (state drift PATTERNS.md §7). RAISE NOTICE con estado capturado. | `supabase/migrations/20260420000005_*.sql:21-55` | TASK-P2-HEADER | plan.md §P2.1 item 2 · PATTERNS.md §7 · spec 014 DO $$ pattern | 3 |
| TASK-P2-GOALS | Phase 2 | Write líneas ~56-110: 3 policies sobre `patient_goals`. (1) `DROP + CREATE "Therapists manage own patient goals" FOR ALL` via `EXISTS patient_care_team WHERE dentist_id=auth.uid() AND patient_id=patient_goals.patient_id AND is_active=true` USING + WITH CHECK. (2) `"Patients read own goals" FOR SELECT` via `EXISTS patients WHERE id=patient_goals.patient_id AND profile_id=auth.uid()`. (3) `"Admins manage patient_goals" FOR ALL` is_admin pattern. Todas con DROP IF EXISTS prefix. | `supabase/migrations/20260420000005_*.sql:56-110` | TASK-P2-PRECHECK | plan.md §P2.1 item 3 · spec 014 Therapists pattern | 4 |
| TASK-P2-DEV-AREAS | Phase 2 | Write líneas ~111-150 (variante según Phase 1): **Si per-patient** (Decisión A): (a) `"Therapists manage own patient development areas" FOR ALL` via care_team (mismo patrón que goals, usando `patient_development_areas.patient_id`). (b) `"Admins manage patient_development_areas" FOR ALL` is_admin. **Si shared catalog** (Decisión B): (a) `"Everyone read patient_development_areas" FOR SELECT USING (true)`. (b) `"Admins manage patient_development_areas" FOR ALL` is_admin. Total 2 policies ambas variantes. | `supabase/migrations/20260420000005_*.sql:111-150` | TASK-P2-GOALS · TASK-P1-DECISION | plan.md §P2.1 item 4 · R-02 | 3 |
| TASK-P2-POSTCHECK | Phase 2 | Write líneas ~151-200: (a) post-check `DO $$` con assertions `policy_count patient_goals = 3` + `policy_count patient_development_areas = 2` + `total = [4 o 5]` (según Phase 1) + rowsecurity=true preservado ambas. RAISE NOTICE con breakdown. (b) Rollback block comentado `/* ... */` con 4 o 5 DROP POLICY IF EXISTS (adaptado a variante elegida). Cerrar con comentario "Spec 015 END — GROUP B closed 3/3". | `supabase/migrations/20260420000005_*.sql:151-200` | TASK-P2-DEV-AREAS | plan.md §P2.1 items 5-6 · spec.md §Rollback Plan | 2 |
| TASK-P2-REPORT | Phase 2 | **SP-2 HARD BLOCK** (advisor review SQL). Reportar formato plan.md §P2.3: path, líneas, 4 o 5 pares DROP+CREATE, 2 DO $$, variante elegida, checks T6-T11. **Pegar contenido completo** para review por Danissa ANTES de apply. Esperar 🟢 GO explícito. | — | TASK-P2-HEADER · -PRECHECK · -GOALS · -DEV-AREAS · -POSTCHECK | plan.md §P2.3 | 1 |

**SP-2 Stop Point**: hard block. Danissa valida predicates + variante → 🟢 GO Phase 3.

---

## Phase 3 — Apply + Verify 4 Partes (~20 min, pre-SP-3)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P3-PART1 | Phase 3 | Parte 1 pre-check read-only. Danissa re-ejecuta Query A + B justo antes de apply. Detecta drift Phase 1 → apply window. Expected: idéntico a Phase 1. | `pg_tables` + `pg_policies` (read-only) | SP-2 🟢 | plan.md §P3.1 | 2 |
| TASK-P3-PART2 | Phase 3 | Parte 2 apply goals policies (parte del bloque atómico). Conceptualmente esta parte aplica las 3 policies de `patient_goals`. Operativamente el archivo completo se ejecuta como 1 bloque en SQL Editor — post-check discrimina conteos por tabla para trazabilidad. Danissa pega migration 20260420000005. | Danissa ejecuta `supabase/migrations/20260420000005_*.sql` SQL Editor | TASK-P3-PART1 | plan.md §P3.2 | 3 |
| TASK-P3-PART3 | Phase 3 | Parte 3 apply dev_areas policies (conceptual — parte del mismo bloque atómico de PART2). Las 1-2 policies de `patient_development_areas` se aplican en el mismo statement-set. RAISE NOTICE del post-check confirma conteo por tabla. | Danissa (dentro del mismo apply bloque de PART2) | TASK-P3-PART2 | plan.md §P3.2-P3.3 | 2 |
| TASK-P3-PART4 | Phase 3 | Parte 4 post-check consolidado + smoke opcional. (a) Re-ejecutar Query D post-apply para listar 4-5 policies creadas con nombres canónicos. (b) Re-verificar rowsecurity=true ambas tablas. (c) **Smoke opcional 4a**: invocar 1 edge function (p.ej. `suggest-treatment`) para confirmar service_role bypass intacto (R-03). (d) **Smoke recomendado 4b**: SQL INSERT 1 patient_development_area + 1 patient_goal, SELECT con FK embed como Cristóbal (en care_team), verificar `area.name` populated. Cleanup. | Danissa SQL Editor + opcional invoke edge function | TASK-P3-PART3 | plan.md §P3.3-P3.4 · spec.md SC-005 · R-02 · R-03 | 10 |
| TASK-P3-REPORT | Phase 3 | **SP-3**. Reportar formato plan.md §P3.5: Parts 1-4 resultados, checks T12-T16, regresiones detectadas, evaluación vs 3 rollback triggers del spec.md §Rollback Plan. **Decisión explícita**: close / rollback / follow-up. Si rollback → ejecutar batch del spec.md §Rollback Plan (adaptado a variante). | — | TASK-P3-PART4 | plan.md §P3.5 · spec.md §Rollback Plan | 3 |

**SP-3 Stop Point**: decisión explícita del usuario antes de TASK-FINAL.

---

## Post-SP-3 — Close (~8 min, solo si SP-3 = close)

| ID | Phase | Task | File:Line ó Action | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-FINAL-COMMIT | Close | `git add supabase/migrations/20260420000005_apply_policies_goals_development_areas.sql specs/015-apply-policies-goals/data-model.md` + commit `feat(rls): apply policies patient_goals + patient_development_areas (spec 015)` describiendo 4-5 policies creadas, variante elegida (per-patient/shared), Phase 1 Query D findings, Phase 3 verification outcome. **1 commit único**. | `supabase/migrations/20260420000005_*.sql` + `specs/015-*/data-model.md` | SP-3 🟢 close | Constitution §IV | 2 |
| TASK-FINAL-ARCH | Close | Update `.specify/memory/architecture.md §RLS enabled zero-policies audit` (líneas ~327-359) marcando `patient_goals` + `patient_development_areas` como ✅ resueltos en spec 015. **Preservar tabla histórica GROUP A/B/C/D intacta**. Actualizar GROUP B a "3/3 resueltos post-spec 015" (vs "2/3 resueltos spec 014 + 1 pendiente"). Actualizar Follow-up specs marcando Template 3 como ejecutado. Bump "Last updated" footer con referencia spec 015 + indicar closure completo de GROUP B. | `.specify/memory/architecture.md:~327-380` | TASK-FINAL-COMMIT | plan.md §References · architecture.md existing GROUP B tabla | 3 |
| TASK-FINAL-COMMIT-ARCH | Close | `git add .specify/memory/architecture.md` + commit separado `docs: architecture.md — GROUP B 3/3 resueltos via spec 015 (RLS zero-policies audit closed)`. Separado del fix commit para mantener quirúrgicamente enfocado el código. | `.specify/memory/architecture.md` | TASK-FINAL-ARCH | Constitution §IV · convención specs 013/014 | 1 |
| TASK-FINAL-MERGE | Close | `git checkout main && git merge --no-ff 015-apply-policies-goals -m "merge: spec 015 apply policies goals + development_areas"`. **NO push — Danissa lo hace post-review**. | — | TASK-FINAL-COMMIT-ARCH | Constitution §Development Workflow | 2 |

---

## Summary

| Phase | Tasks | Est min | Gate |
|---|---|---|---|
| Phase 1 (audit + decision) | 8 | 15 | SP-1 T1-T5 (hard block) |
| Phase 2 (migration write) | 6 | 15 | SP-2 T6-T11 (hard block — review SQL) |
| Phase 3 (apply + verify) | 5 | 20 | SP-3 T12-T16 |
| Close | 4 | 8 | — |
| **Total** | **23** | **58 min** | 4 gates |

Dentro bound 45-60 min del spec (buffer 10 min plan.md §Time Budget = 68 min superior absoluto antes de STOP).

---

## Dependencies graph

```text
SP-0 🟢
 ↓
┌─ TASK-P1-A (rowsecurity) ──┐
├─ TASK-P1-B (policy_count) ─┤
├─ TASK-P1-C (row_count) ────┼→ TASK-P1-D → TASK-P1-D-EXT → TASK-P1-DECISION → TASK-P1-REPORT (SP-1) →
├─ TASK-P1-GREP (callsites) ─┘                                                                         │
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────┘
 ↓ 🟢 GO
TASK-P2-HEADER → -PRECHECK → -GOALS → -DEV-AREAS → -POSTCHECK → -REPORT (SP-2 hard block) →
                                                                                            │
 ┌──────────────────────────────────────────────────────────────────────────────────────────┘
 ↓ 🟢 GO advisor
TASK-P3-PART1 → TASK-P3-PART2 → TASK-P3-PART3 → TASK-P3-PART4 → TASK-P3-REPORT (SP-3) →
                                                                                       │ si close
 ┌─────────────────────────────────────────────────────────────────────────────────────┘
 ↓
TASK-FINAL-COMMIT → TASK-FINAL-ARCH → TASK-FINAL-COMMIT-ARCH → TASK-FINAL-MERGE
```

---

## Notes

- **Scope tight**: FR-008 = 1 archivo nuevo exclusivamente (`20260420000005_*.sql`). TASK-P2-* escriben incrementalmente ese único archivo.
- **MCP execute_sql denegado**: todas las Query A/B/C/D + Parts 1/4 van por Danissa en Supabase SQL Editor.
- **Paralelización Phase 1**: TASK-P1-A/B/C/D/GREP son independientes — Danissa ejecuta 4 queries en un solo round-trip; ejecutor hace GREP en paralelo. TASK-P1-D-EXT depende de D (schema para interpretar FK). TASK-P1-DECISION depende de D + D-EXT.
- **Phase 3 Parts 2 y 3 son conceptuales**: operativamente el archivo migration se aplica como 1 bloque atómico. La separación es para trazabilidad en el reporte final (post-check discrimina conteos por tabla).
- **TASK-FINAL-ARCH marca closure de GROUP B**: post-spec 015, GROUP B = 3/3 resueltos. architecture.md debe reflejar que el "RLS enabled zero-policies audit" está **completado** para GROUP B (quedan 19 GROUP C dormant intencionales).
- **2 commits en close** (fix + arch) por higiene, patrón spec 014.
- **Ejecutor NO aplica migration ni pushea main**: TASK-P3-PART2/3 lo ejecuta Danissa. TASK-FINAL-MERGE es local; Danissa pushea post-review.
- **Bundle atómico justificado en Complexity Tracking** del plan: 1 migration para 2 tablas porque FK embed requiere policies coordinadas — separar crearía ventana de inconsistencia.
