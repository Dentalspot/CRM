---
description: "Task list for spec 028 — Appointment Dentist Assignment"
---

# Tasks: Appointment Dentist Assignment

**Input**: Design documents from `specs/028-appointment-dentist-assignment/`
**Prerequisites**: plan.md (loaded), spec.md (loaded), research.md (loaded), data-model.md (loaded), contracts/migration-20260529000001.md (loaded), contracts/frontend-component-contracts.md (loaded)

**Tests**: NO tests automatizados — DentalSpot no tiene framework de tests aún (deuda documentada en `.specify/memory/architecture.md`). Validación es smoke manual con cuentas reales en `quickstart.md`.

**Organization**: Tasks agrupados por user story (US1 P1 = MVP de obligatoriedad, US2/US3 P2 = default smart + filtro URL, US4/US5 P3 = reasignación + visual color). Migration SQL primero como prerequisito foundational.

**Legacy naming**: Mantenemos `therapist_id` en DB y código backend según decisión Founder Opción A. UI siempre dice "Dentista". Comentarios `// LEGACY NAMING` donde aplique.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Tareas que pueden ejecutarse en paralelo (archivos distintos, sin dependencias bloqueantes)
- **[Story]**: A qué user story sirve (US1, US2, US3, US4, US5). Sin label = Setup/Foundational/Polish.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pre-checks no destructivos antes de aplicar la migration

- [x] T001 Pre-check DB con `npx supabase db query --linked` ejecutando el bloque "Pre-checks DB" de quickstart.md (verificar 0 NULLs en `appointments.therapist_id`, listar citas cross-org si existen, confirmar `cristobal+ceballos+tatiana` están en `organization_members` de Los Álamos con roles correctos). Documentar el output en un comentario inicial al feature branch para referencia post-deploy.

- [x] T002 [P] Verificar que `getOrgDentists` en `src/lib/api/org.api.js` retorna `{id, full_name, email}` ordenado alfabéticamente (verificación de contrato — sin cambios al código). Anotar en plan.md si hay drift.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Migration SQL + hook reutilizable. NINGUNA tarea de user story puede empezar hasta que esto esté completo.

**⚠️ CRÍTICO**: T003 bloquea TODO (sin migration, los inserts con `'create'`/`'view'`/`'update'`/`'cancel'`/`'appointment_reassigned'` siguen fallando silenciosamente — UI parecería funcionar pero el audit log no se escribe).

- [x] T003 Crear migration `supabase/migrations/20260529000001_appointment_dentist_assignment.sql` siguiendo el contenido exacto especificado en `specs/028-appointment-dentist-assignment/contracts/migration-20260529000001.md`. Debe incluir: (a) función `check_appointment_dentist()` + trigger `trg_check_appointment_dentist`, (b) DROP + RECREATE de policy `appt_dentist_update` con `WITH CHECK`, (c) ALTER constraint `clinical_audit_log_action_check` agregando vocabulario nuevo, (d) ALTER constraint `clinical_audit_log_resource_type_check` agregando `'appointment'`.

- [x] T004 Aplicar la migration en LOCAL (`npx supabase migration up`) y correr post-check del quickstart.md (verificar trigger existe, policy tiene `with_check_expr` no-null, CHECK constraints expandidos). Verificar que `INSERT` de audit log con `action='appointment_reassigned'` no falla. Si el smoke falla, revertir y debuggear antes de continuar.

- [x] T005 [P] Crear hook `src/hooks/useUserRoleInOrg.js` con el contenido especificado en `contracts/frontend-component-contracts.md` §6. Retorna `{ roles, isDentist, isClinicAdmin, isAssistant, loading }` consultando `organization_members` con `user_id = auth.uid()` AND `organization_id = ?` AND `is_active = true`.

- [x] T006 [P] Extender `getOrgAppointments` en `src/lib/api/org.api.js` para admitir `therapistId = null` → query sin `.eq('therapist_id')`. Mantener backward compat (callers pasando uuid siguen funcionando). Agregar JSDoc explicando que `null = todas las citas de la org`.

