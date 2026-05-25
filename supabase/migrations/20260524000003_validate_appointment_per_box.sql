-- Feature: agenda 100% independiente por box.
--
-- Bug: validate_appointment() rechazaba agendar en Box 2 a un horario que ya
-- tenía cita en Box 1 (mismo therapist + clinic), con error "Ya existe una
-- cita en ese horario". Esto contradice el modelo de agenda por box: cada
-- box es una sala física independiente y puede tener citas en paralelo
-- (clínica multi-sillón, varios profesionales bajo la cuenta del dueño).
--
-- Decisión de producto (confirmada): el mismo dentista PUEDE tener citas
-- simultáneas en boxes distintos. La protección de doble-booking por box ya
-- la da el trigger check_appointment_box. El paciente sigue protegido por
-- check_patient_double_booking (una persona no puede estar en 2 lugares).
--
-- Fix: el chequeo de overlap de citas en validate_appointment ahora ignora
-- conflictos entre boxes DISTINTOS. Semántica:
--   - Box A vs Box A → conflicto (mismo box)
--   - Box A vs Box B → NO conflicto (boxes independientes)
--   - Box A vs NULL / NULL vs NULL → conflicto (legacy sin box, conservador)
--
-- (El bloque de blocked_times ya considera box_id desde migration
--  20260524000002 + la conversión de TZ desde 20260524000001.)

CREATE OR REPLACE FUNCTION public.validate_appointment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.status IN ('canceled', 'cancelled', 'completed', 'no-show') THEN
    RETURN NEW;
  END IF;

  -- Appointment overlap — ahora respeta agenda por box.
  -- NO hay conflicto si las dos citas están en boxes DISTINTOS (ambos no-null).
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE therapist_id = NEW.therapist_id
      AND clinic_id = NEW.clinic_id
      AND date = NEW.date
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
      AND status NOT IN ('canceled', 'cancelled', 'completed', 'no-show')
      AND NOT (box_id IS NOT NULL AND NEW.box_id IS NOT NULL AND box_id != NEW.box_id)
      AND (
        (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
        (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
        (NEW.start_time <= start_time AND NEW.end_time >= end_time)
      )
  ) THEN
    RAISE EXCEPTION 'Ya existe una cita en ese horario';
  END IF;

  -- Blocked time overlap — considera box_id + hora Chile.
  IF EXISTS (
    SELECT 1 FROM blocked_times bt
    WHERE bt.therapist_id = NEW.therapist_id
      AND bt.clinic_id = NEW.clinic_id
      AND (bt.box_id IS NULL OR bt.box_id = NEW.box_id)
      AND DATE(bt.start_time AT TIME ZONE 'America/Santiago') = NEW.date
      AND (
        (NEW.start_time >= (bt.start_time AT TIME ZONE 'America/Santiago')::TIME
         AND NEW.start_time < (bt.end_time AT TIME ZONE 'America/Santiago')::TIME) OR
        (NEW.end_time > (bt.start_time AT TIME ZONE 'America/Santiago')::TIME
         AND NEW.end_time <= (bt.end_time AT TIME ZONE 'America/Santiago')::TIME)
      )
  ) THEN
    RAISE EXCEPTION 'El horario está bloqueado';
  END IF;

  RETURN NEW;
END;
$$;
