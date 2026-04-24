# Feature Specification: Assistant Rich Calendar

**Feature Branch**: `024-assistant-rich-calendar`
**Created**: 2026-04-24
**Status**: Draft
**Input**: User description:

> Extender el dashboard del asistente con un calendario rich tipo Google Calendar
> (paridad con el del dentista) para que el asistente pueda gestionar agenda de
> forma visual: ver semana completa con citas + horas bloqueadas + slots libres,
> crear citas arrastrando sobre slots vacíos, bloquear horas con drag,
> redimensionar duración de citas, editar y cancelar citas existentes.
>
> Hoy el asistente tiene una vista lista día-por-día (`AssistantAgendaPage`) con
> tabla de citas y filtros por dentista/estado. El dentista en cambio tiene
> `CalendarPage` con `WeeklyAgendaView` (grid semanal, drag-to-create, resize,
> block times). Este spec trae esa capa visual al asistente, scopeado por
> `organization_id` (el asistente ve agenda de TODOS los dentistas de su clínica,
> no de uno solo).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Ver agenda semanal rica de un dentista seleccionado (Priority: P1)

El asistente administrativo de una clínica entra a su sección de agenda y puede
elegir uno de los dentistas del equipo de su clínica. Al seleccionarlo, ve el
calendario semanal de ese dentista en formato grid visual (tipo Google
Calendar) con todas las citas programadas, horas bloqueadas por el dentista y
slots libres disponibles. El asistente puede navegar entre semanas, ir rápido a
la semana actual, y filtrar las citas visibles por estado.

**Why this priority**: Es el core visual del feature — sin esta capa el
asistente no puede "ver" la agenda del equipo como un objeto completo, solo
como lista plana. Desbloquea todas las acciones de gestión visual posteriores
(P1 drag-to-create, P2 editar, P2 resize). Es también la capa mínima que le da
al asistente autonomía operativa comparable al dentista en su propia agenda.

**Independent Test**: Puede testarse standalone ingresando como asistente
activo de una clínica con al menos un dentista asociado que tenga citas en la
semana actual. Se valida que (a) el selector de dentista liste solo dentistas
activos de la misma organización, (b) al elegir uno se cargue el calendario
semanal con citas + bloqueos + slots, (c) la navegación semana-anterior /
semana-siguiente / "Hoy" funcione, (d) las citas se coloreen según estado
(agendada / confirmada / completada / cancelada), (e) las horas bloqueadas
aparezcan en rojo semitransparente, (f) el filtro por estado oculte/muestre
citas coherentemente.

**Acceptance Scenarios**:

1. **Given** asistente activo de Clínica A con dentista Dr. X que tiene 3
   citas confirmadas el Martes de la semana actual,
   **When** el asistente entra a su agenda y elige a Dr. X del selector,
   **Then** ve el grid semanal Lunes-Domingo con las 3 citas coloreadas en
   verde (confirmadas) sobre el Martes en las horas correspondientes.

2. **Given** asistente activo viendo agenda de Dr. X en la semana actual con
   una hora bloqueada "Lunch break" de 13:00 a 14:00 el Miércoles,
   **When** el asistente observa el calendario,
   **Then** el slot 13:00-14:00 del Miércoles aparece en rojo semitransparente
   con el texto "Lunch break" visible.

3. **Given** asistente en semana actual con varias citas en distintos estados,
   **When** aplica el filtro "Solo canceladas",
   **Then** solo quedan visibles las citas en estado cancelado (rojo), el
   resto se oculta.

4. **Given** asistente viendo cualquier semana,
   **When** hace click en el botón "Hoy",
   **Then** el calendario salta inmediatamente a la semana que contiene la
   fecha actual y resalta el día de hoy.

5. **Given** asistente cuya clínica tiene 0 dentistas activos,
   **When** entra a la agenda,
   **Then** ve un mensaje claro "Esta clínica aún no tiene dentistas
   asociados. Contactá al administrador." sin calendario renderizado.

---

### User Story 2 — Crear cita arrastrando sobre un slot libre (Priority: P1)