**Checkpoint**: Foundation lista — la migration está aplicada en local, el hook está disponible, la API admite el modo "todos los dentistas". User stories pueden empezar.

---

## Phase 3: User Story 1 — Selector obligatorio en modal de agendamiento (Priority: P1) 🎯 MVP

**Goal**: La asistente/admin/dentista puede crear citas con un selector "Dentista *" obligatorio en el modal de agendamiento. Submit bloqueado si está vacío.

**Independent Test**: Login como tatiana (asistente), abrir modal "Agendar Nueva Cita", verificar que el campo "Dentista *" aparece entre "Fecha/Hora" y "Paciente", intentar submit vacío → bloqueado, seleccionar Dr. Tagle, crear cita, verificar que `appointments.therapist_id = uuid_tagle` en DB y entry en `clinical_audit_log` con `action='create'`, `resource_type='appointment'`.

### Implementation for User Story 1

- [x] T007 [US1] Modificar `src/components/calendar/assistant/AssistantAppointmentModal.jsx`: agregar prop `dentists = []`. En el form, insertar un `<Select>` "Dentista *" después del grid de Fecha/Hora (línea ~379) y antes del bloque "Paciente" (línea ~382). Opciones = lista de `dentists`. Cuando vacío, mostrar placeholder "Seleccionar dentista". Sin `defaultValue` por ahora — US2 lo agrega.

- [x] T008 [US1] En el mismo `AssistantAppointmentModal.jsx`, ya `canSubmit` (línea ~240) incluye `!therapistId` → confirma que bloquea submit sin dentista. Si no lo hace, agregar validación. El botón "Crear cita" debe quedar disabled (FR-001).

- [x] T009 [US1] Modificar `src/components/calendar/OrgCalendarView.jsx` para PASAR el prop `dentists` al `AssistantAppointmentModal` (línea ~527-540 del archivo actual). El state `dentists` ya existe (línea 72).

- [x] T010 [US1] Modificar `src/components/calendar/AppointmentModal.jsx` (vista dentista): agregar state nuevo `dentists` que se fetcha con `getOrgDentists(currentOrganizationId)` en el `useEffect` de open (línea ~69-74). Manejar caso de loading + error con `logger.warn`.

- [x] T011 [US1] En `AppointmentModal.jsx`, agregar `therapist_id: ''` al state inicial `formData` (línea ~55). En el `<form>` (después de "Lugar de atención" línea ~440 y antes de "Paciente" línea ~458), insertar `<Select>` "Dentista *" con `value={formData.therapist_id}`, `onValueChange` que actualiza el state, `required`. Opciones = `dentists`.

- [x] T012 [US1] En `handleSubmitCita` de `AppointmentModal.jsx` (línea ~309), reemplazar `therapist_id: user.id` hardcoded (línea ~320) por `therapist_id: formData.therapist_id || user.id`. Confirmar que el payload usa el valor del form.

- [x] T013 [US1] En `AppointmentModal.jsx`, después del insert exitoso en `handleSubmitCita` (línea ~362-364), invocar `logClinicalAccess` con `action='create'`, `resource_type='appointment'`, `resource_id=savedApt.id`, `user_id=user.id`, `organization_id=currentOrganizationId`, `patient_id=formData.patient_id`. Import: `import { logClinicalAccess } from '@/lib/audit/clinicalAuditLogger';`

- [x] T014 [US1] Pre-validar el payload en cliente: si `!formData.therapist_id`, mostrar toast destructive "Selecciona un dentista responsable" y NO enviar el insert. Bloqueo extra antes del trigger DB (mejor UX que esperar el error de Postgres).

**Checkpoint US1**: Al final de este phase, asistente + admin + dentista pueden crear citas seleccionando dentista. El submit vacío está bloqueado. El audit log se escribe. Esta es la MVP — Los Álamos puede empezar a usar el feature.

---

## Phase 4: User Story 2 — Default smart por rol (Priority: P2)

