-- ============================================================
-- FASE 2 RLS — Policies clínicas
--
-- Reglas:
--   - care_team es la regla principal
--   - fallback legacy (therapist_id) solo en SELECT, solo donde existe
--   - no hay fallback en INSERT ni UPDATE
--   - clinic_admin solo lectura con grant activo + no expirado
--   - patient_private_notes solo para el autor
--   - sin DELETE en tablas clínicas
--   - assistant y platform_admin sin acceso clínico
-- ============================================================

-- Helper: verificar exceptional_access_grant activo
CREATE OR REPLACE FUNCTION public.has_active_grant(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM exceptional_access_grants
    WHERE patient_id = p_patient_id
      AND granted_to = auth.uid()
      AND status = 'active'
      AND expires_at > now()
  );
$$;


-- ══════════════════════════════════════════════════════════════
-- 1. PATIENT_CLINICAL_RECORD (sin fallback — tabla nueva)
-- ══════════════════════════════════════════════════════════════

-- dentist: SELECT solo care_team
CREATE POLICY pcr_dentist_select ON public.patient_clinical_record
  FOR SELECT USING (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );

-- dentist: UPDATE solo care_team (sin fallback)
CREATE POLICY pcr_dentist_update ON public.patient_clinical_record
  FOR UPDATE USING (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );

-- clinic_admin: solo lectura con grant
CREATE POLICY pcr_admin_grant_select ON public.patient_clinical_record
  FOR SELECT USING (
    is_org_member(organization_id, 'clinic_admin')
    AND has_active_grant(patient_id)
  );

-- patient: solo los suyos
CREATE POLICY pcr_patient_select ON public.patient_clinical_record
  FOR SELECT USING (is_own_patient(patient_id));


-- ══════════════════════════════════════════════════════════════
-- 2. CLINICAL_HISTORY (con fallback SELECT)
-- ══════════════════════════════════════════════════════════════

-- Drop ALL legacy
DROP POLICY IF EXISTS "Admins can read clinical_history" ON public.clinical_history;
DROP POLICY IF EXISTS "Therapists can manage their own clinical history entries" ON public.clinical_history;
DROP POLICY IF EXISTS "admin_read_clinical_history" ON public.clinical_history;
DROP POLICY IF EXISTS "patients_view_own_clinical_history" ON public.clinical_history;
DROP POLICY IF EXISTS "therapists_insert_own_clinical_history" ON public.clinical_history;
DROP POLICY IF EXISTS "therapists_update_own_clinical_history" ON public.clinical_history;
DROP POLICY IF EXISTS "therapists_view_own_clinical_history" ON public.clinical_history;
DROP POLICY IF EXISTS "therapists_view_shared_patient_history" ON public.clinical_history;
DROP POLICY IF EXISTS "therapists_view_shared_patient_history_metadata" ON public.clinical_history;

-- dentist SELECT: care_team + fallback legacy
CREATE POLICY ch_dentist_select ON public.clinical_history
  FOR SELECT USING (
    is_org_member(organization_id, 'dentist')
    AND (is_in_care_team(patient_id) OR therapist_id = auth.uid())
  );

-- dentist INSERT: org membership (sin fallback)
CREATE POLICY ch_dentist_insert ON public.clinical_history
  FOR INSERT WITH CHECK (is_org_member(organization_id, 'dentist'));

-- dentist UPDATE: care_team estricto (sin fallback)
CREATE POLICY ch_dentist_update ON public.clinical_history
  FOR UPDATE USING (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );

-- clinic_admin: solo lectura con grant
CREATE POLICY ch_admin_grant_select ON public.clinical_history
  FOR SELECT USING (
    is_org_member(organization_id, 'clinic_admin')
    AND has_active_grant(patient_id)
  );

-- patient: solo los suyos
CREATE POLICY ch_patient_select ON public.clinical_history
  FOR SELECT USING (is_own_patient(patient_id));


-- ══════════════════════════════════════════════════════════════
-- 3. CLINICAL_REPORTS (con fallback SELECT, sin UPDATE)
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Patients can view own reports" ON public.clinical_reports;
DROP POLICY IF EXISTS "Therapists can manage own reports" ON public.clinical_reports;

