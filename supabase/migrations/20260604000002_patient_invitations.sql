-- ============================================================
-- Spec 030 followup: Patient invitations
-- ============================================================
-- Permite que el dentista invite a un paciente sin cuenta a unirse
-- a DentalSpot. Al aceptar, el paciente registra su cuenta y se
-- auto-vincula a su patient row existente via RUT match.
--
-- Componentes:
-- 1. Tabla patient_invitations
-- 2. RLS policies (dentista/admin de la org crea + lee; nadie puede UPDATE)
-- 3. RPC validate_patient_invitation (lookup público vía token)
-- 4. RPC link_patient_to_invitation (post-signup, marca aceptada + vincula)
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Tabla
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patient_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NULL,
  -- Token corto (~32 chars) para URL friendly. Generado por trigger.
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  sent_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz NULL,
  accepted_by_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.patient_invitations IS
  'Spec 030 followup: invitaciones del dentista al paciente para registrarse y acceder a su vista (/dashboard/patient/my-treatment).';
COMMENT ON COLUMN public.patient_invitations.token IS
  'Token URL-safe (~32 chars) generado al insertar. Usado en /auth/accept-invitation?token=xxx.';
COMMENT ON COLUMN public.patient_invitations.expires_at IS
  'Default 7 días desde sent_at. Después de eso el accept rechaza.';

CREATE INDEX IF NOT EXISTS idx_patient_invitations_patient_id
  ON public.patient_invitations (patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_invitations_token
  ON public.patient_invitations (token);
CREATE INDEX IF NOT EXISTS idx_patient_invitations_pending
  ON public.patient_invitations (patient_id, expires_at)
  WHERE accepted_at IS NULL;


-- ──────────────────────────────────────────────────────────────
-- 2. Trigger para generar token al INSERT
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_patient_invitation_token()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    -- 2 UUIDs concat sin guiones = 64 chars hex. URL-safe, alta entropía,
    -- no requiere extensión pgcrypto.
    NEW.token = replace(gen_random_uuid()::text, '-', '')
              || replace(gen_random_uuid()::text, '-', '');
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_generate_patient_invitation_token ON public.patient_invitations;
CREATE TRIGGER trg_generate_patient_invitation_token
  BEFORE INSERT ON public.patient_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_patient_invitation_token();


-- ──────────────────────────────────────────────────────────────
-- 3. RLS policies
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.patient_invitations ENABLE ROW LEVEL SECURITY;

-- Dentista o clinic_admin de la org puede INSERT
DROP POLICY IF EXISTS pi_org_insert ON public.patient_invitations;
CREATE POLICY pi_org_insert ON public.patient_invitations
  FOR INSERT
  WITH CHECK (
    is_org_member(organization_id, 'dentist')
    OR is_org_member(organization_id, 'clinic_admin')
  );

-- Mismos pueden SELECT (para listar invitaciones de un paciente)
DROP POLICY IF EXISTS pi_org_select ON public.patient_invitations;
CREATE POLICY pi_org_select ON public.patient_invitations
  FOR SELECT
  USING (
    is_org_member(organization_id, 'dentist')
    OR is_org_member(organization_id, 'clinic_admin')
    OR is_org_member(organization_id, 'assistant')
  );

-- NO hay UPDATE/DELETE por policies — solo el RPC SECURITY DEFINER puede
-- marcar accepted_at.


-- ──────────────────────────────────────────────────────────────
-- 4. RPC: validate_patient_invitation
-- ──────────────────────────────────────────────────────────────
-- Llamada anónima desde /auth/accept-invitation?token=xxx para ver si
-- el token es válido + obtener datos básicos del paciente (nombre, dentista,
-- clínica) sin exponer info PHI sensible.
CREATE OR REPLACE FUNCTION public.validate_patient_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_invitation patient_invitations%ROWTYPE;
  v_patient_name text;
  v_organization_name text;
  v_dentist_name text;
BEGIN
  SELECT * INTO v_invitation
  FROM patient_invitations
  WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  IF v_invitation.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'already_accepted');
  END IF;

  IF v_invitation.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;

  -- Lookup data para mostrar en el form (no devuelve RUT, eso lo digita el user)
  SELECT COALESCE(profile.full_name, p.full_name) INTO v_patient_name
  FROM patients p
  LEFT JOIN profiles profile ON profile.id = p.profile_id
  WHERE p.id = v_invitation.patient_id;

  SELECT name INTO v_organization_name
  FROM organizations
  WHERE id = v_invitation.organization_id;

  SELECT full_name INTO v_dentist_name
  FROM profiles
  WHERE id = v_invitation.invited_by;

  RETURN jsonb_build_object(
    'valid', true,
    'patient_name', v_patient_name,
    'organization_name', v_organization_name,
    'dentist_name', v_dentist_name,
    'expires_at', v_invitation.expires_at,
    'has_email', v_invitation.email IS NOT NULL
  );
END
$$;

GRANT EXECUTE ON FUNCTION public.validate_patient_invitation(text) TO anon, authenticated;


-- ──────────────────────────────────────────────────────────────
-- 5. RPC: link_patient_to_invitation
-- ──────────────────────────────────────────────────────────────
-- Llamada DESPUÉS de signUp (cuando el user ya tiene auth.uid()).
-- Valida: token vigente + RUT input matchea con patient.rut (cleaned).
-- Si match → vincula patient.profile_id + marca accepted_at.
-- Retorna patient_id para que el cliente pueda redirect.
CREATE OR REPLACE FUNCTION public.link_patient_to_invitation(
  p_token text,
  p_rut text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_invitation patient_invitations%ROWTYPE;
  v_patient_rut text;
  v_normalized_input text;
  v_normalized_db text;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  -- Lookup invitation
  SELECT * INTO v_invitation
  FROM patient_invitations
  WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF v_invitation.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_accepted');
  END IF;

  IF v_invitation.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;

  -- Validar RUT match
  SELECT rut INTO v_patient_rut FROM patients WHERE id = v_invitation.patient_id;
  IF v_patient_rut IS NULL OR v_patient_rut = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'patient_has_no_rut');
  END IF;

  -- Normalizar ambos: solo dígitos y K
  v_normalized_input := upper(regexp_replace(COALESCE(p_rut, ''), '[^0-9kK]', '', 'g'));
  v_normalized_db := upper(regexp_replace(v_patient_rut, '[^0-9kK]', '', 'g'));

  IF v_normalized_input != v_normalized_db THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'rut_mismatch');
  END IF;

  -- Vincular profile_id + marcar accepted
  UPDATE patients
  SET profile_id = v_user_id
  WHERE id = v_invitation.patient_id
    AND (profile_id IS NULL OR profile_id = v_user_id);

  UPDATE patient_invitations
  SET accepted_at = now(),
      accepted_by_user_id = v_user_id
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'ok', true,
    'patient_id', v_invitation.patient_id,
    'organization_id', v_invitation.organization_id
  );
END
$$;

GRANT EXECUTE ON FUNCTION public.link_patient_to_invitation(text, text) TO authenticated;
