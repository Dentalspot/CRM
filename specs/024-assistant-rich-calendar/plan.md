# Implementation Plan: Assistant Rich Calendar

**Branch**: `024-assistant-rich-calendar` | **Date**: 2026-04-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/024-assistant-rich-calendar/spec.md`

## Summary

Traer el calendario rich tipo Google Calendar (hoy exclusivo del dentista en `/dashboard/calendar`) al dashboard del asistente en `/dashboard/assistant/agenda`. El asistente podrá ver la agenda semanal de un dentista de su clínica seleccionado, crear citas arrastrando sobre slots libres, bloquear horas con drag, editar y cancelar citas existentes, y redimensionar duraciones visualmente.

**Enfoque técnico**:
- Crear un componente **genérico** `OrgCalendarView` que encapsula la lógica de calendario scopeado por `organization_id`, **reutilizable tanto para el asistente como para el clinic_admin** en un spec 025 futuro (micro-bloques — validado con usuario).
- Reusar `WeeklyAgendaView` sin modificar (ya es genérico — acepta arrays de appointments/blocked_times/availability como props).
- Crear un servicio nuevo `org.api.js` paralelo a `therapist.api.js` con funciones scopeadas por `organization_id + therapist_id` (ej. `getOrgAppointments`, `getOrgBlockedTimes`, `getOrgAvailability`).
- Agregar RLS policies faltantes para `blocked_times` (asistente puede INSERT/UPDATE/DELETE bloqueos de dentistas de su org) y `appointments_delete_*` si se decide permitir hard-delete (hoy solo cancel via status).

## Technical Context

**Language/Version**: JavaScript ES2022+ (React 18.2, JSX)
**Primary Dependencies**: React 18 · react-router-dom 6 · date-fns 2.30 · @supabase/supabase-js 2.99 · framer-motion · shadcn/ui (Dialog, Select, Button, Card, Badge, DropdownMenu) · lucide-react icons. NO se agrega ninguna dependencia nueva.
**Storage**: Supabase PostgreSQL — tablas existentes: `appointments`, `blocked_times`, `therapist_availability`, `therapist_services`, `patients`, `profiles`, `organization_members`, `clinics`, `clinical_audit_log`. Sin cambios de schema salvo posibles policies RLS nuevas.
**Testing**: Manual smoke test post-deploy guiado (patrón validado en spec 023). Sin unit tests automatizados (coherente con codebase).
**Target Platform**: Browser desktop (Chrome/Safari/Firefox modernos). Mobile responsive no es goal MVP (asistente trabaja en laptop/desktop del mostrador).
**Project Type**: Web application (SPA React + Supabase backend).
**Performance Goals**: Calendario renderiza ≤2s desde click en selector (SC-001), 50fps al navegar semanas con hasta 500 citas/semana (SC-007).
**Constraints**:
- Cero nuevas dependencias npm (Constitution §IV micro-bloques)
- Cero cambios al componente existente `WeeklyAgendaView` (reuso genérico)
- Cero cambios a `CalendarPage.jsx` del dentista (no tocar lo que anda)
- RLS enforcement a nivel DB (Constitution §II) — guards React son UX only
- Audit log obligatorio en acciones del asistente sobre citas (Constitution §III)
**Scale/Scope**: 1 feature, 1 nueva page (`AssistantCalendarPage`), 1 nuevo componente (`OrgCalendarView`), 1 nuevo servicio (`org.api.js`), 0-1 migration nueva (depende de si `blocked_times_*_assistant` policies existen). Estimación: 3-5h de implementación + 30 min smoke test.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Compliance-First ✅

- **Ley 20.584 art. 12**: asistente accede a datos administrativos (agenda, nombre/teléfono paciente) pero NO a ficha clínica. El modal de cita expone solo campos administrativos; botones a ficha clínica detallada **no se renderizan** para role='assistant'.
- **Ley 21.719**: minimización de datos — el autocomplete de pacientes retorna solo nombre/email/phone, no RUT completo.
- **Gate**: documentación legal está en spec §Compliance + FR-028/FR-029. PASA.

### II. RLS-First Security ✅

- Policies `appt_assistant_select/insert/update` **ya existen** (`20260415100007_rls_phase1_administrative.sql` líneas 207-214).
- Policies `blocked_times_*_assistant` **NO existen** — se crearán en migration `20260424XXXXXX_blocked_times_assistant_rls.sql`.
- Policy `appt_assistant_delete` **NO existe** y NO se crea — el asistente cancela via status='cancelled', no hard-delete (Constitution append-only audit).
- Helper `is_org_member(org_id, 'assistant')` existe y filtra `is_active=true`.
- **Gate**: migration pendiente + policies de asistente sobre blocked_times planificadas. PASA condicional a creación de la migration.

### III. Append-Only Clinical Audit ✅

- El asistente es rol "tercero clínico" (profile.role='assistant') — TODO acceso a datos de paciente ajeno debe registrarse.
- Hook `useClinicalAccessLogger` ya filtra por `isClinicalRole()` incluyendo 'assistant' (Constitution v1.1.0 changelog).
- Se invoca el hook en:
  - Crear cita (action='create_appointment', target_patient_id)
  - Abrir modal de edit (action='view_patient_in_appointment')
  - Editar cita (action='edit_appointment')
  - Cancelar cita (action='cancel_appointment')
- Blocked_times (bloqueos del dentista) NO tocan paciente → NO requieren audit log (FR-017).
- **Gate**: audit log cubierto por FR-013, FR-019, FR-027. PASA.

### IV. Micro-Bloques con Plan Previo ✅

- Scope único: calendario rich para asistente. P3 multi-dentista explícitamente marcada opcional en spec → decisión de scope: **P3 NO se implementa en este bloque**, va a backlog/spec futuro (evita expandir a refactor de `WeeklyAgendaView` multi-resource).
- Clinic admin (spec 025 futuro) se contempla en diseño (`OrgCalendarView` reutilizable) pero **NO se implementa** en este bloque.
- Lista de archivos nuevos exacta documentada en Project Structure abajo.
- Lista de archivos modificados: mínima — solo rutas (`DashboardRouter.jsx`).
- Lo que queda fuera: P3 multi-dentista · clinic admin rich calendar · mobile responsive · resize minimum 15min snap (se incluye en P2 básico, sin UX avanzada de drag-handle visual) · vista mensual.
- **Gate**: scope cerrado y documentado. PASA.

### V. UI Honesty ✅

- Todo INSERT/UPDATE de cita usa `.select('id').maybeSingle()` → verifica filas afectadas antes del toast success.
- Drag-to-create: si la validación de overlap client-side pasa pero RLS rechaza, mostrar toast error (no success).
- Blocked_times idem.
- **Gate**: patrón de validación de `data.length > 0` documentado en FR-008 a FR-021. PASA.

### VI. Schema Drift Zero ✅

- Tablas usadas: `appointments`, `blocked_times`, `therapist_availability`, `therapist_services`, `patients`, `profiles`, `organization_members`, `clinics`, `clinical_audit_log`. Todas existen.
- Columnas referenciadas: todas documentadas en spec §Key Entities + verificables contra migrations.
- Migration nueva (`blocked_times_assistant_rls`): commit atómico junto al código que la usa.
- **Gate**: schema cubierto. PASA.

## Project Structure

### Documentation (this feature)

```text
specs/024-assistant-rich-calendar/
├── plan.md              # This file
├── research.md          # Phase 0 — decisiones técnicas y alternativas descartadas
├── data-model.md        # Phase 1 — entidades usadas (ya existentes) + campos clave
├── quickstart.md        # Phase 1 — pasos manuales de verificación post-deploy
├── contracts/           # Phase 1 — contratos de la API del cliente
│   └── org-calendar-api.md
├── checklists/
│   └── requirements.md  # Validación de spec (ya creado por /speckit-specify)
└── tasks.md             # Phase 2 output (lo crea /speckit-tasks, NO /speckit-plan)
```

### Source Code (repository root)

```text
supabase/
└── migrations/
    └── 20260424XXXXXX_blocked_times_assistant_rls.sql    # NUEVO — policies para assistant

