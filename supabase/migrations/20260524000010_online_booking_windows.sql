-- Self-booking: franjas horarias específicas para reservas online.
--
-- El dentista puede exponer en su perfil público un horario DISTINTO de su
-- disponibilidad operativa (ej. solo jueves y viernes en la tarde para
-- recibir pacientes nuevos).
--
-- Modelo:
--   - therapist_details.online_booking_use_general (bool, default true):
--     la casilla "Usar mi disponibilidad general de agenda". Si true →
--     el calendario público usa therapist_availabilities (comportamiento
--     actual). Si false → usa las franjas de online_booking_windows.
--   - online_booking_windows: franjas recurrentes por día de semana.

ALTER TABLE public.therapist_details
ADD COLUMN IF NOT EXISTS online_booking_use_general boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.therapist_details.online_booking_use_general
IS 'Si true, el calendario de reserva online usa la disponibilidad general (therapist_availabilities). Si false, usa las franjas de online_booking_windows.';

CREATE TABLE IF NOT EXISTS public.online_booking_windows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  therapist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT online_booking_window_valid CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_online_booking_windows_therapist
  ON public.online_booking_windows(therapist_id);

ALTER TABLE public.online_booking_windows ENABLE ROW LEVEL SECURITY;

-- El dentista gestiona sus propias franjas
DROP POLICY IF EXISTS "Therapist manages own booking windows" ON public.online_booking_windows;
CREATE POLICY "Therapist manages own booking windows"
  ON public.online_booking_windows
  FOR ALL
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

-- Lectura pública (el calendario de reserva del perfil público es anónimo)
DROP POLICY IF EXISTS "Public can view booking windows" ON public.online_booking_windows;
CREATE POLICY "Public can view booking windows"
  ON public.online_booking_windows
  FOR SELECT
  USING (true);
