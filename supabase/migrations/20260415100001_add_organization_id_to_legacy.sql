-- ============================================================
-- FASE 1 — PASO 2: Agregar organization_id a tablas legacy
--
-- Agrega organization_id como columna NULLABLE a todas las tablas
-- clínicas y de paciente relevantes. No pobla datos.
-- No cambia a NOT NULL. No elimina campos legacy.
-- No toca RLS. No toca frontend.
--
-- Se poblará en Paso 3 (migración de datos).
-- Se hará NOT NULL en Paso 4.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. patients
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.patients
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_patients_org
    ON public.patients (organization_id) WHERE organization_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 2. appointments
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_appointments_org
    ON public.appointments (organization_id) WHERE organization_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 3. clinical_history
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.clinical_history
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_clinical_history_org
    ON public.clinical_history (organization_id) WHERE organization_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 4. clinical_reports
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.clinical_reports
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_clinical_reports_org
    ON public.clinical_reports (organization_id) WHERE organization_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 5. patient_diagnoses
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.patient_diagnoses
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_org
    ON public.patient_diagnoses (organization_id) WHERE organization_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 6. patient_documents
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.patient_documents
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_patient_documents_org
    ON public.patient_documents (organization_id) WHERE organization_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 7. patient_evaluations
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.patient_evaluations
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_patient_evaluations_org
    ON public.patient_evaluations (organization_id) WHERE organization_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 8. patient_assigned_plans
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.patient_assigned_plans
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_patient_assigned_plans_org
    ON public.patient_assigned_plans (organization_id) WHERE organization_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 9. patient_goals
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.patient_goals
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_patient_goals_org
    ON public.patient_goals (organization_id) WHERE organization_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 10. patient_private_notes
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.patient_private_notes
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_patient_private_notes_org
    ON public.patient_private_notes (organization_id) WHERE organization_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 11. patient_activities
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.patient_activities
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_patient_activities_org
    ON public.patient_activities (organization_id) WHERE organization_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 12. patient_payments
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.patient_payments
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_patient_payments_org
    ON public.patient_payments (organization_id) WHERE organization_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 13. odontograms
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.odontograms
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_odontograms_org
    ON public.odontograms (organization_id) WHERE organization_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 14. odontogram_evaluations
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.odontogram_evaluations
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_odontogram_evaluations_org
    ON public.odontogram_evaluations (organization_id) WHERE organization_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 15. notiz_sessions
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.notiz_sessions
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_notiz_sessions_org
    ON public.notiz_sessions (organization_id) WHERE organization_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 16. Recrear patients_admin_view con organization_id
--
-- Ahora que patients tiene organization_id (nullable),
-- la vista puede incluirlo. Se hace DROP + CREATE porque
-- CREATE OR REPLACE no permite cambiar columnas de una vista.
-- ──────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.patients_admin_view;

CREATE VIEW public.patients_admin_view
WITH (security_invoker = true)
AS
SELECT
    p.id,
    p.organization_id,
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
