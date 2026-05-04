-- ============================================================================
-- Bug G (QA prod): marcar cita como "completada" fallaba con
-- "null value in column organization_id of relation clinical_history".
--
-- Causa: el trigger create_clinical_history_from_appointment hacía INSERT en
-- clinical_history sin propagar NEW.organization_id, y la columna es NOT NULL.
--
-- Fix: incluir NEW.organization_id en el INSERT. Tambien fijo search_path
-- explicito para alinear con buenas practicas SECURITY DEFINER.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_clinical_history_from_appointment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    IF NOT EXISTS (
      SELECT 1 FROM clinical_history WHERE appointment_id = NEW.id
    ) THEN
      INSERT INTO clinical_history (
        patient_id,
        therapist_id,
        organization_id,
        entry_type,
        entry_date,
        summary,
        appointment_id,
        is_external,
        created_at
      ) VALUES (
        NEW.patient_id,
        NEW.therapist_id,
        NEW.organization_id,
        'sesion_terapia',
        (NEW.date || ' ' || NEW.start_time)::timestamp,
        COALESCE(NEW.notes, 'Sesión completada'),
        NEW.id,
        false,
        NOW()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
