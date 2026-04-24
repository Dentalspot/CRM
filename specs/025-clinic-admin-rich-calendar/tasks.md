---
description: "Task list for spec 025-clinic-admin-rich-calendar"
---

# Tasks: Clinic Admin Rich Calendar

**Input**: Design documents from `/specs/025-clinic-admin-rich-calendar/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Smoke manual documentado en `quickstart.md`. Sin tests automatizados (coherente con codebase).

**Organization**: Tareas agrupadas por user story. Debido a la naturaleza del spec (wire-up de componente existente), las US2-US4 no tienen código nuevo — solo smoke tests para validar que el reuso funciona.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin deps bloqueantes)
- **[Story]**: Map a user story (US1-US4); Setup/Foundational/Polish sin label

## Path Conventions

- Single project (SPA React + Supabase). Paths relativos al repo root.

---

## Phase 1: Setup

**Purpose**: Pre-requisitos mínimos.

- [ ] T001 Verificar que la rama activa es `025-clinic-admin-rich-calendar` ejecutando `git branch --show-current` y que el working tree está limpio. Si hay cambios fuera del spec actual, pausar y confirmar con usuario.

**Checkpoint**: Branch correcta, working tree limpio.

---

## Phase 2: Foundational (Blocking)

**Purpose**: Migration RLS con las 6 policies faltantes. **NINGUNA US puede funcionar sin esto** — porque el clinic_admin hoy no puede INSERT en blocked_times ni scheduled_reminders.

⚠️ **CRITICAL**: Phase bloqueante.

- [ ] T002 Crear migration `supabase/migrations/20260424000004_blocked_times_reminders_admin_rls.sql` con 6 policies: 3 para `blocked_times` (admin_select/insert/delete) + 3 para `scheduled_reminders` ("Org admins insert/update/delete reminders"). Usar el mismo SQL pattern que spec 024 migration `20260424000001` y `20260424000002`, reemplazando `'assistant'` por `'clinic_admin'` en `is_org_member()`. Incluir COMMENT ON POLICY para cada una con referencia al spec 025. Ver detalle en `data-model.md §Migration pendiente`.
- [ ] T003 Aplicar migration T002 vía Supabase Dashboard SQL Editor (o CLI si está linkeada). Verificar con `SELECT policyname, cmd FROM pg_policies WHERE tablename IN ('blocked_times','scheduled_reminders') AND (policyname ILIKE '%admin%' OR policyname ILIKE '%clinic_admin%')` — esperado: **6 filas** (3 blocked_times + 3 scheduled_reminders). **(PENDIENTE user SQL)**

**Checkpoint**: 6 policies vivas en DB. US1-US4 pueden empezar.

---

## Phase 3: User Story 1 — Ver calendario rich (Priority: P1) 🎯 MVP

**Goal**: Clinic admin accede a `/dashboard/clinic/agendas` y ve el mismo calendario rich que el asistente.

**Independent Test**: Login como clinic_admin → sidebar Agendas → ver grid semanal con selector de dentista + navegación + citas/bloqueos/slots. (Quickstart step 1-2.)

### Implementation for US1

- [ ] T004 [US1] Crear `src/features/clinic-dashboard/ClinicAdminCalendarPage.jsx` — wrapper fino que: (a) importa `OrgCalendarView` de `@/components/calendar/OrgCalendarView`; (b) usa `useCurrentOrganization()` para obtener `currentOrganizationId` + `currentOrganization`; (c) guard de "sin org" análogo a AssistantCalendarPage (spec 024) con CTA logout; (d) renderiza `<OrgCalendarView scope="clinic_admin" organizationId={currentOrganizationId} />`; (e) incluye `<Helmet>` con título "Agendas | {clinic.name}".
- [ ] T005 [US1] Actualizar `src/app/routers/DashboardRouter.jsx`: cambiar el componente que monta la ruta `/dashboard/clinic/agendas` — reemplazar el import `ClinicAgendasPage` por `ClinicAdminCalendarPage` desde `@/features/clinic-dashboard/ClinicAdminCalendarPage.jsx`. Mantener el wrapper `RoleGuard allowedRoles={[USER_ROLES.CLINIC]}`. Mantener `ClinicAgendasPage.jsx` en filesystem por ahora (se elimina en Polish task T014).
- [ ] T006 [US1] Correr `npx vite build --mode development` para validar compilación sin errores. Documentar cualquier warning relevante.
- [ ] T007 [US1] Smoke test manual **Quickstart steps 1-2**: login como `clinicadental.los.alamos@gmail.com`, navegar a Agendas, verificar grid semanal + selector dentista + navegación prev/hoy/next + filtro estado. Confirmar que el selector muestra a Cristóbal (dentist).

**Checkpoint**: US1 PASSED — admin ve calendario rich. Funcionalidad core MVP.

---

## Phase 4: User Story 2 — Crear cita con drag (Priority: P1)

**Goal**: Admin crea cita drag-to-create con el mismo flow que el asistente.

**Independent Test**: Drag slot libre → modal prefilled → autocomplete paciente + servicios + guardar → cita aparece. (Quickstart step 3.)

### Implementation for US2

**No hay código nuevo** — behavior heredada de spec 024 via `OrgCalendarView` + `AssistantAppointmentModal`. Solo validación.

- [ ] T008 [US2] Smoke test manual **Quickstart step 3**: drag sobre slot libre → modal abre → buscar "Kobe" en autocomplete → seleccionar → crear cita. Verificar toast "✅ Cita creada" + bloque azul en grid. Verificación DB: row reciente en `appointments` con `therapist_id=Cristóbal`. **Criterio crítico**: si el INSERT falla por RLS (esperado si migration T003 no aplicada), documentar y detener hasta resolver.

**Checkpoint**: US2 PASSED.

---

## Phase 5: User Story 3 — Bloquear hora con drag (Priority: P1)

**Goal**: Admin bloquea horario con drag.

**Independent Test**: Drag entre slots → Dialog razón → bloquear → row en blocked_times + bloque rojo visible. Click en bloque → confirm → desbloquear. (Quickstart step 4.)

### Implementation for US3

Sin código nuevo — mismo razonamiento que US2.

- [ ] T009 [US3] Smoke test manual **Quickstart step 4**: drag entre slots libres → Dialog "Bloquear hora" abre → escribir razón "Reunión" → Bloquear. Verificar bloque rojo en grid + row en DB. Luego click en el bloque → Dialog "¿Desbloquear?" → confirmar → bloque desaparece. **Criterio**: si INSERT falla por RLS (posible si migration no aplicada o policy mal escrita), detener y debuggear.

**Checkpoint**: US3 PASSED.

---

## Phase 6: User Story 4 — Editar cita (Priority: P2)

**Goal**: Admin edita cita + drag-to-move.

**Independent Test**: Click cita → modal edit → cambiar status → guardar. Drag cita a otro slot → movida. (Quickstart step 5.)

### Implementation for US4

Sin código nuevo.

- [ ] T010 [US4] Smoke test manual **Quickstart step 5**: click en cita existente → modal edit abre con datos cargados → cambiar status a "Confirmada" → Guardar → verificar color azul + toast. Luego drag la cita a otro slot libre → verificar que se mueve + update en DB. Si falla, verificar que `appt_admin_update` policy existe (spec 023 debería haberlo creado).

**Checkpoint**: US4 PASSED.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Cleanup + validaciones finales + docs.

- [ ] T011 [P] Eliminar archivo `src/pages/clinic/ClinicAgendasPage.jsx`. Antes de borrar verificar con `grep -r "ClinicAgendasPage" src/` que no quedan imports. Si aparecen solo en comentarios (como en `DashboardRouter.jsx` después de T005), no bloquea.
- [ ] T012 [P] Actualizar `CLAUDE.md` — sección "Active feature" — con resumen del spec 025: wrapper nuevo, migration aplicada, archivos eliminados, referencias al spec 024 como base. Formato similar a actualizaciones previas.
- [ ] T013 Smoke test **Quickstart step 6** — regresión asistente: logout admin, login como Kobe (`dentalspot.cl+asistente@gmail.com`), navegar a Agenda. Verificar que TODO sigue funcionando igual que spec 024 smoke (cross-sync de citas creadas por admin también visible). Si hay regresión en calendario del asistente → **bug crítico**, abrir issue.
- [ ] T014 Smoke test **Quickstart step 7** — RLS security: desde sesión de admin intentar crear cita en otra organization_id (vía DevTools Console). Verificar que RLS rechaza. Documentar el resultado. Si NO rechaza → **bug crítico de seguridad**, detener deploy.

**Checkpoint final**: Spec 025 DONE — smoke completo + legacy eliminado + docs actualizados.

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 Setup** → sin deps.
- **Phase 2 Foundational** → depende Phase 1. BLOQUEA US1-US4.
- **Phase 3 US1** → depende Phase 2 (migration aplicada).
- **Phase 4 US2** → depende Phase 3 (calendario monta y funciona).
- **Phase 5 US3** → depende Phase 3. Independiente de Phase 4.
- **Phase 6 US4** → depende Phase 3 + Phase 4 (reusa la cita creada en US2).
- **Phase 7 Polish** → depende de todas las US validadas.

### Parallel opportunities

- T011 + T012 pueden correr en paralelo (archivos distintos, uno es delete + grep, otro es edit de CLAUDE.md).
- No hay otra paralelización — el flujo es principalmente secuencial porque los cambios de código son mínimos (1 page nueva + 1 route update).

### Within each user story

- US2-US4 no tienen código nuevo — solo smoke tests. Pueden ejecutarse en cualquier orden una vez US1 pasado, aunque el runbook quickstart los ordena lógicamente (crear → bloquear → editar).

---

## Parallel Example: Phase 7 Polish

```bash
# Terminal 1 — cleanup legacy
Task: "T011 — Eliminar src/pages/clinic/ClinicAgendasPage.jsx + grep de imports"

