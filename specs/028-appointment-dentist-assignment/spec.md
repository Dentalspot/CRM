# Feature Specification: Appointment Dentist Assignment

**Feature Branch**: `028-appointment-dentist-assignment`
**Created**: 2026-05-29
**Status**: Draft
**Input**: User description: "Asignar un dentista responsable a cada cita en el modal de agendamiento. Odontología Los Álamos pasó de 1 a 2 dentistas (Cristobal Tagle general + Dr. Pablo Ceballos ortodoncia), ambos trabajando en box 1. Hoy las citas no tienen dentista asignado formalmente — los asistentes lo anotan en el campo Notas, lo cual no es auditable ni filtrable. La asistente, clinic_admin, o dentista (incluyendo admin+dentista) deben poder agendar pacientes seleccionando obligatoriamente qué dentista atenderá la cita, con default inteligente según rol, visualización por color en el calendario y filtro por dentista."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Asistente agenda cita seleccionando dentista responsable (Priority: P1)

La asistente de Odontología Los Álamos abre el modal "Agendar Nueva Cita" para programar una visita. En la zona superior del modal — debajo del "Lugar de atención" — encuentra un nuevo campo obligatorio "Dentista" con un dropdown. Selecciona "Dr. Pablo Ceballos (Ortodoncia)" porque la paciente viene a control de ortodoncia. Completa el resto del formulario y guarda. La cita queda creada con el dentista asignado y aparece en el calendario diferenciada visualmente del resto de citas del Dr. Tagle.

**Why this priority**: Sin esta capacidad la trazabilidad clínica está rota. Hoy los asistentes anotan el dentista en Notas ("Control Ortodoncia Dr. Ceballos"), lo cual no es auditable, ni filtrable, ni cumple con Ley 20.584 art. 12 (registro de quién atendió a quién). Es el MVP del feature — sin esto no hay nada.

**Independent Test**: Se puede validar completamente creando 2 citas como asistente (una para cada dentista) y verificando que el dropdown muestra ambos dentistas activos, el campo es obligatorio, y la cita guardada referencia al dentista correcto.

**Acceptance Scenarios**:

1. **Given** la asistente Tatiana está logueada en Odontología Los Álamos y abre "Agendar Nueva Cita", **When** intenta guardar sin seleccionar dentista, **Then** el sistema bloquea el submit y muestra mensaje "Selecciona un dentista responsable"
2. **Given** la asistente abre el modal, **When** despliega el dropdown "Dentista", **Then** ve la lista completa de dentistas activos de la organización ("Dr. Cristobal Tagle" y "Dr. Pablo Ceballos (Ortodoncia)") sin opción "Sin asignar"
3. **Given** la asistente selecciona "Dr. Ceballos" y guarda, **When** la cita aparece en el calendario, **Then** el chip incluye visualmente el nombre del dentista responsable y queda registrado en el log de auditoría con el dentista asignado
4. **Given** la asistente Tatiana atiende dos organizaciones distintas, **When** está en el contexto Los Álamos, **Then** solo ve los dentistas de Los Álamos en el dropdown — nunca dentistas de otra clínica

---

### User Story 2 — Dentista logueado agenda con auto-self pero puede cambiar (Priority: P2)

El Dr. Cristobal Tagle (que también es clinic_admin de Los Álamos) abre el modal de agendamiento para programar una cita propia. El campo "Dentista" aparece pre-seleccionado con su nombre. Si la cita es realmente para Dr. Ceballos (porque atiende un pase de pacientes), puede abrir el dropdown y cambiar la selección antes de guardar.

**Why this priority**: Optimización fuerte de UX para el caso más frecuente (el dentista agenda sus propias citas). Reduce un click por cita. Pero no es bloqueante para shipear — sin esto el dentista igual puede usar el dropdown manualmente.

**Independent Test**: Login como dentista, abrir modal, confirmar que el campo viene pre-seleccionado con el dentista logueado, cambiar la selección a otro dentista, guardar, verificar que se asignó el cambiado y no el default.

**Acceptance Scenarios**:

