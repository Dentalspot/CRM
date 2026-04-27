-- ============================================================
-- Fix: organization_id NOT NULL bloqueaba inserts de dentistas privados
-- ============================================================
-- patient_payments.organization_id era NOT NULL, pero el flujo de
-- presupuestos puede tener dentistas privados (sin org) o pacientes
-- sin organization_id seteado.
--
-- Solución:
--   1. Permitir NULL en organization_id
--   2. Trigger BEFORE INSERT que autocompleta desde patients.organization_id
-- ============================================================

ALTER TABLE public.patient_payments
  ALTER COLUMN organization_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.autofill_payment_organization_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.patient_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.patients
    WHERE id = NEW.patient_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_autofill_payment_org_id ON public.patient_payments;
CREATE TRIGGER trg_autofill_payment_org_id
BEFORE INSERT ON public.patient_payments
FOR EACH ROW EXECUTE FUNCTION public.autofill_payment_organization_id();
