# DentalSpot

SaaS odontológico del ecosistema **Communicare**, en producción desde Q1-2026.
React 18 SPA + Supabase (PostgreSQL + RLS + Edge Functions). Hosted on Vercel.

Antes de escribir código, **lee los 4 docs fundacionales en `.specify/memory/`**:

| Doc | Contenido | Cuándo consultar |
|---|---|---|
| `constitution.md` | 6 principios NON-NEGOTIABLE | Antes de cualquier spec/plan/tasks/implement |
| `architecture.md` | Mapa técnico del repo (stack, features, data layer, deuda) | Al tocar código nuevo o entender dónde vive algo |
| `ecosystem-communicare.md` | Rol en el ecosistema Communicare (DentalSpot + FONOKIT + futuros SaaS) | Al diseñar features cross-app o exports clínicos |
| `data-compliance.md` | Inventario de compliance implementado (Ley 20.584 + 21.719) | Al tocar PHI, consent, firma, auditoría, ARCO |

## Reglas operativas rápidas

Los 6 principios de la constitución (resumen):

1. **Compliance-First** — sin evaluación Ley 20.584/21.719, no hay spec
2. **RLS-First Security** — los guards React son UX, no seguridad. La seguridad vive en `supabase/policies.sql`
3. **Append-Only Audit** (v1.1.0) — acceso de **TERCEROS** (`dentist` / `clinic_admin` / `assistant`) a datos clínicos de paciente ajeno debe invocar `useClinicalAccessLogger`. **Auto-acceso del paciente a su propia ficha NO requiere logging** (alineado Ley 20.584 art. 13 + Ley 21.719 — transparencia sobre terceros, no auto-consulta). El hook escribe a `clinical_audit_log` (audit general, NO a `clinical_access_log` del módulo `clinical-passport`, ver `data-compliance.md`). **Antipatrón** (lección spec 008): declarar gap §III por grep sin leer body del hook (ver `PATTERNS.md §6`)
4. **Micro-Bloques** — un PR = un bug/feature. Nunca refactor + fix + feature mezclados
5. **UI Honesty** — ningún toast "Guardado" sin validar `.select('id').length > 0`
6. **Schema Drift Zero** — columna usada en código = columna existente en `supabase/migrations/`

## Workflow asesor / ejecutor

DentalSpot opera con división de roles (ver `constitution.md` sección "Development Workflow"):

- **Asesor estratégico** (sesión externa de Claude) — define scope, valida planes
- **Ejecutor en IDE** (tú, Claude Code) — corre `/speckit-*`, edita código, reporta
- **Commits y push** — los hace Danissa Klagges (founder), NO el ejecutor

Flujo obligatorio por feature:

`/speckit-specify` → review 5 líneas → `/speckit-plan` → review → `/speckit-tasks` → review → `/speckit-implement` → test manual → Danissa hace deploy.

## Stack (referencia rápida)

React 18 · react-router-dom 6 · Vite 4.4 · Tailwind 3 · shadcn/ui (JS, new-york) · @supabase/supabase-js 2.99 · react-hook-form 7.54 · date-fns 2.30 · leaflet.

**Ausentes (deuda):** `zod` · `@hookform/resolvers` · `@tanstack/react-query`.

## Supabase

- Project ref: `tomremkbuxvedliyywbo`
- 77 migraciones en `supabase/migrations/` (RLS en 3 fases + sync fix de spec 003)
- 173 tablas, 38 edge functions, ≈ 3.016 líneas de policies
- Schema dump (`supabase/schema.sql`) actualmente vacío — regenerar como micro-bloque
- **Dos tablas audit distintas, NO confundir:** `clinical_audit_log` (audit general via `src/lib/audit/*`) vs `clinical_access_log` (passport sharing via `src/features/clinical-passport/*`). Detalle en `data-compliance.md` §"Dos tablas distintas"
- **Patrón canónico "backfill idempotente + trigger de sincronización"** para tablas derivadas — ver `architecture.md` §"Canonical patterns" (ejemplo: migración `20260419000001` de spec 003)

## Antes de hacer X, lee Y

| Vas a... | Lee obligatorio |
|---|---|
| Tocar datos clínicos / PHI | `data-compliance.md` + Constitution III |
| Agregar tabla nueva | `architecture.md` + Constitution VI |
| Escribir un form con submit | Constitution V (UI Honesty) |
| Pensar en API entre DentalSpot y FONOKIT | `ecosystem-communicare.md` |
| Tocar RLS | `data-compliance.md` sección "Aislamiento entre clínicas" |
| Investigar duplicación pages/features | `architecture.md` sección "Technical debt inventory" |
| Crear tabla derivada poblada por backfill | `architecture.md` §"Canonical patterns" (backfill+trigger) + antipatrón §"migración one-shot sin trigger" |
| Distinguir `clinical_audit_log` vs `clinical_access_log` | `data-compliance.md` §"Dos tablas distintas" |

