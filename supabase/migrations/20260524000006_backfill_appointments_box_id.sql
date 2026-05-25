-- Backfill: asignar box_id a citas legacy sin box.
--
-- Contexto: tras introducir agenda por box, las citas creadas antes (o desde
-- flujos sin box seleccionado) quedaron con box_id NULL. Esas citas eran
-- invisibles en la grilla por box pero seguían bloqueando horarios vía
-- check_patient_double_booking → "ya tiene cita" pero "no veo a nadie".
-- El frontend ya las muestra (filteredAppointments incluye box_id NULL), y
-- este backfill las ancla al primer box de su clínica para consistencia.
--
-- Robustez: UPDATE fila por fila con EXCEPTION handling. Si asignar box a una
-- cita viola el trigger check_appointment_box (double-booking en ese box) o
-- el unique constraint unique_appointment_slot (duplicado legacy), esa fila
-- se SALTA y queda con box_id NULL (sigue visible por el fix de frontend).
-- Así un caso borde no aborta todo el backfill.

DO $$
DECLARE
  r RECORD;
  v_box_id uuid;
  v_assigned int := 0;
  v_skipped int := 0;
BEGIN
  FOR r IN
    SELECT id, clinic_id
    FROM public.appointments
    WHERE box_id IS NULL AND clinic_id IS NOT NULL
  LOOP
    -- Primer box activo de la clínica (lex asc), igual criterio que blocked_times
    SELECT cb.id INTO v_box_id
    FROM public.clinic_boxes cb
    WHERE cb.clinic_id = r.clinic_id AND cb.is_active = true
    ORDER BY cb.name ASC
    LIMIT 1;

    IF v_box_id IS NULL THEN
      -- Clínica sin boxes activos → no se puede asignar, dejar NULL
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    BEGIN
      UPDATE public.appointments SET box_id = v_box_id WHERE id = r.id;
      v_assigned := v_assigned + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Conflicto (double-booking en box o unique constraint) → saltar
      RAISE NOTICE 'Backfill skip appointment % (clinic %): %', r.id, r.clinic_id, SQLERRM;
      v_skipped := v_skipped + 1;
    END;
  END LOOP;

  RAISE NOTICE 'Backfill box_id done: % assigned, % skipped', v_assigned, v_skipped;
END $$;
