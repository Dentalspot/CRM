-- ============================================================
-- Spec 030 Bloque 4 followup: permitir hasta 2 rows por cita (publica + privada)
-- ============================================================
-- Bug descubierto en smoke: el constraint UNIQUE (appointment_id) impedia
-- crear la 2da row de clinical_history con is_professional_only=true.
--
-- Diseno del Bloque 4 require: 1 row publica (paciente la ve) + 1 row privada
-- (solo dentista/admin), ambas con el mismo appointment_id, distinguidas por
-- is_professional_only.
--
-- Fix: dropear constraint single-column y reemplazar por 2 partial unique
-- indexes:
--   - max 1 row con is_professional_only=false (o NULL) por appointment
--   - max 1 row con is_professional_only=true por appointment
-- ============================================================

ALTER TABLE public.clinical_history
  DROP CONSTRAINT IF EXISTS clinical_history_appointment_id_key;

-- 1 row publica por appointment (is_professional_only false o NULL)
CREATE UNIQUE INDEX IF NOT EXISTS clinical_history_appointment_public_key
  ON public.clinical_history (appointment_id)
  WHERE appointment_id IS NOT NULL
    AND COALESCE(is_professional_only, false) = false;

-- 1 row privada por appointment (is_professional_only true)
CREATE UNIQUE INDEX IF NOT EXISTS clinical_history_appointment_private_key
  ON public.clinical_history (appointment_id)
  WHERE appointment_id IS NOT NULL
    AND is_professional_only = true;

COMMENT ON INDEX public.clinical_history_appointment_public_key IS
  'Spec 030 Bloque 4: max 1 row publica de evolucion por cita. is_professional_only=false o NULL.';

COMMENT ON INDEX public.clinical_history_appointment_private_key IS
  'Spec 030 Bloque 4: max 1 row privada de evolucion por cita. is_professional_only=true.';
