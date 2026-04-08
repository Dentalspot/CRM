-- =============================================================================
-- MIGRATION: Optimizar queries N+1 de pacientes
-- Fecha: 2026-04-01
--
-- Problema: getPatientFile() hace 8 roundtrips al DB
-- Solucion: RPC que retorna todo en un solo roundtrip
-- =============================================================================

-- 1. RPC para obtener la ficha completa del paciente (reemplaza 8 queries)
CREATE OR REPLACE FUNCTION get_patient_file_complete(p_patient_id uuid, p_therapist_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  v_therapist_id uuid;
BEGIN
  -- Resolve therapist_id from patient if not provided
  IF p_therapist_id IS NULL THEN
    SELECT therapist_id INTO v_therapist_id FROM patients WHERE id = p_patient_id;
  ELSE
    v_therapist_id := p_therapist_id;
  END IF;

  SELECT jsonb_build_object(
    'patient', (
      SELECT row_to_json(p.*)::jsonb || jsonb_build_object(
        'profile', (SELECT row_to_json(pr.*) FROM profiles pr WHERE pr.id = p.profile_id),
        'therapist', (SELECT jsonb_build_object('id', pr.id, 'full_name', pr.full_name, 'email', pr.email) FROM profiles pr WHERE pr.id = p.therapist_id)
      )
      FROM patients p WHERE p.id = p_patient_id
    ),
    'goals', COALESCE((
      SELECT jsonb_agg(g ORDER BY g.created_at DESC)
      FROM (
        SELECT pg.*, row_to_json(pda.*)::jsonb AS area
        FROM patient_goals pg
        LEFT JOIN patient_development_areas pda ON pg.area_id = pda.id
        WHERE pg.patient_id = p_patient_id
      ) g
    ), '[]'::jsonb),
    'plans', COALESCE((
      SELECT jsonb_agg(ap ORDER BY ap.created_at DESC)
      FROM (
        SELECT pap.*, row_to_json(tp.*)::jsonb AS plan
        FROM patient_assigned_plans pap
        LEFT JOIN treatment_plans tp ON pap.plan_template_id = tp.id
        WHERE pap.patient_id = p_patient_id
      ) ap
    ), '[]'::jsonb),
    'clinicalHistory', COALESCE((
      SELECT jsonb_agg(ch_row ORDER BY ch_row.entry_date DESC)
      FROM (
        SELECT ch.*, jsonb_build_object('id', pr.id, 'full_name', pr.full_name) AS therapist
        FROM clinical_history ch
        LEFT JOIN profiles pr ON ch.therapist_id = pr.id
        WHERE ch.patient_id = p_patient_id
        LIMIT 50
      ) ch_row
    ), '[]'::jsonb),
    'evaluations', COALESCE((
      SELECT jsonb_agg(ev ORDER BY ev.evaluation_date DESC)
      FROM (
        SELECT pe.*, jsonb_build_object('id', pr.id, 'full_name', pr.full_name) AS therapist
        FROM patient_evaluations pe
        LEFT JOIN profiles pr ON pe.therapist_id = pr.id
        WHERE pe.patient_id = p_patient_id
      ) ev
    ), '[]'::jsonb),
    'privateNotes', COALESCE((
      SELECT content FROM patient_private_notes
      WHERE patient_id = p_patient_id AND therapist_id = v_therapist_id
      LIMIT 1
    ), ''),
    'documents', COALESCE((
      SELECT jsonb_agg(d ORDER BY d.created_at DESC)
      FROM patient_documents d
      WHERE d.patient_id = p_patient_id
    ), '[]'::jsonb),
    'appointments', COALESCE((
      SELECT jsonb_agg(a ORDER BY a.date DESC)
      FROM appointments a
      WHERE a.patient_id = p_patient_id
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

-- 2. RPC para stats del terapeuta (reemplaza 3 count queries)
CREATE OR REPLACE FUNCTION get_therapist_stats(p_therapist_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_patients bigint;
  v_appointments bigint;
  v_documents bigint;
BEGIN
  SELECT count(*) INTO v_patients
  FROM patients WHERE therapist_id = p_therapist_id AND status = 'active';

  SELECT count(*) INTO v_appointments
  FROM appointments WHERE therapist_id = p_therapist_id AND status = 'scheduled';

  SELECT count(*) INTO v_documents
  FROM patient_documents WHERE therapist_id = p_therapist_id;

  RETURN jsonb_build_object(
    'totalPatients', v_patients,
    'scheduledAppointments', v_appointments,
    'totalDocuments', v_documents
  );
END;
$$;
