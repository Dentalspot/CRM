# Feature Specification: Audit — `patients.therapist_id` vs `patient_care_team` Drift

**Feature Branch**: `018-audit-therapist-careteam-drift`
**Created**: 2026-04-20
**Status**: Draft (discovery pure)
**Input**: Hallazgo lateral cuantitativo de spec 017 Phase 2 empirical. Cristóbal tiene 5 pacientes con `patients.therapist_id = <Cristóbal>` (Query β raw) pero solo 4 pacientes pasan el filtro RLS (Query γ) que usa `patient_care_team.dentist_id + is_active = true`. **1 paciente drift**: existe en `patients` con therapist_id set, pero NO hay entry activo en `patient_care_team`. Resultado: paciente **invisible en UI** (RLS filtra) pero el campo legacy sugiere asignación. Spec 018 cuantifica globalmente el alcance del drift y decide si es edge case (close) o pattern sistémico (follow-up fix spec).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Cuantificar drift globalmente (Priority: P1)

Danissa sospecha que el drift detectado en 1 paciente de Cristóbal podría ser parte de un patrón más amplio (ej. todos los pacientes creados pre-spec 003 cuando los triggers de sync `patient_care_team` no existían). Necesita saber: **¿cuántos pacientes totales tienen drift? ¿Cuántos dentists afectados? ¿Qué distribución por organization?** Sin la cuantificación, no puede decidir si es "known edge case sin fix" o "patrón sistémico con fix obligatorio".

**Why this priority**: la severidad del drift determina el costo de ignorarlo. 1 paciente = accept. 50+ pacientes = rompe UX de múltiples dentists (pacientes invisibles silenciosos). Audit es low-cost (queries read-only) y da input determinístico para decisión go/no-go del fix.

**Independent Test**: al cierre, `data-model.md §Verdict` contiene: (a) count absoluto de pacientes con drift, (b) count de dentists afectados, (c) distribución por org, (d) severidad asignada (baja/media/alta), (e) decisión go-forward (close o follow-up spec).

**Acceptance Scenarios**:

1. **Given** Phase 1 queries ejecutadas, **When** Danissa consulta `data-model.md §Quantification`, **Then** encuentra counts exactos por dimension (total / per-dentist / per-org).
2. **Given** severidad = baja (≤5 pacientes), **When** cierre spec, **Then** `architecture.md §"Therapist_id vs care_team drift audit"` documenta como "known edge case, no fix" con referencia para evitar re-auditoría.
3. **Given** severidad = media o alta, **When** cierre spec, **Then** `data-model.md §Follow-up fix scope` contiene template preparado (Option X backfill vs Option Y cleanup therapist_id) con scope listo para `/speckit-specify`.

---

### User Story 2 — Categorizar hipótesis dominante (Priority: P2)

El drift puede tener 5 causas distintas (a/b/c/d/e — ver Input arriba), y cada una tiene un fix diferente. Phase 1 Query δ particiona los pacientes con drift según la hipótesis que mejor los explica. La categorización guía la decisión entre backfill (Option X) vs cleanup (Option Y) vs mixed-approach.

**Why this priority**: sin categorización, el fix genérico (ej. "backfill todo") puede introducir bugs (ej. asignar care_team a un paciente que fue deliberadamente desasignado). Priority P2 porque es input del follow-up — no bloquea la cuantificación de P1.

**Independent Test**: `data-model.md §Hypothesis distribution` tiene tabla: cada hipótesis (a/b/c/d/e) con count absoluto + % + confianza de categorización.

**Acceptance Scenarios**:

1. **Given** Phase 1 Query δ ejecutada, **When** Danissa consulta `§Hypothesis distribution`, **Then** encuentra pacientes particionados en 5 buckets (a/b/c/d/e) + un bucket "unclear" para casos que no encajan en ninguna hipótesis.
2. **Given** hipótesis dominante identificada (>50% de casos), **When** `§Follow-up fix scope` se prepara, **Then** sugiere estrategia alineada con esa hipótesis (ej. "hipótesis c dominante → Option X backfill con fecha de asignación inferida por created_at del paciente").

