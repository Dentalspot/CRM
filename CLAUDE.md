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

**Active feature**: `023-invite-assistant-flow` — Phase 1 plan.md ready (2026-04-23). Spec + research + data-model + contracts + quickstart listos en `specs/023-invite-assistant-flow/`. Pre-req DB fix aplicado (`20260423000001_add_assistant_lab_to_user_role.sql` — enum `user_role` ahora incluye `assistant` + `lab`). Próximo paso: `/speckit-tasks` para generar breakdown ejecutable, luego `/speckit-implement` en 4 sub-micro-bloques (M1 migration, M2 edge function, M3 frontend clinic admin team page, M4 frontend assistant accept flow). Key design decision (research.md §R-01): añadir `organization_id` a `clinics` + backfill + trigger auto-create de org al insertar clínica — resuelve mismatch estructural clinics↔organizations que bloqueaba el flow de asistente vía `organization_members`. Contexto previo: spec 022 MVP Lean DONE + Phase E DONE + Launch beta prep DONE (ver `docs/launch-beta/`). Follow-ups post-023 por prioridad: (1) E3 smoke manual enforcement spec 022 (30min), (2) completar preflight comunicación + invitar beta (1h), (3) meta-spec `fix-mercadopago-critical-bugs` P0 (16-22h), (4) Phase F smoke E2E spec 022 con beta users reales (1-2h), (5) `create-clinical-boxes-table-and-enforcement`. Ver `docs/launch-beta/README.md` + `docs/session-logs/2026-04-22-pm-enforcement-branding-schema.md` para detalle previo.
<!-- SPECKIT END -->
