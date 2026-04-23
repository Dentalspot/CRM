# Implementation Plan: Invite Assistant Flow

**Branch**: `023-invite-assistant-flow` | **Date**: 2026-04-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/023-invite-assistant-flow/spec.md`

## Summary

Extender el sistema de invitaciones existente (tabla `clinic_invitations` + edge function `clinic-invitations`) para soportar invitación de **asistentes** desde el dashboard de la clínica. El asistente recibe email con magic link, completa signup/login, y queda asociado a la clínica vía `organization_members` con rol `assistant`. Permisos admin-level (agenda + listado pacientes sin ficha clínica) enforceados via RLS. Revocación vía soft delete (`is_active=false`). Construido 100% sobre infraestructura existente (Resend, Supabase edge functions, organization_members, RolePicker invite-only ya configurado), con una migración clave para resolver el mismatch clinics ↔ organizations documentado en research.

## Technical Context

**Language/Version**:
- Frontend: React 18 + Vite 4.4 + TypeScript-compatible JSX
- Backend: Deno runtime (Supabase Edge Functions, TypeScript)
- Database: PostgreSQL 17.6 (Supabase Cloud)

**Primary Dependencies**:
- Frontend: react-router-dom 6, @supabase/supabase-js 2.99, shadcn/ui, react-hook-form 7.54, date-fns 2.30, lucide-react
- Edge Functions: `@supabase/supabase-js@2.39.7`, Deno std
- Email transactional: Resend API (ya integrado en `clinic-invitations` + `send-marketing-campaign` + `resend-webhook`)
- Auth: Supabase Auth (email + password)

**Storage**: PostgreSQL 17.6 via Supabase Cloud. RLS enforcement.

**Testing**: Manual smoke testing via `docs/launch-beta/checklist-preflight.md`. Automated test framework ausente en repo (decisión MVP lean). Post-implementation incluye checklist quickstart.md en este spec.

**Target Platform**: Web — browsers modernos (Chrome/Safari/Firefox últimas 2 versiones), desktop + mobile responsive.

**Project Type**: Web application — React SPA frontend + Supabase backend (Postgres + Edge Functions + Auth).

**Performance Goals**:
- Envío de invitación end-to-end (click a email enviado): < 3 segundos (SC-001)
- Email delivery observable: < 5 minutos (SC-008)
- Accept flow to dashboard: < 3 minutos (SC-002)
- RLS permission check por query: < 100ms p95
- Lista de asistentes activos + pendientes: < 500ms

**Constraints**:
- Compliance: Ley 20.584 art. 12 + Ley 21.719 + Constitution §I-VI (NON-NEGOTIABLE)
- Infra reuse: NO crear tablas ni edge functions nuevas si las existentes pueden extenderse (principio de micro-bloques + schema drift zero)
- Sin automated tests en MVP (manual smoke)
- Beta scope: N≤10 clínicas con ~3 asistentes cada una (~30 asistentes total, ~100 invitaciones/mes peak)

**Scale/Scope**:
- Beta: ~10 clínicas, ~30 asistentes
- Invitaciones pendientes simultáneas: max 10 por clínica (rate limit FR-006)
- Expiración invitación: 7 días
- ~5 archivos de código nuevos + ~5 modificados (ver Project Structure)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Justificación |
|---|---|---|
| **I. Compliance-First** | ✅ PASS | Ley 20.584 art. 12 (terceros admin, no clínico) + Ley 21.719 (consent de paciente para acceso admin) cubiertos en spec §Compliance. Asistente NO accede a ficha clínica detallada (FR-022 a FR-026). |
| **II. RLS-First Security** | ✅ PASS | FR-027 explícito: permisos enforcement en DB, no solo UI. Plan incluye función helper `is_in_clinic_as_assistant(user_id, clinic_id)` + policies en patients, appointments, clinical_records, subscription_payments. |
| **III. Append-Only Audit** | ✅ PASS | FR-028 cubre: todo acceso del asistente a datos de pacientes ajenos se loguea en `clinical_audit_log` vía `useClinicalAccessLogger`. Hook ya implementa filtro por `isClinicalRole` (assistant está incluido). Revocaciones también loguean (FR-033). |
| **IV. Micro-Bloques** | ⚠️ PASS con sub-división | Spec 023 es feature único (invite + permisos). Para implementación, se divide en 4 sub-micro-bloques: M1 schema extension, M2 edge function, M3 frontend admin (team page), M4 frontend assistant (acceptance). Cada uno es commit separado. |
| **V. UI Honesty** | ✅ PASS | FR-004/005 (validaciones backend con mensaje claro), FR-016 (redirect solo post-crear membership exitosa), FR-032 (revocación confirma `is_active=false`), acceptance scenarios validan .length > 0 en inserts. |
| **VI. Schema Drift Zero** | ✅ PASS | Pre-req cumplido (enum `user_role` ya acepta 'assistant', migration 20260423000001). Plan incluye 1 migración nueva para columns de `clinic_invitations` + resolución clinic↔organization (ver research.md). |

**Gate verdict**: ✅ ALL PASS — proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/023-invite-assistant-flow/
├── plan.md              # This file (/speckit-plan output)
├── spec.md              # Feature specification (already generated)
├── research.md          # Phase 0 output (resolved unknowns)
├── data-model.md        # Phase 1 output (entities, relationships, RLS)
├── quickstart.md        # Phase 1 output (manual smoke test steps)
├── contracts/
│   └── clinic-invitations-api.md  # Edge function contract (extended)
├── checklists/
│   └── requirements.md  # Spec quality checklist (done)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
supabase/
├── migrations/
│   ├── 20260423000001_add_assistant_lab_to_user_role.sql   # ✅ DONE (pre-req)
│   └── 20260423000002_invite_assistant_flow.sql            # NEW — schema extension + RLS
└── functions/
    └── clinic-invitations/
        └── index.ts                                         # MODIFY — extend for assistant role

src/
├── features/
│   └── clinic/                                              # NEW feature folder (or extend existing)
│       ├── pages/
│       │   └── TeamManagementPage.jsx                       # NEW — /dashboard/clinic/team
│       ├── components/
│       │   ├── InviteAssistantModal.jsx                     # NEW — invitation form
│       │   ├── AssistantsList.jsx                           # NEW — lista asistentes activos
│       │   └── PendingInvitationsList.jsx                   # NEW — invitaciones pendientes
│       └── api/
│           └── clinicTeamApi.js                             # NEW — wrappers al edge function
├── pages/
│   ├── InviteAcceptPage.jsx                                 # MODIFY — extend para asistente
│   └── ...
├── app/
│   └── routers/
│       └── DashboardRouter.jsx                              # MODIFY — agregar /dashboard/clinic/team route
└── features/
    └── auth/
        └── pages/
            └── AuthPage.jsx                                 # MODIFY — aceptar ?token= para pre-llenar signup asistente
```

