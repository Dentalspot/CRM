# Specification Quality Checklist: Restore Marketplace Purchases RLS Policies

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
  - El spec menciona artefactos técnicos explícitos (`pg_policies`, `pg_class.rowsecurity`, `rowsecurity`, `buyer_id`, `auth.uid()`, nombres de archivos de migración) por consistencia con el vocabulario ya establecido en spec 006 y `architecture.md §RLS coverage audit`. No son "implementation details" en el sentido prohibido — son nombres canónicos del sistema (mismo criterio aplicado en spec 007 con `plan_sessions!inner`, alias PostgREST, etc.).
  - User Story 3 (Vendor) está priorizado P3 con dependencia explícita del output de Phase 1: si no existe columna `vendor_id`, el user story se marca N/A y queda fuera. Esto es testeable y limitante, no ambiguo.
  - Rollback Plan tiene 4 triggers cuantitativos (≥2 callsites rotos, buyer vacío, admin 0, vendor crash/leak) + 3 non-rollback triggers con umbrales claros.
  - FR-006 es condicional ("mínimo 2 policies buyer, resto si Phase 1 confirma"): intencional porque Phase 1 es parte del spec, no del plan. Phase 1 es la fuente de verdad sobre qué policies hacen falta.
  - Scope Bounds es más estricto que spec 007: un solo archivo NUEVO autorizado (migration). FR-011 explícito contra tocar frontend aunque haya callsite mal construido (anti-scope-creep learned from specs previas).
- **Validation iteration 2 (2026-04-20)** — pre-commit ajustes V1/V2/V3:
  - **V1 (information_schema + nombre REAL buyer)**: FR-003 ampliado para (a) consultar `information_schema.columns` explícitamente, (b) NO pre-asumir el nombre `buyer_id`, (c) iterar candidatos (`buyer_id`, `user_id`, `purchaser_id`, `customer_id`), (d) propagar el nombre real a policies/migration si difiere del asumido. Cierra el riesgo de baking-in una asunción no verificada del spec 006.
  - **V2 (3 estrategias admin)**: FR-006a nuevo, enumera las 3 estrategias (A coexistencia / B replace con ALL / C granular) con pros/contras y dependencia de Phase 1 para la decisión. Assumption sobre "Admins update" ajustada para NO pre-decidir coexistencia.
  - **V3 (naming convention canónica)**: FR-006b nuevo, manda nombres siguiendo `supabase/policies.sql` histórico (`"Buyers read own marketplace_purchases"`, `"Buyers insert marketplace_purchases"`, `"Admin manage marketplace_purchases"`, `"Vendors read own marketplace_purchases"`). Previene drift de nombres que complicaría referencias futuras en tooling Supabase.
  - 12/12 items siguen pasando tras iteration 2.
