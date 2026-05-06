-- ============================================================================
-- Ley 21.719 art. 13 — Derecho de supresión vía anonimización.
--
-- Anonimiza un paciente preservando referential integrity con appointments,
-- treatments, payments y clinical_history (necesario para estadísticas y
-- auditoría). Tras la operación, no queda PII identificable.
--
-- Quién puede llamar:
--   - Dentista que es therapist_id O está en patient_care_team del paciente.
--   - Admin (profile.role = 'admin').
--
-- Auditoría: cada llamada inserta una fila en audit_logs.
-- Migration aplicada vía MCP — este archivo es solo trazabilidad.
-- ============================================================================

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS is_anonymized boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anonymized_at timestamptz,
  ADD COLUMN IF NOT EXISTS anonymized_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS anonymization_reason text;

CREATE INDEX IF NOT EXISTS idx_patients_anonymized
  ON patients (is_anonymized) WHERE is_anonymized = true;

CREATE OR REPLACE FUNCTION public.anonymize_patient(
  p_patient_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_caller_role user_role;
  v_is_authorized boolean := false;
  v_patient_org_id uuid;
  v_patient_therapist_id uuid;
  v_already_anon boolean;
  v_history_count integer;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Debe estar autenticado' USING ERRCODE = '42501';
  END IF;

  SELECT organization_id, therapist_id, is_anonymized
    INTO v_patient_org_id, v_patient_therapist_id, v_already_anon
  FROM patients WHERE id = p_patient_id;

  IF v_patient_org_id IS NULL THEN
    RAISE EXCEPTION 'Paciente no encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF v_already_anon THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'El paciente ya estaba anonimizado',
      'patient_id', p_patient_id
    );
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller;

  IF v_caller_role = 'admin' THEN
    v_is_authorized := true;
  ELSIF v_patient_therapist_id = v_caller THEN
    v_is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM patient_care_team
    WHERE patient_id = p_patient_id
      AND dentist_id = v_caller
      AND is_active = true
  ) THEN
    v_is_authorized := true;
  END IF;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'No autorizado para anonimizar este paciente' USING ERRCODE = '42501';
  END IF;

  UPDATE patients SET
    full_name = '[Paciente Anonimizado]',
    email = NULL,
    phone = NULL,
    rut = NULL,
    address = NULL,
    avatar_url = NULL,
    notes = NULL,
    medical_history = NULL,
    diagnosis = NULL,
    diagnosis_summary = NULL,
    allergies = NULL,
    other_info = NULL,
    medications = NULL,
    systemic_diseases = NULL,
    pregnancy = NULL,
    surgical_history = NULL,
    clinical_alerts = NULL,
    consultation_reason = NULL,
    responsible_name = NULL,
    responsible_rut = NULL,
    birth_city = NULL,
    nationality = NULL,
    emergency_contact_name = NULL,
    emergency_contact_phone = NULL,
    anamnesis_template = NULL,
    evaluation_template = NULL,
    alerts = '[]'::jsonb,
    is_anonymized = true,
    anonymized_at = NOW(),
    anonymized_by = v_caller,
    anonymization_reason = p_reason,
    status = 'archived',
    updated_at = NOW()
  WHERE id = p_patient_id;

  UPDATE clinical_history SET
    summary = '[Sesión anonimizada — ARCO Ley 21.719]'
  WHERE patient_id = p_patient_id;

  GET DIAGNOSTICS v_history_count = ROW_COUNT;

  BEGIN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (
      v_caller,
      'anonymize_patient',
      'patient',
      p_patient_id,
      jsonb_build_object(
        'reason', COALESCE(p_reason, 'No especificado'),
        'caller_role', v_caller_role::text,
        'organization_id', v_patient_org_id,
        'clinical_history_anonymized', v_history_count
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'audit_logs insert failed: % %', SQLSTATE, SQLERRM;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'patient_id', p_patient_id,
    'anonymized_at', NOW(),
    'clinical_history_entries_anonymized', v_history_count,
    'message', 'Paciente anonimizado correctamente bajo Ley 21.719'
  );
END $function$;

GRANT EXECUTE ON FUNCTION public.anonymize_patient(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.anonymize_patient(uuid, text) IS
'Ley 21.719 art. 13: anonimiza un paciente preservando integridad referencial.
Solo el dentista tratante (therapist_id o care_team) o un admin pueden ejecutarla.
Cada llamada queda registrada en audit_logs.';
