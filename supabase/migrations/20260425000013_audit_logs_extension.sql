-- ============================================================
-- Micro-bloque #8: Auditoría de cambios — extensión a audit_logs
-- ============================================================
-- Reusa tabla `audit_logs` existente (no duplicamos).
--
-- Cumplimiento Ley 21.719:
--   - Trazabilidad de cambios en datos sensibles (financiero + clínico básico)
--   - Patient_id denormalizado para futuro derecho ARCO del titular
--   - Solo platform_admin puede leer (en este bloque; UI #8.1+)
--
-- Cambios:
--   1. ALTER audit_logs: + patient_id (nullable, indexado)
--   2. Función helper `audit_record_change()` reusable por todos los triggers
--   3. Triggers en: treatment_budgets, treatment_budget_items,
--                   patient_payments, patients
--   4. Política adicional usando is_admin() (por consistencia)
-- ============================================================

-- ============================================================
-- 1) Agregar patient_id denormalizado
-- ============================================================
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS patient_id uuid;

CREATE INDEX IF NOT EXISTS idx_audit_logs_patient ON public.audit_logs(patient_id)
  WHERE patient_id IS NOT NULL;

COMMENT ON COLUMN public.audit_logs.patient_id IS
  'Denormalizado: id del paciente afectado (para queries del titular vía derecho ARCO).';

-- ============================================================
-- 2) Función helper genérica
-- ============================================================
CREATE OR REPLACE FUNCTION public.audit_record_change(
  p_action text,
  p_table_name text,
  p_record_id uuid,
  p_old_data jsonb,
  p_new_data jsonb,
  p_patient_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changed_fields text[];
  v_key text;
BEGIN
  -- Calcular changed_fields solo en UPDATE
  IF p_action = 'update' AND p_old_data IS NOT NULL AND p_new_data IS NOT NULL THEN
    v_changed_fields := ARRAY[]::text[];
    FOR v_key IN SELECT jsonb_object_keys(p_new_data) LOOP
      IF p_old_data->v_key IS DISTINCT FROM p_new_data->v_key THEN
        v_changed_fields := array_append(v_changed_fields, v_key);
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    user_id,
    action,
    old_data,
    new_data,
    changed_fields,
    patient_id,
    "timestamp"
  ) VALUES (
    p_table_name,
    p_record_id,
    auth.uid(),
    p_action,
    -- Para liviandad: en UPDATE solo guardamos diff (no snapshots completos)
    CASE WHEN p_action = 'delete' THEN p_old_data ELSE NULL END,
    CASE WHEN p_action = 'insert' THEN p_new_data ELSE NULL END,
    v_changed_fields,
    p_patient_id,
    now()
  );

EXCEPTION WHEN OTHERS THEN
  -- No bloqueamos la operación si falla el log (resilencia)
  RAISE WARNING 'audit_record_change failed: %', SQLERRM;
END $$;

GRANT EXECUTE ON FUNCTION public.audit_record_change(text, text, uuid, jsonb, jsonb, uuid) TO authenticated;

-- ============================================================
-- 3) Triggers por tabla
-- ============================================================

-- ---- treatment_budgets ----
CREATE OR REPLACE FUNCTION public.audit_treatment_budgets()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.audit_record_change('insert', 'treatment_budgets', NEW.id, NULL, to_jsonb(NEW), NEW.patient_id);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.audit_record_change('update', 'treatment_budgets', NEW.id, to_jsonb(OLD), to_jsonb(NEW), NEW.patient_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.audit_record_change('delete', 'treatment_budgets', OLD.id, to_jsonb(OLD), NULL, OLD.patient_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_audit_treatment_budgets ON public.treatment_budgets;
CREATE TRIGGER trg_audit_treatment_budgets
AFTER INSERT OR UPDATE OR DELETE ON public.treatment_budgets
FOR EACH ROW EXECUTE FUNCTION public.audit_treatment_budgets();

-- ---- treatment_budget_items ----
CREATE OR REPLACE FUNCTION public.audit_treatment_budget_items()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_patient_id uuid;
BEGIN
  -- Derivar patient_id desde el budget
  IF TG_OP = 'DELETE' THEN
    SELECT patient_id INTO v_patient_id FROM public.treatment_budgets WHERE id = OLD.budget_id;
    PERFORM public.audit_record_change('delete', 'treatment_budget_items', OLD.id, to_jsonb(OLD), NULL, v_patient_id);
  ELSE
    SELECT patient_id INTO v_patient_id FROM public.treatment_budgets WHERE id = NEW.budget_id;
    IF TG_OP = 'INSERT' THEN
      PERFORM public.audit_record_change('insert', 'treatment_budget_items', NEW.id, NULL, to_jsonb(NEW), v_patient_id);
    ELSE
      PERFORM public.audit_record_change('update', 'treatment_budget_items', NEW.id, to_jsonb(OLD), to_jsonb(NEW), v_patient_id);
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_audit_treatment_budget_items ON public.treatment_budget_items;
CREATE TRIGGER trg_audit_treatment_budget_items
AFTER INSERT OR UPDATE OR DELETE ON public.treatment_budget_items
FOR EACH ROW EXECUTE FUNCTION public.audit_treatment_budget_items();

-- ---- patient_payments ----
CREATE OR REPLACE FUNCTION public.audit_patient_payments()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.audit_record_change('insert', 'patient_payments', NEW.id, NULL, to_jsonb(NEW), NEW.patient_id);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.audit_record_change('update', 'patient_payments', NEW.id, to_jsonb(OLD), to_jsonb(NEW), NEW.patient_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.audit_record_change('delete', 'patient_payments', OLD.id, to_jsonb(OLD), NULL, OLD.patient_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_audit_patient_payments ON public.patient_payments;
CREATE TRIGGER trg_audit_patient_payments
AFTER INSERT OR UPDATE OR DELETE ON public.patient_payments
FOR EACH ROW EXECUTE FUNCTION public.audit_patient_payments();

-- ---- patients (UPDATE/DELETE solamente — INSERT puede ser muy frecuente) ----
CREATE OR REPLACE FUNCTION public.audit_patients()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.audit_record_change('update', 'patients', NEW.id, to_jsonb(OLD), to_jsonb(NEW), NEW.id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.audit_record_change('delete', 'patients', OLD.id, to_jsonb(OLD), NULL, OLD.id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_audit_patients ON public.patients;
CREATE TRIGGER trg_audit_patients
AFTER UPDATE OR DELETE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.audit_patients();

-- ============================================================
-- 4) Política adicional con is_admin() (la existente usa has_role)
-- ============================================================
DROP POLICY IF EXISTS audit_logs_admin_select ON public.audit_logs;
CREATE POLICY audit_logs_admin_select ON public.audit_logs
  FOR SELECT
  USING (public.is_admin());
