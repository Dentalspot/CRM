# Implementation Plan: Audit therapist_id vs care_team Drift

**Branch**: `018-audit-therapist-careteam-drift` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-audit-therapist-careteam-drift/spec.md`

## Summary

Discovery pure: cuantificar globalmente el drift `patients.therapist_id` vs `patient_care_team` detectado en spec 017 (1 paciente edge de Cristóbal). **0 código editado, 0 migration**. Phase 1 (15 min) 4 queries Danissa SQL Editor (α count global + β per-therapist + γ per-org + δ categorización en 5 hipótesis). Phase 2 (10 min) asigna severidad ternaria (BAJA/MEDIA/ALTA) + hipótesis dominante. Phase 3 (10 min) veredicto + (condicional) follow-up fix scope + update `architecture.md`. Total **45 min**. Réplica del patrón spec 017 con enforcement discovery pure vía `git diff` check. Constitution §II context, §IV bound.

## Technical Context

**Language/Version**: N/A (discovery pure — no code). Análisis SQL + docs.
**Primary Dependencies**: Supabase SQL Editor (Danissa), `patients` + `patient_care_team` tables (catalog queries).
**Storage**: N/A — no se crean/modifican tablas.
**Testing**: empírico via 4 queries SQL. MCP execute_sql denegado — queries via copy-paste.
**Target Platform**: dev machine (análisis + docs) + Supabase SQL Editor (Danissa queries).
**Project Type**: audit documental puro, réplica patrón spec 017.
**Performance Goals**: Phase 1 + 2 + 3 ≤45 min. Bound superior 60 min antes de STOP.
**Constraints**:
- **FR-007**: 0 edits a `src/**` o `supabase/**`.
- **FR-005**: follow-up fix scope preparado solo si severidad MEDIA/ALTA.
- Deploy via Danissa SQL Editor (MCP denegado).
**Scale/Scope**: 4 queries SQL + matriz 5 hipótesis + severidad ternaria + condicional follow-up template.

## Constitution Check

*GATE: Must pass before Phase 0. Re-check post-Phase 2.*

| Principio | Aplica | Estado | Nota |
|---|---|---|---|
| **I. Compliance-First** | Indirecto | ✅ PASS | Si severidad ALTA → follow-up spec fix puede tener implicaciones compliance (paciente "fantasma" con therapist declared pero invisible → confusion UX, potencial issue Ley 20.584 art. 12 acceso a info clínica). Audit detecta, fix aplica. |
| **II. RLS-First Security** | Indirecto | ✅ PASS | RLS está funcionando correctamente (filtra por care_team). El drift es cosmético/legacy — no es bug de seguridad. |
| **III. Append-Only Audit** | No | ✅ N/A | No toca audit logger. |
| **IV. Micro-Bloques** | Sí (driver secundario) | ✅ PASS | Discovery pure — 0 fix aplicado. Si MEDIA/ALTA, fix es spec separado. |
| **V. UI Honesty** | Sí (potencial violación) | ✅ PASS | Paciente con `therapist_id` pero invisible en UI → user engañado (mismo dentist "tiene" paciente pero no lo ve). Audit cuantifica alcance de la violación §V. |
| **VI. Schema Drift Zero** | No | ✅ N/A | No referencia columnas en policies nuevas. |

**Resultado**: sin violaciones. Audit es mecanismo Constitution-compliant para detectar violación §V latente.

## Project Structure

### Documentation (this feature)

```text
specs/018-audit-therapist-careteam-drift/
├── spec.md                          # /speckit-specify (commit a17c379)
├── plan.md                          # este archivo
├── data-model.md                    # Phase 1 queries + Phase 2 categorization + Phase 3 verdict
├── checklists/
│   └── requirements.md              # 12/12 PASS
└── tasks.md                         # /speckit-tasks (próxima fase)
```

### Source Code (repository root)

**0 archivos autorizados a editar**. Discovery pure (patrón spec 017).

**Archivos tocados por este spec**:
- `specs/018-audit-therapist-careteam-drift/**` (spec/plan/tasks/data-model/checklists)
- `.specify/memory/architecture.md` (post-close — agrega subsección `§"Therapist_id vs care_team drift audit (spec 018 — 2026-04-20)"`)

**Archivos NO autorizados** (FR-007):
- Cualquier archivo bajo `src/**`.
- Cualquier `.sql` en `supabase/migrations/`.
- `supabase/functions/**`.

**Structure Decision**: réplica directa del patrón spec 017 — audit documental + enforcement discovery pure via `git diff --name-only` gate al close.

---

## Phase 0 — Risk Register

### R-01. Spec 017 drift era transitorio — re-audit muestra 0

**Síntoma potencial**: Phase 1 Query α retorna **0** pacientes con drift hoy. El 1 paciente detectado en spec 017 ya no existe (fue limpiado manualmente, trigger corrigió post-spec 017, etc.).

**Impacto**: severidad = BAJA (o incluso NULA). Close spec como "no drift detectable — hallazgo spec 017 era transitorio". `architecture.md` documenta como "known non-bug, investigado".

**Mitigación**: Phase 1 Query α es determinística y barata — si retorna 0, es confirmación positiva. No requiere retries. Si reproduce 0 pacientes aun el spec 017 dentista/paciente específico (`4e55fb74-...`), confirma reproducción transitoria.

**Probabilidad**: baja-media. Drifts schema-level tienden a persistir salvo fix explícito.

### R-02. Hipótesis overlap dominante — no hay clear winner

**Síntoma potencial**: Phase 1 Query δ retorna distribución plana (ej. 20% en cada hipótesis a/b/c/d/e) o un bucket "unclear" mayoritario (>40%). No hay hipótesis dominante clara para guiar Option X vs Option Y del fix.

**Impacto**: `§Follow-up fix scope` tiene que recomendar **mixed-approach** (backfill + cleanup + case-by-case), lo cual es más complejo y requiere mayor scope. Aumenta el esfuerzo del follow-up spec.

**Mitigación**: Phase 1 criterio determinístico por hipótesis documentado **antes** de ejecutar Query δ (`data-model.md §Hypothesis criteria`). Si la distribución es plana, aceptar "no dominant hypothesis → mixed approach" como output válido. Priority del follow-up se eleva (scope mayor) pero sin bloqueo del audit.

**Probabilidad**: media. Es posible que el drift tenga múltiples causas simultáneas.

### R-03. Severidad ALTA descubierta → scope creep risk

**Síntoma potencial**: Phase 1 Query α retorna **>50 pacientes** con drift, o >5 pacientes creados post-spec 003 trigger (indica bug activo). Severidad = ALTA. Danissa puede querer expandir spec 018 para incluir fix inmediato — violación §IV.

**Impacto**: tentación de escape de scope. Constitution §IV explícitamente prohibe mezclar audit + fix en un solo spec.

**Mitigación**: FR-007 + TASK-FINAL-VALIDATE gate (`git diff --name-only` check) prohíben edits fuera de `specs/018-*/` + `architecture.md`. Si severidad ALTA, spec 018 **cierra con follow-up scope preparado**, NO aplica el fix. Follow-up spec P0 se abre INMEDIATAMENTE después pero en spec separado.

**Probabilidad**: baja-media. Tentación humana de escape, no falla técnica.

### R-04 (menor). Trigger de sync `patient_care_team` dispara durante audit

**Síntoma**: si hay trigger activo que mantiene care_team sincronizado con therapist_id, ejecutar queries durante activity period puede ver drift transitoria mid-commit.

**Mitigación**: queries son read-only + snapshot momento-en-tiempo. Si ves 1 resultado en Query α y 2 en re-run, documenta como "drift ±1 por trigger async". No crítico para severidad.

**Probabilidad**: muy baja. Triggers típicamente son síncronos en PostgreSQL.

### R-05 (menor). `patients.status` column tiene valores inesperados

**Síntoma**: Phase 1 excluye `status != 'active'` del scope principal (FR-008), pero si el schema tiene valores custom (`inactive`, `archived`, `deleted`, `suspended`, etc.), no queda claro cuál es "non-active".

**Mitigación**: Phase 1 ejecuta `SELECT DISTINCT status FROM patients` como pre-step para enumerar valores reales. Documenta qué valores se consideran "active" para el audit.

**Probabilidad**: baja. `status` típicamente tiene values canonical: active/inactive.

---

## Phase 1 — Quantification + Categorization (~15 min, STOP POINT SP-1)

**Objetivo**: cuantificar globalmente el drift + desglosar por dimension + particionar en 5 hipótesis. Zero SQL de escritura.

### P1.1 — Query α: COUNT global del drift

```sql
-- Spec 018 Phase 1 Query α
-- Drift = patients con therapist_id set pero sin entry activa
-- correspondiente en patient_care_team
SELECT COUNT(*) AS drift_count
FROM patients p
WHERE p.therapist_id IS NOT NULL
  AND p.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM patient_care_team pct
    WHERE pct.patient_id = p.id
      AND pct.dentist_id = p.therapist_id
      AND pct.is_active = true
  );
