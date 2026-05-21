-- ============================================================
-- Fix semántico: auto_schedule_reminders_on_appointment
-- ============================================================
-- Bug descubierto en smoke E2E (2026-05-21):
--   La lógica previa programaba el reminder N horas antes de la cita
--   (típicamente 24h) y descartaba el insert si ese momento ya estaba
--   "más de 1h en el pasado". Eso significa que el caso súper común
--   "dentista agenda hoy a las 17h una cita para mañana a las 11h"
--   nunca generaba reminder (la ventana 24h antes = hoy 11h ya pasó),
--   por lo que el paciente NO recibía aviso.
--
-- Fix (opción A acordada con Danissa):
--   - Si el momento ideal del reminder cae en el futuro: programar ahí
--     (comportamiento actual).
--   - Si cae en el pasado/muy cercano PERO la cita aún es futura con al
--     menos 5 min de margen: programar para now() + 5 min (best-effort
--     late delivery).
--   - Si la cita ya pasó o está en <5 min: no programar (evita spam
--     inútil).
--
-- Trade-off de producto: mejor un recordatorio tardío que ningún
-- recordatorio. Esto mejora retención sin generar mensajes inútiles
-- cuando ya es demasiado tarde.
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_schedule_reminders_on_appointment()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_prefs jsonb;
  v_timing int;
  v_appointment_time timestamptz;
  v_scheduled_time timestamptz;
  v_profile_id uuid;
BEGIN
  -- Get therapist preferences (default si null)
  SELECT reminder_preferences INTO v_prefs FROM therapist_details WHERE user_id = NEW.therapist_id;
  IF v_prefs IS NULL THEN
    v_prefs := '{"email_enabled": true, "timing_hours": 24}'::jsonb;
  END IF;

  IF (v_prefs->>'email_enabled')::boolean = true AND NEW.status = 'scheduled' THEN
    v_timing := COALESCE((v_prefs->>'timing_hours')::int, 24);
    v_appointment_time := NEW.date + NEW.start_time;
    v_scheduled_time := v_appointment_time - (v_timing || ' hours')::interval;

    -- scheduled_reminders.patient_id FK referencia profiles(id), no patients(id)
    SELECT profile_id INTO v_profile_id FROM patients WHERE id = NEW.patient_id;

    -- Solo programar si:
    --   1) el paciente tiene profile_id (no es "sin cuenta")
    --   2) la cita es futura con al menos 5 min de margen
    IF v_profile_id IS NOT NULL AND v_appointment_time > now() + interval '5 minutes' THEN
      -- Best-effort late delivery: si el momento ideal del reminder ya pasó
      -- (o está muy cerca), enviarlo en 5 min en vez de no enviarlo.
      IF v_scheduled_time <= now() + interval '5 minutes' THEN
        v_scheduled_time := now() + interval '5 minutes';
      END IF;

      INSERT INTO scheduled_reminders (appointment_id, therapist_id, patient_id, reminder_type, scheduled_time)
      VALUES (NEW.id, NEW.therapist_id, v_profile_id, 'patient', v_scheduled_time)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
