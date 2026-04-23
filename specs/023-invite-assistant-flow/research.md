# Phase 0 Research: Invite Assistant Flow

**Feature**: 023-invite-assistant-flow
**Date**: 2026-04-23
**Status**: Complete — all unknowns resolved

Este documento consolida las investigaciones necesarias para cerrar incertidumbres antes de Phase 1 (diseño). Organizado por decisión.

---

## R-01: Relación Clinics ↔ Organizations

**Unknown**: `clinic_invitations` usa `clinic_id`, pero `organization_members` usa `organization_id`. No hay FK directa entre `clinics` y `organizations` en el schema.

**Investigation**:
- `clinics` tiene `id`, `therapist_id` (owner), campos de info, pero NO `organization_id`
- `organizations` existe como tabla separada con `id`, `type` ('clinic' | 'solo_practice'), `legal_entity_type`, etc.
- `organization_members` referencia `organization_id` (no `clinic_id`)
- `RoleLandingRedirect` consulta `organization_members` para determinar el rol operativo
- No hay trigger ni función que auto-cree organización al registrar clínica

**Decision**: Añadir FK `organization_id` a `clinics` (UUID nullable) + backfill automático.

**Rationale**:
- Mantiene `organization_members` como source of truth (ya usado por RoleLandingRedirect)
- No rompe `clinic_therapists` existente (coexiste)
- Backfill genera 1 organización por clínica existente, preserva data
- Post-migration, las clínicas nuevas deben crear organización como parte del onboarding (trigger o edge function de signup)

**Alternatives considered**:
- **A**: Usar `clinic_id` directo en `organization_members` (renombrar columna o treat id as same) — **rechazado**: rompe semantics, organization_members tiene su rol en el modelo multi-tenant general.
- **B**: Crear tabla bridge `clinic_organizations` — **rechazado**: capa adicional sin valor, la relación es 1:1.
- **C**: Hacer que `organization_members.organization_id` = `clinics.id` directamente por convención (UUID match) — **rechazado**: acopla semánticamente sin documentación clara, fuente de bugs futuros.

**Implementation**:

```sql
-- Migration 20260423000002_invite_assistant_flow.sql (fragment)
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Backfill: crea 1 organización por clínica existente sin organization_id
INSERT INTO public.organizations (id, name, type, legal_entity_type, legal_name, is_active)
SELECT
  gen_random_uuid(),
  c.name,
  'clinic',
  'persona_natural',  -- default safe, admin puede editar después
  c.name,             -- legal_name = name hasta que admin lo actualice
  true
FROM public.clinics c
WHERE c.organization_id IS NULL;

-- Link clinic.organization_id al row creado (con JOIN por name match temporal)
-- NOTA: si hay colisiones por name duplicado, se resuelven en follow-up spec de data cleanup.
UPDATE public.clinics c
SET organization_id = o.id
FROM public.organizations o
WHERE c.organization_id IS NULL
  AND o.name = c.name
  AND o.type = 'clinic'
  AND o.is_active = true;

-- Trigger: auto-create organization cuando se inserta clinic nueva
CREATE OR REPLACE FUNCTION public.auto_create_organization_for_clinic()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_org_id uuid;
BEGIN
  IF NEW.organization_id IS NULL THEN
    INSERT INTO public.organizations (name, type, legal_entity_type, legal_name, is_active)
    VALUES (NEW.name, 'clinic', 'persona_natural', NEW.name, true)
    RETURNING id INTO v_org_id;
    NEW.organization_id := v_org_id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_auto_org_for_clinic
BEFORE INSERT ON public.clinics
FOR EACH ROW EXECUTE FUNCTION public.auto_create_organization_for_clinic();
```

**Edge case**: si 2 clínicas tienen el mismo `name`, el UPDATE con JOIN por `name` puede fallar o asociar incorrectamente. Mitigation: documentar como known limitation, el admin puede editar manualmente. En la práctica, clínicas con nombres duplicados son un problema de negocio mayor (marca, discoverability) — fuera de scope de este spec.

---

## R-02: Extensión de `clinic_invitations` table

**Unknown**: qué columnas faltan para soportar rol asistente + expiración + flag existing_patient.

**Investigation**: Schema actual de `clinic_invitations`:
```
id, clinic_id, email, token, message, status, invited_by, created_at, updated_at, accepted_at, rejected_at, cancelled_at
```
No tiene `role`, `expires_at`, `existing_patient`.

**Decision**: Añadir columnas.

**Rationale**:
- `role` (text, default 'therapist') preserva backward compat — invitaciones existentes quedan en 'therapist'
- `expires_at` (timestamptz) permite control 7 días de expiración (FR-007)
- `existing_patient` (bool, default false) marca si el email ya era paciente (FR-014 — flow de login + upgrade)