```

**Expected**: valor entero ≥0. Seed spec 017 = 1 paciente (al menos).

**Thresholds severidad**:
- 0 → R-01 (drift transitorio) → severidad NULA.
- 1-5 → severidad **BAJA**.
- 6-50 → severidad **MEDIA**.
- >50 → severidad **ALTA**.

### P1.2 — Query β: per-therapist distribution

```sql
SELECT p.therapist_id, COUNT(*) AS drift_patients
FROM patients p
WHERE p.therapist_id IS NOT NULL
  AND p.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM patient_care_team pct
    WHERE pct.patient_id = p.id
      AND pct.dentist_id = p.therapist_id
      AND pct.is_active = true
  )
GROUP BY p.therapist_id
ORDER BY drift_patients DESC
LIMIT 20;
```

**Propósito**: identificar si hay 1-2 therapists con mucho drift (bug específico) vs drift distribuido entre muchos therapists (bug sistémico).

### P1.3 — Query γ: per-organization distribution

```sql
SELECT p.organization_id, COUNT(*) AS drift_patients
FROM patients p
WHERE p.therapist_id IS NOT NULL
  AND p.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM patient_care_team pct
    WHERE pct.patient_id = p.id
      AND pct.dentist_id = p.therapist_id
      AND pct.is_active = true
  )
