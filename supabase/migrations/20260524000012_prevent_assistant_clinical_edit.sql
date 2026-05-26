-- Hardening rol asistente (Ley 20.584 — deuda compliance, prioridad Alta).
--
-- Problema: la policy pat_assistant_update permite a la asistente UPDATE de
-- cualquier paciente de su org SIN restricción de columnas → podía editar
-- campos clínicos (historia médica, diagnóstico, alergias, etc.). La ficha
-- clínica detallada debe quedar reservada a los profesionales (Ley 20.584).
--
-- Fix: trigger análogo a prevent_patient_clinical_edit, pero para la
-- asistente. Si el editor es asistente de la org del paciente y NO tiene rol
-- clínico (dentist/clinic_admin) ni es el dentista dueño, se bloquean los
-- campos clínicos. La asistente SÍ puede editar datos administrativos
-- (nombre, contacto, estado, fechas operativas) que necesita para recepción.
--
-- Defensa en profundidad (Constitution II): la seguridad vive en la BD, no
-- en la UI.

CREATE OR REPLACE FUNCTION public.prevent_assistant_clinical_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- El dentista (dueño o miembro 'dentist') y el clinic_admin pueden editar
  -- todo. Solo restringimos cuando el editor es asistente sin rol clínico.
  IF OLD.therapist_id = auth.uid()
     OR is_org_member(OLD.organization_id, 'dentist')
     OR is_org_member(OLD.organization_id, 'clinic_admin')
  THEN
    RETURN NEW;
  END IF;

  -- Si el editor es asistente de la org del paciente → bloquear campos clínicos.
  IF is_org_member(OLD.organization_id, 'assistant') THEN
    IF NEW.medical_history      IS DISTINCT FROM OLD.medical_history
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
       OR NEW.notes                IS DISTINCT FROM OLD.notes
       OR NEW.anamnesis_template   IS DISTINCT FROM OLD.anamnesis_template
       OR NEW.evaluation_template  IS DISTINCT FROM OLD.evaluation_template
    THEN
      RAISE EXCEPTION 'Los asistentes no pueden editar campos clínicos de la ficha del paciente (Ley 20.584).'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_prevent_assistant_clinical_edit ON public.patients;
CREATE TRIGGER trg_prevent_assistant_clinical_edit
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_assistant_clinical_edit();
