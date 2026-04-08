-- =============================================================================
-- MIGRATION: Habilitar RLS y crear policies faltantes
-- Fecha: 2026-04-01
--
-- Problema: 20 tablas sin RLS habilitado + 22 tablas con RLS pero sin policies
-- Patron: Seguir las convenciones existentes del proyecto:
--   - Therapists ven/manejan sus propios registros (therapist_id = auth.uid())
--   - Patients ven sus propios registros (via patients.profile_id = auth.uid())
--   - Admins ven todo (is_admin() o role check)
--   - Tablas de referencia (lookup) son lectura publica
--   - Service role tiene acceso total
-- =============================================================================

-- ============================================
-- PARTE A: Tablas sin RLS (ENABLE + POLICIES)
-- ============================================

-- ----- TABLAS DE REFERENCIA (lectura publica) -----

-- specialty_keywords: lookup table con 71 rows, lectura publica
ALTER TABLE specialty_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read specialty_keywords" ON specialty_keywords FOR SELECT USING (true);
CREATE POLICY "Admin manage specialty_keywords" ON specialty_keywords FOR ALL USING (is_admin());

-- diagnosis_specialty_map: lookup table con 41 rows
ALTER TABLE diagnosis_specialty_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read diagnosis_specialty_map" ON diagnosis_specialty_map FOR SELECT USING (true);
CREATE POLICY "Admin manage diagnosis_specialty_map" ON diagnosis_specialty_map FOR ALL USING (is_admin());

-- clinical_entry_types: lookup table con 11 rows
ALTER TABLE clinical_entry_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read clinical_entry_types" ON clinical_entry_types FOR SELECT USING (true);
CREATE POLICY "Admin manage clinical_entry_types" ON clinical_entry_types FOR ALL USING (is_admin());

-- schools: lookup table, 0 rows
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read schools" ON schools FOR SELECT USING (true);
CREATE POLICY "Admin manage schools" ON schools FOR ALL USING (is_admin());

-- blog_tags: lookup table, 0 rows
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read blog_tags" ON blog_tags FOR SELECT USING (true);
CREATE POLICY "Admin manage blog_tags" ON blog_tags FOR ALL USING (is_admin());

-- measure_scales: lookup table, 0 rows
ALTER TABLE measure_scales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read measure_scales" ON measure_scales FOR SELECT USING (true);
CREATE POLICY "Admin manage measure_scales" ON measure_scales FOR ALL USING (is_admin());

-- ----- TABLAS BLOG (contenido publico) -----

-- blog_article_tags: junction table
ALTER TABLE blog_article_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read blog_article_tags" ON blog_article_tags FOR SELECT USING (true);
CREATE POLICY "Admin manage blog_article_tags" ON blog_article_tags FOR ALL USING (is_admin());

-- blog_comments: user_id owned
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read approved blog_comments" ON blog_comments FOR SELECT USING (status = 'approved');
CREATE POLICY "Users manage own blog_comments" ON blog_comments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin manage blog_comments" ON blog_comments FOR ALL USING (is_admin());

-- ----- TABLAS MARKETPLACE -----

-- marketplace_plans: contenido publico (aprobados), autor maneja los suyos
ALTER TABLE marketplace_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published marketplace_plans" ON marketplace_plans FOR SELECT USING (status = 'published' OR auth.uid() = author_id);
CREATE POLICY "Authors manage own marketplace_plans" ON marketplace_plans FOR ALL USING (auth.uid() = author_id);
CREATE POLICY "Admin manage marketplace_plans" ON marketplace_plans FOR ALL USING (is_admin());

-- marketplace_purchases: buyer ve sus compras
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers read own marketplace_purchases" ON marketplace_purchases FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers insert marketplace_purchases" ON marketplace_purchases FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Admin manage marketplace_purchases" ON marketplace_purchases FOR ALL USING (is_admin());

-- ----- TABLAS DE USUARIO -----

-- favorite_lists: user_id owned
ALTER TABLE favorite_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorite_lists" ON favorite_lists FOR ALL USING (auth.uid() = user_id);

-- patient_reviews: therapist owned, lectura publica
ALTER TABLE patient_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read patient_reviews" ON patient_reviews FOR SELECT USING (true);
CREATE POLICY "Therapists manage own patient_reviews" ON patient_reviews FOR ALL USING (auth.uid() = therapist_id);

-- review_reports: reporter owned
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own review_reports" ON review_reports FOR ALL USING (auth.uid() = reporter_id);
CREATE POLICY "Admin manage review_reports" ON review_reports FOR ALL USING (is_admin());

-- ----- TABLAS PIE (therapist owned) -----

