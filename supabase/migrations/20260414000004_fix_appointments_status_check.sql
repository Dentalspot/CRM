-- Fix: appointments_status_check only allows scheduled, completed, cancelled, no-show
-- Add: confirmed, canceled (single L variant used by frontend)

ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;

ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
  CHECK (status = ANY (ARRAY[
    'scheduled'::text,
    'confirmed'::text,
    'completed'::text,
    'canceled'::text,
    'cancelled'::text,
    'no-show'::text
  ]));
