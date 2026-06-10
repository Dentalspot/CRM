-- ============================================================
-- Spec 030 followup: descuento por item del presupuesto
-- ============================================================
-- Permite aplicar descuento individual a una intervención
-- (ej. limpieza con 20% off como cortesía), independiente del
-- descuento total del presupuesto.
--
-- Sin breaking: default 0, subtotal calculado en cliente.
-- ============================================================

ALTER TABLE public.treatment_budget_items
  ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2) NOT NULL DEFAULT 0
    CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

COMMENT ON COLUMN public.treatment_budget_items.discount_percentage IS
  'Spec 030 followup: descuento aplicado a este item específico (0-100%). Se compone con el descuento total del budget.';
