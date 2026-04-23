-- ============================================================================
-- Migration: 20260423000002_invite_assistant_flow.sql
-- Purpose: Habilitar invitación de asistentes administrativos a una clínica
-- Spec: specs/023-invite-assistant-flow/
-- Depends on: 20260423000001_add_assistant_lab_to_user_role.sql
-- ============================================================================
-- Scope:
--   1. ALTER clinics ADD organization_id (FK a organizations) — cierra el
--      mismatch estructural donde clinic_invitations usa clinic_id pero
--      organization_members usa organization_id (ver research §R-01).
--   2. Backfill: crea organización para cada clínica existente sin org.
--   3. Trigger: auto-crea org + registra clinic_admin en organization_members
--      cuando se inserta una clínica nueva (onboarding resilience).
--   4. ALTER clinic_invitations: añade `role` (therapist | assistant),
--      `expires_at` (7 días) y `existing_patient` (flag para flow de
--      aceptación cuando el email ya tiene cuenta paciente).
--   5. INDEX para queries frecuentes por (clinic_id, role, status).
--
-- Reuses (no se crea, ya existe en schema):
--   - Helper public.is_org_member(org_id, role) → usada por policies
--   - Policies pat_assistant_*, appt_assistant_* → permiten a asistentes
--     trabajar con pacientes/citas de su clínica
--   - Policies om_* → organization_members accessible correctamente
--   - UNIQUE constraint organization_members_org_user_role_key
--
-- Idempotencia: IF NOT EXISTS + ON CONFLICT DO NOTHING en todas las ops.
-- Reversibilidad: forward-only. Rollback manual si hace falta (DROP
-- COLUMN organization_id from clinics + DROP trigger + DROP added columns
-- from clinic_invitations). Backfill data no es destructivo para clinics
-- pero sí crea organizations nuevas que quedarían huérfanas si se rollback.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PRE-CHECK: validar estado inicial
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_has_org_id_in_clinics boolean;
  v_has_role_in_invitations boolean;
  v_clinics_without_org integer;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinics' AND column_name = 'organization_id'
  ) INTO v_has_org_id_in_clinics;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinic_invitations' AND column_name = 'role'
  ) INTO v_has_role_in_invitations;

  SELECT COUNT(*) INTO v_clinics_without_org FROM public.clinics;

  RAISE NOTICE '[pre-check] clinics.organization_id exists: %', v_has_org_id_in_clinics;
  RAISE NOTICE '[pre-check] clinic_invitations.role exists: %', v_has_role_in_invitations;
  RAISE NOTICE '[pre-check] total clinics: %', v_clinics_without_org;
END $$;

-- ============================================================================
-- SECTION A: ALTER clinics ADD COLUMN organization_id
-- ============================================================================
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clinics_organization_id
  ON public.clinics (organization_id)
  WHERE organization_id IS NOT NULL;

-- ============================================================================
-- SECTION B: Backfill — crear 1 organización por clínica existente sin org
-- ============================================================================
-- Estrategia: para cada clínica sin organization_id, crear row en
-- organizations con metadata mínima y linkear. Duplicados por name resueltos
-- por created_at DESC (la más reciente gana — known issue documented).
-- ============================================================================

DO $$
DECLARE
  v_clinic RECORD;
  v_org_id uuid;
  v_total_before integer;
  v_total_after integer;
  v_failed integer := 0;
BEGIN
  SELECT COUNT(*) INTO v_total_before
  FROM public.clinics WHERE organization_id IS NULL;

  RAISE NOTICE '[backfill] Clínicas sin organization_id a procesar: %', v_total_before;

  FOR v_clinic IN
    SELECT id, name, therapist_id, created_at
    FROM public.clinics
    WHERE organization_id IS NULL
    ORDER BY created_at ASC
  LOOP
    BEGIN
      -- Crear organización
      INSERT INTO public.organizations (name, type, legal_entity_type, legal_name, is_active)
      VALUES (
        COALESCE(v_clinic.name, 'Clínica sin nombre'),
        'clinic',
        'persona_natural',
        COALESCE(v_clinic.name, 'Clínica sin nombre'),
        true
      )
      RETURNING id INTO v_org_id;

      -- Linkear clínica a la org creada
      UPDATE public.clinics SET organization_id = v_org_id WHERE id = v_clinic.id;

      -- Auto-register therapist_id owner como clinic_admin en organization_members
      -- (solo si no hay row previo para evitar conflicto con UNIQUE constraint)
      IF v_clinic.therapist_id IS NOT NULL THEN
        INSERT INTO public.organization_members (organization_id, user_id, role, is_active)
        VALUES (v_org_id, v_clinic.therapist_id, 'clinic_admin', true)
        ON CONFLICT (organization_id, user_id, role) DO NOTHING;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      RAISE WARNING '[backfill] Falla creando org para clinic_id=%: %', v_clinic.id, SQLERRM;
    END;
  END LOOP;

  SELECT COUNT(*) INTO v_total_after
  FROM public.clinics WHERE organization_id IS NULL;

  RAISE NOTICE '[backfill] Procesadas: % | Fallos: % | Restantes sin org: %',
    v_total_before - v_total_after, v_failed, v_total_after;
END $$;

