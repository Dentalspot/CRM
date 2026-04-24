# Feature Specification: Clinic Admin Rich Calendar

**Feature Branch**: `025-clinic-admin-rich-calendar`
**Created**: 2026-04-24
**Status**: Draft
**Input**: User description:

> Replicar el calendario rich del asistente (spec 024) para el clinic_admin en
> `/dashboard/clinic/agendas`. El admin de clínica tendrá paridad visual/funcional
> con el asistente — grid semanal tipo Google Calendar con drag-to-create citas,
> drag para bloquear horas, click para editar, drag-to-move para reprogramar.

Spec 024 (Assistant Rich Calendar) dejó la arquitectura preparada: el componente
`OrgCalendarView` es genérico y acepta prop `scope='assistant'|'clinic_admin'`.
El servicio `org.api.js` es RLS-transparent (appt_admin_* policies ya existen).
Este spec es principalmente un wire-up + verificación de policies faltantes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Clinic admin ve calendario rich de un dentista de su equipo (Priority: P1)

El admin de la clínica entra a su sección de Agendas y ve un calendario semanal
visual tipo Google Calendar (mismo que su asistente). Elige un dentista del
equipo en un selector, y ve la agenda completa de ese dentista: citas con
colores por estado, horas bloqueadas en rojo, slots libres según disponibilidad.

**Why this priority**: base del feature — sin esto el resto no funciona. Permite
al admin supervisar la agenda del equipo sin depender del asistente. Critical
path: UI renderiza correctamente + data flow funciona + RLS permite lectura.

**Independent Test**: Login como clinic_admin de una clínica con ≥1 dentista
activo con citas. Navegar a Agendas. Ver grid semanal. Navegar semanas. Aplicar
filtro por estado. Validar que citas/bloqueos/slots se muestran correctamente.

**Acceptance Scenarios**:

1. **Given** clinic_admin logueado con clínica que tiene 2 dentistas y 5 citas
   esta semana,
   **When** navega a `/dashboard/clinic/agendas`,
   **Then** ve el calendario rich con selector de dentista (dropdown con los 2
   dentistas listados por nombre) y por default muestra la agenda del primer
   dentista alfabético con las citas correspondientes.

2. **Given** clinic_admin en calendario con dentista seleccionado,
   **When** elige otro dentista del selector,
   **Then** el calendario se actualiza con la agenda del nuevo dentista
   seleccionado en menos de 2 segundos.

3. **Given** clinic_admin en calendario de cualquier dentista,
   **When** hace click en el botón "Hoy",
   **Then** el calendario salta inmediatamente a la semana que contiene la
   fecha actual.

4. **Given** clinic_admin de una clínica sin dentistas activos,
   **When** entra a Agendas,
   **Then** ve mensaje claro "Esta clínica aún no tiene dentistas asociados.
   Invitá al primer dentista desde Gestión de Personal." (o similar).

---

### User Story 2 — Clinic admin crea cita con drag-to-create (Priority: P1)

El admin puede gestionar la agenda directamente sin pasar por el asistente.
Drag sobre slot libre → modal con autocomplete de paciente y servicios del
dentista → submit → cita aparece en el grid.

**Why this priority**: el admin debe poder operar sin depender del asistente
(especialmente si la clínica no tiene asistente aún o fuera del horario de
recepción). Funcionalidad core del calendario.

**Independent Test**: Con clinic_admin + dentista seleccionado + pacientes en
la org + servicios activos del dentista: drag → modal → seleccionar paciente
+ servicio → crear → cita aparece.

**Acceptance Scenarios**:

1. **Given** clinic_admin en calendario de Dr. X con slot libre Martes 10:00-11:00,
   **When** arrastra desde 10:00 hasta 11:00 + selecciona paciente "Ana" +
   servicio "Consulta general" + Crear cita,
   **Then** la cita se crea en DB con therapist_id=Dr. X, patient_id=Ana,
   organization_id correcto. Toast "Cita creada" aparece. Bloque azul
   renderizado en el grid.

2. **Given** clinic_admin arrastra sobre un slot que ya tiene cita,
   **When** suelta el drag,
   **Then** aparece mensaje de conflicto "Ya existe una cita en ese horario"
   sin abrir el modal.

---

### User Story 3 — Clinic admin bloquea hora con drag (Priority: P1)

El admin recibe llamada del dentista: "no voy a poder estar de 14 a 15 mañana".
El admin va al calendario del dentista y bloquea ese rango con drag.

