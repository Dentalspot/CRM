# Feature Specification: Fix — First Odontogram Evaluation Not Logged to clinical_audit_log

**Feature Branch**: `001-fix-odontogram-audit-log`
**Created**: 2026-04-19
**Status**: 🛑 PAUSED — blocked by spec 002 (routing upstream)
**Input**: User description: "primera creación de evaluación de odontograma no registra línea en clinical_audit_log. El fix previo en OdontogramEvaluationPage.jsx (~línea 176) usa `window.history.replaceState` tras crear la evaluación, lo que bypassa React Router y deja al hook `useClinicalAccessLogger` sin detectar la primera apertura. Comportamiento observado en producción: la primera evaluación no queda registrada — el log solo aparece tras refresh o navegación posterior. Reportado como 'quick-win de 5 minutos' en el roadmap del 18-abril-2026 pero sigue vivo."

## 🛑 PAUSED — Blocked by spec 002 (routing upstream)

**Descubrimiento durante `/speckit-plan` (2026-04-19):** el fix propuesto — reemplazar `window.history.replaceState` por `navigate('/dashboard/odontograma/${data.id}', { replace: true })` — asume que la ruta `/dashboard/odontograma/*` existe. La ruta realmente registrada es `/dashboard/therapist/odontograma/*`, bajo el bloque `<Route path="therapist">` en `src/app/routers/DashboardRouter.jsx:123-206`.

Aplicar el fix tal como está planeado convertiría un bug silencioso (log no dispara por `replaceState` bypassando React Router) en una regresión visible (404 renderizado tras crear evaluación), porque `navigate()` sí dispara re-matching del router y el path no matchea ninguna ruta registrada.

**Spec bloqueadora:** `002-fix-odontogram-routing-mismatch` — alinea los 7 callsites existentes al prefijo `therapist/` mediante enfoque A2 (actualizar callsites, no mover rutas).

**Cuando 002 cierre,** se reanuda esta spec con el único ajuste de usar el path correcto con prefijo en el `navigate`. El diff técnico pasa de 1 línea con path sin prefijo a 1 línea con path con prefijo; el resto del plan (criterio de dedup, test manual, FR, SC) permanece válido.

**Trazabilidad:** reporte detallado en la conversación del asesor del 2026-04-19 (sesión de investigación de DashboardRouter.jsx), basado en evidencia citada de 7 callsites:
- `src/components/layout/Sidebar.jsx:161`
- `src/pages/therapist/PatientFilePage.jsx:363`
- `src/features/odontogram/pages/OdontogramListPage.jsx:72, 150, 199`
- `src/features/odontogram/pages/OdontogramEvaluationPage.jsx:112, 346` (la línea 176 es parte del fix de esta spec, no de 002)

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Paciente ve el primer acceso a su evaluación de odontograma (Priority: P1)

Cuando un dentista crea una nueva evaluación de odontograma para un paciente, ese primer acceso clínico al recurso queda inmediatamente registrado y visible para el paciente en su historial de accesos a la ficha.