CREATE POLICY cr_dentist_select ON public.clinical_reports
  FOR SELECT USING (
    is_org_member(organization_id, 'dentist')
    AND (is_in_care_team(patient_id) OR therapist_id = auth.uid())
  );

CREATE POLICY cr_dentist_insert ON public.clinical_reports
  FOR INSERT WITH CHECK (is_org_member(organization_id, 'dentist'));

CREATE POLICY cr_admin_grant_select ON public.clinical_reports
  FOR SELECT USING (
    is_org_member(organization_id, 'clinic_admin')
    AND has_active_grant(patient_id)
  );

CREATE POLICY cr_patient_select ON public.clinical_reports
  FOR SELECT USING (is_own_patient(patient_id));


-- ══════════════════════════════════════════════════════════════
-- 4. ODONTOGRAMS (con fallback SELECT, UPDATE sin fallback)
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "patient_odontograms_read" ON public.odontograms;
DROP POLICY IF EXISTS "therapist_odontograms_crud" ON public.odontograms;

CREATE POLICY og_dentist_select ON public.odontograms
  FOR SELECT USING (
    is_org_member(organization_id, 'dentist')
    AND (is_in_care_team(patient_id) OR therapist_id = auth.uid())
  );

CREATE POLICY og_dentist_insert ON public.odontograms
  FOR INSERT WITH CHECK (is_org_member(organization_id, 'dentist'));

CREATE POLICY og_dentist_update ON public.odontograms
  FOR UPDATE USING (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );

CREATE POLICY og_admin_grant_select ON public.odontograms
  FOR SELECT USING (
    is_org_member(organization_id, 'clinic_admin')
    AND has_active_grant(patient_id)
  );

CREATE POLICY og_patient_select ON public.odontograms
  FOR SELECT USING (is_own_patient(patient_id));


-- ══════════════════════════════════════════════════════════════
-- 5. ODONTOGRAM_EVALUATIONS (con fallback SELECT, UPDATE sin fallback)
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Therapists can manage own evaluations" ON public.odontogram_evaluations;

CREATE POLICY oe_dentist_select ON public.odontogram_evaluations
  FOR SELECT USING (
    is_org_member(organization_id, 'dentist')
    AND (is_in_care_team(patient_id) OR therapist_id = auth.uid())
  );

CREATE POLICY oe_dentist_insert ON public.odontogram_evaluations
  FOR INSERT WITH CHECK (is_org_member(organization_id, 'dentist'));

CREATE POLICY oe_dentist_update ON public.odontogram_evaluations
  FOR UPDATE USING (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );

CREATE POLICY oe_admin_grant_select ON public.odontogram_evaluations
  FOR SELECT USING (
    is_org_member(organization_id, 'clinic_admin')
    AND has_active_grant(patient_id)
  );

CREATE POLICY oe_patient_select ON public.odontogram_evaluations
  FOR SELECT USING (is_own_patient(patient_id));


-- ══════════════════════════════════════════════════════════════
-- 6. PATIENT_DIAGNOSES (con fallback SELECT, UPDATE sin fallback)
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Therapist can manage patient diagnoses" ON public.patient_diagnoses;

CREATE POLICY pd_dentist_select ON public.patient_diagnoses
  FOR SELECT USING (
    is_org_member(organization_id, 'dentist')
    AND (is_in_care_team(patient_id) OR therapist_id = auth.uid())
  );

CREATE POLICY pd_dentist_insert ON public.patient_diagnoses
  FOR INSERT WITH CHECK (is_org_member(organization_id, 'dentist'));

CREATE POLICY pd_dentist_update ON public.patient_diagnoses
  FOR UPDATE USING (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );

CREATE POLICY pd_admin_grant_select ON public.patient_diagnoses
  FOR SELECT USING (
    is_org_member(organization_id, 'clinic_admin')
    AND has_active_grant(patient_id)
  );

CREATE POLICY pd_patient_select ON public.patient_diagnoses
  FOR SELECT USING (is_own_patient(patient_id));


-- ══════════════════════════════════════════════════════════════
-- 7. PATIENT_DOCUMENTS (con fallback SELECT, sin UPDATE)
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Admins read all patient_documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Patients read own documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Therapists can manage their own patient documents" ON public.patient_documents;

