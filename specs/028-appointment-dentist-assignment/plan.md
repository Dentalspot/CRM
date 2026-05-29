# Implementation Plan: Appointment Dentist Assignment

**Branch**: `028-appointment-dentist-assignment` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/028-appointment-dentist-assignment/spec.md`

## Summary

Asignar formalmente un dentista responsable a cada cita en DentalSpot. La columna `appointments.therapist_id` (nombre legacy heredado de Communicare/FONOKIT) YA existe en el schema actual con FK a `profiles(id)` y `NOT NULL` — el feature reutiliza esa columna sin cambios de esquema, pero agrega:

1. Un **trigger de validación cruzada** que confirma en cada INSERT/UPDATE que el `therapist_id` asignado es un miembro activo con rol `dentist` en la misma organización que la cita
2. **Refuerzo de RLS UPDATE** para que los dentistas solo puedan reasignar SUS propias citas a colegas de la misma org (FR-014)
3. **Ampliación del CHECK constraint** de `clinical_audit_log` para aceptar nuevas acciones (`appointment_reassigned`, `view`, `create`, `update`, `cancel`) y `resource_type='appointment'` — necesario para FR-016/017 y para arreglar incidentalmente un bug silencioso pre-existente (los inserts actuales del módulo asistente caían en CHECK violation y fallaban silenciosamente)
4. **Selector explícito de dentista** en los dos modales de agendamiento (`AppointmentModal.jsx` para dentista, `AssistantAppointmentModal.jsx` para asistente/admin) con defaults inteligentes por rol
5. **Filtro de dentista** en `OrgCalendarView.jsx` con default "Todos los dentistas" persistido en URL (reemplaza el actual selector single-dentist), más coloreado consistente por dentista en cada chip del calendario
6. **Logging de auditoría completo** en create/update/cancel/reassign con el `dentist_id` (action `appointment_reassigned` cuando cambia)

Out of scope explícito: NO se toca `CalendarPage.jsx` (dentista) ni `AgendaSidebar.jsx` — el dentista ya está RLS-bound a sus propias citas, agregar el filtro ahí no aporta. La página dentista del feature recibe únicamente el dropdown obligatorio dentro de su `AppointmentModal.jsx` por consistencia, con default automático = self.

## Technical Context

**Language/Version**: JavaScript ES2022 (React 18, JSX, transpiled by Vite 4.4)
**Primary Dependencies**: React 18, react-router-dom 6 (URL param sync), Tailwind 3 + shadcn/ui (Select, Dialog), `@supabase/supabase-js` 2.99, `framer-motion` (modal transitions), `date-fns` 2.30, `lucide-react` icons
**Storage**: Supabase PostgreSQL — tablas `appointments`, `organization_members`, `profiles`, `clinical_audit_log` (todas pre-existentes). Sin nuevas tablas
**Testing**: Smoke test manual con cuenta Cristobal (dentista+admin) + cuenta Tatiana (asistente) en Odontología Los Álamos. Sin tests automatizados (DentalSpot no tiene framework de tests aún — documentado en `.specify/memory/architecture.md` como deuda)
**Target Platform**: Browser SPA (Chrome/Safari/Edge ≥ 2 versions back). Mobile responsive vía Tailwind breakpoints
**Project Type**: SPA web (frontend React + backend Supabase serverless), monorepo único en `src/`
**Performance Goals**: Filtro de dentista < 1s (SC-007) — query con índice existente en `appointments(organization_id, date, status)`. Selector de dentista en modal carga < 300ms (query existente `getOrgDentists` usa tabla con ≤ 10 dentistas por org)
**Constraints**:
  - RLS-first (Constitution §II): policies hacen el cumplimiento real, UI es solo UX
  - Append-only audit (Constitution §III): `clinical_audit_log` no admite UPDATE/DELETE — agregar acciones via INSERT
  - UI Honesty (Constitution §V): toda mutación valida `.select('id').length > 0` antes de toast verde
  - Schema Drift Zero (Constitution §VI): cualquier columna usada en código debe existir en migrations/
**Scale/Scope**:
  - 22 functional requirements (FR-001 a FR-022)
  - 5 user stories priorizadas P1-P3
  - 1 migration nueva (~80 líneas: trigger + RLS update + CHECK expand)
  - 4 archivos frontend tocados (`OrgCalendarView`, `AssistantAppointmentModal`, `AppointmentModal`, `org.api.js`)
  - 1 utility nuevo (`getDentistColor` en `WeeklyAgendaView.jsx` o helper aparte)
  - 0 nuevos componentes principales — todo extensión de existentes

## Constitution Check

*GATE: Debe pasar antes de Phase 0 research. Re-check después de Phase 1 design.*

### Principio I — Compliance-First (NON-NEGOTIABLE)
**Aplicabilidad**: ALTA. La cita es la operación administrativa central que conecta a un profesional con un paciente. Saber qué profesional atendió a qué paciente es trazabilidad clínica de Ley 20.584 art. 12.
**Cumplimiento**:
- FR-016 a FR-018 cubren audit log completo (create/update/cancel + reassign)
- El feature CIERRA un gap pre-existente: los audit logs actuales del asistente fallan silenciosamente porque las acciones `'create'`, `'view'`, etc. no pasan la CHECK constraint de `clinical_audit_log_action_check`. La migration de esta spec expande el CHECK para que los inserts funcionen
- Reasignación de profesional responsable queda explícitamente trazada (`appointment_reassigned`), conservando dentista anterior y nuevo en el payload → cumple Ley 21.719 derecho ARCO del paciente a saber quién accedió
- Auto-acceso del paciente exento de logging (Principio III revisado v1.1.0) — el paciente no genera entries cuando ve su propia cita
**Veredicto**: PASS

### Principio II — RLS-First Security (NON-NEGOTIABLE)
**Aplicabilidad**: ALTA. La regla FR-013/FR-014 ("dentista no puede robar cita ajena") debe vivir en DB, no solo en UI.
**Cumplimiento**:
- Migration `20260529000001` ALTERA la policy `appt_dentist_update`: agrega `WITH CHECK` que valida que el nuevo `therapist_id` es un dentista de la misma org (para soportar reasignación a colega) y que `auth.uid()` es el dueño actual (para bloquear robos)
- Trigger BEFORE INSERT/UPDATE valida que `therapist_id` corresponde a un dentista activo de la org de la cita (FR-002, FR-021, FR-022) — esto cubre attacks vía REST directo donde el cliente intenta asignar un dentista de OTRA clínica
- Las policies `appt_admin_update` y `appt_assistant_update` existentes ya permiten al admin/asistente reasignar dentro de su org → no cambio para esos roles
**Veredicto**: PASS

### Principio III — Append-Only Clinical Audit (NON-NEGOTIABLE)
**Aplicabilidad**: ALTA. La cita conecta a un profesional con datos clínicos (la ficha del paciente).
**Cumplimiento**:
- Actor: `dentist`, `clinic_admin`, `assistant` — los tres son "terceros" según definición del Principio v1.1.0 → audit log obligatorio en create/update/cancel/reassign
- Se invoca `logClinicalAccess` desde `AppointmentModal.jsx` (dentista) Y `AssistantAppointmentModal.jsx` (asistente/admin) — el segundo ya lo invoca; el primero hoy NO lo invoca (hueco pre-existente que esta spec cierra como bonus)
- Se agrega vocabulario al CHECK constraint: `'appointment_reassigned'`, `'view'`, `'create'`, `'update'`, `'cancel'` + `resource_type='appointment'` — los inserts dejan de fallar silenciosamente
- El append-only trigger `trg_audit_log_no_update` existente NO se toca (sigue bloqueando UPDATE/DELETE)
- Edge case: paciente accediendo a SU PROPIA cita NO genera log (el `useClinicalAccessLogger` hace early return si actor no es rol clínico) — alineado a Ley 20.584 art. 13
**Veredicto**: PASS

### Principio IV — Micro-Bloques con Plan Previo (NON-NEGOTIABLE)
**Aplicabilidad**: TOTAL. Este es un spec de feature único, no refactor mezclado.
**Cumplimiento**:
- Scope cerrado: 1 migration + 4 archivos frontend + 1 util + extensión de `org.api.js`. Estimado 3-4 horas.
- Out of scope explícito: booking online paciente, `clinic_box_dentists`, disponibilidad por dentista, push notifications, refactor del audit logger vocabulary (solo expandimos CHECK, no renombramos call sites existentes)
- Fix incidental: el bug silencioso de audit log para appointments se arregla porque expande el CHECK constraint que lo bloqueaba. NO se refactorizan los call sites — siguen usando `'view'`, `'create'`, etc. tal cual; el CHECK ahora los acepta. Esto NO es scope creep porque el audit log para appointments es directamente requerido por FR-016/017 de esta spec.
- Reporte post-implementación obligatorio (Constitution dev workflow): qué se tocó, qué quedó sin tocar, qué smokes pasaron
**Veredicto**: PASS

### Principio V — UI Honesty (NON-NEGOTIABLE)
**Aplicabilidad**: TOTAL. Hay mutaciones (insert + update de appointments + insert audit log).
**Cumplimiento**:
- `createOrgAppointment` y `updateOrgAppointment` en `org.api.js` YA validan `.maybeSingle()` y throw si data es null (UI Honesty pattern correcto, heredado de spec 024)
- `AppointmentModal.jsx` (dentista) — el `handleSubmitCita` existente usa `.insert().select().single()` → si RLS rechaza, throw. Mantenemos el patrón
- Validación FE: el botón "Confirmar" queda disabled si no hay dentista seleccionado (UI bloquea el submit antes de enviar)
- El audit log INSERT NO bloquea la UX — si falla, console.warn pero el toast verde no aparece falsamente porque la cita SÍ se creó
**Veredicto**: PASS

### Principio VI — Schema Drift Zero (NON-NEGOTIABLE)
**Aplicabilidad**: TOTAL.
**Cumplimiento**:
- `appointments.therapist_id` YA existe en migration `20260401000000_baseline_schema.sql:3026` con FK a `profiles(id) ON DELETE CASCADE` — no agregamos columna
- `clinical_audit_log.action` CHECK ampliada en migration nueva — todo lo usado en JS existe en SQL
- `clinical_audit_log.resource_type` CHECK ampliada — `'appointment'` ahora aceptado
- No hay columnas nuevas, todos los cambios son CHECK constraint widening + 1 trigger function nuevo + ALTER de 1 RLS policy
- Quickstart incluye verificación manual: pegar lista de columnas/CHECK en SQL editor antes de Implement
**Veredicto**: PASS

**RESULTADO GENERAL**: PASS — sin violaciones, sin excepciones, sin justificaciones de complejidad necesarias.

## Project Structure

### Documentation (this feature)

```text
specs/028-appointment-dentist-assignment/
├── plan.md              # This file
├── spec.md              # Feature specification (existing)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── migration-20260529000001.md   # SQL contract de la migration
│   └── frontend-component-contracts.md # Props/state cambios en JSX
├── checklists/
│   └── requirements.md  # Existing (from speckit-specify)
└── tasks.md             # Phase 2 output (speckit-tasks command - NOT created here)
```

### Source Code (repository root)

```text
DentalSpot/                                              # repo root
├── supabase/
│   └── migrations/
│       └── 20260529000001_appointment_dentist_assignment.sql  # NEW — trigger + RLS + CHECK expand
│
├── src/
│   ├── lib/
│   │   ├── api/
│   │   │   └── org.api.js                              # EXTEND — getOrgAppointments admite therapistId=null
│   │   └── audit/
│   │       ├── clinicalAuditLogger.js                  # NO CHANGE
│   │       └── useClinicalAccessLogger.js              # NO CHANGE
│   │
│   ├── components/
│   │   └── calendar/
│   │       ├── OrgCalendarView.jsx                     # EDIT — dropdown "Todos los dentistas" + URL sync + color coding
│   │       ├── WeeklyAgendaView.jsx                    # EDIT — getDentistColor helper + border-l-4 + footer dentista en chip
│   │       ├── AppointmentModal.jsx                    # EDIT — dentista selector con default self + audit logging
│   │       └── assistant/
│   │           └── AssistantAppointmentModal.jsx       # EDIT — dentista selector explícito (default smart) + reassign permission gate
│   │
│   └── pages/
│       └── CalendarPage.jsx                            # NO CHANGE (dentista RLS-bound, no aplica filtro)
│
└── .specify/
    └── memory/
        └── architecture.md                             # NO CHANGE (no nueva canonical pattern introducida)
```

**Structure Decision**: Monorepo SPA — todos los cambios viven bajo `src/components/calendar/` y `src/lib/api/`, más una migration SQL. Sin reorganización de carpetas, sin nuevos directorios. El feature es una extensión de componentes existentes (OrgCalendarView de spec 024, AppointmentModal de la base, AssistantAppointmentModal de spec 024), no una nueva vertical.

## Complexity Tracking

> Sin violaciones del Constitution Check — sin justificaciones requeridas. Esta sección queda vacía.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | (none)     | (none)                               |
