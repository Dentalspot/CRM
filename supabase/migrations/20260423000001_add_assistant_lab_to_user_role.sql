-- ============================================================================
-- Migration: Add 'assistant' and 'lab' to user_role enum
-- ============================================================================
-- Context:
--   Bug latente desde baseline. Frontend (src/constants/roles.js) define
--   USER_ROLES.ASSISTANT y USER_ROLES.LAB, pero el enum PostgreSQL user_role
--   solo aceptaba: patient, therapist, admin, superadmin, clinic.
--
--   Consecuencia: cuando un usuario se registraba con role='assistant' o
--   role='lab', el trigger public.handle_new_user (schema.sql:7643) intenta
--   castear NEW.raw_user_meta_data->>'role' a user_role. El cast falla con
--   invalid_text_representation → el handler captura la excepción y hace
--   fallback a 'patient' (línea 7665 de schema.sql). El usuario queda mal
--   registrado como paciente, sin señal de error visible.
--
--   Este bug bloquea el flujo de signup de asistentes (planeado como
--   invite-only desde clinic dashboard — ver docs/product/feature-backlog.md
--   §Asistente). Lab queda agregado por consistencia con USER_ROLES aunque
--   el rol lab está diferido post-MVP (no hay UI activa para lab).
--
-- Aplicado en producción: 2026-04-23 via SQL Editor Supabase.
-- Este archivo es el registro histórico del cambio para que fresh envs
-- reproduzcan el estado.
--
-- Idempotencia: usa IF NOT EXISTS, safe de re-aplicar.
-- Reversibilidad: PostgreSQL no soporta remover valores de enum fácilmente
-- (requiere recrear el enum + migrar FKs). Este cambio se considera
-- forward-only. Si se quisiera revertir, sería un ciclo de spec complejo.
-- ============================================================================

-- Pre-check: estado inicial
DO $$
DECLARE
  has_assistant boolean;
  has_lab boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'assistant'
  ) INTO has_assistant;

  SELECT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'lab'
  ) INTO has_lab;

  RAISE NOTICE '[user_role enum] Pre-check: has_assistant=%, has_lab=%',
    has_assistant, has_lab;
END $$;

-- ----------------------------------------------------------------------------
-- SECTION: ADD VALUES
-- ----------------------------------------------------------------------------
-- ALTER TYPE ... ADD VALUE en statements separados (cada uno es atómico en
-- PG 12+). IF NOT EXISTS para que re-ejecutar sea no-op.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'assistant';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'lab';

-- ----------------------------------------------------------------------------
-- POST-CHECK: validar estado final
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  has_assistant boolean;
  has_lab boolean;
  all_values text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'assistant'
  ) INTO has_assistant;

  SELECT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'lab'
  ) INTO has_lab;

  -- Listar todos los valores actuales para el log
  SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
  INTO all_values
  FROM pg_enum e
  JOIN pg_type t ON e.enumtypid = t.oid
  WHERE t.typname = 'user_role';

  IF NOT has_assistant OR NOT has_lab THEN
    RAISE EXCEPTION
      '[user_role enum] Post-check FAILED: has_assistant=%, has_lab=% (valores actuales: %)',
      has_assistant, has_lab, all_values;
  END IF;

  RAISE NOTICE '[user_role enum] ✓ Post-check OK. Valores: %', all_values;
END $$;
