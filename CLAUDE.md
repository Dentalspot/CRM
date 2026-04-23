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

**Active feature**: `023-invite-assistant-flow` **DONE + DEPLOYED** (2026-04-23) + Phase B clinic dashboard expansion MERGED. Backend live (migration `20260423000002` aplicada + edge function `clinic-invitations` deployed). Frontend mergeado a `main` commit `e4cb7a4` → Vercel auto-deploy a `dentalspot.cl`. Scope entregado: (a) invite asistente flow end-to-end desde clínica con modal dedicado, email con fallback link si Resend falla, acceptance branched por role en edge function; (b) Gestión de Personal renombrada con tabs top-level Dentistas/Asistentes, revoke unificado; (c) sidebar clínica reorganizado con Tablero principal + Mi clínica + Agendas + Pacientes + Gestión de Personal; (d) ClinicAgendasPage vista semanal con filtro por dentista; (e) ClinicPatientsPage listado org-scoped con banner Ley 20.584 art. 12. Follow-ups pendientes: (1) smoke test post-deploy completo invite→accept→revoke end-to-end, (2) integrar NewAppointmentForm real en Agendas/Pacientes stubs (hoy toast "próximamente"), (3) vista detalle admin-level paciente (modal citas sin clinical), (4) email confirmation ON flow para invitaciones (MVP asume OFF), (5) RUT duplicate UX — constraint rechaza con "Database error saving new user" genérico (backlog: validación client-side + mensaje claro), (6) meta-spec `fix-mercadopago-critical-bugs` P0 pre-scale, (7) spec `create-clinical-boxes-table-and-enforcement` para agenda por box, (8) Phase F smoke E2E spec 022. Ver `docs/launch-beta/README.md` + session logs para detalle.
<!-- SPECKIT END -->
