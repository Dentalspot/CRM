# Feature Specification: Invite Assistant Flow

**Feature Branch**: `023-invite-assistant-flow`
**Created**: 2026-04-23
**Status**: Draft
**Input**: User description: "Un clinic_admin invita a una persona a unirse a su clínica como asistente administrativo. El asistente recibe un email con magic link; al completar signup/login queda asociado a la clínica con rol operativo 'assistant' vía organization_members, con permisos admin-level (no clínicos)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Clinic admin invita asistente (Priority: P1)

Un administrador de clínica quiere delegar tareas administrativas (agendar citas, gestionar listado de pacientes, recepción) en una persona de su equipo. Desde la sección "Gestión de equipo" de su dashboard, ingresa el email de esa persona y dispara una invitación. El sistema envía un email al invitado con un link de acceso único.

**Why this priority**: Es el punto de entrada del flujo completo y el caso de uso más visible para el admin. Sin esto, no existe el feature.

**Independent Test**: Admin logueado puede ir a `/dashboard/clinic/team`, completar el formulario de invitación, y ver la invitación creada como "pendiente" en la lista. Puede verificar en logs/DB que el email fue enviado.

**Acceptance Scenarios**:

1. **Given** admin logueado con rol `clinic`, **When** abre la página de gestión de equipo y completa email válido de una persona sin cuenta previa, **Then** el sistema crea una invitación pendiente con expiración 7 días y envía email al destinatario.
2. **Given** admin logueado, **When** intenta invitar a un email que ya tiene cuenta profesional (dentista u otra clínica), **Then** el sistema muestra un error amable que indica que ese email ya es profesional en la plataforma y sugiere contactar soporte. No se crea invitación.
3. **Given** admin logueado, **When** intenta invitar a un email que ya tiene una invitación pendiente para SU clínica, **Then** el sistema bloquea la duplicación y sugiere esperar o revocar la existente.
4. **Given** admin logueado, **When** invita a un email que corresponde a un paciente existente, **Then** el sistema crea invitación con flag `existing_patient=true` para que el flujo de aceptación sea login + upgrade en vez de signup nuevo.

---

### User Story 2 — Invitado acepta invitación (Priority: P1)

La persona invitada recibe un email con un link único. Al hacer click, la plataforma valida el token y la guía a completar la cuenta (si es nueva) o a autenticarse (si ya es paciente). Al finalizar, queda asociada a la clínica como asistente y aterriza en su dashboard correspondiente.

**Why this priority**: Sin este flujo la invitación no llega a nada. Es la segunda mitad indispensable del core flow.

**Independent Test**: Con una invitación válida en DB, abrir el link del email debe permitir completar el onboarding y terminar en el dashboard del asistente con la clínica correcta como contexto.

**Acceptance Scenarios**:

1. **Given** invitado sin cuenta, **When** hace click en el link del email, **Then** aterriza en un formulario de signup con email pre-llenado, rol `assistant` pre-asignado, y nombre del destinatario como campo editable.
2. **Given** invitado completa signup válido, **When** confirma la contraseña, **Then** se crea la cuenta, se registra su membresía en la organización con `role='assistant'` e `is_active=true`, y el sistema lo redirige al dashboard asistente.
3. **Given** invitado ya tiene cuenta de paciente con el mismo email, **When** hace click en el link, **Then** el sistema le pide login; al autenticarse se crea solo el row de membresía (sin nueva cuenta) y se le redirige al dashboard asistente con contexto de la clínica.
4. **Given** el token del link es inválido, ha expirado, o ya fue usado, **When** se accede al link, **Then** el sistema muestra un mensaje claro de "invitación inválida o expirada" y ofrece contactar a quien invitó.
5. **Given** un invitado ya asociado a la clínica como asistente activo, **When** intenta aceptar una nueva invitación para la misma clínica, **Then** el sistema reconoce la asociación existente y lo redirige directo al dashboard sin crear row duplicado.

---

### User Story 3 — Asistente trabaja con permisos limitados (Priority: P2)

Una vez dentro de la app, el asistente puede realizar tareas administrativas para la clínica (ver agenda, crear citas, listar pacientes) pero NO puede acceder a información clínica sensible (fichas, evoluciones, informes). Estas restricciones están cumplidas tanto a nivel de UI como a nivel de base de datos.

**Why this priority**: La razón de ser del rol asistente. Sin permisos diferenciados no hay valor de seguridad/compliance.

