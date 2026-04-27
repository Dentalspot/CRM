-- ============================================================
-- Fix: patient_id debe apuntar a tabla patients, no profiles
-- ============================================================
-- En DENTALSPOT los pacientes viven en `patients` (con `profile_id`
-- como link opcional al auth user). El FK original apuntaba mal.
-- ============================================================

-- 1) Reemplazar FK
ALTER TABLE public.treatment_budgets
  DROP CONSTRAINT IF EXISTS treatment_budgets_patient_id_fkey;

ALTER TABLE public.treatment_budgets
  ADD CONSTRAINT treatment_budgets_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE RESTRICT;

-- 2) Helper SECURITY DEFINER: ¿este patient_id pertenece al auth user actual?
CREATE OR REPLACE FUNCTION public.is_my_patient_record(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patients
    WHERE id = p_patient_id
      AND profile_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_my_patient_record(uuid) TO authenticated;

-- 3) Reemplazar policy del paciente con el helper
DROP POLICY IF EXISTS budgets_patient_select ON public.treatment_budgets;

CREATE POLICY budgets_patient_select ON public.treatment_budgets
  FOR SELECT
  USING (public.is_my_patient_record(patient_id));
