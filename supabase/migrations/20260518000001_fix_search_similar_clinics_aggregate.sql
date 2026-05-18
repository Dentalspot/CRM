-- ============================================================
-- Fix: search_similar_clinics rompía con error 42803
-- ============================================================
-- Bug: la versión previa hacía
--   SELECT json_agg(json_build_object('id', c.id, ...,
--     'therapist_count', (SELECT COUNT(*) ... WHERE ct.clinic_id = c.id),
--     'owner_name', (SELECT p.full_name ... WHERE p.id = c.therapist_id)))
--   FROM clinics c WHERE ...
--
-- Los subqueries correlacionados (therapist_count / owner_name) dentro de
-- un json_agg agregado SIN GROUP BY disparaban:
--   ERROR 42803: column "c.name" must appear in the GROUP BY clause
--
-- Resultado en producción: el RPC fallaba SIEMPRE (cualquier búsqueda),
-- searchSimilarClinics() del frontend cae en su catch y retorna
-- hasMatch:false → el wizard "Mis Lugares de Atención" mostraba
-- "No encontramos esta clínica en DentalSpot" para TODA búsqueda,
-- aunque la clínica existiera (ej: Odontología Los Álamos rut 769008187).
--
-- Fix: patrón estándar subselect + row_to_json — los subqueries
-- correlacionados se evalúan en el SELECT interno (contexto no agregado)
-- y json_agg opera sobre las filas materializadas.
-- ============================================================

CREATE OR REPLACE FUNCTION public.search_similar_clinics(
  p_rut_empresa text DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_city_id integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result JSON;
  v_clean_rut text := REPLACE(REPLACE(REPLACE(COALESCE(p_rut_empresa, ''), '.', ''), '-', ''), ' ', '');
BEGIN
  SELECT json_build_object(
    'exact_rut_match', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT
          c.id,
          c.name,
          c.address,
          c.rut_empresa,
          c.razon_social,
          (SELECT COUNT(*) FROM clinic_therapists ct
             WHERE ct.clinic_id = c.id AND ct.is_active = true) AS therapist_count,
          (SELECT p.full_name FROM profiles p WHERE p.id = c.therapist_id) AS owner_name
        FROM clinics c
        WHERE c.rut_empresa IS NOT NULL
          AND v_clean_rut <> ''
          AND c.rut_empresa = v_clean_rut
          AND c.is_active = true
      ) t
    ), '[]'::json),

    'name_matches', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT
          c.id,
          c.name,
          c.address,
          c.rut_empresa,
          similarity(c.name, COALESCE(p_name, '')) AS similarity,
          (SELECT COUNT(*) FROM clinic_therapists ct
             WHERE ct.clinic_id = c.id AND ct.is_active = true) AS therapist_count,
          (SELECT p.full_name FROM profiles p WHERE p.id = c.therapist_id) AS owner_name
        FROM clinics c
        WHERE p_name IS NOT NULL
          AND p_name <> ''
          AND similarity(c.name, p_name) > 0.3
          AND c.is_active = true
        ORDER BY similarity(c.name, p_name) DESC
        LIMIT 5
      ) t
    ), '[]'::json),

    'address_matches', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT
          c.id,
          c.name,
          c.address,
          c.rut_empresa,
          (SELECT COUNT(*) FROM clinic_therapists ct
             WHERE ct.clinic_id = c.id AND ct.is_active = true) AS therapist_count,
          (SELECT p.full_name FROM profiles p WHERE p.id = c.therapist_id) AS owner_name
        FROM clinics c
        WHERE p_city_id IS NOT NULL
          AND c.city_id = p_city_id
          AND p_name IS NOT NULL
          AND similarity(c.name, p_name) > 0.2
          AND c.is_active = true
        LIMIT 5
      ) t
    ), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$function$;
