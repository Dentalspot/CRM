-- ============================================================================
-- Migration: RLS policies para role='assistant' en blocked_times + profiles
-- ----------------------------------------------------------------------------
-- Spec: 024-assistant-rich-calendar
-- Context: el asistente necesita poder gestionar bloqueos horarios de dentistas
--   de su organización (feature US3) + leer profiles de miembros de su org
--   (feature US1 — listar dentistas, US2 — autocomplete pacientes).
--
-- Hallazgo verificado (2026-04-24):
--   Query: SELECT policyname FROM pg_policies WHERE tablename='profiles' AND policyname ILIKE '%assistant%';
--   Result: 0 rows → GAP confirmado. Incluimos policy para profiles.
--
-- Policies creadas:
--   1. blocked_times_assistant_select — asistente ve bloqueos de dentistas de su org
--   2. blocked_times_assistant_insert — asistente crea bloqueos en nombre de dentistas de su org
--   3. blocked_times_assistant_delete — asistente elimina bloqueos creados en su org
--   4. "Org assistants can view member profiles" — asistente ve profiles de co-miembros
--      (necesario para selector de dentista + autocomplete de pacientes)
--
-- Policies existentes preservadas (no tocadas):
--   - "Therapists can manage their own blocked times" (dueño therapist sigue CRUD propio)
--   - profiles_select_own (user ve su propio profile)
--   - "Public can view therapist profiles" (public ve profiles role='therapist')
--   - "Clinic admins can view org members profiles" (spec 023 — admin ve org members)
--
-- Ver research §R-04 para rationale completo.
-- ============================================================================

-- ══════════════════════════════════════════════════════════════
-- 1. BLOCKED_TIMES — policies para asistente
-- ══════════════════════════════════════════════════════════════

CREATE POLICY blocked_times_assistant_select ON public.blocked_times
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om_target
      WHERE om_target.user_id = blocked_times.therapist_id
        AND om_target.is_active = true
        AND public.is_org_member(om_target.organization_id, 'assistant')
    )
  );

CREATE POLICY blocked_times_assistant_insert ON public.blocked_times
  FOR INSERT
  WITH CHECK (
    -- El dentista referenciado debe ser miembro activo de la misma org que el asistente
    EXISTS (
      SELECT 1 FROM public.organization_members om_target
      WHERE om_target.user_id = therapist_id
        AND om_target.role = 'dentist'
        AND om_target.is_active = true
        AND public.is_org_member(om_target.organization_id, 'assistant')
    )
  );

CREATE POLICY blocked_times_assistant_delete ON public.blocked_times
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om_target
      WHERE om_target.user_id = blocked_times.therapist_id
        AND om_target.is_active = true
        AND public.is_org_member(om_target.organization_id, 'assistant')
    )
  );

COMMENT ON POLICY blocked_times_assistant_select ON public.blocked_times IS
  'Permite al asistente ver bloqueos horarios de dentistas de su organización. Spec 024.';
COMMENT ON POLICY blocked_times_assistant_insert ON public.blocked_times IS
  'Permite al asistente crear bloqueos en nombre de dentistas activos de su organización. Spec 024.';
COMMENT ON POLICY blocked_times_assistant_delete ON public.blocked_times IS
  'Permite al asistente eliminar bloqueos de dentistas de su organización. Spec 024.';


-- ══════════════════════════════════════════════════════════════
-- 2. PROFILES — policy para que asistente vea miembros de su org
-- ══════════════════════════════════════════════════════════════
-- Gap confirmado: asistente no podía leer profiles de dentistas/pacientes
-- de su org. Necesario para:
--   - Selector de dentista (UI lee profile.full_name)
--   - Autocomplete de pacientes (lee profile.full_name/email/phone)
--   - Render de cita con nombre del dentista y paciente

CREATE POLICY "Org assistants can view member profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om_self
      JOIN public.organization_members om_other
        ON om_self.organization_id = om_other.organization_id
      WHERE om_self.user_id = auth.uid()
        AND om_self.role = 'assistant'
        AND om_self.is_active = true
        AND om_other.user_id = public.profiles.id
    )
  );

COMMENT ON POLICY "Org assistants can view member profiles" ON public.profiles IS
  'Permite a un asistente activo leer profiles de cualquier miembro (dentists/assistants/clinic_admin) de su org, activos o inactivos. Necesario para selector + autocomplete pacientes. Spec 024.';


-- ══════════════════════════════════════════════════════════════
-- 3. PROFILES — permitir al asistente ver profiles de PACIENTES de su org
-- ══════════════════════════════════════════════════════════════
-- Los pacientes NO están en organization_members (son una tabla separada).
-- Para que el asistente pueda resolver profile.full_name/email/phone al
-- hacer autocomplete sobre patients, necesita una policy adicional.

CREATE POLICY "Org assistants can view patient profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.patients p
      JOIN public.organization_members om
        ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
        AND om.role = 'assistant'
        AND om.is_active = true
        AND p.profile_id = public.profiles.id
    )
  );

COMMENT ON POLICY "Org assistants can view patient profiles" ON public.profiles IS
  'Permite a un asistente activo leer profiles de pacientes de su org (via patients.profile_id). Necesario para autocomplete de pacientes al crear/editar cita. Spec 024 FR-009.';
