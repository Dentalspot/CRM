-- ============================================================================
-- RLS Audit (2026-05-06): tapar 13 tablas sin RLS + abrir lectura en 4
-- catálogos públicos. Estado final: 0 tablas sin RLS, 178 con policies,
-- 19 en lockdown intencional (RLS on sin policies = solo service_role).
--
-- Migration aplicada vía MCP — este archivo es solo para trazabilidad.
-- ============================================================================

-- patient_reviews: read público, INSERT autenticado, UPDATE/DELETE solo admin.
ALTER TABLE patient_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY pr_anyone_read ON patient_reviews FOR SELECT USING (true);
CREATE POLICY pr_authenticated_insert ON patient_reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pr_admin_manage ON patient_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

-- moderation_logs: solo admin
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY ml_admin_only ON moderation_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

-- review_reports: anyone authenticated INSERT, admin gestiona
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY rr_authenticated_insert ON review_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY rr_admin_read ON review_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );
CREATE POLICY rr_admin_manage ON review_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

-- favorite_lists: owner full + lectura pública si is_public=true
ALTER TABLE favorite_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY fl_owner_all ON favorite_lists
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY fl_public_read ON favorite_lists
  FOR SELECT USING (is_public = true);

-- Catálogos públicos — RLS on + anyone read.
DO $$
DECLARE
  tbl text;
  catalog_tables text[] := ARRAY[
    'blog_tags', 'blog_article_tags', 'blog_comments',
    'schools', 'measure_scales', 'specialty_keywords',
    'clinical_entry_types', 'diagnosis_specialty_map', 'marketplace_plans',
    'activity_categories', 'motivational_patient', 'course_lessons', 'products'
  ];
BEGIN
  FOREACH tbl IN ARRAY catalog_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('CREATE POLICY %I_anyone_read ON %I FOR SELECT USING (true)', tbl, tbl);
  END LOOP;
END $$;

-- blog_comments: el autor maneja el suyo
CREATE POLICY bc_author_manage ON blog_comments
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
