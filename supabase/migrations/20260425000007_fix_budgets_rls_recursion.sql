-- ============================================================
-- Fix: recursión infinita en RLS al insertar presupuestos
-- ============================================================
-- Causa: las policies de treatment_budgets hacían SELECT a team_members,
-- y team_members tiene una policy "Team members can view their clinic
-- members" que se referencia a sí misma → recursión.
--
-- Fix: helper function SECURITY DEFINER que bypasea RLS para verificar
-- membresía sin disparar la policy recursiva.
-- ============================================================

-- 1) Función helper: ¿el usuario actual pertenece a esta clínica?
CREATE OR REPLACE FUNCTION public.is_active_team_member(p_clinic_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE clinic_id = p_clinic_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

-- 2) Función helper: ¿el usuario actual tiene permiso de billing en esta clínica?
CREATE OR REPLACE FUNCTION public.has_billing_permission(p_clinic_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE clinic_id = p_clinic_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND COALESCE((permissions->>'can_view_billing')::boolean, false) = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_active_team_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_billing_permission(uuid) TO authenticated;

-- 3) Reemplazar policies problemáticas
DROP POLICY IF EXISTS budgets_team_select ON public.treatment_budgets;
DROP POLICY IF EXISTS budgets_team_update ON public.treatment_budgets;

CREATE POLICY budgets_team_select ON public.treatment_budgets
  FOR SELECT
  USING (
    clinic_id IS NOT NULL
    AND public.is_active_team_member(clinic_id)
  );

CREATE POLICY budgets_team_update ON public.treatment_budgets
  FOR UPDATE
  USING (
    clinic_id IS NOT NULL
    AND public.has_billing_permission(clinic_id)
  );
