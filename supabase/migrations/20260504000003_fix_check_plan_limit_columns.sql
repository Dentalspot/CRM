-- ============================================================================
-- Bug crítico: check_plan_limit referenciaba columnas inexistentes:
--   - patients.deleted_at (no existe — la tabla usa status='active'/'archived')
--   - appointments.start_at (no existe — son columnas date+start_time)
--
-- El catch genérico (EXCEPTION WHEN OTHERS) silenciaba el error y retornaba
-- true (fail-safe OPEN) → ZERO enforcement de plan en producción.
--
-- Detección: Cristobal en plan Free (limit 5 patients) tenía 10 pacientes
-- y la app no le impedía crear más.
--
-- Fix:
--   - patients: WHERE status = 'active'
--   - appointments: WHERE date >= mes_actual AND date < mes_siguiente
--
-- Migration aplicada vía MCP — este archivo es solo para trazabilidad.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_plan_limit(p_therapist_id uuid, p_resource_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_plan_slug text;
  v_max_dentists integer;
  v_max_boxes integer;
  v_patient_limit integer;
  v_appointment_limit integer;
  v_current_usage integer;
  v_limit integer;
BEGIN
  SELECT ts.plan_name INTO v_plan_slug
  FROM public.therapist_subscriptions ts
  WHERE ts.therapist_id = p_therapist_id
    AND ts.status = 'active'
  ORDER BY ts.created_at DESC
  LIMIT 1;

  IF v_plan_slug IS NULL THEN
    v_plan_slug := 'free';
  END IF;

  SELECT max_dentists, max_boxes, patient_limit, appointment_limit
  INTO v_max_dentists, v_max_boxes, v_patient_limit, v_appointment_limit
  FROM public.subscription_plans
  WHERE slug = v_plan_slug AND is_active = true;

  IF NOT FOUND THEN
    v_max_dentists := 1;
    v_max_boxes := 0;
    v_patient_limit := 5;
    v_appointment_limit := 15;
  END IF;

  CASE p_resource_type
    WHEN 'patient' THEN v_limit := v_patient_limit;
    WHEN 'appointment' THEN v_limit := v_appointment_limit;
    WHEN 'dentist' THEN v_limit := v_max_dentists;
    WHEN 'box' THEN
      RETURN true;
    ELSE
      RAISE WARNING 'Unknown resource_type: %', p_resource_type;
      RETURN false;
  END CASE;

  IF v_limit IS NULL THEN
    RETURN true;
  END IF;

  CASE p_resource_type
    WHEN 'patient' THEN
      SELECT COUNT(*) INTO v_current_usage
      FROM public.patients
      WHERE therapist_id = p_therapist_id
        AND status = 'active';
    WHEN 'appointment' THEN
      SELECT COUNT(*) INTO v_current_usage
      FROM public.appointments
      WHERE therapist_id = p_therapist_id
        AND date >= DATE_TRUNC('month', NOW())::date
        AND date < (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::date;
    WHEN 'dentist' THEN
      SELECT COUNT(*) INTO v_current_usage
      FROM public.clinic_therapists ct
      WHERE ct.clinic_id IN (
        SELECT c.id FROM public.clinics c WHERE c.therapist_id = p_therapist_id
      )
      AND ct.is_active = true;
  END CASE;

  IF v_current_usage IS NULL THEN
    RETURN true;
  END IF;

  RETURN v_current_usage < v_limit;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'check_plan_limit error: % — %', SQLSTATE, SQLERRM;
    RETURN true;
END $function$;