GROUP BY p.organization_id
ORDER BY drift_patients DESC;
```

**Propósito**: detecta si una org específica concentra el drift (ej. migración legacy mal aplicada).

### P1.4 — Query δ: categorización por hipótesis

```sql
-- Spec 018 Phase 1 Query δ — partition por hipótesis
-- Fecha spec 003 trigger: 2026-04-18 (migration 20260419000001, aplicada 2026-04-19/20)
SELECT
  p.id,
  p.therapist_id,
  p.organization_id,
  p.created_at,
  CASE
    -- Hipótesis (a) Legacy pre-spec 003: created_at < 2026-04-18
    WHEN p.created_at < '2026-04-18' THEN 'a_legacy_pre_trigger'

    -- Hipótesis (b) Deactivation: existe care_team row con is_active=false
    WHEN EXISTS (
      SELECT 1 FROM patient_care_team pct
      WHERE pct.patient_id = p.id
        AND pct.dentist_id = p.therapist_id
        AND pct.is_active = false
    ) THEN 'b_deactivation'

    -- Hipótesis (d) Org membership expired: therapist_id no es member activo de la org
    WHEN NOT EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = p.therapist_id
        AND om.organization_id = p.organization_id
        AND om.is_active = true
    ) THEN 'd_org_membership_expired'

    -- Hipótesis (c) Reassignment: existe care_team row con OTRO dentist is_active=true
    WHEN EXISTS (
      SELECT 1 FROM patient_care_team pct
      WHERE pct.patient_id = p.id
        AND pct.dentist_id != p.therapist_id
        AND pct.is_active = true
    ) THEN 'c_reassignment'

    -- Hipótesis (e) Ghost: 0 rows en care_team para este patient
    WHEN NOT EXISTS (
      SELECT 1 FROM patient_care_team pct
      WHERE pct.patient_id = p.id
    ) THEN 'e_ghost'

    ELSE 'unclear'
  END AS hypothesis
FROM patients p
WHERE p.therapist_id IS NOT NULL
  AND p.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM patient_care_team pct
    WHERE pct.patient_id = p.id
      AND pct.dentist_id = p.therapist_id
      AND pct.is_active = true
  );
```

**Propósito**: asigna hipótesis a cada paciente drift. El orden de CASE WHEN resuelve overlap (más específica gana).

**Agregación post-query**:
```sql
SELECT hypothesis, COUNT(*) FROM (<above subquery>) GROUP BY hypothesis ORDER BY count DESC;
```

### P1.5 — Output `data-model.md`

Secciones:
- `§Quantification` — Query α count.
- `§Breakdown` — Query β + γ outputs (per-therapist, per-org).
- `§Hypothesis distribution` — Query δ counts per bucket + % + criterio determinístico.
- `§Phase 1 preliminary verdict` — severidad tentativa + hipótesis dominante hint.

### P1.6 — **STOP POINT SP-1**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T1** | Query α count documentado | Valor entero ≥0 | — |
| **T2** | Query β per-therapist distribution | Top 20 therapists o "<20 therapists total" | — |
| **T3** | Query γ per-org distribution | 1+ orgs con drift count | — |
| **T4** | Query δ categorización | 5 hipótesis + unclear, 100% cubre Query α | Si sum != Query α → investigar SQL overlap |

**Reporte a Danissa** (bloquea Phase 2):

```markdown
## Phase 1 Report — spec 018