**Why this priority**: capacidad operacional básica. Sin esto el admin tiene
que pedirle al asistente o al dentista que bloquee (fricción innecesaria).

**Independent Test**: Con clinic_admin + dentista seleccionado + slot libre:
drag entre slots → Dialog pide razón opcional → confirmar → bloqueo rojo
aparece + row en blocked_times DB con therapist_id del dentista.

**Acceptance Scenarios**:

1. **Given** clinic_admin en calendario de Dr. X con slot libre 14:00-15:00,
   **When** arrastra entre esos slots + escribe razón "Reunión" + Bloquear,
   **Then** se crea row en `blocked_times` con therapist_id=Dr. X, rango
   correcto, reason="Reunión". Bloque rojo semitransparente visible.

2. **Given** bloqueo creado,
   **When** clinic_admin click en el bloque rojo,
   **Then** aparece Dialog "¿Desbloquear esta hora?" con info del rango.
   Al confirmar → row eliminada + slot vuelve a libre.

---

### User Story 4 — Clinic admin edita / cancela cita (Priority: P2)

Admin gestiona ciclo de vida de citas existentes: cambiar estado a confirmada,
completada, cancelada o ausente. También puede mover cita con drag-to-move.

**Why this priority**: frecuente pero no bloqueante para MVP — el dentista o
asistente también puede hacerlo. Si este bloque falla, US1-US3 siguen útiles.

**Independent Test**: Click en cita existente → modal edit con datos cargados
→ cambiar campo (ej. status=confirmed) → guardar → cita actualiza visualmente
+ UPDATE en DB.

**Acceptance Scenarios**:

1. **Given** cita existente scheduled Martes 10:00,
   **When** clinic_admin clickea, cambia status a "Confirmada", Guardar,
   **Then** cita cambia a color azul (confirmed). `appointments.status`
   actualizado + `updated_at` refresh.

2. **Given** cita scheduled en Martes 10:00,
   **When** clinic_admin arrastra la cita a Miércoles 11:00,
   **Then** la cita se mueve. DB refleja date=Miércoles, start_time=11:00.

---

### Edge Cases

- **RLS faltante en blocked_times para clinic_admin**: si no existen policies
  `blocked_times_admin_*`, el INSERT del US3 va a fallar silenciosamente o con
  error RLS. Spec requiere verificar + crear si falta.
- **Clinic admin sin organization_members.role='clinic_admin'**: si el usuario
  tiene `profile.role='clinic'` pero no tiene membresía activa en
  organization_members con role='clinic_admin', el selector de dentista va a
  estar vacío. Mostrar mensaje claro.
- **Legacy page `ClinicAgendasPage`**: al deprecar, verificar que no hay imports
  residuales ni links del sidebar apuntando al componente viejo.
- **Cascade del trigger de reminders**: si `scheduled_reminders_admin_insert`
  policy no existe, el INSERT de cita falla por trigger. Verificar + crear.
- **Paridad visual con asistente**: el admin debe ver la MISMA UI que el
  asistente, solo cambiando el wording si es necesario (ej. "Vista recepción"
  → "Vista administrativa"). No agregar features extra en este spec.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistema DEBE montar `ClinicAdminCalendarPage` en la ruta
  `/dashboard/clinic/agendas`, reemplazando a `ClinicAgendasPage` (vista lista).
- **FR-002**: `ClinicAdminCalendarPage` DEBE renderizar `OrgCalendarView` con
  prop `scope='clinic_admin'` y `organizationId` del `useCurrentOrganization`.
- **FR-003**: Todas las funcionalidades del calendario (selector dentista,
  navegación, filtros, drag-to-create, bloquear, editar, mover) DEBEN funcionar
  idénticamente a como lo hacen para el asistente en `/dashboard/assistant/agenda`.
- **FR-004**: Sistema DEBE verificar/crear policies RLS necesarias para que
  `clinic_admin` pueda INSERT/UPDATE/DELETE en `blocked_times` y `scheduled_reminders`
  para dentistas de su organización. Si faltan, agregar migration análoga a las
  del spec 024.
- **FR-005**: Sistema DEBE escribir audit log via `logClinicalAccess` cuando el
  clinic_admin toca datos de pacientes ajenos (misma lógica del asistente —
  `useClinicalAccessLogger` ya incluye role='clinic_admin').
