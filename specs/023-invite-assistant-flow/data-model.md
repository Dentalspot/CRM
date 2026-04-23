# Phase 1 Data Model: Invite Assistant Flow

**Feature**: 023-invite-assistant-flow
**Migration file**: `supabase/migrations/20260423000002_invite_assistant_flow.sql` (NEW)
**Depends on**: `20260423000001_add_assistant_lab_to_user_role.sql` (✅ applied)

---

## 1. Tables

### 1.1 `clinics` (EXTEND)

**Change**: Añadir columna `organization_id` FK a `organizations`.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| ... (existing columns unchanged) | | | | |
| `organization_id` (**NEW**) | `uuid` | YES (nullable during backfill) | NULL | FK `organizations(id)` ON DELETE SET NULL |

**Backfill**: para clínicas existentes sin organization_id, crear 1 organización por clínica con `type='clinic'`, `legal_entity_type='persona_natural'`, `legal_name=clinic.name`, luego UPDATE match por name. Ver research.md §R-01.

**Trigger**: `trg_auto_org_for_clinic` (BEFORE INSERT) auto-crea organización para clínicas nuevas.

---

### 1.2 `organizations` (NO CHANGES)

Tabla existente. Campos clave:
- `id` (uuid PK), `name`, `type` ('clinic' | 'solo_practice'), `legal_entity_type`, `legal_name`, `is_active`.

---

### 1.3 `organization_members` (NO CHANGES)

Tabla existente. Campos clave:
- `id` (uuid PK)
- `organization_id` (uuid FK → organizations)
- `user_id` (uuid, el asistente)
- `role` (text, CHECK IN ['clinic_admin', 'dentist', 'assistant'])
- `is_active` (bool, default true)
- `joined_at` (timestamptz)
- `deactivated_at` (timestamptz, nullable)
- `invited_by` (uuid nullable, el admin que invitó)

**Usage en este spec**:
- Asistente aceptando invitación → INSERT con role='assistant', is_active=true
- Admin revocando → UPDATE SET is_active=false, deactivated_at=NOW()
- Asistente reactivado → UPDATE SET is_active=true, deactivated_at=null

---

### 1.4 `clinic_invitations` (EXTEND)

**Change**: Añadir 3 columnas para soportar role + expiración + flag existing_patient.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| ... (existing columns unchanged) | | | | |
| `role` (**NEW**) | `text` | NO | `'therapist'` | CHECK IN ('therapist', 'assistant') |
| `expires_at` (**NEW**) | `timestamptz` | YES | NULL | null = no expiration (invitaciones therapist legacy). Asistentes siempre tienen valor. |
| `existing_patient` (**NEW**) | `bool` | NO | false | true si al crear invitación ya había cuenta de paciente con ese email |

**CHECK constraint nuevo**:
```sql
CONSTRAINT clinic_invitations_role_check CHECK (role IN ('therapist', 'assistant'))
```

**Index nuevo**:
```sql
CREATE INDEX idx_clinic_invitations_role_status ON clinic_invitations (clinic_id, role, status);
```

**Backward compat**: default `role='therapist'` preserva invitaciones existentes. `expires_at` nullable para legacy rows.

---

### 1.5 `clinic_therapists` (NO CHANGES)

Tabla existente usada para relación dentista↔clínica. NO se toca en este spec — sigue siendo el flujo para therapist invitations.

---

### 1.6 `clinical_audit_log` (NO CHANGES — existing)

Tabla existente. Asistente accediendo a datos clínicos (si alguna regresión futura los habilita) → logged vía `useClinicalAccessLogger` hook. MVP actual: asistente NO accede a clinical records (FR-022), así que no se espera log volume significativo.

---

## 2. Helper Functions (SQL)

### 2.1 `is_in_clinic_as_assistant(p_user_id, p_clinic_id)` (NEW)

**Purpose**: simplifica policies RLS para verificar si `auth.uid()` es asistente activo en una clínica específica.

