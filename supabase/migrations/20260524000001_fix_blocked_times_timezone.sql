-- Fix: bug de timezone en blocked_times y trigger validate_appointment.
--
-- Bug original:
--   - Frontend (BlockTimeForm.jsx, BlockTimeModal.jsx path recurring)
--     hacía `start_time: \`${date}T${hh:mm}\`` sin TZ.
--   - Postgres interpretaba el string como UTC.
--   - Pero el user lo tipeó pensando en hora Chile.
--   - Resultado: blocked_time guardado con offset incorrecto.
--   - Trigger validate_appointment usaba `start_time::TIME` que extrae hora
--     en UTC, comparándola contra NEW.start_time (que es hora local Chile
--     del appointment). Match incorrecto → bloqueaba horarios erróneos.
--
-- Fix:
--   1. Frontend: ya migrado a `new Date(string).toISOString()` (en commits
--      separados de esta migration).
--   2. Trigger: usar AT TIME ZONE 'America/Santiago' al extraer DATE/TIME.
--   3. Data: re-interpretar timestamps existentes como hora Chile.
--      Asumimos que TODOS los blocked_times pre-fix tienen el bug
--      (es el único path hasta hoy 2026-05-24).

-- ============================================================
-- Paso 1: Corregir data existente
-- ============================================================
-- Convertir el wall-clock UTC actual a "interpretarlo como hora Chile",
-- lo cual desplaza el timestamp +3h (verano DST) o +4h (invierno).
--
-- Ejemplo:
--   start_time = '2026-05-26 13:00:00+00' (BD actual, mal interpretado)
--   La user lo guardó pensando "13:00 hora Chile el 26 may"
--   2026-05-26 es invierno Chile = UTC-4
--   Corrección: '2026-05-26 17:00:00+00' (= 13:00 hora Chile)
--
-- La expresión `timestamp::timestamp` quita el TZ (mantiene wall clock),
-- luego AT TIME ZONE 'America/Santiago' lo re-interpreta como hora Chile.

UPDATE public.blocked_times
SET start_time = (start_time::timestamp AT TIME ZONE 'America/Santiago'),
    end_time = (end_time::timestamp AT TIME ZONE 'America/Santiago')
WHERE created_at < '2026-05-24'::date;

-- ============================================================
-- Paso 2: Fix del trigger validate_appointment
-- ============================================================
-- Antes: `start_time::TIME` → extrae hora en UTC, no en Chile
-- Ahora: `(start_time AT TIME ZONE 'America/Santiago')::TIME` → hora Chile
--
-- NEW.start_time/end_time/date ya están en hora Chile (vienen del UI sin TZ).

CREATE OR REPLACE FUNCTION public.validate_appointment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Skip validation for non-active appointments
  IF NEW.status IN ('canceled', 'cancelled', 'completed', 'no-show') THEN
    RETURN NEW;
  END IF;

  -- Verificar que no haya superposición de horarios con otras citas
  -- (sin cambio — appointments.start_time es TIME without TZ, no requiere conversión)
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

  -- Verificar horario bloqueado (FIX: convertir a hora Chile antes de comparar)
  IF EXISTS (
    SELECT 1 FROM blocked_times
    WHERE therapist_id = NEW.therapist_id
      AND clinic_id = NEW.clinic_id
      AND DATE(start_time AT TIME ZONE 'America/Santiago') = NEW.date
      AND (
        (NEW.start_time >= (start_time AT TIME ZONE 'America/Santiago')::TIME
         AND NEW.start_time < (end_time AT TIME ZONE 'America/Santiago')::TIME) OR
        (NEW.end_time > (start_time AT TIME ZONE 'America/Santiago')::TIME
         AND NEW.end_time <= (end_time AT TIME ZONE 'America/Santiago')::TIME)
      )
  ) THEN
    RAISE EXCEPTION 'El horario está bloqueado';
  END IF;

  RETURN NEW;
END;
$$;