El asistente, mirando la agenda de un dentista, identifica un slot libre y
arrastra el mouse desde la hora de inicio hasta la hora de fin deseada sobre el
grid. Al soltar, se abre un formulario pre-rellenado con fecha, hora inicio,
hora fin y dentista. El asistente busca al paciente por nombre o RUT, elige un
servicio del dentista, opcionalmente agrega notas administrativas, y guarda. La
cita aparece inmediatamente en el calendario.

**Why this priority**: La creación de citas es la acción más frecuente del
asistente en un flujo de recepción. La forma visual (drag-to-create) es la que
diferencia este spec de la vista lista actual y la razón principal por la que
el usuario pidió el feature.

**Independent Test**: Con asistente activo + dentista seleccionado + al menos
un paciente de la org + el dentista con al menos un servicio activo, validar
que (a) drag desde slot libre abre el modal de creación, (b) el modal tiene
fecha, hora inicio, hora fin y dentista pre-cargados según el drag, (c) la
búsqueda de pacientes autocompleta, (d) el submit crea la cita en DB, (e) la
cita aparece renderizada en el calendario sin refresh manual, (f) se escribe
un log de auditoría en clinical_audit_log (acceso a datos de paciente ajeno).

**Acceptance Scenarios**:

1. **Given** asistente viendo agenda de Dr. X el Martes con el slot 10:00-11:30
   libre, paciente "Ana Soto" existente en la org, Dr. X con servicio
   "Consulta general" activo,
   **When** el asistente arrastra desde 10:00 hasta 11:00 sobre el Martes y
   completa: paciente=Ana Soto, servicio=Consulta general, notas="Primera
   visita",
   **Then** la cita se crea con start_time=10:00, end_time=11:00,
   therapist_id=Dr. X, patient_id=Ana Soto, organization_id=clínica del
   asistente. Aparece un toast "Cita creada" y el bloque aparece en el grid
   en el slot 10:00-11:00 del Martes.

2. **Given** el mismo escenario pero al intentar crear una cita,
   **When** el asistente no selecciona paciente (campo requerido),
   **Then** aparece error inline "Debés seleccionar un paciente" y la cita
   NO se crea.

3. **Given** asistente intenta drag-to-create sobre un slot que ya tiene una
   cita de Dr. X,
   **When** completa el drag,
   **Then** aparece mensaje de conflicto "Ya existe una cita en ese horario
   para este dentista" y el modal no abre (o se abre con warning visible).

4. **Given** asistente crea una cita válida,
   **When** la operación se completa exitosamente,
   **Then** se registra una fila en `clinical_audit_log` con campo
   `action='create_appointment'`, `actor_user_id=asistente`,
   `target_patient_id=paciente`, `timestamp=now()`.

5. **Given** dentista seleccionado que NO tiene servicios activos,
   **When** el asistente intenta drag-to-create,
   **Then** el modal se abre pero muestra warning claro "Este dentista no
   tiene servicios configurados. Contactalo para que los defina antes de
   agendar." con el botón guardar deshabilitado.

---

### User Story 3 — Bloquear horas con drag (Priority: P1)

