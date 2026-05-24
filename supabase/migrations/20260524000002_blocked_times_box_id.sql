-- Feature: blocked_times segregados por box (agenda independiente por box).
--
-- Bug observado: user en Box 2 ve los bloqueos del Box 1, porque blocked_times
-- solo tenía therapist_id + clinic_id (sin box_id). La user quiere segregación
-- total: cada box tiene su agenda propia, incluyendo bloqueos.
--
-- Cambios:
--   1. ADD COLUMN box_id (nullable para mantener legacy + backfill).
--   2. Backfill: asignar bloqueos existentes al primer box (por name asc) de
--      su clinic. La user puede recrearlos específicos si quiere.
--   3. Trigger validate_appointment: agregar match por box_id. NULL en blocked
--      significa "aplica a todos los boxes" (semántica legacy preservada).

-- ============================================================
-- Paso 1: Agregar columna box_id
-- ============================================================
ALTER TABLE public.blocked_times
ADD COLUMN IF NOT EXISTS box_id uuid REFERENCES public.clinic_boxes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_blocked_times_box_id ON public.blocked_times(box_id);

-- ============================================================
-- Paso 2: Backfill bloqueos existentes → primer box de la clinic
-- ============================================================
-- Para cada bloqueo sin box_id, asignar el box más antiguo (lex order asc)
-- de su clinic_id. Si la clinic no tiene boxes activos, dejar NULL (sin box).
UPDATE public.blocked_times bt
SET box_id = (
  SELECT cb.id
  FROM public.clinic_boxes cb
  WHERE cb.clinic_id = bt.clinic_id
    AND cb.is_active = true
  ORDER BY cb.name ASC
  LIMIT 1
)
WHERE bt.clinic_id IS NOT NULL
  AND bt.box_id IS NULL;

-- ============================================================
-- Paso 3: Actualizar trigger validate_appointment con match por box
-- ============================================================
-- Semántica:
--   - blocked.box_id = NEW.box_id → match (bloqueo específico del mismo box)
--   - blocked.box_id IS NULL → match (bloqueo legacy "global" a la clinic)
--   - blocked.box_id != NEW.box_id → NO match (otro box)

CREATE OR REPLACE FUNCTION public.validate_appointment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.status IN ('canceled', 'cancelled', 'completed', 'no-show') THEN
    RETURN NEW;
  END IF;

  -- Appointment overlap (sin cambio)
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

  -- Blocked time overlap — ahora considera box_id
  IF EXISTS (
    SELECT 1 FROM blocked_times bt
    WHERE bt.therapist_id = NEW.therapist_id
      AND bt.clinic_id = NEW.clinic_id
      -- Match por box: el bloqueo aplica si es del mismo box O es legacy global
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