---

**Última revisión fundacional**: 2026-04-20 (aprendizajes ciclo spec 001/002/003 incorporados — ver changelogs en los 4 docs de `.specify/memory/`)

<!-- SPECKIT START -->
Para contexto adicional (spec activa, plan en curso, tasks), ver los archivos que Spec Kit crea en `specs/` durante el ciclo `/speckit-*`. Los 4 docs fundacionales en `.specify/memory/` son la referencia permanente.

**Plan activo**: [specs/024-assistant-rich-calendar/plan.md](specs/024-assistant-rich-calendar/plan.md)

**Active feature**: `024-assistant-rich-calendar` **IMPLEMENTED** (2026-04-24). Calendario rich tipo Google Calendar para el asistente — reemplaza la vista lista día-por-día por grid semanal con drag-to-create citas, bloqueo de horas con drag, edit y resize. Scopeado por `organization_id` (asistente ve agenda de todos los dentistas de su clínica via selector).

**Arquitectura clave — reusable para spec 025 (clinic_admin calendar)**:
- Componente genérico `OrgCalendarView` en `src/components/calendar/` acepta prop `scope='assistant'|'clinic_admin'`
- Servicio nuevo `src/lib/api/org.api.js` con 10 funciones paralelas a `therapist.api.js` pero scopeadas por org
- `AssistantCalendarPage` es wrapper fino que delega en `OrgCalendarView`
- `WeeklyAgendaView` (del dentista) se reusa SIN modificar

**Migration aplicada**: `20260424000001_blocked_times_assistant_rls.sql` — 3 policies en `blocked_times` (SELECT/INSERT/DELETE para asistente) + 2 policies en `profiles` (asistente ve miembros + pacientes de su org). Policies `appt_assistant_*` ya existían del spec 023.

**Compliance**: audit log vía `logClinicalAccess` se invoca en create/update/cancel de cita + view de paciente al abrir edit modal. Bloqueos horarios NO audit (no tocan paciente). Ley 20.584 art. 12 + Ley 21.719 respetadas (FR-026-029).

**Spec 023 (invite-assistant-flow)**: DONE + DEPLOYED + SMOKE-TESTED. Kobe Bean Bryant test user sigue `is_active=false` en `organization_members` para regresiones.

**Durante smoke se descubrieron y fixearon 3 bugs DB críticos**:
- Migration `20260423000003_add_responsible_role_to_clinics.sql` — nuevo campo `clinics.responsible_role` (Ley 20.584 art. 5)
- Migration `20260423000004_allow_multi_account_per_rut.sql` — DROP UNIQUE constraint en `profiles.rut` para soportar multi-cuenta por persona (dentista dueño de su clínica = 2 cuentas legítimas con mismo RUT)
- Migration `20260423000005_clinic_admins_read_org_member_profiles.sql` — RLS policy nueva permite al clinic_admin leer profiles de members activos E inactivos de su org (necesario para listado Asistentes + Inactivos)

**Además del smoke se implementaron 2 mejoras de producto inline**:
- Rediseño "Mi Clínica" → tab unificado con 2 cards (Datos de clínica + Responsable legal), eliminado "Sobre Mí" para users clinic, validación RUT chileno client-side, paleta teal unificada (removido pink hardcoded `#ff74c3`)
- Tab "Inactivos" + acción "Reactivar" en Gestión de Personal (ClinicTherapistsManagementPage)

**Bugs UX remanentes registrados como followups (no bloqueantes, audit trail en SpawnTask)**:
1. Sidebar cambia a items de 'patient' cuando assistant cae en 404 (fix en Sidebar.jsx role detection)
2. RoleGuard inconsistente — algunas rutas clinic→404, otras redirect a `/auth/login` (no debería romper sesión)
3. Asistente revocado queda en limbo con "Selecciona una organización" post-login (mejor mensaje + redirect)
4. Missing clinic row for clinic-role accounts que no completan wizard Mi Clínica

**Próximos specs sugeridos**:
- `assistant-rich-calendar` — calendario rich tipo dentista para asistente (drag bloquear horas) — user solicitó durante smoke, 3-4h
- Followups UX #1-#4 — 1-2h cada uno
- `create-clinical-boxes-table-and-enforcement` para agenda por box
- `fix-mercadopago-critical-bugs` P0 pre-scale

Backend vive en prod: migration `20260423000002` + edge function `clinic-invitations`. Frontend mergeado en `main` commit `e4cb7a4`. Los cambios de esta sesión (migrations 000003/000004/000005 + rediseño Mi Clínica + tab Inactivos) están en working directory pendientes de commit + deploy.
<!-- SPECKIT END -->