**Signature**:
```sql
CREATE OR REPLACE FUNCTION public.is_in_clinic_as_assistant(
  p_user_id uuid,
  p_clinic_id uuid
) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT organization_id INTO v_org_id FROM public.clinics WHERE id = p_clinic_id;
  IF v_org_id IS NULL THEN RETURN false; END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = p_user_id
      AND organization_id = v_org_id
      AND role = 'assistant'
      AND is_active = true
  );
END $$;

GRANT EXECUTE ON FUNCTION public.is_in_clinic_as_assistant(uuid, uuid) TO authenticated;
```

**Usage**: en policies RLS de patients, appointments, etc.

**Why SECURITY DEFINER**: para que la función pueda leer `organization_members` sin estar gateada por la policy de ese mismo recurso (evita recursión).

---

### 2.2 `auto_create_organization_for_clinic()` (NEW TRIGGER FUNCTION)

**Purpose**: auto-crear organization row cuando se inserta una clínica nueva.

**Signature**:
```sql
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

**Side effect**: admin de clínica queda sin row en `organization_members` inmediatamente post-signup. **Decisión MVP**: crear ese row también en el trigger (con role='clinic_admin') para evitar un paso manual. Alternativa: edge function separada. MVP elige trigger por simplicidad.

**Extended trigger** para cubrir esto:
```sql
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

    -- Auto-register clinic owner as clinic_admin en organization_members
    IF NEW.therapist_id IS NOT NULL THEN
      INSERT INTO public.organization_members (organization_id, user_id, role, is_active)
      VALUES (v_org_id, NEW.therapist_id, 'clinic_admin', true)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END $$;
```

---

## 3. RLS Policies

### 3.1 `patients`: asistente puede SELECT (listado básico)

```sql
CREATE POLICY "assistant_read_clinic_patients" ON public.patients
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_patients cp
      WHERE cp.patient_id = patients.id
        AND public.is_in_clinic_as_assistant(auth.uid(), cp.clinic_id)
    )
  );
```

**Note**: policy es ADITIVA a las existentes (propietario, care_team). Un asistente ve pacientes de su clínica vía esta policy; el propietario/terapeuta los sigue viendo vía las policies existentes.

**Assumption**: existe tabla `clinic_patients` o equivalente que relaciona pacientes con clínica. Si no existe, este spec lo identifica como issue en R-05 fallback — usar `patients.organization_id` si ese campo existe.

### 3.2 `appointments`: asistente puede CRUD

```sql
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
```

### 3.3 `clinical_records`, `treatments`, `odontograms`, etc.: NO policy adicional

**Rationale**: policies existing requieren ser terapeuta del paciente o estar en care_team. Asistente no es terapeuta → DENY implícito.

**Enforcement verifiable**: Acceptance Scenario US3-3 y US3-4 validan que intentos directos (URL, API) retornan vacío/error.

### 3.4 `subscription_payments`, `therapist_subscriptions`, `membership_plans`: NO policy adicional

**Rationale**: mismo principio — policies existing no permiten asistente → DENY implícito.

### 3.5 `clinic_invitations`: asistente NO necesita ver (solo admin)

Policies existing del admin no se tocan. Asistente no accede a su propia invitación post-acceptance (está aceptada).

### 3.6 `organization_members`: policies existentes

Asistente PUEDE SELECT su propio row (para que `RoleLandingRedirect` funcione). Admin de clínica PUEDE SELECT rows donde `organization_id` = su org.

**Verificar policies actuales, agregar si falta**:
```sql
CREATE POLICY IF NOT EXISTS "self_read_own_memberships" ON public.organization_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "clinic_admin_read_clinic_members" ON public.organization_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members self
      WHERE self.organization_id = organization_members.organization_id
        AND self.user_id = auth.uid()
        AND self.role = 'clinic_admin'
        AND self.is_active = true
    )
  );
```

---

## 4. Entity Relationship Diagram (ASCII)

```
┌──────────────────┐        ┌──────────────────────┐
│  organizations   │◄───┐   │   organization_      │
│  (existing)      │    │   │   members            │
│  id              │    │   │  (existing)          │
│  name            │    │   │  id                  │
│  type            │    └───┤  organization_id (FK)│
│  ...             │        │  user_id (FK)        │
└──────────────────┘        │  role (text)         │
       ▲                    │    assistant|        │
       │ FK (NEW)           │    clinic_admin|     │
       │ nullable           │    dentist           │
       │                    │  is_active           │
