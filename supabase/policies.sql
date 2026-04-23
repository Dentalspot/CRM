-- DentalSpot — supabase/policies.sql
--
-- Dump extraído de schema.sql (PostgreSQL 17.6) el 2026-04-22.
-- 458 CREATE POLICY + 181 ALTER TABLE ENABLE ROW LEVEL SECURITY.
--
-- Fuente de verdad: supabase/migrations/*. Este archivo es snapshot legible
-- estructurado de las RLS actualmente en producción.
--
-- Para regenerar: ver docs/local-dev/pg-dump-notes.md §"Regeneración bulk".

CREATE POLICY "Admin full access logs" ON "public"."admin_audit_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_super_admin" = true)))));

CREATE POLICY "Admin full access payments" ON "public"."subscription_payments" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_super_admin" = true)))));

CREATE POLICY "Admin full access plans" ON "public"."membership_plans" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_super_admin" = true)))));

CREATE POLICY "Admin full access subscriptions" ON "public"."subscriptions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_super_admin" = true)))));

CREATE POLICY "Admin manage marketplace_purchases" ON "public"."marketplace_purchases" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admin manage therapists" ON "public"."therapists" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can manage FAQs" ON "public"."faq_chatbot" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can manage all coupons" ON "public"."discount_coupons" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can manage all reviews" ON "public"."blog_reviews" USING ("public"."has_role"(VARIADIC ARRAY['admin'::"text"])) WITH CHECK ("public"."has_role"(VARIADIC ARRAY['admin'::"text"]));

CREATE POLICY "Admins can manage audit logs" ON "public"."admin_audit_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can manage blog_categories" ON "public"."blog_categories" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can manage categories" ON "public"."blog_categories" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can manage coupons" ON "public"."discount_coupons" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can manage plans" ON "public"."subscription_plans" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can manage suggested courses" ON "public"."suggested_courses" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can manage ticket notes" ON "public"."support_ticket_notes" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can manage withdrawals" ON "public"."withdrawal_requests" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can read all consents" ON "public"."cookie_consents" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can read all marketplace items" ON "public"."marketplace_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can read all profiles" ON "public"."profiles" FOR SELECT USING ("public"."is_admin"());

CREATE POLICY "Admins can read all subscriptions" ON "public"."therapist_subscriptions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can read blog_posts" ON "public"."blog_posts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can read cookie consents" ON "public"."cookie_consents" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can read own permissions" ON "public"."admin_permissions" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Admins can read patient_questions" ON "public"."patient_questions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can read session_activities" ON "public"."session_activities" FOR SELECT USING ("public"."is_admin"());

CREATE POLICY "Admins can update marketplace items" ON "public"."marketplace_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can view all audit logs" ON "public"."audit_logs" FOR SELECT USING ("public"."has_role"(VARIADIC ARRAY['admin'::"text"]));

CREATE POLICY "Admins can view all reports" ON "public"."progress_reports" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can view all transactions" ON "public"."wallet_transactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can view all wallets" ON "public"."wallets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins can write blog_posts" ON "public"."blog_posts" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins have full access to blog posts" ON "public"."blog_posts" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins have full access to therapist details" ON "public"."therapist_details" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"text"));

CREATE POLICY "Admins manage ai_settings" ON "public"."ai_settings" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins manage arco requests" ON "public"."arco_requests" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins manage billing_invoices" ON "public"."billing_invoices" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins manage campaigns" ON "public"."marketing_campaigns" USING (true) WITH CHECK (true);

CREATE POLICY "Admins manage commissions" ON "public"."commissions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins manage leads" ON "public"."marketing_leads" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins manage legal_disputes" ON "public"."legal_disputes" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins manage legal_documents" ON "public"."legal_documents" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins manage legal_policies" ON "public"."legal_policies" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins manage legal_signatures" ON "public"."legal_signatures" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins manage legal_versions" ON "public"."legal_document_versions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins manage patient_development_areas" ON "public"."patient_development_areas" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins manage patient_evaluations" ON "public"."patient_evaluations" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins manage patient_goals" ON "public"."patient_goals" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins read all feedback" ON "public"."platform_feedback" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins read all profiles" ON "public"."profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admin_permissions"
  WHERE ("admin_permissions"."user_id" = "auth"."uid"()))));

CREATE POLICY "Admins read marketplace_orders" ON "public"."marketplace_orders" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins read marketplace_payouts" ON "public"."marketplace_payouts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins read order_items" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins read sales_summary" ON "public"."sales_summary" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins read therapist_commissions" ON "public"."therapist_commissions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins read withdrawal_requests" ON "public"."withdrawal_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins update marketplace_payouts" ON "public"."marketplace_payouts" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins update sales_summary" ON "public"."sales_summary" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins update therapist_commissions" ON "public"."therapist_commissions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins update wallets" ON "public"."wallets" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins update withdrawal_requests" ON "public"."withdrawal_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Admins view all sales" ON "public"."sales" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "Allow full access for service_role" ON "public"."profiles" USING (("auth"."role"() = 'service_role'::"text"));

CREATE POLICY "Allow insert for authenticated" ON "public"."report_logs" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));

CREATE POLICY "Allow insert for own services" ON "public"."services" FOR INSERT TO "authenticated" WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Allow public read access to active services" ON "public"."services" FOR SELECT USING (("is_active" = true));

CREATE POLICY "Allow update and delete for own services" ON "public"."services" TO "authenticated" USING (("therapist_id" = "auth"."uid"())) WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Anyone can insert cookie consent" ON "public"."cookie_consents" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);

CREATE POLICY "Anyone can read diagnosis codes" ON "public"."diagnosis_codes" FOR SELECT USING (true);

CREATE POLICY "Anyone can read diagnosis systems" ON "public"."diagnosis_systems" FOR SELECT USING (true);

CREATE POLICY "Anyone can read plans" ON "public"."subscription_plans" FOR SELECT USING (true);

CREATE POLICY "Anyone can read reviews" ON "public"."marketplace_reviews" FOR SELECT USING (true);

CREATE POLICY "Anyone can read votes" ON "public"."marketplace_review_votes" FOR SELECT USING (true);

CREATE POLICY "Anyone can view therapist details" ON "public"."therapist_details" FOR SELECT USING (true);

CREATE POLICY "Authenticated read patient_development_areas" ON "public"."patient_development_areas" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Authenticated users can view active coupons" ON "public"."discount_coupons" FOR SELECT TO "authenticated" USING ((("is_active" = true) AND (("expiration_date" IS NULL) OR ("expiration_date" > "now"()))));

CREATE POLICY "Authenticated users can vote" ON "public"."marketplace_review_votes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "Buyers can create reviews" ON "public"."marketplace_reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "reviewer_id"));

CREATE POLICY "Buyers insert marketplace_purchases" ON "public"."marketplace_purchases" FOR INSERT WITH CHECK (("auth"."uid"() = "buyer_id"));

CREATE POLICY "Buyers read own marketplace_purchases" ON "public"."marketplace_purchases" FOR SELECT USING (("auth"."uid"() = "buyer_id"));

CREATE POLICY "Buyers view own purchases" ON "public"."sales" FOR SELECT TO "authenticated" USING (("buyer_id" = "auth"."uid"()));

CREATE POLICY "Clinic owners can create invitations" ON "public"."clinic_invitations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."clinics" "c"
  WHERE (("c"."id" = "clinic_invitations"."clinic_id") AND ("c"."therapist_id" = "auth"."uid"())))));

CREATE POLICY "Clinic owners can manage their invoices" ON "public"."clinic_invoices" USING (("clinic_id" IN ( SELECT "clinics"."id"
   FROM "public"."clinics"
  WHERE ("clinics"."therapist_id" = "auth"."uid"())))) WITH CHECK (("clinic_id" IN ( SELECT "clinics"."id"
   FROM "public"."clinics"
  WHERE ("clinics"."therapist_id" = "auth"."uid"()))));

CREATE POLICY "Clinic owners can update invitations" ON "public"."clinic_invitations" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."clinics" "c"
  WHERE (("c"."id" = "clinic_invitations"."clinic_id") AND ("c"."therapist_id" = "auth"."uid"())))));

CREATE POLICY "Clinic owners can view invitations" ON "public"."clinic_invitations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clinics" "c"
  WHERE (("c"."id" = "clinic_invitations"."clinic_id") AND ("c"."therapist_id" = "auth"."uid"())))));

CREATE POLICY "Create own activities" ON "public"."activity_library" FOR INSERT WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Create own plans" ON "public"."treatment_plans" FOR INSERT WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Delete own activities" ON "public"."activity_library" FOR DELETE USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Delete own plans" ON "public"."treatment_plans" FOR DELETE USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Edit own plans" ON "public"."treatment_plans" FOR UPDATE USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Enable delete for users based on seller_id" ON "public"."marketplace_items" FOR DELETE USING (("auth"."uid"() = "seller_id"));

CREATE POLICY "Enable insert for buyers" ON "public"."marketplace_orders" FOR INSERT WITH CHECK (("auth"."uid"() = "buyer_id"));

CREATE POLICY "Enable insert for order items" ON "public"."order_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."marketplace_orders"
  WHERE (("marketplace_orders"."id" = "order_items"."order_id") AND ("marketplace_orders"."buyer_id" = "auth"."uid"())))));

CREATE POLICY "Enable insert for users based on seller_id" ON "public"."marketplace_items" FOR INSERT WITH CHECK (("auth"."uid"() = "seller_id"));

CREATE POLICY "Enable read access for all users" ON "public"."marketplace_items" FOR SELECT USING (((("is_active" = true) AND ("is_approved" = true)) OR ("auth"."uid"() = "seller_id")));

CREATE POLICY "Enable select for buyers" ON "public"."marketplace_orders" FOR SELECT USING (("auth"."uid"() = "buyer_id"));

CREATE POLICY "Enable select for order items" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."marketplace_orders"
  WHERE (("marketplace_orders"."id" = "order_items"."order_id") AND ("marketplace_orders"."buyer_id" = "auth"."uid"())))));

CREATE POLICY "Enable update for users based on seller_id" ON "public"."marketplace_items" FOR UPDATE USING (("auth"."uid"() = "seller_id"));

CREATE POLICY "Everyone can read FAQs" ON "public"."faq_chatbot" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));

CREATE POLICY "Manage own favorites" ON "public"."therapist_favorite_activities" USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Owners and admins can invite members" ON "public"."team_members" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."team_members" "team_members_1"
  WHERE (("team_members_1"."user_id" = "auth"."uid"()) AND ("team_members_1"."clinic_id" = "team_members_1"."clinic_id") AND ("team_members_1"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND ("team_members_1"."status" = 'active'::"text")))));

CREATE POLICY "Owners and admins can update members" ON "public"."team_members" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."team_members" "team_members_1"
  WHERE (("team_members_1"."user_id" = "auth"."uid"()) AND ("team_members_1"."clinic_id" = "team_members_1"."clinic_id") AND ("team_members_1"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND ("team_members_1"."status" = 'active'::"text")))));

CREATE POLICY "Patients can manage their own questions" ON "public"."patient_questions" USING (("patient_id" = "auth"."uid"())) WITH CHECK (("patient_id" = "auth"."uid"()));

CREATE POLICY "Patients can view session activities" ON "public"."session_activities" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."plan_sessions" "ps"
     JOIN "public"."patient_assigned_plans" "pap" ON (("pap"."id" = "ps"."assigned_plan_id")))
  WHERE (("ps"."id" = "session_activities"."session_id") AND ("pap"."patient_id" = "auth"."uid"())))));

CREATE POLICY "Patients can view shared reports" ON "public"."progress_reports" FOR SELECT USING ((("auth"."uid"() = "patient_id") AND ("shared_with_patient" = true)));

CREATE POLICY "Patients can view their plan sessions" ON "public"."plan_sessions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."patient_assigned_plans" "pap"
  WHERE (("pap"."id" = "plan_sessions"."assigned_plan_id") AND ("pap"."patient_id" = "auth"."uid"())))));

CREATE POLICY "Patients read own evaluations" ON "public"."patient_evaluations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."patients"
  WHERE (("patients"."id" = "patient_evaluations"."patient_id") AND ("patients"."profile_id" = "auth"."uid"())))));

CREATE POLICY "Patients read own goals" ON "public"."patient_goals" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."patients"
  WHERE (("patients"."id" = "patient_goals"."patient_id") AND ("patients"."profile_id" = "auth"."uid"())))));

CREATE POLICY "Public can not view blocked times" ON "public"."blocked_times" FOR SELECT USING (false);

CREATE POLICY "Public can read categories" ON "public"."blog_categories" FOR SELECT USING (true);

CREATE POLICY "Public can view active email templates" ON "public"."email_templates" FOR SELECT USING (("is_active" = true));

CREATE POLICY "Public can view active therapist services" ON "public"."therapist_services" FOR SELECT USING (("is_active" = true));

CREATE POLICY "Public can view availabilities" ON "public"."therapist_availabilities" FOR SELECT USING (true);

CREATE POLICY "Public can view cities" ON "public"."cities" FOR SELECT TO "authenticated", "anon" USING (true);

CREATE POLICY "Public can view insurance providers" ON "public"."insurance_providers" FOR SELECT USING (("is_active" = true));

CREATE POLICY "Public can view public education records" ON "public"."therapist_education" FOR SELECT USING (("is_public" = true));

CREATE POLICY "Public can view public services" ON "public"."therapist_services" FOR SELECT USING (("is_public" = true));

CREATE POLICY "Public can view public therapist experience" ON "public"."therapist_experience" FOR SELECT USING (("is_public" = true));

CREATE POLICY "Public can view published landing pages" ON "public"."therapist_landing_pages" FOR SELECT USING (("published" = true));

CREATE POLICY "Public can view regions" ON "public"."regions" FOR SELECT TO "authenticated", "anon" USING (true);

CREATE POLICY "Public can view specialties" ON "public"."specialties" FOR SELECT TO "authenticated", "anon" USING (true);

CREATE POLICY "Public can view specialties catalog" ON "public"."specialties" FOR SELECT TO "authenticated", "anon" USING (true);

CREATE POLICY "Public can view therapist branding" ON "public"."therapist_branding" FOR SELECT USING (true);

CREATE POLICY "Public can view therapist profiles" ON "public"."profiles" FOR SELECT USING (("role" = 'therapist'::"public"."user_role"));

CREATE POLICY "Public read access to planification types" ON "public"."planification_types" FOR SELECT USING (true);

CREATE POLICY "Public read plans" ON "public"."membership_plans" FOR SELECT USING (true);

CREATE POLICY "Public read published docs" ON "public"."legal_documents" FOR SELECT USING (("status" = 'published'::"text"));

CREATE POLICY "Public read therapists" ON "public"."therapists" FOR SELECT USING (true);

CREATE POLICY "Published blog posts are public" ON "public"."blog_posts" FOR SELECT USING (("status" = 'published'::"text"));

CREATE POLICY "Reviewers can delete own reviews" ON "public"."marketplace_reviews" FOR DELETE USING (("auth"."uid"() = "reviewer_id"));

CREATE POLICY "Reviewers can update own reviews" ON "public"."marketplace_reviews" FOR UPDATE USING (("auth"."uid"() = "reviewer_id"));

CREATE POLICY "Reviews are public" ON "public"."marketplace_reviews" FOR SELECT USING (("is_visible" = true));

CREATE POLICY "Score descriptions are readable by authenticated users" ON "public"."ados2_score_descriptions" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Sellers view own sales" ON "public"."sales" FOR SELECT TO "authenticated" USING (("seller_id" = "auth"."uid"()));

CREATE POLICY "Service role manages recommendations" ON "public"."therapist_recommendations" USING (true);

CREATE POLICY "Team members can view their clinic members" ON "public"."team_members" FOR SELECT USING ((("clinic_id" IN ( SELECT "tm"."clinic_id"
   FROM "public"."team_members" "tm"
  WHERE (("tm"."user_id" = "auth"."uid"()) AND ("tm"."status" = 'active'::"text")))) OR ("user_id" = "auth"."uid"())));

CREATE POLICY "Terapeuta ve sus propios datos PIE" ON "public"."pie_student_data" USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Terapeutas pueden agregar favoritos" ON "public"."therapist_favorite_activities" FOR INSERT WITH CHECK (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Terapeutas pueden eliminar sus favoritos" ON "public"."therapist_favorite_activities" FOR DELETE USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Terapeutas pueden ver sus favoritos" ON "public"."therapist_favorite_activities" FOR SELECT USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapist owns adir_evaluations" ON "public"."adir_evaluations" USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapist owns adir_item_responses" ON "public"."adir_item_responses" USING (("evaluation_id" IN ( SELECT "adir_evaluations"."id"
   FROM "public"."adir_evaluations"
  WHERE ("adir_evaluations"."therapist_id" = "auth"."uid"()))));

CREATE POLICY "Therapists can delete own exercises" ON "public"."therapist_exercises" FOR DELETE USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can delete own materials" ON "public"."therapist_materials" FOR DELETE USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can delete own scheduled reminders" ON "public"."scheduled_reminders" FOR DELETE USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can delete own templates" ON "public"."patient_document_templates" FOR DELETE USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can delete their own conditions" ON "public"."therapist_conditions" FOR DELETE USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can delete their own education" ON "public"."therapist_education" FOR DELETE USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can delete their own generated templates" ON "public"."generated_templates" FOR DELETE USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can delete their own specialties" ON "public"."therapist_specialties" FOR DELETE TO "authenticated" USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can insert activity logs" ON "public"."patient_activity_logs" FOR INSERT WITH CHECK ((("auth"."uid"() = "therapist_id") OR (EXISTS ( SELECT 1
   FROM "public"."patients"
  WHERE (("patients"."id" = "patient_activity_logs"."patient_id") AND ("patients"."therapist_id" = "auth"."uid"()))))));

CREATE POLICY "Therapists can insert own exercises" ON "public"."therapist_exercises" FOR INSERT WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can insert own materials" ON "public"."therapist_materials" FOR INSERT WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can insert own scheduled reminders" ON "public"."scheduled_reminders" FOR INSERT WITH CHECK (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can insert own templates" ON "public"."patient_document_templates" FOR INSERT WITH CHECK ((("therapist_id" = "auth"."uid"()) OR ("therapist_id" IS NULL)));

CREATE POLICY "Therapists can insert suggestions" ON "public"."suggested_courses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'therapist'::"public"."user_role")))));

CREATE POLICY "Therapists can insert their own conditions" ON "public"."therapist_conditions" FOR INSERT WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can insert their own education" ON "public"."therapist_education" FOR INSERT WITH CHECK (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can insert their own generated templates" ON "public"."generated_templates" FOR INSERT WITH CHECK (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can insert their own specialties" ON "public"."therapist_specialties" FOR INSERT TO "authenticated" WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can manage objective activities" ON "public"."plan_objective_activities" USING ((EXISTS ( SELECT 1
   FROM ("public"."plan_objectives" "po"
     JOIN "public"."treatment_plans" "tp" ON (("tp"."id" = "po"."plan_id")))
  WHERE (("po"."id" = "plan_objective_activities"."objective_id") AND ("tp"."therapist_id" = "auth"."uid"())))));

CREATE POLICY "Therapists can manage own availability" ON "public"."therapist_availabilities" USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can manage own branding" ON "public"."therapist_branding" USING (("auth"."uid"() = "therapist_id")) WITH CHECK (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can manage own landing page" ON "public"."therapist_landing_pages" USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can manage own quick notes" ON "public"."patient_quick_notes" USING (("therapist_id" = "auth"."uid"())) WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can manage own services" ON "public"."therapist_services" USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can manage plan objectives" ON "public"."plan_objectives" USING ((EXISTS ( SELECT 1
   FROM "public"."treatment_plans" "tp"
  WHERE (("tp"."id" = "plan_objectives"."plan_id") AND ("tp"."therapist_id" = "auth"."uid"())))));

CREATE POLICY "Therapists can manage plan sessions" ON "public"."plan_sessions" USING ((EXISTS ( SELECT 1
   FROM "public"."patient_assigned_plans" "pap"
  WHERE (("pap"."id" = "plan_sessions"."assigned_plan_id") AND ("pap"."therapist_id" = "auth"."uid"())))));

CREATE POLICY "Therapists can manage session activities" ON "public"."session_activities" USING ((EXISTS ( SELECT 1
   FROM ("public"."plan_sessions" "ps"
     JOIN "public"."patient_assigned_plans" "pap" ON (("pap"."id" = "ps"."assigned_plan_id")))
  WHERE (("ps"."id" = "session_activities"."session_id") AND ("pap"."therapist_id" = "auth"."uid"())))));

CREATE POLICY "Therapists can manage their generated reports" ON "public"."progress_reports" USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can manage their own blocked times" ON "public"."blocked_times" TO "authenticated" USING (("therapist_id" = "auth"."uid"())) WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can manage their own blog posts" ON "public"."blog_posts" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));

CREATE POLICY "Therapists can manage their own details" ON "public"."therapist_details" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Therapists can manage their own documents" ON "public"."therapist_documents" USING (("auth"."uid"() = "therapist_id")) WITH CHECK (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can manage their own experience" ON "public"."therapist_experience" USING (("auth"."uid"() = "therapist_id")) WITH CHECK (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can manage their own notiz sessions" ON "public"."notiz_sessions" USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can manage their own payments" ON "public"."payments" TO "authenticated" USING (("therapist_id" = "auth"."uid"())) WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can manage their own treatment plans" ON "public"."treatment_plans" TO "authenticated" USING (("therapist_id" = "auth"."uid"())) WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can see their own generated templates" ON "public"."generated_templates" FOR SELECT USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can update own exercises" ON "public"."therapist_exercises" FOR UPDATE USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can update own materials" ON "public"."therapist_materials" FOR UPDATE USING (("therapist_id" = "auth"."uid"())) WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can update own scheduled reminders" ON "public"."scheduled_reminders" FOR UPDATE USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can update own templates" ON "public"."patient_document_templates" FOR UPDATE USING (("therapist_id" = "auth"."uid"())) WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can update patient profiles" ON "public"."profiles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."patients"
  WHERE (("patients"."profile_id" = "profiles"."id") AND ("patients"."therapist_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."patients"
  WHERE (("patients"."profile_id" = "profiles"."id") AND ("patients"."therapist_id" = "auth"."uid"())))));

CREATE POLICY "Therapists can update patient questions" ON "public"."patient_questions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."profile_id" = "patient_questions"."patient_id") AND ("p"."therapist_id" = "auth"."uid"())))));

CREATE POLICY "Therapists can update their own education" ON "public"."therapist_education" FOR UPDATE USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can update their own generated templates" ON "public"."generated_templates" FOR UPDATE USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can view all questions" ON "public"."patient_questions" FOR SELECT TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = 'therapist'::"text"));

CREATE POLICY "Therapists can view own and global templates" ON "public"."patient_document_templates" FOR SELECT USING ((("therapist_id" = "auth"."uid"()) OR ("is_global" = true)));

CREATE POLICY "Therapists can view own and public exercises" ON "public"."therapist_exercises" FOR SELECT USING ((("therapist_id" = "auth"."uid"()) OR ("is_public" = true)));

CREATE POLICY "Therapists can view own materials" ON "public"."therapist_materials" FOR SELECT USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can view own reminder logs" ON "public"."reminder_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."appointments" "a"
  WHERE (("a"."id" = "reminder_logs"."appointment_id") AND ("a"."therapist_id" = "auth"."uid"())))));

CREATE POLICY "Therapists can view own scheduled reminders" ON "public"."scheduled_reminders" FOR SELECT USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can view own suggestions" ON "public"."suggested_courses" FOR SELECT USING (("suggested_by" = "auth"."uid"()));

CREATE POLICY "Therapists can view reviews on their posts" ON "public"."blog_reviews" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."blog_posts"
  WHERE (("blog_posts"."id" = "blog_reviews"."blog_post_id") AND ("blog_posts"."author_id" = "auth"."uid"())))));

CREATE POLICY "Therapists can view their own conditions" ON "public"."therapist_conditions" FOR SELECT USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists can view their own education" ON "public"."therapist_education" FOR SELECT USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "Therapists can view their own specialties" ON "public"."therapist_specialties" FOR SELECT TO "authenticated" USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists manage own patient evaluations" ON "public"."patient_evaluations" USING ((EXISTS ( SELECT 1
   FROM "public"."patient_care_team"
  WHERE (("patient_care_team"."dentist_id" = "auth"."uid"()) AND ("patient_care_team"."patient_id" = "patient_evaluations"."patient_id") AND ("patient_care_team"."is_active" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."patient_care_team"
  WHERE (("patient_care_team"."dentist_id" = "auth"."uid"()) AND ("patient_care_team"."patient_id" = "patient_evaluations"."patient_id") AND ("patient_care_team"."is_active" = true)))));

CREATE POLICY "Therapists manage own patient goals" ON "public"."patient_goals" USING ((EXISTS ( SELECT 1
   FROM "public"."patient_care_team"
  WHERE (("patient_care_team"."dentist_id" = "auth"."uid"()) AND ("patient_care_team"."patient_id" = "patient_goals"."patient_id") AND ("patient_care_team"."is_active" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."patient_care_team"
  WHERE (("patient_care_team"."dentist_id" = "auth"."uid"()) AND ("patient_care_team"."patient_id" = "patient_goals"."patient_id") AND ("patient_care_team"."is_active" = true)))));

CREATE POLICY "Therapists manage own pie_therapist_schools" ON "public"."pie_therapist_schools" USING (("therapist_id" = "auth"."uid"())) WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists manage own sensorial evals" ON "public"."sensorial_evaluations" USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists manage own specialties" ON "public"."therapist_specialties" USING ((("auth"."uid"() = "therapist_id") OR "public"."has_role"(VARIADIC ARRAY['admin'::"text"])));

CREATE POLICY "Therapists manage sensorial responses" ON "public"."sensorial_item_responses" USING (("evaluation_id" IN ( SELECT "sensorial_evaluations"."id"
   FROM "public"."sensorial_evaluations"
  WHERE ("sensorial_evaluations"."therapist_id" = "auth"."uid"()))));

CREATE POLICY "Therapists read own billing_invoices" ON "public"."billing_invoices" FOR SELECT USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Therapists view own commissions" ON "public"."commissions" FOR SELECT TO "authenticated" USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Update own activities" ON "public"."activity_library" FOR UPDATE USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Users can create chat sessions" ON "public"."ai_chat_sessions" FOR INSERT WITH CHECK ((("auth"."uid"() = "patient_id") OR ("auth"."uid"() = "therapist_id") OR ("session_type" = 'anonymous'::"text")));

CREATE POLICY "Users can create refund requests" ON "public"."refund_requests" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));

CREATE POLICY "Users can create withdrawals" ON "public"."withdrawal_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can delete own pending subscriptions" ON "public"."therapist_subscriptions" FOR DELETE USING ((("therapist_id" = "auth"."uid"()) AND ("status" = 'pending'::"text")));

CREATE POLICY "Users can delete own votes" ON "public"."marketplace_review_votes" FOR DELETE USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can insert own addons" ON "public"."user_addons" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));

CREATE POLICY "Users can insert own logs" ON "public"."report_logs" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));

CREATE POLICY "Users can insert own redemptions" ON "public"."coupon_redemptions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can insert own subscriptions" ON "public"."therapist_subscriptions" FOR INSERT WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));

CREATE POLICY "Users can manage own AI feedback" ON "public"."ai_feedback" USING ((("auth"."uid"() = "patient_id") OR ("auth"."uid"() = "therapist_id") OR "public"."has_role"(VARIADIC ARRAY['admin'::"text"])));

CREATE POLICY "Users can manage own reviews" ON "public"."marketplace_reviews" USING (("reviewer_id" = "auth"."uid"()));

CREATE POLICY "Users can manage own votes" ON "public"."review_helpful_votes" USING (("user_id" = "auth"."uid"()));

CREATE POLICY "Users can manage their own notification preferences" ON "public"."user_notification_preferences" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can manage their own saved searches" ON "public"."marketplace_saved_searches" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can manage their own word searches" ON "public"."word_searches" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can read own addons" ON "public"."user_addons" FOR SELECT USING (("user_id" = "auth"."uid"()));

CREATE POLICY "Users can read own consent" ON "public"."cookie_consents" FOR SELECT USING (("user_id" = "auth"."uid"()));

CREATE POLICY "Users can read own subscriptions" ON "public"."therapist_subscriptions" FOR SELECT USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Users can update own addons" ON "public"."user_addons" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));

CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can update own subscriptions" ON "public"."therapist_subscriptions" FOR UPDATE USING (("therapist_id" = "auth"."uid"())) WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "Users can update own votes" ON "public"."marketplace_review_votes" FOR UPDATE USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));

CREATE POLICY "Users can view own analytics" ON "public"."user_analytics" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can view own chat sessions" ON "public"."ai_chat_sessions" FOR SELECT USING ((("auth"."uid"() = "patient_id") OR ("auth"."uid"() = "therapist_id") OR ("session_type" = 'anonymous'::"text")));

CREATE POLICY "Users can view own email notifications" ON "public"."email_notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can view own logs" ON "public"."report_logs" FOR SELECT USING (("user_id" = "auth"."uid"()));

CREATE POLICY "Users can view own metrics" ON "public"."metrics_summary" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can view own redemptions" ON "public"."coupon_redemptions" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can view own refund requests" ON "public"."refund_requests" FOR SELECT USING (("user_id" = "auth"."uid"()));

CREATE POLICY "Users can view own transactions" ON "public"."wallet_transactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."wallets" "w"
  WHERE (("w"."id" = "wallet_transactions"."wallet_id") AND ("w"."user_id" = "auth"."uid"())))));

CREATE POLICY "Users can view own wallet" ON "public"."wallets" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can view own withdrawals" ON "public"."withdrawal_requests" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can view report logs for their reports" ON "public"."report_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clinical_reports" "cr"
  WHERE (("cr"."id" = "report_logs"."report_id") AND (("cr"."therapist_id" = "auth"."uid"()) OR ("cr"."patient_id" = "auth"."uid"()))))));

CREATE POLICY "Users can view their own notification preferences" ON "public"."user_notification_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));

CREATE POLICY "Users create own arco requests" ON "public"."arco_requests" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));

CREATE POLICY "Users create own feedback" ON "public"."platform_feedback" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));

CREATE POLICY "Users manage own favorites" ON "public"."marketplace_favorites" USING (("user_id" = "auth"."uid"()));

CREATE POLICY "Users manage own symptoms" ON "public"."symptom_profiles" USING (("auth"."uid"() = "patient_id"));

CREATE POLICY "Users read own arco requests" ON "public"."arco_requests" FOR SELECT USING (("user_id" = "auth"."uid"()));

CREATE POLICY "Users read own feedback" ON "public"."platform_feedback" FOR SELECT USING (("user_id" = "auth"."uid"()));

CREATE POLICY "Users read own recommendations" ON "public"."therapist_recommendations" FOR SELECT USING (("auth"."uid"() = "patient_id"));

CREATE POLICY "Users read own signatures" ON "public"."legal_signatures" FOR SELECT USING (("user_id" = "auth"."uid"()));

CREATE POLICY "Users see own payments" ON "public"."subscription_payments" FOR SELECT USING (("user_id" = "auth"."uid"()));

CREATE POLICY "Users see own subscriptions" ON "public"."subscriptions" FOR SELECT USING (("user_id" = "auth"."uid"()));

CREATE POLICY "Users sign documents" ON "public"."legal_signatures" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));

CREATE POLICY "Vendors read own plan purchases" ON "public"."marketplace_purchases" FOR SELECT USING (("marketplace_plan_id" IN ( SELECT "marketplace_plans"."id"
   FROM "public"."marketplace_plans"
  WHERE ("marketplace_plans"."author_id" = "auth"."uid"()))));

CREATE POLICY "View global and own activities" ON "public"."activity_library" FOR SELECT USING ((("is_global" = true) OR ("therapist_id" = "auth"."uid"())));

CREATE POLICY "View global and own plans" ON "public"."treatment_plans" FOR SELECT USING ((("is_global" = true) OR ("therapist_id" = "auth"."uid"())));

ALTER TABLE "public"."activity_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."activity_library" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."adir_evaluations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."adir_item_responses" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_transactions" ON "public"."wallet_transactions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_all_wallets" ON "public"."wallets" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_all_withdrawals" ON "public"."withdrawal_requests" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

ALTER TABLE "public"."admin_audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_incident_notes" ON "public"."support_incident_notes" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_full_access_incidents" ON "public"."support_incidents" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_full_access_system_logs" ON "public"."system_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_full_access_ticket_notes" ON "public"."support_ticket_notes" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_full_access_tickets" ON "public"."support_tickets" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_manage_all_courses" ON "public"."courses" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_manage_enrollments" ON "public"."course_enrollments" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

ALTER TABLE "public"."admin_permissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_permissions_no_client_writes" ON "public"."admin_permissions" TO "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "admin_read_adir_evaluations" ON "public"."adir_evaluations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_read_ados2_evaluations" ON "public"."ados2_evaluations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_read_ai_chat_sessions" ON "public"."ai_chat_sessions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_read_ai_feedback" ON "public"."ai_feedback" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_read_ai_usage_quotas" ON "public"."ai_usage_quotas" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_read_generated_templates" ON "public"."generated_templates" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_read_notiz_sessions" ON "public"."notiz_sessions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_read_sensorial_evaluations" ON "public"."sensorial_evaluations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_read_session_activities" ON "public"."session_activities" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admin_read_treatment_plans" ON "public"."treatment_plans" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admins_read_prompts" ON "public"."ai_prompt_templates" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "admins_read_settings" ON "public"."ai_settings" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "admins_write_faqs" ON "public"."faq_chatbot" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admins_write_prompts" ON "public"."ai_prompt_templates" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "admins_write_settings" ON "public"."ai_settings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

ALTER TABLE "public"."ados2_evaluations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ados2_item_responses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ados2_score_descriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_chat_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_chat_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_conversation_analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_plan_limits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_prompt_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_recommendation_feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_usage_quotas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_can_accept_invitation" ON "public"."therapist_invitations" FOR UPDATE USING (("status" = 'pending'::"text")) WITH CHECK (("status" = 'accepted'::"text"));

CREATE POLICY "anyone_can_insert_log" ON "public"."clinical_access_log" FOR INSERT WITH CHECK (true);

CREATE POLICY "anyone_read_approved_courses" ON "public"."courses" FOR SELECT USING (("status" = 'approved'::"text"));

CREATE POLICY "anyone_read_by_code" ON "public"."therapist_invitations" FOR SELECT USING (true);

CREATE POLICY "anyone_read_evidence_chat" ON "public"."evidence_chat_training" FOR SELECT USING (true);

CREATE POLICY "anyone_read_faqs" ON "public"."faq_chatbot" FOR SELECT USING (true);

CREATE POLICY "anyone_read_limits" ON "public"."ai_plan_limits" FOR SELECT USING (true);

CREATE POLICY "anyone_read_modules_of_approved" ON "public"."course_modules" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."courses"
  WHERE (("courses"."id" = "course_modules"."course_id") AND ("courses"."status" = 'approved'::"text")))));

CREATE POLICY "anyone_read_reviews" ON "public"."course_reviews" FOR SELECT USING (true);

CREATE POLICY "anyone_read_tea_training" ON "public"."tea_training_examples" FOR SELECT USING (true);

CREATE POLICY "anyone_read_training" ON "public"."paci_training_examples" FOR SELECT USING (true);

ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appt_admin_insert" ON "public"."appointments" FOR INSERT WITH CHECK ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "appt_admin_select" ON "public"."appointments" FOR SELECT USING ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "appt_admin_update" ON "public"."appointments" FOR UPDATE USING ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "appt_assistant_insert" ON "public"."appointments" FOR INSERT WITH CHECK ("public"."is_org_member"("organization_id", 'assistant'::"text"));

CREATE POLICY "appt_assistant_select" ON "public"."appointments" FOR SELECT USING ("public"."is_org_member"("organization_id", 'assistant'::"text"));

CREATE POLICY "appt_assistant_update" ON "public"."appointments" FOR UPDATE USING ("public"."is_org_member"("organization_id", 'assistant'::"text"));

CREATE POLICY "appt_dentist_insert" ON "public"."appointments" FOR INSERT WITH CHECK (("public"."is_org_member"("organization_id", 'dentist'::"text") AND ("therapist_id" = "auth"."uid"())));

CREATE POLICY "appt_dentist_select" ON "public"."appointments" FOR SELECT USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND ("therapist_id" = "auth"."uid"())));

CREATE POLICY "appt_dentist_update" ON "public"."appointments" FOR UPDATE USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND ("therapist_id" = "auth"."uid"())));

CREATE POLICY "appt_patient_select" ON "public"."appointments" FOR SELECT USING ("public"."is_own_patient"("patient_id"));

CREATE POLICY "appt_platform_admin_select" ON "public"."appointments" FOR SELECT USING ("public"."is_admin"());

ALTER TABLE "public"."arco_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."availability_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."billing_invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."blocked_times" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."blog_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_posts_admin_all" ON "public"."blog_posts" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "blog_posts_public_select" ON "public"."blog_posts" FOR SELECT TO "authenticated", "anon" USING (("status" = 'published'::"text"));

ALTER TABLE "public"."blog_reviews" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_reviews_admin_all" ON "public"."blog_reviews" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));

CREATE POLICY "cal_admin_insert" ON "public"."clinical_audit_log" FOR INSERT WITH CHECK ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "cal_admin_select" ON "public"."clinical_audit_log" FOR SELECT USING ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "cal_dentist_insert" ON "public"."clinical_audit_log" FOR INSERT WITH CHECK (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "cal_platform_admin_select" ON "public"."clinical_audit_log" FOR SELECT USING ("public"."is_admin"());

CREATE POLICY "ch_admin_grant_select" ON "public"."clinical_history" FOR SELECT USING (("public"."is_org_member"("organization_id", 'clinic_admin'::"text") AND "public"."has_active_grant"("patient_id")));

CREATE POLICY "ch_dentist_insert" ON "public"."clinical_history" FOR INSERT WITH CHECK (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "ch_dentist_select" ON "public"."clinical_history" FOR SELECT USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND ("public"."is_in_care_team"("patient_id") OR ("therapist_id" = "auth"."uid"()))));

CREATE POLICY "ch_dentist_update" ON "public"."clinical_history" FOR UPDATE USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "ch_patient_select" ON "public"."clinical_history" FOR SELECT USING ("public"."is_own_patient"("patient_id"));

ALTER TABLE "public"."cities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."clinic_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."clinic_invoices" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinic_members_can_read" ON "public"."clinics" FOR SELECT USING (("id" IN ( SELECT "clinic_therapists"."clinic_id"
   FROM "public"."clinic_therapists"
  WHERE (("clinic_therapists"."therapist_id" = "auth"."uid"()) AND ("clinic_therapists"."is_active" = true)))));

CREATE POLICY "clinic_owner_manage" ON "public"."clinic_therapists" USING ("public"."is_clinic_owner"("clinic_id")) WITH CHECK ("public"."is_clinic_owner"("clinic_id"));

ALTER TABLE "public"."clinic_therapists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."clinical_access_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."clinical_audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."clinical_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."clinical_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."clinics" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinics_manage_own" ON "public"."clinics" TO "authenticated" USING (("therapist_id" = "auth"."uid"())) WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "clinics_public_read" ON "public"."clinics" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));

ALTER TABLE "public"."commissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cookie_consents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."coupon_redemptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."coupon_uses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."course_enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."course_lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."course_modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."course_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_admin_grant_select" ON "public"."clinical_reports" FOR SELECT USING (("public"."is_org_member"("organization_id", 'clinic_admin'::"text") AND "public"."has_active_grant"("patient_id")));

CREATE POLICY "cr_dentist_insert" ON "public"."clinical_reports" FOR INSERT WITH CHECK (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "cr_dentist_select" ON "public"."clinical_reports" FOR SELECT USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND ("public"."is_in_care_team"("patient_id") OR ("therapist_id" = "auth"."uid"()))));

CREATE POLICY "cr_patient_select" ON "public"."clinical_reports" FOR SELECT USING ("public"."is_own_patient"("patient_id"));

CREATE POLICY "ct_manage_self" ON "public"."clinic_therapists" TO "authenticated" USING (("therapist_id" = "auth"."uid"())) WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "ct_read_active" ON "public"."clinic_therapists" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));

ALTER TABLE "public"."debug_signup_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "del_therapist_specialties_self" ON "public"."therapist_specialties" FOR DELETE USING (("therapist_id" = "auth"."uid"()));

ALTER TABLE "public"."diagnosis_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."diagnosis_systems" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."discount_coupons" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eag_admin_insert" ON "public"."exceptional_access_grants" FOR INSERT WITH CHECK ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "eag_admin_select" ON "public"."exceptional_access_grants" FOR SELECT USING ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "eag_admin_update" ON "public"."exceptional_access_grants" FOR UPDATE USING ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "eag_patient_select" ON "public"."exceptional_access_grants" FOR SELECT USING ("public"."is_own_patient"("patient_id"));

CREATE POLICY "eag_platform_admin_select" ON "public"."exceptional_access_grants" FOR SELECT USING ("public"."is_admin"());

CREATE POLICY "edu_rec_admin_all" ON "public"."education_recommendations" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_super_admin" = true)))));

CREATE POLICY "edu_rec_select" ON "public"."education_recommendations" FOR SELECT USING (("is_active" = true));

ALTER TABLE "public"."education_recommendations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."email_notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."email_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."evidence_chat_training" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."exceptional_access_grants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."faq_chatbot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."generated_templates" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ins_therapist_specialties_self" ON "public"."therapist_specialties" FOR INSERT WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "instructor_manage_modules" ON "public"."course_modules" USING ((EXISTS ( SELECT 1
   FROM "public"."courses"
  WHERE (("courses"."id" = "course_modules"."course_id") AND ("courses"."instructor_id" = "auth"."uid"())))));

CREATE POLICY "instructor_manage_own" ON "public"."courses" USING (("auth"."uid"() = "instructor_id"));

CREATE POLICY "instructor_read_course_enrollments" ON "public"."course_enrollments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."courses"
  WHERE (("courses"."id" = "course_enrollments"."course_id") AND ("courses"."instructor_id" = "auth"."uid"())))));

ALTER TABLE "public"."insurance_providers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."legal_disputes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."legal_document_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."legal_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."legal_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."legal_signatures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."marketing_campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."marketing_leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."marketplace_favorites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."marketplace_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketplace_items_delete_policy" ON "public"."marketplace_items" FOR DELETE USING (("seller_id" = "auth"."uid"()));

CREATE POLICY "marketplace_items_insert_policy" ON "public"."marketplace_items" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("seller_id" = "auth"."uid"())));

CREATE POLICY "marketplace_items_select_policy" ON "public"."marketplace_items" FOR SELECT USING (((("is_active" = true) AND ("is_approved" = true)) OR ("seller_id" = "auth"."uid"())));

CREATE POLICY "marketplace_items_update_policy" ON "public"."marketplace_items" FOR UPDATE USING (("seller_id" = "auth"."uid"())) WITH CHECK (("seller_id" = "auth"."uid"()));

ALTER TABLE "public"."marketplace_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."marketplace_payouts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."marketplace_purchases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."marketplace_review_votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."marketplace_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."marketplace_saved_searches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."membership_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."metrics_summary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."migration_review_queue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."motivational_patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."motivational_phrases" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mrq_admin_select" ON "public"."migration_review_queue" FOR SELECT USING ((("organization_id" IS NOT NULL) AND "public"."is_org_member"("organization_id", 'clinic_admin'::"text")));

CREATE POLICY "mrq_admin_update" ON "public"."migration_review_queue" FOR UPDATE USING ((("organization_id" IS NOT NULL) AND "public"."is_org_member"("organization_id", 'clinic_admin'::"text")));

CREATE POLICY "mrq_platform_admin_select" ON "public"."migration_review_queue" FOR SELECT USING ("public"."is_admin"());

CREATE POLICY "mrq_platform_admin_update" ON "public"."migration_review_queue" FOR UPDATE USING ("public"."is_admin"());

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notiz_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."odontogram_evaluations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."odontograms" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oe_admin_grant_select" ON "public"."odontogram_evaluations" FOR SELECT USING (("public"."is_org_member"("organization_id", 'clinic_admin'::"text") AND "public"."has_active_grant"("patient_id")));

CREATE POLICY "oe_dentist_insert" ON "public"."odontogram_evaluations" FOR INSERT WITH CHECK (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "oe_dentist_select" ON "public"."odontogram_evaluations" FOR SELECT USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND ("public"."is_in_care_team"("patient_id") OR ("therapist_id" = "auth"."uid"()))));

CREATE POLICY "oe_dentist_update" ON "public"."odontogram_evaluations" FOR UPDATE USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "oe_patient_select" ON "public"."odontogram_evaluations" FOR SELECT USING ("public"."is_own_patient"("patient_id"));

CREATE POLICY "og_admin_grant_select" ON "public"."odontograms" FOR SELECT USING (("public"."is_org_member"("organization_id", 'clinic_admin'::"text") AND "public"."has_active_grant"("patient_id")));

CREATE POLICY "og_dentist_insert" ON "public"."odontograms" FOR INSERT WITH CHECK (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "og_dentist_select" ON "public"."odontograms" FOR SELECT USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND ("public"."is_in_care_team"("patient_id") OR ("therapist_id" = "auth"."uid"()))));

CREATE POLICY "og_dentist_update" ON "public"."odontograms" FOR UPDATE USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "og_patient_select" ON "public"."odontograms" FOR SELECT USING ("public"."is_own_patient"("patient_id"));

CREATE POLICY "om_admin_insert" ON "public"."organization_members" FOR INSERT WITH CHECK ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "om_admin_update" ON "public"."organization_members" FOR UPDATE USING ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "om_member_select" ON "public"."organization_members" FOR SELECT USING ("public"."is_org_member"("organization_id"));

CREATE POLICY "om_platform_admin_select" ON "public"."organization_members" FOR SELECT USING ("public"."is_admin"());

ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_admin_update" ON "public"."organizations" FOR UPDATE USING ("public"."is_org_member"("id", 'clinic_admin'::"text"));

CREATE POLICY "org_member_select" ON "public"."organizations" FOR SELECT USING ("public"."is_org_member"("id"));

CREATE POLICY "org_platform_admin_select" ON "public"."organizations" FOR SELECT USING ("public"."is_admin"());

ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_insert_evidence_chat" ON "public"."evidence_chat_training" FOR INSERT WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "own_insert_tea_training" ON "public"."tea_training_examples" FOR INSERT WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "own_insert_training" ON "public"."paci_training_examples" FOR INSERT WITH CHECK (("therapist_id" = "auth"."uid"()));

CREATE POLICY "own_update_training" ON "public"."paci_training_examples" FOR UPDATE USING (("therapist_id" = "auth"."uid"()));

ALTER TABLE "public"."paci_training_examples" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pap_admin_grant_select" ON "public"."patient_assigned_plans" FOR SELECT USING (("public"."is_org_member"("organization_id", 'clinic_admin'::"text") AND "public"."has_active_grant"("patient_id")));

CREATE POLICY "pap_dentist_insert" ON "public"."patient_assigned_plans" FOR INSERT WITH CHECK (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "pap_dentist_select" ON "public"."patient_assigned_plans" FOR SELECT USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND ("public"."is_in_care_team"("patient_id") OR ("therapist_id" = "auth"."uid"()))));

CREATE POLICY "pap_dentist_update" ON "public"."patient_assigned_plans" FOR UPDATE USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "pap_patient_select" ON "public"."patient_assigned_plans" FOR SELECT USING ("public"."is_own_patient"("patient_id"));

CREATE POLICY "pat_admin_insert" ON "public"."patients" FOR INSERT WITH CHECK ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "pat_admin_select" ON "public"."patients" FOR SELECT USING ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "pat_admin_update" ON "public"."patients" FOR UPDATE USING ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "pat_assistant_insert" ON "public"."patients" FOR INSERT WITH CHECK ("public"."is_org_member"("organization_id", 'assistant'::"text"));

CREATE POLICY "pat_assistant_select" ON "public"."patients" FOR SELECT USING ("public"."is_org_member"("organization_id", 'assistant'::"text"));

CREATE POLICY "pat_assistant_update" ON "public"."patients" FOR UPDATE USING ("public"."is_org_member"("organization_id", 'assistant'::"text"));

CREATE POLICY "pat_dentist_insert" ON "public"."patients" FOR INSERT WITH CHECK ("public"."is_org_member"("organization_id", 'dentist'::"text"));

CREATE POLICY "pat_dentist_select" ON "public"."patients" FOR SELECT USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND ("public"."is_in_care_team"("id") OR ("therapist_id" = "auth"."uid"()))));

CREATE POLICY "pat_dentist_update" ON "public"."patients" FOR UPDATE USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND ("public"."is_in_care_team"("id") OR ("therapist_id" = "auth"."uid"()))));

CREATE POLICY "pat_patient_select" ON "public"."patients" FOR SELECT USING (("profile_id" = "auth"."uid"()));

CREATE POLICY "pat_platform_admin_select" ON "public"."patients" FOR SELECT USING ("public"."is_admin"());

ALTER TABLE "public"."patient_access_grants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."patient_activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."patient_activity_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."patient_assigned_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."patient_care_team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."patient_clinical_record" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."patient_development_areas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."patient_diagnoses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."patient_document_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."patient_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."patient_evaluations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."patient_goals" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patient_manages_own_grants" ON "public"."patient_access_grants" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));

ALTER TABLE "public"."patient_materials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."patient_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."patient_private_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."patient_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."patient_quick_notes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patient_sees_own_log" ON "public"."clinical_access_log" FOR SELECT USING (("patient_id" IN ( SELECT "patients"."id"
   FROM "public"."patients"
  WHERE ("patients"."profile_id" = "auth"."uid"()))));

CREATE POLICY "patient_view_own_evaluations" ON "public"."ados2_evaluations" FOR SELECT USING (("auth"."uid"() = "patient_id"));

CREATE POLICY "patient_view_own_item_responses" ON "public"."ados2_item_responses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."ados2_evaluations"
  WHERE (("ados2_evaluations"."id" = "ados2_item_responses"."evaluation_id") AND ("ados2_evaluations"."patient_id" = "auth"."uid"())))));

ALTER TABLE "public"."patients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pcr_admin_grant_select" ON "public"."patient_clinical_record" FOR SELECT USING (("public"."is_org_member"("organization_id", 'clinic_admin'::"text") AND "public"."has_active_grant"("patient_id")));

CREATE POLICY "pcr_dentist_select" ON "public"."patient_clinical_record" FOR SELECT USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "pcr_dentist_update" ON "public"."patient_clinical_record" FOR UPDATE USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "pcr_patient_select" ON "public"."patient_clinical_record" FOR SELECT USING ("public"."is_own_patient"("patient_id"));

CREATE POLICY "pct_admin_manage" ON "public"."patient_care_team" FOR INSERT WITH CHECK ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "pct_admin_select" ON "public"."patient_care_team" FOR SELECT USING ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "pct_admin_update" ON "public"."patient_care_team" FOR UPDATE USING ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "pct_dentist_select" ON "public"."patient_care_team" FOR SELECT USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "pct_patient_select" ON "public"."patient_care_team" FOR SELECT USING ("public"."is_own_patient"("patient_id"));

CREATE POLICY "pd_admin_grant_select" ON "public"."patient_diagnoses" FOR SELECT USING (("public"."is_org_member"("organization_id", 'clinic_admin'::"text") AND "public"."has_active_grant"("patient_id")));

CREATE POLICY "pd_dentist_insert" ON "public"."patient_diagnoses" FOR INSERT WITH CHECK (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "pd_dentist_select" ON "public"."patient_diagnoses" FOR SELECT USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND ("public"."is_in_care_team"("patient_id") OR ("therapist_id" = "auth"."uid"()))));

CREATE POLICY "pd_dentist_update" ON "public"."patient_diagnoses" FOR UPDATE USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "pd_patient_select" ON "public"."patient_diagnoses" FOR SELECT USING ("public"."is_own_patient"("patient_id"));

CREATE POLICY "pdoc_admin_grant_select" ON "public"."patient_documents" FOR SELECT USING (("public"."is_org_member"("organization_id", 'clinic_admin'::"text") AND "public"."has_active_grant"("patient_id")));

CREATE POLICY "pdoc_dentist_insert" ON "public"."patient_documents" FOR INSERT WITH CHECK (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "pdoc_dentist_select" ON "public"."patient_documents" FOR SELECT USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND ("public"."is_in_care_team"("patient_id") OR ("therapist_id" = "auth"."uid"()))));

CREATE POLICY "pdoc_patient_select" ON "public"."patient_documents" FOR SELECT USING ("public"."is_own_patient"("patient_id"));

ALTER TABLE "public"."performance_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pie_paci" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pie_schedule_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pie_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pie_student_data" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pie_students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pie_therapist_schools" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."plan_objective_activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."plan_objectives" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."plan_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."plan_template_exercises" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."planification_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."platform_feedback" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plb_admin_insert" ON "public"."processing_lawful_basis" FOR INSERT WITH CHECK ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "plb_admin_select" ON "public"."processing_lawful_basis" FOR SELECT USING ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "plb_dentist_select" ON "public"."processing_lawful_basis" FOR SELECT USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND "public"."is_in_care_team"("patient_id")));

CREATE POLICY "plb_patient_select" ON "public"."processing_lawful_basis" FOR SELECT USING ("public"."is_own_patient"("patient_id"));

CREATE POLICY "plb_platform_admin_select" ON "public"."processing_lawful_basis" FOR SELECT USING ("public"."is_admin"());

CREATE POLICY "pp_admin_insert" ON "public"."patient_payments" FOR INSERT WITH CHECK ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "pp_admin_select" ON "public"."patient_payments" FOR SELECT USING ("public"."is_org_member"("organization_id", 'clinic_admin'::"text"));

CREATE POLICY "pp_assistant_insert" ON "public"."patient_payments" FOR INSERT WITH CHECK ("public"."is_org_member"("organization_id", 'assistant'::"text"));

CREATE POLICY "pp_assistant_select" ON "public"."patient_payments" FOR SELECT USING ("public"."is_org_member"("organization_id", 'assistant'::"text"));

CREATE POLICY "pp_dentist_select" ON "public"."patient_payments" FOR SELECT USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND ("public"."is_in_care_team"("patient_id") OR ("therapist_id" = "auth"."uid"()))));

CREATE POLICY "pp_patient_select" ON "public"."patient_payments" FOR SELECT USING ("public"."is_own_patient"("patient_id"));

CREATE POLICY "pp_platform_admin_select" ON "public"."patient_payments" FOR SELECT USING ("public"."is_admin"());

CREATE POLICY "ppn_author_insert" ON "public"."patient_private_notes" FOR INSERT WITH CHECK (("public"."is_org_member"("organization_id", 'dentist'::"text") AND ("therapist_id" = "auth"."uid"())));

CREATE POLICY "ppn_author_select" ON "public"."patient_private_notes" FOR SELECT USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND ("therapist_id" = "auth"."uid"())));

CREATE POLICY "ppn_author_update" ON "public"."patient_private_notes" FOR UPDATE USING (("public"."is_org_member"("organization_id", 'dentist'::"text") AND ("therapist_id" = "auth"."uid"())));

CREATE POLICY "pq_select_for_therapists" ON "public"."patient_questions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'therapist'::"public"."user_role")))));

ALTER TABLE "public"."processing_lawful_basis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT USING (("id" = "auth"."uid"()));

CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"()));

ALTER TABLE "public"."progress_reports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_motivational_phrases" ON "public"."motivational_phrases" FOR SELECT USING (("is_active" = true));

ALTER TABLE "public"."refund_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."regions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reminder_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."report_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."review_helpful_votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sales_summary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."scheduled_reminders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."search_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sel_therapist_specialties_self" ON "public"."therapist_specialties" FOR SELECT USING (("therapist_id" = "auth"."uid"()));

ALTER TABLE "public"."sensorial_evaluations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sensorial_item_responses" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_read_faqs" ON "public"."faq_chatbot" FOR SELECT TO "service_role" USING (true);

CREATE POLICY "service_read_prompts" ON "public"."ai_prompt_templates" FOR SELECT TO "service_role" USING (true);

CREATE POLICY "service_read_settings" ON "public"."ai_settings" FOR SELECT TO "service_role" USING (true);

CREATE POLICY "service_role_all" ON "public"."ai_usage_quotas" TO "service_role" USING (true);

ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."specialties" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."specialty_change_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."stsg_evaluations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_enroll" ON "public"."course_enrollments" FOR INSERT WITH CHECK (("auth"."uid"() = "student_id"));

CREATE POLICY "student_read_own_enrollments" ON "public"."course_enrollments" FOR SELECT USING (("auth"."uid"() = "student_id"));

CREATE POLICY "student_write_review" ON "public"."course_reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "reviewer_id"));

ALTER TABLE "public"."subscription_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."suggested_courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."support_incident_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."support_incidents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."support_ticket_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."symptom_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."system_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tea_training_examples" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tecal_evaluations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."teprosif_evaluations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."therapist_availabilities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."therapist_branding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."therapist_commissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."therapist_conditions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."therapist_details" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."therapist_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."therapist_education" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."therapist_exercises" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."therapist_experience" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."therapist_favorite_activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."therapist_insurances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."therapist_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."therapist_invite_quotas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."therapist_landing_pages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."therapist_materials" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "therapist_own_evaluations" ON "public"."ados2_evaluations" USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "therapist_own_invitations" ON "public"."therapist_invitations" USING (("auth"."uid"() = "inviter_id"));

CREATE POLICY "therapist_own_item_responses" ON "public"."ados2_item_responses" USING ((EXISTS ( SELECT 1
   FROM "public"."ados2_evaluations"
  WHERE (("ados2_evaluations"."id" = "ados2_item_responses"."evaluation_id") AND ("ados2_evaluations"."therapist_id" = "auth"."uid"())))));

CREATE POLICY "therapist_own_quota" ON "public"."ai_usage_quotas" USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "therapist_own_quota" ON "public"."therapist_invite_quotas" USING (("auth"."uid"() = "therapist_id"));

CREATE POLICY "therapist_owns_adir_evaluations" ON "public"."adir_evaluations" USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "therapist_owns_adir_responses" ON "public"."adir_item_responses" USING (("evaluation_id" IN ( SELECT "adir_evaluations"."id"
   FROM "public"."adir_evaluations"
  WHERE ("adir_evaluations"."therapist_id" = "auth"."uid"()))));

CREATE POLICY "therapist_owns_stsg" ON "public"."stsg_evaluations" USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "therapist_owns_tecal" ON "public"."tecal_evaluations" USING (("therapist_id" = "auth"."uid"()));

CREATE POLICY "therapist_owns_teprosif" ON "public"."teprosif_evaluations" USING (("therapist_id" = "auth"."uid"()));

ALTER TABLE "public"."therapist_recommendations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "therapist_sees_own_grants" ON "public"."patient_access_grants" FOR SELECT USING ((("granted_to" = "auth"."uid"()) AND ("is_active" = true)));

CREATE POLICY "therapist_sees_related_log" ON "public"."clinical_access_log" FOR SELECT USING (("accessed_by" = "auth"."uid"()));

CREATE POLICY "therapist_select_own" ON "public"."therapist_details" FOR SELECT USING (("user_id" = "auth"."uid"()));

ALTER TABLE "public"."therapist_services" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "therapist_services_select_own_active" ON "public"."therapist_services" FOR SELECT TO "authenticated" USING ((("therapist_id" = "auth"."uid"()) AND ("is_active" = true)));

ALTER TABLE "public"."therapist_specialties" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."therapist_subscriptions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "therapist_update_own" ON "public"."therapist_details" FOR UPDATE USING (("user_id" = "auth"."uid"()));

ALTER TABLE "public"."therapists" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "therapists_insert_patient_notifications" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" IN ( SELECT "p"."profile_id"
   FROM "public"."patients" "p"
  WHERE (("p"."therapist_id" = "auth"."uid"()) AND ("p"."profile_id" IS NOT NULL)))) OR ("user_id" IN ( SELECT "pag"."profile_id"
   FROM "public"."patient_access_grants" "pag"
  WHERE (("pag"."granted_to" = "auth"."uid"()) AND ("pag"."is_active" = true))))));

CREATE POLICY "therapists_view_patient_profiles" ON "public"."profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."patients"
  WHERE (("patients"."profile_id" = "profiles"."id") AND ("patients"."therapist_id" = "auth"."uid"())))));

ALTER TABLE "public"."treatment_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_addons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_analytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_favorite_phrases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_notification_preferences" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_create_tickets" ON "public"."support_tickets" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));

CREATE POLICY "users_own_tickets" ON "public"."support_tickets" FOR SELECT USING (("user_id" = "auth"."uid"()));

CREATE POLICY "users_own_transactions" ON "public"."wallet_transactions" USING (("wallet_id" IN ( SELECT "wallets"."id"
   FROM "public"."wallets"
  WHERE ("wallets"."user_id" = "auth"."uid"()))));

CREATE POLICY "users_own_wallet" ON "public"."wallets" USING (("user_id" = "auth"."uid"()));

CREATE POLICY "users_own_withdrawals" ON "public"."withdrawal_requests" USING (("user_id" = "auth"."uid"()));

CREATE POLICY "users_update_own_tickets" ON "public"."support_tickets" FOR UPDATE USING (("user_id" = "auth"."uid"()));

ALTER TABLE "public"."wallet_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."withdrawal_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."word_searches" ENABLE ROW LEVEL SECURITY;
