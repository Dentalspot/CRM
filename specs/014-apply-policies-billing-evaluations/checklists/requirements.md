# Specification Quality Checklist: Apply Policies billing_invoices + patient_evaluations

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
  - Nombres técnicos de tablas/columnas (`billing_invoices`, `patient_care_team`, `therapist_id`, `patient_user_id`, `profiles.role`) son vocabulario del dominio establecido en migraciones previas (specs 006/009/012) y `architecture.md`. Consistente con specs 007/009/013 donde se admitió el mismo vocabulario.
  - FR-010 (Phase 1 lee `information_schema.columns`) mitiga Constitution §VI Schema Drift Zero antes de escribir predicates SQL.
  - SC-004 smoke test con rows manuales en SQL Editor es la mejor validación viable dado que (a) tablas tienen 0 rows pre-spec, (b) patient_evaluations UI no está 100% activa, (c) MCP execute_sql denegado para este proyecto.
  - Rollback Plan proporcional: 3 triggers, batch DROP copy-pasteable, fallback DISABLE RLS solo para catastrófico. NO rollback section evita falsos positivos (empty state ≠ bug).
  - User Story 1 (billing) prioritizada sobre User Story 2 (evaluations) por proximidad a recibir data real (Q2-2026 cobros vs feature parcialmente desarrollada). Ambas son pre-launch preventivo.
  - Scope Bounds explícitos descartan `patient_goals` + `patient_development_areas` (spec futura) — aplica Constitution §IV Micro-Bloques al pie de la letra.
  - Constitution §II es driver explícito (RLS-First Security). §IV (Micro-Bloques) y §VI (Schema Drift Zero) son guard rails listados en Dependencies.