**Structure Decision**:

- **Frontend nuevo en `src/features/clinic/`**: consistente con feature-based arquitectura existente (`src/features/patients/`, `src/features/membership/`, etc.). Evita mezclar con `src/components/clinic/` (que tiene `InviteTherapistModal` y `ClinicInvitationsPanel` legacy — no los tocamos en este spec, coexisten).
- **Edge function existente extendida, NO duplicada**: `clinic-invitations/index.ts` ya implementa 80% del flow (create/list/validate/accept/reject/cancel). Sub-micro-bloque M2 extiende con:
  - `body.role` param (default 'therapist' backward compat, acepta 'assistant')
  - Validación "email ya profesional" (nueva)
  - Validación "existing_patient" (nueva)
  - Expiración 7 días (nueva)
  - Branch en accept: si role='assistant' → insert en `organization_members`, else → insert en `clinic_therapists` (comportamiento actual)
- **Migration nueva en `supabase/migrations/`**: añade columns a `clinic_invitations` + resuelve clinic↔organization (backfill pattern — ver research.md).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No hay violaciones que justificar. Gates todos en verde.

---

## Phase 0 Execution Summary

Research consolidado en `research.md`. Decisiones clave:

1. **Clinics ↔ Organizations relationship** resuelto vía migración: añadir `organization_id` a `clinics` como FK nullable + backfill (auto-crea organización por clínica existente).
2. **Edge function extension pattern**: branch por `role` dentro de `accept`, respetando invariantes actuales del flow de therapist.
3. **Email flow**: reutilizar `sendEmail()` helper existente en `clinic-invitations/index.ts`, template HTML adaptado para asistente.
4. **Audit logging**: asistente accediendo a patients para listar/agendar invoca `useClinicalAccessLogger` vía el hook actual (ya trata a `assistant` como rol clínico). No se requiere hook nuevo.
5. **Permisos RLS**: función helper `is_in_clinic_as_assistant(user_id, clinic_id) RETURNS boolean SECURITY DEFINER` + 5 policies adicionales en patients/appointments/etc.

## Phase 1 Execution Summary

Artefactos de diseño consolidados en:
- `data-model.md`: schema de `clinic_invitations` extendido, `organization_members` (existente), helper `is_in_clinic_as_assistant`, policies adicionales, trigger de auto-creación de organization al signup de clínica.
- `contracts/clinic-invitations-api.md`: contrato extendido del edge function con los nuevos actions/params.
- `quickstart.md`: flujo manual de smoke test end-to-end (admin invita → email llega → asistente acepta → dashboard con data correcta → revocación efectiva).

CLAUDE.md actualizado con pointer al plan.
