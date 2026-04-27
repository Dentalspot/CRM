-- ============================================================
-- Micro-bloque #1.1: Folio auto-incremental + discount como %
-- ============================================================
-- Ajustes al schema de presupuestos:
--   1. Folio auto-incremental por dentista (budget_number)
--   2. Cambiar discount (monto) → discount_percentage (0-100)
--   3. Actualizar trigger de recálculo
-- ============================================================

-- ============================================================
-- 1) Folio auto-incremental por dentista
-- ============================================================
ALTER TABLE public.treatment_budgets
  ADD COLUMN budget_number integer;

CREATE UNIQUE INDEX uq_budgets_therapist_number
  ON public.treatment_budgets(therapist_id, budget_number);

CREATE OR REPLACE FUNCTION public.assign_budget_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.budget_number IS NULL THEN
    SELECT COALESCE(MAX(budget_number), 0) + 1
    INTO NEW.budget_number
    FROM public.treatment_budgets
    WHERE therapist_id = NEW.therapist_id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_assign_budget_number
BEFORE INSERT ON public.treatment_budgets
FOR EACH ROW EXECUTE FUNCTION public.assign_budget_number();

COMMENT ON COLUMN public.treatment_budgets.budget_number IS
  'Folio auto-incremental por dentista (cada therapist tiene su propia secuencia 1,2,3...).';

-- ============================================================
-- 2) Discount como porcentaje
-- ============================================================
ALTER TABLE public.treatment_budgets
  RENAME COLUMN discount TO discount_percentage;

ALTER TABLE public.treatment_budgets
  ALTER COLUMN discount_percentage SET DEFAULT 0;

ALTER TABLE public.treatment_budgets
  ADD CONSTRAINT chk_discount_pct
  CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

COMMENT ON COLUMN public.treatment_budgets.discount_percentage IS
  'Descuento aplicado al subtotal, en porcentaje (0 a 100).';

-- ============================================================
-- 3) Actualizar trigger de recálculo (usa porcentaje)
-- ============================================================
CREATE OR REPLACE FUNCTION public.recalc_budget_total()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  target_budget_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_budget_id := OLD.budget_id;
  ELSE
    target_budget_id := NEW.budget_id;
  END IF;

  UPDATE public.treatment_budgets b
  SET
    subtotal = COALESCE(
      (SELECT SUM(subtotal) FROM public.treatment_budget_items WHERE budget_id = target_budget_id),
      0
    ),
    total = ROUND(
      COALESCE(
        (SELECT SUM(subtotal) FROM public.treatment_budget_items WHERE budget_id = target_budget_id),
        0
      ) * (1 - b.discount_percentage / 100.0),
      2
    ),
    updated_at = now()
  WHERE b.id = target_budget_id;

  RETURN COALESCE(NEW, OLD);
END $$;

-- ============================================================
-- 4) Actualizar la vista v_budget_balance (no cambia su lógica,
--    pero por consistencia exponemos discount_percentage)
-- ============================================================
DROP VIEW IF EXISTS public.v_budget_balance;

CREATE VIEW public.v_budget_balance AS
SELECT
  b.id AS budget_id,
  b.budget_number,
  b.patient_id,
  b.therapist_id,
  b.clinic_id,
  b.title,
  b.status,
  b.subtotal,
  b.discount_percentage,
  b.total,
  b.currency,
  COALESCE(SUM(pp.amount) FILTER (WHERE pp.status = 'completed'), 0) AS total_paid,
  b.total - COALESCE(SUM(pp.amount) FILTER (WHERE pp.status = 'completed'), 0) AS balance_due,
  COUNT(pp.id) FILTER (WHERE pp.status = 'completed') AS payment_count
FROM public.treatment_budgets b
LEFT JOIN public.patient_payments pp ON pp.budget_id = b.id
GROUP BY b.id;

GRANT SELECT ON public.v_budget_balance TO authenticated;
