-- ============================================================
-- Feature: Configuración de calendario por sucursal
-- ============================================================
-- Permite al dueño de cada sucursal definir:
--   - Hora de inicio del calendario (default 8 → grid arranca 08:00)
--   - Hora de fin del calendario (default 20 → grid termina 19:30)
--   - Duración del slot en minutos (15 o 30)
--
-- Antes: valores hardcodeados en frontend (start=8, end=20, slot=30).
-- Ahora: cada clínica define el suyo. Si no hay valor, se usan los
-- defaults históricos para no romper datos legacy.
-- ============================================================

ALTER TABLE "public"."clinics"
  ADD COLUMN IF NOT EXISTS "calendar_start_hour" smallint
    NOT NULL DEFAULT 8
    CHECK ("calendar_start_hour" >= 0 AND "calendar_start_hour" <= 23);

ALTER TABLE "public"."clinics"
  ADD COLUMN IF NOT EXISTS "calendar_end_hour" smallint
    NOT NULL DEFAULT 20
    CHECK ("calendar_end_hour" >= 1 AND "calendar_end_hour" <= 24);

ALTER TABLE "public"."clinics"
  ADD COLUMN IF NOT EXISTS "calendar_slot_minutes" smallint
    NOT NULL DEFAULT 30
    CHECK ("calendar_slot_minutes" IN (15, 30));

-- Constraint adicional: end debe ser estrictamente mayor que start
ALTER TABLE "public"."clinics"
  DROP CONSTRAINT IF EXISTS "clinics_calendar_hours_range";

ALTER TABLE "public"."clinics"
  ADD CONSTRAINT "clinics_calendar_hours_range"
  CHECK ("calendar_end_hour" > "calendar_start_hour");

COMMENT ON COLUMN "public"."clinics"."calendar_start_hour" IS
  'Hora a la que arranca el grid del calendario semanal (0-23). Default 8 (08:00).';
COMMENT ON COLUMN "public"."clinics"."calendar_end_hour" IS
  'Hora a la que termina el grid del calendario semanal (1-24, exclusive). Default 20. Si es 20, el último slot visible es 19:30.';
COMMENT ON COLUMN "public"."clinics"."calendar_slot_minutes" IS
  'Duración de cada slot del grid (15 o 30 min). Default 30.';
