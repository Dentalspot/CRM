-- Self-booking Fase 2 (parcial): instrucciones del dentista para el paciente.
--
-- Feature 1 (motivo de consulta) NO requiere columna nueva: el motivo que
-- escribe el paciente se concatena en appointments.notes (lo ve el dentista
-- al abrir la cita).
--
-- Feature 2 (nota configurable del dentista, ej. "llegar 5 min antes"):
-- nueva columna therapist_details.booking_instructions. El dentista la
-- configura desde su perfil (sección Reservas Online) y se muestra al
-- paciente antes de confirmar la reserva.

ALTER TABLE public.therapist_details
ADD COLUMN IF NOT EXISTS booking_instructions text;

COMMENT ON COLUMN public.therapist_details.booking_instructions
IS 'Nota/instrucciones que el dentista configura para mostrar al paciente antes de confirmar una reserva online (ej. "Llegá 5 minutos antes"). Self-booking Fase 2.';