1. **Given** el Dr. Tagle (rol dentist) está logueado, **When** abre "Agendar Nueva Cita", **Then** el campo "Dentista" viene pre-seleccionado con su propio nombre
2. **Given** el Dr. Tagle es admin+dentista del mismo user, **When** abre el modal, **Then** se pre-selecciona él mismo (no queda vacío como admin puro)
3. **Given** la asistente o un clinic_admin puro (sin rol dentista) abre el modal, **When** se renderiza, **Then** el campo "Dentista" aparece vacío con placeholder "Seleccionar dentista"
4. **Given** el Dr. Tagle ve el campo pre-seleccionado con su nombre, **When** lo cambia a "Dr. Ceballos", **Then** la cita se guarda con Dr. Ceballos como dentista responsable y queda registrado en auditoría

---

### User Story 3 — Filtro de dentista en header del calendario (Priority: P2)

La asistente abre la página de calendario "Mi Agenda" / "Calendario de la Clínica". En el header de la zona de ubicación — debajo del badge "Box 1" del cuadro teal — aparece un nuevo dropdown "Todos los dentistas" con flecha. Al desplegarlo, ve los nombres de los dentistas activos. Si selecciona "Dr. Ceballos", el calendario filtra las citas mostrando solo las que él atenderá. La selección persiste en la URL para que pueda compartir el enlace o refrescar sin perder el filtro.

**Why this priority**: Necesario para que clinic_admin/dentista evalúen carga de trabajo individual. No bloqueante del MVP — sin esto se ve todo el calendario sin distinción por dentista, lo cual sigue siendo mejor que hoy. Valor alto pero independiente.

**Independent Test**: Crear 2 citas (una por dentista) en el calendario, activar filtro "Dr. Ceballos", verificar que solo aparece su cita; refrescar página y confirmar persistencia del filtro vía URL.

**Acceptance Scenarios**:

1. **Given** el calendario muestra citas de ambos dentistas, **When** la usuaria selecciona "Dr. Ceballos" en el filtro, **Then** solo aparecen las citas asignadas a él
2. **Given** se aplicó un filtro de dentista, **When** la usuaria refresca la página, **Then** el filtro permanece activo (persistido en URL)
3. **Given** la usuaria es un dentista logueado abriendo el calendario, **When** la página carga, **Then** el filtro por defecto puede ser "Todos los dentistas" o "Solo míos" según preferencia (sin filtro fijo automático)
4. **Given** se aplicó filtro "Dr. Ceballos", **When** la usuaria mira la sidebar "Citas de Hoy", **Then** sigue mostrando todas las citas del día sin aplicar el filtro de dentista (sidebar nunca filtra)

---

### User Story 4 — Reasignación de dentista en cita existente (Priority: P3)

Surge un imprevisto: la cita de Isidora con Dr. Tagle a las 16:00 debe pasar a Dr. Ceballos porque Tagle se ausentó. La asistente, el clinic_admin o el propio Dr. Tagle abren la cita en el calendario, abren el dropdown "Dentista" y eligen "Dr. Ceballos". Al guardar, el cambio queda registrado en el log de auditoría con la acción específica "appointment_reassigned" para trazabilidad. El Dr. Ceballos, sin embargo, no puede tomar de propia iniciativa una cita ajena que está asignada a Dr. Tagle.

**Why this priority**: Cubre flujos reales pero infrecuentes (reemplazos, ausencias). El feature básico (crear cita con dentista asignado) ya entrega valor sin esto. Audit trail requerido por Ley 20.584 para cualquier cambio de profesional responsable.

**Independent Test**: Como asistente, abrir una cita asignada a Dr. Tagle, cambiar el dentista a Dr. Ceballos, guardar, verificar entry "appointment_reassigned" en clinical_audit_log; luego intentar lo mismo desde el login de un dentista que NO es el asignado y verificar bloqueo.

**Acceptance Scenarios**:

1. **Given** una cita asignada a Dr. Tagle, **When** la asistente la edita y cambia el dentista a Dr. Ceballos, **Then** el cambio se guarda y se registra una entrada "appointment_reassigned" en audit con el dentista anterior y el nuevo
2. **Given** una cita asignada a Dr. Tagle, **When** el propio Dr. Tagle edita la cita y reasigna a Dr. Ceballos, **Then** el cambio se permite y registra
3. **Given** una cita asignada a Dr. Tagle, **When** Dr. Ceballos (que no es el asignado actual) intenta cambiarse a sí mismo el dentista, **Then** el sistema bloquea la operación a nivel UI y a nivel de policy de base de datos
4. **Given** el clinic_admin (sin rol dentista) edita una cita ajena, **When** cambia el dentista responsable, **Then** la operación se permite y queda en audit