**Independent Test**: Logueado como asistente, se puede operar en la agenda de la clínica y ver lista de pacientes. Intentos directos (vía URL, API, o SQL) de acceder a ficha clínica, informes IA o billing retornan error o dato vacío.

**Acceptance Scenarios**:

1. **Given** asistente logueado, **When** navega a la agenda de la clínica, **Then** ve todas las citas de los dentistas activos de la clínica y puede crear, editar o cancelar.
2. **Given** asistente logueado, **When** abre la lista de pacientes, **Then** ve nombre, email, teléfono, próxima cita y dentista asignado, sin detalle clínico.
3. **Given** asistente logueado, **When** intenta acceder directamente a la URL de ficha clínica de un paciente, **Then** el sistema rechaza el acceso (ya sea con redirect a la lista o mensaje "no autorizado") y registra el intento en auditoría.
4. **Given** asistente logueado, **When** intenta ver informes con IA, cobros, membresía o configuración de la clínica, **Then** esas secciones no son visibles en el menú o muestran mensaje de permiso insuficiente.
5. **Given** asistente accede a info de un paciente ajeno para agendar, **When** la operación se completa, **Then** el acceso queda registrado en el log de auditoría con quien accedió, cuándo y qué recurso consultó.

---

### User Story 4 — Admin gestiona asistentes (Priority: P3)

El admin de clínica puede en cualquier momento ver quiénes son sus asistentes activos, cuáles invitaciones están pendientes, y revocar el acceso de un asistente si ya no corresponde.

**Why this priority**: Aporta control operativo continuo, pero el flujo inicial (P1) y los permisos (P2) ya entregan valor. La revocación es crítica pero con menor urgencia durante el beta porque los equipos son chicos y de confianza.

**Independent Test**: Admin puede ver listas separadas (activos vs pendientes), revocar un asistente con confirmación, y comprobar que el asistente pierde acceso en su próxima sesión.

**Acceptance Scenarios**:

1. **Given** admin logueado con asistentes asociados, **When** abre "Gestión de equipo", **Then** ve lista de asistentes activos con nombre, email, fecha de alta y botón "Revocar acceso".
2. **Given** admin ve invitaciones pendientes, **When** selecciona una para cancelar, **Then** la invitación se marca como cancelada y el link del email deja de funcionar.
3. **Given** admin clickea "Revocar acceso" sobre un asistente activo, **When** confirma en el diálogo, **Then** la membresía se marca como inactiva y el asistente pierde acceso en su próxima sesión.
4. **Given** asistente fue revocado, **When** intenta loguear, **Then** el sistema reconoce que no tiene organización activa y lo trata como paciente (si tenía rol previo) o le muestra mensaje "tu acceso fue revocado, contacta al admin".
5. **Given** admin revoca asistente y luego decide readmitirlo, **When** vuelve a invitarlo con el mismo email, **Then** el sistema detecta la asociación previa y la reactiva (`is_active=true`) sin crear row duplicado.

---

### Edge Cases

- **Email delivery falla** (buzón lleno, dominio inválido, error del proveedor de email): la invitación queda creada pero el email no llegó. **Comportamiento**: el admin ve en la lista una marca visual de "email no entregado" si el proveedor reporta rebote o falla. Como workaround MVP, el admin puede copiar manualmente el link desde su lista de invitaciones y reenviarlo por otro canal.
- **Invitación expirada**: si pasaron >7 días desde que se creó. El link muestra mensaje "invitación expirada", invitación se marca como `expired` en DB. Admin puede revocar y crear una nueva.
- **Asistente pertenece a múltiples clínicas**: técnicamente soportado (múltiples membresías organizacionales), pero la UI del asistente en MVP no ofrece cambio entre clínicas. El sistema elige la primera clínica activa encontrada. La funcionalidad multi-clínica queda en backlog.
- **Admin revoca asistente mientras está logueado**: el asistente conserva su sesión actual hasta cerrarla o recargar. En próxima carga, el detector de membresía activa lo saca del dashboard. No se cierra sesión activamente (evita perder trabajo en curso).
- **Clínica elimina/desactiva su cuenta**: todas las invitaciones pendientes de esa clínica se invalidan automáticamente, y las membresías activas de asistentes se marcan como inactivas. El asistente no pierde su cuenta.
- **Asistente intenta auto-invitarse (email == admin)**: el sistema rechaza la invitación.
- **Email corresponde a un admin de OTRA clínica**: error amable con sugerencia de contactar soporte (no se puede ser admin de una clínica y asistente de otra con el mismo email; decisión explícita MVP).
- **Admin agota rate limit**: se aplica tope de 10 invitaciones pendientes simultáneas por clínica; al intentar más se rechaza con mensaje "límite alcanzado, cancela invitaciones previas o espera que sean aceptadas".