**Goal**: El selector "Dentista" del modal se pre-rellena automáticamente con el dentista logueado (dentista puro o admin+dentista) y queda vacío para asistente/admin puro.

**Independent Test**: Login como cristobal (admin+dentista), abrir modal en `/dashboard/calendar` → verificar campo "Dentista" pre-seleccionado con "Dr. Cristobal Tagle". Login como tatiana (asistente puro), abrir modal en `/dashboard/assistant/agenda` → verificar campo vacío con placeholder "Seleccionar dentista".

### Implementation for User Story 2

- [x] T015 [US2] En `AssistantAppointmentModal.jsx`, importar `useUserRoleInOrg` y usar `const { isDentist } = useUserRoleInOrg(organizationId);`. En el `useEffect` de inicialización (línea ~112), agregar lógica de default para create mode: si `prefilledSlot?.therapistId` → respetarlo (drag del calendario), sino si `isDentist && user?.id` → `setTherapistId(user.id)`, sino `setTherapistId('')`.

- [x] T016 [US2] En `AppointmentModal.jsx` (vista dentista), en el `useEffect` de inicialización (línea ~127), pre-rellenar `therapist_id` en create mode con `user.id` automáticamente (el dentista logueado siempre asigna a sí mismo por default — no necesita `useUserRoleInOrg` porque solo dentistas llegan a esta página vía sidebar). En edit mode, cargar `therapist_id` desde `appointmentData?.therapist_id || slotInfo?.therapistId || user.id`.

- [x] T017 [P] [US2] Sanity check del hook: con tatiana logueada, `useUserRoleInOrg(losAlamosId)` retorna `roles=['assistant'], isDentist=false`. Con cristobal logueado, retorna `roles=['dentist','clinic_admin']` y `isDentist=true`. Si el hook devuelve resultado erróneo, debuggear query a `organization_members` (probable issue: filtro `is_active` o RLS).

**Checkpoint US2**: Los defaults inteligentes funcionan en los 3 roles (dentista puro, admin+dentista, asistente/admin puro). El dentista ahorra un click cuando agenda para sí mismo.

---

## Phase 5: User Story 3 — Filtro de dentista en header del calendario con persistencia URL (Priority: P2)

**Goal**: La página de calendario asistente/admin muestra un Card teal "Ubicación" con dropdown "Dentista" default "Todos los dentistas". Persiste en URL `?dentist=uuid`. La sidebar "Citas de Hoy" del dentista (CalendarPage) NO recibe filtro (R-05 confirmado).

**Independent Test**: Login como tatiana, navegar a `/dashboard/assistant/agenda`, verificar Card teal arriba con dropdowns "Clínica" + "Box" + "Dentista" (último default "Todos los dentistas"). Seleccionar "Dr. Ceballos" → calendario filtra. URL muestra `?dentist=<uuid>`. Refresh → filtro permanece. Pegar URL con uuid de OTRA org → al cargar, filtro se resetea a "Todos los dentistas".

### Implementation for User Story 3

- [x] T018 [US3] Modificar `src/components/calendar/OrgCalendarView.jsx`: reemplazar el state `useState(null)` de `selectedDentistId` (línea 74) por integración con `useSearchParams` de `react-router-dom`. Implementar `selectedDentistId = searchParams.get('dentist') || null` y `setSelectedDentistId(id)` que actualiza el query param (eliminar si null, set si uuid, `replace: true`). Eliminar el auto-select alfabético (línea 113-115).

- [x] T019 [US3] En `OrgCalendarView.jsx`, refactor `fetchAgendaData` (línea 132) para manejar modo dual: si `selectedDentistId` no-null → fetch appointments + blocks + availability como hoy. Si null → solo fetch `getOrgAppointments(orgId, null, weekStart, weekEnd)`, dejar `blockedTimes` y `availabilityData` en `[]`.

