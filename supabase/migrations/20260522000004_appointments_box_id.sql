-- ============================================================
-- Feature: appointments.box_id (Fase 2 de Gestión de Clínicas)
-- ============================================================
-- Cada cita puede referenciar un box específico (sala/sillón físico)
-- donde será atendida. Es opcional (backward-compatible): citas
-- existentes y nuevas sin box quedan con box_id=NULL.
--
-- Reglas de validación enforced por trigger BEFORE INSERT/UPDATE:
--   1. Box debe pertenecer a la misma clinic que la cita
--   2. Box debe estar is_active=true
--   3. Si status='scheduled' y box_id no es null, no puede solaparse con
--      otra cita scheduled en el mismo box el mismo día (anti
--      double-booking del recurso físico)
--
-- Las reglas se enforced en DB para que el self-booking link (idea
-- backlog) NO pueda agendar en un box ocupado por race condition.
-- ============================================================

-- Columna nullable + FK con ON DELETE SET NULL (si el box se borra,
-- la cita queda sin box pero no se borra)
ALTER TABLE "public"."appointments"
  ADD COLUMN IF NOT EXISTS "box_id" uuid
  REFERENCES "public"."clinic_boxes"("id") ON DELETE SET NULL;

-- Índice parcial para queries del tipo "qué citas tiene Box X este día"
CREATE INDEX IF NOT EXISTS "idx_appointments_box_date"
  ON "public"."appointments" ("box_id", "date")
  WHERE "box_id" IS NOT NULL;

-- Trigger function: 2 validaciones combinadas
CREATE OR REPLACE FUNCTION "public"."check_appointment_box"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_box_clinic_id uuid;
  v_box_active boolean;
BEGIN
  -- Sin box, no hay nada que validar
  IF NEW.box_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 1) Box debe pertenecer a la misma clinic + activo
  SELECT clinic_id, is_active
  INTO v_box_clinic_id, v_box_active
  FROM public.clinic_boxes WHERE id = NEW.box_id;

  IF v_box_clinic_id IS NULL THEN
    RAISE EXCEPTION 'box_not_found: el box % no existe', NEW.box_id;
  END IF;

  IF v_box_clinic_id != NEW.clinic_id THEN
    RAISE EXCEPTION 'box_wrong_clinic: el box pertenece a otra clínica (%) y no a la de la cita (%)', v_box_clinic_id, NEW.clinic_id;
  END IF;

  IF NOT v_box_active THEN
    RAISE EXCEPTION 'box_inactive: el box está marcado como inactivo y no acepta nuevas citas';
  END IF;

  -- 2) Anti double-booking: solo enforce si status='scheduled'.
  -- Citas canceladas/completadas no bloquean futuras citas.
  IF NEW.status = 'scheduled' THEN
    IF EXISTS (
      SELECT 1 FROM public.appointments
      WHERE box_id = NEW.box_id
        AND status = 'scheduled'
        AND date = NEW.date
        AND id IS DISTINCT FROM NEW.id
        AND (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
    ) THEN
      RAISE EXCEPTION 'box_double_booking: ya hay una cita programada en este box que se superpone con el horario solicitado'
        USING HINT = 'Elegí otro box o cambiá el horario de la cita.';
    END IF;
  END IF;

  RETURN NEW;
END
$$;

-- Trigger: dispara en INSERT y en UPDATE de los campos relevantes
CREATE TRIGGER "trg_check_appointment_box"
  BEFORE INSERT OR UPDATE OF "box_id", "start_time", "end_time", "date", "status"
  ON "public"."appointments"
  FOR EACH ROW EXECUTE FUNCTION "public"."check_appointment_box"();

COMMENT ON COLUMN "public"."appointments"."box_id" IS
  'Box (sala/sillón) físico donde se atiende la cita. Nullable: citas legacy sin asignación o creadas sin elegir box quedan en NULL. Si se setea, trigger trg_check_appointment_box valida: (1) box pertenece a la misma clinic_id, (2) box is_active=true, (3) anti double-booking en mismo box+día+horario.';
