# Feature Specification: Fix — `clinical_audit_log` silencioso (restaurar escritura del audit clínico)

**Feature Branch**: `003-fix-audit-log-silent`
**Created**: 2026-04-19
**Status**: Draft
**Priority**: 🚨 **P0 — Compliance (Constitution III + Ley 21.719)**
**Input**: User description: "La tabla `clinical_audit_log` no recibe escrituras desde 2026-04-18 06:57 UTC. Detectado durante el test manual de spec 001 el 2026-04-19. El hook `useClinicalAccessLogger` se invoca correctamente en `PatientFilePage.jsx` y `OdontogramEvaluationPage.jsx`, pero NO registra entradas. 7 filas históricas hasta 18-abr, silencio total después. Diagnóstico parcial: policy RLS `cal_dentist_insert` exige `is_in_care_team(patient_id)`; tabla `care_team` NO existe en DB (`ERROR 42P01`); función `is_in_care_team` probablemente hace fallback a `patients.therapist_id` y algo del 18-abr lo rompió. Cristóbal tiene role=dentist activo en 2 orgs, sin drift de nomenclatura entre hook JS y policy RLS. Objetivo: restaurar escritura del log sin relajar la restricción RLS, idealmente sin crear tabla nueva."

## 🚨 Compliance Impact (leer antes de plan)

Esta spec existe porque **Constitution III (Append-Only Clinical Audit) está violada en producción desde 2026-04-18 06:57 UTC** (ventana >36h al momento de detección). Cada hora adicional sin fix suma a la brecha.

