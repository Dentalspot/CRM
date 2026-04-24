-- ============================================================================
-- Migration: drop UNIQUE constraint on profiles.rut (multi-cuenta por persona)
-- ----------------------------------------------------------------------------
-- Contexto real-world: una persona natural puede legítimamente tener múltiples
-- cuentas Supabase con distintos roles:
--
--   1. Cuenta paciente (role='patient') — para agendar en clínicas
--   2. Cuenta dentista (role='therapist') — para su práctica profesional
--   3. Cuenta clinic admin (role='clinic') — dueño/a de su propia clínica
--   4. Cuenta asistente (role='assistant') — en clínica de un colega
--
-- El RUT es el mismo en todas (identifica la persona física). El constraint
-- UNIQUE previo asumía "1 RUT = 1 cuenta", lo cual es incorrecto.
--
-- La identidad única de cada cuenta sigue siendo `auth.users.id` (UUID).
-- El RUT pasa a ser informativo + útil para búsquedas (por eso creamos un
-- índice NO único para performance).
--
-- Compliance Ley 20.584 art. 5: al registrar el responsable legal de una
-- clínica (tab "Datos de la Clínica" → Responsable) necesitamos el RUT de
-- la persona aunque esa persona ya tenga otra cuenta con el mismo RUT.
--
-- Futuro (si aparece el caso):
--   - Franquicias dentales (admin ≠ dueño) → spec futuro para decoupler
--     responsable del admin account vía columnas clinics.responsible_*
-- ============================================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_rut_key;

-- Índice NO único — solo para performance en lookups
CREATE INDEX IF NOT EXISTS idx_profiles_rut
  ON public.profiles(rut)
  WHERE rut IS NOT NULL;

COMMENT ON COLUMN public.profiles.rut IS
  'RUT chileno del titular de la cuenta (si aplica). NO único — una persona '
  'puede tener múltiples cuentas con distintos roles (patient/therapist/clinic/assistant). '
  'La identidad única de cada cuenta es auth.users.id.';