---

### User Story 3 — Actualizar `architecture.md` con findings (Priority: P3)

Post-spec, `architecture.md` tiene nueva subsección `§"Therapist_id vs care_team drift audit (2026-04-20, spec 018)"` con metodología, counts, severidad, acción. Consolidación documental para evitar re-auditoría + proveer contexto histórico del drift.

**Why this priority**: P3 porque es output documental, no bloquea la decisión operativa. Pero importante para que el audit no se pierda en el histórico de specs.

**Independent Test**: grep `"Therapist_id vs care_team"` en `architecture.md` retorna la subsección nueva con fecha + counts + verdict + action.

**Acceptance Scenarios**:

1. **Given** spec 018 cerrado, **When** Danissa consulta `architecture.md`, **Then** encuentra la subsección con fecha 2026-04-20.
2. **Given** severidad asignada, **When** la subsección se escribe, **Then** incluye link al follow-up spec (si se abrió) o marca "closed — known edge case" con rationale.

---

### Edge Cases

- **Tabla de drift vacía** (0 pacientes): Phase 1 Query α retorna 0 → el hallazgo de spec 017 era edge anómalo. Severidad **nula**, close inmediato con "no drift detectable post-audit".
- **Pacientes con `therapist_id IS NULL`**: legítimamente no tienen therapist asignado vía campo legacy. Phase 1 excluye estos del scope del audit (drift = therapist_id set pero care_team ausente, no "ambos null").
- **Pacientes con `status != 'active'`**: status='inactive'/'archived'/'deleted' puede explicar algunos drifts (paciente dado de baja, care_team se desactivó pero therapist_id quedó). Phase 1 Query α incluye ambas variantes (active vs non-active) para distinguir.
- **Therapist ya no existe** (therapist_id apunta a user eliminado): edge case de "orphan reference". Phase 1 Query β detecta via LEFT JOIN a profiles.
- **Múltiples dentists en care_team del mismo paciente**: patrón válido (specs 014/015/016 diseñaron multi-therapist). El drift no es "solo 1 therapist en care_team" — es "0 therapists activos en care_team mientras therapist_id apunta a alguien".
- **Paciente creado hoy post-spec 003 con trigger activo**: si Phase 1 muestra drift incluso en pacientes nuevos → bug de trigger (no legacy). Priority alta.
- **Admin tooling**: admin puede ver pacientes con drift (policy FOR ALL). Si admin dashboard los lista sin flag visual, es hallazgo UX lateral — documentar si aplica, no bloquea.
- **Conteo categorizaciones > total**: si Query δ sobrecontabiliza por overlap entre hipótesis (ej. un paciente cae en a y b), documentar + asignar a la dominante por criterio determinístico.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Phase 1 audit MUST cuantificar total de pacientes con drift vía Query α: `patients` donde `therapist_id IS NOT NULL` pero NO tiene entry activa correspondiente en `patient_care_team` (con `dentist_id = patients.therapist_id AND is_active = true`).
- **FR-002**: Phase 1 MUST desglosar el drift por dimension: (a) por therapist (quién tiene más pacientes drifted), (b) por organization (qué org concentra el drift), (c) por temporalidad (drift en pacientes antiguos vs nuevos via `patients.created_at`).
- **FR-003**: Phase 1 Query δ MUST categorizar cada paciente drift en 1 de 5 hipótesis: (a) legacy pre-trigger, (b) deactivation, (c) reassignment, (d) cross-org membership, (e) ghost (nunca existió). Criterios determinísticos por hipótesis documentados en `data-model.md §Hypothesis criteria`. Bucket `unclear` aceptable para casos ambiguos.
- **FR-004**: Phase 2 MUST emitir veredicto de **severidad binaria-ternaria**: **BAJA** (≤5 pacientes, edge case), **MEDIA** (6-50 pacientes o patrón temporal), **ALTA** (>50 pacientes o pacientes creados post-trigger). Sin ambigüedad.
- **FR-005**: Si severidad = MEDIA o ALTA, `data-model.md §Follow-up fix scope` MUST contener template copy-pasteable al `/speckit-specify` con: Option X (backfill care_team idempotent) + Option Y (cleanup therapist_id) + recomendación según hipótesis dominante.
- **FR-006**: `architecture.md` MUST recibir nueva subsección `§"Therapist_id vs care_team drift audit (2026-04-20, spec 018)"` con findings + verdict + action.
- **FR-007**: Spec MUST NO modificar código fuente (`src/**`), migraciones (`supabase/migrations/**`), ni edge functions. Discovery pure — si se detecta fix, es spec separado.
- **FR-008**: Phase 1 MUST excluir del scope del drift: (a) pacientes con `therapist_id IS NULL` (no-drift por definición), (b) pacientes con `status != 'active'` contados pero reportados aparte (no mezclados en el total principal).
- **FR-009**: Phase 1 Query α MUST validar que la condición de "drift" incluye `patient_care_team.is_active = true` — un paciente con care_team entry desactivado (is_active=false) también es drift (hipótesis b).
- **FR-010**: Phase 2 análisis MUST incluir check temporal — ¿el drift ocurre mayoritariamente en pacientes pre-spec 003 (antes de triggers de sync) o en pacientes post-trigger? Esto discrimina entre (a) legacy tolerable vs (a) trigger bug actual.

