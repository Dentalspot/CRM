-- ============================================================
-- Update RPC get_therapist_clinics para incluir config de calendario
-- ============================================================
-- Migración 20260522000006 agregó calendar_start_hour, calendar_end_hour
-- y calendar_slot_minutes a clinics. El RPC get_therapist_clinics no
-- las exponía → frontend recibía undefined y caía a defaults.
--
-- Esta migration agrega esas 3 keys al jsonb_build_object retornado.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_therapist_clinics(
  p_therapist_id uuid,
  p_city_id uuid DEFAULT NULL::uuid,
  p_include_stats boolean DEFAULT false,
  p_include_availability boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_clinics JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'address', c.address,
      'phone', c.phone,
      'email', c.email,
      'modalidad', c.modalidad,
      'created_at', c.created_at,
      'calendar_start_hour', c.calendar_start_hour,
      'calendar_end_hour', c.calendar_end_hour,
      'calendar_slot_minutes', c.calendar_slot_minutes
    )
    ORDER BY c.created_at DESC
  ) INTO v_clinics
  FROM clinics c
  WHERE c.therapist_id = p_therapist_id;

  RETURN jsonb_build_object(
    'success', true,
    'clinics', COALESCE(v_clinics, '[]'::JSONB)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unexpected_error',
      'message', SQLERRM
    );
END;
$function$;
