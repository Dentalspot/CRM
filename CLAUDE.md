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
3. **Append-Only Audit** — leer datos clínicos sin invocar `useClinicalAccessLogger` es violación
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
- 76 migraciones en `supabase/migrations/` (RLS en 3 fases)
- 173 tablas, 38 edge functions, ≈ 3.016 líneas de policies
- Schema dump (`supabase/schema.sql`) actualmente vacío — regenerar como micro-bloque

## Antes de hacer X, lee Y

| Vas a... | Lee obligatorio |
|---|---|
| Tocar datos clínicos / PHI | `data-compliance.md` + Constitution III |
| Agregar tabla nueva | `architecture.md` + Constitution VI |
| Escribir un form con submit | Constitution V (UI Honesty) |
| Pensar en API entre DentalSpot y FONOKIT | `ecosystem-communicare.md` |
| Tocar RLS | `data-compliance.md` sección "Aislamiento entre clínicas" |
| Investigar duplicación pages/features | `architecture.md` sección "Technical debt inventory" |

---

**Última revisión fundacional**: 2026-04-19

<!-- SPECKIT START -->
Para contexto adicional (spec activa, plan en curso, tasks), ver los archivos que Spec Kit crea en `specs/` durante el ciclo `/speckit-*`. Los 4 docs fundacionales en `.specify/memory/` son la referencia permanente.
<!-- SPECKIT END -->
