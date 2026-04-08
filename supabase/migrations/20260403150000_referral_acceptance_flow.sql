-- =============================================
-- Referral Acceptance Flow
-- =============================================
-- 1. Add 'referral' to notifications type constraint
-- 2. Create accept_referral RPC
-- 3. Create reject_referral RPC

-- 1. Expand notification type constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY['appointment','reminder','message','system','payment','document','referral']));

-- 2. Accept referral RPC
CREATE OR REPLACE FUNCTION public.accept_referral(
  p_referral_id uuid,
  p_patient_profile_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral clinical_history%ROWTYPE;
  v_referred_therapist_id uuid;
  v_new_patient_id uuid;
  v_patient_id uuid;
  v_originating_therapist_id uuid;
  v_cloned_count integer := 0;
BEGIN
  -- 1. Load and validate the referral entry
  SELECT * INTO v_referral
  FROM clinical_history
  WHERE id = p_referral_id
    AND entry_type = 'derivacion';

  IF v_referral.id IS NULL THEN
    RAISE EXCEPTION 'Referral not found';
  END IF;

  IF v_referral.details->>'referral_status' != 'pending' THEN
    RAISE EXCEPTION 'Referral is not pending (status: %)', v_referral.details->>'referral_status';
  END IF;

  -- 2. Validate patient owns this referral
  v_patient_id := v_referral.patient_id;
  IF NOT EXISTS (
    SELECT 1 FROM patients
    WHERE id = v_patient_id AND profile_id = p_patient_profile_id
  ) THEN
    RAISE EXCEPTION 'Patient does not match referral';
  END IF;

  -- 3. Get the referred professional
  v_referred_therapist_id := (v_referral.details->>'referred_professional_id')::uuid;
  IF v_referred_therapist_id IS NULL THEN
    RAISE EXCEPTION 'No professional specified in referral';
  END IF;

  v_originating_therapist_id := v_referral.therapist_id;

  -- 4. Update referral status to accepted
  UPDATE clinical_history
  SET details = details || jsonb_build_object(
    'referral_status', 'accepted',
    'accepted_at', NOW()::text,
    'accepted_by', p_patient_profile_id::text
  )
  WHERE id = p_referral_id;

  -- 5. Associate patient with new therapist
  v_new_patient_id := associate_patient_to_therapist(p_patient_profile_id, v_referred_therapist_id);

  -- 6. Clone clinical history entries from originating therapist to new therapist
  INSERT INTO clinical_history (
    patient_id, therapist_id, entry_date, entry_type, summary,
    details, status, session_type, duration_minutes,
    session_notes, session_state, source_system, location_type,
    care_context, caregiver_present, risk_flag
  )
  SELECT
    v_new_patient_id,
    v_referred_therapist_id,
    ch.entry_date,
    ch.entry_type,
    ch.summary,
    ch.details || jsonb_build_object(
      'is_cloned', true,
      'original_entry_id', ch.id::text,
      'original_therapist_id', ch.therapist_id::text,
      'cloned_from_referral', p_referral_id::text
    ),
    ch.status,
    ch.session_type,
    ch.duration_minutes,
    ch.session_notes,
    ch.session_state,
    'referral_clone',
    ch.location_type,
    ch.care_context,
    ch.caregiver_present,
    ch.risk_flag
  FROM clinical_history ch
  WHERE ch.patient_id = v_patient_id
    AND ch.therapist_id = v_originating_therapist_id
    AND ch.entry_type != 'derivacion';

  GET DIAGNOSTICS v_cloned_count = ROW_COUNT;

  -- 7. Mark notification as read
  UPDATE notifications
  SET read = true, read_at = NOW()
  WHERE user_id = p_patient_profile_id
    AND type = 'referral'
    AND data->>'referral_entry_id' = p_referral_id::text;

  RETURN jsonb_build_object(
    'success', true,
    'new_patient_id', v_new_patient_id,
    'cloned_entries', v_cloned_count
  );
END;
$$;

-- 3. Reject referral RPC
CREATE OR REPLACE FUNCTION public.reject_referral(
  p_referral_id uuid,
  p_patient_profile_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral clinical_history%ROWTYPE;
BEGIN
  SELECT * INTO v_referral
  FROM clinical_history
  WHERE id = p_referral_id
    AND entry_type = 'derivacion';

  IF v_referral.id IS NULL THEN
    RAISE EXCEPTION 'Referral not found';
  END IF;

  IF v_referral.details->>'referral_status' != 'pending' THEN
    RAISE EXCEPTION 'Referral is not pending';
  END IF;

  -- Validate patient
  IF NOT EXISTS (
    SELECT 1 FROM patients
    WHERE id = v_referral.patient_id AND profile_id = p_patient_profile_id
  ) THEN
    RAISE EXCEPTION 'Patient does not match referral';
  END IF;

  -- Update status
  UPDATE clinical_history
  SET details = details || jsonb_build_object(
    'referral_status', 'rejected',
    'rejected_at', NOW()::text
  )
  WHERE id = p_referral_id;

  -- Mark notification as read
  UPDATE notifications
  SET read = true, read_at = NOW()
  WHERE user_id = p_patient_profile_id
    AND type = 'referral'
    AND data->>'referral_entry_id' = p_referral_id::text;

  RETURN jsonb_build_object('success', true);
END;
$$;
