# Specification Quality Checklist: Fix Patient Dashboard Schema Drifts

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-04-20
**Feature**: [spec.md](../spec.md)

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

## Notes

- Items marked incomplete require spec updates before `/speckit.clarify` or `/speckit.plan`
- **Validation iteration 1 (2026-04-20)**: All 12 items pass.
  - Observación sobre "no implementation details": el spec referencia paths de archivos (`src/features/patient-dashboard/PatientDashboardPageV2.jsx:162-165`), nombres de tablas (`session_activities`) y patrones (`plan_sessions!inner`, `alias PostgREST`). Esto es deliberado y aceptable en un spec de fix — la raíz del bug ES la cita al archivo/query específicos. Un spec de fix sin los paths pierde testabilidad (no se sabría qué está driftado). Similar criterio aplicó spec 005 (`therapist_services.price → price_clp` citando archivos concretos).
  - FR-005 y FR-006 son condicionales (if/else sobre lo que revele Phase 1): esto es intencional porque Phase 1 es parte del spec, no del plan — el audit defensivo es un requerimiento funcional, no una decisión técnica.
  - SC-008 depende de monitoreo que puede no existir: marcado con cláusula "si hay monitoreo / si no, issues reportadas" para mantenerlo testable.
- **Validation iteration 2 (2026-04-20)** — post-review round con 3 ajustes y 1 fix de hash:
  - **FR-003 extendido** con 3 abort triggers explícitos: (a) >3 tablas driftadas, (b) >5 archivos a tocar, (c) re-modelado semántico. Antes el bound era solo por tablas.
  - **Sección "Regression Test Inventory"** agregada con tabla de 14 rutas (7 session_activities + 7 clinical_reports) con path + línea + rol + expectativa. Reemplaza la mención abstracta "8 rutas" de SC-005.
  - **Sección "Rollback Plan"** agregada con 4 abort triggers post-Phase 2 (>2 regresiones, regresión en user-story fixeada, build/lint roto, Phase 1 incorrecto), protocolo de rollback vía `git revert` (no reset), y criterios de no-abort (0–2 regresiones menores → follow-up).
  - **Typo hash**: `580864d` → `580408d` (confirmado contra git log). Afecta la línea en Assumptions que referencia spec 005.
  - 12/12 items siguen pasando tras iteration 2.
