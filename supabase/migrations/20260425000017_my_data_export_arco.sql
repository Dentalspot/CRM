-- ============================================================
-- Micro-bloque C4 + C5: Vista "Mis datos personales", acceso log,
-- y preferencias granulares de notificación.
-- Cumplimiento Ley 21.719 — derechos ARCO de acceso, portabilidad
-- y oposición.
-- ============================================================

-- ============================================================
-- 0) Flag granular para notificaciones de presupuestos/pagos
-- ============================================================
ALTER TABLE public.user_notification_preferences
  ADD COLUMN IF NOT EXISTS email_budgets boolean DEFAULT true;

-- ============================================================
-- 1) RLS: paciente puede leer su propio audit log via patient_id
-- ============================================================
DROP POLICY IF EXISTS audit_logs_self_patient_select ON public.audit_logs;
CREATE POLICY audit_logs_self_patient_select ON public.audit_logs
  FOR SELECT
  USING (
    patient_id IS NOT NULL
    AND patient_id IN (
      SELECT id FROM public.patients WHERE profile_id = auth.uid()
    )
  );

-- ============================================================
-- 2) RPC: exportar datos personales del usuario actual (JSON portable)
-- ============================================================
CREATE OR REPLACE FUNCTION public.export_my_personal_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_result jsonb;
  v_profile jsonb;
  v_patient jsonb;
  v_appointments jsonb;
  v_budgets jsonb;
  v_payments jsonb;
  v_legal_acceptances jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user';
  END IF;

  -- Profile
  SELECT to_jsonb(p) - 'updated_at' INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_user_id;

  v_role := v_profile->>'role';

  -- Aceptaciones legales
  SELECT COALESCE(jsonb_agg(to_jsonb(la) ORDER BY la.accepted_at DESC), '[]'::jsonb)
    INTO v_legal_acceptances
  FROM public.user_legal_acceptances la
  WHERE la.user_id = v_user_id;

  -- Datos específicos del paciente
  IF v_role = 'patient' THEN
    SELECT to_jsonb(pat) INTO v_patient
    FROM public.patients pat
    WHERE pat.profile_id = v_user_id
    LIMIT 1;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'budget_id', b.id,
      'budget_number', b.budget_number,
      'title', b.title,
      'status', b.status,
      'subtotal', b.subtotal,
      'discount_percentage', b.discount_percentage,
      'total', b.total,
      'currency', b.currency,
      'created_at', b.created_at,
      'sent_at', b.sent_at,
      'accepted_at', b.accepted_at,
      'completed_at', b.completed_at
    ) ORDER BY b.created_at DESC), '[]'::jsonb) INTO v_budgets
    FROM public.treatment_budgets b
    JOIN public.patients pat ON pat.id = b.patient_id
    WHERE pat.profile_id = v_user_id;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'amount', pp.amount,
      'currency', pp.currency,
      'payment_method', pp.payment_method,
      'payment_date', pp.payment_date,
      'concept', pp.concept,
      'budget_id', pp.budget_id
    ) ORDER BY pp.payment_date DESC), '[]'::jsonb) INTO v_payments
    FROM public.patient_payments pp
    JOIN public.patients pat ON pat.id = pp.patient_id
    WHERE pat.profile_id = v_user_id;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'date', a.date,
      'start_time', a.start_time,
      'end_time', a.end_time,
      'status', a.status,
      'duration_minutes', a.duration_minutes,
      'modality', a.modality_patient,
      'notes', a.notes
    ) ORDER BY a.date DESC, a.start_time DESC), '[]'::jsonb) INTO v_appointments
    FROM public.appointments a
    JOIN public.patients pat ON pat.id = a.patient_id
    WHERE pat.profile_id = v_user_id;

  -- Datos específicos del dentista
  ELSIF v_role = 'therapist' THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'budget_id', b.id,
      'budget_number', b.budget_number,
      'title', b.title,
      'status', b.status,
      'total', b.total,
      'created_at', b.created_at
    ) ORDER BY b.created_at DESC), '[]'::jsonb) INTO v_budgets
    FROM public.treatment_budgets b
    WHERE b.therapist_id = v_user_id;
  END IF;

  v_result := jsonb_build_object(
    'export_date', now(),
    'export_purpose', 'Derecho ARCO de acceso (Ley 21.719) — datos personales del usuario',
    'profile', v_profile,
    'patient_record', v_patient,
    'appointments', v_appointments,
    'budgets', v_budgets,
    'payments', v_payments,
    'legal_acceptances', v_legal_acceptances
  );

  RETURN v_result;
END $$;

GRANT EXECUTE ON FUNCTION public.export_my_personal_data() TO authenticated;

-- ============================================================
-- 3) RPC: log de accesos a mis datos (solo paciente)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_data_access_log(p_limit integer DEFAULT 50)
RETURNS TABLE (
  occurred_at timestamptz,
  action text,
  table_name text,
  changed_fields text[],
  actor_id uuid,
  actor_name text,
  actor_role text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    al."timestamp" AS occurred_at,
    al.action,
    al.table_name,
    al.changed_fields,
    al.user_id AS actor_id,
    COALESCE(p.full_name, 'Sistema') AS actor_name,
    COALESCE(p.role::text, 'system') AS actor_role
  FROM public.audit_logs al
  LEFT JOIN public.profiles p ON p.id = al.user_id
  WHERE al.patient_id IN (
    SELECT id FROM public.patients WHERE profile_id = auth.uid()
  )
  ORDER BY al."timestamp" DESC
  LIMIT COALESCE(p_limit, 50);
$$;

GRANT EXECUTE ON FUNCTION public.get_my_data_access_log(integer) TO authenticated;
