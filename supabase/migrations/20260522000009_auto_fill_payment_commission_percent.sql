-- ============================================================
-- Auto-fill patient_payments.commission_percent desde clinic_therapists
-- ============================================================
-- Hoy patient_payments.commission_percent tiene default 0 (NOT NULL).
-- Resultado: si quien registra el pago no setea commission_percent
-- explícito, los reportes de v_income_summary calculan commission_amount=0
-- y net_amount=full → la división entre clínica y dentista no se aplica.
--
-- Pedido del founder: el % acordado vive en clinic_therapists.commission_percent
-- (configurable desde modal "Editar Terapeuta"). Que se aplique automáticamente
-- a los pagos sin tener que ingresarlo cada vez.
--
-- Trigger BEFORE INSERT: si NEW.commission_percent = 0, buscar el % en
-- clinic_therapists matching therapist_id + clinic_id (del budget asociado).
-- Si encuentra valor → reemplaza NEW.commission_percent. Si no → mantiene 0.
--
-- Permite override manual: si el caller pasa commission_percent != 0,
-- se respeta tal cual (negociación especial por pago).
--
-- Scope: solo INSERT. UPDATE no se toca (cambios manuales preservados).
-- Backfill histórico NO se hace (pagos existentes mantienen commission_percent=0
-- para no alterar datos financieros pasados sin consentimiento explícito).
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_fill_payment_commission_percent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_clinic_id uuid;
  v_commission numeric;
BEGIN
  -- Si el caller pasó un valor explícito != 0, respetarlo (override manual)
  IF NEW.commission_percent IS NOT NULL AND NEW.commission_percent != 0 THEN
    RETURN NEW;
  END IF;

  -- Sin budget → no podemos resolver la clinic. Mantener 0.
  IF NEW.budget_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Resolver clinic_id desde el budget asociado
  SELECT clinic_id INTO v_clinic_id
  FROM treatment_budgets
  WHERE id = NEW.budget_id;

  IF v_clinic_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar la comisión acordada para esta relación dentista↔clínica
  SELECT commission_percent INTO v_commission
  FROM clinic_therapists
  WHERE clinic_id = v_clinic_id
    AND therapist_id = NEW.therapist_id
    AND is_active = true
  LIMIT 1;

  -- Si hay relación y % configurado, usarlo
  IF v_commission IS NOT NULL AND v_commission > 0 THEN
    NEW.commission_percent := v_commission;
  END IF;

  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS trg_auto_fill_payment_commission ON public.patient_payments;

CREATE TRIGGER trg_auto_fill_payment_commission
  BEFORE INSERT ON public.patient_payments
  FOR EACH ROW EXECUTE FUNCTION public.auto_fill_payment_commission_percent();

COMMENT ON FUNCTION public.auto_fill_payment_commission_percent IS
  'Auto-llena patient_payments.commission_percent desde clinic_therapists.commission_percent si el INSERT vino con 0 (default). Permite override manual: si el caller pasa != 0, se respeta.';
