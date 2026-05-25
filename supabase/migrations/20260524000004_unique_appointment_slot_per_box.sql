-- Feature: agenda 100% independiente por box (parte 3 — UNIQUE constraint).
--
-- Bug: el constraint unique_appointment_slot era
--   UNIQUE (therapist_id, clinic_id, date, start_time)
-- → impedía 2 citas a la misma hora del mismo therapist+clinic aunque
--   estuvieran en boxes distintos. Error 409 "duplicate key value violates
--   unique constraint unique_appointment_slot".
--
-- Esto contradice el modelo de agenda por box (confirmado con la founder:
-- boxes 100% independientes, mismo dentista puede tener citas simultáneas
-- en boxes distintos).
--
-- Fix: incluir box_id en el constraint. Dos citas a la misma hora en boxes
-- distintos ahora son válidas. La protección de double-booking en el MISMO
-- box la sigue dando el trigger check_appointment_box. El patient
-- double-booking lo da check_patient_double_booking.
--
-- Nota sobre NULLs: Postgres trata NULL como distinto en UNIQUE, así que
-- citas legacy con box_id NULL no quedarían cubiertas por este constraint —
-- pero validate_appointment() (migration 20260524000003) protege ese caso
-- con su chequeo de overlap.

ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS unique_appointment_slot;

ALTER TABLE public.appointments
ADD CONSTRAINT unique_appointment_slot
UNIQUE (therapist_id, clinic_id, date, start_time, box_id);
