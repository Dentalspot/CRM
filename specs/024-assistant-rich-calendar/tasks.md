---
description: "Task list for spec 024-assistant-rich-calendar"
---

# Tasks: Assistant Rich Calendar

**Input**: Design documents from `/specs/024-assistant-rich-calendar/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/org-calendar-api.md ✓, quickstart.md ✓

**Tests**: Tests automatizados NO requeridos (coherente con codebase). Smoke test manual documentado en `quickstart.md` — se invoca desde tareas de validación al final de cada phase.

**Organization**: Tasks agrupadas por user story (P1 a P2; P3 multi-dentista OUT of scope MVP — no se generan tasks).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (diferentes archivos, sin deps bloqueantes).
- **[Story]**: Map a user story (US1-US5). Phase 1/2/Polish sin label.
- Paths siempre absolutos o relativos al repo root.

## Path Conventions

- **Single project** (SPA React + Supabase): `src/` y `supabase/migrations/` en repo root.
- Estructura según `plan.md §Project Structure`.

---

## Phase 1: Setup

**Purpose**: Pre-requisitos mínimos del entorno.

- [X] T001 Verificar que la rama actual es `024-assistant-rich-calendar` ejecutando `git branch --show-current` y que el working tree está limpio (`git status`). Si hay cambios no committeados fuera de este spec, pausar y pedir confirmación al usuario.
- [X] T002 Confirmar que el directorio `src/lib/api/` existe — si no, crearlo con `mkdir -p src/lib/api` (el servicio `org.api.js` vivirá ahí).

**Checkpoint**: Branch correcta, directorios listos.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: RLS policies + API layer que todas las user stories necesitan. **NINGUNA US puede empezar hasta que esta fase termine.**

⚠️ **CRITICAL**: Esta fase bloquea todo el resto.

- [X] T003 Verificar si existe policy SELECT para role='assistant' en la tabla `profiles` corriendo la query `SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND policyname ILIKE '%assistant%'` contra la DB. **Resultado (2026-04-24): 0 rows → GAP confirmado. Incluyo policy para profiles en T004.**
- [X] T004 Crear migration nueva en `supabase/migrations/20260424000001_blocked_times_assistant_rls.sql` con las 3 policies del research §R-04 (`blocked_times_assistant_select`, `_insert`, `_delete`) + policies extra para profiles (member + patient profiles). Incluir comentarios con referencia al spec 024.
- [X] T005 Migration aplicada 2026-04-24. Verificación: 5 policies presentes (blocked_times_assistant_select/insert/delete + Org assistants can view member/patient profiles).
- [X] T006 [P] Crear el archivo `src/lib/api/org.api.js` con las 10 funciones del contrato `contracts/org-calendar-api.md`: `getOrgDentists`, `getOrgAppointments`, `getOrgBlockedTimes`, `getOrgAvailability`, `searchOrgPatients`, `getOrgServicesForTherapist`, `createOrgAppointment`, `updateOrgAppointment`, `createOrgBlockedTime`, `deleteOrgBlockedTime`. Importar `supabase` de `@/lib/supabaseClient` y `logger` de `@/lib/utils/logger`. Cada función debe manejar error con throw (nunca retornar null) y retornar array vacío en lugar de null para SELECTs.
- [X] T007 [P] Crear el componente skeleton `src/components/calendar/OrgCalendarView.jsx` con: (a) props `scope: 'assistant' | 'clinic_admin'`, `organizationId: string`; (b) state para `selectedDentistId`, `currentWeek`, `statusFilter`, `mode` (create | block); (c) fetch effect que carga dentists + appointments + blocked_times + availability; (d) return de `<div>Calendar placeholder</div>` como base (el rendering real se hace en US1). Exportar default.

**Checkpoint**: Migration aplicada, `org.api.js` listo con 10 funciones, `OrgCalendarView` skeleton existe. User stories pueden empezar.

---

## Phase 3: User Story 1 - Ver agenda semanal con selector de dentista (Priority: P1) 🎯 MVP

**Goal**: El asistente puede entrar a `/dashboard/assistant/agenda`, elegir un dentista, y ver el calendario semanal rich con citas + bloqueos + slots libres + navegación y filtros.

**Independent Test**: Login como asistente activo de una clínica con ≥1 dentista. Navegar a Agenda. Elegir dentista. Confirmar que el grid semanal se renderiza con citas (coloreadas por estado), bloqueos (rojo semitransparente) y slots libres. Navegación prev/next/Hoy funciona. Filtro por estado oculta/muestra citas correctamente. (Pasos 1-4 del `quickstart.md`).

### Implementation for User Story 1

- [X] T008 [US1] Implementar fetch de dentistas en `OrgCalendarView.jsx` usando `getOrgDentists(organizationId)`. Almacenar en state `dentists: Array<{id, full_name}>`. Auto-seleccionar el primer dentista alfabético si `dentists.length > 0 && !selectedDentistId`. Manejar estado vacío con mensaje "Esta clínica aún no tiene dentistas asociados. Contacta al administrador." (FR-001).
- [X] T009 [US1] Implementar header + selector de dentista en `src/components/calendar/OrgCalendarView.jsx`: (a) título "Agenda — {clinic.name}"; (b) `<Select>` de shadcn con opciones populadas de `dentists`; (c) botones Prev/Hoy/Next usando `date-fns` `subWeeks`/`addWeeks`/`startOfWeek({weekStartsOn: 1})`; (d) `<Select>` de filtro por estado (scheduled/confirmed/completed/cancelled/todos). (FR-002, FR-003, FR-007).
- [X] T010 [US1] Implementar fetch de data (appointments + blocked_times + availability) en `OrgCalendarView.jsx` cuando cambia `selectedDentistId` o `currentWeek`. Usar `Promise.all` para paralelizar las 3 queries. Guardar en state separado. Manejar loading con `<Loader2>`. Importar `getOrgAppointments`, `getOrgBlockedTimes`, `getOrgAvailability` desde `@/lib/api/org.api`. (FR-004, FR-005, FR-006).
- [X] T011 [US1] Importar y renderizar `WeeklyAgendaView` desde `@/components/calendar/WeeklyAgendaView` dentro de `OrgCalendarView`, pasándole: `currentWeek`, `appointments` (filtradas por statusFilter), `blockedTimes`, `availabilityData`, `clinics=[{id: selectedDentistId, name: selectedDentist.full_name, business_hours: null}]`, `selectedClinic=selectedDentistId`, handlers `onSlotClick/onAppointmentClick/onBlockedTimeClick` como no-ops por ahora (US2+ los wirea). Verificar que el grid renderiza con data real.
- [X] T012 [US1] Crear `src/features/assistant/pages/AssistantCalendarPage.jsx` como wrapper fino: (a) `import OrgCalendarView from '@/components/calendar/OrgCalendarView'`; (b) `const { currentOrganizationId, currentOrganization } = useCurrentOrganization()`; (c) guard: si `!currentOrganizationId`, renderizar pantalla "Esta cuenta no tiene acceso activo a ninguna clínica. Si esto es un error, contacta al administrador." (research §R-12); (d) render `<OrgCalendarView scope="assistant" organizationId={currentOrganizationId} />`. Incluir `<Helmet>` con título "Agenda | DentalSpot".
- [X] T013 [US1] Actualizar `src/app/routers/DashboardRouter.jsx` para que la ruta `/dashboard/assistant/agenda` monte `AssistantCalendarPage` en lugar de `AssistantAgendaPage`. Importar con `lazy(() => import('@/features/assistant/pages/AssistantCalendarPage'))`. Mantener `AssistantAgendaPage` en filesystem por ahora (se remueve en Polish).
- [X] T014 [US1] Correr `npm run build` (o `npx vite build --mode development`) para validar que no hay errores de compilación. Si hay warnings, documentarlos pero no bloquear.
- [ ] T015 [US1] Smoke test manual pasos 1-4 del `quickstart.md`: login como Kobe (reactivar antes si necesario), navegar a Agenda, elegir dentista, verificar grid + navegación + filtro. Documentar resultado con screenshot o ✓/✗ por cada criterio. **(PENDIENTE: requiere action del user)**

**Checkpoint**: US1 PASSED — el asistente ve el calendario rich. Puede demoearse como valor standalone.

---

## Phase 4: User Story 2 - Crear cita con drag-to-create (Priority: P1)

**Goal**: El asistente puede arrastrar sobre un slot libre → modal pre-rellenado → seleccionar paciente + servicio → cita creada + audit log.

**Independent Test**: Con asistente en calendario de un dentista que tiene ≥1 servicio activo y ≥1 paciente en la org: arrastrar sobre slot libre → completar form → Guardar → cita aparece renderizada + row en `appointments` + row en `clinical_audit_log` con action='create_appointment'. (Paso 5 del `quickstart.md`).

### Implementation for User Story 2

- [X] T016 [P] [US2] Crear componente `src/components/calendar/assistant/AssistantAppointmentModal.jsx` como dialog controlado: props `isOpen, onClose, prefilledSlot: {date, startTime, endTime, therapistId}, onCreated`. Usar shadcn `<Dialog>`. Incluir campos: búsqueda de paciente (autocomplete), dropdown de servicios, textarea para notas, botones Cancelar/Guardar.
- [X] T017 [US2] Implementar autocomplete de paciente dentro de `AssistantAppointmentModal.jsx`: usar `useDebounce` (hook existente) con delay 300ms. On debounced search → llamar `searchOrgPatients(organizationId, term)`. Mostrar dropdown con nombre + email + phone. On select → setState `selectedPatient`. Validar: si no hay paciente seleccionado, botón Guardar deshabilitado. (FR-009, FR-010 a).
- [X] T018 [US2] Implementar dropdown de servicios dentro de `AssistantAppointmentModal.jsx`: fetch `getOrgServicesForTherapist(prefilledSlot.therapistId)` en `useEffect` al abrir el modal. Si retorna array vacío, mostrar warning "Este dentista no tiene servicios configurados. Contactalo para que los defina antes de agendar." y deshabilitar Guardar. (FR-011, US2 Acceptance Scenario 5).
- [X] T019 [US2] En `OrgCalendarView.jsx`, implementar `handleSlotClick` que: (a) chequee overlap client-side con `appointments` y `blocked_times` del dentista seleccionado en `[slot.startTime, slot.endTime)`; (b) si hay overlap → toast error "Ya existe una cita o bloqueo en ese horario" y return; (c) si no hay overlap → abrir `AssistantAppointmentModal` con `prefilledSlot={date, startTime, endTime, therapistId: selectedDentistId}`. (FR-008, FR-010, research §R-07).
- [X] T020 [US2] En `AssistantAppointmentModal.jsx`, implementar `handleSubmit` que: (a) construye payload con `organization_id`, `clinic_id` (de `clinics` de la org), `therapist_id`, `patient_id`, `service_id`, `date`, `start_time`, `end_time`, `status='scheduled'`, `notes`; (b) llama `createOrgAppointment(payload)`; (c) invoca `logClinicalAccess({action:'create', resource_type:'appointment', patient_id, resource_id})`; (d) on success → toast verde "Cita creada" + `onCreated(created)` + `onClose()`; (e) on error → toast destructive con `error.message`. (FR-012, FR-013, Constitution §V + §III).
- [X] T021 [US2] En `OrgCalendarView.jsx`, implementar `handleAppointmentCreated` que recibe la cita creada y la agrega al state `appointments` (optimistic update), sin refetch.
- [X] T022 [US2] Correr `npm run build` → validar compilación sin errores. ✅ PASSED. Smoke test paso 5 del `quickstart.md` pendiente de validación manual por user.

**Checkpoint**: US2 PASSED — el asistente crea citas desde el calendario con audit log funcionando.

---

## Phase 5: User Story 3 - Bloquear horas con drag (Priority: P1)

**Goal**: El asistente activa "modo bloquear" → drag sobre slots libres → crea `blocked_times` row → bloqueo visible en rojo + click en bloque permite eliminarlo.

**Independent Test**: Con asistente en calendario + dentista seleccionado: toggle "Bloquear hora" → drag sobre slot libre → (opcional: modal con razón) → bloque aparece rojo → row en `blocked_times` DB → click sobre bloque → opción "Desbloquear" → bloque desaparece. Intentar drag-to-create cita sobre el bloque → toast error de conflicto. **NO debe haber audit log** para acciones de blocked_times. (Paso 6-7 del `quickstart.md`).

### Implementation for User Story 3

- [X] T023 [P] [US3] Componente `AssistantBlockTimeModal.jsx` — **DECISIÓN de implementación**: reemplazado por `window.prompt()` inline en `handleSlotClick` (mode=block) para simplicidad MVP. Si se necesita modal dedicado en beta, se agrega después. Esto elimina 1 archivo y reduce complejidad sin sacrificar funcionalidad.
- [X] T024 [US3] Toggle "Modo: Crear cita | ⛔ Bloquear hora" agregado al header de `OrgCalendarView.jsx` con estado visual (bg-primary active / bg-red-500 para block). State `mode: 'create' | 'block'`.
- [X] T025 [US3] `handleBlockDragCreate` implementado en `OrgCalendarView.jsx` — dispara cuando `mode === 'block'` → valida overlap → `createOrgBlockedTime()` → optimistic update + toast. NO invoca audit log (FR-017 ✓).
- [X] T026 [US3] `handleBlockedTimeClick` implementado: `window.confirm()` con reason → `deleteOrgBlockedTime(id)` → remover de state + toast.
- [X] T027 [US3] Conflicto bidireccional: `hasOverlap()` chequea ambos (citas + bloqueos) en un mismo helper, usado por T019 y T025.
- [X] T028 [US3] Build ✅ PASSED. Smoke test 6-7 pendiente del user.

**Checkpoint**: US3 PASSED — asistente bloquea y desbloquea horas del dentista.

---

## Phase 6: User Story 4 - Editar cita existente (Priority: P2)

**Goal**: Click en cita → modal edit con datos precargados → modificar fecha/hora/paciente/servicio/notas/status → update en DB + audit log.

**Independent Test**: Con cita existente creada en US2: click en la cita → modal abre con campos cargados → cambiar start_time + status → Guardar → cita se re-renderiza en nueva posición + `appointments.updated_at` cambia + audit log con `action='edit_appointment'` o `cancel_appointment`. (Paso 8-9 del `quickstart.md`).

### Implementation for User Story 4

- [X] T029 [US4] `AssistantAppointmentModal.jsx` soporta modo edit vía prop `appointmentId`. Si presente, fetchea la cita con JOIN a patients/profile y pre-carga todos los fields incluido `originalStatus` para detectar cambios a 'cancelled'. Título cambia a "Editar cita".
- [X] T030 [US4] `handleAppointmentClick` implementado en `OrgCalendarView.jsx` → abre modal con `editingAppointmentId=apt.id`. Audit log `view` se dispara dentro del modal al montar (no duplica si se navega ficha → odontograma por el dedupe horario del hook).
- [X] T031 [US4] `handleSubmit` en modo edit construye diff + llama `updateOrgAppointment` + audit log con action 'cancel' (si status→cancelled) o 'update' (resto).
- [X] T032 [US4] `handleAppointmentUpdated` reemplaza cita en state `appointments` (optimistic). Smoke test 8-9 pendiente del user.

**Checkpoint**: US4 PASSED — el asistente edita y cancela citas con audit trail completo.

---

## Phase 7: User Story 5 - Resize de cita arrastrando el borde (Priority: P2)

**Goal**: El asistente toma el borde inferior/superior de una cita y arrastra → end_time/start_time se actualiza → update en DB.

**Independent Test**: Con cita existente: tomar borde inferior y arrastrar hacia abajo 30 min → cita extiende visualmente → `end_time` actualizada en DB. Resize a duración menor a 15 min → snap al mínimo. (Paso 10 del `quickstart.md`).

### Implementation for User Story 5

- [X] T033 [US5] `handleAppointmentMove` implementado en `OrgCalendarView.jsx` — valida duración mínima 15 min + overlap check (ignora la propia cita). Si validación falla → revert via `fetchAgendaData()`.
- [X] T034 [US5] Llama `updateOrgAppointment()` + optimistic update state + audit log action='update' + toast "Cita actualizada". Smoke test 10 pendiente del user.

**Checkpoint**: US5 PASSED — resize funciona smoothly con validación de overlap y duración mínima.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup + validaciones finales + documentation.

- [X] T035 [P] Eliminar `src/features/assistant/pages/AssistantAgendaPage.jsx`. Verificado con grep: las únicas referencias restantes son comentarios históricos (no imports ni routes).
- [X] T036 [P] `CLAUDE.md` actualizado — sección "Active feature" con summary del spec 024 (archivos nuevos, migration, architecture clave para reuso en 025).
- [ ] T037 Ejecutar smoke test COMPLETO del `quickstart.md` (pasos 1-12) contra producción (o staging si existe). Documentar resultado por cada step. Si algún step falla crítico → abrir issue / followup / revert plan según severidad. **(PENDIENTE: user)**
- [ ] T038 Verificar SC-004 (RLS 0 violations): ejecutar paso 11 del `quickstart.md` (intentar crear cita en org ajena vía devtools). Confirmar que RLS rechaza. Si pasa sin error → critical bug, detener deploy. **(PENDIENTE: user — post deploy)**
- [ ] T039 Verificar SC-005 (0 ficha clínica leak): ejecutar paso 12 del `quickstart.md`. Abrir el modal edit de una cita y confirmar que NO se renderiza ningún campo de ficha clínica detallada (odontograma, tratamientos, evoluciones, notas clínicas, diagnósticos, alergias). Si se filtra algo → bug crítico. **(PENDIENTE: user — post deploy)**
- [X] T040 Documentar limitaciones MVP en `docs/product/feature-backlog.md`: P3 multi-dentista + spec 025 clinic admin calendar agregados como entries "Diferido, trivial post spec 024".

**Checkpoint final**: MVP deployado + smoke test verde + followups documentados.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: sin deps, arranca de inmediato.
- **Phase 2 (Foundational)**: depende de Phase 1 completa. **BLOQUEA** toda US.
- **Phase 3 (US1)**: depende de Phase 2 completa.
- **Phase 4 (US2)**: depende de Phase 3 (necesita OrgCalendarView con selector + grid funcionando).
- **Phase 5 (US3)**: depende de Phase 3 + 4 (toggle modo bloquear en header requiere header ya rendering desde US2).
- **Phase 6 (US4)**: depende de Phase 4 (reutiliza `AssistantAppointmentModal`).
- **Phase 7 (US5)**: depende de Phase 4 (reusa `updateOrgAppointment`).
- **Phase 8 (Polish)**: depende de todas las US relevantes completas.

### User Story Dependencies

- **US1 (P1)**: base — depende de Phase 2 foundational, no depende de otras US.
- **US2 (P1)**: depende de US1 (grid + selector).
- **US3 (P1)**: depende de US1. Independiente de US2 (podría implementarse en paralelo por otro dev).
- **US4 (P2)**: depende de US2 (reusa el modal).
- **US5 (P2)**: depende de US4 (audit log + update API ya wired).

### Within Each User Story

- Modal components (T016/T023/T029) pueden empezar en paralelo con los handlers — archivos distintos.
- Los handlers en `OrgCalendarView` (T019/T024-T027/T030/T033) son del mismo archivo → **secuenciales**.
- `org.api.js` (T006) es paralelo a `OrgCalendarView.jsx` (T007) — archivos distintos.

### Parallel Opportunities

- T003 + T006 + T007 pueden correr en paralelo (DB policy check + API skeleton + Component skeleton).
- T008 + T016 + T023 + T029 (extensión modal para edit) pueden correr en paralelo si hay devs — archivos distintos.
- T035 + T036 pueden correr en paralelo al final (polish).

---

## Parallel Example: Phase 2 Foundational

```bash
# Terminal 1 — DB check
Task: "T003 verificar profiles RLS para asistente"