- **FR-006**: El módulo debe proveer un mensaje claro cuando la clínica no tiene
  dentistas activos, invitando a agregarlos desde Gestión de Personal.
- **FR-007**: La ruta vieja del componente lista (`ClinicAgendasPage.jsx`) DEBE
  eliminarse o marcarse como deprecated post-implementación sin romper imports.

### Key Entities

Sin cambios de schema. Reusa las mismas entidades de spec 024:
- `organization_members` (role='clinic_admin' + role='dentist')
- `appointments` (policies admin_* ya existen)
- `blocked_times` (policies admin_* a verificar)
- `scheduled_reminders` (policies admin_* a verificar)
- `patients`, `profiles`, `therapist_services`, `clinical_audit_log` — reusadas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El clinic_admin puede visualizar la agenda semanal de cualquier
  dentista de su clínica en menos de 2 segundos desde el click en selector.
- **SC-002**: El clinic_admin puede crear, bloquear, editar y mover citas con
  la misma UX que el asistente. 0 diferencias funcionales en los 4 flows P1-P2.
- **SC-003**: 0 regresiones en el calendario del asistente tras este spec.
  La compartición del componente `OrgCalendarView` no debe introducir bugs
  visibles para el rol assistant.
- **SC-004**: 0 eventos de RLS violation en producción para el clinic_admin al
  crear/editar/bloquear/eliminar. Verificable post-deploy por ausencia de
  errores en Sentry.
- **SC-005**: 95% de los drag-to-create completan exitosamente cuando los datos
  de entrada son válidos (mismo criterio que spec 024 SC-008).
- **SC-006**: Migración de ruta sin downtime — el deploy no rompe la URL
  `/dashboard/clinic/agendas` en tránsito.

## Assumptions

- **Paridad exacta con asistente**: este spec NO agrega features extras para
  el clinic_admin (reasignar dentista, ver reportes, etc.). Solo replica la
  experiencia del asistente para simetría.
- **OrgCalendarView genérico**: ya está diseñado con el prop `scope`. No
  requiere refactor.
- **RLS appt_admin_***: ya existen desde spec 023 RLS phase 1.
- **useClinicalAccessLogger**: ya filtra por role='clinic_admin' (Constitution v1.1.0).
- **Policies faltantes**: es probable que `blocked_times_admin_*` y
  `scheduled_reminders_admin_insert` NO existan (spec 023 solo agregó para
  asistente). Verificar y crear en una migration nueva.
- **Mobile responsive**: desktop-only (mismo criterio que spec 024).
- **No hay cambios en sidebar**: el link "Agendas" ya existe (agregado en
  spec 023 Phase B) — solo cambia qué page monta.
- **ClinicAgendasPage deprecation**: se borra el archivo una vez verificado
  que no hay imports. O se mueve a `_deprecated/` como pattern usado en
  spec 024 con AssistantAgendaPage.
- **Reminders automáticos**: el trigger AFTER INSERT sobre appointments ya
  crea scheduled_reminders. Aplica también a citas creadas por el admin.

## Dependencies

- **Spec 024 (assistant-rich-calendar) DONE + DEPLOYED** — este spec construye
  sobre el componente genérico `OrgCalendarView` y servicio `org.api.js`.
- **Spec 023 (invite-assistant-flow) DONE** — clinic_admin role ya modelado.
- **Migration `20260415100007_rls_phase1_administrative.sql`** — policies
  appt_admin_* ya vivas en prod.
- **Tabla `organization_members`** con role='clinic_admin' para identificar al
  admin activo de una org.
- **Componentes existentes** a reusar sin modificar:
  - `src/components/calendar/OrgCalendarView.jsx`
  - `src/components/calendar/WeeklyAgendaView.jsx`
  - `src/components/calendar/assistant/AssistantAppointmentModal.jsx`
  - `src/lib/api/org.api.js`
  - `src/hooks/useCurrentOrganization.js`

## Out of Scope

- Reasignar cita a otro dentista (cambiar therapist_id de una cita existente).
- Vista multi-dentista simultánea (columnas por dentista) — P3 backlog spec 024.
- Gestionar `therapist_availability` base del dentista (solo el dentista lo edita).
- Resize handles de citas (ya deferred en spec 024 backlog).
- Diferenciación visual admin vs asistente — ambos ven el mismo UI.
- Features admin-only (ver reportes financieros, exportar agenda, etc.) —
  fuera de este spec.
