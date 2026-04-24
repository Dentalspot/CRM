-- ============================================================================
-- Migration: permitir al clinic_admin leer profiles de pacientes de su org
-- ----------------------------------------------------------------------------
-- Spec: 025-clinic-admin-rich-calendar (detectado durante smoke 2026-04-24)
--
-- Contexto:
-- `searchOrgPatients` (src/lib/api/org.api.js) queries `profiles` directamente
-- para autocomplete de pacientes. Las policies existentes en `profiles` para
-- clinic_admin (spec 023 migration 20260423000005) permiten ver profiles de
-- org_members (dentistas/asistentes) pero NO de pacientes.
--
-- Los pacientes NO son org_members — viven en tabla `patients` (con profile_id
-- referenciando `profiles`). El asistente ya tiene la policy análoga
-- (`"Org assistants can view patient profiles"`, spec 024 migration 000001).
--
-- Este migration agrega la contraparte para clinic_admin.
-- ============================================================================

CREATE POLICY "Clinic admins can view patient profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.patients p
      JOIN public.organization_members om
        ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
        AND om.role = 'clinic_admin'
        AND om.is_active = true
        AND p.profile_id = public.profiles.id
    )
  );

COMMENT ON POLICY "Clinic admins can view patient profiles" ON public.profiles IS
  'Permite a un clinic_admin activo leer profiles de pacientes de su org (via patients.profile_id). Necesario para autocomplete de pacientes al crear/editar cita. Spec 025 FR análogo al spec 024 FR-009.';
