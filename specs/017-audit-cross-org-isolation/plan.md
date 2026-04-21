# Implementation Plan: Audit Cross-Org Query Isolation

**Branch**: `017-audit-cross-org-isolation` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-audit-cross-org-isolation/spec.md`

## Summary

Discovery pure: auditar si existe leak cross-org real (hallazgo lateral spec 013). **0 código editado, 0 migration escrita**. Phase 1 (15 min) grep exhaustivo + matriz clasificatoria de callsites. Phase 2 (15 min) ≥3 queries empíricas vía Danissa SQL Editor confirmando empíricamente si Cristóbal (multi-org) tiene data en ≥2 `organization_id`s y si el frontend ve cross-org. Phase 3 (10 min) veredicto binario + docs. Total **45 min** bound. Constitution §II driver (si confirmado, el leak es violación), §IV bound (discovery, fix = spec separado).

## Technical Context

**Language/Version**: N/A (discovery pure — no code). Análisis sobre JS/JSX existente.
**Primary Dependencies**: Grep tool (local), Supabase SQL Editor (Danissa), `pg_policies`/`information_schema.columns` (catalog).
**Storage**: N/A — no se crean/modifican tablas.
**Testing**: empírico vía SQL. MCP execute_sql denegado — queries via copy-paste a Danissa.
**Target Platform**: dev machine (grep + análisis) + Supabase SQL Editor (Danissa queries).
**Project Type**: audit documental puro.
**Performance Goals**: Phase 1 + 2 + 3 ≤45 min wall-clock. Bound superior 60 min antes de STOP.
**Constraints**:
- **FR-007**: 0 edits a `src/**`.
- **FR-008**: 0 migration files creados.
- **FR-009**: análisis excluye admin callsites + service_role edge functions + hook wrappers sin query directa.
- **FR-010**: Phase 2 via Danissa SQL Editor (MCP denegado).
**Scale/Scope**: ~10-30 callsites estimados (basado en spec 013 hallazgo de 12 consumers `useCurrentOrganization` + posibles greps adicionales a tablas con `organization_id`).

## Constitution Check

*GATE: Must pass before Phase 0. Re-check post-Phase 2 (pre-verdict).*

| Principio | Aplica | Estado | Nota |
|---|---|---|---|
| **I. Compliance-First** | Indirecto | ✅ PASS | Si leak confirmado, afecta aislamiento de data clínica (Ley 20.584) + data minimization (Ley 21.719). Audit detecta, fix aplica. |
| **II. RLS-First Security** | Sí (driver) | ✅ PASS | Driver principal. Hipótesis (a) violaría §II si queries solo filtran por `therapist_id` sin RLS cerrando. Hipótesis (b) depende del fallback. Phase 1 + 2 deciden. |
| **III. Append-Only Audit** | No | ✅ N/A | No toca audit logger (sería hallazgo lateral adicional, no scope). |
| **IV. Micro-Bloques** | Sí (driver secundario) | ✅ PASS | Discovery pure — 0 fix aplicado. Si CONFIRMADO, fix es spec separado (scope preparado en `§Follow-up spec scope`). |
| **V. UI Honesty** | Sí | ✅ PASS | Si leak confirmado + dropdown vacío muestra data → engaña al user sobre qué está viendo. Spec incluye este ángulo en US1. |
| **VI. Schema Drift Zero** | No | ✅ N/A | No referencia predicates en policies nuevas. |

**Resultado**: sin violaciones. Audit es el mecanismo Constitution-compliant para detectar violaciones §II/§V.

## Project Structure

### Documentation (this feature)

```text
specs/017-audit-cross-org-isolation/
├── spec.md                          # /speckit-specify (commit 671e95d)
├── plan.md                          # este archivo
├── data-model.md                    # Phase 1 matriz + Phase 2 empirical + Phase 3 verdict
├── checklists/
│   └── requirements.md              # 12/12 PASS
└── tasks.md                         # /speckit-tasks (próxima fase)
```

### Source Code (repository root)

**0 archivos autorizados a editar**. Discovery pure.

**Archivos tocados por este spec**:
- `specs/017-audit-cross-org-isolation/*` (spec/plan/tasks/data-model/checklists)
- `.specify/memory/architecture.md` (post-close TASK-FINAL-ARCH — agrega subsección `§"Cross-org isolation audit (2026-04-20)"`)

**Archivos NO autorizados** (FR-007/008):
- Cualquier archivo bajo `src/**`.
- Cualquier `.sql` en `supabase/migrations/`.
- `supabase/functions/**`.

**Structure Decision**: audit documental. Toda la evidencia vive en `data-model.md`. `architecture.md` se actualiza en close para consolidar findings. Sin migration file ni code edits.

---

## Phase 0 — Risk Register

### R-01. RLS policies de Supabase ya filtran por `organization_id` → frontend no necesita filter explícito, no hay bug

**Síntoma potencial**: Phase 1 grep revela que callsites NO filtran por `organization_id` en código frontend. Sin embargo, las policies RLS sobre las tablas (`patients`, `appointments`, etc.) podrían tener subqueries que limitan rows visibles a la org actual del user (ej. via `patient_care_team` o `organization_members`). En ese caso, defense-in-depth RLS cierra el gap aunque el código no filtre.

**Impacto**: si R-01 se confirma → **LEAK DESCARTADO** por defense-in-depth. No bug. Doc en architecture.md como "known non-bug con explicación".

**Mitigación**: Phase 1 MUST revisar policies RLS existentes para cada tabla candidata + Phase 2 empírica confirma el comportamiento runtime (simular Cristóbal vía `SET request.jwt.claim.sub` + ver cuántas rows retorna el SELECT).

**Probabilidad**: **alta**. DentalSpot usa patrón canónico `patient_care_team.dentist_id = auth.uid()` en policies (specs 014/015/016 validaron). Ese predicate NO filtra por `organization_id` explícitamente — filtra por membership del care_team. Si un therapeuta está en care_team de pacientes de 2 orgs, ve pacientes de ambas orgs. **Esto podría ser diseño intencional** (therapist multi-org ve sus pacientes agregados) o bug (user espera isolation per org seleccionada).

### R-02. Wrapper function abstrae el filter (hook patientsApi auto-inyecta org filter)

**Síntoma potencial**: el grep en callsite directo (`supabase.from('patients').select(...)`) muestra 0 filter por `organization_id`. Pero el callsite no es directo — es vía wrapper (`patientsApi.fetchPatients()`). El wrapper internamente inyecta `.eq('organization_id', currentOrgId)` usando un parámetro o contexto implícito. Grep superficial miss este tipo.

**Impacto**: false positive en matriz Phase 1 — callsite marcado "leak potencial" pero en realidad el wrapper filtra correctamente.

**Mitigación**: Phase 1 Task P1.3 hace grep **profundo** tracing data flow — para cada callsite que NO filtra directo, leer la definición del wrapper/hook y verificar si inyecta el filter río abajo. Clasificar como "unclear" si el trace es complejo, resolver vía Phase 2 empírica.

**Probabilidad**: media. DentalSpot tiene algunos wrappers (`patientApi.js`, `useInvoices`, etc.) — necesitamos tracear cada uno.

### R-03. Queries parametrizadas en service layer vs llamadas directas — grep puede miss

**Síntoma potencial**: queries construidas dinámicamente con nombres de tabla variables (`supabase.from(tableName).select(...)` donde `tableName` es argumento) no aparecen en grep por tabla específica.

**Impacto**: coverage incompleto (<95% SC-001 en riesgo).

**Mitigación**: Phase 1 también grep por el patrón `supabase.from(` genérico para identificar queries parametrizadas. Revisar manual cada caso. Alternativamente, grep por `.eq('organization_id'` detecta lugares donde SÍ se filtra — el complemento es sospechoso.

**Probabilidad**: baja. DentalSpot mayoritariamente usa queries con nombres de tabla hardcoded. Pocos lugares parametrizan.

### R-04 (menor). Phase 2 queries empíricas retornan empty data (Cristóbal sin pacientes reales multi-org)

**Síntoma**: Query β retorna `DISTINCT organization_id = 1` para Cristóbal en `patients` — todos sus pacientes son de una sola org → hipótesis (c) coincidencia.

**Mitigación**: intentar con otro user multi-org si existe. O crear manual un paciente de test en la otra org para verificar. O asumir coincidencia y clasificar como "Low-risk, inconclusive" con recomendación de re-auditar cuando más users multi-org se creen.

**Probabilidad**: media-alta. Hipótesis (c) es legítimamente posible.

### R-05 (menor). Leak confirmado pero scope fix más grande de lo esperado

**Síntoma**: Phase 1 matriz revela ≥10 callsites con leak potential + policies RLS necesitan rewrite para ≥3 tablas. Scope follow-up crece de "S" (1 spec) a "M/L" (2-3 specs).

**Mitigación**: `§Follow-up spec scope` sugiere división explícita (ej. "split en 2 specs: P0 patients + P1 appointments"). Constitution §IV micro-bloques se respeta via múltiples specs pequeñas en vez de 1 mega-spec.

**Probabilidad**: baja-media. Depende del patrón — si la mayoría de callsites usan mismo wrapper, el fix es centralizado en 1 archivo.

---

## Phase 1 — Audit Estático (~15 min, STOP POINT SP-1)

**Objetivo**: grep exhaustivo + matriz clasificatoria de callsites. Cero SQL ni code edits.

### P1.1 — Grep `useCurrentOrganization` consumers

Ejecutor via Grep tool:

```bash
grep -rn "useCurrentOrganization\|useOrganization" src/ --include="*.js" --include="*.jsx"
```

**Expected**: 12+ callsites (conocidos de spec 013).

**Para cada callsite**: capturar archivo+línea + contexto (10 líneas alrededor) para entender cómo se usa `currentOrganizationId`.

### P1.2 — Grep tablas con `organization_id` column

Lista de tablas candidatas (per architecture.md + schema exploration):
- `patients`
- `appointments`
- `billing_invoices`
- `clinical_invoices` (si existe)
- `patient_care_team` (columna diferente — `patient_id` no `organization_id`, excluir si no aplica)
- `therapist_services`
- `clinic_therapists` (si existe)
- `organization_members`

Ejecutor:
```bash
grep -rn "\.from('patients')\|\.from('appointments')\|\.from('billing_invoices')\|\.from('therapist_services')" src/ --include="*.js" --include="*.jsx"
```

**Para cada callsite**: capturar archivo+línea + la cadena completa del `.select(...).eq(...).etc` subsiguiente.

### P1.3 — Clasificación en matriz

Para cada callsite (P1.1 ∪ P1.2), clasificar:

| Campo | Valores |
|---|---|
| `file:line` | ej. `src/lib/patientApi.js:100` |
| `table` | tabla consultada |
| `filter_used` | `.eq('organization_id', X)` / `.eq('therapist_id', Y)` / combinado / ninguno |
| `null_handling` | qué pasa si `currentOrgId === null`: early return / undefined passed / fallback / crash |
| `wrapper_type` | direct query / hook wrapper / API service layer / ninguno |
| `admin_excluded` | sí/no (FR-009 excluye admin callsites) |
| `service_role` | sí/no (FR-009 excluye edge functions service_role) |
| `verdict` | `cross-org safe` / `leak potencial` / `unclear — Phase 2` / `N/A (excluido por FR-009)` |

Documentar matriz en `data-model.md §Callsite matrix` (formato tabla markdown, NO CSV para legibilidad).

### P1.4 — Revisión policies RLS existentes (R-01 mitigation)

Para las tablas candidatas, leer `supabase/policies.sql` (si existe consolidado) o grep migrations:

```bash
grep -rn "ON public.patients\|ON public.appointments" supabase/migrations/
```

**Para cada tabla con RLS**: documentar en `data-model.md §RLS policies review` si las policies filtran por `organization_id` explícitamente o via `patient_care_team.dentist_id` (que NO es filter por org).

Este output alimenta directamente R-01 evaluation.

### P1.5 — Salida preliminar Phase 1

`data-model.md` al cierre Phase 1:
- `§Callsite matrix` — tabla completa.
- `§RLS policies review` — snapshot políticas relevantes.
- `§Phase 1 preliminary verdict` — hipótesis fuerte pre-empirical: ¿apunta a (a), (b), (c)? ¿Cuántos callsites "unclear" necesitan Phase 2?

### P1.6 — **STOP POINT SP-1**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T1** | Grep consumers completado | ≥12 callsites `useCurrentOrganization` en matriz | Si <12 → grep missed; expandir patrón |
| **T2** | Grep tablas completado | ≥8 tablas candidatas con callsites documented | Si <8 → tablas missed; revisar schema via architecture.md |
| **T3** | Matriz clasificación exhaustiva | 100% callsites tienen verdict (no blanks) | Si blanks → completar |
| **T4** | Policies RLS review | snapshot políticas principales documentado | Si missing → grep adicional |
| **T5** | Phase 1 preliminary verdict | Hipótesis (a)/(b)/(c) preferida + N callsites "unclear" para Phase 2 | Sin hipótesis preliminar → re-leer matriz |

**Reporte a Danissa** (bloquea Phase 2):

```markdown
## Phase 1 Report — spec 017

- Callsites useCurrentOrganization: [N]
- Callsites tablas con organization_id: [N]
- Matriz verdict distribution:
  * cross-org safe: [N]
  * leak potencial: [N]
  * unclear — Phase 2: [N]
  * N/A excluido: [N]
- Policies RLS: [snapshot]
- Preliminary hypothesis: (a) leak real / (b) fallback roto / (c) coincidencia / (defense-in-depth RLS)
- Queries empíricas propuestas para Phase 2: [lista]
- Checks: T1 ✅ · T2 ✅ · T3 ✅ · T4 ✅ · T5 ✅

🟢 GO / 🔴 STOP
```

---

## Phase 2 — Empirical Verification (~15 min, STOP POINT SP-2)

**Prerequisito**: SP-1 🟢 GO con matriz completa.

### P2.1 — Query α: listar tablas con `organization_id` column

Ejecutor provee SQL; Danissa ejecuta y pega:

```sql
SELECT table_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'organization_id'
ORDER BY table_name;
```

**Propósito**: confirmar exhaustivamente qué tablas tienen `organization_id` (sanity check que Phase 1 cubrió todo).

### P2.2 — Query β: distribución de `organization_id` para Cristóbal

Para cada tabla candidata identificada en Query α (top 3-5 con más callsites):

```sql
SELECT 'patients' AS tbl, organization_id, COUNT(*)
FROM patients WHERE therapist_id = '4e55fb74-b3b5-4233-9b5d-88d7a01a9046'
GROUP BY organization_id;

-- Repetir para appointments, billing_invoices, patient_care_team, etc.
```

**Propósito**: saber si Cristóbal efectivamente tiene data en ≥2 orgs (si solo tiene en 1, hipótesis c confirmada por coincidencia).

### P2.3 — Query γ: simular Cristóbal autenticado con org específica

Si Query β revela Cristóbal con data en ≥2 orgs:

```sql
-- Simular sesión de Cristóbal
SET LOCAL request.jwt.claim.sub = '4e55fb74-b3b5-4233-9b5d-88d7a01a9046';

-- Lectura como Cristóbal (RLS aplicado)
SELECT DISTINCT organization_id, COUNT(*) FROM patients GROUP BY organization_id;

-- Reset
RESET request.jwt.claim.sub;
```

**Expected post-spec 014/015/016**: si RLS policies usan `patient_care_team.dentist_id`, Cristóbal ve **todos** sus pacientes across orgs (no hay filter por org). Si hay policy que filtra por org → ve solo la "org activa" (pero no hay mecanismo server-side de "org activa" — eso es frontend state, no JWT claim). **La asimetría es diagnóstica**: RLS no sabe qué org seleccionó el user en el UI.

### P2.4 — Interpretación

Tres scenarios post-Phase 2:

1. **Cristóbal data en 1 org sola** (Query β retorna 1 DISTINCT) → hipótesis (c) confirmada: coincidencia. **LEAK DESCARTADO**.
2. **Cristóbal data en ≥2 orgs + RLS no filtra por org** + frontend no filtra por `organization_id` → user ve data de ambas orgs. **LEAK depende del diseño intencional**:
   - Si diseño pretendía "therapist ve todos sus pacientes" → **NO bug, documentar como diseño**.
   - Si diseño pretendía "therapist ve solo pacientes de org seleccionada" → **LEAK CONFIRMADO**.
3. **Cristóbal data en ≥2 orgs + frontend filtra por `organization_id`** → user ve solo org actual, no leak. Pero el hallazgo spec 013 (4 pacientes con null) sigue inexplicado → revisar null-handling en wrapper.

### P2.5 — Output Phase 2

`data-model.md §Empirical verification`:
- Query α output.
- Query β outputs por tabla.
- Query γ output (si ejecutada).
- Interpretación: scenario 1/2a/2b/3.

### P2.6 — **STOP POINT SP-2**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T6** | ≥3 queries empíricas ejecutadas | α + β + (γ opcional si β lo amerita) | Si <3 → completar |
| **T7** | Interpretación clara | scenario 1/2a/2b/3 asignado | Si ambiguo → re-ejecutar con más datos |
| **T8** | Matriz Phase 1 re-evaluada post-empirical | callsites "unclear" resueltos | Si quedan unclear → documentar como "Low-risk, no urgent" |

---

## Phase 3 — Verdict + Follow-up Docs (~10 min, STOP POINT SP-3)

**Prerequisito**: SP-2 🟢 GO con interpretación.

### P3.1 — Veredicto binario

Basado en Phase 1 + 2, elegir:

| Scenario Phase 2 | Verdict |
|---|---|
| 1 (Cristóbal 1-org) | **LEAK DESCARTADO — hipótesis (c) coincidencia** |
| 2a (2-org, diseño intencional) | **LEAK DESCARTADO — diseño intencional multi-org therapist** |
| 2b (2-org, diseño era 1-org) | **LEAK CONFIRMADO** |
| 3 (frontend sí filtra, null fue caso edge) | **LEAK PARCIAL** — null-handling bug (ya fixeado en spec 013) |

Documentar en `data-model.md §Verdict` con rationale.

### P3.2 — Si LEAK CONFIRMADO: preparar `§Follow-up spec scope`

```markdown
## Follow-up spec scope: fix-cross-org-query-isolation (P0)

- Files to edit: [lista callsites con línea]
- Tables affected: [lista]
- Missing filter: `.eq('organization_id', currentOrgId)` o RLS policy ajustada
- Recommended approach: RLS policy tightening (preferido §II) vs frontend filter
- Estimated size: S / M / L (según N archivos/tablas)
- Split suggestion si L: dividir en 2-3 specs per tabla o wrapper
```

### P3.3 — Update `architecture.md §"Cross-org isolation audit (2026-04-20)"`

Agregar subsección nueva al final de la sección RLS (post cierre audit 2026-04-20):

```markdown
### Cross-org isolation audit (2026-04-20, spec 017)

**Origen**: hallazgo lateral spec 013 Phase 1 Playwright baseline —
Cristóbal (multi-org) con currentOrgId=null vio 4 pacientes en /patients.

**Metodología**: grep N callsites + ≥3 queries SQL empíricas como Cristóbal.

**Findings**:
- N callsites auditados (matriz en spec 017 data-model.md)
- RLS policies review: [patrón patient_care_team filter via dentist_id + is_active, NO filter por organization_id]
- Empirical verification: [scenario elegido]

**Verdict**: [LEAK CONFIRMADO / LEAK DESCARTADO / LEAK PARCIAL]

**Action**:
- Si CONFIRMADO: follow-up spec fix-cross-org-query-isolation (P0).
- Si DESCARTADO: documentado como "known non-bug by design" o "coincidencia resuelta".
```

### P3.4 — **STOP POINT SP-3**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T9** | Veredicto binario emitido | 1 de 3 valores (CONFIRMADO/DESCARTADO/PARCIAL) con rationale | Si ambiguo → re-evaluar Phase 2 |
| **T10** | Si CONFIRMADO: scope follow-up preparado | `§Follow-up spec scope` copy-paste ready | Si missing → completar |
| **T11** | architecture.md update ready | Subsección `§"Cross-org isolation audit"` escrita | Si missing → escribir |

**Reporte final a Danissa**:

```markdown
## Phase 3 Report — spec 017

- Verdict: [CONFIRMADO / DESCARTADO / PARCIAL]
- Rationale: [1-2 sentences]
- Follow-up spec: [preparado / N/A descartado]
- architecture.md update: [ready]
- Decisión: close / abrir follow-up / abrir follow-up con split

🟢 CLOSE / 🔴 RE-EVALUATE
```

---

## Stop Points resumen

| # | Ubicación | Criterio | Acción |
|---|---|---|---|
| **SP-0** | Pre-Phase 1 | tasks.md aprobado 6/6 | 🟢 GO Danissa |
| **SP-1** | Fin Phase 1 | T1-T5 PASS + matriz + preliminary hypothesis | 🟢 GO → Phase 2 |
| **SP-2** | Fin Phase 2 | T6-T8 PASS + interpretación scenario | 🟢 GO → Phase 3 |
| **SP-3** | Fin Phase 3 | T9-T11 PASS + verdict + docs | Decisión close / follow-up / re-evaluate |

---

## Time Budget

| Phase | Tiempo | Contenido |
|---|---|---|
| Phase 1 — Audit estático | **15 min** | 2 greps + matriz + RLS review + preliminary verdict + SP-1 |
| Phase 2 — Empirical | **15 min** | Queries α/β/γ + interpretación + SP-2 |
| Phase 3 — Verdict + docs | **10 min** | Verdict + (condicional) follow-up scope + architecture.md + SP-3 |
| Buffer | **5 min** | Si R-01/R-02/R-03/R-04 |
| **Total** | **45 min** | Dentro bound 30-45 spec (bound superior 60 antes de STOP) |

---

## References

- `specs/013-ux-persistent-org-context/data-model.md §P1.4 Baseline Playwright` — origen del hallazgo (Cristóbal 4 pacientes con currentOrgId=null).
- `.specify/memory/architecture.md §RLS coverage audit` — contexto RLS policies existentes.
- `specs/014-apply-policies-billing-evaluations/` + `specs/015-apply-policies-goals/` — patrones de RLS policies via `patient_care_team.dentist_id`.
- `.specify/memory/constitution.md §II` (RLS-First Security) — driver principal.
- `.specify/memory/constitution.md §IV` (Micro-Bloques) — fix = spec separado si confirmado.
- `.specify/memory/constitution.md §V` (UI Honesty) — dropdown vacío con data visible sería violación §V si confirmado.
- `docs/PATTERNS.md §4` (audit defensivo) — metodología.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | Sin violaciones. Discovery pure — el spec más conservador posible: 0 code edits, 0 migration, scope acotado a auditoría. Si leak confirmado, fix es spec propio (§IV). Si descartado, cierre documentado sin ruido. |