---

### User Story 5 — Visualización color por dentista en chips del calendario (Priority: P3)

El calendario de la clínica está cargado de citas. La asistente quiere distinguir de un vistazo qué citas son de Dr. Tagle vs Dr. Ceballos sin tener que abrir cada chip. Cada chip del calendario muestra ahora un borde lateral coloreado consistente por dentista (Dr. Tagle siempre teal, Dr. Ceballos siempre coral, por ejemplo) más un footer pequeño con "Dr. Tagle" o "Dr. Ceballos" debajo del nombre del paciente. Esa diferenciación visual permite escanear el calendario rápidamente.

**Why this priority**: Pulido visual de alto valor pero no bloqueante. Con el filtro de US3 ya se cubre el caso de "ver solo un dentista". Esto es para casos en que se mira todo el calendario y se quiere distinguir rápido. Polish, no foundation.

**Independent Test**: Cargar el calendario con citas de ambos dentistas, verificar que cada uno tiene un color distinto consistente y que el nombre del dentista aparece como texto secundario en cada chip.

**Acceptance Scenarios**:

1. **Given** el calendario muestra citas de ambos dentistas, **When** la usuaria observa el grid, **Then** cada chip tiene un borde lateral coloreado por dentista responsable (mismo dentista = mismo color a lo largo de toda la app)
2. **Given** un chip de cita, **When** la usuaria lo mira, **Then** ve el nombre abreviado del dentista responsable como texto secundario debajo del nombre del paciente
3. **Given** una cita legacy sin dentista asignado (NULL — no backfilleada), **When** aparece en el calendario, **Then** se muestra con un color neutro o gris y footer "Sin asignar" sin romper el render

---

### Edge Cases

- **Cita legacy sin dentista**: tras el backfill al owner de la clínica, ¿qué pasa si el owner no es dentista activo (ej. clinic_admin puro sin rol dentist)? El backfill solo aplica si el owner tiene rol dentist activo; sino queda NULL y se muestra "Sin asignar"
- **Dentista único en la org**: si la clínica tiene un solo dentista (caso normal pre-Ceballos), el dropdown se renderiza igual pero auto-selecciona y opcionalmente puede ocultarse si la usuaria lo prefiere (decisión de UX, no de scope)
- **Dentista desactivado/revocado**: un dentista que fue desactivado (is_active=false en organization_members) deja de aparecer en el dropdown de nuevas citas, pero las citas pasadas asignadas a él siguen mostrando su nombre correctamente
- **Filtro URL con dentista de otra org**: si la usuaria entra a una URL con `?dentist=uuid` que no pertenece a la org actual, el filtro se ignora silenciosamente y se muestra "Todos los dentistas"
- **Reasignación a dentista que ya no existe**: el dropdown solo permite seleccionar dentistas activos actuales, por lo que este caso no puede ocurrir desde la UI
- **Borrar dentista de la org**: si se intenta desactivar a un dentista que tiene citas futuras asignadas, el sistema debe advertir pero no bloquear (el dato histórico se preserva; las citas futuras quedan visibles con su nombre pero el dropdown deja de listarlo para nuevas citas)
- **Booking online del paciente** (out of scope este PR): cuando se implemente, la cita quedará sin dentista hasta que un asistente/clinic_admin/dentista la asigne manualmente
- **Doble rol admin+dentista**: el usuario que es clinic_admin Y dentist en la misma org se trata como dentista para el default de auto-self
- **Cambio de organización activa**: si la asistente cambia el contexto de organización en el selector global, el dropdown de dentistas se recarga con los de la nueva org y el filtro URL se resetea

## Requirements *(mandatory)*

### Functional Requirements

#### Asignación al crear cita
- **FR-001**: El sistema MUST exigir un dentista responsable seleccionado para crear cualquier cita nueva — submit bloqueado si el campo está vacío
- **FR-002**: El dropdown del modal de agendamiento MUST listar todos los dentistas activos (`is_active=true` en organization_members con rol `dentist`) de la organización actual del usuario logueado
- **FR-003**: El dropdown NO MUST incluir opción "Sin asignar" ni listar dentistas desactivados ni dentistas de otras organizaciones
- **FR-004**: El sistema MUST pre-seleccionar el dentista en el dropdown según el rol del usuario logueado:
  - Rol `dentist` (puro o combinado con clinic_admin) → auto-seleccionar al propio usuario
  - Rol `clinic_admin` puro (sin rol dentist) → campo vacío con placeholder "Seleccionar dentista"
  - Rol `assistant` → campo vacío con placeholder "Seleccionar dentista"