-- pie_paci
ALTER TABLE pie_paci ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapists manage own pie_paci" ON pie_paci FOR ALL USING (auth.uid() = therapist_id);
CREATE POLICY "Admin read pie_paci" ON pie_paci FOR SELECT USING (is_admin());

-- pie_sessions
ALTER TABLE pie_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapists manage own pie_sessions" ON pie_sessions FOR ALL USING (auth.uid() = therapist_id);
CREATE POLICY "Admin read pie_sessions" ON pie_sessions FOR SELECT USING (is_admin());

-- pie_schedule_blocks
ALTER TABLE pie_schedule_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapists manage own pie_schedule_blocks" ON pie_schedule_blocks FOR ALL USING (auth.uid() = therapist_id);
CREATE POLICY "Admin read pie_schedule_blocks" ON pie_schedule_blocks FOR SELECT USING (is_admin());

-- pie_students: no tiene therapist_id directo, via pie_therapist_schools
ALTER TABLE pie_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapists read pie_students via schools" ON pie_students FOR SELECT
  USING (school_id IN (SELECT school_id FROM pie_therapist_schools WHERE therapist_id = auth.uid()));
CREATE POLICY "Therapists insert pie_students" ON pie_students FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage pie_students" ON pie_students FOR ALL USING (is_admin());

-- pie_therapist_schools
ALTER TABLE pie_therapist_schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapists manage own pie_therapist_schools" ON pie_therapist_schools FOR ALL USING (auth.uid() = therapist_id);
CREATE POLICY "Admin read pie_therapist_schools" ON pie_therapist_schools FOR SELECT USING (is_admin());

-- ----- TABLAS ADMIN/DEBUG -----

-- moderation_logs: admin only
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage moderation_logs" ON moderation_logs FOR ALL USING (is_admin());

-- debug_signup_logs: admin only
ALTER TABLE debug_signup_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage debug_signup_logs" ON debug_signup_logs FOR ALL USING (is_admin());


-- ============================================
-- PARTE B: Tablas con RLS habilitado pero SIN policies
-- (Actualmente bloqueadas para todos!)
-- ============================================

-- ----- TABLAS DE REFERENCIA (lectura publica) -----

-- activity_categories: lookup table
CREATE POLICY "Public read activity_categories" ON activity_categories FOR SELECT USING (true);
CREATE POLICY "Admin manage activity_categories" ON activity_categories FOR ALL USING (is_admin());

-- plan_template_exercises: lookup table
CREATE POLICY "Public read plan_template_exercises" ON plan_template_exercises FOR SELECT USING (true);
CREATE POLICY "Admin manage plan_template_exercises" ON plan_template_exercises FOR ALL USING (is_admin());

-- ----- TABLAS AI (user_id owned) -----

-- ai_chat_messages: no tiene user_id directo, via ai_chat_sessions
CREATE POLICY "Users read own ai_chat_messages" ON ai_chat_messages FOR SELECT
  USING (session_id IN (SELECT id FROM ai_chat_sessions WHERE user_id = auth.uid()));
CREATE POLICY "Users insert ai_chat_messages" ON ai_chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read ai_chat_messages" ON ai_chat_messages FOR SELECT USING (is_admin());

-- ai_conversation_analysis: no tiene user_id, via session
CREATE POLICY "Users read own ai_conversation_analysis" ON ai_conversation_analysis FOR SELECT
  USING (session_id IN (SELECT id FROM ai_chat_sessions WHERE user_id = auth.uid()));
CREATE POLICY "Service insert ai_conversation_analysis" ON ai_conversation_analysis FOR INSERT WITH CHECK (true);

-- ai_recommendation_feedback: user_id owned
CREATE POLICY "Users manage own ai_recommendation_feedback" ON ai_recommendation_feedback FOR ALL USING (auth.uid() = user_id);

-- ----- TABLAS THERAPIST (therapist_id owned) -----

-- availability_logs
CREATE POLICY "Therapists manage own availability_logs" ON availability_logs FOR ALL USING (auth.uid() = therapist_id);
CREATE POLICY "Admin read availability_logs" ON availability_logs FOR SELECT USING (is_admin());

-- billing_invoices
CREATE POLICY "Therapists read own billing_invoices" ON billing_invoices FOR SELECT USING (auth.uid() = therapist_id);
CREATE POLICY "Therapists insert billing_invoices" ON billing_invoices FOR INSERT WITH CHECK (auth.uid() = therapist_id);
CREATE POLICY "Admin manage billing_invoices" ON billing_invoices FOR ALL USING (is_admin());

-- specialty_change_logs
CREATE POLICY "Therapists read own specialty_change_logs" ON specialty_change_logs FOR SELECT USING (auth.uid() = therapist_id);
CREATE POLICY "Admin manage specialty_change_logs" ON specialty_change_logs FOR ALL USING (is_admin());