# Terminal 2 — docs
Task: "T012 — Update CLAUDE.md Active feature"
```

Los smoke tests T013/T014 son secuenciales (requieren cambio de sesión user).

---

## Implementation Strategy

### MVP (US1 solo)

1. Phase 1 Setup (T001)
2. Phase 2 Foundational (T002-T003) ← **bloqueante**
3. Phase 3 US1 (T004-T007)
4. **STOP + VALIDATE**: smoke step 1-2 del quickstart
5. Deploy MVP si pasa — admin ya tiene visibilidad del calendario aunque no pueda crear/bloquear (dependería de T003 aplicada).

### Incremental Delivery (recomendado por scope chico)

Este spec es tan pequeño que se ejecuta idealmente **en un solo PR**:

1. Setup + Foundational + US1-US4 + Polish → 1-2h total
2. Single smoke pass post-deploy cubre todas las US
3. Commits divididos por phase para git log limpio

### Single-Dev (realista)

Ejecutar tareas secuencialmente dentro de cada phase. Commit al final de cada phase (o al final del todo). Hard stop después de Phase 3 para smoke US1.

---

## Notes

- **Tests automatizados NO incluidos** (smoke manual via quickstart).
- **Código nuevo mínimo**: ~30 líneas (`ClinicAdminCalendarPage.jsx`) + 1 linea route update.
- **Código a eliminar**: `ClinicAgendasPage.jsx` (~375 líneas legacy).
- **Budget estimado**: 1-2h incluyendo smoke manual.
- **Commits**: Danissa (o ejecutor aprobado) hace los commits post-validación.
- **[P] marker**: diferentes archivos + sin deps. No significa obligatorio paralelo.
- **File paths**: relativos al repo root.
- **Dependencia de spec 024**: este spec solo funciona si spec 024 ya está deployado en prod (confirmado).
