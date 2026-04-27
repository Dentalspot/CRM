-- ============================================================
-- Micro-bloque #1: Schema base de presupuestos de tratamiento
-- ============================================================
-- Crea infraestructura de presupuestos (budgets) que vincula
-- pacientes ↔ servicios ↔ pagos.
--
-- Cumplimiento Ley 21.719:
--   - RLS estricto por rol (paciente, dentista, asistente, clínica)
--   - Separación entre datos clínicos (treatment_plans) y financieros (treatment_budgets)
--   - Principio de minimización: solo accede quien lo necesita
-- ============================================================

-- ============================================================
-- A) Enum de estados
-- ============================================================
CREATE TYPE public.budget_status AS ENUM (
  'borrador',
  'enviado',
  'aceptado',
  'en_progreso',
  'pagado',
  'cancelado'
);

-- ============================================================
-- B) Tabla principal: treatment_budgets (header)
-- ============================================================
CREATE TABLE public.treatment_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  therapist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status public.budget_status NOT NULL DEFAULT 'borrador',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CLP',
  notes text,
  sent_at timestamptz,
  accepted_at timestamptz,
  completed_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_budgets_patient ON public.treatment_budgets(patient_id);
CREATE INDEX idx_budgets_therapist ON public.treatment_budgets(therapist_id);
CREATE INDEX idx_budgets_clinic ON public.treatment_budgets(clinic_id);
CREATE INDEX idx_budgets_status ON public.treatment_budgets(status);

COMMENT ON TABLE public.treatment_budgets IS
  'Presupuestos de tratamiento creados por el dentista para un paciente.';

-- ============================================================
-- C) Items del presupuesto
-- ============================================================
CREATE TABLE public.treatment_budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES public.treatment_budgets(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal numeric(10,2) NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_budget_items_budget ON public.treatment_budget_items(budget_id);

COMMENT ON TABLE public.treatment_budget_items IS
  'Servicios cotizados dentro de un presupuesto. service_id es opcional para permitir items de texto libre.';

-- ============================================================
-- D) Vincular pagos existentes al presupuesto
-- ============================================================
ALTER TABLE public.patient_payments
  ADD COLUMN budget_id uuid REFERENCES public.treatment_budgets(id) ON DELETE SET NULL;

CREATE INDEX idx_patient_payments_budget ON public.patient_payments(budget_id);

COMMENT ON COLUMN public.patient_payments.budget_id IS
  'FK opcional al presupuesto. Permite pagos sueltos (sin presupuesto) y abonos vinculados.';

-- ============================================================
-- E) Vista de saldo por presupuesto
-- ============================================================
CREATE VIEW public.v_budget_balance AS
SELECT
  b.id AS budget_id,
  b.patient_id,
  b.therapist_id,
  b.clinic_id,
  b.title,
  b.status,
  b.total,
  b.currency,
  COALESCE(SUM(pp.amount) FILTER (WHERE pp.status = 'completed'), 0) AS total_paid,
  b.total - COALESCE(SUM(pp.amount) FILTER (WHERE pp.status = 'completed'), 0) AS balance_due,
  COUNT(pp.id) FILTER (WHERE pp.status = 'completed') AS payment_count
FROM public.treatment_budgets b
LEFT JOIN public.patient_payments pp ON pp.budget_id = b.id
GROUP BY b.id;

GRANT SELECT ON public.v_budget_balance TO authenticated;

COMMENT ON VIEW public.v_budget_balance IS
  'Saldo de cada presupuesto: total cotizado, total pagado, saldo pendiente.';

-- ============================================================
-- F) Trigger de recálculo automático de totales
-- ============================================================
CREATE OR REPLACE FUNCTION public.recalc_budget_total()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  target_budget_id uuid;
BEGIN
  -- En DELETE usamos OLD; en INSERT/UPDATE usamos NEW
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
    total = COALESCE(
      (SELECT SUM(subtotal) FROM public.treatment_budget_items WHERE budget_id = target_budget_id),
      0
    ) - b.discount,
    updated_at = now()
  WHERE b.id = target_budget_id;

  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_recalc_on_item_change
AFTER INSERT OR UPDATE OR DELETE ON public.treatment_budget_items
FOR EACH ROW EXECUTE FUNCTION public.recalc_budget_total();

-- ============================================================
-- G) RLS Policies
-- ============================================================
ALTER TABLE public.treatment_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_budget_items ENABLE ROW LEVEL SECURITY;

-- ---- treatment_budgets ----

-- Paciente: solo lee los suyos
CREATE POLICY budgets_patient_select ON public.treatment_budgets
  FOR SELECT
  USING (auth.uid() = patient_id);

-- Dentista: CRUD completo sobre los suyos
CREATE POLICY budgets_therapist_all ON public.treatment_budgets
  FOR ALL
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

-- Equipo de clínica (asistente/admin): SELECT si pertenece a la clínica
CREATE POLICY budgets_team_select ON public.treatment_budgets
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT tm.clinic_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

-- Equipo de clínica con permiso billing: UPDATE
CREATE POLICY budgets_team_update ON public.treatment_budgets
  FOR UPDATE
  USING (
    clinic_id IN (
      SELECT tm.clinic_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND COALESCE((tm.permissions->>'can_view_billing')::boolean, false) = true
    )
  );

-- ---- treatment_budget_items ----

-- SELECT: hereda de budget (RLS de budgets filtra)
CREATE POLICY items_select ON public.treatment_budget_items
  FOR SELECT
  USING (
    budget_id IN (SELECT id FROM public.treatment_budgets)
  );

-- Dentista: CRUD sobre items de sus budgets
CREATE POLICY items_therapist_all ON public.treatment_budget_items
  FOR ALL
  USING (
    budget_id IN (
      SELECT id FROM public.treatment_budgets WHERE therapist_id = auth.uid()
    )
  )
  WITH CHECK (
    budget_id IN (
      SELECT id FROM public.treatment_budgets WHERE therapist_id = auth.uid()
    )
  );

-- ============================================================
-- H) Grants
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatment_budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatment_budget_items TO authenticated;
