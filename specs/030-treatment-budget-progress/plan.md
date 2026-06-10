# Implementation Plan: Treatment Budget With Progress (MVP)

**Branch**: `030-treatment-budget-progress` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/030-treatment-budget-progress/spec.md`

## Summary

Unificar 4 sistemas hoy silos (odontograma diagnóstico, treatment_budgets económico, PostSession evolución, patient_payments cobro) en un flow natural al cerrar una sesión. El MVP cubre **Bloques 1+2+5** (items con estado + PostSession enriquecido + polish). Bloques 3 (vista paciente) y 4 (split notas público/privado) quedan para sesión siguiente.

Gracias al Bloque 0, el alcance se redujo:
- `treatment_budgets`, `treatment_budget_items`, `v_budget_balance` ya existen → solo agregar 3 columnas a items
- `patient_payments.budget_id` Y `appointment_id` YA EXISTEN → cero migration extra para el vínculo
- `PostSessionModal.jsx` ya tiene wizard pattern con step de pago → modificar para insertar checklist + auto-calcular monto
- Solo 2 budgets en producción → migración del jsonb legacy de bajo riesgo

El cambio principal es UX: insertar step "Items completados" en el wizard entre `document` y `payment`.

## Technical Context

**Language/Version**: JavaScript ES2022 (React 18, JSX, Vite 4.4)
**Primary Dependencies**: React 18, `@supabase/supabase-js` 2.99, Tailwind 3 + shadcn/ui, react-router-dom 6, framer-motion, date-fns
**Storage**: Supabase PostgreSQL — tablas existentes. Cero nuevas tablas. 3 columnas nuevas en `treatment_budget_items`
**Testing**: Smoke manual con Cristobal + Solange en Los Álamos. Sin tests automatizados
**Target Platform**: Browser SPA, mobile responsive
**Project Type**: SPA web (React + Supabase serverless)
**Performance Goals**:
  - PostSession carga items pendientes en < 500ms
  - `v_budget_balance` retorna balance en < 500ms para budgets ≤ 50 items
  - Dentista completa flow "cierre + 2 items + cobro" en < 90s (SC-004)
**Constraints**:
  - RLS strict (asistente NO puede UPDATE items.status)
  - Append-only audit en cada tildado, reversión, pago
  - UI Honesty (toast verde solo si `.select()` retorna row)
  - Schema Drift Zero
**Scale/Scope**:
  - 25 FRs · 8 SCs · 3 user stories (P1 MVP + 2 P2)
  - 1 migration nueva (~80 líneas)
  - 3 archivos JSX a modificar
  - 1-2 archivos JS a crear/extender
  - 1 componente nuevo (BudgetItemsChecklistStep)
  - 0 nuevas tablas

## Constitution Check

### Principio I — Compliance-First
**Aplicabilidad**: ALTA (PHI clínico + económico)
**Cumplimiento**: FR-018/019/020 cubren audit log completo. Reversión preserva trazabilidad ARCO. Sin cambios destructivos al payment audit existente
**Veredicto**: PASS

### Principio II — RLS-First Security
**Aplicabilidad**: ALTA (FR-014/015/016/017 son requisitos de permisos en DB)
**Cumplimiento**:
- Migration agrega 2 policies UPDATE sobre `treatment_budget_items`:
  - `tbi_dentist_update`: USING `is_org_member(... 'dentist')`
  - `tbi_admin_update`: USING `is_org_member(... 'clinic_admin')`
  - SIN policy de assistant para UPDATE de status
- Trigger BEFORE UPDATE valida que el dentista que revierte sea quien marcó originalmente (`completed_in_appointment_id.therapist_id = auth.uid()`) — admin pasa siempre
- patient_payments INSERT reusa policies existentes
**Veredicto**: PASS

### Principio III — Append-Only Clinical Audit
**Aplicabilidad**: ALTA
**Cumplimiento**:
- FR-018/019/020 cubren tildado + pago + reversión
- Vocabulario CHECK constraint en `clinical_audit_log.resource_type` debe ampliarse: `'budget_item'`, `'payment'` (spec 028 ya amplió `action`)
- `trg_audit_log_no_update` existente se preserva
**Veredicto**: PASS

### Principio IV — Micro-Bloques
**Cumplimiento**:
- Scope cerrado: Bloques 1+2+5
- Bloques 3+4 deferidos
- 1 PR único con MVP cohesivo
**Veredicto**: PASS

### Principio V — UI Honesty
**Cumplimiento**:
- FR-021 explícito
- `markBudgetItemsCompleted(itemIds, appointmentId)` usa `.select('id')` y valida count == len(itemIds)
- `registerSessionPayment` existente ya valida select (verificar en research)
**Veredicto**: PASS

### Principio VI — Schema Drift Zero
**Cumplimiento**:
- 3 columnas nuevas en migration (status, completed_at, completed_in_appointment_id)
- CHECK constraint expansion en migration
- 2 RLS policies en migration
- 1 trigger en migration
**Veredicto**: PASS

**RESULTADO GENERAL**: PASS — 6/6, sin violaciones, sin justificaciones de complejidad necesarias.

## Project Structure

### Documentation (this feature)

```text
specs/030-treatment-budget-progress/
├── plan.md
├── spec.md
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output con smoke E2E Cristobal+Solange
├── contracts/
│   ├── migration-20260604000001.md
│   └── frontend-component-contracts.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (de /speckit-tasks)
```

### Source Code (repository root)

```text
DentalSpot/
├── supabase/
│   └── migrations/
│       └── 20260604000001_budget_items_status_and_audit.sql   # NEW
│
├── src/
│   ├── features/
│   │   ├── odontogram/
│   │   │   ├── components/
│   │   │   │   └── Odontogram.jsx               # EDIT — sincroniza items del budget al marcar tratamiento
│   │   │   ├── pages/
│   │   │   │   └── OdontogramEvaluationPage.jsx # EDIT — guard de sync al guardar
│   │   │   └── api/
│   │   │       └── budgetSyncApi.js             # NEW — helpers "crear item desde odontograma"
│   │   │
│   │   └── post-session/
│   │       ├── components/
│   │       │   ├── PostSessionModal.jsx          # EDIT — inserta step "Items completados"
│   │       │   └── BudgetItemsChecklistStep.jsx  # NEW
│   │       └── api/
│   │           └── postSessionApi.js              # EDIT — extender registerSessionPayment con budget_id
│   │
│   └── lib/
│       └── api/
│           └── budgetApi.js                       # NEW — mark completed, revert, fetch pending
```

**Structure Decision**: Monorepo SPA. Cambios concentrados en `src/features/odontogram` (US3) y `src/features/post-session` (US1). Nuevo módulo `src/lib/api/budgetApi.js` agrupa operaciones para evitar duplicación entre los 2 features.

## Complexity Tracking

> Sin violaciones del Constitution Check. Sección vacía.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | (none)     | (none)                               |
