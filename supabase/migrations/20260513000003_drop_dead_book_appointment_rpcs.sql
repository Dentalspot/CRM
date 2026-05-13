-- ============================================================
-- B7 cleanup: dropear RPCs muertos book_appointment + can_book_appointment
-- ============================================================
-- Background: estas RPCs fueron diseñadas para una versión vieja de la
-- tabla `appointments` donde start_time/end_time eran `timestamp without
-- time zone`. La tabla evolucionó a `date date + start_time time + end_time
-- time` por separado. Las RPCs quedaron con schema drift:
--   - Esperan args timestamp, no time
--   - book_appointment intenta INSERT con columnas que ya no existen
--   - Estado: INVOCABLES pero garantizado fallar
--
-- Verificación pre-drop (2026-05-13):
--   - 0 callers en src/ (solo aparecen en types/database.ts autogen)
--   - La validación de conflictos real vive en el trigger
--     `validate_appointment_before_insert` que corre BEFORE INSERT|UPDATE
--     sobre appointments — independiente de quién haga el INSERT.
--
-- Dropear evita confusión futura (dev que las descubra y crea que valen).
-- ============================================================

DROP FUNCTION IF EXISTS public.book_appointment(uuid, uuid, timestamp without time zone, timestamp without time zone, text);
DROP FUNCTION IF EXISTS public.can_book_appointment(uuid, timestamp without time zone, timestamp without time zone);
