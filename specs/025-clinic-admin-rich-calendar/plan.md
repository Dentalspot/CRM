# Implementation Plan: Clinic Admin Rich Calendar

**Branch**: `025-clinic-admin-rich-calendar` | **Date**: 2026-04-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/025-clinic-admin-rich-calendar/spec.md`

## Summary

Wire-up del calendario rich existente (spec 024) para el rol `clinic_admin` en la ruta `/dashboard/clinic/agendas`. Reusa íntegramente:
- `OrgCalendarView` (ya acepta `scope='clinic_admin'`)
- `AssistantAppointmentModal` (agnóstico al role — solo toca RLS)
- `org.api.js` (10 funciones RLS-transparent)
- `WeeklyAgendaView` sin modificar

**Alcance de código**: ~50 líneas netas nuevas.
**Alcance de DB**: 1 migration nueva con policies faltantes.

## Technical Context

**Language/Version**: JavaScript ES2022+ / React 18.2 / JSX
**Primary Dependencies**: Mismas que spec 024 — sin agregar nada
**Storage**: Supabase PostgreSQL — mismas tablas que spec 024
**Testing**: Smoke manual post-deploy (patrón validado en 023/024)
**Target Platform**: Browser desktop (Chrome/Safari/Firefox modernos)
**Project Type**: Web application (SPA)
**Performance Goals**: ≤ 2s carga calendar (SC-001) — ya alcanzado en spec 024
**Constraints**:
- Cero refactor de `OrgCalendarView` o `WeeklyAgendaView` (Constitution §IV)
- Cero regresiones en el calendario del asistente (SC-003)
- RLS enforcement a nivel DB (§II)
- Audit log obligatorio cuando clinic_admin toca data de paciente ajeno (§III)
**Scale/Scope**: 1 page nueva (~30 líneas) + 1 migration RLS (~80 líneas SQL) + 1 route update. Estimación: 1-2h total.

## Constitution Check

*GATE: Must pass before Phase 0 research.*

### I. Compliance-First ✅
- Ley 20.584 art. 12: clinic_admin ve datos administrativos (mismo modal que asistente, sin ficha clínica). Compliance heredado spec 024.
- Ley 21.719: minimización de datos vía `searchOrgPatients` (solo nombre/email/phone).
- **PASA**.

### II. RLS-First Security ✅
- `appt_admin_*` policies YA existen (spec 023 phase 1, líneas 178-185 de `20260415100007`).
- `blocked_times_admin_*` policies **NO existen** → migration obligatoria.
- `scheduled_reminders_admin_*` policies **NO existen** → idem.
- **Gate condicional** a la creación de la migration. PASA con ese plan.

### III. Append-Only Audit ✅
- `useClinicalAccessLogger` ya filtra role='clinic_admin' (Constitution v1.1.0).
- El mismo `logClinicalAccess` call del asistente funciona para admin (mismos action/resource_type).
- **Nota**: el audit log técnicamente falla por CHECK constraint (mismo issue que spec 024 — followup registrado). No bloqueante.
- **PASA**.

### IV. Micro-Bloques ✅
- Scope único: wire-up clinic_admin + policies faltantes.
- No refactor. No features extra (reasignar dentista, multi-dentista, resize — todos out of scope documentados en spec).
- **PASA**.

### V. UI Honesty ✅
- Heredado de spec 024: mutaciones usan `.select('id')` + `throw if !data`.
- **PASA**.

### VI. Schema Drift Zero ✅
- Cero cambios de columnas/tablas.
- Migration RLS en `supabase/migrations/` con código que la usa en el mismo PR.
- **PASA**.

**Total: 6/6 principios PASS** (condicional a migration RLS nueva).

## Project Structure

### Documentation (this feature)

```text
specs/025-clinic-admin-rich-calendar/
├── plan.md              # This file
├── research.md          # Phase 0 — 5 decisiones técnicas
├── data-model.md        # Phase 1 — entidades (todas reutilizadas, 0 nuevas)
├── contracts/           # Phase 1 — sin contratos nuevos (reusa org.api.js de spec 024)
│   └── README.md        # Link al contrato existente en spec 024
├── quickstart.md        # Phase 1 — smoke test runbook
├── checklists/
│   └── requirements.md  # Ya creado por /speckit-specify ✓
└── tasks.md             # Phase 2 — output de /speckit-tasks
```

### Source Code (repository root)

```text
supabase/
└── migrations/
    └── 20260424000004_blocked_times_reminders_admin_rls.sql   # NUEVO — 6 policies

src/
├── features/
│   └── clinic-dashboard/
│       └── ClinicAdminCalendarPage.jsx                        # NUEVO — wrapper fino
├── components/
│   └── calendar/
│       ├── OrgCalendarView.jsx                                # SIN CAMBIOS (ya genérico)
│       └── assistant/
│           └── AssistantAppointmentModal.jsx                  # SIN CAMBIOS (agnóstico de role)
├── pages/
│   └── clinic/
│       └── ClinicAgendasPage.jsx                              # ELIMINADO (deprecado)
├── lib/
│   └── api/
│       └── org.api.js                                         # SIN CAMBIOS
└── app/
    └── routers/
        └── DashboardRouter.jsx                                # MODIFICADO — cambia componente de ruta
```

**Structure Decision**:
- `ClinicAdminCalendarPage` vive en `src/features/clinic-dashboard/` (simetría con `AssistantCalendarPage` en `src/features/assistant/pages/`).
- `AssistantAppointmentModal` se **reusa sin renombrar** (futuro refactor: `OrgAppointmentModal` para simetría conceptual — out of scope).
- Migration `20260424000004` continúa la serie del spec 024 (000001/000002/000003).

## Complexity Tracking

> No hay violaciones de constitución. Sección no aplica.