**Why this priority**: Es el caso que actualmente falla y bloquea derechos ARCO del paciente bajo Ley 21.719. Constitución III (Append-Only Clinical Audit) lo cataloga como violación: ningún componente puede leer o crear datos clínicos sin dejar rastro en `clinical_audit_log`. Sin este fix, el paciente no puede ejercer su derecho de acceso sobre la primera apertura de su odontograma — exactamente el contrato que define el valor del producto (historia fundacional #3: "Profesional acusada injustamente").

**Independent Test**: Puede validarse completamente ejecutando el flujo manual: dentista crea evaluación nueva, y se comprueba con una consulta SQL sobre `clinical_audit_log` que existe exactamente una fila nueva con `resource='odontogram'`, `action='open'` y el `patient_id` correcto, dentro de los segundos siguientes a la creación.

**Acceptance Scenarios**:

1. **Given** un dentista autenticado con un paciente asignado y sin evaluaciones previas de odontograma en la última hora, **When** crea una nueva evaluación desde el módulo Odontograma, **Then** se registra una (y solo una) fila en `clinical_audit_log` con `resource='odontogram'`, `action='open'`, `patient_id` del paciente correcto, `user_id` del dentista y `organization_id` de la clínica activa.
2. **Given** que la evaluación acaba de crearse, **When** el paciente consulta su "Historial de accesos" desde su portal, **Then** ve el acceso del dentista con timestamp dentro del último minuto.
3. **Given** la creación acaba de ejecutarse, **When** el dentista observa la URL del browser, **Then** la URL muestra `/dashboard/odontograma/<evaluation-id>` y el estado interno del router está sincronizado con esa URL.

---

### User Story 2 — El botón atrás del browser funciona sin duplicar registros (Priority: P2)

Tras crear una evaluación, el dentista puede presionar el botón atrás del browser para volver a la vista previa sin re-disparar la creación, sin entrar en loops de navegación, y sin introducir líneas duplicadas en el log.

**Why this priority**: Es regresión potencial del fix. Reemplazar `replaceState` por una navegación gestionada por React Router puede alterar el historial del browser. Si el atrás recrea la evaluación o vuelve a disparar el logger sobre la misma evaluación dentro de la misma hora, se rompen Constitution V (UI Honesty) y el invariante append-only "1 línea por evaluación por hora".

**Independent Test**: Crear evaluación, presionar atrás, volver a ver historial de `clinical_audit_log` para ese paciente — debe seguir habiendo exactamente una línea por la evaluación creada.

**Acceptance Scenarios**:

1. **Given** un dentista acaba de crear una evaluación nueva y está en `/dashboard/odontograma/<evaluation-id>`, **When** presiona el botón atrás del browser, **Then** es llevado a la vista previa (listado de odontogramas o ficha de paciente, según el origen) sin crear una nueva evaluación ni duplicar la fila en `clinical_audit_log`.
2. **Given** el dentista navegó atrás, **When** navega de nuevo adelante hacia la evaluación, **Then** la evaluación se abre correctamente; si ocurre dentro de la misma hora, no se añade nueva fila al log (dedup anti-spam).

---

### User Story 3 — Refresh de página no duplica el registro (Priority: P3)

El refresh del navegador sobre la página de evaluación respeta la invariante anti-spam: si el dentista ya accedió a esa evaluación dentro de la última hora, no se añade una nueva fila al log.

**Why this priority**: Cualidad menor pero crítica para respetar el "doble seguro contra spam" documentado en `.specify/memory/data-compliance.md`. Si se rompe, el fix introduce ruido en el historial y degrada la lectura del paciente.

**Independent Test**: Crear evaluación, refrescar F5, consultar el log: la línea original sigue siendo la única.

**Acceptance Scenarios**:

1. **Given** una evaluación creada hace menos de una hora con una línea en `clinical_audit_log`, **When** el dentista refresca la página `/dashboard/odontograma/<id>`, **Then** el log sigue mostrando exactamente una línea para esa combinación `user_id + patient_id + resource + evaluation-id` en esa hora.

---

### Edge Cases

- **Fallo silencioso del insert en el log**: si la creación de la evaluación es exitosa pero el insert en `clinical_audit_log` falla (por RLS, por timeout), ¿qué ve el usuario? Comportamiento esperado: la evaluación queda creada, la UI muestra la evaluación, y el fallo del logger queda registrado en la consola del cliente (comportamiento actual del `clinicalAuditLogger.js`). No se muestra toast de éxito mentiroso sobre el acceso clínico (Constitution V). Este caso no se re-ingeniera en esta spec — se hereda del contrato actual del logger.
- **Creación de múltiples evaluaciones para el mismo paciente en la misma hora**: el comportamiento de dedup del logger (1 línea por hora por patient+resource+user) debe auditarse para confirmar si la clave de deduplicación incluye `evaluation_id`; si no lo incluye, la segunda evaluación para el mismo paciente en la misma hora podría quedar sin registrar. Este caso se documenta como supuesto a validar en `/speckit-plan` antes de tocar código — el scope de la spec NO incluye modificar el logger.
- **Sesión expirada al crear**: si la sesión expira entre abrir el formulario y crear, la creación falla en backend (RLS rechaza), no se debe mostrar "Guardado" y no se debe intentar navegar (Constitution V).
- **Doble-click rápido en "Crear"**: el botón debería estar deshabilitado durante la request para evitar doble creación. Este caso se documenta como verificación en test manual, no como requisito nuevo (si ya está resuelto en el código, confirmar; si no, marcar como bloque siguiente — scope cerrado).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST registrar una y solo una fila nueva en `clinical_audit_log` en el flujo de primera creación de una evaluación de odontograma por parte de un dentista, sin necesidad de refresh ni navegación posterior.
- **FR-002**: La fila registrada MUST contener `resource='odontogram'`, `action='open'`, `patient_id` del paciente de la evaluación, `user_id` del dentista autenticado y `organization_id` de la clínica activa.
- **FR-003**: Tras la creación exitosa de la evaluación, la URL del browser MUST reflejar la ruta canónica `/dashboard/odontograma/<evaluation-id>` y el estado interno del router MUST estar sincronizado con esa URL (no debe quedar en estado "modo creación" mientras la URL muestra el id).
- **FR-004**: El botón atrás del browser MUST devolver al usuario a la vista previa (listado o ficha) sin disparar la creación de una nueva evaluación y sin insertar líneas duplicadas en `clinical_audit_log`.
- **FR-005**: La deduplicación anti-spam existente (máximo una línea por hora para la misma combinación `user_id + patient_id + resource` aplicable a esa evaluación) MUST continuar operando sin cambios; refresh dentro de la misma hora NO añade líneas adicionales.
- **FR-006**: El sistema MUST NO introducir regresiones en los flujos existentes de odontograma: guardado, cierre, reapertura, navegación desde el listado (`OdontogramListPage`) y desde la ficha de paciente (`PatientFilePage`).
- **FR-007**: El fix MUST operar dentro del contrato actual del hook `useClinicalAccessLogger` y del logger `clinicalAuditLogger.js` — ningún cambio a esos módulos entra en scope de esta spec (Constitution IV, Micro-Bloques).
- **FR-008**: El sistema MUST NO mostrar toast de éxito para el paso "registro en el log" si el insert al log falló (comportamiento heredado del logger actual). El toast de éxito de la creación de la evaluación se rige por el contrato existente de `supabase .select('id')` (Constitution V).

### Key Entities *(include if feature involves data)*

- **Evaluación de odontograma**: Registro clínico de una revisión odontológica. Se identifica por un id único. Está asociada a un paciente y a un dentista dentro de una clínica.
- **Línea de `clinical_audit_log`**: Registro append-only e inmutable de un acceso clínico. Atributos relevantes: `user_id` (quién accedió), `patient_id` (cuyo dato se vio), `organization_id` (bajo qué clínica), `resource` (qué tipo de recurso — aquí `odontogram`), `action` (qué acción — aquí `open`), `created_at` (cuándo).
- **Vista de historial de accesos del paciente**: Página `PatientAccessHistoryPage` donde el paciente consulta, en ejercicio de su derecho ARCO, qué profesionales han accedido a su ficha y cuándo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% de las primeras creaciones de evaluaciones de odontograma registradas en staging durante la sesión de validación manual aparecen en `clinical_audit_log` dentro de los 5 segundos siguientes a la creación, sin requerir refresh ni navegación adicional.
- **SC-002**: 0 duplicados por evaluación por hora — la invariante anti-spam del logger se mantiene verificable consultando `clinical_audit_log` después de un refresh o navegación adelante/atrás dentro de la misma hora.
- **SC-003**: 100% de los casos de "botón atrás" tras creación terminan en la vista previa esperada (listado u origen), sin crear una evaluación fantasma ni duplicar líneas de log, medido en los 3 escenarios de test manual descritos en FR-004.
- **SC-004**: El paciente puede ver el 100% de los accesos del dentista a su evaluación de odontograma — incluyendo el primero — en su `PatientAccessHistoryPage` tras la sesión del dentista, sin excepciones.
- **SC-005**: 0 regresiones observables en los flujos existentes del módulo Odontograma (guardar, cerrar, reabrir, listar) tras el fix, verificado en recorrido manual estructurado antes del deploy.

## Assumptions

- El hook `useClinicalAccessLogger` y el módulo `clinicalAuditLogger.js` implementan correctamente la dedup anti-spam "1 línea por hora" y su clave de deduplicación permite distinguir creaciones sucesivas de evaluaciones; si la auditoría de `/speckit-plan` revela lo contrario, el plan lo reporta y el scope se ajusta antes de implementar.
- La API correcta de React Router v6 para actualizar la URL sin disparar creación duplicada y manteniendo el estado del router sincronizado es `navigate(path, { replace: true })` — la elección final se decide en `/speckit-plan` tras inspección directa del archivo.
- La tabla `clinical_audit_log` y sus triggers append-only ya existen en la migración `20260416000001_rls_phase3_compliance.sql` — esta spec NO requiere cambios de schema, policies ni migraciones (Constitution VI, Schema Drift Zero).
- El fix es localizado a `src/features/odontogram/pages/OdontogramEvaluationPage.jsx` salvo que `/speckit-plan` identifique la necesidad de un ajuste en un archivo directamente relacionado; en ese caso se re-aprueba el scope explícitamente.
- El entorno de validación dispone de acceso a la base de datos Supabase (vía consola web, MCP o psql) para ejecutar la consulta SELECT sobre `clinical_audit_log` post-creación.
- Existe al menos una cuenta de dentista y un paciente asignado en el ambiente de validación con permiso para crear evaluaciones de odontograma.
- El comportamiento actual de creación (el insert SQL a la tabla de evaluaciones de odontograma y la respuesta con el id) es correcto — el bug observado es exclusivamente del registro de auditoría, no de la creación en sí.

## Out of Scope

Se enuncia explícitamente lo que NO entra en esta spec, en cumplimiento del principio IV (Micro-Bloques):

- Cambios a `src/lib/audit/clinicalAuditLogger.js`.
- Cambios a `src/lib/audit/useClinicalAccessLogger.js`.
- Cambios a policies RLS, triggers, migraciones o edge functions.
- Refactor del módulo `src/features/odontogram/` más allá del archivo `OdontogramEvaluationPage.jsx`.
- Auditoría o migración del mismo patrón `replaceState` en otros módulos (si existe en otras páginas clínicas, se documenta como candidato a spec dedicada).
- Cambios a `PatientAccessHistoryPage.jsx`, `PatientFilePage.jsx` ni a `OdontogramListPage.jsx`.
- Commits o pushes — los hace Danissa Klagges.

## Compliance Alignment

Esta spec es la primera aplicación del flujo Spec Kit en DentalSpot y existe para cerrar una violación directa de Constitution III:

- **Constitution I (Compliance-First)**: la feature existe precisamente para restaurar compliance con Ley 21.719 (derecho ARCO a conocer accesos a la ficha).
- **Constitution III (Append-Only Clinical Audit)**: el objetivo mismo del fix es restaurar el rastro append-only del primer acceso.
- **Constitution IV (Micro-Bloques)**: scope cerrado a un solo archivo; lo que queda fuera está nombrado en "Out of Scope"; reporte post-implementación obligatorio.
- **Constitution V (UI Honesty)**: el fix NO debe introducir toasts de éxito sobre acciones que no ocurrieron (p.ej., si el insert al log falla).
- **Constitution VI (Schema Drift Zero)**: sin cambios de schema — solo se usa infraestructura ya migrada.

## Schema Drift Note (descubierto durante plan)

Los docs fundacionales en `.specify/memory/` y `CLAUDE.md` referencian `clinical_access_log` como tabla del audit trail general, pero esa tabla pertenece al módulo `clinical-passport` (pasaporte clínico entre profesionales). La tabla real del audit trail general — consumida por `src/lib/audit/clinicalAuditLogger.js` — es `clinical_audit_log` (migración `20260415100000_organization_model_schema.sql:157`, con triggers append-only `trg_audit_log_no_update` y `trg_audit_log_no_delete`).

Ambas tablas son activas y legítimas, con propósitos distintos:

- `clinical_audit_log` → acceso, edición, creación, impresión y export de registros clínicos (action: `view_record`, `edit_record`, `create_record`, `export_file`, `print_record`)
- `clinical_access_log` → grants, shares, revokes y descargas del pasaporte clínico (action: `grant`, `share`, `revoke`, `download_pdf`, `auto_grant`, `export`)

Este fix opera sobre `clinical_audit_log` (la tabla correcta para el caso "dentista abre evaluación de odontograma"). La corrección de los 4 docs fundacionales + `CLAUDE.md` — para documentar ambas tablas distintamente y reconocer que `clinical-passport` es infraestructura parcialmente implementada del Pasaporte Clínico Universal del ecosistema Communicare — se maneja en micro-bloque separado (candidato: spec `docs-schema-drift-correction`) tras cerrar 001.

## References

- `.specify/memory/constitution.md` — Principios III, IV, V, VI.
- `.specify/memory/data-compliance.md` — Sección "Auditoría clínica (derecho de acceso ARCO)".
- `.specify/memory/architecture.md` — Sección "Router" y "Providers".
- `Dentalspot_Estado_y_Roadmap.pdf` (18-abril-2026) — entrada original del bug.
- Audit FASE 1 (2026-04-19) — confirmación de `replaceState` vivo en `OdontogramEvaluationPage.jsx:176`.