- **Ley 21.719 ARCO** — si un paciente pide hoy su historial de accesos (`PatientAccessHistoryPage`), verá 0 entradas para los últimos ~36h aunque los dentistas sí hayan accedido. Las entradas que ARCO debería mostrar nunca existieron en la tabla.
- **Defensa del profesional (historia fundacional #3 "dermatóloga acusada")** — en esta ventana los dentistas accedieron a fichas sin rastro; si un paciente reclamara por accesos indebidos en este período, no hay cómo defenderse con el log (porque no existe).
- **No se puede falsificar** — Constitution III es append-only, las entradas missing no pueden fabricarse retroactivamente; la ventana de compliance violada queda documentada como brecha conocida (ver US2 + FR-006).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Dejar rastro cuando el dentista accede a una ficha clínica (Priority: P1 🎯)

El dentista autenticado abre la ficha clínica de un paciente o crea/abre una evaluación de odontograma, y esa acción queda registrada **inmediatamente** en `clinical_audit_log` con la información necesaria para que el paciente la pueda ver en su historial de accesos.

**Why this priority**: es el objetivo primario de la spec. Sin esto, Constitution III sigue violada y la brecha de compliance sigue creciendo. Spec 001 técnicamente corrigió el hook en odontograma, pero la fila no se inserta por un bug downstream en el path de escritura — el fix de 001 no se completa hasta que 003 cierre.

**Independent Test**: con la cuenta de prueba (Cristóbal, `user_id = 4e55fb74-b3b5-4233-9b5d-88d7a01a9046`) en producción, abrir una ficha de paciente suyo → ejecutar `SELECT * FROM clinical_audit_log WHERE user_id = '<cristobal>' AND patient_id = '<paciente>' AND created_at > NOW() - INTERVAL '2 minutes';` → la query devuelve ≥1 fila.

**Acceptance Scenarios**:

1. **Given** un dentista autenticado con rol `dentist` activo en una organización y con relación legítima a un paciente (mecanismo definido por la DB actual — `patients.therapist_id` o equivalente), **When** abre la ficha clínica del paciente (`/dashboard/patients/<patient-id>`), **Then** se inserta 1 fila nueva en `clinical_audit_log` con `user_id` del dentista, `patient_id` del paciente, `organization_id` de la org activa, `resource_type='clinical_record'`, `action='view_record'`, dentro de los 5 segundos tras el mount del componente.
2. **Given** el mismo dentista en el flujo de creación de evaluación de odontograma (path `/dashboard/therapist/odontograma/nueva` → "Iniciar Evaluación"), **When** la evaluación se crea y el componente queda montado sobre `/dashboard/therapist/odontograma/<uuid>`, **Then** se inserta 1 fila nueva en `clinical_audit_log` con `resource_type='odontogram'`, `resource_id=<uuid>`, `action='view_record'`.
3. **Given** la fila recién insertada existe, **When** el paciente consulta su `PatientAccessHistoryPage`, **Then** ve el acceso del dentista con el timestamp correcto.

---

### User Story 2 — Transparencia sobre la ventana de compliance violada (Priority: P2)

El sistema no falsifica entradas retroactivas en `clinical_audit_log` para cubrir la ventana 2026-04-18 06:57 → fecha del fix, pero tampoco oculta que hubo una ventana. La existencia de la brecha queda documentada en un lugar auditable (commit del fix + opcional: nota en `.specify/memory/data-compliance.md` + opcional: entrada administrativa única en el log marcando "technical gap, no per-patient data").

**Why this priority**: Constitution V (UI Honesty) + Constitution III (Append-Only). No se puede fabricar historial; ocultar la brecha tampoco es honesto. Esta US define cómo se expone la brecha sin comprometer la integridad del log.

**Independent Test**: post-fix, leer el commit message del fix y `.specify/memory/data-compliance.md` — la ventana 18-abr 06:57 → fecha del fix debe estar explícita con 1 frase. Si se decidió agregar una fila administrativa única al log, debe existir en la DB con `action` especial (ej. `technical_gap_marker`) y sin `patient_id` (porque no es per-paciente).

**Acceptance Scenarios**:

1. **Given** el fix cerrado y deployado, **When** una auditoría externa revisa el commit del fix, **Then** encuentra en el mensaje la mención explícita de la ventana "2026-04-18 06:57 UTC → <timestamp del fix> UTC: compliance Constitution III violada; causa raíz + fix aplicado".
2. **Given** el `.specify/memory/data-compliance.md` se actualiza (opcional, decidido en plan), **When** se lee, **Then** contiene una subsección "Brechas conocidas" o equivalente con la ventana del 18-abr documentada.
3. **Given** si el plan decide agregar entrada administrativa al log (opcional), **When** se consulta, **Then** existe 1 fila con `action='technical_gap_marker'` (o similar), `patient_id = null`, timestamp al momento del fix, describiendo la brecha sin datos per-paciente.

---

### Edge Cases

- **Pacientes pre-organization-model**: los pacientes creados antes de la migración `20260415100000_organization_model_schema.sql` podrían tener `organization_id = NULL` o asignaciones antiguas vía `therapist_id`. El fix debe funcionar sobre estos pacientes legacy sin requerir backfill masivo.
- **Dentista con múltiples organizaciones**: Cristóbal tiene 2 orgs activas. Al hacer INSERT, `organization_id` viene del contexto frontend (`currentOrganizationId`); si el dentista cambia de org activa entre renders, el log debe reflejar la org vigente al momento del insert.
- **Paciente sin relación legítima con el dentista**: si un dentista intenta acceder a la ficha de un paciente con el cual no tiene relación (ni `therapist_id`, ni membership en `care_team` si existiera), la policy RLS sigue rechazando el INSERT. El logger loggea el fallo en DEV y retorna silenciosamente en PROD — comportamiento correcto, sin cambio. Esta spec NO relaja la restricción.
- **Sesión expirada durante la creación de evaluación**: si la sesión JWT expira entre el insert de la evaluación y el insert del log, el log puede fallar con error de auth. Comportamiento heredado del logger; se acepta y no se re-ingeniera en esta spec.
- **Múltiples evaluaciones del mismo paciente en la misma hora**: dedup anti-spam actual (FR-003) sigue operando — solo 1 línea por `user_id + patient_id + action + resourceType` por hora. El caso donde se crean evaluaciones A y B del mismo paciente en la misma hora solo loggea la primera. Gap pre-existente; spec dedicada `audit-logger-resource-dedup` pendiente. Out of scope acá.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Al montar `PatientFilePage` con un paciente válido y un dentista autenticado con rol `dentist` activo y relación legítima al paciente, el sistema MUST insertar **exactamente 1 fila** en `clinical_audit_log` dentro de los 5 segundos tras el mount, con los campos `user_id`, `patient_id`, `organization_id`, `resource_type='clinical_record'`, `action='view_record'`, `resource_id=<patient_id>`, `created_at` (server default), y los 3 campos nullable (`grant_id`, `reason`, `ip_address`) en `null`.
- **FR-002**: Al montar `OdontogramEvaluationPage` con una evaluación existente O al crear una nueva, el sistema MUST insertar 1 fila en `clinical_audit_log` con `resource_type='odontogram'`, `resource_id=<evaluation UUID>`, `action='view_record'`, y los mismos campos básicos de FR-001.
- **FR-003**: El dedup anti-spam por hora existente (`hourBucketKey` usando `user_id + patient_id + action + resource_type + año-mes-día-hora` en `sessionStorage`) MUST continuar operando sin cambios. Un refresh o re-apertura del mismo recurso en la misma hora NO añade filas adicionales.
- **FR-004**: El sistema MUST NO modificar la tabla `clinical_access_log` (distinta de `clinical_audit_log`, pertenece al módulo `clinical-passport`). Referencia: Schema Drift Note de spec 001.
- **FR-005**: La policy RLS `cal_dentist_insert` MUST seguir siendo **estricta**: el INSERT solo se permite cuando el dentista tiene relación legítima con el paciente. Si la función `is_in_care_team(patient_id)` (o su reemplazo) determina que no hay relación, el INSERT es rechazado. El fix **no debe relajar** esta restricción para hacer que el log funcione — debe restaurar el mecanismo de detección de relación legítima.
- **FR-006**: El commit que cierra esta spec MUST mencionar explícitamente en su mensaje:
  - La ventana temporal de compliance violada: `2026-04-18 06:57 UTC → <timestamp del fix> UTC`.
  - La causa raíz identificada por el plan (p. ej. "función `is_in_care_team` depende de tabla `care_team` inexistente; restaurado fallback a `patients.therapist_id`").
  - La referencia al principio violado (Constitution III) y la ley aplicable (21.719 ARCO).
- **FR-007**: El fix MUST preservar el comportamiento append-only de la tabla (triggers `trg_audit_log_no_update` y `trg_audit_log_no_delete` en migración `20260415100000_organization_model_schema.sql`) sin alterarlos.
- **FR-008**: El fix MUST operar dentro del contrato actual del hook `useClinicalAccessLogger` y del logger `clinicalAuditLogger.js` — ningún cambio de frontend entra en scope salvo que el plan identifique una razón concreta ligada al diagnóstico (en cuyo caso se re-aprueba scope antes de tocar).

### Key Entities

Esta spec opera sobre entidades existentes; no crea ninguna nueva.

- **`clinical_audit_log`** — tabla append-only con triggers `trg_audit_log_no_update` y `trg_audit_log_no_delete`. Policies: `cal_dentist_insert`, `cal_admin_insert`, `cal_admin_select`, `cal_platform_admin_select`.
- **`organization_members`** — membresía con roles (`dentist`, `clinic_admin`, etc.). Fuente de verdad para `userOrgRoles` en el hook.
- **`is_in_care_team(patient_id)`** — función SQL invocada por la policy RLS `cal_dentist_insert`. Comportamiento actual desconocido; a investigar en el plan. Probablemente consulta una tabla que no existe o un mecanismo legacy (`patients.therapist_id`).
- **`care_team`** — tabla referenciada por el nombre de la función, **NO existe** en la DB actual (`ERROR 42P01`). No se crea en esta spec.
- **`patients.therapist_id`** — columna legacy. Probable objeto real del fallback. A verificar en el plan.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% de los 2 flujos clínicos principales (apertura de `PatientFilePage` + creación/apertura de evaluación odontograma) generan 1 fila nueva en `clinical_audit_log` por acceso, validado por query SQL post-fix en staging/prod con la cuenta de prueba.
- **SC-002**: El dedup anti-spam por hora sigue operando: al refrescar F5 sobre el mismo recurso dentro de la misma hora, la query SQL devuelve la misma cantidad de filas (sin duplicación).
- **SC-003**: 0 regresiones en flujos no-clínicos (login, Sidebar, listado de pacientes, creación de nuevo paciente, módulos hermanos como notiz / questions / pie).
- **SC-004**: La ventana de compliance violada (2026-04-18 06:57 UTC → timestamp del commit del fix) queda documentada en 2 lugares mínimos: (1) mensaje del commit de este fix, (2) opcional según plan: `.specify/memory/data-compliance.md`. Si el plan decide no tocar docs fundacionales (micro-bloque separado), al menos el commit debe contener la mención.
- **SC-005**: Al aplicar el fix, no se introducen entradas retroactivas fabricadas en `clinical_audit_log` para cubrir la ventana — la tabla sigue siendo fiel reflejo de accesos reales (Constitution III append-only respetado).
- **SC-006**: Un paciente que consulta su `PatientAccessHistoryPage` después del fix ve las nuevas entradas de accesos reales post-fix, sin que haya entradas falsas en el período 18-abr → fix para ese paciente.

## Assumptions

- **Hook y logger actuales son correctos** — no hay nomenclature drift (`userOrgRoles.includes('dentist')` está alineado con `organization_members.role` y con el literal `'dentist'` de la policy `cal_dentist_insert`). Esto fue confirmado en la investigación read-only del 2026-04-19.
- **Cristóbal (cuenta de prueba) tiene rol `dentist` activo** en al menos 1 organización — query confirmada.
- **La ruptura del 18-abr fue causada por una migración de ese día** — `20260418000001_get_patient_consent_status.sql` o `20260418000002_revoke_anon_get_patient_consent_status.sql`, según timeline. El plan verificará leyendo el contenido de ambas migraciones.
- **La función `is_in_care_team` existe en la DB** como SQL function aunque la tabla `care_team` no — hipótesis: función con fallback a `patients.therapist_id` que algo del 18-abr rompió (ej. REVOKE de permisos, DROP del fallback, cambio en signatura).
- **`patients.therapist_id` sigue siendo una columna funcional** para expresar la relación 1-dentista-por-paciente en el modelo actual. Si esto resulta falso (ej. la columna fue renombrada o eliminada), el plan debe reportar antes de tocar código.
- **El fix es factible sin crear la tabla `care_team`** — crear `care_team` con modelo multi-dentista + UI asociada es scope de una spec futura ligada al Pasaporte Clínico, no entra acá.
- **Otras apps del ecosistema Communicare (FONOKIT)** no están afectadas por este bug (tablas RLS distintas por app).
- **El test manual lo ejecuta Danissa** en producción con la cuenta de prueba, post-implementación, siguiendo acceptance scenarios de US1.

## Out of Scope

Enumeración explícita por Constitution IV (Micro-Bloques):

- **Creación de la tabla `care_team`** con modelo multi-dentista + UI de gestión — spec futura `care-team-implementation`, ligada al Pasaporte Clínico Universal del ecosistema Communicare.
- **UI de invitación de `clinic_admin` o `assistant`** — spec futura `multi-role-invitation-flow`.
- **Agregar `resource_id` al `hourBucketKey` del dedup** — spec futura `audit-logger-resource-dedup` (gap pre-existente ya identificado).
- **Corregir referencias a `clinical_audit_log` vs `clinical_access_log`** en los 4 docs fundacionales + CLAUDE.md — spec futura `docs-schema-drift-correction`.
- **Actualizar memoria FONOKIT** sobre Pasaporte Clínico parcialmente implementado — spec futura `update-fonokit-memory-communicare`.
- **Backfill de entradas retroactivas** en `clinical_audit_log` para cubrir la ventana 18-abr → fix — prohibido por Constitution III (append-only) y por FR-005 de esta spec.
- **Cambios a `src/lib/audit/*`** (logger o hook frontend) salvo que el plan identifique una razón específica ligada al diagnóstico (gate explícito).
- **Cambios a otras policies RLS** que no sean `cal_dentist_insert` o funciones que ésta invoca directamente (p. ej. `is_in_care_team`).
- **Policy SELECT para que el paciente lea sus propias filas** de `clinical_audit_log` — no existe en migraciones actuales; probablemente `PatientAccessHistoryPage` lee vía RPC/function `security_definer` (mencionada en migración `20260416000001_*` línea 155). A confirmar en plan, pero fuera de scope si ya funciona.
- **Commits y pushes** — los hace Danissa tras aprobar el test manual (workflow advisor/executor).

## Compliance Alignment

Esta spec es la continuación directa del trabajo de spec 001 (que cerró el bug de `replaceState`) y cierra el gap real que quedó bloqueando el acceptance E2E.

- **Constitution I (Compliance-First)**: la feature existe **exclusivamente** para restaurar compliance Ley 21.719 ARCO. Cada hora sin fix = más brecha acumulada. Prioridad P0.
- **Constitution III (Append-Only Clinical Audit)**: el objetivo mismo del fix es restaurar la capacidad de escritura que implementa el principio. Además, FR-007 preserva los triggers append-only existentes, y SC-005 prohíbe fabricar entradas retroactivas.
- **Constitution IV (Micro-Bloques)**: scope cerrado al path de escritura (función SQL `is_in_care_team` + eventualmente policy RLS + backfill de datos mínimo). 9 ítems out-of-scope enumerados explícitamente.
- **Constitution V (UI Honesty)**: US2 + SC-005 + SC-006 garantizan transparencia de la brecha sin fabricar datos.
- **Constitution VI (Schema Drift Zero)**: si el plan descubre que `care_team` está referenciada sin existir (ya confirmado en investigación), esta es una violación existente que el fix debe documentar y resolver (ya sea creando un alias funcional, arreglando el fallback, o marcándolo como acepted debt con migración de "stub function" explícita).

## Relationship with Spec 001

Esta spec es el **bloqueador downstream** mencionado en el commit `dd7f02c` de spec 001 ("Este commit NO cierra el acceptance E2E de spec 001. Queda bloqueado por spec 003"). Al cerrarse 003:

1. La función `is_in_care_team(patient_id)` vuelve a devolver `true` para pacientes con relación legítima.
2. El INSERT del logger en `cal_dentist_insert` vuelve a ser permitido por RLS.
3. El test manual de spec 001 pasos T-08..T-10 (query SQL tras crear evaluación) retorna 1 fila nueva.
4. Spec 001 puede cerrarse formalmente con acceptance E2E completo (7/7 en vez del 6/7 actual).

## References

- `.specify/memory/constitution.md` — Principios I (Compliance-First), III (Append-Only), IV (Micro-Bloques), V (UI Honesty), VI (Schema Drift Zero).
- `.specify/memory/data-compliance.md` — Sección "Auditoría clínica (derecho de acceso ARCO)".
- `.specify/memory/architecture.md` — Sección "Frontend ↔ Supabase bridges" y "Technical debt inventory".
- `specs/001-fix-odontogram-audit-log/spec.md` — bloque RESUMED + Schema Drift Note + test manual parcial 6/7 PASS.
- `specs/002-fix-odontogram-routing-mismatch/spec.md` — prerequisito upstream (ya cerrado).
- Commit `dd7f02c` (2026-04-19) — cierre parcial de spec 001 con diagnóstico de este bloqueador incluido en el mensaje.
- Migración `20260415100000_organization_model_schema.sql:157-200` — creación de `clinical_audit_log` + triggers append-only.
- Migración `20260416000001_rls_phase3_compliance.sql:19-23` — policy `cal_dentist_insert` con `is_in_care_team(patient_id)`.
- Migración `20260418000002_revoke_anon_get_patient_consent_status.sql` — sospechosa del timeline; a investigar en plan.
- Investigación read-only del 2026-04-19 — confirmó que `care_team` no existe en DB, Cristóbal tiene rol `dentist` activo, y no hay nomenclature drift frontend↔RLS.

---

**Spec creada 2026-04-19 | Branch `003-fix-audit-log-silent` | Prioridad P0 | Bloqueante del acceptance E2E de spec 001.**
