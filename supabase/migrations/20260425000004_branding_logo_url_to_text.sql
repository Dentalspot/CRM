-- Aumentar capacidad de therapist_branding.logo_url
-- Razón: ahora se almacenan signed URLs (~600+ chars) en vez de public URLs.
-- avatar_url ya es text; alineamos logo_url al mismo tipo.
--
-- 4 vistas dependen de logo_url, deben recrearse:
--   - marketplace_items_view
--   - v_public_therapists
--   - v_public_therapists_with_reviews
--   - v_therapist_full_profile

DROP VIEW IF EXISTS public.marketplace_items_view;
DROP VIEW IF EXISTS public.v_public_therapists_with_reviews;
DROP VIEW IF EXISTS public.v_public_therapists;
DROP VIEW IF EXISTS public.v_therapist_full_profile;

ALTER TABLE public.therapist_branding
  ALTER COLUMN logo_url TYPE text;

-- ============================================================
-- Recreate: marketplace_items_view
-- ============================================================
CREATE VIEW public.marketplace_items_view AS
 SELECT mi.id,
    mi.seller_id,
    mi.product_id,
    mi.plan_template_id,
    mi.therapist_plan_template_id,
    mi.item_type,
    mi.title,
    mi.description,
    mi.price,
    mi.currency,
    mi.commission_percentage,
    mi.rating,
    mi.total_reviews,
    mi.total_sales,
    mi.is_approved,
    mi.is_active,
    mi.created_at,
    mi.updated_at,
    p.full_name AS seller_name,
    COALESCE(tb.avatar_url, tb.logo_url) AS seller_avatar,
    tb.primary_color AS seller_primary_color,
    tb.logo_url AS seller_logo,
    td.professional_title AS seller_specialty,
    td.headline_statement AS seller_headline,
    td.years_experience AS seller_experience,
    td.specialization_areas AS seller_specializations,
    c.name AS seller_clinic,
    c.address AS seller_clinic_address,
    c.logo_url AS seller_clinic_logo,
    COALESCE(( SELECT (avg(mr.rating))::numeric(3,2) AS avg
           FROM public.marketplace_reviews mr
          WHERE ((mr.marketplace_item_id = mi.id) AND (mr.is_visible = true))), mi.rating, (0)::numeric) AS avg_rating,
    COALESCE(( SELECT (count(*))::integer AS count
           FROM public.marketplace_reviews mr
          WHERE ((mr.marketplace_item_id = mi.id) AND (mr.is_visible = true))), mi.total_reviews, 0) AS review_count
   FROM ((((public.marketplace_items mi
     LEFT JOIN public.profiles p ON ((mi.seller_id = p.id)))
     LEFT JOIN public.therapist_branding tb ON ((mi.seller_id = tb.therapist_id)))
     LEFT JOIN public.therapist_details td ON ((mi.seller_id = td.user_id)))
     LEFT JOIN public.clinics c ON (((mi.seller_id = c.therapist_id) AND (c.is_active = true))))
  WHERE (mi.is_active = true);

-- ============================================================
-- Recreate: v_public_therapists
-- ============================================================
CREATE VIEW public.v_public_therapists AS
 SELECT td.user_id AS therapist_id,
    p.full_name,
    p.region_id,
    p.city_id,
    p.phone,
    td.public_email,
    td.languages,
    td.specialization_areas,
    td.years_experience,
    td.registration_supersalud,
    td.registration_secreduc,
    td.professional_title,
    td.university,
    td.graduation_year,
    td.is_public,
    td.created_at,
    td.updated_at,
    tb.primary_color,
    tb.secondary_color,
    tb.accent_color,
    tb.text_color,
    tb.background_color,
    tb.font_family,
    tb.font_size_base,
    tb.logo_url,
    tb.avatar_url
   FROM ((public.therapist_details td
     JOIN public.profiles p ON ((p.id = td.user_id)))
     LEFT JOIN public.therapist_branding tb ON ((tb.therapist_id = td.user_id)))
  WHERE ((p.role = 'therapist'::public.user_role) AND (td.is_public = true));

-- ============================================================
-- Recreate: v_public_therapists_with_reviews
-- ============================================================
CREATE VIEW public.v_public_therapists_with_reviews AS
 SELECT p.id AS therapist_id,
    p.full_name,
    (COALESCE(avg(pr.rating), (0)::numeric))::numeric(3,2) AS avg_rating,
    count(pr.id) AS total_reviews,
    td.public_email,
    td.languages,
    td.specialization_areas,
    td.years_experience,
    td.registration_supersalud,
    td.registration_secreduc,
    td.professional_title,
    td.university,
    td.graduation_year,
    p.region_id,
    p.city_id,
    p.phone,
    tb.primary_color,
    tb.secondary_color,
    tb.accent_color,
    tb.text_color,
    tb.background_color,
    tb.font_family,
    tb.font_size_base,
    tb.logo_url,
    tb.avatar_url
   FROM (((public.profiles p
     JOIN public.therapist_details td ON ((td.user_id = p.id)))
     LEFT JOIN public.patient_reviews pr ON ((pr.therapist_id = p.id)))
     LEFT JOIN public.therapist_branding tb ON ((tb.therapist_id = p.id)))
  WHERE ((p.role = 'therapist'::public.user_role) AND (td.is_public = true))
  GROUP BY p.id, p.full_name, p.region_id, p.city_id, p.phone, td.public_email, td.languages, td.specialization_areas, td.years_experience, td.registration_supersalud, td.registration_secreduc, td.professional_title, td.university, td.graduation_year, tb.primary_color, tb.secondary_color, tb.accent_color, tb.text_color, tb.background_color, tb.font_family, tb.font_size_base, tb.logo_url, tb.avatar_url;

-- ============================================================
-- Recreate: v_therapist_full_profile
-- ============================================================
CREATE VIEW public.v_therapist_full_profile AS
 SELECT p.id,
    p.full_name,
    p.email,
    p.phone,
    p.rut,
    p.region_id,
    p.city_id,
    td.slug,
    td.about_me,
    td.headline_statement,
    td.professional_title,
    td.university,
    td.graduation_year,
    td.years_experience,
    td.is_public,
    td.public_email,
    td.main_address,
    td.specialization_areas,
    td.languages,
    td.social_instagram_url,
    td.social_facebook_url,
    td.social_linkedin_url,
    td.social_twitter_url,
    tb.avatar_url,
    tb.logo_url,
    tb.primary_color,
    tb.secondary_color,
    tb.accent_color,
    tb.text_color,
    tb.background_color,
    tb.font_family,
    tb.font_size_base
   FROM ((public.profiles p
     LEFT JOIN public.therapist_details td ON ((td.user_id = p.id)))
     LEFT JOIN public.therapist_branding tb ON ((tb.therapist_id = p.id)))
  WHERE (p.role = 'therapist'::public.user_role);

-- ============================================================
-- Restaurar GRANTS
-- ============================================================
GRANT SELECT ON public.marketplace_items_view TO authenticated, anon;
GRANT SELECT ON public.v_public_therapists TO authenticated, anon;
GRANT SELECT ON public.v_public_therapists_with_reviews TO authenticated, anon;
GRANT SELECT ON public.v_therapist_full_profile TO authenticated, anon;