#### Visualización en calendario
- **FR-005**: Cada cita en el calendario MUST mostrar visualmente el dentista responsable mediante (a) borde lateral coloreado consistente por dentista y (b) nombre abreviado del dentista como texto secundario en el chip
- **FR-006**: El color asignado a cada dentista MUST ser consistente a lo largo de toda la aplicación (mismo dentista = mismo color en cualquier vista)
- **FR-007**: Citas legacy sin dentista asignado (NULL después del backfill) MUST renderizarse con color neutro y etiqueta "Sin asignar"

#### Filtro de calendario
- **FR-008**: Las páginas de calendario de asistente (`/dashboard/assistant/agenda`) y de clinic_admin (`/dashboard/clinic/agendas`) MUST mostrar un dropdown filtro "Dentista" ubicado debajo del badge "Box" en el header de ubicación. La página de calendario del dentista (`/dashboard/calendar`) NO recibe este filtro porque el dentista está RLS-bound a sus propias citas — agregar un filtro ahí no tendría contenido que filtrar. Decisión documentada en `research.md` §R-05.
- **FR-009**: El filtro MUST tener como valor por defecto "Todos los dentistas"
- **FR-010**: La selección del filtro MUST persistirse en el query string de la URL para sobrevivir refresh y permitir compartir el enlace
- **FR-011**: Si la URL incluye un dentist_id que no pertenece a la organización actual, el sistema MUST ignorar el filtro y mostrar "Todos los dentistas" sin error visible
- **FR-012**: La sidebar "Citas de Hoy" MUST mostrar siempre todas las citas del día independientemente del filtro de dentista aplicado al calendario principal

#### Reasignación de dentista
- **FR-013**: El sistema MUST permitir cambiar el dentista responsable de una cita existente solo a los siguientes roles:
  - Asistente de la organización propietaria de la cita
  - Clinic_admin de la organización propietaria
  - Dentista actualmente asignado a la cita
- **FR-014**: El sistema MUST bloquear (UI y policy de base de datos) que un dentista cambie el dentista responsable de una cita que no le está actualmente asignada
- **FR-015**: Cada reasignación MUST quedar registrada en el log de auditoría clínica con la acción `appointment_reassigned`, incluyendo el dentista anterior y el nuevo

#### Auditoría
- **FR-016**: Los eventos `appointment_created`, `appointment_updated` y `appointment_cancelled` registrados en `clinical_audit_log` MUST incluir el `dentist_id` asignado en el payload
- **FR-017**: La acción `appointment_reassigned` MUST registrarse como entrada nueva separada en `clinical_audit_log` cada vez que cambia el `dentist_id` de una cita existente, conservando trazabilidad del cambio
- **FR-018**: La auditoría de acceso del paciente a su propia cita NO MUST generar entrada (auto-acceso del paciente exento por Ley 20.584 art. 13)

#### Migración de datos legacy
- **FR-019** [ANULADO POR DESIGN]: El requirement original exigía un backfill idempotente sobre citas existentes asignando como dentista responsable al `owner_user_id` de la clínica. La investigación técnica (research.md §R-10) confirmó que `appointments.therapist_id` es `NOT NULL` desde la migration baseline `20260401000000_baseline_schema.sql` — no existen rows con NULL en producción. El backfill resulta vacuo y no se implementa.
- **FR-020** [ANULADO POR DESIGN]: El requirement original especificaba que citas con dueño no-dentista debían quedar con `dentist_id = NULL` y mostrarse como "Sin asignar". Por el mismo motivo que FR-019 (NOT NULL desde baseline), este caso no existe en producción. El fallback visual "Sin asignar" en `WeeklyAgendaView` se mantiene como defensa de UI para escenarios hipotéticos futuros, pero no hay rows actuales que lo disparen.

#### Seguridad y aislamiento entre clínicas
- **FR-021**: La RLS policy de UPDATE en `appointments` MUST aplicar las reglas de FR-013/FR-014 a nivel de base de datos, no solo en UI
- **FR-022**: El sistema MUST garantizar que un usuario nunca pueda asignar un dentista de una organización distinta a la cual pertenece la cita

