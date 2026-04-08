-- Fix: auto_grant_passport_on_appointment() was failing with duplicate key violation
-- when a patient_access_grant already existed (even with is_active=false).
-- The EXISTS check only looked for is_active=true, but the UNIQUE constraint
-- is on (patient_id, granted_to) regardless of is_active.
-- Solution: Use ON CONFLICT to upsert instead of INSERT.

CREATE OR REPLACE FUNCTION public.auto_grant_passport_on_appointment() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_patient_profile_id UUID;
BEGIN
  -- Only for new scheduled appointments
  IF NEW.status != 'scheduled' THEN
    RETURN NEW;
  END IF;

  -- Get patient's profile_id
  SELECT profile_id INTO v_patient_profile_id
  FROM patients
  WHERE id = NEW.patient_id;

  IF v_patient_profile_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Auto-grant passport access (upsert to avoid duplicate key violation)
  INSERT INTO patient_access_grants (
    patient_id,
    profile_id,
    granted_to,
    access_level,
    granted_by,
    is_active,
    accepted_at
  ) VALUES (
    NEW.patient_id,
    v_patient_profile_id,
    NEW.therapist_id,
    'full',
    'system',
    true,
    NOW()
  )
  ON CONFLICT (patient_id, granted_to)
  DO UPDATE SET
    is_active = true,
    access_level = 'full',
    revoked_at = NULL,
    accepted_at = COALESCE(patient_access_grants.accepted_at, NOW());

  -- Log the auto-grant
  INSERT INTO clinical_access_log (
    patient_id,
    accessed_by,
    action,
    details
  ) VALUES (
    NEW.patient_id,
    NEW.therapist_id,
    'auto_grant',
    jsonb_build_object(
      'reason', 'appointment_scheduled',
      'appointment_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$;