## Requirements *(mandatory)*

### Functional Requirements

**Creación de invitación**

- **FR-001**: El sistema MUST permitir a un usuario con rol `clinic` acceder a la página de gestión de equipo desde su dashboard.
- **FR-002**: El sistema MUST permitir al admin ingresar un email y mensaje opcional para generar una invitación de asistente.
- **FR-003**: El sistema MUST validar formato de email antes de aceptar la invitación.
- **FR-004**: El sistema MUST rechazar invitaciones cuando el email ingresado ya tenga cuenta profesional (dentista o admin de clínica) con mensaje claro al admin.
- **FR-005**: El sistema MUST rechazar invitaciones duplicadas para el mismo email dentro de la misma clínica mientras exista una invitación pendiente o activa.
- **FR-006**: El sistema MUST aplicar un límite de máximo 10 invitaciones pendientes simultáneas por clínica.
- **FR-007**: El sistema MUST asignar una fecha de expiración de 7 días a cada invitación creada.
- **FR-008**: El sistema MUST generar un token único e irrepetible por invitación que sirva para validar el link del email.

**Envío de email**

- **FR-009**: El sistema MUST enviar un email al invitado con un link que contenga el token único y permita aceptar la invitación.
- **FR-010**: El email MUST incluir: nombre de la clínica, nombre del admin que invita, mensaje opcional, link de aceptación, y fecha de expiración de la invitación.
- **FR-011**: El sistema MUST registrar el estado de delivery del email (enviado / rebotado / fallido) asociado a la invitación.

**Aceptación de invitación**

- **FR-012**: El sistema MUST validar el token al acceder al link y rechazar tokens inválidos, expirados o ya utilizados con mensaje claro.
- **FR-013**: Para un invitado sin cuenta previa, el sistema MUST mostrar un formulario de signup con email pre-llenado, rol asistente pre-asignado, y token oculto.
- **FR-014**: Para un invitado con cuenta de paciente existente, el sistema MUST guiarlo a autenticarse y ampliar su rol sin crear cuenta duplicada.
- **FR-015**: Al completar signup o login válido, el sistema MUST crear una membresía en la organización con rol asistente activo, asociada al invitador y al token de la invitación.
- **FR-016**: El sistema MUST marcar la invitación como aceptada y redirigir al asistente a su dashboard.
- **FR-017**: El sistema MUST detectar si ya existe una membresía activa entre el usuario y la clínica y evitar duplicados.

**Permisos del asistente (MVP)**

- **FR-018**: El asistente MUST poder ver la agenda completa de la clínica: citas de todos los dentistas activos.
- **FR-019**: El asistente MUST poder crear, editar y cancelar citas.
- **FR-020**: El asistente MUST poder ver el listado de pacientes de la clínica con información de contacto y próxima cita.
- **FR-021**: El asistente MUST poder importar/exportar pacientes en CSV si la clínica tiene ese flujo habilitado.
- **FR-022**: El asistente MUST NO poder ver fichas clínicas detalladas (tratamientos, evoluciones, odontograma, radiografías, notas).
- **FR-023**: El asistente MUST NO poder acceder a informes con IA (Notiz).
- **FR-024**: El asistente MUST NO poder acceder a billing, membresía, planes ni cobros.
- **FR-025**: El asistente MUST NO poder invitar o revocar a otros asistentes o dentistas.
- **FR-026**: El asistente MUST NO poder editar la configuración de la clínica.
- **FR-027**: Las restricciones de permisos MUST estar implementadas a nivel de base de datos, no solo en la interfaz.
- **FR-028**: Cada acceso del asistente a información de pacientes ajenos (para agendar o listar) MUST quedar registrado en el log de auditoría con identidad del accedente, timestamp y recurso consultado.

**Gestión por parte del admin**

- **FR-029**: El admin MUST poder ver un listado de asistentes activos de su clínica con nombre, email, fecha de alta y acción de revocar.
- **FR-030**: El admin MUST poder ver invitaciones pendientes con email, fecha de envío, fecha de expiración y acción de cancelar.
- **FR-031**: El admin MUST poder revocar el acceso de un asistente activo con confirmación explícita.
- **FR-032**: Al revocar, el sistema MUST marcar la membresía como inactiva sin eliminar la cuenta del asistente.
- **FR-033**: El sistema MUST registrar el evento de revocación en auditoría con identidad del admin, timestamp y asistente afectado.
- **FR-034**: El admin MUST poder reactivar un asistente previamente revocado re-invitándolo con el mismo email; el sistema MUST reutilizar el row existente en vez de crear duplicado.