- [x] T020 [US3] Agregar validación cross-org en `OrgCalendarView.jsx`: nuevo `useEffect` que monitorea `selectedDentistId` y `dentists`. Si `selectedDentistId !== null && dentists.length > 0 && !dentists.some(d => d.id === selectedDentistId)` → llamar `setSelectedDentistId(null)` para limpiar URL silenciosamente (FR-011).

- [x] T021 [US3] Refactorizar el bloque de UI "Filters + navegación" (líneas 442-496 actuales) en `OrgCalendarView.jsx` para reemplazarlo por dos cards:
   - **Card teal "Ubicación"** estilo `AgendaSidebar.jsx:133-191`: con dropdowns Clínica (disabled si solo 1), Box (placeholder fase 2), y el nuevo Dentista con opción "Todos los dentistas" + lista de dentistas. Importar `MapPin` de lucide-react.
   - **Card normal "Navegación + filtro estado"**: con los botones de semana anterior/siguiente/hoy, badge de count, y el `statusFilter` actual.

- [x] T022 [US3] Agregar `dentists` y `selectedDentistId` como nuevos props pasados a `WeeklyAgendaView` desde `OrgCalendarView` (línea ~506-521). El render del grid sigue funcionando porque `clinics` (con virtualClinics legacy) sigue siendo prop válido.

- [x] T023 [US3] Confirmar que NADA cambia en `src/pages/CalendarPage.jsx` (dentista) ni en `src/components/calendar/AgendaSidebar.jsx` — el dentista solo ve sus propias citas vía RLS, agregar filtro de dentista ahí sería UX nullo (R-05 confirmado). Documentar la decisión en un comentario al inicio de la tarea T023 al chequearla.

**Checkpoint US3**: El filtro funciona en `/dashboard/assistant/agenda` y `/dashboard/clinic/agendas`. URL persiste. Cross-org se ignora. Sidebar "Citas de Hoy" en CalendarPage del dentista intacta.

---

## Phase 6: User Story 4 — Reasignación de dentista con permisos (Priority: P3)

**Goal**: La asistente, clinic_admin o el dentista actualmente asignado pueden cambiar el `therapist_id` de una cita existente. Cualquier otro dentista de la org NO puede. Cada reasignación genera entry `appointment_reassigned` en audit log.

**Independent Test**: Como admin (cristobal) editar una cita de Dr. Ceballos → cambiar dropdown a Dr. Tagle → guardar → verificar entry en `clinical_audit_log` con `action='appointment_reassigned'`, `reason='from:<uuid_ceballos>;to:<uuid_tagle>'`. Login como ceballos (dentista puro) intentar UPDATE vía REST de una cita de Tagle → HTTP 204 (RLS bloquea).

### Implementation for User Story 4

- [x] T024 [US4] En `AssistantAppointmentModal.jsx`, agregar state `originalTherapistId` (similar a `originalStatus`). En el `useEffect` de fetch de cita en edit mode (línea ~117), setear `setOriginalTherapistId(data.therapist_id)`.

- [x] T025 [US4] En `AssistantAppointmentModal.jsx`, en el `<Select>` "Dentista" agregado en T007: agregar prop `disabled` con la lógica de FR-014 — `isEditMode && isDentist && originalTherapistId !== user?.id` (un dentista que NO es el dueño actual NO puede cambiar el dentista).

- [x] T026 [US4] En `AssistantAppointmentModal.jsx`, debajo del `<Select>` "Dentista", agregar warning amber condicional: `{isEditMode && therapistId !== originalTherapistId && <p className="text-xs text-amber-600">Esta cita se reasignará a otro dentista. La acción quedará registrada.</p>}`.

- [x] T027 [US4] En `AssistantAppointmentModal.jsx` `handleSubmit` (línea ~246), en edit mode, detectar reassign: `const isReassign = therapistId !== originalTherapistId`. Calcular `action`: si `isReassign` → `'appointment_reassigned'`, sino si `status !== originalStatus && status === 'cancelled'` → `'cancel'`, sino `'update'`. Calcular `reason`: si `isReassign` → `'from:${originalTherapistId};to:${therapistId}'`, sino null. Pasar ambos al `logClinicalAccess`.

