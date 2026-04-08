-- Create a SECURITY DEFINER RPC for creating referrals
-- This bypasses RLS issues and ensures the referral + notification are created atomically

CREATE OR REPLACE FUNCTION public.create_referral(
  p_patient_id uuid,
  p_therapist_id uuid,
  p_referral_type text,
  p_referral_reason text,
  p_referred_professional_id uuid DEFAULT NULL,
  p_referred_professional_name text DEFAULT NULL,
  p_source_entry_id uuid DEFAULT NULL,
  p_source_appointment_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_id uuid;
  v_therapist_name text;
  v_patient_profile_id uuid;
  v_type_label text;
  v_professional_name text;
BEGIN
  -- Validate: therapist must own this patient or have access
  IF NOT EXISTS (
    SELECT 1 FROM patients WHERE id = p_patient_id AND therapist_id = p_therapist_id
  ) AND NOT EXISTS (
    SELECT 1 FROM patient_access_grants WHERE patient_id = p_patient_id AND granted_to = p_therapist_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'No tienes acceso a este paciente';
  END IF;

  -- Get therapist name
  SELECT full_name INTO v_therapist_name FROM profiles WHERE id = p_therapist_id;

  -- Resolve professional name
  v_professional_name := COALESCE(p_referred_professional_name, p_referral_type);

  -- Type label mapping
  v_type_label := CASE p_referral_type
    WHEN 'fonoaudiologo' THEN 'Fonoaudiólogo/a'
    WHEN 'psicologo' THEN 'Psicólogo/a'
    WHEN 'terapeuta_ocupacional' THEN 'Terapeuta Ocupacional'
    WHEN 'neurologo' THEN 'Neurólogo/a'
    WHEN 'psiquiatra' THEN 'Psiquiatra'
    WHEN 'pediatra' THEN 'Pediatra'
    WHEN 'educador_diferencial' THEN 'Educador/a Diferencial'
    WHEN 'kinesiologo' THEN 'Kinesiólogo/a'
    ELSE 'Otro profesional'
  END;

  -- 1. Insert clinical_history entry
  INSERT INTO clinical_history (
    patient_id,
    therapist_id,
    entry_type,
    entry_date,
    summary,
    session_notes,
    details
  ) VALUES (
    p_patient_id,
    p_therapist_id,
    'derivacion',
    now(),
    'Derivación a ' || v_type_label,
    p_referral_reason,
    jsonb_build_object(
      'referral_type', p_referral_type,
      'referral_reason', p_referral_reason,
      'referral_status', 'pending',
      'referred_professional_id', p_referred_professional_id,
      'referred_professional_name', v_professional_name,
      'referred_by_name', v_therapist_name,
      'source_entry_id', p_source_entry_id,
      'source_appointment_id', p_source_appointment_id
    )
  )
  RETURNING id INTO v_entry_id;

  -- 2. Get patient's profile_id for notification
  SELECT profile_id INTO v_patient_profile_id
  FROM patients WHERE id = p_patient_id;

  -- 3. Create notification for patient
  IF v_patient_profile_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, data, priority, action_url)
    VALUES (
      v_patient_profile_id,
      'referral',
      'Nueva derivación',
      'Tu terapeuta ' || COALESCE(v_therapist_name, '') || ' te ha derivado a ' || v_professional_name || '. Revisa los detalles para aceptar o rechazar.',
      jsonb_build_object(
        'referral_entry_id', v_entry_id,
        'referral_type', p_referral_type,
        'referred_professional_name', v_professional_name
      ),
      'high',
      '/dashboard/patient'
    );
  END IF;

  RETURN v_entry_id;
END;
$$;
