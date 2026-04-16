-- ============================================================
-- Parte A: Fix patient_payment omitido de Cristobal Tagle
-- Paso 4 parcial: NOT NULL en tablas con 0 NULLs
--
-- NO toca: patients, clinical_history, odontograms, patient_payments
-- (bloqueadas por Danissa Klagges Romero en pending)
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- Parte A: Fix payment de Cristobal Tagle → Los Álamos
-- ──────────────────────────────────────────────────────────────
UPDATE public.patient_payments
SET organization_id = 'dd0f2b0f-eeba-4db1-bca8-77cfd6284e2c'
WHERE patient_id = '5ffc5695-9c98-4f33-9538-a80338215ea6'
  AND organization_id IS NULL;

-- ──────────────────────────────────────────────────────────────
-- Paso 4 parcial: SET NOT NULL en tablas listas
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.appointments
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.clinical_reports
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.patient_diagnoses
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.patient_documents
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.patient_evaluations
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.patient_assigned_plans
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.patient_goals
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.patient_private_notes
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.patient_activities
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.odontogram_evaluations
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.notiz_sessions
    ALTER COLUMN organization_id SET NOT NULL;
