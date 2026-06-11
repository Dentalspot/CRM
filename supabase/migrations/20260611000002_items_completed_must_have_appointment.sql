-- ============================================================
-- Smoke E2E hallazgo: items completed sin appointment_id rompen trazabilidad
-- ============================================================
-- Durante el smoke E2E de Solange Vulasich se detecto que 2 items completed
-- tenian `completed_in_appointment_id = NULL`. Causa: marcado por SQL directo
-- durante testing legacy, no por el wizard (que SI pasa appointmentId).
--
-- Defensa a nivel DB: agregar CHECK constraint que impide INSERT/UPDATE
-- de un item con status='completed' sin un appointment_id. Si alguien intenta
-- via SQL directo, Postgres rechaza con violacion de constraint.
--
-- Requiere backfill previo de items legacy (ejecutado en sesion 2026-06-11).
-- ============================================================

-- Validacion: asegurar que no quedan items legacy con NULL
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.treatment_budget_items
  WHERE status = 'completed' AND completed_in_appointment_id IS NULL;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Hay % items completed sin appointment_id. Backfill requerido antes de aplicar constraint.', v_count;
  END IF;
END $$;

ALTER TABLE public.treatment_budget_items
  DROP CONSTRAINT IF EXISTS items_completed_must_have_appointment;

ALTER TABLE public.treatment_budget_items
  ADD CONSTRAINT items_completed_must_have_appointment
  CHECK (
    status <> 'completed' OR completed_in_appointment_id IS NOT NULL
  );

COMMENT ON CONSTRAINT items_completed_must_have_appointment ON public.treatment_budget_items IS
  'Trazabilidad clinica: cualquier item con status=completed debe tener appointment_id que indica en que cita se ejecuto. Defensa de DB contra updates SQL directos. El wizard PostSession siempre pasa appointmentId (validado en markBudgetItemsCompleted).';