- Query α drift count: [N]
- Query β top therapist drift: [therapist_id + count, top 3]
- Query γ top org drift: [org_id + count, top 3]
- Query δ hypothesis distribution:
  * a_legacy_pre_trigger: [N] ([%])
  * b_deactivation: [N] ([%])
  * c_reassignment: [N] ([%])
  * d_org_membership_expired: [N] ([%])
  * e_ghost: [N] ([%])
  * unclear: [N] ([%])
- Preliminary severidad: [BAJA/MEDIA/ALTA basado en Query α]
- Hipótesis dominante hint: [a/b/c/d/e o "distribuida — mixed approach"]
- Checks: T1 ✅ · T2 ✅ · T3 ✅ · T4 ✅

🟢 GO / 🔴 STOP
```

---

## Phase 2 — Análisis + Verdict (~10 min, STOP POINT SP-2)

**Prerequisito**: SP-1 🟢 GO.

### P2.1 — Asignar severidad final

Basado en Query α count + pacientes creados post-trigger (Query δ filter `created_at >= '2026-04-18'`):

- **NULA** (Query α = 0): close como "drift transitorio, no-bug" (R-01 activa).
- **BAJA** (1-5 pacientes): close como "known edge case, no fix".
- **MEDIA** (6-50 o cualquier pacient post-trigger ≥1): follow-up spec opcional.
- **ALTA** (>50 o ≥5 pacientes post-trigger): follow-up spec **P0** (indica bug activo del trigger).

### P2.2 — Identificar hipótesis dominante

Desde Query δ distribution:
- **Clear winner** (≥60% en 1 hipótesis): documentar + sugerir Option X/Y alineada.
- **2-way split** (≥35% cada una en 2 hipótesis): mixed approach.
- **Distribuida** (<35% cada, >40% unclear): requiere investigación case-by-case → spec más grande.

### P2.3 — Estimar user impact

```sql
-- ¿Cuántos dentists activos paying están afectados?
SELECT COUNT(DISTINCT p.therapist_id)
FROM patients p
WHERE <drift condition> -- misma subquery Query α
  AND EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = p.therapist_id
      AND s.status = 'active'
  );
```

Output: "N dentists paying con ≥1 paciente invisible en UI".

### P2.4 — Output `data-model.md §Verdict`

```markdown
## Verdict

**Severidad**: [BAJA / MEDIA / ALTA]
**Hipótesis dominante**: [letra + nombre + %]
**User impact**: [N dentists paying afectados]
**Rationale**: [2-3 sentencias explicando severidad + hipótesis + impacto]
```

### P2.5 — **STOP POINT SP-2**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T5** | Severidad asignada sin ambigüedad | 1 de 4 valores (NULA/BAJA/MEDIA/ALTA) | Si ambiguo → re-evaluar thresholds |
| **T6** | Hipótesis dominante o "mixed approach" documentada | Decisión clara | Si unclear > 40% → aceptar mixed |
| **T7** | User impact estimado | Count de dentists paying afectados | — |

---

## Phase 3 — Docs + Follow-up Condicional (~10 min, STOP POINT SP-3)

**Prerequisito**: SP-2 🟢 GO.

### P3.1 — Update `data-model.md` con follow-up scope condicional

**Si severidad = NULA o BAJA**:
```markdown
## Follow-up: N/A

Spec 018 cierra sin follow-up fix. Documentado como known edge case en
architecture.md. Re-auditoría futura si DentalSpot escala (>1000 pacientes)
y severidad podría aumentar.
```

**Si severidad = MEDIA o ALTA**: template completo:

```markdown
## Follow-up fix scope: fix-therapist-id-careteam-drift (P[0/1])

**Severidad**: [MEDIA/ALTA]
**Scope**:
- Option X: backfill patient_care_team entries idempotent para pacientes drift
  * Query: INSERT INTO patient_care_team (dentist_id, patient_id, is_active, assigned_at)
    SELECT therapist_id, id, true, created_at FROM <drift subquery>
    ON CONFLICT (dentist_id, patient_id) DO NOTHING
  * Idempotent via ON CONFLICT.
