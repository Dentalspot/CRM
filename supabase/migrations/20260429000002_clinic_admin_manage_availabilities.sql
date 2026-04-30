-- ============================================================
-- RLS: clinic_admin puede gestionar horarios de dentistas
-- ============================================================
-- Contexto: la clínica admin necesita poder definir el horario
-- en que sus dentistas atienden en sus clínicas. Sin esta policy
-- solo el propio dentista puede editar su disponibilidad.
-- ============================================================

DROP POLICY IF EXISTS availabilities_clinic_admin_manage ON public.therapist_availabilities;

CREATE POLICY availabilities_clinic_admin_manage ON public.therapist_availabilities
  FOR ALL
  USING (
    clinic_id IN (
      SELECT c.id FROM public.clinics c
      WHERE c.organization_id IN (
        SELECT om.organization_id
        FROM public.organization_members om
        WHERE om.user_id = auth.uid()
          AND om.role = 'clinic_admin'
          AND om.is_active = true
      )
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT c.id FROM public.clinics c
      WHERE c.organization_id IN (
        SELECT om.organization_id
        FROM public.organization_members om
        WHERE om.user_id = auth.uid()
          AND om.role = 'clinic_admin'
          AND om.is_active = true
      )
    )
  );