### Key Entities

- **`patients.therapist_id` (UUID)**: campo legacy que indica el terapeuta responsable. Pre-spec 003, se usaba como fuente canónica de asignación. Post-spec 003, la fuente canónica es `patient_care_team`, y `therapist_id` queda como legacy que debería sincronizarse via trigger.
- **`patient_care_team` (tabla link)**: modelo canónico many-to-many. Columnas clave: `dentist_id`, `patient_id`, `is_active`. Policies RLS modernas (specs 014/015/016) filtran por este patrón.
- **Drift**: paciente con `therapist_id` set pero sin entry activo en `patient_care_team` donde `dentist_id = therapist_id`. Resultado: invisible en UI pero "asignado" por campo legacy.
- **5 hipótesis**:
  - **(a) Legacy pre-trigger**: paciente creado antes de spec 003 (cuando trigger de sync `patient_care_team` no existía).
  - **(b) Deactivation**: care_team entry existe con `is_active=false`, pero `therapist_id` no se limpió.
  - **(c) Reassignment**: paciente fue reasignado a otro therapist, entry nueva en care_team pero `therapist_id` legacy quedó pointing al dentist anterior.
  - **(d) Org membership expired**: therapist_id válido, paciente en org X, pero el dentist ya no es miembro activo de X (removed from `organization_members`). RLS filtra por org_member check.
  - **(e) Ghost**: `patient_care_team` entry nunca existió (bug histórico de trigger que no disparó).
- **Severidad** (FR-004):
  - **BAJA**: ≤5 pacientes total. Edge case. Accept sin fix.
  - **MEDIA**: 6-50 pacientes o patrón temporal detectable. Follow-up spec con fix opcional.
  - **ALTA**: >50 pacientes o pacientes creados post-trigger (indica bug activo). Follow-up spec P0.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Phase 1 Query α retorna count exacto de pacientes con drift (valor ≥0 sin ambigüedad). Documentado en `data-model.md §Quantification`.
