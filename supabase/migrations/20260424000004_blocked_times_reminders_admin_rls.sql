-- ============================================================================
-- Migration: RLS policies para role='clinic_admin' en blocked_times + scheduled_reminders
-- ----------------------------------------------------------------------------
-- Spec: 025-clinic-admin-rich-calendar
-- Date: 2026-04-24
--
-- Contexto:
-- Spec 024 dejó `OrgCalendarView` genérico con prop `scope='assistant'|'clinic_admin'`
-- y `org.api.js` RLS-transparent. Policies `appt_admin_*` YA existen (spec 023 phase 1).
--
-- Pero `blocked_times` y `scheduled_reminders` solo tienen policies para:
--   - therapist dueño (auth.uid() = therapist_id)
--   - assistant de la org (spec 024 migrations 20260424000001, 20260424000002)
--
-- El clinic_admin NO puede CRUD en estas tablas sin estas policies, por lo que
-- US3 (bloquear hora) y la cascade del trigger scheduled_reminders en US2
-- (crear cita) fallarían por RLS.
--
-- Esta migration agrega las 6 policies faltantes siguiendo EXACTAMENTE el patrón
-- de las policies del asistente, reemplazando 'assistant' por 'clinic_admin'.
-- ============================================================================

-- ══════════════════════════════════════════════════════════════
-- 1. BLOCKED_TIMES — 3 policies para clinic_admin
-- ══════════════════════════════════════════════════════════════

CREATE POLICY blocked_times_admin_select ON public.blocked_times
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om_target
      WHERE om_target.user_id = blocked_times.therapist_id
        AND om_target.is_active = true
        AND public.is_org_member(om_target.organization_id, 'clinic_admin')
    )
  );

CREATE POLICY blocked_times_admin_insert ON public.blocked_times
  FOR INSERT
  WITH CHECK (
    -- El dentista referenciado debe ser miembro activo de la misma org que el admin
    EXISTS (
      SELECT 1 FROM public.organization_members om_target
      WHERE om_target.user_id = therapist_id
        AND om_target.role = 'dentist'
        AND om_target.is_active = true
        AND public.is_org_member(om_target.organization_id, 'clinic_admin')
    )
  );

CREATE POLICY blocked_times_admin_delete ON public.blocked_times
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om_target
      WHERE om_target.user_id = blocked_times.therapist_id
        AND om_target.is_active = true
        AND public.is_org_member(om_target.organization_id, 'clinic_admin')
    )
  );

COMMENT ON POLICY blocked_times_admin_select ON public.blocked_times IS
  'Permite al clinic_admin ver bloqueos horarios de dentistas de su organización. Spec 025.';
COMMENT ON POLICY blocked_times_admin_insert ON public.blocked_times IS
  'Permite al clinic_admin crear bloqueos en nombre de dentistas activos de su organización. Spec 025.';
COMMENT ON POLICY blocked_times_admin_delete ON public.blocked_times IS
  'Permite al clinic_admin eliminar bloqueos de dentistas de su organización. Spec 025.';


-- ══════════════════════════════════════════════════════════════
-- 2. SCHEDULED_REMINDERS — 3 policies para clinic_admin
-- ══════════════════════════════════════════════════════════════
-- Necesarias para la cascade del trigger auto_schedule_reminders_on_appointment:
-- cuando clinic_admin crea cita, el trigger inserta reminders con therapist_id
-- = dentista. Sin policy insert, el INSERT en appointments falla en cascade.

CREATE POLICY "Org admins insert reminders"
  ON public.scheduled_reminders
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = scheduled_reminders.therapist_id
        AND om.is_active = true
        AND public.is_org_member(om.organization_id, 'clinic_admin')
    )
  );

CREATE POLICY "Org admins update reminders"
  ON public.scheduled_reminders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = scheduled_reminders.therapist_id
        AND om.is_active = true
        AND public.is_org_member(om.organization_id, 'clinic_admin')
    )
  );

CREATE POLICY "Org admins delete reminders"
  ON public.scheduled_reminders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = scheduled_reminders.therapist_id
        AND om.is_active = true
        AND public.is_org_member(om.organization_id, 'clinic_admin')
    )
  );

COMMENT ON POLICY "Org admins insert reminders" ON public.scheduled_reminders IS
  'Permite al clinic_admin insertar scheduled_reminders para dentistas activos de su org. Necesario para cascade del trigger auto_schedule_reminders al crear cita. Spec 025.';
