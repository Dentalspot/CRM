---
description: "Task breakdown for 023-invite-assistant-flow"
---

# Tasks: Invite Assistant Flow

**Input**: Design documents from `/specs/023-invite-assistant-flow/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/clinic-invitations-api.md ✓, quickstart.md ✓

**Tests**: NOT generated (ningún framework de tests automatizado en el repo; validación via `quickstart.md` smoke manual per decisión MVP).

**Organization**: Tasks agrupadas por user story. Cada una es independent testable según criterios del spec.

> **⚠️ Scope revision (2026-04-23 post-plan)**: la página `/dashboard/clinic/therapists` con `ClinicTherapistsManagementPage.jsx` YA existe y se reutiliza. El plan original proponía `TeamManagementPage` nueva en `/dashboard/clinic/team` — pivot: extender la existente. Rename UI: "Gestión de Dentistas" → "Gestión de Personal". UX: top-level tabs Dentistas / Asistentes, botón invite contextual por tab. US1/US4 reformulados abajo.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede correr en paralelo (diferente archivo, sin dependencia en incompletas)
- **[Story]**: mapea a user story del spec (US1 / US2 / US3 / US4)
- File paths exactos en cada descripción

## Path Conventions

DentalSpot es web app React 18 + Supabase. Estructura:
- `supabase/migrations/*.sql` — migraciones DB
- `supabase/functions/*/index.ts` — edge functions Deno
- `src/features/<feature>/` — feature modules frontend
- `src/app/routers/*.jsx` — router config
- `src/pages/*.jsx` — páginas públicas/standalone

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: verificar entorno de dev listo. NO hay proyecto nuevo a inicializar — feature se construye sobre infra existente.

- [ ] T001 Verificar working tree limpio + branch `023-invite-assistant-flow` checked out: `git status && git branch --show-current`
- [ ] T002 Verificar que `RESEND_API_KEY` está seteada en Supabase Edge Function secrets (usada por `clinic-invitations`): ver Supabase dashboard → Edge Functions → Secrets
- [ ] T003 Confirmar migración pre-req `20260423000001_add_assistant_lab_to_user_role.sql` aplicada en DB: correr `SELECT unnest(enum_range(NULL::user_role));` debe retornar 7 valores incluyendo `'assistant'` y `'lab'`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: capa de DB + backend que desbloquea todas las user stories. Sin esto, ninguna story funciona.

**⚠️ CRITICAL**: No user story work puede empezar hasta que esta fase esté completa.

### Migration (sub-bloque M1)

- [ ] T004 Crear archivo `supabase/migrations/20260423000002_invite_assistant_flow.sql` con header + DO block de pre-check (verificar estado inicial de tablas: `clinics.organization_id` no existe, `clinic_invitations` sin `role`/`expires_at`/`existing_patient`)
- [ ] T005 Agregar sección SECTION A a la migración: `ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL`
- [ ] T006 Agregar sección SECTION B (backfill): INSERT organizations para cada clinic sin organization_id, luego UPDATE clinics SET organization_id = o.id via JOIN por name. Incluir comentario warning sobre duplicate names (known issue per research §Open Issue 1)
- [ ] T007 Agregar sección SECTION C: función `public.auto_create_organization_for_clinic()` (SECURITY DEFINER) que BEFORE INSERT crea organization + organization_members (clinic_admin) para el therapist_id owner. Crear TRIGGER `trg_auto_org_for_clinic` sobre clinics
- [ ] T008 Agregar sección SECTION D: `ALTER TABLE public.clinic_invitations` agregando columns `role text DEFAULT 'therapist' NOT NULL`, `expires_at timestamptz`, `existing_patient boolean DEFAULT false NOT NULL`, y CHECK constraint `role IN ('therapist', 'assistant')`
- [ ] T009 Agregar sección SECTION E: `CREATE INDEX IF NOT EXISTS idx_clinic_invitations_role_status ON clinic_invitations (clinic_id, role, status)`
- [ ] T010 Agregar sección SECTION F: función `public.is_in_clinic_as_assistant(p_user_id uuid, p_clinic_id uuid) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER` que resuelve organization_id y valida membership activa. GRANT EXECUTE a authenticated
- [ ] T011 Agregar sección SECTION G (RLS policies): `CREATE POLICY "assistant_read_clinic_patients" ON public.patients FOR SELECT TO authenticated USING (...)` usando helper. Verificar primero schema de `clinic_patients` o tabla equivalente para el JOIN
- [ ] T012 Agregar sección SECTION H (RLS policies): `CREATE POLICY "assistant_crud_clinic_appointments" ON public.appointments FOR ALL TO authenticated USING (...) WITH CHECK (...)` usando helper
- [ ] T013 Agregar sección SECTION I: `CREATE UNIQUE INDEX IF NOT EXISTS idx_org_members_unique ON public.organization_members (organization_id, user_id, role) WHERE is_active = true`
- [ ] T014 Agregar sección SECTION J (policies organization_members): `CREATE POLICY IF NOT EXISTS self_read_own_memberships` + `CREATE POLICY IF NOT EXISTS clinic_admin_read_clinic_members` según data-model §3.6. Verificar primero si ya existen (spec kit 007/018 puede haber cubierto)
- [ ] T015 Agregar DO block de post-check al final de la migración: valida que cada ADD COLUMN existe, helper function existe, cada policy existe, backfill dejó 0 clínicas sin organization_id. Tirar EXCEPTION si algún check falla
- [ ] T016 Aplicar migración a DB producción: copy-paste del archivo a Supabase SQL Editor → Run. Verificar NOTICE messages del pre/post-check. En caso de error, NO avanzar a tareas siguientes

### Edge Function (sub-bloque M2)

- [ ] T017 Modificar `supabase/functions/clinic-invitations/index.ts`: en action='create', aceptar `body.role` (default 'therapist'). Añadir validación `role IN ('therapist', 'assistant')`
- [ ] T018 Modificar action='create': cuando role='assistant', agregar validaciones backend nuevas: (a) profile.role del email NO es 'therapist' ni 'clinic' → error amable; (b) count pending <10 → error rate limit; (c) lookup existing_patient flag
- [ ] T019 Modificar action='create': setear `expires_at = NOW() + INTERVAL '7 days'`, `role`, `existing_patient` en el INSERT a clinic_invitations
- [ ] T020 Modificar action='create': email template contextualizado cuando role='assistant' (subject "te invita como asistente a X", cuerpo con copy per research §R-07)
- [ ] T021 Modificar action='validate': incluir `role`, `expires_at`, `existing_patient` en response. Añadir validación "expires_at < NOW() → expired"
- [ ] T022 Modificar action='accept': branch por `invite.role`. Si role='therapist' → comportamiento actual (INSERT clinic_therapists). Si role='assistant' → fetch clinic.organization_id, check existing organization_members row, INSERT o reactivate según caso (per contract §accept)
- [ ] T023 Modificar action='accept': response incluir `redirect_to: '/dashboard/assistant'` cuando role='assistant' (frontend lo usará para redirigir correctamente)
- [ ] T024 Deploy edge function: `supabase functions deploy clinic-invitations --project-ref tomremkbuxvedliyywbo` (o via Supabase dashboard)

### Verification

- [ ] T025 Smoke test backend: curl directo al edge function con action='create' body con role='assistant' (email test real) + verificar email llega + DB tiene row correcta. Test action='validate' con el token generado. Test action='accept' con un user logueado
- [ ] T026 Documentar resultados del smoke en `docs/session-logs/2026-04-23-spec-023-foundational.md` (timestamp, curl commands, responses)

**Checkpoint**: Foundation ready — user stories pueden arrancar en paralelo.

---

## Phase 3: User Story 1 — Clinic admin invita asistente (P1) 🎯 MVP

**Goal**: el admin puede invitar asistentes via UI en la página existente `/dashboard/clinic/therapists` (renombrada a "Gestión de Personal").

**Independent Test**: admin logueado puede abrir /dashboard/clinic/therapists, ver 2 tabs (Dentistas | Asistentes), seleccionar Asistentes, completar form de invitación, ver invitación como "pendiente" en lista. Email llega al destinatario.

### Scope pivot (vs plan original)

Re-usa la página existente `ClinicTherapistsManagementPage.jsx` en vez de crear `TeamManagementPage` nueva. Rename sidebar + título UI. Añade tabs top-level (Dentistas / Asistentes) manteniendo el funcionalidad de dentistas intacta.

### Implementation

- [ ] T027 [P] [US1] Crear `src/components/clinic/InviteAssistantModal.jsx` (nuevo, paralelo a `InviteTherapistModal.jsx`): modal shadcn/ui con campos email + mensaje opcional. Invoca edge function `clinic-invitations` action=create con role='assistant'. Maneja errores (email profesional existente / duplicate / rate limit) con toast + mensaje inline. Copy: "Invitar asistente", submit "Enviar invitación"
- [ ] T028 [P] [US1] Crear `src/lib/api/clinicPersonnelApi.js`: helpers `inviteAssistant(clinicId, email, message)`, `listAssistants(organizationId)` (query a organization_members JOIN profiles), `listInvitationsByRole(clinicId, role)` (query a clinic_invitations filtered), `revokeAssistant(memberId)` (UPDATE is_active=false)
- [ ] T029 [US1] Rename de branding en 3 archivos (rename atómico): `ClinicTherapistsManagementPage.jsx` título "Gestión de Equipo" → "Gestión de Personal" + description actualizada; `src/components/layout/Sidebar.jsx:210` label "Gestión de Dentistas" → "Gestión de Personal"; `src/components/onboarding/WelcomeModal.jsx:73` copy relacionado actualizado si menciona "dentistas"
- [ ] T030 [US1] Modificar `ClinicTherapistsManagementPage.jsx` — restructurar tabs: añadir top-level tabs `activeRole` (Dentistas default / Asistentes). Mantener sub-tabs Activos/Invitaciones dentro de cada (renombrar state `activeTab` → `activeSubTab`). Render condicional: si activeRole='therapist' → tablas actuales (intactas); si activeRole='assistant' → nuevas tablas (T032)
- [ ] T031 [US1] Modificar `ClinicTherapistsManagementPage.jsx` — botón invite contextual: label "Invitar Dentista" (si activeRole='therapist') abre `InviteTherapistModal` (existente); label "Invitar Asistente" (si activeRole='assistant') abre nuevo `InviteAssistantModal`. Ambos modales coexisten
- [ ] T032 [US1] Modificar `ClinicTherapistsManagementPage.jsx` — wire up data del tab Asistentes: state `assistants` + `assistantInvitations`, useEffect que llama `listAssistants` + `listInvitationsByRole(clinicId, 'assistant')` cuando activeRole='assistant'. Render tabla asistentes activos (columnas: nombre, email, fecha alta, acciones) + tabla invitaciones pendientes (columnas: email, fecha, expira, cancelar)

**Checkpoint**: admin puede enviar invitaciones asistente + las pendientes son visibles en tabla Asistentes + flow dentista sigue intacto. US1 independientemente testable.

> **Scope pivot note**: este Phase cambió de "crear página nueva en /dashboard/clinic/team" a "extender existente en /dashboard/clinic/therapists + rename". T027-T032 preservan 100% funcionalidad actual de dentistas (no toca InviteTherapistModal, clinic_therapists queries intactos).

---

## Phase 4: User Story 2 — Invitado acepta invitación (P1)

**Goal**: invitado abre el link del email, completa signup/login, queda asociado a la clínica con rol asistente y aterriza en su dashboard.

**Independent Test**: con invitación válida en DB, abrir link → signup/login → dashboard asistente con clínica correcta como contexto.

### Implementation

- [ ] T033 [US2] Modificar `src/pages/InviteAcceptPage.jsx`: después de validate, branch por `invitation.role`. Si role='assistant' → título "Invitación a colaborar", badge de rol "Asistente", CTA "Crear cuenta" (si !existing_patient) o "Iniciar sesión" (si existing_patient). Ajustar handleResponse para post-accept redirigir a `response.redirect_to` (en vez de hardcoded `/dashboard`)
- [ ] T034 [US2] Modificar `src/features/auth/pages/AuthPage.jsx`: detectar `?token=` en searchParams. Si viene + rol='assistant' en validation, pre-llenar `initialEmail` y `initialRole` automáticamente (saltar RolePicker para este caso). Guardar token en state + pasarlo a AuthForm via prop
- [ ] T035 [US2] Modificar `src/features/auth/components/AuthForm.jsx`: aceptar `invitationToken` prop. Post signup/login exitoso, si hay token, invocar `clinicTeamApi` con action='accept' + token, esperar success, luego redirigir a `response.redirect_to || '/dashboard'` (en vez de direct /dashboard)
- [ ] T036 [US2] Manejar edge case existing_patient en AuthPage: si invitation.existing_patient=true y user hace click en "Iniciar sesión" desde InviteAcceptPage, asegurar que tras login el useEffect detecte el `?token=` y dispare accept flow automáticamente

**Checkpoint**: invitado puede aceptar invitación end-to-end. organization_members row creado. Aterriza en /dashboard/assistant. US2 independientemente testable.

---

## Phase 5: User Story 3 — Asistente trabaja con permisos limitados (P2)

**Goal**: asistente puede agendar y listar pacientes, pero RLS bloquea fichas clínicas, billing, informes IA, configuración.

**Independent Test**: logueado como asistente, puede operar en agenda + listar pacientes. Intentos directos (URL/API) a ficha clínica retornan vacío o rechazo.

### Implementation

Este phase es mayormente **validación** — el enforcement vive en RLS policies del foundational. No hay código nuevo significativo aquí, salvo ajustes cosméticos en dashboard del asistente.

- [ ] T037 [P] [US3] Verificar `src/features/assistant/pages/AssistantDashboard` y `AssistantAgendaPage`: que el query de appointments use `clinic_id` del organization_members asociado al user. Si el dashboard hace query sin filter de clínica (legacy multi-app), agregar derivado from membership activa
- [ ] T038 [P] [US3] Verificar `AssistantPatientsPage`: query a patients usa el JOIN correcto vía `clinic_patients` o equivalente (debe respetar RLS policy `assistant_read_clinic_patients`)
- [ ] T039 [US3] Smoke test manual quickstart.md §US3 sub-steps 3.1 a 3.6: agenda visible, crear cita, listar pacientes, intentar acceder a ficha (bloqueado), intentar billing (bloqueado), revisar audit log
- [ ] T040 [US3] Si en T037/T038 se detectan gaps (dashboard vacío por query mal filtrado), fix puntual en los componentes del asistente manteniendo estructura actual

**Checkpoint**: asistente opera correctamente con permisos admin-level; intentos fuera del scope son rechazados. US3 independientemente testable.

---

## Phase 6: User Story 4 — Admin gestiona asistentes (P3)

**Goal**: admin puede ver asistentes activos + revocar acceso.

**Independent Test**: admin puede ver lista de asistentes, revocar con confirmación, asistente pierde acceso en próxima carga.

### Scope pivot (post US1 consolidación)

Varias partes se consolidaron en US1 al extender página existente:
- `listClinicAssistants` → ya incluida en T028 `clinicPersonnelApi.js`
- `revokeAssistant` → ya incluida en T028
- Tabla de asistentes + empty state → ya renderizada inline en T032 (reusa shape de tabla dentistas)

Lo que queda específico a US4 en este Phase:

### Implementation

- [ ] T041 [US4] Modificar `ClinicTherapistsManagementPage.jsx`: agregar dropdown "Acciones" en cada row de asistente con item "Revocar acceso" (reutilizar pattern existente `DropdownMenu` usado en row dentista). Confirmation vía `AlertDialog` existente (adaptar texto: "¿Revocar acceso a {asistente.full_name}? ...")
- [ ] T042 [US4] Wire `revokeAssistant(memberId)` al submit del AlertDialog: invoca función de `clinicPersonnelApi.js`, toast success/error, refresca listas vía `fetchClinicData` existente
- [ ] T043 [P] [US4] Agregar search input para tab Asistentes (parity con dentistas, state `assistantSearchTerm`): filtrar `assistants` por full_name + email
- [ ] T044 [US4] Verificar idempotencia reactivación: smoke test end-to-end invite → accept → revoke → re-invite → accept al mismo email debe reactivar row (no crear duplicado). Comportamiento backend ya implementado en T022 (edge function action=accept branch)
- [ ] T045 [US4] Agregar badge visual "Revocado" en histórico opcional: si el admin expande "ver asistentes inactivos" (optional toggle), mostrar con badge distinto. Diferir si scope creece

**Checkpoint**: admin tiene control total del equipo. Revocación funciona end-to-end. US4 independientemente testable.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: cierre de ciclo, housekeeping, docs.

- [ ] T046 [P] Ejecutar `quickstart.md` completo end-to-end (20-30min) con cuentas de test reales. Marcar los 4 "Criterios de aceptación global" en quickstart.md al pasar cada uno
- [ ] T047 [P] Actualizar `docs/product/feature-backlog.md`: mover entrada "Asistente — Login + Dashboard completo" de backlog a "Activated" (o eliminarla). Agregar entradas nuevas al backlog para los open issues de research §Open Issues (clinics con nombres duplicados, multi-clinic switch UI, email re-send)
- [ ] T048 [P] Actualizar `.specify/memory/architecture.md`: mencionar spec 023 en la sección de migrations history (item 8 después del 7 de spec 022). Refrescar tables count si cambió
- [ ] T049 [P] Crear `docs/session-logs/2026-04-23-spec-023-implement.md`: log de la sesión con commits, smoke results, follow-ups. Formato igual que `docs/session-logs/2026-04-22-pm-enforcement-branding-schema.md`
- [ ] T050 Actualizar `CLAUDE.md` sección "Active feature": marcar 023 como DONE. Mencionar los follow-ups que surgieron
- [ ] T051 Run `npm run build` para validar que no hay errores de compilación TypeScript/JSX post-cambios
- [ ] T052 Run lint sobre archivos tocados: `npx eslint src/features/clinic/ src/pages/InviteAcceptPage.jsx src/features/auth/pages/AuthPage.jsx src/features/auth/components/AuthForm.jsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup (T001-T003)**: sin dependencias, puede empezar inmediatamente
- **Phase 2 Foundational (T004-T026)**: depende de Setup. **BLOQUEA todas las user stories**
- **Phase 3 US1 (T027-T032)**: depende de Foundational completo (especialmente T016 migration + T024 edge function deploy)
- **Phase 4 US2 (T033-T036)**: depende de Foundational completo. Independiente de US1 (archivo tocado: InviteAcceptPage + AuthPage/Form; US1 toca features/clinic/)
- **Phase 5 US3 (T037-T040)**: depende de Foundational (RLS policies). Mayormente validación/smoke.
- **Phase 6 US4 (T041-T045)**: depende de Foundational + US1 (necesita TeamManagementPage creada en T030)
- **Phase 7 Polish (T046-T052)**: depende de US1-US4 completas.

### User Story Dependencies

- US1 (P1): puede arrancar después de Foundational. No depende de otras stories.
- US2 (P1): puede arrancar después de Foundational. Independiente de US1 (diferentes archivos). En paralelo si hay 2 devs.
- US3 (P2): puede arrancar después de Foundational. Puramente testing + verification.
- US4 (P3): **depende de US1** (TeamManagementPage). Puede arrancar cuando T030 esté done, no requiere US2 ni US3.

### Within-Story Notes

- Dentro de US1: T027/T028/T029 son [P] (diferentes archivos); T030 integra a los 3 → depende. T031/T032 pueden ir después de T030 en paralelo entre sí.
- Dentro de US2: T033/T034 tocan archivos distintos pero el flow es secuencial (validate antes que post-submit); considerar mergeables en 1 PR si quieren.
- Dentro de US4: T041/T042/T043 son [P]. T044 integra en TeamManagementPage (del US1), T045 es verification.

### Parallel Opportunities

- **Dentro Foundational**: T004 al T015 son secuenciales (mismo archivo migration). T017-T023 son secuenciales (mismo archivo edge function). Pero la migration (T016 apply) y el edge function deploy (T024) SON INDEPENDIENTES entre sí — pueden hacerse en paralelo.
- **Post-Foundational**: US1 (features/clinic frontend), US2 (InviteAcceptPage + AuthPage/Form) y US3 (assistant dashboard verification) pueden todas arrancar en paralelo.
- **Dentro US1**: T027 (API) + T028 (Modal) + T029 (PendingList) todos [P].
- **Dentro US4**: T041 + T042 + T043 todos [P].
- **Polish**: T046-T049 todos [P].

---

## Parallel Example: User Story 1

```bash
# Launch 3 componentes en paralelo (diferentes archivos):
Task: "T027 [P] Create src/features/clinic/api/clinicTeamApi.js with edge function wrappers"
Task: "T028 [P] Create src/features/clinic/components/InviteAssistantModal.jsx with form + validations"
Task: "T029 [P] Create src/features/clinic/components/PendingInvitationsList.jsx with list rendering"

# Después (secuencial, depende de los 3):
Task: "T030 Create TeamManagementPage.jsx composing the above"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

Los dos primeros P1 user stories son el MVP real — sin US1 no se pueden mandar invitaciones, sin US2 las invitaciones no resultan en nada útil.

1. Phase 1: Setup (T001-T003) — 10min
2. Phase 2: Foundational (T004-T026) — 3-4h (migration + edge function + smoke backend)
3. Phase 3: US1 (T027-T032) — 2-3h
4. Phase 4: US2 (T033-T036) — 1-2h
5. **STOP + VALIDATE**: smoke test manual US1 + US2 (quickstart.md §US1 y §US2)
6. **Deploy MVP** — invitar 1 asistente de test, verificar end-to-end

### Incremental Delivery

7. Phase 5: US3 (T037-T040) — 1h (mayor parte es validación)
8. Phase 6: US4 (T041-T045) — 1-2h
9. **STOP + VALIDATE**: smoke test completo quickstart.md §US3 + §US4
10. Phase 7: Polish (T046-T052) — 1h
11. Merge branch → main

### Tiempo total estimado

- MVP (Phases 1-4): 6-9h
- Full feature (Phases 1-7): 8-12h

Spread en 2-3 sesiones recomendado. Pausa explícita post-foundational y post-MVP para validar antes de seguir.

### Parallel Team Strategy

Con 2 devs post-Foundational:
- Dev A: US1 + US4 (frontend clinic)
- Dev B: US2 + US3 (accept flow + assistant validation)

Reconvergen en Phase 7 Polish.

---

## Notes

- **[P]** = archivos distintos, sin dependencias cruzadas bloqueantes
- **[Story]** label traza cada task a su user story
- Commits por task o por grupo lógico (ej: "T004-T015: migration sections A-J")
- **Constitution §IV**: cada phase es un commit (o pocos) — no mezclar sub-bloques en mismo commit
- **Antipatrón**: mezclar T016 (apply migration) con T024 (deploy edge function) en mismo commit — son side-effects a producción distintos, separar
- Validar en Supabase Edge Functions Logs después de cada deploy (T024)
- Si T025 smoke falla → rollback edge function (Supabase permite revert to previous version) + diagnosticar antes de avanzar
- Sin automated tests en MVP — cada story phase tiene smoke manual del quickstart como gate
- Respetar pausa post-Foundational antes de arrancar stories (risk: si foundational está roto, stories se construyen sobre fundamento incorrecto)