- [x] T028 [US4] En `AppointmentModal.jsx` (dentista), aplicar la misma lógica: state `originalTherapistId`, prop `disabled` en el Select de Dentista (un dentista no-asignado no puede cambiar — pero en la práctica el dentista solo edita sus propias citas vía RLS, este caso es raro y solo aplica para admin+dentista editando cita de otro dentista). Warning amber condicional. En el handler de submit, detectar `isReassign` y usar action `'appointment_reassigned'` con reason `from:X;to:Y`.

- [x] T029 [US4] Smoke test manual del trigger DB (paso 8 del quickstart): como service_role, intentar INSERT cross-org `appointments` con dentista de otra org → verificar excepción `dentist_not_active_in_org`. Documentar resultado.

**Checkpoint US4**: Reasignaciones funcionan con permisos correctos. RLS + trigger DB bloquean robos cross-org y robos dentista. Audit log registra cada cambio con dentista anterior y nuevo.

---

## Phase 7: User Story 5 — Visual color por dentista en chips del calendario (Priority: P3)

**Goal**: Cada chip de cita en el calendario muestra un `border-l-4` con color consistente por dentista (mismo dentista = mismo color en toda la app) y un footer pequeño "Dr. {apellido}" debajo del nombre del paciente (solo si la org tiene >1 dentista).

**Independent Test**: Login como tatiana, abrir `/dashboard/assistant/agenda` con filtro "Todos los dentistas". Verificar que las citas del Dr. Tagle TODAS tienen el mismo color (ej. border teal), las del Dr. Ceballos TODAS otro color (ej. coral). El footer "Dr. Tagle" / "Dr. Ceballos" aparece en cada chip. Citas legacy sin dentista (NO debería haber según R-10, pero hipotéticamente) → border gris fallback.

### Implementation for User Story 5

- [x] T030 [US5] En `src/components/calendar/WeeklyAgendaView.jsx`, agregar array constante `DENTIST_COLORS` arriba del archivo (paralelo a `CLINIC_COLORS` línea 19) con 6 colores distintos (teal/pink/amber/violet/cyan/rose). Exportar helper `getDentistColor(dentistId, dentists)` que devuelve `{border, text, dot}` según índice del dentista en el array.

- [x] T031 [US5] En `WeeklyAgendaView.jsx`, agregar `dentists = []` como nuevo prop (línea 36-53). Documentar en JSDoc que se usa para colorear chips por dentista responsable.

- [x] T032 [US5] En `WeeklyAgendaView.jsx`, en el render del chip de cita (buscar el `.map(apt => ...)` que renderiza las citas dentro del grid — alrededor de líneas 750-900): aplicar `getDentistColor(apt.therapist_id, dentists)` para obtener el color. Agregar `border-l-4` + el `border-{color}` en el `className` del chip. Agregar `<div>` con texto "Dr. {apellido}" debajo del nombre del paciente, condicional `dentists.length > 1` (single-dentist clinics no necesitan el footer).

- [x] T033 [P] [US5] Verificar que en `OrgCalendarView.jsx` (línea ~506) ya se pasa `dentists={dentists}` a `WeeklyAgendaView` (cubierto por T022). Si no, agregarlo.

- [x] T034 [P] [US5] Confirmar que en `CalendarPage.jsx` (vista dentista) NO se pasa `dentists` prop a `WeeklyAgendaView` — el dentista ve solo sus propias citas, todas serían del mismo color. El helper `getDentistColor` recibe `dentists=[]` → retorna null → fallback gris (sin border especial). Comportamiento actual preserved.

**Checkpoint US5**: Las citas del calendario asistente/admin muestran diferenciación visual clara por dentista. El calendario del dentista no cambia (no aplica).

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T035 Comentar `// LEGACY NAMING: therapist_id semánticamente = "dentista responsable" en DentalSpot. Nombre heredado del ecosistema Communicare (compartido con FONOKIT). Ver .specify/memory/ecosystem-communicare.md.` en el inicio de los archivos tocados: `OrgCalendarView.jsx`, `AssistantAppointmentModal.jsx`, `AppointmentModal.jsx`, `WeeklyAgendaView.jsx`. Una vez por archivo.