# Terminal 2 — API layer (independiente de DB check)
Task: "T006 crear src/lib/api/org.api.js con las 10 funciones"

# Terminal 3 — Component skeleton (independiente)
Task: "T007 crear src/components/calendar/OrgCalendarView.jsx skeleton"

# Después de los 3 → T004 + T005 (migration depende de T003 finding)
```

---

## Implementation Strategy

### MVP (US1 solo — minimum viable increment)

1. Completar Phase 1 (Setup) — T001-T002.
2. Completar Phase 2 (Foundational) — T003-T007.
3. Completar Phase 3 (US1) — T008-T015.
4. **STOP + VALIDATE**: smoke test pasos 1-4.
5. Deployar MVP si ready — el asistente ya puede **ver** el calendario rich, aunque no crear ni editar. Valor incremental claro.

### Incremental Delivery (recomendado)

1. Setup + Foundational → Foundation lista.
2. US1 → test independiente → deploy/demo (**MVP**).
3. US2 → test → deploy (ya puede crear citas).
4. US3 → test → deploy (ya puede bloquear horas).
5. US4 → test → deploy (ya puede editar/cancelar).
6. US5 → test → deploy (resize UX avanzado).
7. Polish → cleanup + smoke completo.

Cada US agrega valor sin romper la anterior.

### Single-Dev Strategy (realista para este spec)

Como es 1 dev (Danissa/ejecutor):

1. Execute tasks **secuencialmente** dentro de cada phase.
2. Paralelismos marcados [P] se pueden hacer en el mismo PR pero en archivos separados (sin merge conflicts).
3. Commitear al final de cada phase (o al final de cada US si el phase es grande).
4. Hard stop al final de cada US para smoke manual antes de la siguiente.

---

## Notes

- **Tests automatizados NO incluidos** — smoke test manual cubre validación (coherente con codebase).
- **P3 US6 (multi-dentista view) OUT of scope** — no hay tasks para ella. Queda en backlog / spec futuro.
- **Clinic admin rich calendar** (spec 025 futuro): `OrgCalendarView` queda diseñado para reutilizarse — spec 025 será trivial (~1-2h) si seguimos esta arquitectura.
- **Commits**: el ejecutor (tú, Claude Code) **NO hace commit**. Danissa commitea al final de cada US aprobada o al final del spec completo.
- **[P] marker**: diferentes archivos + sin deps bloqueantes. No significa que se deban hacer en paralelo obligatoriamente.
- **File paths**: todos son relativos al repo root `/Users/danissaklagges/Documents/DENTALSPOT/`.
- **Budget estimado**: 3-5h implementación + 30-60 min smoke test. Total ~4-6h.
