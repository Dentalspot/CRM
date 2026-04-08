-- Fix: get_patient_clinical_timeline RPC must mark cloned entries as is_external
-- and include details + source_system so frontend can distinguish cloned entries

-- Must drop first because return type changed
DROP FUNCTION IF EXISTS public.get_patient_clinical_timeline(uuid, boolean, integer, integer);

CREATE OR REPLACE FUNCTION public.get_patient_clinical_timeline(
  p_patient_id uuid,
  p_include_external boolean DEFAULT true,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  patient_id uuid,
  therapist_id uuid,
  therapist_name text,
  therapist_title text,
  therapist_avatar text,
  entry_type text,
  entry_date timestamp with time zone,
  summary text,
  session_notes text,
  appointment_id uuid,
  assigned_plan_id uuid,
  is_external boolean,
  created_at timestamp with time zone,
  details jsonb,
  source_system text,
  status text,
  session_type text,
  duration_minutes integer,
  care_context text,
  caregiver_present boolean,
  risk_flag boolean,
  is_external_professional boolean,
  visibility text
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ch.id,
    ch.patient_id,
    ch.therapist_id,
    p.full_name as therapist_name,
    td.professional_title as therapist_title,
    tb.avatar_url as therapist_avatar,
    ch.entry_type,
    ch.entry_date,
    -- For external entries (not authored by current user), show limited summary
    CASE
      WHEN ch.therapist_id = auth.uid() AND ch.source_system IS DISTINCT FROM 'referral_clone'
        THEN ch.summary
      ELSE COALESCE(ch.summary, 'Sesión con otro profesional')
    END as summary,
    -- Hide session_notes for external entries, but show for cloned (read-only)
    CASE
      WHEN ch.therapist_id = auth.uid() THEN ch.session_notes
      WHEN ch.source_system = 'referral_clone' THEN ch.session_notes
      ELSE NULL
    END as session_notes,
    ch.appointment_id,
    ch.assigned_plan_id,
    -- is_external: true if not authored by current user OR if cloned from referral
    (ch.therapist_id != auth.uid() OR ch.source_system = 'referral_clone' OR (ch.details->>'is_cloned')::boolean = true) as is_external,
    ch.created_at,
    ch.details,
    ch.source_system,
    ch.status,
    ch.session_type,
    ch.duration_minutes,
    ch.care_context,
    ch.caregiver_present,
    ch.risk_flag,
    (ch.is_external) as is_external_professional,
    ch.visibility
  FROM clinical_history ch
  LEFT JOIN profiles p ON ch.therapist_id = p.id
  LEFT JOIN therapist_details td ON ch.therapist_id = td.user_id
  LEFT JOIN therapist_branding tb ON ch.therapist_id = tb.therapist_id
  WHERE ch.patient_id = p_patient_id
    AND (p_include_external = true OR ch.therapist_id = auth.uid())
  ORDER BY ch.entry_date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
