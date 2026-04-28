-- ============================================================
-- Micro-bloque #5: Comisión snapshot + vista de reportes de ingresos
-- ============================================================
-- 1. Agrega commission_percent a patient_payments (snapshot al INSERT)
-- 2. Trigger autocompleta desde clinic_therapists si budget tiene clinic_id
-- 3. Vista v_income_summary con neto/comisión calculados
-- ============================================================

-- 1) Columna commission_percent (snapshot)
ALTER TABLE public.patient_payments
  ADD COLUMN IF NOT EXISTS commission_percent numeric(5,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.patient_payments.commission_percent IS
  'Snapshot del % de comisión que retiene la clínica al momento del pago. 0 si no hay clínica.';

-- 2) Trigger BEFORE INSERT: poblar commission desde clinic_therapists del budget
CREATE OR REPLACE FUNCTION public.autofill_payment_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id uuid;
  v_therapist_id uuid;
  v_pct numeric(5,2);
BEGIN
  -- Solo si no se proveyó manualmente (permitimos override)
  IF NEW.commission_percent IS NOT NULL AND NEW.commission_percent > 0 THEN
    RETURN NEW;
  END IF;

  -- Si no hay budget asociado, comisión = 0 (consulta sin presupuesto)
  IF NEW.budget_id IS NULL THEN
    NEW.commission_percent := 0;
    RETURN NEW;
  END IF;

  SELECT clinic_id, therapist_id
    INTO v_clinic_id, v_therapist_id
  FROM public.treatment_budgets
  WHERE id = NEW.budget_id;

  -- Sin clínica → 100% al dentista
  IF v_clinic_id IS NULL THEN
    NEW.commission_percent := 0;
    RETURN NEW;
  END IF;

  -- Buscar el % de comisión vigente en clinic_therapists
  SELECT commission_percent INTO v_pct
  FROM public.clinic_therapists
  WHERE clinic_id = v_clinic_id
    AND therapist_id = v_therapist_id
    AND is_active = true
  LIMIT 1;

  NEW.commission_percent := COALESCE(v_pct, 0);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_autofill_payment_commission ON public.patient_payments;

-- IMPORTANTE: este trigger debe correr ANTES que cualquier otro BEFORE
-- (orden alfabético: 'a' va primero que 'trg_autofill_payment_org_id' es 't')
-- Para forzar orden, prefijo con "0_"
CREATE TRIGGER trg_0_autofill_payment_commission
BEFORE INSERT ON public.patient_payments
FOR EACH ROW EXECUTE FUNCTION public.autofill_payment_commission();

-- 3) Vista de reporte de ingresos
DROP VIEW IF EXISTS public.v_income_summary;

CREATE VIEW public.v_income_summary AS
SELECT
  pp.id AS payment_id,
  pp.budget_id,
  b.budget_number,
  b.title AS budget_title,
  b.status AS budget_status,
  pp.therapist_id,
  b.clinic_id,
  pp.patient_id,
  pat.id AS patient_record_id,
  COALESCE(prof.full_name, 'Paciente') AS patient_name,
  pp.amount,
  pp.payment_method,
  pp.payment_date,
  pp.created_at AS registered_at,
  pp.concept,
  pp.commission_percent,
  ROUND(pp.amount * pp.commission_percent / 100.0)::integer AS commission_amount,
  ROUND(pp.amount * (100 - pp.commission_percent) / 100.0)::integer AS net_amount
FROM public.patient_payments pp
LEFT JOIN public.treatment_budgets b ON b.id = pp.budget_id
LEFT JOIN public.patients pat ON pat.id = pp.patient_id
LEFT JOIN public.profiles prof ON prof.id = pat.profile_id
WHERE pp.status = 'completed';

GRANT SELECT ON public.v_income_summary TO authenticated;

COMMENT ON VIEW public.v_income_summary IS
  'Vista consolidada para reportes de ingresos: monto bruto, comisión clínica, neto dentista. RLS heredada de patient_payments.';