**Alternatives considered**:
- Crear tabla separada `assistant_invitations` — **rechazado**: duplica infraestructura (edge function, RLS, list/accept/cancel actions). El modelo con discriminator por rol es más limpio.
- Usar JSON `metadata` en lugar de columnas — **rechazado**: dificulta validación SQL + queries filtradas por role.

**Implementation**:
```sql
ALTER TABLE public.clinic_invitations
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'therapist' NOT NULL,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS existing_patient boolean DEFAULT false NOT NULL;

ALTER TABLE public.clinic_invitations
  ADD CONSTRAINT clinic_invitations_role_check
  CHECK (role IN ('therapist', 'assistant'));

-- Backfill: invitaciones existentes son therapist (default ya lo setea).
-- expires_at queda null para invitaciones preexistentes (no se expiran automáticamente,
-- se mantienen hasta que admin las cancele).

CREATE INDEX IF NOT EXISTS idx_clinic_invitations_role_status
  ON public.clinic_invitations (clinic_id, role, status);
```

---

## R-03: Edge Function `clinic-invitations` extension strategy

**Unknown**: cómo extender sin romper el flow existente de therapist invitations.

**Investigation**: Edge function actual tiene 5 actions:
- `create`: valida email, crea invitación + envía email (HARDCODED para therapist)
- `list`: retorna invitaciones por clinic_id
- `validate`: lookup por token, valida status='pending'
- `accept`: inserta en `clinic_therapists` (HARDCODED para therapist)
- `reject` / `cancel`: cambia status

**Decision**: Branch por `role` dentro de cada action cuando sea relevante. Mantener backward compat total (default role='therapist' en body).

**Rationale**:
- Mismas actions (`create`, `list`, `validate`, `accept`, `reject`, `cancel`) sirven para ambos roles
- Branching por `role` dentro de `accept` es el único punto crítico (insert target table diferente)
- `create` recibe opcional `body.role` (default 'therapist')

**Implementation outline**:

```typescript
// En action='create':
const role = body.role === 'assistant' ? 'assistant' : 'therapist';

// Validación backend según role:
if (role === 'assistant') {
  // FR-004: rechazar si email ya es profesional
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile?.role === 'therapist' || existingProfile?.role === 'clinic') {
    return { success: false, message: 'Este email ya tiene cuenta profesional.' };
  }

  // FR-006: rate limit 10 pending
  const { count } = await supabase
    .from('clinic_invitations')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinic_id)
    .eq('status', 'pending');

  if (count >= 10) {
    return { success: false, message: 'Límite de 10 invitaciones pendientes alcanzado.' };
  }

  // existing_patient flag
  const existing_patient = existingProfile?.role === 'patient';

  // Insert con role, expires_at, existing_patient
  await supabase.from('clinic_invitations').insert({
    clinic_id, email, token, message,
    invited_by: user.id,
    status: 'pending',
    role: 'assistant',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    existing_patient,
  });

  // Email template adaptado para asistente...
}

// En action='accept':
if (invite.role === 'assistant') {
  // Lookup organization_id desde clinic
  const { data: clinic } = await supabase
    .from('clinics')
    .select('organization_id, name')
    .eq('id', invite.clinic_id)
    .single();

  if (!clinic?.organization_id) {
    throw new Error('Clínica sin organización asociada (contactar soporte)');
  }

  // Check duplicate (FR-017)
  const { data: existing } = await supabase
    .from('organization_members')
    .select('id, is_active')
    .eq('user_id', user.id)
    .eq('organization_id', clinic.organization_id)
    .eq('role', 'assistant')
    .maybeSingle();

  if (existing) {
    // Reactivar si estaba inactivo (FR-034)
    if (!existing.is_active) {
      await supabase.from('organization_members')
        .update({ is_active: true, deactivated_at: null })
        .eq('id', existing.id);
    }
    // Ya está activo → noop, success (FR-017 soporta idempotencia)
  } else {
    await supabase.from('organization_members').insert({
      organization_id: clinic.organization_id,
      user_id: user.id,
      role: 'assistant',
      is_active: true,
      invited_by: invite.invited_by,
    });
  }

  await supabase.from('clinic_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invite.id);
}
```

**Alternatives considered**: Crear edge function nueva `assistant-invitations` — rechazado por duplicar 80% del código existente.

---

## R-04: Audit Logging para accesos del asistente

**Unknown**: ¿El asistente al listar pacientes (info de contacto) debe invocar `useClinicalAccessLogger`?

**Investigation**:
- Constitution §III dice: "acceso de TERCEROS a datos clínicos de un paciente ajeno debe invocar `useClinicalAccessLogger`"
- Hook actual en `src/lib/audit/useClinicalAccessLogger.js` tiene filtro `isClinicalRole(actor_role)` que incluye 'assistant' por diseño
- "Datos clínicos" per Ley 20.584 = fichas, diagnósticos, tratamientos, exámenes
- Info contacto (nombre, email, tel, próxima cita) NO es "dato clínico sensible" — es dato administrativo necesario para gestión

**Decision**: El asistente invoca `useClinicalAccessLogger` SOLO cuando accede a recursos clínicos (no cuando lista contactos).

**Rationale**:
- Constitution 1.1.0 changelog clarifica: "acceso de terceros a DATOS CLÍNICOS". Info de contacto para agendar NO califica.
- Filtrar logs a recursos clínicos evita ruido (Constitution §III "registrar auto-consulta añadiría ruido sin valor legal" — principio análogo aplica acá).
- Asistente en MVP NO tiene acceso a recursos clínicos (FR-022 a FR-024). Por definición no debería generar logs de este hook.
- Cuando el asistente lista pacientes o crea citas → NO se loguea vía useClinicalAccessLogger (son acciones admin).
- Pero: RLS policies aseguran que si el asistente TRATARA de acceder a ficha clínica, la DB rechaza. Si por alguna regresión futura el asistente gana acceso a recursos clínicos, el hook YA está preparado (isClinicalRole incluye 'assistant').

**Enforcement adicional (opcional, MVP o follow-up)**:
- Log de administración separado en `clinic_admin_audit_log` para revocaciones + invitaciones (FR-033). No usar `clinical_audit_log` porque no es clínico.
- MVP: usar `console.log` + Supabase Logs para revocaciones. Tabla dedicada queda en backlog.

**Alternatives considered**:
- Loguear TODO acceso del asistente a datos de pacientes (incluyendo listar) en `clinical_audit_log` — **rechazado**: genera volumen alto sin valor legal, contradice spirit de constitución.
- Crear tabla nueva `staff_admin_audit_log` para actions del asistente — **diferido a backlog** (over-engineering para MVP).

---

## R-05: RLS Policies para asistente

**Unknown**: qué policies nuevas se necesitan.

**Investigation**: Tablas con PHI que necesitan gating por asistente:
- `patients`: asistente puede SELECT de pacientes de su clínica (listado)
- `appointments`: asistente puede SELECT/INSERT/UPDATE/DELETE citas de dentistas de su clínica
- `clinical_records`, `treatments`, `odontograms`, `evaluations`, `session_activities`: asistente NO puede SELECT (denied)
- `subscription_payments`, `therapist_subscriptions`, `membership_plans`: asistente NO puede SELECT (denied)

**Decision**: Función helper `is_in_clinic_as_assistant(p_user_id, p_clinic_id) RETURNS boolean SECURITY DEFINER` + policies per-tabla.

**Rationale**:
- Helper centraliza la lógica de "is_active=true en organization_members" (evita duplicar SQL en cada policy)
- SECURITY DEFINER: ejecuta como postgres, puede leer organization_members sin recursion
- Policies son additive (no reemplazan existing) — un asistente que también sea patient sigue viendo sus propios recursos vía policies existing

**Implementation outline**:

```sql
CREATE OR REPLACE FUNCTION public.is_in_clinic_as_assistant(
  p_user_id uuid,
  p_clinic_id uuid
) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_is_member boolean;
BEGIN
  -- Resolver organization_id desde clinic
  SELECT organization_id INTO v_org_id
  FROM public.clinics
  WHERE id = p_clinic_id;

  IF v_org_id IS NULL THEN
    RETURN false;
  END IF;

  -- Validar membresía activa como asistente
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = p_user_id
      AND organization_id = v_org_id
      AND role = 'assistant'
      AND is_active = true
  ) INTO v_is_member;

  RETURN v_is_member;
END $$;

GRANT EXECUTE ON FUNCTION public.is_in_clinic_as_assistant(uuid, uuid) TO authenticated;

-- Policy: asistente puede listar pacientes de la clínica donde es asistente
CREATE POLICY "assistant_read_clinic_patients" ON public.patients
  FOR SELECT TO authenticated
  USING (
    -- Original policies siguen (propietario, care_team, etc.)
    -- Esta es ADITIVA — permite al asistente ver pacientes via clinic membership
    EXISTS (
      SELECT 1 FROM public.clinic_patients cp
      WHERE cp.patient_id = patients.id
        AND public.is_in_clinic_as_assistant(auth.uid(), cp.clinic_id)
    )
  );

-- Policy similar para appointments (asistente gestiona agenda)
CREATE POLICY "assistant_crud_clinic_appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinics c
      WHERE c.id = appointments.clinic_id
        AND public.is_in_clinic_as_assistant(auth.uid(), c.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clinics c
      WHERE c.id = appointments.clinic_id
        AND public.is_in_clinic_as_assistant(auth.uid(), c.id)
    )
  );

-- NO se agrega policy de asistente para clinical_records, treatments, odontograms, etc.
-- Como las policies actuales requieren ser terapeuta del paciente o estar en care_team,
-- un asistente (que no es terapeuta) automáticamente NO puede SELECT → DENY implícito.
-- Esto implementa FR-022 a FR-026 sin policies explicit DENY.
```