- **SC-002**: ≥3 dimensiones de desglose ejecutadas (per-therapist, per-org, temporal). Outputs en `data-model.md §Breakdown`.
- **SC-003**: 5 hipótesis particionadas con count + criterio determinístico. `data-model.md §Hypothesis distribution`.
- **SC-004**: severidad asignada (BAJA/MEDIA/ALTA) sin ambigüedad. FR-004.
- **SC-005**: si severidad = MEDIA o ALTA, `§Follow-up fix scope` completo y copy-paste ready.
- **SC-006**: `architecture.md §"Therapist_id vs care_team drift audit"` subsección existe post-close con findings + verdict.
- **SC-007**: tiempo total del ciclo spec 018 ≤ **45 min**. Bound superior 60 min antes de STOP.

## Assumptions

- **Phase 1 via Danissa en SQL Editor** (MCP execute_sql denegado por contexto heredado).
- **`patients.therapist_id` es UUID nullable** que referencia `auth.users` (o `profiles`, schema confirmará).
- **`patient_care_team` tiene columnas `dentist_id`, `patient_id`, `is_active`** (validado en specs 014/015/016).
- **Spec 003 migration `20260419000001_repair_patient_care_team.sql`** introdujo triggers de sync. Pacientes creados pre-2026-04-18 pueden tener drift legacy.
- **El drift detectado en spec 017 (1 paciente Cristóbal)** es el seed — Phase 1 extrapola al total global.
- **Discovery pure**: si el audit detecta fix necesario, es spec separado. Constitution §IV.
- **Severidad thresholds**: BAJA ≤5, MEDIA 6-50, ALTA >50 — valores definidos por Danissa como operacionalmente razonables para DentalSpot (≈500 pacientes totales estimados, drift >10% del total sería sistémico).
- **Constitution §V relevante**: pacientes invisibles para su "therapist_id" declarado es violación de UI Honesty si el user esperaba verlos. Fix decisión depende de severidad.

## Scope Bounds

- **In scope**: queries SQL read-only vía Danissa + análisis + matriz hipótesis + severidad + (condicional) template fix spec + update `architecture.md`.
- **Out of scope** (hard boundaries):
  - Aplicación de backfill o cleanup (fix = spec separado).
  - Modificación código fuente (`src/**`).
  - Modificación migrations/policies (`supabase/**`).
  - Edge functions.
  - Tests automatizados.
  - Auditoría de otros drifts schema-drift (solo therapist_id ↔ care_team).
  - Admin dashboard UX del drift (follow-up UI si aplica).
  - Retrospectiva de triggers de spec 003 (contexto documentado, no re-ejecutar).

## Rollback Plan

**N/A — discovery pure**. No hay cambios aplicables al codebase ni al DB. Si el veredicto resulta erróneo post-close (ej. severidad cambia por data nueva), se re-abre audit en spec futuro.

**Única acción reversible**: actualización de `architecture.md §"Therapist_id vs care_team drift audit"`. Si el verdict se invalida, edit directo sin spec (doc hygiene).

## Dependencies

- **Constitution §II (RLS-First Security)**: contexto — el drift crea "paciente invisible" porque RLS moderna usa care_team.
- **Constitution §IV (Micro-Bloques)**: discovery pure, fix = spec separado.
- **Constitution §V (UI Honesty)**: relevante — paciente invisible para su "therapist declared" puede engañar al user.
- **spec 017 (`audit-cross-org-isolation`)**: fuente del hallazgo lateral (Query β vs γ discrepancia 5 vs 4).
- **spec 003 migration `20260419000001_repair_patient_care_team.sql`**: introdujo sync triggers — hito temporal para hipótesis (a) legacy.
- **spec 014/015/016**: policies RLS modernas usando `patient_care_team.dentist_id` — contexto del "invisible" pattern.
- **architecture.md §"Historial de compliance"**: contexto histórico (gap 43h audit log similar en spec 003).
- **PATTERNS.md §4 (audit defensivo)**: metodología.
- **PATTERNS.md §7 (state drift re-verification)**: aplicable si Phase 1 revela que estado hoy ≠ estado cuando spec 017 corrió.
