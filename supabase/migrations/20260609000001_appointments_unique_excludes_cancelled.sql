-- ============================================================
-- Spec 030 followup: el unique constraint de slot debe excluir canceladas
-- ============================================================
-- Antes: UNIQUE (therapist_id, clinic_id, date, start_time, box_id) sobre TODA
-- la tabla → si una cita se cancela, el slot queda ocupado para el DB pero
-- invisible en el calendar (que filtra cancelled). Resultado: bloqueo silencioso
-- al agendar OTRA cita en el mismo slot.
--
-- Después: PARTIAL UNIQUE INDEX con WHERE status != 'cancelled'. Una cita
-- cancelada deja libre el slot para que otra pueda crearse ahí.
-- ============================================================

-- 1. Drop el constraint + index existente
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS unique_appointment_slot;

DROP INDEX IF EXISTS public.unique_appointment_slot;

-- 2. Crear partial unique index que excluye 'cancelled'
CREATE UNIQUE INDEX unique_appointment_slot
  ON public.appointments (therapist_id, clinic_id, date, start_time, box_id)
  WHERE status != 'cancelled';

COMMENT ON INDEX public.unique_appointment_slot IS
  'Spec 030 followup: unique solo entre citas activas (no cancelled). Permite re-agendar el mismo slot después de cancelar.';
