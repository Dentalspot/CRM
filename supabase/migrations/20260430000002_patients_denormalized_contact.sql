-- ============================================================================
-- Migration: denormalizar contacto básico en patients
-- ============================================================================
-- Permite crear pacientes "sin cuenta" (sin profile vinculado) guardando los
-- datos directamente en `patients`. Cuando el paciente acepte una invitación
-- y cree su cuenta, `profile_id` se enlaza y el frontend hará fallback al
-- profile real.
--
-- Antes: createPatientWithoutAccount intentaba insertar un stub en `profiles`
-- con un UUID arbitrario, pero la RLS de profiles solo permite insertar
-- `id = auth.uid()`, así que el stub fallaba silenciosamente y el paciente
-- quedaba con profile_id=null y sin nombre/contacto visible.
-- ============================================================================

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS rut text;

-- Índice para búsqueda rápida por email cuando aún no hay profile vinculado.
CREATE INDEX IF NOT EXISTS idx_patients_email_lower
  ON patients (LOWER(email))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_patients_rut
  ON patients (rut)
  WHERE rut IS NOT NULL;

COMMENT ON COLUMN patients.full_name IS 'Nombre del paciente cuando aún no tiene profile vinculado. Si profile_id != null, prevalece profiles.full_name.';
COMMENT ON COLUMN patients.email IS 'Email del paciente sin cuenta. Cuando se cree el profile, debe migrarse y nullificarse.';
COMMENT ON COLUMN patients.phone IS 'Teléfono del paciente sin cuenta.';
COMMENT ON COLUMN patients.rut IS 'RUT del paciente sin cuenta.';
