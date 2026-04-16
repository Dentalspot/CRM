-- ============================================================
-- FASE 1 RLS — Policies administrativas
--
-- Tablas: organizations, organization_members, patients,
--         appointments, patient_payments
--
-- DROP ALL legacy policies en patients/appointments/patient_payments
-- para evitar OR permisivo con policies viejas.
--
-- Incluye fallback temporal therapist_id para compatibilidad
-- mientras el frontend migra al modelo nuevo.
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- HELPER: función para verificar membresía
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid, p_role text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND is_active = true
      AND (p_role IS NULL OR role = p_role)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_in_care_team(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM patient_care_team
    WHERE patient_id = p_patient_id
      AND dentist_id = auth.uid()
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_own_patient(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM patients
    WHERE id = p_patient_id
      AND profile_id = auth.uid()
  );
$$;


-- ══════════════════════════════════════════════════════════════
-- 1. ORGANIZATIONS
-- ══════════════════════════════════════════════════════════════

CREATE POLICY org_member_select ON public.organizations
  FOR SELECT USING (is_org_member(id));

CREATE POLICY org_admin_update ON public.organizations
  FOR UPDATE USING (is_org_member(id, 'clinic_admin'));

CREATE POLICY org_platform_admin_select ON public.organizations
  FOR SELECT USING (is_admin());


-- ══════════════════════════════════════════════════════════════
-- 2. ORGANIZATION_MEMBERS
-- ══════════════════════════════════════════════════════════════

CREATE POLICY om_member_select ON public.organization_members
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY om_admin_insert ON public.organization_members
  FOR INSERT WITH CHECK (is_org_member(organization_id, 'clinic_admin'));

CREATE POLICY om_admin_update ON public.organization_members
  FOR UPDATE USING (is_org_member(organization_id, 'clinic_admin'));

CREATE POLICY om_platform_admin_select ON public.organization_members
  FOR SELECT USING (is_admin());


-- ══════════════════════════════════════════════════════════════
-- 3. PATIENTS — DROP legacy + CREATE new
-- ══════════════════════════════════════════════════════════════

-- Drop ALL legacy policies
DROP POLICY IF EXISTS "Admins can manage all patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can read all patients" ON public.patients;
DROP POLICY IF EXISTS "patient_own_record" ON public.patients;
DROP POLICY IF EXISTS "patient_select_own_patient_record" ON public.patients;
DROP POLICY IF EXISTS "patients_select_own_or_assigned" ON public.patients;
DROP POLICY IF EXISTS "patients_update_own" ON public.patients;
DROP POLICY IF EXISTS "therapist_delete_own_patients" ON public.patients;
DROP POLICY IF EXISTS "therapist_insert_own_patients" ON public.patients;
DROP POLICY IF EXISTS "therapist_own_patients" ON public.patients;
DROP POLICY IF EXISTS "therapist_select_own_patients" ON public.patients;
DROP POLICY IF EXISTS "therapist_update_own_patients" ON public.patients;

-- clinic_admin: full CRUD de su org
CREATE POLICY pat_admin_select ON public.patients
  FOR SELECT USING (is_org_member(organization_id, 'clinic_admin'));

CREATE POLICY pat_admin_insert ON public.patients
  FOR INSERT WITH CHECK (is_org_member(organization_id, 'clinic_admin'));

CREATE POLICY pat_admin_update ON public.patients
  FOR UPDATE USING (is_org_member(organization_id, 'clinic_admin'));

-- dentist: SELECT/UPDATE solo care_team + fallback legacy therapist_id
CREATE POLICY pat_dentist_select ON public.patients
  FOR SELECT USING (
    is_org_member(organization_id, 'dentist')
    AND (is_in_care_team(id) OR therapist_id = auth.uid())
  );

CREATE POLICY pat_dentist_insert ON public.patients
  FOR INSERT WITH CHECK (is_org_member(organization_id, 'dentist'));

CREATE POLICY pat_dentist_update ON public.patients
  FOR UPDATE USING (
    is_org_member(organization_id, 'dentist')
    AND (is_in_care_team(id) OR therapist_id = auth.uid())
  );

-- assistant: SELECT (para patients_admin_view), INSERT, UPDATE de su org
CREATE POLICY pat_assistant_select ON public.patients
  FOR SELECT USING (is_org_member(organization_id, 'assistant'));

CREATE POLICY pat_assistant_insert ON public.patients
  FOR INSERT WITH CHECK (is_org_member(organization_id, 'assistant'));

CREATE POLICY pat_assistant_update ON public.patients
  FOR UPDATE USING (is_org_member(organization_id, 'assistant'));

-- patient: solo los suyos
CREATE POLICY pat_patient_select ON public.patients
  FOR SELECT USING (profile_id = auth.uid());

-- platform_admin: lectura global
CREATE POLICY pat_platform_admin_select ON public.patients
  FOR SELECT USING (is_admin());


-- ══════════════════════════════════════════════════════════════
-- 4. APPOINTMENTS — DROP legacy + CREATE new
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Admins can read all appointments" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
DROP POLICY IF EXISTS "appt_patient_cancel" ON public.appointments;
DROP POLICY IF EXISTS "appt_patient_view_own" ON public.appointments;
DROP POLICY IF EXISTS "appt_therapist_update" ON public.appointments;
DROP POLICY IF EXISTS "appt_therapist_view_own" ON public.appointments;
DROP POLICY IF EXISTS "only_therapist_can_delete" ON public.appointments;
DROP POLICY IF EXISTS "patient_insert_appointments" ON public.appointments;
DROP POLICY IF EXISTS "patient_select_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "patients can see own appointments" ON public.appointments;
DROP POLICY IF EXISTS "therapist_and_patient_can_update_fixed" ON public.appointments;
DROP POLICY IF EXISTS "therapist_insert_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "therapist_select_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "therapist_update_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "therapists can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "therapists can update appointments" ON public.appointments;

-- clinic_admin: toda la org
CREATE POLICY appt_admin_select ON public.appointments
  FOR SELECT USING (is_org_member(organization_id, 'clinic_admin'));

CREATE POLICY appt_admin_insert ON public.appointments
  FOR INSERT WITH CHECK (is_org_member(organization_id, 'clinic_admin'));

CREATE POLICY appt_admin_update ON public.appointments
  FOR UPDATE USING (is_org_member(organization_id, 'clinic_admin'));

-- dentist: solo sus propias citas + fallback legacy
CREATE POLICY appt_dentist_select ON public.appointments
  FOR SELECT USING (
    is_org_member(organization_id, 'dentist')
    AND therapist_id = auth.uid()
  );

CREATE POLICY appt_dentist_insert ON public.appointments
  FOR INSERT WITH CHECK (
    is_org_member(organization_id, 'dentist')
    AND therapist_id = auth.uid()
  );

CREATE POLICY appt_dentist_update ON public.appointments
  FOR UPDATE USING (
    is_org_member(organization_id, 'dentist')
    AND therapist_id = auth.uid()
  );

-- assistant: toda la org (gestión de agenda)
CREATE POLICY appt_assistant_select ON public.appointments
  FOR SELECT USING (is_org_member(organization_id, 'assistant'));

CREATE POLICY appt_assistant_insert ON public.appointments
  FOR INSERT WITH CHECK (is_org_member(organization_id, 'assistant'));

CREATE POLICY appt_assistant_update ON public.appointments
  FOR UPDATE USING (is_org_member(organization_id, 'assistant'));

-- patient: solo sus propias citas
CREATE POLICY appt_patient_select ON public.appointments
  FOR SELECT USING (is_own_patient(patient_id));

-- platform_admin: lectura
CREATE POLICY appt_platform_admin_select ON public.appointments
  FOR SELECT USING (is_admin());


-- ══════════════════════════════════════════════════════════════
-- 5. PATIENT_PAYMENTS — DROP legacy + CREATE new
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Patients can view their own payments" ON public.patient_payments;
DROP POLICY IF EXISTS "Therapists can manage their patient payments" ON public.patient_payments;

-- clinic_admin: lectura + creación de su org
CREATE POLICY pp_admin_select ON public.patient_payments
  FOR SELECT USING (is_org_member(organization_id, 'clinic_admin'));

CREATE POLICY pp_admin_insert ON public.patient_payments
  FOR INSERT WITH CHECK (is_org_member(organization_id, 'clinic_admin'));

-- assistant: lectura + creación de su org (registra pagos)
CREATE POLICY pp_assistant_select ON public.patient_payments
  FOR SELECT USING (is_org_member(organization_id, 'assistant'));

CREATE POLICY pp_assistant_insert ON public.patient_payments
  FOR INSERT WITH CHECK (is_org_member(organization_id, 'assistant'));

-- dentist: lectura de pagos de su org (para ver estado en ficha)
-- Fallback temporal: therapist_id para compatibilidad
CREATE POLICY pp_dentist_select ON public.patient_payments
  FOR SELECT USING (
    is_org_member(organization_id, 'dentist')
    AND (is_in_care_team(patient_id) OR therapist_id = auth.uid())
  );

-- patient: solo sus propios pagos
CREATE POLICY pp_patient_select ON public.patient_payments
  FOR SELECT USING (is_own_patient(patient_id));

-- platform_admin: lectura
CREATE POLICY pp_platform_admin_select ON public.patient_payments
  FOR SELECT USING (is_admin());