- Option Y: cleanup patients.therapist_id donde no tiene care_team (UPDATE SET therapist_id = NULL)
  * Más agresivo, pérdida de información legacy.
- Recomendación: [X o Y o Mixed] según hipótesis dominante ([letra]).
- Estimated size: [S/M/L]
- Decisión RLS tightening vs application-level filter: N/A (ya aplica RLS, solo data sync).
```

### P3.2 — Draft subsección `architecture.md`

```markdown
### Therapist_id vs care_team drift audit (spec 018 — 2026-04-20)

**Verdict**: [severidad]

**Origen**: hallazgo lateral spec 017 Phase 2 empirical (1 paciente Cristóbal
con therapist_id set pero sin care_team activo).

**Metodología**: 4 queries SQL (α count + β per-therapist + γ per-org + δ
hipótesis categorization en 5 buckets).

**Findings**:
- N pacientes con drift total.
- N dentists paying afectados.
- Hipótesis dominante: [letra + %].

**Action**:
- Si NULA/BAJA: close. Known edge case.
- Si MEDIA/ALTA: follow-up spec `fix-therapist-id-careteam-drift` (priority P[0/1])
  con [Option X backfill / Option Y cleanup / Mixed approach].
```

### P3.3 — **STOP POINT SP-3**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T8** | data-model.md §Verdict completo | severidad + hipótesis + impact | — |
| **T9** | Si MEDIA/ALTA: follow-up scope preparado | template copy-paste ready | Si missing → completar |
| **T10** | architecture.md update draft ready | subsección escrita en data-model.md | — |

**Reporte final a Danissa**:

```markdown
## Phase 3 Report — spec 018

- Severidad: [NULA/BAJA/MEDIA/ALTA]
- Hipótesis dominante: [letra + %]
- User impact: [N dentists paying]
- Follow-up: [preparado / N/A close]
- architecture.md: ready
- Decisión: close / abrir follow-up / re-evaluate

🟢 CLOSE / 🔴 RE-EVALUATE
```

---

## Stop Points resumen

| # | Ubicación | Criterio | Acción |
|---|---|---|---|
| **SP-0** | Pre-Phase 1 | tasks.md aprobado 6/6 | 🟢 GO Danissa |
| **SP-1** | Fin Phase 1 | T1-T4 PASS + queries ejecutadas + preliminary verdict | 🟢 GO → Phase 2 |
| **SP-2** | Fin Phase 2 | T5-T7 PASS + severidad + hipótesis + impact | 🟢 GO → Phase 3 |
| **SP-3** | Fin Phase 3 | T8-T10 PASS + follow-up (si aplica) + arch draft | Decisión close / abrir follow-up |

---

## Time Budget

| Phase | Tiempo | Contenido |
|---|---|---|
| Phase 1 — Quantification | **15 min** | 4 queries SQL + `data-model.md` matriz + SP-1 |
| Phase 2 — Análisis + Verdict | **10 min** | Severidad + hipótesis dominante + user impact + SP-2 |
| Phase 3 — Docs + follow-up | **10 min** | data-model §Verdict + §Follow-up (condicional) + architecture.md draft + SP-3 |
| Buffer | **10 min** | Si dispara R-01/R-02/R-03 |
| **Total** | **45 min** | Dentro bound 30-45 spec (max 60 antes de STOP) |

---

## References

- `specs/017-audit-cross-org-isolation/data-model.md §Empirical verification` — origen del hallazgo (Query β 5 vs Query γ 4).
- `supabase/migrations/20260419000001_repair_patient_care_team.sql` (spec 003) — trigger sync introducido; hito temporal para hipótesis (a).
- `.specify/memory/architecture.md §RLS coverage audit 2026-04-20 — 100% CERRADO` — contexto RLS via care_team pattern.
- `.specify/memory/constitution.md §IV` — Micro-Bloques (audit ≠ fix).
- `.specify/memory/constitution.md §V` — UI Honesty (paciente invisible).
- `docs/PATTERNS.md §4` (audit defensivo) — metodología.
- `docs/PATTERNS.md §7` (state drift re-verification) — aplicable al pre-apply check del fix spec si aplica.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | Sin violaciones. Discovery pure, réplica spec 017 — 0 code edits, 0 migration, scope acotado. Si severidad MEDIA/ALTA, fix es spec propio (§IV). Severidad thresholds (≤5/6-50/>50) son operacionales para DentalSpot ≈500 pacientes estimados. |
