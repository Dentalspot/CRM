-- ============================================================================
-- Migration: RLS policy para scheduled_reminders cuando asistente crea cita
-- ----------------------------------------------------------------------------
-- Spec: 024-assistant-rich-calendar
-- Detectado durante smoke test 2026-04-24:
--
-- Al crear una cita (appointments) con role='assistant', el trigger
-- `trg_auto_schedule_reminders` dispara AFTER INSERT y ejecuta
-- `auto_schedule_reminders_on_appointment()` que INSERT en scheduled_reminders
-- con `therapist_id = NEW.therapist_id` (el dentista, no el asistente).
--
-- La RLS existente de scheduled_reminders solo permite INSERT cuando
-- `auth.uid() = therapist_id` → el asistente es rechazado → el INSERT de
-- appointments falla en cascada con: "new row violates row-level security
-- policy for table 'scheduled_reminders'".
--
-- Fix: policy análoga a blocked_times_assistant_insert — permite al asistente
-- crear scheduled_reminders para dentistas activos de su organización.
-- ============================================================================

CREATE POLICY "Org assistants insert reminders"
  ON public.scheduled_reminders
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = scheduled_reminders.therapist_id
        AND om.is_active = true
        AND public.is_org_member(om.organization_id, 'assistant')
    )
  );

-- También necesita UPDATE y DELETE si el asistente edita/cancela cita
-- (el trigger puede re-generar reminders en UPDATE)
CREATE POLICY "Org assistants update reminders"
  ON public.scheduled_reminders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = scheduled_reminders.therapist_id
        AND om.is_active = true
        AND public.is_org_member(om.organization_id, 'assistant')
    )
  );

CREATE POLICY "Org assistants delete reminders"
  ON public.scheduled_reminders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = scheduled_reminders.therapist_id
        AND om.is_active = true
        AND public.is_org_member(om.organization_id, 'assistant')
    )
  );

COMMENT ON POLICY "Org assistants insert reminders" ON public.scheduled_reminders IS
  'Permite al asistente insertar scheduled_reminders para dentistas activos de su org. Necesario para cascade del trigger auto_schedule_reminders_on_appointment al crear cita. Spec 024.';