src/
├── features/
│   ├── assistant/
│   │   └── pages/
│   │       └── AssistantCalendarPage.jsx                 # NUEVO — reemplaza AssistantAgendaPage
│   └── therapist/
│       └── services/
│           └── therapist.api.js                          # SIN CAMBIOS (reusable patterns)
├── components/
│   ├── calendar/
│   │   ├── WeeklyAgendaView.jsx                          # SIN CAMBIOS (ya es genérico)
│   │   ├── AppointmentModal.jsx                          # LECTURA — posible prop extensible
│   │   ├── BlockTimeModal.jsx                            # LECTURA — posible prop extensible
│   │   └── OrgCalendarView.jsx                           # NUEVO — wrapper reutilizable assistant/clinic_admin
│   └── calendar/assistant/                               # NUEVO subdir — modales adaptados
│       ├── AssistantAppointmentModal.jsx                 # NUEVO — lean wrapper de AppointmentModal con scope='assistant' + audit
│       └── AssistantBlockTimeModal.jsx                   # NUEVO — lean wrapper
├── lib/
│   └── api/
│       └── org.api.js                                    # NUEVO — paralelo a therapist.api.js, scopeado por org
├── app/
│   └── routers/
│       └── DashboardRouter.jsx                           # MODIFICADO — route assistant/agenda apunta a Calendar
└── lib/
    └── audit/
        └── useClinicalAccessLogger.js                    # SIN CAMBIOS (ya soporta role='assistant')
```

**Structure Decision**:
- Single project (SPA React + Supabase). No hay backend separado — cambios viven en `src/` + `supabase/migrations/`.
- Seguimos pattern existente: una page por role bajo `src/features/<role>/pages/`, componentes compartidos en `src/components/calendar/`.
- `OrgCalendarView` vive en `src/components/calendar/` (no en `src/features/assistant/`) porque será reusado por clinic_admin (spec 025) — evita mover archivos después.
- Los modales adaptados viven en `src/components/calendar/assistant/` como wrappers finos que fuerzan audit logger + parámetros específicos del asistente. Permite que `CalendarPage.jsx` del dentista siga usando los modales originales sin audit duplicado.

## Complexity Tracking

> No hay violaciones de constitución. Sección no aplica.