El asistente identifica que el dentista Dr. X estará ausente cierto bloque
horario (ej: reunión con laboratorio, consulta con especialista, vacaciones
media jornada). El asistente activa el modo "bloquear hora", arrastra sobre
los slots libres deseados, opcionalmente agrega una razón ("Lunch", "Reunión
externa"), y guarda. El bloque aparece en rojo semitransparente impidiendo
que ese rango se vea como libre para nuevas citas.

**Why this priority**: Es tan fundamental como la creación de citas. El
asistente de recepción suele ser quien recibe la llamada del dentista "no
puedo de 10 a 12 mañana" y debe registrar el bloqueo para que no se agenden
pacientes. Sin esto el asistente tiene autonomía incompleta para gestionar la
agenda.

**Independent Test**: Asistente activo + dentista seleccionado + modo
bloquear activado + drag sobre slot libre → se crea `blocked_times` row con
therapist_id del dentista. El bloque es visible en el calendario, y al
intentar hacer drag-to-create de cita sobre ese bloque aparece conflicto.

**Acceptance Scenarios**:

1. **Given** asistente viendo agenda de Dr. X con el slot 14:00-15:00 del
   Jueves libre,
   **When** activa "modo bloquear" y arrastra desde 14:00 a 15:00 sobre el
   Jueves, agrega reason="Lunch",
   **Then** se crea una fila en `blocked_times` con start_time=14:00,
   end_time=15:00, therapist_id=Dr. X, reason="Lunch". El calendario muestra
   el bloque rojo semitransparente con el texto visible.

2. **Given** el mismo bloque creado,
   **When** el asistente desactiva "modo bloquear" e intenta drag-to-create
   una cita sobre ese mismo slot,
   **Then** aparece conflicto "Horario bloqueado" y la cita no se crea.

3. **Given** asistente click sobre un bloqueo existente,
   **When** el sistema ofrece opción "Desbloquear",
   **Then** el bloqueo se elimina de `blocked_times` y el slot queda
   disponible nuevamente.

4. **Given** asistente revocado (is_active=false en organization_members)
   que conserva sesión por cache,
   **When** intenta crear un bloqueo,
   **Then** el INSERT es rechazado por RLS con error claro y se muestra
   mensaje "Tu acceso a la clínica fue revocado".

---

### User Story 4 — Editar cita existente (Priority: P2)

El asistente recibe una llamada: "Quiero mover mi cita del Martes 10:00 al
Miércoles 15:00". Entra al calendario, hace click en la cita del Martes, se
abre el modal con los datos completos, modifica fecha/hora (o los otros
campos), y guarda. La cita se mueve al nuevo slot.

**Why this priority**: Frecuente en operaciones reales, pero si la creación
(P1) ya funciona, el asistente puede "cancelar + crear nueva" como
workaround. No crítico para MVP pero fuertemente recomendado antes de beta.

**Independent Test**: Click en cita existente abre modal con datos cargados.
Cambiar start/end/patient/notes/status + submit → update en DB + cita se
re-renderiza en nuevo slot.

**Acceptance Scenarios**:

1. **Given** cita existente Martes 10:00-11:00 con Dr. X,
   **When** el asistente clickea la cita, cambia start_time=Miércoles 15:00,
   end_time=Miércoles 16:00 y guarda,
   **Then** la cita desaparece del Martes y aparece en Miércoles 15:00-16:00.
   El campo updated_at en appointments refleja el cambio.

2. **Given** cita en estado 'scheduled',
   **When** el asistente abre el edit y cambia status a 'cancelled',
   **Then** la cita queda en estado cancelado (color rojo en el grid) pero
   no se borra. Se escribe audit log con action='cancel_appointment'.

---

### User Story 5 — Redimensionar cita arrastrando el borde (Priority: P2)

El asistente necesita alargar o acortar una cita sin cambiar su inicio.
Arrastra el borde inferior de la cita hacia abajo para extender, o hacia
arriba para acortar. El end_time se actualiza instantáneamente.

**Why this priority**: UX nice-to-have — el edit modal (P2) ya permite
cambiar duración. El resize es más rápido pero no bloquea.

**Independent Test**: Arrastrar borde inferior de cita → end_time actualiza
en tiempo real en DB. Minimum duration enforcement (ej: 15 min).

**Acceptance Scenarios**:

1. **Given** cita Martes 10:00-11:00,
   **When** el asistente toma el borde inferior y arrastra hasta las 11:30,
   **Then** la cita queda 10:00-11:30 (end_time actualizado), sin abrir modal.

2. **Given** intento de resize a duración menor a 15 min,
   **When** el asistente arrastra el borde casi hasta el start_time,
   **Then** el sistema snap-to-minimum muestra duración mínima 15 min (o
   rechaza el resize).

---

### User Story 6 — Vista multi-dentista "Todos los dentistas" (Priority: P3)

El asistente quiere ver la agenda de TODOS los dentistas simultáneamente
(ej: para asignar un nuevo paciente al dentista con más huecos ese día). Elige
"Todos" en el selector y la grid se divide en columnas, una por dentista, con
colores distintos por dentista.

**Why this priority**: Útil para clínicas grandes pero no crítico para MVP.
Clínicas de 1-2 dentistas no lo necesitan. Puede ir a backlog si P1-P5 ya
entregan valor suficiente.

**Independent Test**: Con ≥2 dentistas activos en la org, elegir "Todos" en el
selector → grid muestra columnas por dentista + drag-to-create en la columna
X crea cita con therapist_id=dentista X.

**Acceptance Scenarios**:

1. **Given** clínica con Dr. X y Dr. Y, asistente viendo calendario,
   **When** selecciona "Todos" en el selector,
   **Then** la grid se divide en 2 columnas (una por dentista), cada una con
   color distintivo. Las citas de Dr. X aparecen en su columna, las de Dr. Y
   en la suya.

2. **Given** vista multi-dentista activa,
   **When** el asistente hace drag-to-create en la columna de Dr. Y,
   **Then** el modal abre pre-rellenado con therapist_id=Dr. Y (no Dr. X).

---

### Edge Cases

- **Asistente sin clínica asociada**: si el `organization_members` del
  asistente se revocó entre el login y la carga de la agenda, debe mostrar
  pantalla clara "No tenés acceso a esta clínica" (cubierto por spec 023
  followup).
- **Conflictos de slot al crear**: dos acciones rápidas de drag-to-create
  sobre el mismo slot → segunda acción debe rechazarse por UNIQUE constraint
  o chequeo de overlap (definir UX: toast error o silent retry).
- **Navegación semanal con muchos dentistas**: si la clínica tiene 10+
  dentistas, el selector debe permitir buscar por nombre para no scroll
  infinito.
- **Cambio de zona horaria**: asistente trabaja en Santiago pero un dentista
  trabaja en Antofagasta — la agenda muestra horarios locales de la clínica
  (no del asistente). Fuera de scope MVP: asumir que todos los dentistas de
  una clínica comparten timezone.
- **Cita que cruza cambio de hora de verano**: la agenda debe respetar
  `clinics.timezone` y renderizar horarios consistentes (no hacer math con
  UTC que cruce DST).
- **Slot pasado**: drag-to-create sobre fecha/hora anterior a ahora → warning
  "Esta fecha ya pasó, ¿querés registrar una cita histórica?" con opción
  confirmar o cancelar (permite registrar citas completadas retroactivamente
  para corregir data).
- **Paciente no pertenece a la org**: el autocomplete solo muestra pacientes
  de la misma organización; si el asistente intenta forzar un patient_id de
  otra org vía devtools, RLS rechaza el INSERT.
- **Revocación mid-session**: asistente crea una cita justo cuando el admin
  revoca su acceso → el primer RLS reject hace que la UI muestre mensaje "Tu
  acceso fue revocado, por favor recarga la página".
- **Dentista inactivo**: si un dentista se desvincula, sus citas pasadas
  permanecen visibles pero no se pueden crear nuevas para él. El selector
  de dentista solo lista activos (`organization_members.is_active=true` y
  `role='dentist'`).
- **Resize conflictivo**: extender una cita hace que colisione con otra del
  mismo dentista → rechazar resize con mensaje claro o snap al borde de la
  cita siguiente.

## Requirements *(mandatory)*

### Functional Requirements

#### Navegación y visualización

- **FR-001**: Sistema DEBE mostrar al asistente un selector de dentista que
  liste solo dentistas activos (`organization_members.role='dentist' AND
  is_active=true`) de la organización a la que el asistente tiene membership
  activo.
- **FR-002**: Sistema DEBE renderizar un grid semanal Lunes-Domingo (semana
  iniciando Lunes) con horas locales de la clínica, usando `clinics.timezone`
  como referencia.
- **FR-003**: Sistema DEBE permitir navegación semana-anterior /
  semana-siguiente / botón "Hoy" que regresa a la semana que contiene la
  fecha actual y resalta el día de hoy.
- **FR-004**: Sistema DEBE colorear cada cita según su estado (agendada=azul,
  confirmada=verde, completada=gris, cancelada=rojo, no-show=ámbar) de forma
  visualmente distinguible.
- **FR-005**: Sistema DEBE renderizar bloqueos horarios (`blocked_times`) en
  rojo semitransparente con su `reason` visible (si existe).
- **FR-006**: Sistema DEBE mostrar slots libres del dentista según su
  `therapist_availability` en color neutro (blanco/gris claro) con
  hover-feedback.
- **FR-007**: Sistema DEBE permitir filtrar citas visibles por estado
  (scheduled / confirmed / completed / cancelled / no-show / todos).

#### Creación de citas (drag-to-create)

- **FR-008**: Sistema DEBE permitir al asistente crear una cita arrastrando
  desde una hora de inicio hasta una hora de fin sobre un slot libre. El drag
  debe abrir un modal de creación con fecha, hora inicio, hora fin y dentista
  pre-rellenados.
- **FR-009**: Modal de creación DEBE incluir autocomplete de pacientes
  restringido a la organización actual (RLS) y dropdown de servicios activos
  del dentista seleccionado.
- **FR-010**: Sistema DEBE validar antes del submit: (a) paciente seleccionado,
  (b) start_time < end_time, (c) duración mínima 15 min, (d) no hay overlap
  con otra cita del mismo dentista, (e) no hay overlap con un
  `blocked_times` del mismo dentista.
- **FR-011**: Sistema DEBE rechazar drag-to-create si el dentista no tiene
  servicios activos, mostrando mensaje claro y bloqueando el submit.
- **FR-012**: Al crear una cita exitosamente, sistema DEBE persistir en
  `appointments` los campos: `organization_id`, `clinic_id`, `therapist_id`,
  `patient_id`, `service_id`, `date`, `start_time`, `end_time`, `status`,
  `notes`.
- **FR-013**: Sistema DEBE escribir una fila en `clinical_audit_log` con
  `action='create_appointment'`, `actor_user_id`, `target_patient_id`,
  `created_at` automáticamente al crear una cita desde la vista del asistente.

#### Bloqueo horario (drag-to-block)

- **FR-014**: Sistema DEBE proveer un "modo bloquear" activable con toggle
  visible o tecla modificadora. En modo bloquear, el drag sobre slots libres
  crea `blocked_times` rows en lugar de abrir el modal de cita.
- **FR-015**: Modal opcional al crear bloqueo DEBE permitir agregar una razón
  textual (máx 200 caracteres).
- **FR-016**: Sistema DEBE permitir al asistente eliminar un bloqueo
  clickeando sobre él y confirmando la acción.
- **FR-017**: Sistema NO DEBE registrar audit log al crear/eliminar
  `blocked_times` (son datos del dentista, no tocan paciente).

#### Edición y resize

- **FR-018**: Sistema DEBE permitir al asistente editar una cita existente
  haciendo click en ella. El modal edit muestra todos los campos editables y
  permite cambiar status a cualquier estado válido (incluyendo cancelled).
- **FR-019**: Al editar una cita, sistema DEBE escribir audit log con
  `action='edit_appointment'` o `action='cancel_appointment'` según el
  cambio.
- **FR-020**: Sistema DEBE permitir redimensionar una cita arrastrando su
  borde inferior (extender) o superior (acortar), snap a intervalos de 15
  minutos, con duración mínima 15 min.
- **FR-021**: Sistema DEBE rechazar resize si provoca overlap con otra cita
  o bloqueo del mismo dentista, mostrando error claro.

#### Seguridad y permisos (RLS)

- **FR-022**: Sistema DEBE enforcerar a nivel de base de datos que solo un
  usuario con `organization_members.role='assistant'` e `is_active=true` pueda
  INSERT/UPDATE/DELETE en `appointments` restringido a citas cuyos
  `organization_id` matchea la organización del asistente.
- **FR-023**: Sistema DEBE enforcerar la misma regla para `blocked_times`
  (policies RLS `blocked_times_insert_assistant`, `_update_assistant`,
  `_delete_assistant`).
- **FR-024**: Sistema DEBE validar que el `therapist_id` de una cita o
  bloqueo creado por un asistente sea un miembro activo de la misma
  organización.
- **FR-025**: Sistema DEBE validar que el `patient_id` de una cita sea un
  paciente de la misma organización.
- **FR-026**: Sistema NO DEBE mostrar al asistente ningún link o botón para
  acceder a la ficha clínica detallada del paciente desde el modal de cita
  (odontograma, tratamientos, notas clínicas, evoluciones). La info visible
  es exclusivamente administrativa: nombre, teléfono, email, historial de
  citas (fecha + servicio).

#### Compliance y auditoría

- **FR-027**: Sistema DEBE registrar en `clinical_audit_log` todo acceso del
  asistente a datos clínicos ajenos (apertura del modal de edit con
  patient_id visible). Trigger automático vía `useClinicalAccessLogger`.
- **FR-028**: Sistema DEBE respetar Ley 20.584 art. 12: asistente accede solo
  a información administrativa, no a ficha clínica.
- **FR-029**: Sistema DEBE respetar Ley 21.719: minimización de datos —
  el autocomplete de pacientes solo retorna nombre, teléfono y email (no RUT
  completo ni ficha).

### Key Entities

- **organization_members**: fila con `user_id`, `organization_id`, `role`
  (`assistant` o `dentist`), `is_active`. Define quién puede ver y actuar
  sobre qué organización. Es el punto de enforcement principal.
- **appointments**: citas del dentista con paciente. Incluye `organization_id`,
  `clinic_id`, `therapist_id`, `patient_id`, `service_id`, `date`,
  `start_time`, `end_time`, `status`, `notes`, `created_by_user_id` (para
  trazabilidad: fue el asistente o el dentista quien la creó).
- **blocked_times**: bloqueos horarios del dentista. Incluye `therapist_id`,
  `clinic_id`, `start_time`, `end_time`, `reason`. Una fila es visible en el
  calendario como rango rojo.
- **therapist_availability**: horario base del dentista (qué días/horas
  trabaja). El asistente lo lee pero NO lo modifica (solo el dentista puede).
- **therapist_services**: servicios del dentista (nombre, duración default,
  precio). El asistente los lee al crear cita pero NO los modifica.
- **patients**: pacientes de la clínica. El asistente los busca para asignar
  citas — solo ve datos administrativos (nombre, email, teléfono), NO ficha
  clínica.
- **clinical_audit_log**: log append-only que registra cada vez que el
  asistente crea/edita/cancela una cita o abre datos clínicos de un paciente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un asistente puede visualizar la agenda semanal completa de un
  dentista de su clínica en menos de 2 segundos desde el click en el selector.
- **SC-002**: Un asistente puede crear una cita nueva (desde drag hasta toast
  de confirmación) en menos de 30 segundos promedio, incluyendo la búsqueda
  del paciente.
- **SC-003**: El 100% de las acciones del asistente sobre citas generan la
  fila correspondiente en `clinical_audit_log`. Verificable por query
  `SELECT COUNT(*) FROM clinical_audit_log WHERE action IN
  ('create_appointment','edit_appointment','cancel_appointment') AND
  actor_user_id = <assistant>` vs cantidad de acciones ejecutadas.
- **SC-004**: 0 eventos de RLS violation en producción: ningún asistente
  puede crear, editar o borrar citas de una organización distinta a la suya.
  Verificable por ausencia de error logs tipo "RLS violation" en Sentry
  post-deploy.
- **SC-005**: 0 eventos de data leak: ningún asistente puede ver campos de
  ficha clínica (tratamientos, evoluciones, odontograma, notas clínicas) en
  ninguna vista del calendario ni modales asociados. Verificable por
  auditoría de UI + code review.
- **SC-006**: El asistente puede completar el flujo "recibir llamada del
  paciente → crear cita en el calendario" en menos de 1 minuto promedio,
  medido desde la apertura del calendario hasta el toast de confirmación.
- **SC-007**: En una clínica con 3 dentistas y 50 citas semanales
  distribuidas, el calendario renderiza sin jank visible (frame rate >= 50fps)
  al hacer scroll, navegar semanas y aplicar filtros.
- **SC-008**: El 95% de los drag-to-create completan sin errores (success
  toast) cuando los datos de entrada son válidos. Verificable por telemetría
  Sentry post-deploy.

## Assumptions

- **Timezone**: todos los dentistas de una clínica comparten timezone. Si en
  el futuro hay clínicas multi-región, se revisa en otro spec.
- **Disponibilidad del dentista**: `therapist_availability` ya existe y
  define el horario base semanal. El asistente no lo modifica.
- **Conflictos concurrentes**: dos usuarios creando citas en el mismo slot
  al mismo tiempo — se asume baja probabilidad; el segundo submit recibe
  error de overlap y el usuario reintenta. No se implementa locking pesimista.
- **Multi-clínica del asistente**: se asume que un asistente pertenece a una
  sola clínica activa en un momento dado. El `useCurrentOrganization` hook
  resuelve la org actual; si en el futuro se permite multi-clínica, agregar
  selector.
- **Precio de servicio**: se toma el precio actual de `therapist_services` al
  crear la cita. Si el precio cambia después, la cita vieja conserva el
  precio pactado (snapshot). Ya implementado en la lógica existente.
- **Notificaciones al dentista**: al crear/editar/cancelar una cita desde la
  vista del asistente, el dentista puede querer ser notificado. Asumimos que
  existe un mecanismo de recordatorios que lo cubre (out of scope de este
  spec) o se agrega en un spec futuro.
- **Timezone DST**: Chile transicionó a horario fijo en 2022 (no más DST),
  por lo que no hay riesgo de citas que crucen cambios DST en prod.
- **Mobile responsiveness**: la vista de calendario semanal es desktop-first.
  Mobile está fuera de scope MVP — el asistente usa laptop/desktop en el
  mostrador.
- **Cantidad de citas**: una semana típica tiene 20-100 citas en una clínica.
  El rendering debe soportar hasta 500 citas por semana (worst case de
  clínica de 5 dentistas) sin degradación.
- **Integración con reminders**: el sistema de recordatorios (`reminders`)
  existe y se dispara al crear citas automáticamente via trigger o hook. El
  asistente no gestiona los reminders directamente — solo crea la cita y el
  backend hace el resto.
- **Reusabilidad de componentes**: se asume que `WeeklyAgendaView` del
  dentista puede ser parametrizada con un prop `scope='assistant'` o usada
  con pequeñas adaptaciones. Si requiere refactor mayor, evaluar costo en
  el plan.
- **RLS policies existentes**: se asume que las policies actuales de
  `appointments` y `blocked_times` cubren solo al dentista (therapist_id =
  auth.uid()) y NO al asistente. El plan deberá verificar y crear migrations
  si faltan.
- **Audit log hook**: `useClinicalAccessLogger` ya existe y escribe a
  `clinical_audit_log`. Se asume que acepta los parámetros necesarios
  (`action`, `target_patient_id`) sin refactor.

## Dependencies

- **Spec 023 (invite-assistant-flow)** — DONE + DEPLOYED. Este spec construye
  sobre la infraestructura de organization_members + role='assistant'.
- **Tabla `organization_members`** — existe desde migration
  `20260415100000_organization_model_schema.sql`.
- **Tabla `appointments`** — existe en baseline schema, con columna
  `organization_id` agregada en migration del spec 022.
- **Tabla `blocked_times`** — existe en baseline schema.
- **Tabla `therapist_availability`** — existe en baseline schema.
- **Tabla `therapist_services`** — existe en baseline schema.
- **Tabla `clinical_audit_log`** — existe, mantiene audit trail append-only.
- **Componente `WeeklyAgendaView`** — existe en
  `src/components/calendar/WeeklyAgendaView.jsx`, usado por el dentista.
- **Componente `AppointmentModal`** — existe en
  `src/components/calendar/AppointmentModal.jsx`.
- **Hook `useCurrentOrganization`** — existe y retorna la org activa del
  user actual.
- **Util `searchPatientsForAgenda`** — existe en `src/lib/patientApi.js`,
  scopeado por therapist_id hoy; se adapta a organization_id en este spec
  o se crea uno nuevo paralelo.
