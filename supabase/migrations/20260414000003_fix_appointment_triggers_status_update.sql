-- Fix: validate_appointment() and check_patient_double_booking() should skip
-- validation when the appointment being updated has a non-active status
-- (canceled, cancelled, completed, no-show) to avoid false conflicts

-- Fix validate_appointment: skip checks for non-active statuses
CREATE OR REPLACE FUNCTION public.validate_appointment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Skip validation for non-active appointments
  IF NEW.status IN ('canceled', 'cancelled', 'completed', 'no-show') THEN
    RETURN NEW;
  END IF;

  -- Verificar que no haya superposición de horarios
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE therapist_id = NEW.therapist_id
      AND clinic_id = NEW.clinic_id
      AND date = NEW.date
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
      AND status NOT IN ('canceled', 'cancelled', 'completed', 'no-show')
      AND (
        (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
        (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
        (NEW.start_time <= start_time AND NEW.end_time >= end_time)
      )
  ) THEN
    RAISE EXCEPTION 'Ya existe una cita en ese horario';
  END IF;

  -- Verificar horario bloqueado
  IF EXISTS (
    SELECT 1 FROM blocked_times
    WHERE therapist_id = NEW.therapist_id
      AND clinic_id = NEW.clinic_id
      AND DATE(start_time) = NEW.date
      AND (
        (NEW.start_time >= start_time::TIME AND NEW.start_time < end_time::TIME) OR
        (NEW.end_time > start_time::TIME AND NEW.end_time <= end_time::TIME)
      )
  ) THEN
    RAISE EXCEPTION 'El horario está bloqueado';
  END IF;

  RETURN NEW;
END;
$$;

-- Fix check_patient_double_booking: skip for non-active statuses and normalize cancelled/canceled
CREATE OR REPLACE FUNCTION public.check_patient_double_booking() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    conflict_count INTEGER;
    new_start_datetime TIMESTAMP;
    new_end_datetime TIMESTAMP;
BEGIN
    -- Skip validation for non-active appointments
    IF NEW.status IN ('canceled', 'cancelled', 'completed', 'no-show') THEN
      RETURN NEW;
    END IF;

    new_start_datetime := NEW.date + NEW.start_time;
    new_end_datetime := NEW.date + NEW.end_time;

    SELECT COUNT(*)
    INTO conflict_count
    FROM public.appointments
    WHERE
        patient_id = NEW.patient_id
        AND id IS DISTINCT FROM NEW.id
        AND status NOT IN ('canceled', 'cancelled', 'no-show')
        AND (date + start_time, date + end_time) OVERLAPS (new_start_datetime, new_end_datetime);

    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'El paciente ya tiene una cita agendada en ese horario. Elige otro horario.';
    END IF;

    RETURN NEW;
END;
$$;
