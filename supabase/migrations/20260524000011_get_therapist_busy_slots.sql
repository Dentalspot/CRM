-- Self-booking: RPC que expone los horarios OCUPADOS de un dentista para
-- que el calendario público (anónimo) pueda filtrar slots ya tomados.
--
-- Problema: el perfil público es anónimo y RLS no le permite leer
-- appointments ni blocked_times (datos sensibles). Esta RPC SECURITY DEFINER
-- retorna SOLO rangos ocupados (fecha + hora inicio/fin), sin nombre de
-- paciente ni motivo ni nada sensible — solo "este horario está ocupado".
--
-- Incluye:
--   - Citas activas (scheduled/confirmed) — incluye reservas online
--     pendientes, que igual ocupan el horario.
--   - Bloqueos (blocked_times), convertidos a hora Chile.

CREATE OR REPLACE FUNCTION public.get_therapist_busy_slots(
  p_therapist_id uuid,
  p_start_date date,
  p_days integer
)
RETURNS TABLE(busy_date date, busy_start time without time zone, busy_end time without time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Citas activas (no canceladas/completadas/no-show)
  SELECT a.date, a.start_time, a.end_time
  FROM appointments a
  WHERE a.therapist_id = p_therapist_id
    AND a.status IN ('scheduled', 'confirmed')
    AND a.date >= p_start_date
    AND a.date < (p_start_date + p_days)

  UNION ALL

  -- Bloqueos (convertidos a hora Chile, mismo criterio que validate_appointment)
  SELECT
    (bt.start_time AT TIME ZONE 'America/Santiago')::date,
    (bt.start_time AT TIME ZONE 'America/Santiago')::time,
    (bt.end_time AT TIME ZONE 'America/Santiago')::time
  FROM blocked_times bt
  WHERE bt.therapist_id = p_therapist_id
    AND (bt.start_time AT TIME ZONE 'America/Santiago')::date >= p_start_date
    AND (bt.start_time AT TIME ZONE 'America/Santiago')::date < (p_start_date + p_days);
$$;

-- Permitir ejecución desde el perfil público anónimo
GRANT EXECUTE ON FUNCTION public.get_therapist_busy_slots(uuid, date, integer) TO anon, authenticated;