CREATE POLICY pdoc_dentist_select ON public.patient_documents
  FOR SELECT USING (
    is_org_member(organization_id, 'dentist')
    AND (is_in_care_team(patient_id) OR therapist_id = auth.uid())
  );

CREATE POLICY pdoc_dentist_insert ON public.patient_documents
  FOR INSERT WITH CHECK (is_org_member(organization_id, 'dentist'));

CREATE POLICY pdoc_admin_grant_select ON public.patient_documents
  FOR SELECT USING (
    is_org_member(organization_id, 'clinic_admin')
    AND has_active_grant(patient_id)
  );

CREATE POLICY pdoc_patient_select ON public.patient_documents
  FOR SELECT USING (is_own_patient(patient_id));


-- ══════════════════════════════════════════════════════════════
-- 8. PATIENT_PRIVATE_NOTES (author-only, sin fallback)
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Therapists can manage notes for their own patients" ON public.patient_private_notes;

-- Solo el autor puede ver sus propias notas
CREATE POLICY ppn_author_select ON public.patient_private_notes
  FOR SELECT USING (
    is_org_member(organization_id, 'dentist')
    AND therapist_id = auth.uid()
  );

CREATE POLICY ppn_author_insert ON public.patient_private_notes
  FOR INSERT WITH CHECK (
    is_org_member(organization_id, 'dentist')
    AND therapist_id = auth.uid()
  );

CREATE POLICY ppn_author_update ON public.patient_private_notes
  FOR UPDATE USING (
    is_org_member(organization_id, 'dentist')
    AND therapist_id = auth.uid()
  );


-- ══════════════════════════════════════════════════════════════
-- 9. PATIENT_ASSIGNED_PLANS (con fallback SELECT, UPDATE sin fallback)
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Patients can view their assigned plans" ON public.patient_assigned_plans;
DROP POLICY IF EXISTS "Therapists can manage assigned plans" ON public.patient_assigned_plans;

CREATE POLICY pap_dentist_select ON public.patient_assigned_plans
  FOR SELECT USING (
    is_org_member(organization_id, 'dentist')
    AND (is_in_care_team(patient_id) OR therapist_id = auth.uid())
  );

CREATE POLICY pap_dentist_insert ON public.patient_assigned_plans
  FOR INSERT WITH CHECK (is_org_member(organization_id, 'dentist'));

CREATE POLICY pap_dentist_update ON public.patient_assigned_plans
  FOR UPDATE USING (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );

CREATE POLICY pap_admin_grant_select ON public.patient_assigned_plans
  FOR SELECT USING (
    is_org_member(organization_id, 'clinic_admin')
    AND has_active_grant(patient_id)
  );

CREATE POLICY pap_patient_select ON public.patient_assigned_plans
  FOR SELECT USING (is_own_patient(patient_id));


-- ══════════════════════════════════════════════════════════════
-- 10. PATIENT_CARE_TEAM (tabla nueva, sin fallback)
-- ══════════════════════════════════════════════════════════════

-- clinic_admin: ve y gestiona equipos de su org
CREATE POLICY pct_admin_select ON public.patient_care_team
  FOR SELECT USING (is_org_member(organization_id, 'clinic_admin'));

CREATE POLICY pct_admin_manage ON public.patient_care_team
  FOR INSERT WITH CHECK (is_org_member(organization_id, 'clinic_admin'));

CREATE POLICY pct_admin_update ON public.patient_care_team
  FOR UPDATE USING (is_org_member(organization_id, 'clinic_admin'));

-- dentist: ve el equipo completo de pacientes donde participa
CREATE POLICY pct_dentist_select ON public.patient_care_team
  FOR SELECT USING (
    is_org_member(organization_id, 'dentist')
    AND patient_id IN (
      SELECT pct2.patient_id FROM patient_care_team pct2
      WHERE pct2.dentist_id = auth.uid()
        AND pct2.is_active = true
    )
  );

-- patient: ve su propio equipo tratante
CREATE POLICY pct_patient_select ON public.patient_care_team
  FOR SELECT USING (is_own_patient(patient_id));
