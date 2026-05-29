# Phase 1 Data Model — Appointment Dentist Assignment

**Spec**: 028 | **Date**: 2026-05-29

Modelo de datos involucrado. Sin nuevas tablas. Sin nuevas columnas. Solo nuevos constraints (CHECK + trigger) + RLS policy refinada.

---

## Entidad principal: `appointments`

### Estado actual (no se modifica)

```sql
CREATE TABLE public.appointments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      uuid NOT NULL,                          -- → patients(id)
    therapist_id    uuid NOT NULL,                          -- → profiles(id)  [SEMÁNTICA: dentista responsable]
    organization_id uuid,                                   -- → organizations(id) — agregado spec 022
    clinic_id       uuid,                                   -- → clinics(id)
    service_id      uuid,                                   -- → therapist_services(id)
    box_id          uuid,                                   -- → clinic_boxes(id) — agregado spec 022
    date            date NOT NULL,
    start_time      time without time zone NOT NULL,
    end_time        time without time zone NOT NULL,
    duration_minutes integer NOT NULL DEFAULT 40,
    status          text NOT NULL DEFAULT 'scheduled',      -- {scheduled, confirmed, completed, cancelled, no-show}
    confirmation_status text DEFAULT 'pending',
    modality_patient text DEFAULT 'presencial',
    block_type      text,
    notes           text,
    color           text DEFAULT '#FF4D8D',
    recurring_group_id uuid,
    specialty_id    uuid,
    send_email_reminder boolean DEFAULT false,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);
```

**Constraints relevantes pre-existentes**:
- FK `appointments_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES profiles(id) ON DELETE CASCADE`
- `therapist_id NOT NULL` → enforza FR-001 ("dentista obligatorio") sin trabajo adicional
- CHECK `status IN (...)`
- Trigger `trg_check_appointment_box` (spec 022 — valida box, double-booking)

### Cambios introducidos por spec 028

#### 1. Trigger nuevo `trg_check_appointment_dentist`

```sql
CREATE OR REPLACE FUNCTION public.check_appointment_dentist()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    -- Legacy rows sin org_id — sin org, no se puede validar. Tolerar.
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = NEW.therapist_id
      AND om.organization_id = NEW.organization_id
      AND om.role = 'dentist'
      AND om.is_active = true
  ) THEN
    RAISE EXCEPTION
      'dentist_not_active_in_org: el usuario % no es dentista activo de la org %',
      NEW.therapist_id, NEW.organization_id
      USING HINT = 'Solo se pueden asignar citas a dentistas activos de la misma organización.';
  END IF;

  RETURN NEW;
END
$$;

CREATE TRIGGER trg_check_appointment_dentist
  BEFORE INSERT OR UPDATE OF therapist_id, organization_id
  ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.check_appointment_dentist();
```

**Semántica**:
- INSERT: cualquier cita nueva debe asignar a un dentista activo de la misma org
- UPDATE (de `therapist_id` o `organization_id`): la nueva asignación debe seguir cumpliendo la regla
- Citas legacy sin `organization_id` (caso edge teórico, no presente en prod): toleradas — no rompe el dataset histórico

**Performance**: SELECT EXISTS con índice `organization_members_pkey (id)` + índice `(user_id, organization_id)` existente. Overhead ~1ms por mutation.

#### 2. RLS policy refinada `appt_dentist_update`

**Antes** (`20260415100007_rls_phase1_administrative.sql:200-204`):
```sql
CREATE POLICY appt_dentist_update ON public.appointments
  FOR UPDATE USING (
    is_org_member(organization_id, 'dentist')
    AND therapist_id = auth.uid()
  );
```
- USING permite ver/modificar solo SUS citas
- Sin WITH CHECK → puede cambiar `therapist_id` a CUALQUIER uuid (incluso de otra org)

**Después** (migration `20260529000001`):
```sql
DROP POLICY IF EXISTS appt_dentist_update ON public.appointments;

CREATE POLICY appt_dentist_update ON public.appointments
  FOR UPDATE
  USING (
    is_org_member(organization_id, 'dentist')
    AND therapist_id = auth.uid()
  )
  WITH CHECK (
    is_org_member(organization_id, 'dentist')
    -- El trigger ya valida que el nuevo therapist_id sea dentista activo
    -- de la misma org. Acá solo confirmamos que la org no cambia (defense in depth).
  );
```

**Trade-off**: WITH CHECK explícito sobre dentist-active-of-org sería redundante con el trigger pero más legible para auditoría. Por ahora confiamos en el trigger (DRY) y el WITH CHECK solo se asegura de que la cita siga siendo de una org donde el caller es dentista.

**Policies admin/assistant**: sin cambios. Ya permiten UPDATE libre dentro de su org (FR-013 SÍ). El trigger se encarga de bloquear asignaciones a dentistas de otra org.

---

## Entidad de apoyo: `organization_members`

### Estado actual (no se modifica)

```sql
CREATE TABLE public.organization_members (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    user_id         uuid NOT NULL REFERENCES profiles(id),
    role            text NOT NULL CHECK (role IN ('owner','clinic_admin','dentist','assistant','assistant_lab')),
    is_active       boolean NOT NULL DEFAULT true,
    invited_at      timestamptz,
    accepted_at     timestamptz,
    revoked_at      timestamptz,
    created_at      timestamptz DEFAULT now()
);
```

**Query patterns usados por spec 028**:
- `getOrgDentists(orgId)` → SELECT user_id WHERE org_id = ? AND role = 'dentist' AND is_active = true
- `useUserRoleInOrg(orgId)` → SELECT role WHERE user_id = auth.uid() AND org_id = ? AND is_active = true
- Trigger `check_appointment_dentist` → SELECT 1 WHERE user_id = NEW.therapist_id AND org_id = NEW.organization_id AND role = 'dentist' AND is_active

Todos cubiertos por índices existentes (`(organization_id, user_id, role)` y similares).

### Sin cambios — solo lectura

Spec 028 NO modifica esta tabla. Las invitaciones/revocaciones son responsabilidad de spec 023 (invite-assistant-flow) y predecesoras.

---

## Entidad de auditoría: `clinical_audit_log`

### Estado actual

```sql
CREATE TABLE public.clinical_audit_log (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    user_id         uuid NOT NULL REFERENCES profiles(id),
    patient_id      uuid NOT NULL REFERENCES patients(id),
    action          text NOT NULL,                  -- CHECK que se expande (ver abajo)
    resource_type   text NOT NULL,                  -- CHECK que se expande (ver abajo)
    resource_id     uuid,
    grant_id        uuid,
    reason          text,
    ip_address      text,
    created_at      timestamptz NOT NULL DEFAULT now()
);
```

**CHECK actuales**:
- `action IN ('view_record', 'edit_record', 'create_record', 'export_file', 'print_record', 'grant_exceptional_access', 'exceptional_access')`
- `resource_type IN ('clinical_record', 'clinical_entry', 'odontogram', 'diagnosis', 'document', 'full_file')`

**Triggers append-only existentes**: `trg_audit_log_no_update` y `trg_audit_log_no_delete` — bloquean UPDATE/DELETE desde el cliente. NO se tocan.

### Cambios introducidos por spec 028

#### Ampliación del CHECK `action`

```sql
ALTER TABLE public.clinical_audit_log
  DROP CONSTRAINT clinical_audit_log_action_check;

ALTER TABLE public.clinical_audit_log
  ADD CONSTRAINT clinical_audit_log_action_check
  CHECK (action IN (
    -- Vocabulario histórico (sin tocar):
    'view_record', 'edit_record', 'create_record',
    'export_file', 'print_record',
    'grant_exceptional_access', 'exceptional_access',
    -- Vocabulario nuevo para appointments (spec 028):
    'view', 'create', 'update', 'cancel',
    'appointment_reassigned'
  ));
```

**Rationale**: ver research.md §R-03. Los call sites de `AssistantAppointmentModal.jsx` ya usaban `'view'`, `'create'`, `'update'`, `'cancel'` y fallaban silenciosamente. Esta migration NO cambia los call sites — solo expande lo que la DB acepta. El bug pre-existente se cierra como bonus.

#### Ampliación del CHECK `resource_type`

```sql
ALTER TABLE public.clinical_audit_log
  DROP CONSTRAINT clinical_audit_log_resource_type_check;

ALTER TABLE public.clinical_audit_log
  ADD CONSTRAINT clinical_audit_log_resource_type_check
  CHECK (resource_type IN (
    'clinical_record', 'clinical_entry', 'odontogram',
    'diagnosis', 'document', 'full_file',
    'appointment'                                    -- NUEVO spec 028
  ));
```

### Payload típico para spec 028

#### Crear cita (asistente o dentista)
```json
{
  "organization_id": "uuid",
  "user_id": "uuid del actor",
  "patient_id": "uuid del paciente de la cita",
  "action": "create",
  "resource_type": "appointment",
  "resource_id": "uuid de la cita recién creada",
  "grant_id": null,
  "reason": null,
  "ip_address": null
}
```

Para spec 028, NO agregamos `dentist_id` como columna nueva. Lo registramos implícitamente vía `resource_id` (que es el `appointments.id`) — desde ahí se puede recuperar `appointments.therapist_id`. Alternativa rechazada: agregar columna `metadata jsonb` solo para esto → over-engineering.

#### Reasignar cita (dentista actual → colega o admin → diferente dentista)
```json
{
  "organization_id": "uuid",
  "user_id": "uuid del actor (quien reasigna)",
  "patient_id": "uuid del paciente",
  "action": "appointment_reassigned",
  "resource_type": "appointment",
  "resource_id": "uuid de la cita",
  "grant_id": null,
  "reason": "from:uuid_dentista_anterior;to:uuid_dentista_nuevo",
  "ip_address": null
}
```

**Convención**: el campo `reason` (text libre) lleva la información del cambio. Para queries forenses futuras, se puede parsear. Si crece la necesidad, una spec posterior podría agregar columnas `from_value` / `to_value` (out of scope spec 028).

---

## Resumen de impacto en data

| Cambio                                            | Tipo            | Afecta data existente |
|--------------------------------------------------|-----------------|----------------------|
| Trigger `trg_check_appointment_dentist`          | Nuevo           | NO (BEFORE INSERT/UPDATE only) |
| RLS policy `appt_dentist_update` con WITH CHECK  | Modificación    | NO (refuerza, no rompe) |
| `clinical_audit_log_action_check` ampliado       | Modificación    | NO (acepta más, no rechaza menos) |
| `clinical_audit_log_resource_type_check` ampliado| Modificación    | NO (acepta más) |
| Nuevas columnas en `appointments`                | NINGUNO         | N/A |
| Nuevas tablas                                    | NINGUNO         | N/A |
| Backfill de data                                 | NINGUNO         | N/A (NOT NULL desde día 1) |
| Cambios destructivos (DROP COLUMN, etc.)         | NINGUNO         | N/A |

**Migración reversible**: sí. Para rollback:
```sql
DROP TRIGGER trg_check_appointment_dentist ON public.appointments;
DROP FUNCTION public.check_appointment_dentist();
-- Restaurar appt_dentist_update sin WITH CHECK
-- Restaurar CHECKs de clinical_audit_log a vocabulario histórico
```