- [x] T036 Validar visualmente en local con `npm run dev` que las 5 user stories funcionan según los 10 smokes de `quickstart.md`. Capturar 1 screenshot por story como evidencia en el reporte post-implementación.

- [x] T037 [P] Pegar resultados de quickstart §1 (pre-check DB) + §2 (post-check DB) + §3-9 (smokes UX) en el reporte post-implementación. Marcar cualquier desviación o issue encontrado.

- [x] T038 [P] Actualizar `CLAUDE.md` post-implement: mover spec 028 de "Active feature: PLANNING" a "Previous feature: IMPLEMENTED + DEPLOYED + SMOKE-TESTED" siguiendo el pattern de specs 023/024/025.

- [x] T039 Confirmar que el feature NO rompe ninguno de estos flujos pre-existentes (regression check):
   - Asistente edita cita propia de la org (sin reasignar) → guarda OK
   - Admin crea cita asignando a sí mismo (si tiene rol dentist) → guarda OK
   - Dentista cancela cita propia → audit log con `action='cancel'`
   - Filtro de estado (Agendadas/Confirmadas/etc.) sigue funcionando independientemente del filtro de dentista
   - Box selector + clinic selector siguen funcionando como antes

- [x] T040 Reportar a Danissa con plantilla: (a) qué se tocó, (b) qué quedó intacto, (c) smokes ejecutados con outputs, (d) follow-ups detectados (ej. rename `therapist_id` → `dentist_id` como spec 029 futura), (e) screenshots adjuntos.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup T001-T002)**: Sin dependencias. T002 puede correr en paralelo con T001.
- **Phase 2 (Foundational T003-T006)**: T003 → T004 secuencial (migration debe estar aplicada antes de validar). T005 y T006 pueden correr en paralelo después de T004.
- **Phase 3+ (User Stories)**: TODAS dependen de Phase 2 completo.
- **Phase 8 (Polish)**: Depende de las user stories que se quieran shippear (mínimo US1 para MVP).

### User Story Dependencies

- **US1 (P1, MVP)**: Depende solo de Phase 2. Tareas T007-T014 secuenciales dentro de cada archivo, pero los archivos `AssistantAppointmentModal` (T007-T009) y `AppointmentModal` (T010-T014) son independientes entre sí.
- **US2 (P2)**: Depende de US1 (necesita el `<Select>` ya existente para agregarle default value). T015-T017 son rápidas.
- **US3 (P2)**: Depende de Phase 2 (T006 extendió `getOrgAppointments` para null). Independiente de US1/US2 — el filtro y los modales son flujos separados.
- **US4 (P3)**: Depende de US1 (extiende el `<Select>` con permission gate + warning).
- **US5 (P3)**: Depende de US3 (necesita que `OrgCalendarView` ya pase `dentists` a `WeeklyAgendaView`). Independiente de US4.

### Within Each User Story

- Modificaciones en `AssistantAppointmentModal.jsx` deben ser secuenciales (mismo archivo).
- Modificaciones en `AppointmentModal.jsx` deben ser secuenciales (mismo archivo).
- Modificaciones en `OrgCalendarView.jsx` deben ser secuenciales (mismo archivo).
- Modificaciones en `WeeklyAgendaView.jsx` deben ser secuenciales (mismo archivo).
- Entre archivos distintos: pueden ejecutarse en paralelo.

### Parallel Opportunities

