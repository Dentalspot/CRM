-- ============================================================
-- Spec 030: Treatment Budget With Progress (MVP — Bloque 1)
-- ============================================================
-- 1. Agregar status + completed_at + completed_in_appointment_id a items
-- 2. Indices parciales para queries hot-path (pending por budget, completed por apt)
-- 3. Trigger BEFORE UPDATE para validar autoridad de reversion (FR-016)
-- 4. RLS policies UPDATE para dentist + clinic_admin
-- 5. Ampliar CHECK clinical_audit_log.resource_type con budget_item + payment
--
-- Sin cambios destructivos. Sin backfill (default 'pending' seguro).
-- Reversible.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Columnas nuevas en treatment_budget_items
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.treatment_budget_items
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed')),
  ADD COLUMN IF NOT EXISTS completed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS completed_in_appointment_id uuid NULL
    REFERENCES public.appointments(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.treatment_budget_items.status IS
  'Spec 030: estado de ejecucion del item. pending=propuesto, completed=ejecutado en sesion.';
COMMENT ON COLUMN public.treatment_budget_items.completed_at IS
  'Spec 030: timestamp del momento en que se tildo como completado.';
COMMENT ON COLUMN public.treatment_budget_items.completed_in_appointment_id IS
  'Spec 030: cita donde se ejecuto la intervencion. ON DELETE SET NULL preserva el item si la cita se borra.';


-- ──────────────────────────────────────────────────────────────
-- 2. Indices parciales hot-path
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tbi_pending_by_budget
  ON public.treatment_budget_items (budget_id, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_tbi_completed_in_apt
  ON public.treatment_budget_items (completed_in_appointment_id)
  WHERE completed_in_appointment_id IS NOT NULL;


-- ──────────────────────────────────────────────────────────────
-- 3. Trigger autorizacion de reversion (FR-016)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_budget_item_revert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_original_dentist uuid;
  v_org_id uuid;
BEGIN
  -- Solo aplica al revertir completed -> pending
  IF OLD.status = 'completed' AND NEW.status = 'pending' THEN
    -- Auto-reset de campos relacionados
    NEW.completed_at = NULL;
    NEW.completed_in_appointment_id = NULL;

    -- Lookup dentista original + org del budget
    SELECT a.therapist_id, c.organization_id
    INTO v_original_dentist, v_org_id
    FROM public.appointments a
    JOIN public.treatment_budgets b ON b.id = OLD.budget_id
    JOIN public.clinics c ON c.id = b.clinic_id
    WHERE a.id = OLD.completed_in_appointment_id;

    -- Validar: dentista original O admin de la org
    IF v_original_dentist IS DISTINCT FROM auth.uid()
       AND NOT is_org_member(v_org_id, 'clinic_admin') THEN
      RAISE EXCEPTION
        'unauthorized_revert: solo el dentista que marco este item o un admin de la org pueden revertirlo'
        USING HINT = 'Pedile al dentista original o a un admin que haga la reversion.';
    END IF;
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_check_budget_item_revert ON public.treatment_budget_items;
CREATE TRIGGER trg_check_budget_item_revert
  BEFORE UPDATE OF status ON public.treatment_budget_items
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.check_budget_item_revert();


-- ──────────────────────────────────────────────────────────────
-- 4. RLS policies UPDATE
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.treatment_budget_items ENABLE ROW LEVEL SECURITY;

-- Dentist puede UPDATE items de budgets en su org
DROP POLICY IF EXISTS tbi_dentist_update ON public.treatment_budget_items;
CREATE POLICY tbi_dentist_update ON public.treatment_budget_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.treatment_budgets b
      JOIN public.clinics c ON c.id = b.clinic_id
      WHERE b.id = treatment_budget_items.budget_id
        AND is_org_member(c.organization_id, 'dentist')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.treatment_budgets b
      JOIN public.clinics c ON c.id = b.clinic_id
      WHERE b.id = treatment_budget_items.budget_id
        AND is_org_member(c.organization_id, 'dentist')
    )
  );

-- Clinic_admin puede UPDATE full
DROP POLICY IF EXISTS tbi_admin_update ON public.treatment_budget_items;
CREATE POLICY tbi_admin_update ON public.treatment_budget_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.treatment_budgets b
      JOIN public.clinics c ON c.id = b.clinic_id
      WHERE b.id = treatment_budget_items.budget_id
        AND is_org_member(c.organization_id, 'clinic_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.treatment_budgets b
      JOIN public.clinics c ON c.id = b.clinic_id
      WHERE b.id = treatment_budget_items.budget_id
        AND is_org_member(c.organization_id, 'clinic_admin')
    )
  );

-- NO hay policy de assistant para UPDATE -> FR-014 cumplido por ausencia


-- ──────────────────────────────────────────────────────────────
-- 5. Ampliacion CHECK clinical_audit_log.resource_type
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.clinical_audit_log
  DROP CONSTRAINT IF EXISTS clinical_audit_log_resource_type_check;

ALTER TABLE public.clinical_audit_log
  ADD CONSTRAINT clinical_audit_log_resource_type_check
  CHECK (resource_type IN (
    'clinical_record', 'clinical_entry', 'odontogram',
    'diagnosis', 'document', 'full_file',
    'appointment',                   -- spec 028
    'budget_item', 'payment'         -- spec 030 NEW
  ));
