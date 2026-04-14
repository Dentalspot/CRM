-- Fix: auto_schedule_reminders_on_appointment() was using appointments.patient_id
-- (which references patients.id) instead of resolving to profiles.id
-- scheduled_reminders.patient_id FK references profiles(id), not patients(id)

CREATE OR REPLACE FUNCTION public.auto_schedule_reminders_on_appointment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_prefs jsonb;
  v_timing int;
  v_scheduled_time timestamp with time zone;
  v_profile_id uuid;
BEGIN
  -- Get therapist preferences
  SELECT reminder_preferences INTO v_prefs FROM therapist_details WHERE user_id = NEW.therapist_id;

  -- Default if null
  IF v_prefs IS NULL THEN
    v_prefs := '{"email_enabled": true, "timing_hours": 24}'::jsonb;
  END IF;

  -- Only schedule if enabled and status is scheduled
  IF (v_prefs->>'email_enabled')::boolean = true AND NEW.status = 'scheduled' THEN
    v_timing := COALESCE((v_prefs->>'timing_hours')::int, 24);

    -- Calculate time (N hours before appointment)
    v_scheduled_time := (NEW.date + NEW.start_time) - (v_timing || ' hours')::interval;

    -- Resolve profile_id from patients table
    -- scheduled_reminders.patient_id FK references profiles(id), not patients(id)
    SELECT profile_id INTO v_profile_id FROM patients WHERE id = NEW.patient_id;

    -- Insert for patient if scheduled time is in future and profile exists
    IF v_scheduled_time > now() - interval '1 hour' AND v_profile_id IS NOT NULL THEN
        INSERT INTO scheduled_reminders (appointment_id, therapist_id, patient_id, reminder_type, scheduled_time)
        VALUES (NEW.id, NEW.therapist_id, v_profile_id, 'patient', v_scheduled_time)
        ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
