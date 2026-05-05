-- ============================================================================
-- Fix: trigger prevent_patient_clinical_edit usaba `<>` con auth.uid().
-- El operador `<>` con NULL retorna NULL (no TRUE/FALSE), así que cualquier
-- update con auth.uid()=NULL (admin/jobs/MCP) caía a la rama de "modificar
-- fields prohibidos" y rechazaba con 42501.
--
-- Fix: usar IS DISTINCT FROM que maneja NULL correctamente.
-- Migration aplicada vía MCP — este archivo es solo para trazabilidad.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_patient_clinical_edit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF OLD.profile_id IS NULL OR OLD.profile_id IS DISTINCT FROM auth.uid() THEN
    RETURN NEW;
  END IF;

  IF NEW.profile_id      IS DISTINCT FROM OLD.profile_id
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.therapist_id    IS DISTINCT FROM OLD.therapist_id
     OR NEW.clinic_id       IS DISTINCT FROM OLD.clinic_id
  THEN
    RAISE EXCEPTION 'Patients cannot modify assignment or isolation fields on their own record'
      USING ERRCODE = '42501';
  END IF;

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

  RETURN NEW;
END;
$function$;
