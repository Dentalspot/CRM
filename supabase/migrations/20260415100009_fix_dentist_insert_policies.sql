-- ============================================================
-- Fix: Restringir INSERT de dentist en tablas clínicas
--
-- Antes: solo org membership (demasiado amplio)
-- Después: org membership + care_team activo del paciente
-- Sin fallback legacy para INSERT
-- ============================================================

-- 1. clinical_history
DROP POLICY IF EXISTS ch_dentist_insert ON public.clinical_history;
CREATE POLICY ch_dentist_insert ON public.clinical_history
  FOR INSERT WITH CHECK (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );

-- 2. clinical_reports
DROP POLICY IF EXISTS cr_dentist_insert ON public.clinical_reports;
CREATE POLICY cr_dentist_insert ON public.clinical_reports
  FOR INSERT WITH CHECK (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );

-- 3. odontograms
DROP POLICY IF EXISTS og_dentist_insert ON public.odontograms;
CREATE POLICY og_dentist_insert ON public.odontograms
  FOR INSERT WITH CHECK (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );

-- 4. odontogram_evaluations
DROP POLICY IF EXISTS oe_dentist_insert ON public.odontogram_evaluations;
CREATE POLICY oe_dentist_insert ON public.odontogram_evaluations
  FOR INSERT WITH CHECK (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );

-- 5. patient_diagnoses
DROP POLICY IF EXISTS pd_dentist_insert ON public.patient_diagnoses;
CREATE POLICY pd_dentist_insert ON public.patient_diagnoses
  FOR INSERT WITH CHECK (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );

-- 6. patient_documents
DROP POLICY IF EXISTS pdoc_dentist_insert ON public.patient_documents;
CREATE POLICY pdoc_dentist_insert ON public.patient_documents
  FOR INSERT WITH CHECK (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );

-- 7. patient_assigned_plans
DROP POLICY IF EXISTS pap_dentist_insert ON public.patient_assigned_plans;
CREATE POLICY pap_dentist_insert ON public.patient_assigned_plans
  FOR INSERT WITH CHECK (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );
