# Specification Quality Checklist: Add Missing FK Indexes

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
  - El spec cita identificadores técnicos explícitos (`pg_indexes`, `pg_constraint`, `EXPLAIN ANALYZE`, `btree`, nombres exactos de índices `idx_*`). Es **intencional** — un spec de índices DB no puede ser technology-agnostic sin perder testabilidad. Mismo criterio aplicado en specs 006/009 con nombres de policies.
  - User Story 1 prioritized P1 (appointments — tabla que más crece, calendar render crítico). P2 commissions (financial). P3 los 4 restantes (features nicho, preventivo).
  - FR-013 agrega `IF NOT EXISTS` como defense en depth aun cuando Phase 1 confirma 0 índices — neutraliza drift entre Phase 1 y Phase 2.
  - Edge cases cubren casos realistas: FK renombrada, índice ya existe, tabla vacía, tabla grande, CAST peculiar, Seq Scan post-index en tablas chicas (non-failure).
  - Rollback Plan proporcional al scope (3 triggers, DROP IF EXISTS batch + git revert, non-rollback triggers para casos menores).
  - Scope Bounds enumera los ~23 FKs excluidos con grouping por prefijo — da claridad operativa de qué queda fuera.
