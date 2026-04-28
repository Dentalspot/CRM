-- ============================================================
-- Micro-bloque C3: Eliminación de cuenta (Derecho ARCO de cancelación)
-- ============================================================
-- Cumplimiento Ley 21.719 — eliminación inmediata con anonimización
-- de datos personales, conservación de datos clínicos/financieros
-- por obligación legal (5 años minimo).
--
-- Por rol:
--   - Paciente: self-delete permitido
--   - Dentista, asistente, clínica admin: bloqueado (manual por ahora)
-- ============================================================

-- 1) Marcar cuenta como eliminada
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at
  ON public.profiles(deleted_at) WHERE deleted_at IS NOT NULL;

COMMENT ON COLUMN public.profiles.deleted_at IS
  'Si NOT NULL, la cuenta fue eliminada (anonimizada). Login bloqueado a nivel app.';

-- ============================================================
-- 2) Función helper: anonimizar datos personales del usuario
-- ============================================================
CREATE OR REPLACE FUNCTION public.anonymize_user_personal_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Profile
  UPDATE public.profiles
  SET
    full_name = 'Usuario eliminado',
    email = NULL,
    phone = NULL,
    rut = NULL,
    avatar_url = NULL,
    deleted_at = now(),
    updated_at = now()
  WHERE id = p_user_id;

  -- Patient records (si existen): anonimizar pero conservar registros clinicos
  UPDATE public.patients
  SET
    notes = NULL,
    responsible_name = NULL,
    responsible_rut = NULL,
    avatar_url = NULL,
    medical_history = NULL,
    diagnosis = NULL,
    allergies = NULL,
    other_info = NULL,
    diagnosis_summary = NULL,
    updated_at = now()
  WHERE profile_id = p_user_id;
END $$;

GRANT EXECUTE ON FUNCTION public.anonymize_user_personal_data(uuid) TO authenticated;

-- ============================================================
-- 3) RPC self-delete (solo pacientes en este micro-bloque)
-- ============================================================
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_email text;
  v_name text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user';
  END IF;

  -- Capturar datos pre-anonimización (para audit + email)
  SELECT role, email, full_name
    INTO v_role, v_email, v_name
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Por ahora solo paciente puede self-delete
  IF v_role <> 'patient' THEN
    RAISE EXCEPTION 'Auto-eliminación de cuenta no disponible para tu rol. Contacta a dentalspot.cl@gmail.com para procesar tu solicitud.';
  END IF;

  -- Audit pre-eliminación (snapshot mínimo necesario)
  INSERT INTO public.audit_logs (
    table_name, record_id, user_id, action, old_data, new_data, patient_id
  ) VALUES (
    'profiles',
    v_user_id,
    v_user_id,
    'delete_account',
    jsonb_build_object('role', v_role, 'email', v_email, 'full_name', v_name),
    NULL,
    NULL
  );

  -- Anonimizar
  PERFORM public.anonymize_user_personal_data(v_user_id);

  -- Devolver email original para que el frontend dispare la confirmación
  RETURN jsonb_build_object(
    'ok', true,
    'email', v_email,
    'full_name', v_name
  );
END $$;

GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;

-- ============================================================
-- 4) Bloquear que usuarios eliminados lean datos
-- (defensa en profundidad — la app también debe verificar deleted_at)
-- ============================================================
-- Opción mínima: añadir policy restrictiva a profiles que niega
-- todo si deleted_at IS NOT NULL para SELF-SELECT.
--
-- Nota: NO hacemos esto agresivamente porque podría romper consultas
-- legítimas que joineen con profiles. La app valida deleted_at en
-- el AuthContext y fuerza logout.

COMMENT ON FUNCTION public.request_account_deletion() IS
  'Self-delete del usuario actual. Solo pacientes en MVP. Anonimiza datos personales y registra audit log. Devuelve email original para envío de confirmación.';
