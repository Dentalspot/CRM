# Specification Quality Checklist: Apply Policies patient_goals + patient_development_areas

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
- **Validation iteration 1 (2026-04-20)**: 12/12 items pass.
  - Nombres técnicos de tablas/columnas (`patient_goals`, `patient_development_areas`, `patient_care_team.dentist_id`, `patients.profile_id`, FK constraint path) son vocabulario del dominio establecido en specs previas (006/009/012/014) y `architecture.md`. Consistente con criterio aplicado en specs anteriores.
  - **Flexibilidad 4-5 policies**: FR-003 permite rango porque el edge case "shared vs per-patient `patient_development_areas`" se resuelve en Phase 1 Query D. Esto es spec realista, no NEEDS CLARIFICATION — la Phase 1 tiene criterio determinístico (observar presencia/ausencia de `patient_id` en la tabla). Valor exacto fijado en Phase 2 post-validación, sin bloqueo.
  - FR-010 fuerza Phase 1 lee schema de 5 tablas (patient_goals, patient_development_areas + refresh de patient_care_team, patients, profiles). Constitution §VI.
  - Edge functions service_role bypass se documenta explícitamente en User Story 3 + FR-011 para evitar confusión con edge functions que pudieran romperse post-apply.
  - Rollback Plan con batch SQL condicional (shared vs per-patient) reconoce que el SQL final depende de Phase 2.
  - Scope Bounds descarta explícitamente otras 19 tablas GROUP C (scope bound heredado de spec 012) + edge functions + UI changes + nuevas tablas. Aplica §IV Micro-Bloques.
  - Bundle justificado en User Story 1 + Scope — 2 tablas en 1 migración porque el FK embed requiere policies coordinadas.
  - SC-008 marca cierre final de GROUP B (0 pendientes post-spec), conectando con architecture.md tabla histórica.
  - Referencias directas a spec 014 como bar-raiser (misma estructura DO $$, mismos ajustes schema). Reduces fricción de implementation.
