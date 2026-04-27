-- ============================================================
-- Micro-bloque #3: Triggers + RLS para pagos vinculados a presupuestos
-- ============================================================
-- 1) Trigger en patient_payments que actualiza el status del budget
-- 2) RLS extendida: team_members con billing permission pueden registrar
-- 3) Helper: verificar que un payment pertenece al equipo del usuario
-- ============================================================

-- ============================================================
-- 1) Trigger: auto-actualizar status del presupuesto según pagos
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_budget_status_on_payment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_budget_id uuid;
  v_total numeric;
  v_paid numeric;
  v_status public.budget_status;
BEGIN
  -- Determinar budget afectado (insert/update/delete)
  IF TG_OP = 'DELETE' THEN
    target_budget_id := OLD.budget_id;
  ELSE
    target_budget_id := NEW.budget_id;
  END IF;

  IF target_budget_id IS NULL THEN
    RETURN COALESCE(NEW, OLD); -- pago sin presupuesto, no hacer nada
  END IF;

  SELECT total, status INTO v_total, v_status
  FROM public.treatment_budgets
  WHERE id = target_budget_id;

  IF NOT FOUND THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_paid
  FROM public.patient_payments
  WHERE budget_id = target_budget_id
    AND status = 'completed';

  -- Reglas de transición
  IF v_paid >= v_total AND v_total > 0 THEN
    -- Pagado completo
    UPDATE public.treatment_budgets
    SET status = 'pagado',
        completed_at = COALESCE(completed_at, now()),
        updated_at = now()
    WHERE id = target_budget_id
      AND status NOT IN ('pagado', 'cancelado');

  ELSIF v_paid > 0 AND v_status IN ('enviado', 'aceptado') THEN
    -- Primer pago parcial → en_progreso
    UPDATE public.treatment_budgets
    SET status = 'en_progreso',
        updated_at = now()
    WHERE id = target_budget_id;

  ELSIF v_paid = 0 AND v_status IN ('pagado', 'en_progreso') THEN
    -- Si se borraron todos los pagos, revertir a 'enviado'
    UPDATE public.treatment_budgets
    SET status = 'enviado',
        completed_at = NULL,
        updated_at = now()
    WHERE id = target_budget_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_update_budget_status_on_payment ON public.patient_payments;

CREATE TRIGGER trg_update_budget_status_on_payment
AFTER INSERT OR UPDATE OR DELETE ON public.patient_payments
FOR EACH ROW EXECUTE FUNCTION public.update_budget_status_on_payment();

-- ============================================================
-- 2) Helper: ¿el payment pertenece a un budget de mi clínica con billing perm?
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_manage_payment_via_team(p_payment_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.patient_payments pp
    JOIN public.treatment_budgets b ON b.id = pp.budget_id
    WHERE pp.id = p_payment_id
      AND b.clinic_id IS NOT NULL
      AND public.has_billing_permission(b.clinic_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_payment_via_team(uuid) TO authenticated;

-- ============================================================
-- 3) Helper: ¿puedo crear pagos para este budget?
--    (dentista del budget OR team con billing)
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_create_payment_for_budget(p_budget_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.treatment_budgets b
    WHERE b.id = p_budget_id
      AND (
        b.therapist_id = auth.uid()
        OR (b.clinic_id IS NOT NULL AND public.has_billing_permission(b.clinic_id))
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_create_payment_for_budget(uuid) TO authenticated;

-- ============================================================
-- 4) Policies adicionales en patient_payments
-- (existentes intactas: "Therapists can manage..." y "Patients can view...")
-- ============================================================

-- Equipo de la clínica con billing permission: SELECT pagos vinculados
CREATE POLICY payments_team_select ON public.patient_payments
  FOR SELECT
  USING (
    budget_id IS NOT NULL
    AND budget_id IN (
      SELECT id FROM public.treatment_budgets
      WHERE clinic_id IS NOT NULL
        AND public.is_active_team_member(clinic_id)
    )
  );

-- Equipo con billing permission: INSERT pagos para budgets de su clínica
CREATE POLICY payments_team_insert ON public.patient_payments
  FOR INSERT
  WITH CHECK (
    budget_id IS NOT NULL
    AND public.can_create_payment_for_budget(budget_id)
  );

-- Equipo con billing permission: DELETE pagos
CREATE POLICY payments_team_delete ON public.patient_payments
  FOR DELETE
  USING (
    budget_id IS NOT NULL
    AND public.can_manage_payment_via_team(id)
  );
