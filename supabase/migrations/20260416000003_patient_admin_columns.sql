-- ============================================================
-- Micro-fix V1: Agregar columnas admin a patients
--
-- patients pasa a ser fuente principal de nombre/contacto
-- profiles es fallback para pacientes con cuenta
-- Necesario para que assistant pueda crear pacientes sin profile_id
-- ============================================================

-- 1. Agregar columnas
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS rut text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS email text;

-- 2. Backfill: copiar desde profiles donde patients no tenga datos
UPDATE public.patients p
SET
  full_name = COALESCE(p.full_name, pr.full_name),
  rut = COALESCE(p.rut, pr.rut),
  phone = COALESCE(p.phone, pr.phone),
  email = COALESCE(p.email, pr.email)
FROM public.profiles pr
WHERE p.profile_id = pr.id;

-- 3. Recrear patients_admin_view
--    patients es fuente principal, profiles es fallback
DROP VIEW IF EXISTS public.patients_admin_view;

CREATE VIEW public.patients_admin_view
WITH (security_invoker = true)
AS
SELECT
    p.id,
    p.organization_id,
    p.clinic_id,
    COALESCE(p.full_name, pr.full_name) AS full_name,
    COALESCE(p.rut, pr.rut) AS rut,
    COALESCE(p.phone, pr.phone) AS phone,
    COALESCE(p.email, pr.email) AS email,
    pr.birthdate,
    pr.gender,
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
