-- ============================================================
-- FASE 3 RLS — Compliance, grants y auditoría
--
-- Reglas:
--   - clinical_audit_log: append-only, dentist INSERT solo care_team
--   - processing_lawful_basis: append-only, sin UPDATE ni DELETE
--   - exceptional_access_grants: clinic_admin gestiona solo su org
--   - migration_review_queue: platform_admin + clinic_admin (su org)
--   - patient_access_history_view: vista segura para pacientes
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- 1. CLINICAL_AUDIT_LOG
-- Append-only (triggers ya existen desde Paso 1)
-- ══════════════════════════════════════════════════════════════

-- dentist: INSERT solo para pacientes de su care_team
CREATE POLICY cal_dentist_insert ON public.clinical_audit_log
  FOR INSERT WITH CHECK (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );

-- clinic_admin: INSERT para eventos administrativos (grants, acceso excepcional)
CREATE POLICY cal_admin_insert ON public.clinical_audit_log
  FOR INSERT WITH CHECK (
    is_org_member(organization_id, 'clinic_admin')
  );

-- clinic_admin: SELECT de su org
CREATE POLICY cal_admin_select ON public.clinical_audit_log
  FOR SELECT USING (
    is_org_member(organization_id, 'clinic_admin')
  );

-- platform_admin: SELECT global
CREATE POLICY cal_platform_admin_select ON public.clinical_audit_log
  FOR SELECT USING (is_admin());


-- ══════════════════════════════════════════════════════════════
-- 2. PROCESSING_LAWFUL_BASIS
-- Append-only: sin UPDATE ni DELETE
-- ══════════════════════════════════════════════════════════════

-- Triggers append-only
CREATE OR REPLACE FUNCTION public.prevent_plb_modification()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'processing_lawful_basis is append-only. UPDATE and DELETE are not permitted. To terminate a basis, INSERT a new record with is_active = false.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_plb_no_update ON public.processing_lawful_basis;
CREATE TRIGGER trg_plb_no_update
    BEFORE UPDATE ON public.processing_lawful_basis
    FOR EACH ROW EXECUTE FUNCTION public.prevent_plb_modification();

DROP TRIGGER IF EXISTS trg_plb_no_delete ON public.processing_lawful_basis;
CREATE TRIGGER trg_plb_no_delete
    BEFORE DELETE ON public.processing_lawful_basis
    FOR EACH ROW EXECUTE FUNCTION public.prevent_plb_modification();

-- clinic_admin: SELECT de su org
CREATE POLICY plb_admin_select ON public.processing_lawful_basis
  FOR SELECT USING (
    is_org_member(organization_id, 'clinic_admin')
  );

-- clinic_admin: INSERT en su org (crear nuevas bases o terminar existentes)
CREATE POLICY plb_admin_insert ON public.processing_lawful_basis
  FOR INSERT WITH CHECK (
    is_org_member(organization_id, 'clinic_admin')
  );

-- dentist: SELECT solo pacientes de su care_team
CREATE POLICY plb_dentist_select ON public.processing_lawful_basis
  FOR SELECT USING (
    is_org_member(organization_id, 'dentist')
    AND is_in_care_team(patient_id)
  );

-- patient: SELECT solo los suyos
CREATE POLICY plb_patient_select ON public.processing_lawful_basis
  FOR SELECT USING (is_own_patient(patient_id));

-- platform_admin: SELECT global
CREATE POLICY plb_platform_admin_select ON public.processing_lawful_basis
  FOR SELECT USING (is_admin());


-- ══════════════════════════════════════════════════════════════
-- 3. EXCEPTIONAL_ACCESS_GRANTS
-- clinic_admin gestiona solo su org. Sin DELETE.
-- ══════════════════════════════════════════════════════════════

-- clinic_admin: SELECT de su org
CREATE POLICY eag_admin_select ON public.exceptional_access_grants
  FOR SELECT USING (
    is_org_member(organization_id, 'clinic_admin')
  );

-- clinic_admin: INSERT en su org (crear grants)
CREATE POLICY eag_admin_insert ON public.exceptional_access_grants
  FOR INSERT WITH CHECK (
    is_org_member(organization_id, 'clinic_admin')
  );

-- clinic_admin: UPDATE en su org (revocar grants)
CREATE POLICY eag_admin_update ON public.exceptional_access_grants
  FOR UPDATE USING (
    is_org_member(organization_id, 'clinic_admin')
  );

-- patient: SELECT solo los suyos (ve quién tiene acceso a su ficha)
CREATE POLICY eag_patient_select ON public.exceptional_access_grants
  FOR SELECT USING (is_own_patient(patient_id));

-- platform_admin: SELECT global
CREATE POLICY eag_platform_admin_select ON public.exceptional_access_grants
  FOR SELECT USING (is_admin());


-- ══════════════════════════════════════════════════════════════
-- 4. MIGRATION_REVIEW_QUEUE
-- platform_admin: acceso global
-- clinic_admin: solo su org (WHERE organization_id IS NOT NULL)
-- ══════════════════════════════════════════════════════════════

-- platform_admin: SELECT + UPDATE global (incluye casos con org NULL)
CREATE POLICY mrq_platform_admin_select ON public.migration_review_queue
  FOR SELECT USING (is_admin());

CREATE POLICY mrq_platform_admin_update ON public.migration_review_queue
  FOR UPDATE USING (is_admin());

-- clinic_admin: SELECT + UPDATE solo de su org
CREATE POLICY mrq_admin_select ON public.migration_review_queue
  FOR SELECT USING (
    organization_id IS NOT NULL
    AND is_org_member(organization_id, 'clinic_admin')
  );

CREATE POLICY mrq_admin_update ON public.migration_review_queue
  FOR UPDATE USING (
    organization_id IS NOT NULL
    AND is_org_member(organization_id, 'clinic_admin')
  );


-- ══════════════════════════════════════════════════════════════
-- 5. PATIENT_ACCESS_HISTORY_VIEW
-- Vista segura para pacientes.
-- security_definer: ejecuta como owner (bypasea RLS de clinical_audit_log).
-- security_barrier: previene optimización maliciosa que filtre datos.
-- Filtro interno por auth.uid() garantiza que el paciente ve solo lo suyo.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.patient_access_history_view
WITH (security_barrier = true)
AS
SELECT
    cal.patient_id,
    cal.action,
    cal.resource_type,
    p.full_name AS accessed_by_name,
    CASE
      WHEN cal.grant_id IS NOT NULL THEN 'Acceso excepcional'
      ELSE 'Equipo tratante'
    END AS access_context,
    cal.created_at AS accessed_at
FROM public.clinical_audit_log cal
JOIN public.profiles p ON p.id = cal.user_id
WHERE cal.patient_id IN (
    SELECT pat.id FROM public.patients pat
    WHERE pat.profile_id = auth.uid()
);

-- Cambiar owner a authenticator para que security_definer funcione
-- con los permisos correctos en Supabase
ALTER VIEW public.patient_access_history_view OWNER TO postgres;
