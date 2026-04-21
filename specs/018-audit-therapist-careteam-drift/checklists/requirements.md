# Specification Quality Checklist: Audit therapist_id vs care_team Drift

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
  - Discovery-pure spec (patrón specs 012/017) — 0 code changes, 0 migrations. Output: cuantificación + severidad + (condicional) follow-up fix scope.
  - Nombres técnicos (`patients.therapist_id`, `patient_care_team.dentist_id/is_active`, spec 003) son vocabulario del dominio establecido. Consistente con specs 014/015/016/017.
  - **FR-004 severidad ternaria** (BAJA/MEDIA/ALTA) con thresholds explícitos evita "inconclusive" verdicts.
  - FR-003 exige categorización determinística en 5 hipótesis + bucket "unclear" para edge cases sin encajar.
  - 8 edge cases cubren casos realistas: 0 drift detectado, null therapist_id, status non-active, orphan references, multi-therapist care_team, drift en nuevos (trigger bug), admin visibility, hipótesis overlap.
  - **Severity thresholds** (BAJA ≤5, MEDIA 6-50, ALTA >50) documentadas en Assumptions como operacionalmente razonables para DentalSpot. Permite ajuste si contexto cambia.
  - 7 FRs con Phase 1 temporal check (FR-010) diferencia legacy tolerable vs trigger bug actual.
  - Scope Bounds descarta aplicación de fix, modificación src/**, migrations — aplica Constitution §IV Micro-Bloques.
  - Constitution §V (UI Honesty) relevante documentado: paciente invisible vs therapist declared podría engañar al user.
  - Referencias directas a spec 017 (origen del hallazgo) + spec 003 (trigger sync histórico) — contexto diagnóstico claro.
