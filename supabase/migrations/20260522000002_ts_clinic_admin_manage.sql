-- ============================================================
-- Feature: gestión de especialidades por clinic_admin
-- ============================================================
-- Hoy las policies de therapist_specialties solo permiten al PROPIO
-- dentista (therapist_id = auth.uid()) gestionar sus especialidades.
-- Esto bloquea el caso de uso "clinic_admin asigna especialidades a
-- los dentistas de su clínica" desde el modal de Gestión de Personal.
--
-- Fix: nueva policy ts_clinic_admin_manage que permite al clinic_admin
-- hacer INSERT/UPDATE/DELETE/SELECT en therapist_specialties cuando el
-- dentista (therapist_id) es member activo de la misma organización.
--
-- Las policies existentes (Therapists can * their own specialties) se
-- mantienen — el dentista también puede gestionar sus propias
-- especialidades desde su perfil.
--
-- Usado por: src/components/clinic/TherapistManagementModal.jsx
-- ============================================================

CREATE POLICY "ts_clinic_admin_manage" ON "public"."therapist_specialties"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om_target
      JOIN public.organization_members om_admin
        ON om_admin.organization_id = om_target.organization_id
      WHERE om_target.user_id = therapist_specialties.therapist_id
        AND om_target.role = 'dentist'
        AND om_target.is_active = true
        AND om_admin.user_id = auth.uid()
        AND om_admin.role = 'clinic_admin'
        AND om_admin.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.organization_members om_target
      JOIN public.organization_members om_admin
        ON om_admin.organization_id = om_target.organization_id
      WHERE om_target.user_id = therapist_specialties.therapist_id
        AND om_target.role = 'dentist'
        AND om_target.is_active = true
        AND om_admin.user_id = auth.uid()
        AND om_admin.role = 'clinic_admin'
        AND om_admin.is_active = true
    )
  );

COMMENT ON POLICY "ts_clinic_admin_manage" ON "public"."therapist_specialties"
  IS 'El clinic_admin puede gestionar (insert/update/delete/select) las especialidades de dentistas que son members activos de su organización. Coexiste con las policies del dentista sobre sus propias rows.';