-- ============================================================================
-- SECTION C: Trigger auto-create organization para clínicas NUEVAS
-- ============================================================================
-- Garantiza que cualquier clinic que se inserte en el futuro tenga su
-- organización + clinic_admin membership automáticamente. Si la app ya
-- seteó organization_id manualmente (caso multi-clinic futuro), no sobreescribe.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_create_organization_for_clinic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  IF NEW.organization_id IS NULL THEN
    INSERT INTO public.organizations (name, type, legal_entity_type, legal_name, is_active)
    VALUES (
      COALESCE(NEW.name, 'Clínica sin nombre'),
      'clinic',
      'persona_natural',
      COALESCE(NEW.name, 'Clínica sin nombre'),
      true
    )
    RETURNING id INTO v_org_id;

    NEW.organization_id := v_org_id;

    -- Registrar owner como clinic_admin (si hay therapist_id)
    IF NEW.therapist_id IS NOT NULL THEN
      INSERT INTO public.organization_members (organization_id, user_id, role, is_active)
      VALUES (v_org_id, NEW.therapist_id, 'clinic_admin', true)
      ON CONFLICT (organization_id, user_id, role) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- Drop existing trigger si existe (idempotencia) y recrear
DROP TRIGGER IF EXISTS trg_auto_org_for_clinic ON public.clinics;
CREATE TRIGGER trg_auto_org_for_clinic
BEFORE INSERT ON public.clinics
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_organization_for_clinic();

-- ============================================================================
-- SECTION D: ALTER clinic_invitations — añadir role + expires_at + existing_patient
-- ============================================================================

ALTER TABLE public.clinic_invitations
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'therapist';

ALTER TABLE public.clinic_invitations
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE public.clinic_invitations
  ADD COLUMN IF NOT EXISTS existing_patient boolean NOT NULL DEFAULT false;

-- CHECK constraint en role. Usa DO block para idempotencia (IF NOT EXISTS
-- en constraints solo funciona PG 16+; hacemos el equivalente manual).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.clinic_invitations'::regclass
      AND conname = 'clinic_invitations_role_check'
  ) THEN
    ALTER TABLE public.clinic_invitations
      ADD CONSTRAINT clinic_invitations_role_check
      CHECK (role IN ('therapist', 'assistant'));
  END IF;
END $$;

COMMENT ON COLUMN public.clinic_invitations.role IS
  'Rol que se va a asignar al aceptar la invitación. therapist: inserta en clinic_therapists. assistant: inserta en organization_members con role=''assistant''.';

COMMENT ON COLUMN public.clinic_invitations.expires_at IS
  'Fecha de expiración. null = no expira (legacy therapist invitations). Asistentes siempre 7 días desde creación (FR-007 spec 023).';

COMMENT ON COLUMN public.clinic_invitations.existing_patient IS
  'true = al crear la invitación ya existía cuenta de paciente con ese email. Frontend usa esto para ruteo accept (login vs signup).';

-- ============================================================================
-- SECTION E: Indexes para queries frecuentes del edge function + UI
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_clinic_invitations_role_status
  ON public.clinic_invitations (clinic_id, role, status);

CREATE INDEX IF NOT EXISTS idx_clinic_invitations_expires_at
  ON public.clinic_invitations (expires_at)
  WHERE status = 'pending' AND expires_at IS NOT NULL;

-- ============================================================================
-- POST-CHECK: validar estado final
-- ============================================================================
DO $$
DECLARE
  v_clinics_without_org integer;
  v_has_role boolean;
  v_has_expires boolean;
  v_has_existing_patient boolean;
  v_has_check_constraint boolean;
  v_trigger_exists boolean;
BEGIN
  -- Todas las clínicas tienen org
  SELECT COUNT(*) INTO v_clinics_without_org
  FROM public.clinics WHERE organization_id IS NULL;

  IF v_clinics_without_org > 0 THEN
    RAISE WARNING '[post-check] Hay % clínicas sin organization_id post-backfill. Revisar logs de backfill.', v_clinics_without_org;
  END IF;

  -- Columns nuevos existen
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='clinic_invitations' AND column_name='role'
  ) INTO v_has_role;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='clinic_invitations' AND column_name='expires_at'
  ) INTO v_has_expires;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='clinic_invitations' AND column_name='existing_patient'
  ) INTO v_has_existing_patient;

  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clinic_invitations_role_check'
  ) INTO v_has_check_constraint;

  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_auto_org_for_clinic'
  ) INTO v_trigger_exists;

  IF NOT v_has_role OR NOT v_has_expires OR NOT v_has_existing_patient THEN
    RAISE EXCEPTION '[post-check] Columns faltantes: role=%, expires_at=%, existing_patient=%',
      v_has_role, v_has_expires, v_has_existing_patient;
  END IF;

  IF NOT v_has_check_constraint THEN
    RAISE EXCEPTION '[post-check] CHECK constraint clinic_invitations_role_check no se creó';
  END IF;

  IF NOT v_trigger_exists THEN
    RAISE EXCEPTION '[post-check] Trigger trg_auto_org_for_clinic no se creó';
  END IF;

  RAISE NOTICE '[post-check] ✓ Migración completa. Clínicas sin org: % (esperado 0)', v_clinics_without_org;
  RAISE NOTICE '[post-check] ✓ clinic_invitations extendido con role + expires_at + existing_patient';
  RAISE NOTICE '[post-check] ✓ CHECK constraint + trigger instalados';
END $$;
