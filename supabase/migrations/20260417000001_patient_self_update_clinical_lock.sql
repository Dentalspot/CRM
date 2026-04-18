-- =============================================================================
-- Hardening RLS rol `patient` sobre `public.patients`
-- =============================================================================
--
-- La policy `patients_update_own` permite UPDATE sobre la fila propia
-- (profile_id = auth.uid()) sin restriccion por columna. PostgreSQL RLS no
-- soporta granularidad por columna en USING/WITH CHECK, y `GRANT UPDATE (col)`
-- por columna no funciona en Supabase porque todos los usuarios autenticados
-- comparten el rol `authenticated` (afectaria tambien al dentista).
--
-- Este trigger BEFORE UPDATE complementa la policy: si el caller es el propio
-- paciente (dueño de la fila previa), rechaza cualquier cambio a columnas
-- clinicas sensibles o de asignacion/aislamiento. Si el caller no es self
-- (dentist, clinic_admin, assistant, service_role), pasa sin restriccion.
--
-- DECISION CRITICA: la deteccion de "self-update" usa OLD.profile_id, no
-- NEW.profile_id. Si se usara NEW, un paciente que intentara cambiar
-- `profile_id` a otro auth.uid() en el mismo UPDATE haria que la condicion
-- NEW.profile_id = auth.uid() fallara y el trigger no aplicaria (bypass).
-- OLD.profile_id refleja la propiedad real de la fila antes del cambio.
--
-- COMPROMISO TEMPORAL DOCUMENTADO: la columna `alerts` (jsonb) queda FUERA
-- de la blacklist porque el portal patient la usa para `emergency_contact`
-- (autogestionable). Toda alerta clinica del dentista debe almacenarse en
-- `clinical_alerts` (text, sí bloqueada), NUNCA en `alerts`. Si en el
-- futuro `alerts` aloja informacion clinica, este trigger debe rediseñarse
-- con granularidad por path JSON.
--
-- DEUDA CONOCIDA (enfoque blacklist): cada nueva columna clinica que se
-- agregue a `patients` queda editable por defecto hasta que se incluya
-- explicitamente en este trigger. Toda migracion futura que agregue
-- columnas clinicas a `patients` DEBE actualizar la lista en esta funcion.
--
-- Reversible:
--   DROP TRIGGER IF EXISTS trg_prevent_patient_clinical_edit ON public.patients;
--   DROP FUNCTION IF EXISTS public.prevent_patient_clinical_edit();
-- =============================================================================

CREATE OR REPLACE FUNCTION public.prevent_patient_clinical_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Self-update se decide por OLD.profile_id (propiedad previa al cambio),
  -- no por NEW.profile_id (que el caller podria intentar manipular).
  IF OLD.profile_id IS NULL OR OLD.profile_id <> auth.uid() THEN
    RETURN NEW;
  END IF;

  -- Bloque 1: campos de asignacion / aislamiento.
  -- El paciente no puede re-asignar la fila a otro profile, organizacion,
  -- dentista o clinica.
  IF NEW.profile_id      IS DISTINCT FROM OLD.profile_id
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.therapist_id    IS DISTINCT FROM OLD.therapist_id
     OR NEW.clinic_id       IS DISTINCT FROM OLD.clinic_id
  THEN
    RAISE EXCEPTION 'Patients cannot modify assignment or isolation fields on their own record'
      USING ERRCODE = '42501';
  END IF;

  -- Bloque 2: columnas clinicas sensibles.
  IF NEW.medical_history       IS DISTINCT FROM OLD.medical_history
     OR NEW.diagnosis            IS DISTINCT FROM OLD.diagnosis
     OR NEW.diagnosis_summary    IS DISTINCT FROM OLD.diagnosis_summary
     OR NEW.allergies            IS DISTINCT FROM OLD.allergies
     OR NEW.other_info           IS DISTINCT FROM OLD.other_info
     OR NEW.medications          IS DISTINCT FROM OLD.medications
     OR NEW.systemic_diseases    IS DISTINCT FROM OLD.systemic_diseases
     OR NEW.pregnancy            IS DISTINCT FROM OLD.pregnancy
     OR NEW.surgical_history     IS DISTINCT FROM OLD.surgical_history
     OR NEW.clinical_alerts      IS DISTINCT FROM OLD.clinical_alerts
     OR NEW.consultation_reason  IS DISTINCT FROM OLD.consultation_reason
     OR NEW.treatment_stage      IS DISTINCT FROM OLD.treatment_stage
     OR NEW.admission_date       IS DISTINCT FROM OLD.admission_date
     OR NEW.discharge_date       IS DISTINCT FROM OLD.discharge_date
     OR NEW.last_appointment_date IS DISTINCT FROM OLD.last_appointment_date
     OR NEW.status               IS DISTINCT FROM OLD.status
     OR NEW.notes                IS DISTINCT FROM OLD.notes
     OR NEW.is_blacklisted       IS DISTINCT FROM OLD.is_blacklisted
     OR NEW.anamnesis_template   IS DISTINCT FROM OLD.anamnesis_template
     OR NEW.evaluation_template  IS DISTINCT FROM OLD.evaluation_template
     OR NEW.attention_type       IS DISTINCT FROM OLD.attention_type
  THEN
    RAISE EXCEPTION 'Patients cannot modify clinical fields on their own record'
      USING ERRCODE = '42501';
  END IF;

  -- Permitidas explicitamente (no listadas, evaluadas por exclusion):
  --   patient_type, responsible_name, responsible_rut, birth_city, nationality,
  --   address, emergency_contact_name, emergency_contact_phone,
  --   communication_channel, avatar_url,
  --   full_name, rut, phone, email (denormalizados admin),
  --   alerts (compromiso temporal documentado),
  --   clinical_consent_signed, clinical_consent_date, notiz_consent (compliance),
  --   updated_at (auto).

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_patient_clinical_edit ON public.patients;

CREATE TRIGGER trg_prevent_patient_clinical_edit
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_patient_clinical_edit();

COMMENT ON FUNCTION public.prevent_patient_clinical_edit() IS
  'Hardening rol patient sobre patients: rechaza UPDATE de columnas clinicas o de asignacion cuando OLD.profile_id = auth.uid(). Complementa la policy patients_update_own. La columna alerts queda fuera por compromiso temporal (ver migracion 20260417000001).';
