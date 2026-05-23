-- ============================================================
-- Ajuste catálogo de especialidades dentales
-- ============================================================
-- Decisión del founder: "Blanqueamiento" no es realmente una
-- especialidad odontológica reconocida — es un procedimiento que
-- todos los dentistas generales pueden hacer. Lo sacamos.
--
-- En su lugar agregamos "Estética Facial" (procedimientos no-dentales
-- pero estéticos cara: bótox, ácido hialurónico, etc.) que sí es una
-- especialización con formación adicional.
--
-- Safe DELETE: query previa confirmó 0 dentistas con specialty_id
-- = 'blanqueamiento' en therapist_specialties.
-- ============================================================

DELETE FROM "public"."specialties" WHERE "slug" = 'blanqueamiento';

-- specialties.slug no tiene constraint UNIQUE en el schema actual, así
-- que evitamos ON CONFLICT. Si la fila ya existe (migrations re-aplicadas),
-- el INSERT crearía un duplicado — solucion defensiva: filtramos por NOT EXISTS.
INSERT INTO "public"."specialties" ("name", "slug", "description")
SELECT 'Estetica Facial', 'estetica-facial',
  'Procedimientos estéticos faciales no-dentales (bótox, ácido hialurónico, perfilado, etc.).'
WHERE NOT EXISTS (SELECT 1 FROM "public"."specialties" WHERE "slug" = 'estetica-facial');