**Navegación y onboarding**

- **FR-035**: Después de aceptar invitación, el asistente MUST aterrizar directamente en el dashboard asistente con el contexto de la clínica correcta.
- **FR-036**: Si un usuario tiene membresías en múltiples clínicas, el sistema MUST elegir la primera activa para el contexto default (UI de switch queda en backlog).

### Key Entities *(include if feature involves data)*

- **Clinic Invitation**: representa la intención del admin de sumar a una persona a su clínica. Claves: email destinatario, clínica de origen, admin invitador, rol (asistente), token único, estado (pendiente / aceptada / expirada / cancelada), fecha de expiración, flag existing_patient.
- **Organization Member**: representa la membresía activa de un usuario dentro de una organización (clínica). Claves: usuario, organización, rol dentro de la organización (dentist / clinic_admin / assistant), estado activo/inactivo, referencia a la invitación que lo creó (trazabilidad).
- **User Profile**: rol base del usuario en la plataforma (paciente, dentista, clínica, asistente). Para asistentes puede mantenerse como paciente si el email preexistía, delegando el rol operativo a Organization Member.
- **Audit Log Entry**: registro append-only de cada acceso del asistente a datos de pacientes ajenos y de cada evento de revocación. Claves: quién, cuándo, qué recurso, desde qué contexto (clínica).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El admin puede completar el envío de una invitación en menos de 1 minuto desde que llega a la página de gestión de equipo.
- **SC-002**: El invitado puede aceptar la invitación y aterrizar en su dashboard en menos de 3 minutos desde que hace click en el email (incluyendo signup si es nuevo).
- **SC-003**: 100% de los intentos directos de un asistente a información clínica restringida son rechazados por el sistema (ya sea con acceso denegado o dato vacío), incluso cuando se fuerza la URL o se manipula la request.
- **SC-004**: 100% de los accesos del asistente a datos de pacientes ajenos quedan registrados en el log de auditoría.
- **SC-005**: La tasa de invitaciones que terminan siendo aceptadas exitosamente es superior al 80% (excluyendo expiradas por tiempo).
- **SC-006**: Ningún asistente puede quedar asociado a una clínica sin haber pasado por el flujo de invitación válido (sin backdoor).
- **SC-007**: Cuando un admin revoca a un asistente, el asistente pierde acceso en su próxima carga de página (máximo 30 segundos después de la revocación si recarga).
- **SC-008**: El admin puede identificar visualmente en la lista si un email de invitación fue entregado o rebotó, en el plazo que el proveedor reporte el estado (típicamente <5 min).

## Assumptions

- La tabla de invitaciones existente se extiende para soportar el rol `assistant` (hoy soporta solo dentista). No se crea tabla nueva.
- La tabla de membresías organizacionales ya existe con los campos necesarios (usuario, organización, rol, estado activo, timestamps). Si falta algún campo, se agrega en la migración correspondiente.
- Cada clínica registrada tiene una organización asociada; la relación entre clínica y organización está resuelta en el modelo actual.
- Solo hay UN admin por clínica en MVP (el creador de la cuenta clínica). Múltiples admins queda fuera de scope.
- El proveedor de email transaccional ya está configurado para el dominio; el envío de invitaciones reutiliza la misma infra que notificaciones existentes.
- Los asistentes trabajan con navegadores modernos (últimas 2 versiones de Chrome/Safari/Firefox). Experiencia mobile-friendly pero no app nativa.
- El flujo multi-clínica (un mismo asistente en varias clínicas) se soporta técnicamente pero no tiene UI de switch en MVP — el sistema elige default una clínica y el usuario queda en ese contexto.
- La información de contacto del paciente (nombre, email, teléfono) NO se considera "datos clínicos sensibles" bajo Ley 20.584 art. 12; son datos administrativos necesarios para la gestión de la cita. El logger de acceso clínico queda reservado para acceso a historial clínico, tratamientos, evoluciones.
- El consentimiento del paciente (Ley 21.719) incluye en su redacción la posibilidad de acceso por personal administrativo de la clínica (a confirmar con la versión final del documento de consentimiento clínico).
- El beta maneja un máximo aproximado de 10 clínicas con ~3 asistentes cada una. Performance y límites de plan no son preocupación del MVP.