- **Phase 1**: T002 || T001
- **Phase 2**: T005 || T006 (después de T004)
- **US1**: T007-T009 (AssistantModal) || T010-T014 (DentistModal) — dos archivos distintos
- **US2**: T015 (AssistantModal) || T016 (DentistModal) || T017 (sanity check)
- **US3**: T018-T022 son secuenciales (mismo archivo OrgCalendarView); T023 es solo confirmación
- **US4**: T024-T027 (AssistantModal) || T028 (DentistModal); T029 standalone smoke
- **US5**: T030-T032 secuenciales en WeeklyAgendaView; T033 + T034 confirmaciones paralelas
- **Phase 8**: T036 secuencial (smokes manuales); T037+T038 paralelas (escritura de docs); T039 secuencial; T040 final

---

## Parallel Example: User Story 1

```bash
# Una vez Phase 2 completo, US1 se ejecuta en dos tracks paralelos
# (un archivo cada uno, sin dependencias cruzadas):

# Track A — AssistantAppointmentModal (vistas asistente/admin):
Task: "T007 [US1] Agregar prop dentists + Select Dentista * en AssistantAppointmentModal"
Task: "T008 [US1] Confirmar canSubmit bloquea sin therapistId"
Task: "T009 [US1] Pasar dentists desde OrgCalendarView al modal"

# Track B — AppointmentModal (vista dentista):
Task: "T010 [US1] Fetch dentists via getOrgDentists en AppointmentModal"
Task: "T011 [US1] Agregar therapist_id al state + Select en form"
Task: "T012 [US1] Usar formData.therapist_id en payload"
Task: "T013 [US1] Agregar logClinicalAccess(action='create') post-insert"
Task: "T014 [US1] Pre-validación cliente con toast destructive"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001, T002) — verificar estado actual de DB
2. Phase 2: Foundational (T003 → T004 → T005 + T006) — migration + hook + API
3. Phase 3: US1 (T007-T014) — selector obligatorio en ambos modales + audit log
4. **STOP + VALIDATE**: smoke §3 del quickstart (asistente crea cita)
5. **DEPLOY**: Danissa hace `npx supabase db push` en prod + merge a main. Los Álamos puede usar el feature inmediato.

Este es el corte mínimo viable. Resuelve el problema de Los Álamos (Pablo Ceballos puede ser asignado, audit funciona). US2/US3/US4/US5 son mejoras incrementales sin urgencia.

### Incremental Delivery (recomendada)

1. **Día 1**: MVP (Phase 1 + 2 + US1) → deploy
2. **Día 2**: US2 (default smart) + US3 (filtro URL) → deploy
3. **Día 3**: US4 (reasignación con permisos) + US5 (visual color) + Phase 8 (polish) → deploy

Cada incremento es independientemente testeable y deploy-able. Stop después de US1 si Danissa decide priorizar otro spec.

### Single-Session Implementation (si Danissa quiere todo de una)

1. Phase 1 + 2 (T001-T006) — ~30 min
2. US1 completa (T007-T014) — ~60 min
3. US2 (T015-T017) — ~20 min
4. US3 (T018-T023) — ~50 min
5. US4 (T024-T029) — ~40 min
6. US5 (T030-T034) — ~30 min
7. Phase 8 (T035-T040) — ~30 min smokes + reporte

**Total estimado**: 4-5 horas implement + 1h smoke = 1 sesión larga o 2 medias.

---

## Notes

- [P] tasks = archivos distintos, sin dependencias bloqueantes — pueden hacerse en paralelo (o si trabajás solo, son tareas que no se pisan entre sí).
- [Story] label mapea cada tarea a su user story para trazabilidad y para decidir el corte de MVP.
- Cada user story es independientemente deploy-able. US1 sola ya entrega valor a Los Álamos.
- Sin tests automatizados — validación es manual con cuentas reales (tatiana, cristobal, ceballos) siguiendo `quickstart.md`.
- Cualquier desviación durante el implement debe reflejarse de vuelta en `spec.md` / `plan.md` / `data-model.md` para mantener Schema Drift Zero (§VI constitución).
- Commit por tarea o por checkpoint, NO mezclar fases en un mismo commit.
- El rename `therapist_id` → `dentist_id` es deuda DOCUMENTADA pero OUT OF SCOPE (decisión Founder Opción A, 2026-05-29). Spec 029 futura si aplica.