┌──────────────────┐        │  joined_at           │
│  clinics         │        │  deactivated_at      │
│  (existing)      │        │  invited_by (FK)     │
│  id              │        └──────────────────────┘
│  name            │                  ▲
│  therapist_id    │                  │ invited_by
│  organization_id │                  │ (fulfilled by
│  (NEW column)    │                  │  accepted inv)
│  ...             │        ┌─────────┴────────────┐
└──────────────────┘        │  clinic_invitations  │
       ▲                    │  (existing, EXTEND)  │
       │                    │  id                  │
       │ FK clinic_id       │  clinic_id (FK)      │
       │                    │  email               │
       └────────────────────┤  token               │
                            │  message             │
                            │  status              │
                            │  invited_by (FK)     │
                            │  role (NEW)          │
                            │  expires_at (NEW)    │
                            │  existing_patient    │
                            │     (NEW)            │
                            └──────────────────────┘
```

---

## 5. State Transitions — `clinic_invitations.status`

```
         create()
      ┌─────────────┐
      │   pending   │
      └──────┬──────┘
             │
    ┌────────┼──────────┬─────────┐
    │accept  │reject    │cancel   │expire (time)
    ▼        ▼          ▼         ▼
 accepted  rejected  cancelled  (expired via expires_at < NOW())
 (terminal)(terminal)(terminal)
```

**Note**: "expired" no es un status formal separado en el schema. Se calcula en runtime (`status='pending' AND expires_at < NOW()`). Queries que listan invitations deben filtrar esto lado cliente o agregar un status computed.

**Alternative considered**: añadir status='expired' explícito + cron que lo marque. **Rechazado**: sin pg_cron, cron externo requerido. MVP usa filter en queries.

---

## 6. State Transitions — `organization_members.is_active`

```
         INSERT (via accept)
      ┌──────────────────┐
      │ is_active=true   │
      └────────┬─────────┘
               │
      ┌────────┼────────┐
      │revoke  │ reactivate
      ▼        ▼
 is_active=false ◄──► is_active=true
 deactivated_at NOT NULL      deactivated_at NULL
```

**Reactivation FR-034**: si admin re-invita a un email que ya tiene un row `is_active=false`, el edge function UPDATE en vez de INSERT (detecta duplicate key en unique constraint si existe, o via lookup previo).

---

## 7. Validations Summary (SQL level)

- `organization_members.role CHECK IN ('clinic_admin', 'dentist', 'assistant')` — existing
- `clinic_invitations.role CHECK IN ('therapist', 'assistant')` — NEW
- `clinic_invitations.expires_at` para invitaciones de asistente siempre no null (enforced en edge function, no en schema — column nullable por backward compat)
- UNIQUE constraint implícito esperado en `organization_members (organization_id, user_id, role)` — verificar si existe, si no añadir. Para manejar re-invite sin duplicate.

**Verificar/agregar**:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_members_unique
  ON public.organization_members (organization_id, user_id, role)
  WHERE is_active = true;
```

---

## 8. Migration Order

Migration file: `supabase/migrations/20260423000002_invite_assistant_flow.sql`

Order of operations dentro del file:

1. Pre-check (DO block) — validar estado inicial
2. ALTER `clinics` ADD COLUMN `organization_id`
3. Backfill: crear organization rows para clínicas existentes + UPDATE clinics.organization_id
4. CREATE TRIGGER `trg_auto_org_for_clinic`
5. ALTER `clinic_invitations` ADD COLUMNS role + expires_at + existing_patient + CHECK constraint
6. CREATE INDEX on clinic_invitations
7. CREATE OR REPLACE FUNCTION `is_in_clinic_as_assistant`
8. CREATE POLICY `assistant_read_clinic_patients`
9. CREATE POLICY `assistant_crud_clinic_appointments`
10. CREATE UNIQUE INDEX `idx_org_members_unique` (si falta)
11. Post-check (DO block) — validar estado final

**Idempotency**: cada operación usa `IF NOT EXISTS` / `CREATE OR REPLACE` / `ON CONFLICT DO NOTHING` para que re-aplicación sea no-op.

**Reversibility**: forward-only. Downgrade documentado en comentarios de la migración (qué DROP ejecutar manualmente si hace falta rollback, advirtiendo sobre data loss).