### Key Entities

- **Cita (appointment)**: Entidad existente extendida con un nuevo atributo "dentista responsable" que referencia al miembro de la organización con rol dentist. Mantiene su relación actual con paciente, clínica, organización y box. El nuevo atributo es obligatorio para citas nuevas y opcional/NULL para citas legacy no backfilleadas
- **Dentista (dentist member)**: Miembro de una organización con rol `dentist` activo. Identificado vía `profiles` JOIN `organization_members`. Un usuario puede ser dentista en múltiples organizaciones independientemente, y puede combinar el rol dentist con clinic_admin en la misma org
- **Log de auditoría clínica**: Entrada en `clinical_audit_log` por cada acción sobre una cita (crear, actualizar, cancelar, reasignar). Para `appointment_reassigned`, el payload incluye dentista anterior y nuevo

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% de las citas creadas post-deploy tienen un dentista responsable asignado (verificable con un solo `COUNT WHERE dentist_id IS NULL AND created_at > deploy_date`)
- **SC-002**: 100% de las acciones de creación, actualización, cancelación y reasignación de citas quedan registradas en `clinical_audit_log` con `dentist_id` poblado (cumplimiento Ley 20.584)
- **SC-003**: Una asistente identifica qué dentista atiende cualquier cita visible en el calendario en menos de 2 segundos sin abrir el chip
- **SC-004**: El cambio de dentista responsable en una cita existente se completa en menos de 30 segundos por parte de un usuario autorizado
- **SC-005**: 0 casos de "robo" de citas: un dentista no puede modificar el responsable de citas asignadas a otro colega (validable por intento manual + revisión de policy RLS)
- **SC-006**: El campo "Notas" de las citas creadas en Odontología Los Álamos deja de usarse para indicar dentista responsable en el 95% de las citas nuevas dentro de las primeras 4 semanas post-deploy (medible por sampling de notas)
- **SC-007**: El filtro de dentista del calendario retorna resultados en menos de 1 segundo desde el click hasta el render filtrado

## Assumptions

- La tabla `appointments` ya tiene una columna que referencia al profesional responsable bajo el nombre legacy `therapist_id` (heredado de FONOKIT/Communicare). Se asume que se reusará semánticamente como "dentista" en DentalSpot, con renombrado del referente en código a `dentist_id` para claridad. La verificación exacta del nombre actual y constraints se hará en `/speckit.plan`
- La tabla `profiles` JOIN `organization_members` ya permite identificar dentistas activos por organización mediante el rol `dentist` y el flag `is_active=true` introducidos en specs 022/023
- El sistema existente de `useClinicalAccessLogger` y `clinical_audit_log` ya tiene un payload extensible que puede aceptar el campo `dentist_id` sin cambios de esquema en la tabla de auditoría
- ~~Se asume el patrón canónico "backfill idempotente" (architecture.md §Canonical patterns) para poblar `dentist_id` en citas legacy~~ — anulado por research.md §R-10: `appointments.therapist_id` ya es `NOT NULL` desde baseline, por lo que el backfill es vacuo y no se implementa
- Las RLS policies para asistente/clinic_admin/dentista sobre la tabla `appointments` ya cubren SELECT y la mayoría de mutaciones; solo es necesario reforzar UPDATE para que respete reglas FR-013/FR-014
- La función de hash de color por dentist_id es determinística (mismo UUID → mismo color en cualquier sesión) y los colores resultantes deben ser visualmente distinguibles dentro del rango teal/coral/azul de la paleta DentalSpot
- El modal de "Agendar Nueva Cita" actual tiene espacio suficiente para insertar un nuevo campo entre "Lugar de atención" y "Paciente" sin requerir rediseño del layout
- El header del calendario donde aparece "Box 1" en el cuadro teal de ubicación tiene espacio vertical para sumar un dropdown debajo sin afectar negativamente la densidad del layout
- El booking online del paciente, la asignación dentista↔box, la disponibilidad por dentista y las notificaciones push al dentista asignado están explícitamente fuera del scope de este PR y se cubrirán en specs futuras
- El feature aplica a las tres páginas de calendario existentes: dentista (`/dashboard/calendar`), clinic_admin (`/dashboard/clinic/agendas`) y asistente (`/dashboard/assistant/agenda`)
