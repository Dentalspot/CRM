-- Scope refinado clinic_admin (Ley 20.584): el admin puro no edita la ficha
-- clínica. Extiende el guard prevent_assistant_clinical_edit para cubrir
-- también al clinic_admin.
--
-- Modelo verificado: el dueño-dentista tiene roles 'clinic_admin' + 'dentist'
-- (ej. Cristobal en Los Álamos), mientras que un admin puro tiene solo
-- 'clinic_admin' (ej. Teo en Igeldo). Por eso restringir el clinic_admin
-- por sí solo NO afecta al dueño-dentista: éste sigue editando vía su rol
-- 'dentist'. El admin administrativo puro queda limitado a datos no clínicos.
--
-- Regla nueva: SOLO el dentista (tratante/dueño o member 'dentist') edita
-- campos clínicos. Cualquier otro rol con UPDATE sobre patients (assistant,
-- clinic_admin) queda bloqueado en columnas clínicas.

CREATE OR REPLACE FUNCTION public.prevent_assistant_clinical_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Solo el dentista (dueño/tratante de la ficha o miembro 'dentist' de la
  -- org) puede editar campos clínicos. Esto permite al dueño-dentista que
  -- también es clinic_admin (tiene ambos roles) seguir editando.
  IF OLD.therapist_id = auth.uid()
     OR is_org_member(OLD.organization_id, 'dentist')
  THEN
    RETURN NEW;
  END IF;

  -- Resto de roles con UPDATE sobre patients (assistant, clinic_admin puro)
  -- → no pueden tocar campos clínicos (Ley 20.584). Sí datos administrativos.
  IF is_org_member(OLD.organization_id, 'assistant')
     OR is_org_member(OLD.organization_id, 'clinic_admin')
  THEN
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
      RAISE EXCEPTION 'Solo el profesional tratante puede editar campos clínicos de la ficha (Ley 20.584).'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
