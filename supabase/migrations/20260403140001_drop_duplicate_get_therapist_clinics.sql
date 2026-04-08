-- Drop the old overloaded version of get_therapist_clinics with integer p_city_id
-- that causes PostgREST ambiguity error:
-- "Could not choose the best candidate function between:
--   get_therapist_clinics(p_therapist_id => uuid, p_city_id => uuid, ...)
--   get_therapist_clinics(p_therapist_id => uuid, ..., p_city_id => integer)"

DROP FUNCTION IF EXISTS public.get_therapist_clinics(uuid, boolean, boolean, integer);
