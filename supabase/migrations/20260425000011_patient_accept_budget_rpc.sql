-- ============================================================
-- RPC para que el paciente acepte un presupuesto
-- ============================================================
-- El paciente NO tiene UPDATE en treatment_budgets (solo SELECT).
-- Esta función SECURITY DEFINER valida y permite la transición
-- enviado → aceptado solo si el budget pertenece al paciente.
-- ============================================================

CREATE OR REPLACE FUNCTION public.accept_budget(p_budget_id uuid)
RETURNS public.treatment_budgets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.treatment_budgets;
BEGIN
  -- Verificar que el budget pertenece al usuario (vía patients.profile_id)
  IF NOT EXISTS (
    SELECT 1
    FROM public.treatment_budgets b
    JOIN public.patients p ON p.id = b.patient_id
    WHERE b.id = p_budget_id
      AND p.profile_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'No autorizado: este presupuesto no te pertenece.';
  END IF;

  -- Solo permite si está en estado enviado
  UPDATE public.treatment_budgets
  SET status = 'aceptado',
      accepted_at = now(),
      updated_at = now()
  WHERE id = p_budget_id
    AND status = 'enviado'
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'El presupuesto no se puede aceptar (puede que ya esté aceptado o cancelado).';
  END IF;

  RETURN result;
END $$;

GRANT EXECUTE ON FUNCTION public.accept_budget(uuid) TO authenticated;
