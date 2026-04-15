-- ============================================================
-- FASE 1 — PASO 1: Modelo de organización, equipo tratante,
--                   separación clínica y compliance
--
-- Solo crea tablas nuevas y vista. No modifica tablas legacy.
-- No migra datos. No agrega organization_id a tablas existentes.
--
-- NOTA: La tabla patients actual NO tiene full_name, rut, phone, etc.
-- Esos datos viven en profiles (vía patients.profile_id → profiles.id).
-- La vista patients_admin_view hace JOIN a profiles.
-- organization_id no existe aún en patients — se agrega en Paso 2.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. organizations
-- Tenant principal. Clínica o consultorio individual.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('clinic', 'solo_practice')),
    legal_entity_type text NOT NULL CHECK (legal_entity_type IN ('persona_natural', 'persona_juridica')),
    legal_name text NOT NULL,
    legal_rut text,
    legal_representative_name text,
    legal_representative_rut text,
    address text,
    phone text,
    email text,
    website text,
    is_active boolean NOT NULL DEFAULT true,
    settings jsonb NOT NULL DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_organizations_type ON public.organizations (type);
CREATE INDEX IF NOT EXISTS idx_organizations_legal_rut ON public.organizations (legal_rut) WHERE legal_rut IS NOT NULL;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────
-- 2. organization_members
-- Membresía con rol contextual por organización.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organization_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('clinic_admin', 'dentist', 'assistant')),
    is_active boolean NOT NULL DEFAULT true,
    joined_at timestamp with time zone NOT NULL DEFAULT now(),
    deactivated_at timestamp with time zone,
    invited_by uuid REFERENCES public.profiles(id),
    UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_active ON public.organization_members (organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members (user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_role ON public.organization_members (organization_id, role) WHERE is_active = true;

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────
-- 3. patient_clinical_record
-- Datos clínicos sensibles del paciente. Relación 1:1 con patients.
-- Separada de patients para enforcement de acceso por capa.
--
-- organization_id es independiente aquí: se poblará en Paso 3.
-- No tiene constraint cruzado con patients.organization_id
-- porque patients aún no tiene esa columna.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patient_clinical_record (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL UNIQUE REFERENCES public.patients(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES public.organizations(id),
    consultation_reason text,
    allergies text,
    medications text,
    systemic_diseases text,
    surgical_history text,
    pregnancy text,
    clinical_alerts text,
    medical_history text,
    blood_type text,
    other_clinical_info text,
    last_updated_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_pcr_org ON public.patient_clinical_record (organization_id);

ALTER TABLE public.patient_clinical_record ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────
-- 4. patient_care_team
-- Equipo tratante del paciente. Define acceso clínico.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patient_care_team (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    dentist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES public.organizations(id),
    role text NOT NULL CHECK (role IN ('primary', 'specialist', 'consultant')),
    specialty text,
    is_active boolean NOT NULL DEFAULT true,
    assigned_at timestamp with time zone NOT NULL DEFAULT now(),
    deactivated_at timestamp with time zone,
    assigned_by uuid REFERENCES public.profiles(id),
    deactivation_reason text
);

-- Exactamente 1 primary activo por paciente
CREATE UNIQUE INDEX IF NOT EXISTS idx_pct_unique_primary
    ON public.patient_care_team (patient_id)
    WHERE role = 'primary' AND is_active = true;

-- Un dentista no puede estar duplicado activo en el mismo equipo
CREATE UNIQUE INDEX IF NOT EXISTS idx_pct_unique_dentist_active
    ON public.patient_care_team (patient_id, dentist_id)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_pct_patient_active ON public.patient_care_team (patient_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pct_dentist_active ON public.patient_care_team (dentist_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pct_org ON public.patient_care_team (organization_id);

ALTER TABLE public.patient_care_team ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────
-- 5. processing_lawful_basis
-- Base jurídica del tratamiento de datos del paciente.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.processing_lawful_basis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id),
    patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    basis_type text NOT NULL CHECK (basis_type IN ('health_protection', 'legal_obligation', 'contract_execution', 'explicit_consent')),
    scope text NOT NULL,
    legal_reference text,
    is_active boolean NOT NULL DEFAULT true,
    established_at timestamp with time zone NOT NULL DEFAULT now(),
    terminated_at timestamp with time zone,
    notes text
);

CREATE INDEX IF NOT EXISTS idx_plb_patient_active ON public.processing_lawful_basis (patient_id, is_active);
CREATE INDEX IF NOT EXISTS idx_plb_org ON public.processing_lawful_basis (organization_id);

ALTER TABLE public.processing_lawful_basis ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────
-- 6. clinical_audit_log
-- Registro inmutable de accesos y modificaciones a datos clínicos.
-- Append-only: no se permite UPDATE ni DELETE.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clinical_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id),
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    patient_id uuid NOT NULL REFERENCES public.patients(id),
    action text NOT NULL CHECK (action IN (
        'view_record', 'edit_record', 'create_record',
        'export_file', 'print_record',
        'grant_exceptional_access', 'exceptional_access'
    )),
    resource_type text NOT NULL CHECK (resource_type IN (
        'clinical_record', 'clinical_entry', 'odontogram',
        'diagnosis', 'document', 'full_file'
    )),
    resource_id uuid,
    grant_id uuid,
    reason text,
    ip_address text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cal_patient_date ON public.clinical_audit_log (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cal_user_date ON public.clinical_audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cal_org_date ON public.clinical_audit_log (organization_id, created_at DESC);

ALTER TABLE public.clinical_audit_log ENABLE ROW LEVEL SECURITY;

-- Trigger: bloquear UPDATE y DELETE (append-only)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'clinical_audit_log is append-only. UPDATE and DELETE are not permitted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_no_update ON public.clinical_audit_log;
CREATE TRIGGER trg_audit_log_no_update
    BEFORE UPDATE ON public.clinical_audit_log
    FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

DROP TRIGGER IF EXISTS trg_audit_log_no_delete ON public.clinical_audit_log;
CREATE TRIGGER trg_audit_log_no_delete
    BEFORE DELETE ON public.clinical_audit_log
    FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- ──────────────────────────────────────────────────────────────
-- 7. exceptional_access_grants
-- Grants temporales para clinic_admin que no es dentista.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exceptional_access_grants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id),
    patient_id uuid NOT NULL REFERENCES public.patients(id),
    granted_to uuid NOT NULL REFERENCES public.profiles(id),
    granted_by uuid NOT NULL REFERENCES public.profiles(id),
    reason text NOT NULL CHECK (reason <> ''),
    legal_basis text,
    scope text NOT NULL CHECK (scope IN ('full_record', 'clinical_summary', 'specific_document')),
    resource_id uuid,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    granted_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    revoked_by uuid REFERENCES public.profiles(id),
    revocation_reason text,
    CONSTRAINT eag_expires_after_granted CHECK (expires_at > granted_at)
);

-- Solo 1 grant activo por persona por paciente
CREATE UNIQUE INDEX IF NOT EXISTS idx_eag_unique_active
    ON public.exceptional_access_grants (patient_id, granted_to)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_eag_active_grants ON public.exceptional_access_grants (granted_to, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_eag_patient_status ON public.exceptional_access_grants (patient_id, status);

ALTER TABLE public.exceptional_access_grants ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────
-- 8. patients_admin_view
-- Vista administrativa del paciente para assistant.
-- Hace JOIN a profiles para obtener datos de identidad.
-- Excluye datos clínicos (viven en patient_clinical_record).
-- security_invoker = true para que RLS del usuario aplique.
--
-- NOTA: No incluye organization_id porque patients aún no lo tiene.
-- Se recreará en Paso 2 cuando se agregue organization_id a patients.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.patients_admin_view
WITH (security_invoker = true)
AS
SELECT
    p.id,
    p.clinic_id,
    pr.full_name,
    pr.rut,
    pr.birthdate,
    pr.gender,
    pr.phone,
    pr.email,
    p.address,
    p.patient_type,
    p.emergency_contact_name,
    p.emergency_contact_phone,
    p.responsible_name,
    p.responsible_rut,
    p.status,
    p.admission_date,
    p.discharge_date,
    p.created_at
FROM public.patients p
LEFT JOIN public.profiles pr ON pr.id = p.profile_id;

-- ──────────────────────────────────────────────────────────────
-- FK for clinical_audit_log.grant_id (deferred to avoid ordering issues)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.clinical_audit_log
    ADD CONSTRAINT fk_cal_grant
    FOREIGN KEY (grant_id) REFERENCES public.exceptional_access_grants(id);