**Alternatives considered**:
- Policies explicit DENY para asistente en clinical_records, etc. — **rechazado**: policies son additive en PostgreSQL, un DENY no anula un ALLOW. El enforcement correcto es NO agregar ALLOW para asistente.
- Un solo policy grande con CASE por role — **rechazado**: menos legible y más difícil de auditar.

---

## R-06: Flow frontend al aceptar invitación

**Unknown**: el `InviteAcceptPage.jsx` actual requiere usuario logueado. ¿Cómo manejar caso invitado sin cuenta?

**Investigation**: `InviteAcceptPage.jsx` línea 154: si `!user`, muestra botones Login / Register con `redirectTo=/invite/${token}`.

**Decision**: Reutilizar el flow actual, pero agregar branch por `invitation.role === 'assistant'` en el componente:

- Si role='assistant' AND no user AND existing_patient=false → ir a `/auth/register?token=xxx&role=assistant` con email pre-llenado
- Si role='assistant' AND no user AND existing_patient=true → ir a `/auth/login?token=xxx` con email pre-llenado
- Si role='assistant' AND user logueado → flow actual de accept (que en backend branch por role)

**Rationale**: Infra actual ya maneja bien el "redirect back" post-auth. Solo hace falta que `AuthPage` acepte `?token=` param para:
1. Al completar signup/login, POST al edge function con action=accept + token
2. Así el asistente queda directamente asociado sin pasos manuales extra

**Implementation outline**:
- `InviteAcceptPage.jsx`: renderizar mensaje contextualizado ("Te invitaron como asistente a X") cuando role='assistant'. Mantener los botones Login/Register ya existentes pero con label "Crear cuenta" (no "Crear Cuenta Profesional" — eso es para dentista).
- `AuthPage.jsx`: detectar `?token=` en URL, al finalizar auth exitoso, invocar `clinic-invitations` accept automáticamente antes del redirect a dashboard.

**Alternatives considered**: Página separada para asistente. **Rechazado**: duplica UI por variación mínima.

---

## R-07: Consideraciones de UX y copy

**Unknown**: ¿qué copy específico en email + página de aceptación para asistente?

**Decision**:
- **Email subject**: "Te invitaron como asistente a [ClinicaName] en DentalSpot"
- **Email body H2**: "[AdminName] te invitó al equipo de [ClinicaName]"
- **CTA**: "Aceptar invitación" (mismo que therapist)
- **InviteAcceptPage title**: "Invitación a colaborar" (en lugar de "Invitación a Clínica")
- **Description post-accept**: "Tu rol: Asistente administrativo"
- **Edge case empty ficha clínica (asistente navega por error)**: "Los asistentes administrativos no tienen acceso a fichas clínicas por normativa."

**Rationale**: Copy distingue clara la diferencia de rol para evitar confusión. El asistente entiende desde el primer contacto que su rol es operativo, no clínico.

---

## R-08: Testing strategy

**Unknown**: sin framework de tests automatizados en el repo, ¿cómo validar el feature?

**Decision**: Quickstart.md con smoke test paso a paso (paradigma manual DentalSpot). Incluye:
- Crear clínica test
- Invitar asistente (email real)
- Verificar email llega
- Aceptar con cuenta nueva
- Login asistente → dashboard con agenda visible
- Intentar acceder a ficha clínica → rechazado
- Revocar asistente → verificar pierde acceso

**Rationale**: Consistente con MVP lean. Test automatizado queda en backlog.

---

## Open Issues (fuera de scope MVP)

1. **Clínicas con nombres duplicados en backfill**: si hay collisions en el UPDATE post-INSERT, alguna clínica queda sin `organization_id`. Mitigation: flag como known issue en migration + admin puede editar via SQL.
2. **Organización pre-existente para clínica**: si una clínica ya tiene organization_id asociado pero organization_members vacío (admin no está registrado como member), el invite puede fallar. Mitigation: trigger `auto_create_organization_for_clinic` + instrucciones de onboarding para registrar clinic_admin en org_members.
3. **Multi-clínica switch UI**: cuando un asistente pertenece a >1 clínica, MVP elige la primera. UI de switch queda en backlog.
4. **Re-invitación con email delivery failure**: MVP requiere cancelar + crear nueva. Feature "resend" queda en backlog.
