-- Fix: reservas sin box (box_id NULL) no respetaban los bloqueos por box.
--
-- Bug (detectado en smoke self-booking): una reserva online (box_id NULL,
-- creada por el RPC) pudo agendarse sobre un blocked_time que estaba
-- asignado a un box concreto (Box 1, por el backfill 20260524000002).
--
-- La condición previa del chequeo de blocked_times era:
--   (bt.box_id IS NULL OR bt.box_id = NEW.box_id)
-- Con NEW.box_id = NULL y bt.box_id = <box>, la comparación
--   bt.box_id = NULL → NULL (no TRUE) → no matcheaba → no bloqueaba.
--
-- Fix: misma semántica que el overlap de CITAS (migration 20260524000003):
-- solo NO hay conflicto si AMBOS boxes existen y son distintos. Una reserva
-- sin box choca con cualquier bloqueo (porque no sabemos a qué box irá; el
-- dentista lo asigna al confirmar).

CREATE OR REPLACE FUNCTION public.validate_appointment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.status IN ('canceled', 'cancelled', 'completed', 'no-show') THEN
    RETURN NEW;
  END IF;

  -- Appointment overlap — ignora conflictos entre boxes DISTINTOS (ambos no-null).
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

  -- Blocked time overlap — misma lógica de box que el overlap de citas:
  -- solo NO bloquea si ambos boxes existen y son distintos. Una reserva sin
  -- box (box_id NULL) respeta TODOS los bloqueos.
  IF EXISTS (
    SELECT 1 FROM blocked_times bt
    WHERE bt.therapist_id = NEW.therapist_id
      AND bt.clinic_id = NEW.clinic_id
      AND NOT (bt.box_id IS NOT NULL AND NEW.box_id IS NOT NULL AND bt.box_id != NEW.box_id)
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
