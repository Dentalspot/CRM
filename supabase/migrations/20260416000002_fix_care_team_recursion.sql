-- ============================================================
-- Fix: recursión infinita en policy de patient_care_team
--
-- Reemplaza subquery inline por función SECURITY DEFINER
-- is_in_care_team() que ya existe y bypasea RLS.
-- ============================================================

DROP POLICY IF EXISTS pct_dentist_select ON public.patient_care_team;

CREATE POLICY pct_dentist_select ON public.patient_care_team
  FOR SELECT USING (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );
