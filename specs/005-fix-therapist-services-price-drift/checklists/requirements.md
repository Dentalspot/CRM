# Specification Quality Checklist: Fix — schema drift `therapist_services.price`

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-04-20
**Feature**: [spec.md](../spec.md)
**Priority**: 🟡 P1 — bug funcional visible + Constitution VI violada

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Validation Notes (iteration 1)

- **Content Quality — implementation details**: la spec menciona `fetchTherapistServices`, `odontogramEvalApi.js`, `OdontogramEvaluationPage.jsx`, `price_clp`, `42703`, `information_schema.columns`. Todos son **nombres semánticos** (archivos y columnas que ya existen o ya no existen en el repo/DB), no elecciones de implementación nuevas. Documentados en Assumptions + Key Entities. Decisión: mantener.
- **Success Criteria — technology-agnostic**: SC-001..SC-007 miden outcomes (0 errores 42703, dropdown con opciones, auto-fill funcional, total correcto, 0 regresiones, 0 warnings, grep post-fix). SC-007 usa `grep` como verificador, no como dependencia. Pasan el filtro.
- **Clarifications**: 0 markers `[NEEDS CLARIFICATION]`. El bug está identificado con evidencia de código (línea exacta) y de DB (query a `information_schema` confirmó columna inexistente). Mini-audit del 2026-04-20 descartó que otros archivos confirmados tengan el drift; los 6 "pendiente confirmar" son validación de Phase 1 del plan, no bloqueadores de la spec.
- **Scope boundary**: "Out of Scope" enumera 7 ítems explícitamente. FR-004 + FR-005 son los más estrictos del ciclo — enumeran a los 9 consumidores immunes por nombre para blindar su no-intervención. Cumple Constitution IV.
- **Dos enfoques candidatos (A vs B) en FR-002**: la spec deja explícitamente la decisión al plan técnico con criterios claros (mínimo scope vs claridad semántica + consistencia). Esto es correcto para una spec — no prescribe implementación.
- **Compliance Alignment**: sección dedicada conecta con Constitution IV, V, VI (no toca PHI así que I y III no aplican directamente).
- **Relationship with prior specs**: observación honesta sobre cómo este bug posiblemente pasó desapercibido en tests previos de specs 001/003 (scope de esos tests era audit log, no presupuesto).

## Notes

- **Prioridad P1 (no P0)**: el bug es funcional pero NO afecta compliance PHI ni la funcionalidad core de crear evaluación (solo el presupuesto). Spec 003 fue P0 (audit silencioso). Esta es mejora de UX + Constitution VI.
- **Fix trivial en código**: ~1–4 líneas en 1–2 archivos según enfoque A o B.
- **Plan técnico debe recorrer 6 archivos adicionales** en Phase 1 read-only para descartar drifts ocultos (FR-004). Si aparecen, reportar antes de tocar código.
- **Zero backfill**: los precios históricamente escritos en `odontogram_evaluations.treatments` con `undefined`/0/NaN por el drift NO se corrigen (FR-005 implícito + Out of Scope).
