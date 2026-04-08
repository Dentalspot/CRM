-- Fix: patients_view_own_clinical_history policy compares patient_id (patients.id)
-- with auth.uid() (profile_id), which are DIFFERENT UUIDs.
-- Patients could never see their own clinical history entries.

DROP POLICY IF EXISTS patients_view_own_clinical_history ON public.clinical_history;

CREATE POLICY patients_view_own_clinical_history
ON public.clinical_history
FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT id FROM patients WHERE profile_id = auth.uid()
  )
);