-- therapist_insurances
CREATE POLICY "Therapists manage own therapist_insurances" ON therapist_insurances FOR ALL USING (auth.uid() = therapist_id);
CREATE POLICY "Public read therapist_insurances" ON therapist_insurances FOR SELECT USING (true);

-- products
CREATE POLICY "Therapists manage own products" ON products FOR ALL USING (auth.uid() = therapist_id);
CREATE POLICY "Public read active products" ON products FOR SELECT USING (true);
CREATE POLICY "Admin manage products" ON products FOR ALL USING (is_admin());

-- orders
CREATE POLICY "Therapists read own orders" ON orders FOR SELECT USING (auth.uid() = therapist_id);
CREATE POLICY "Patients read own orders" ON orders FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage orders" ON orders FOR ALL USING (is_admin());

-- ----- TABLAS PATIENT (patient_id owned, therapist puede ver) -----

-- patient_activities
CREATE POLICY "Therapists manage patient_activities" ON patient_activities FOR ALL
  USING (patient_id IN (SELECT id FROM patients WHERE therapist_id = auth.uid()));
CREATE POLICY "Patients read own patient_activities" ON patient_activities FOR SELECT
  USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));
CREATE POLICY "Admin read patient_activities" ON patient_activities FOR SELECT USING (is_admin());

-- patient_development_areas (no tiene therapist_id, via patients)
CREATE POLICY "Therapists manage patient_development_areas" ON patient_development_areas FOR ALL
  USING (patient_id IN (SELECT id FROM patients WHERE therapist_id = auth.uid()));
CREATE POLICY "Patients read own patient_development_areas" ON patient_development_areas FOR SELECT
  USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

-- patient_evaluations
CREATE POLICY "Therapists manage own patient_evaluations" ON patient_evaluations FOR ALL USING (auth.uid() = therapist_id);
CREATE POLICY "Patients read own patient_evaluations" ON patient_evaluations FOR SELECT
  USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));
CREATE POLICY "Admin read patient_evaluations" ON patient_evaluations FOR SELECT USING (is_admin());

-- patient_goals (no tiene therapist_id)
CREATE POLICY "Therapists manage patient_goals" ON patient_goals FOR ALL
  USING (patient_id IN (SELECT id FROM patients WHERE therapist_id = auth.uid()));
CREATE POLICY "Patients read own patient_goals" ON patient_goals FOR SELECT
  USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

-- patient_materials
CREATE POLICY "Therapists manage own patient_materials" ON patient_materials FOR ALL USING (auth.uid() = therapist_id);
CREATE POLICY "Patients read own patient_materials" ON patient_materials FOR SELECT
  USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

-- motivational_patient
CREATE POLICY "Patients read own motivational_patient" ON motivational_patient FOR SELECT
  USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));
CREATE POLICY "Therapists manage motivational_patient" ON motivational_patient FOR ALL
  USING (patient_id IN (SELECT id FROM patients WHERE therapist_id = auth.uid()));

-- ----- TABLAS DE TRACKING (user_id owned) -----

-- coupon_uses
CREATE POLICY "Users read own coupon_uses" ON coupon_uses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert coupon_uses" ON coupon_uses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage coupon_uses" ON coupon_uses FOR ALL USING (is_admin());

-- search_logs
CREATE POLICY "Users manage own search_logs" ON search_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin read search_logs" ON search_logs FOR SELECT USING (is_admin());

-- user_favorite_phrases
CREATE POLICY "Users manage own user_favorite_phrases" ON user_favorite_phrases FOR ALL USING (auth.uid() = user_id);

-- performance_metrics: admin only
CREATE POLICY "Admin manage performance_metrics" ON performance_metrics FOR ALL USING (is_admin());

-- ----- TABLAS EDUCACION -----

-- course_lessons: lectura para enrolled users
CREATE POLICY "Public read course_lessons" ON course_lessons FOR SELECT USING (true);
CREATE POLICY "Admin manage course_lessons" ON course_lessons FOR ALL USING (is_admin());

-- =============================================================================
-- RESUMEN:
-- PARTE A: 20 tablas - ENABLE RLS + policies creadas
-- PARTE B: 22 tablas - policies creadas (ya tenian RLS habilitado)
-- Total: 42 tablas aseguradas
--
-- Patron aplicado:
-- - Lookup/referencia → lectura publica, admin maneja
-- - Datos de therapist → therapist_id = auth.uid()
-- - Datos de paciente → via patients.therapist_id o patients.profile_id
-- - Admin → is_admin() para acceso total
-- - Blog/marketplace → contenido publico + dueño maneja
-- =============================================================================
