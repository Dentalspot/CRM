CREATE POLICY "Admin full access logs" ON public.admin_audit_logs USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true)))));


--
--
CREATE POLICY "Admin full access payments" ON public.subscription_payments USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true)))));


--
--
CREATE POLICY "Admin full access plans" ON public.membership_plans USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true)))));


--
--
CREATE POLICY "Admin full access subscriptions" ON public.subscriptions USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true)))));


--
--
CREATE POLICY "Admin manage activity_categories" ON public.activity_categories USING (public.is_admin());


--
-- Name: billing_invoices Admin manage billing_invoices; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage billing_invoices" ON public.billing_invoices USING (public.is_admin());


--
-- Name: blog_article_tags Admin manage blog_article_tags; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage blog_article_tags" ON public.blog_article_tags USING (public.is_admin());


--
-- Name: blog_comments Admin manage blog_comments; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage blog_comments" ON public.blog_comments USING (public.is_admin());


--
-- Name: blog_tags Admin manage blog_tags; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage blog_tags" ON public.blog_tags USING (public.is_admin());


--
-- Name: clinical_entry_types Admin manage clinical_entry_types; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage clinical_entry_types" ON public.clinical_entry_types USING (public.is_admin());


--
-- Name: coupon_uses Admin manage coupon_uses; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage coupon_uses" ON public.coupon_uses USING (public.is_admin());


--
-- Name: course_lessons Admin manage course_lessons; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage course_lessons" ON public.course_lessons USING (public.is_admin());


--
-- Name: debug_signup_logs Admin manage debug_signup_logs; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage debug_signup_logs" ON public.debug_signup_logs USING (public.is_admin());


--
-- Name: diagnosis_specialty_map Admin manage diagnosis_specialty_map; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage diagnosis_specialty_map" ON public.diagnosis_specialty_map USING (public.is_admin());


--
-- Name: marketplace_plans Admin manage marketplace_plans; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage marketplace_plans" ON public.marketplace_plans USING (public.is_admin());


--
-- Name: marketplace_purchases Admin manage marketplace_purchases; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage marketplace_purchases" ON public.marketplace_purchases USING (public.is_admin());


--
-- Name: measure_scales Admin manage measure_scales; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage measure_scales" ON public.measure_scales USING (public.is_admin());


--
-- Name: moderation_logs Admin manage moderation_logs; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage moderation_logs" ON public.moderation_logs USING (public.is_admin());


--
-- Name: orders Admin manage orders; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage orders" ON public.orders USING (public.is_admin());


--
-- Name: patient_development_areas Admin manage patient_development_areas; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage patient_development_areas" ON public.patient_development_areas USING (public.is_admin());


--
-- Name: performance_metrics Admin manage performance_metrics; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage performance_metrics" ON public.performance_metrics USING (public.is_admin());


--
-- Name: pie_students Admin manage pie_students; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage pie_students" ON public.pie_students USING (public.is_admin());


--
-- Name: plan_template_exercises Admin manage plan_template_exercises; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage plan_template_exercises" ON public.plan_template_exercises USING (public.is_admin());


--
-- Name: products Admin manage products; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage products" ON public.products USING (public.is_admin());


--
-- Name: review_reports Admin manage review_reports; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage review_reports" ON public.review_reports USING (public.is_admin());


--
-- Name: schools Admin manage schools; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage schools" ON public.schools USING (public.is_admin());


--
-- Name: specialty_change_logs Admin manage specialty_change_logs; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage specialty_change_logs" ON public.specialty_change_logs USING (public.is_admin());


--
-- Name: specialty_keywords Admin manage specialty_keywords; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage specialty_keywords" ON public.specialty_keywords USING (public.is_admin());


--
-- Name: therapists Admin manage therapists; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin manage therapists" ON public.therapists USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admin read ai_chat_messages" ON public.ai_chat_messages FOR SELECT USING (public.is_admin());


--
-- Name: availability_logs Admin read availability_logs; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin read availability_logs" ON public.availability_logs FOR SELECT USING (public.is_admin());


--
-- Name: patient_activities Admin read patient_activities; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin read patient_activities" ON public.patient_activities FOR SELECT USING (public.is_admin());


--
-- Name: patient_evaluations Admin read patient_evaluations; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin read patient_evaluations" ON public.patient_evaluations FOR SELECT USING (public.is_admin());


--
-- Name: pie_paci Admin read pie_paci; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin read pie_paci" ON public.pie_paci FOR SELECT USING (public.is_admin());


--
-- Name: pie_schedule_blocks Admin read pie_schedule_blocks; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin read pie_schedule_blocks" ON public.pie_schedule_blocks FOR SELECT USING (public.is_admin());


--
-- Name: pie_sessions Admin read pie_sessions; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin read pie_sessions" ON public.pie_sessions FOR SELECT USING (public.is_admin());


--
-- Name: pie_therapist_schools Admin read pie_therapist_schools; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin read pie_therapist_schools" ON public.pie_therapist_schools FOR SELECT USING (public.is_admin());


--
-- Name: search_logs Admin read search_logs; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admin read search_logs" ON public.search_logs FOR SELECT USING (public.is_admin());


--
-- Name: faq_chatbot Admins can manage FAQs; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admins can manage FAQs" ON public.faq_chatbot USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can manage all coupons" ON public.discount_coupons TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can manage all patients" ON public.patients USING (public.is_admin());


--
-- Name: blog_reviews Admins can manage all reviews; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admins can manage all reviews" ON public.blog_reviews USING (public.has_role(VARIADIC ARRAY['admin'::text])) WITH CHECK (public.has_role(VARIADIC ARRAY['admin'::text]));


--
-- Name: admin_audit_logs Admins can manage audit logs; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admins can manage audit logs" ON public.admin_audit_logs USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can manage blog_categories" ON public.blog_categories USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can manage categories" ON public.blog_categories USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can manage coupons" ON public.discount_coupons USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can manage plans" ON public.subscription_plans USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can manage suggested courses" ON public.suggested_courses USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can manage ticket notes" ON public.support_ticket_notes USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can manage withdrawals" ON public.withdrawal_requests USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can read all appointments" ON public.appointments FOR SELECT USING (public.is_admin());


--
-- Name: cookie_consents Admins can read all consents; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admins can read all consents" ON public.cookie_consents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can read all marketplace items" ON public.marketplace_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can read all patients" ON public.patients FOR SELECT USING (public.is_admin());


--
-- Name: profiles Admins can read all profiles; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (public.is_admin());


--
-- Name: therapist_subscriptions Admins can read all subscriptions; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admins can read all subscriptions" ON public.therapist_subscriptions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can read blog_posts" ON public.blog_posts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can read clinical_history" ON public.clinical_history FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can read cookie consents" ON public.cookie_consents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can read own permissions" ON public.admin_permissions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: patient_questions Admins can read patient_questions; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admins can read patient_questions" ON public.patient_questions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can read session_activities" ON public.session_activities FOR SELECT USING (public.is_admin());


--
-- Name: marketplace_items Admins can update marketplace items; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admins can update marketplace items" ON public.marketplace_items FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(VARIADIC ARRAY['admin'::text]));


--
-- Name: progress_reports Admins can view all reports; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admins can view all reports" ON public.progress_reports FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins can write blog_posts" ON public.blog_posts USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins have full access to blog posts" ON public.blog_posts USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins have full access to therapist details" ON public.therapist_details USING ((public.get_user_role(auth.uid()) = 'admin'::text));


--
-- Name: ai_settings Admins manage ai_settings; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Admins manage ai_settings" ON public.ai_settings USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins manage arco requests" ON public.arco_requests USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins manage commissions" ON public.commissions TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins manage leads" ON public.marketing_leads USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins manage legal_disputes" ON public.legal_disputes USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins manage legal_documents" ON public.legal_documents USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins manage legal_policies" ON public.legal_policies USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins manage legal_signatures" ON public.legal_signatures USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins manage legal_versions" ON public.legal_document_versions USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins read all feedback" ON public.platform_feedback USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins read all patient_documents" ON public.patient_documents USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.admin_permissions
  WHERE (admin_permissions.user_id = auth.uid()))));


--
--
CREATE POLICY "Admins read marketplace_payouts" ON public.marketplace_payouts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins read sales_summary" ON public.sales_summary FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins read therapist_commissions" ON public.therapist_commissions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins update marketplace_payouts" ON public.marketplace_payouts FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Admins view all sales" ON public.sales FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY "Allow full access for service_role" ON public.profiles USING ((auth.role() = 'service_role'::text));


--
-- Name: report_logs Allow insert for authenticated; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Allow insert for authenticated" ON public.report_logs FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: services Allow insert for own services; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Allow insert for own services" ON public.services FOR INSERT TO authenticated WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: services Allow public read access to active services; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Allow public read access to active services" ON public.services FOR SELECT USING ((is_active = true));


--
-- Name: services Allow update and delete for own services; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Allow update and delete for own services" ON public.services TO authenticated USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: cookie_consents Anyone can insert cookie consent; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Anyone can insert cookie consent" ON public.cookie_consents FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: diagnosis_codes Anyone can read diagnosis codes; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Anyone can read diagnosis codes" ON public.diagnosis_codes FOR SELECT USING (true);


--
-- Name: diagnosis_systems Anyone can read diagnosis systems; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Anyone can read diagnosis systems" ON public.diagnosis_systems FOR SELECT USING (true);


--
-- Name: subscription_plans Anyone can read plans; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Anyone can read plans" ON public.subscription_plans FOR SELECT USING (true);


--
-- Name: marketplace_reviews Anyone can read reviews; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Anyone can read reviews" ON public.marketplace_reviews FOR SELECT USING (true);


--
-- Name: marketplace_review_votes Anyone can read votes; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Anyone can read votes" ON public.marketplace_review_votes FOR SELECT USING (true);


--
-- Name: therapist_details Anyone can view therapist details; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Anyone can view therapist details" ON public.therapist_details FOR SELECT USING (true);


--
-- Name: discount_coupons Authenticated users can view active coupons; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Authenticated users can view active coupons" ON public.discount_coupons FOR SELECT TO authenticated USING (((is_active = true) AND ((expiration_date IS NULL) OR (expiration_date > now()))));


--
-- Name: marketplace_review_votes Authenticated users can vote; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Authenticated users can vote" ON public.marketplace_review_votes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: marketplace_plans Authors manage own marketplace_plans; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Authors manage own marketplace_plans" ON public.marketplace_plans USING ((auth.uid() = author_id));


--
-- Name: marketplace_reviews Buyers can create reviews; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Buyers can create reviews" ON public.marketplace_reviews FOR INSERT WITH CHECK ((auth.uid() = reviewer_id));


--
-- Name: marketplace_purchases Buyers insert marketplace_purchases; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Buyers insert marketplace_purchases" ON public.marketplace_purchases FOR INSERT WITH CHECK ((auth.uid() = buyer_id));


--
-- Name: marketplace_purchases Buyers read own marketplace_purchases; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Buyers read own marketplace_purchases" ON public.marketplace_purchases FOR SELECT USING ((auth.uid() = buyer_id));


--
-- Name: sales Buyers view own purchases; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Buyers view own purchases" ON public.sales FOR SELECT TO authenticated USING ((buyer_id = auth.uid()));


--
-- Name: clinic_invitations Clinic owners can create invitations; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Clinic owners can create invitations" ON public.clinic_invitations FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.clinics c
  WHERE ((c.id = clinic_invitations.clinic_id) AND (c.therapist_id = auth.uid())))));


--
--
CREATE POLICY "Clinic owners can manage their invoices" ON public.clinic_invoices USING ((clinic_id IN ( SELECT clinics.id
   FROM public.clinics
  WHERE (clinics.therapist_id = auth.uid())))) WITH CHECK ((clinic_id IN ( SELECT clinics.id
   FROM public.clinics
  WHERE (clinics.therapist_id = auth.uid()))));

--
CREATE POLICY "Clinic owners can update invitations" ON public.clinic_invitations FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.clinics c
  WHERE ((c.id = clinic_invitations.clinic_id) AND (c.therapist_id = auth.uid())))));


--
--
CREATE POLICY "Clinic owners can view invitations" ON public.clinic_invitations FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.clinics c
  WHERE ((c.id = clinic_invitations.clinic_id) AND (c.therapist_id = auth.uid())))));


--
--
CREATE POLICY "Create own activities" ON public.activity_library FOR INSERT WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: treatment_plans Create own plans; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Create own plans" ON public.treatment_plans FOR INSERT WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: activity_library Delete own activities; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Delete own activities" ON public.activity_library FOR DELETE USING ((therapist_id = auth.uid()));


--
-- Name: treatment_plans Delete own plans; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Delete own plans" ON public.treatment_plans FOR DELETE USING ((therapist_id = auth.uid()));


--
-- Name: treatment_plans Edit own plans; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Edit own plans" ON public.treatment_plans FOR UPDATE USING ((therapist_id = auth.uid()));


--
-- Name: marketplace_items Enable delete for users based on seller_id; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Enable delete for users based on seller_id" ON public.marketplace_items FOR DELETE USING ((auth.uid() = seller_id));


--
-- Name: marketplace_orders Enable insert for buyers; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Enable insert for buyers" ON public.marketplace_orders FOR INSERT WITH CHECK ((auth.uid() = buyer_id));


--
-- Name: order_items Enable insert for order items; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Enable insert for order items" ON public.order_items FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.marketplace_orders
  WHERE ((marketplace_orders.id = order_items.order_id) AND (marketplace_orders.buyer_id = auth.uid())))));


--
--
CREATE POLICY "Enable insert for users based on seller_id" ON public.marketplace_items FOR INSERT WITH CHECK ((auth.uid() = seller_id));


--
-- Name: marketplace_items Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Enable read access for all users" ON public.marketplace_items FOR SELECT USING ((((is_active = true) AND (is_approved = true)) OR (auth.uid() = seller_id)));


--
-- Name: marketplace_orders Enable select for buyers; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Enable select for buyers" ON public.marketplace_orders FOR SELECT USING ((auth.uid() = buyer_id));


--
-- Name: order_items Enable select for order items; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Enable select for order items" ON public.order_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.marketplace_orders
  WHERE ((marketplace_orders.id = order_items.order_id) AND (marketplace_orders.buyer_id = auth.uid())))));


--
--
CREATE POLICY "Enable update for users based on seller_id" ON public.marketplace_items FOR UPDATE USING ((auth.uid() = seller_id));


--
-- Name: faq_chatbot Everyone can read FAQs; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Everyone can read FAQs" ON public.faq_chatbot FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: therapist_favorite_activities Manage own favorites; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Manage own favorites" ON public.therapist_favorite_activities USING ((therapist_id = auth.uid()));


--
-- Name: team_members Owners and admins can invite members; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Owners and admins can invite members" ON public.team_members FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.team_members team_members_1
  WHERE ((team_members_1.user_id = auth.uid()) AND (team_members_1.clinic_id = team_members_1.clinic_id) AND (team_members_1.role = ANY (ARRAY['owner'::text, 'admin'::text])) AND (team_members_1.status = 'active'::text)))));


--
--
CREATE POLICY "Owners and admins can update members" ON public.team_members FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.team_members team_members_1
  WHERE ((team_members_1.user_id = auth.uid()) AND (team_members_1.clinic_id = team_members_1.clinic_id) AND (team_members_1.role = ANY (ARRAY['owner'::text, 'admin'::text])) AND (team_members_1.status = 'active'::text)))));


--
--
CREATE POLICY "Patients can manage their own questions" ON public.patient_questions USING ((patient_id = auth.uid())) WITH CHECK ((patient_id = auth.uid()));


--
-- Name: clinical_reports Patients can view own reports; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Patients can view own reports" ON public.clinical_reports FOR SELECT USING (((auth.uid() = patient_id) AND (status = ANY (ARRAY['validated'::public.report_status, 'signed'::public.report_status, 'locked'::public.report_status]))));


--
-- Name: session_activities Patients can view session activities; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Patients can view session activities" ON public.session_activities FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.plan_sessions ps
     JOIN public.patient_assigned_plans pap ON ((pap.id = ps.assigned_plan_id)))
  WHERE ((ps.id = session_activities.session_id) AND (pap.patient_id = auth.uid())))));


--
CREATE POLICY "Patients can view shared reports" ON public.progress_reports FOR SELECT USING (((auth.uid() = patient_id) AND (shared_with_patient = true)));


--
-- Name: patient_assigned_plans Patients can view their assigned plans; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Patients can view their assigned plans" ON public.patient_assigned_plans FOR SELECT USING ((auth.uid() = patient_id));


--
-- Name: patient_payments Patients can view their own payments; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Patients can view their own payments" ON public.patient_payments FOR SELECT USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.profile_id = auth.uid()))));


--
--
CREATE POLICY "Patients can view their plan sessions" ON public.plan_sessions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.patient_assigned_plans pap
  WHERE ((pap.id = plan_sessions.assigned_plan_id) AND (pap.patient_id = auth.uid())))));


--
--
CREATE POLICY "Patients read own documents" ON public.patient_documents FOR SELECT USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.profile_id = auth.uid()))));


--
--
CREATE POLICY "Patients read own motivational_patient" ON public.motivational_patient FOR SELECT USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.profile_id = auth.uid()))));


--
--
CREATE POLICY "Patients read own orders" ON public.orders FOR SELECT USING ((auth.uid() = patient_id));


--
-- Name: patient_activities Patients read own patient_activities; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Patients read own patient_activities" ON public.patient_activities FOR SELECT USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.profile_id = auth.uid()))));


--
--
CREATE POLICY "Patients read own patient_evaluations" ON public.patient_evaluations FOR SELECT USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.profile_id = auth.uid()))));


--
--
CREATE POLICY "Patients read own patient_goals" ON public.patient_goals FOR SELECT USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.profile_id = auth.uid()))));


--
--
CREATE POLICY "Patients read own patient_materials" ON public.patient_materials FOR SELECT USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.profile_id = auth.uid()))));


--
--
CREATE POLICY "Public can not view blocked times" ON public.blocked_times FOR SELECT USING (false);


--
-- Name: blog_categories Public can read categories; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public can read categories" ON public.blog_categories FOR SELECT USING (true);


--
-- Name: email_templates Public can view active email templates; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public can view active email templates" ON public.email_templates FOR SELECT USING ((is_active = true));


--
-- Name: therapist_services Public can view active therapist services; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public can view active therapist services" ON public.therapist_services FOR SELECT USING ((is_active = true));


--
-- Name: therapist_availabilities Public can view availabilities; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public can view availabilities" ON public.therapist_availabilities FOR SELECT USING (true);


--
-- Name: cities Public can view cities; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public can view cities" ON public.cities FOR SELECT TO authenticated, anon USING (true);


--
-- Name: insurance_providers Public can view insurance providers; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public can view insurance providers" ON public.insurance_providers FOR SELECT USING ((is_active = true));


--
-- Name: therapist_education Public can view public education records; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public can view public education records" ON public.therapist_education FOR SELECT USING ((is_public = true));


--
-- Name: therapist_services Public can view public services; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public can view public services" ON public.therapist_services FOR SELECT USING ((is_public = true));


--
-- Name: therapist_experience Public can view public therapist experience; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public can view public therapist experience" ON public.therapist_experience FOR SELECT USING ((is_public = true));


--
-- Name: therapist_landing_pages Public can view published landing pages; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public can view published landing pages" ON public.therapist_landing_pages FOR SELECT USING ((published = true));


--
-- Name: regions Public can view regions; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public can view regions" ON public.regions FOR SELECT TO authenticated, anon USING (true);


--
-- Name: specialties Public can view specialties; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public can view specialties" ON public.specialties FOR SELECT TO authenticated, anon USING (true);


--
-- Name: specialties Public can view specialties catalog; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public can view specialties catalog" ON public.specialties FOR SELECT TO authenticated, anon USING (true);


--
-- Name: therapist_branding Public can view therapist branding; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public can view therapist branding" ON public.therapist_branding FOR SELECT USING (true);


--
-- Name: profiles Public can view therapist profiles; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public can view therapist profiles" ON public.profiles FOR SELECT USING ((role = 'therapist'::public.user_role));


--
-- Name: planification_types Public read access to planification types; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read access to planification types" ON public.planification_types FOR SELECT USING (true);


--
-- Name: products Public read active products; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (true);


--
-- Name: activity_categories Public read activity_categories; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read activity_categories" ON public.activity_categories FOR SELECT USING (true);


--
-- Name: blog_comments Public read approved blog_comments; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read approved blog_comments" ON public.blog_comments FOR SELECT USING ((status = 'approved'::text));


--
-- Name: blog_article_tags Public read blog_article_tags; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read blog_article_tags" ON public.blog_article_tags FOR SELECT USING (true);


--
-- Name: blog_tags Public read blog_tags; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read blog_tags" ON public.blog_tags FOR SELECT USING (true);


--
-- Name: clinical_entry_types Public read clinical_entry_types; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read clinical_entry_types" ON public.clinical_entry_types FOR SELECT USING (true);


--
-- Name: course_lessons Public read course_lessons; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read course_lessons" ON public.course_lessons FOR SELECT USING (true);


--
-- Name: diagnosis_specialty_map Public read diagnosis_specialty_map; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read diagnosis_specialty_map" ON public.diagnosis_specialty_map FOR SELECT USING (true);


--
-- Name: measure_scales Public read measure_scales; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read measure_scales" ON public.measure_scales FOR SELECT USING (true);


--
-- Name: patient_development_areas Public read patient_development_areas; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read patient_development_areas" ON public.patient_development_areas FOR SELECT USING (true);


--
-- Name: patient_reviews Public read patient_reviews; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read patient_reviews" ON public.patient_reviews FOR SELECT USING (true);


--
-- Name: plan_template_exercises Public read plan_template_exercises; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read plan_template_exercises" ON public.plan_template_exercises FOR SELECT USING (true);


--
-- Name: membership_plans Public read plans; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read plans" ON public.membership_plans FOR SELECT USING (true);


--
-- Name: legal_documents Public read published docs; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read published docs" ON public.legal_documents FOR SELECT USING ((status = 'published'::text));


--
-- Name: marketplace_plans Public read published marketplace_plans; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read published marketplace_plans" ON public.marketplace_plans FOR SELECT USING (((status = 'published'::text) OR (auth.uid() = author_id)));


--
-- Name: schools Public read schools; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read schools" ON public.schools FOR SELECT USING (true);


--
-- Name: specialty_keywords Public read specialty_keywords; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read specialty_keywords" ON public.specialty_keywords FOR SELECT USING (true);


--
-- Name: therapist_insurances Public read therapist_insurances; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read therapist_insurances" ON public.therapist_insurances FOR SELECT USING (true);


--
-- Name: therapists Public read therapists; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Public read therapists" ON public.therapists FOR SELECT USING (true);


--
-- Name: blog_posts Published blog posts are public; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Published blog posts are public" ON public.blog_posts FOR SELECT USING ((status = 'published'::text));


--
-- Name: marketplace_reviews Reviewers can delete own reviews; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Reviewers can delete own reviews" ON public.marketplace_reviews FOR DELETE USING ((auth.uid() = reviewer_id));


--
-- Name: marketplace_reviews Reviewers can update own reviews; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Reviewers can update own reviews" ON public.marketplace_reviews FOR UPDATE USING ((auth.uid() = reviewer_id));


--
-- Name: marketplace_reviews Reviews are public; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Reviews are public" ON public.marketplace_reviews FOR SELECT USING ((is_visible = true));


--
-- Name: sales Sellers view own sales; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Sellers view own sales" ON public.sales FOR SELECT TO authenticated USING ((seller_id = auth.uid()));


--
-- Name: ai_conversation_analysis Service insert ai_conversation_analysis; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Service insert ai_conversation_analysis" ON public.ai_conversation_analysis FOR INSERT WITH CHECK (true);


--
-- Name: therapist_recommendations Service role manages recommendations; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Service role manages recommendations" ON public.therapist_recommendations USING (true);


--
-- Name: team_members Team members can view their clinic members; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Team members can view their clinic members" ON public.team_members FOR SELECT USING (((clinic_id IN ( SELECT tm.clinic_id
   FROM public.team_members tm
  WHERE ((tm.user_id = auth.uid()) AND (tm.status = 'active'::text)))) OR (user_id = auth.uid())));


--
--
CREATE POLICY "Terapeuta ve sus propios datos PIE" ON public.pie_student_data USING ((therapist_id = auth.uid()));


--
-- Name: therapist_favorite_activities Terapeutas pueden agregar favoritos; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Terapeutas pueden agregar favoritos" ON public.therapist_favorite_activities FOR INSERT WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: therapist_favorite_activities Terapeutas pueden eliminar sus favoritos; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Terapeutas pueden eliminar sus favoritos" ON public.therapist_favorite_activities FOR DELETE USING ((auth.uid() = therapist_id));


--
-- Name: therapist_favorite_activities Terapeutas pueden ver sus favoritos; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Terapeutas pueden ver sus favoritos" ON public.therapist_favorite_activities FOR SELECT USING ((auth.uid() = therapist_id));


--
-- Name: patient_diagnoses Therapist can manage patient diagnoses; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapist can manage patient diagnoses" ON public.patient_diagnoses USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: adir_evaluations Therapist owns adir_evaluations; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapist owns adir_evaluations" ON public.adir_evaluations USING ((therapist_id = auth.uid()));


--
-- Name: adir_item_responses Therapist owns adir_item_responses; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapist owns adir_item_responses" ON public.adir_item_responses USING ((evaluation_id IN ( SELECT adir_evaluations.id
   FROM public.adir_evaluations
  WHERE (adir_evaluations.therapist_id = auth.uid()))));


--
--
CREATE POLICY "Therapists can delete own exercises" ON public.therapist_exercises FOR DELETE USING ((therapist_id = auth.uid()));


--
-- Name: therapist_materials Therapists can delete own materials; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can delete own materials" ON public.therapist_materials FOR DELETE USING ((therapist_id = auth.uid()));


--
-- Name: scheduled_reminders Therapists can delete own scheduled reminders; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can delete own scheduled reminders" ON public.scheduled_reminders FOR DELETE USING ((auth.uid() = therapist_id));


--
-- Name: patient_document_templates Therapists can delete own templates; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can delete own templates" ON public.patient_document_templates FOR DELETE USING ((therapist_id = auth.uid()));


--
-- Name: therapist_conditions Therapists can delete their own conditions; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can delete their own conditions" ON public.therapist_conditions FOR DELETE USING ((therapist_id = auth.uid()));


--
-- Name: therapist_education Therapists can delete their own education; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can delete their own education" ON public.therapist_education FOR DELETE USING ((auth.uid() = therapist_id));


--
-- Name: generated_templates Therapists can delete their own generated templates; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can delete their own generated templates" ON public.generated_templates FOR DELETE USING ((auth.uid() = therapist_id));


--
-- Name: therapist_specialties Therapists can delete their own specialties; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can delete their own specialties" ON public.therapist_specialties FOR DELETE TO authenticated USING ((therapist_id = auth.uid()));


--
-- Name: patient_activity_logs Therapists can insert activity logs; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can insert activity logs" ON public.patient_activity_logs FOR INSERT WITH CHECK (((auth.uid() = therapist_id) OR (EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.id = patient_activity_logs.patient_id) AND (patients.therapist_id = auth.uid()))))));


--
--
CREATE POLICY "Therapists can insert own exercises" ON public.therapist_exercises FOR INSERT WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: therapist_materials Therapists can insert own materials; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can insert own materials" ON public.therapist_materials FOR INSERT WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: scheduled_reminders Therapists can insert own scheduled reminders; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can insert own scheduled reminders" ON public.scheduled_reminders FOR INSERT WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: patient_document_templates Therapists can insert own templates; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can insert own templates" ON public.patient_document_templates FOR INSERT WITH CHECK (((therapist_id = auth.uid()) OR (therapist_id IS NULL)));


--
-- Name: suggested_courses Therapists can insert suggestions; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can insert suggestions" ON public.suggested_courses FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'therapist'::public.user_role)))));


--
--
CREATE POLICY "Therapists can insert their own conditions" ON public.therapist_conditions FOR INSERT WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: therapist_education Therapists can insert their own education; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can insert their own education" ON public.therapist_education FOR INSERT WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: generated_templates Therapists can insert their own generated templates; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can insert their own generated templates" ON public.generated_templates FOR INSERT WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: therapist_specialties Therapists can insert their own specialties; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can insert their own specialties" ON public.therapist_specialties FOR INSERT TO authenticated WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: patient_assigned_plans Therapists can manage assigned plans; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage assigned plans" ON public.patient_assigned_plans USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: patient_private_notes Therapists can manage notes for their own patients; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage notes for their own patients" ON public.patient_private_notes USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: plan_objective_activities Therapists can manage objective activities; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage objective activities" ON public.plan_objective_activities USING ((EXISTS ( SELECT 1
   FROM (public.plan_objectives po
     JOIN public.treatment_plans tp ON ((tp.id = po.plan_id)))
  WHERE ((po.id = plan_objective_activities.objective_id) AND (tp.therapist_id = auth.uid())))));


--
CREATE POLICY "Therapists can manage own availability" ON public.therapist_availabilities USING ((auth.uid() = therapist_id));


--
-- Name: therapist_branding Therapists can manage own branding; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage own branding" ON public.therapist_branding USING ((auth.uid() = therapist_id)) WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: therapist_landing_pages Therapists can manage own landing page; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage own landing page" ON public.therapist_landing_pages USING ((auth.uid() = therapist_id));


--
-- Name: clinical_reports Therapists can manage own reports; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage own reports" ON public.clinical_reports USING (((auth.uid() = therapist_id) OR public.has_role(VARIADIC ARRAY['therapist'::text, 'admin'::text])));


--
-- Name: therapist_services Therapists can manage own services; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage own services" ON public.therapist_services USING ((auth.uid() = therapist_id));


--
-- Name: plan_objectives Therapists can manage plan objectives; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage plan objectives" ON public.plan_objectives USING ((EXISTS ( SELECT 1
   FROM public.treatment_plans tp
  WHERE ((tp.id = plan_objectives.plan_id) AND (tp.therapist_id = auth.uid())))));


--
--
CREATE POLICY "Therapists can manage plan sessions" ON public.plan_sessions USING ((EXISTS ( SELECT 1
   FROM public.patient_assigned_plans pap
  WHERE ((pap.id = plan_sessions.assigned_plan_id) AND (pap.therapist_id = auth.uid())))));


--
--
CREATE POLICY "Therapists can manage session activities" ON public.session_activities USING ((EXISTS ( SELECT 1
   FROM (public.plan_sessions ps
     JOIN public.patient_assigned_plans pap ON ((pap.id = ps.assigned_plan_id)))
  WHERE ((ps.id = session_activities.session_id) AND (pap.therapist_id = auth.uid())))));


--
CREATE POLICY "Therapists can manage their generated reports" ON public.progress_reports USING ((auth.uid() = therapist_id));


--
-- Name: blocked_times Therapists can manage their own blocked times; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage their own blocked times" ON public.blocked_times TO authenticated USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: blog_posts Therapists can manage their own blog posts; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage their own blog posts" ON public.blog_posts USING ((author_id = auth.uid())) WITH CHECK ((author_id = auth.uid()));


--
-- Name: clinical_history Therapists can manage their own clinical history entries; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage their own clinical history entries" ON public.clinical_history USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: therapist_details Therapists can manage their own details; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage their own details" ON public.therapist_details USING ((auth.uid() = user_id));


--
-- Name: therapist_documents Therapists can manage their own documents; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage their own documents" ON public.therapist_documents USING ((auth.uid() = therapist_id)) WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: therapist_experience Therapists can manage their own experience; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage their own experience" ON public.therapist_experience USING ((auth.uid() = therapist_id)) WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: notiz_sessions Therapists can manage their own notiz sessions; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage their own notiz sessions" ON public.notiz_sessions USING ((auth.uid() = therapist_id));


--
-- Name: patient_documents Therapists can manage their own patient documents; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage their own patient documents" ON public.patient_documents USING ((auth.uid() = therapist_id));


--
-- Name: payments Therapists can manage their own payments; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage their own payments" ON public.payments TO authenticated USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: treatment_plans Therapists can manage their own treatment plans; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage their own treatment plans" ON public.treatment_plans TO authenticated USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: patient_payments Therapists can manage their patient payments; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can manage their patient payments" ON public.patient_payments USING ((therapist_id = auth.uid()));


--
-- Name: generated_templates Therapists can see their own generated templates; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can see their own generated templates" ON public.generated_templates FOR SELECT USING ((auth.uid() = therapist_id));


--
-- Name: therapist_exercises Therapists can update own exercises; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can update own exercises" ON public.therapist_exercises FOR UPDATE USING ((therapist_id = auth.uid()));


--
-- Name: therapist_materials Therapists can update own materials; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can update own materials" ON public.therapist_materials FOR UPDATE USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: scheduled_reminders Therapists can update own scheduled reminders; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can update own scheduled reminders" ON public.scheduled_reminders FOR UPDATE USING ((auth.uid() = therapist_id));


--
-- Name: patient_document_templates Therapists can update own templates; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can update own templates" ON public.patient_document_templates FOR UPDATE USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: profiles Therapists can update patient profiles; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can update patient profiles" ON public.profiles FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.profile_id = profiles.id) AND (patients.therapist_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.profile_id = profiles.id) AND (patients.therapist_id = auth.uid())))));

--
CREATE POLICY "Therapists can update patient questions" ON public.patient_questions FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.patients p
  WHERE ((p.profile_id = patient_questions.patient_id) AND (p.therapist_id = auth.uid())))));


--
--
CREATE POLICY "Therapists can update their own education" ON public.therapist_education FOR UPDATE USING ((auth.uid() = therapist_id));


--
-- Name: generated_templates Therapists can update their own generated templates; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can update their own generated templates" ON public.generated_templates FOR UPDATE USING ((auth.uid() = therapist_id));


--
-- Name: patient_questions Therapists can view all questions; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can view all questions" ON public.patient_questions FOR SELECT TO authenticated USING ((public.get_user_role(auth.uid()) = 'therapist'::text));


--
-- Name: patient_document_templates Therapists can view own and global templates; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can view own and global templates" ON public.patient_document_templates FOR SELECT USING (((therapist_id = auth.uid()) OR (is_global = true)));


--
-- Name: therapist_exercises Therapists can view own and public exercises; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can view own and public exercises" ON public.therapist_exercises FOR SELECT USING (((therapist_id = auth.uid()) OR (is_public = true)));


--
-- Name: therapist_materials Therapists can view own materials; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can view own materials" ON public.therapist_materials FOR SELECT USING ((therapist_id = auth.uid()));


--
-- Name: reminder_logs Therapists can view own reminder logs; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can view own reminder logs" ON public.reminder_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.appointments a
  WHERE ((a.id = reminder_logs.appointment_id) AND (a.therapist_id = auth.uid())))));


--
--
CREATE POLICY "Therapists can view own scheduled reminders" ON public.scheduled_reminders FOR SELECT USING ((auth.uid() = therapist_id));


--
-- Name: suggested_courses Therapists can view own suggestions; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can view own suggestions" ON public.suggested_courses FOR SELECT USING ((suggested_by = auth.uid()));


--
-- Name: blog_reviews Therapists can view reviews on their posts; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can view reviews on their posts" ON public.blog_reviews FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.blog_posts
  WHERE ((blog_posts.id = blog_reviews.blog_post_id) AND (blog_posts.author_id = auth.uid())))));


--
--
CREATE POLICY "Therapists can view their own conditions" ON public.therapist_conditions FOR SELECT USING ((therapist_id = auth.uid()));


--
-- Name: therapist_education Therapists can view their own education; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can view their own education" ON public.therapist_education FOR SELECT USING ((auth.uid() = therapist_id));


--
-- Name: therapist_specialties Therapists can view their own specialties; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists can view their own specialties" ON public.therapist_specialties FOR SELECT TO authenticated USING ((therapist_id = auth.uid()));


--
-- Name: billing_invoices Therapists insert billing_invoices; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists insert billing_invoices" ON public.billing_invoices FOR INSERT WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: pie_students Therapists insert pie_students; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists insert pie_students" ON public.pie_students FOR INSERT WITH CHECK (true);


--
-- Name: motivational_patient Therapists manage motivational_patient; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists manage motivational_patient" ON public.motivational_patient USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.therapist_id = auth.uid()))));


--
--
CREATE POLICY "Therapists manage own availability_logs" ON public.availability_logs USING ((auth.uid() = therapist_id));


--
-- Name: patient_evaluations Therapists manage own patient_evaluations; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists manage own patient_evaluations" ON public.patient_evaluations USING ((auth.uid() = therapist_id));


--
-- Name: patient_materials Therapists manage own patient_materials; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists manage own patient_materials" ON public.patient_materials USING ((auth.uid() = therapist_id));


--
-- Name: patient_reviews Therapists manage own patient_reviews; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists manage own patient_reviews" ON public.patient_reviews USING ((auth.uid() = therapist_id));


--
-- Name: pie_paci Therapists manage own pie_paci; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists manage own pie_paci" ON public.pie_paci USING ((auth.uid() = therapist_id));


--
-- Name: pie_schedule_blocks Therapists manage own pie_schedule_blocks; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists manage own pie_schedule_blocks" ON public.pie_schedule_blocks USING ((auth.uid() = therapist_id));


--
-- Name: pie_sessions Therapists manage own pie_sessions; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists manage own pie_sessions" ON public.pie_sessions USING ((auth.uid() = therapist_id));


--
-- Name: pie_therapist_schools Therapists manage own pie_therapist_schools; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists manage own pie_therapist_schools" ON public.pie_therapist_schools USING ((auth.uid() = therapist_id));


--
-- Name: products Therapists manage own products; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists manage own products" ON public.products USING ((auth.uid() = therapist_id));


--
-- Name: sensorial_evaluations Therapists manage own sensorial evals; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists manage own sensorial evals" ON public.sensorial_evaluations USING ((therapist_id = auth.uid()));


--
-- Name: therapist_specialties Therapists manage own specialties; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists manage own specialties" ON public.therapist_specialties USING (((auth.uid() = therapist_id) OR public.has_role(VARIADIC ARRAY['admin'::text])));


--
-- Name: therapist_insurances Therapists manage own therapist_insurances; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists manage own therapist_insurances" ON public.therapist_insurances USING ((auth.uid() = therapist_id));


--
-- Name: patient_activities Therapists manage patient_activities; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists manage patient_activities" ON public.patient_activities USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.therapist_id = auth.uid()))));


--
--
CREATE POLICY "Therapists manage patient_goals" ON public.patient_goals USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.therapist_id = auth.uid()))));


--
--
CREATE POLICY "Therapists manage sensorial responses" ON public.sensorial_item_responses USING ((evaluation_id IN ( SELECT sensorial_evaluations.id
   FROM public.sensorial_evaluations
  WHERE (sensorial_evaluations.therapist_id = auth.uid()))));


--
--
CREATE POLICY "Therapists read own billing_invoices" ON public.billing_invoices FOR SELECT USING ((auth.uid() = therapist_id));


--
-- Name: orders Therapists read own orders; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists read own orders" ON public.orders FOR SELECT USING ((auth.uid() = therapist_id));


--
-- Name: specialty_change_logs Therapists read own specialty_change_logs; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists read own specialty_change_logs" ON public.specialty_change_logs FOR SELECT USING ((auth.uid() = therapist_id));


--
-- Name: pie_students Therapists read pie_students via schools; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Therapists read pie_students via schools" ON public.pie_students FOR SELECT USING ((school_id IN ( SELECT pie_therapist_schools.school_id
   FROM public.pie_therapist_schools
  WHERE (pie_therapist_schools.therapist_id = auth.uid()))));


--
--
CREATE POLICY "Therapists view own commissions" ON public.commissions FOR SELECT TO authenticated USING ((therapist_id = auth.uid()));


--
-- Name: activity_library Update own activities; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Update own activities" ON public.activity_library FOR UPDATE USING ((therapist_id = auth.uid()));


--
-- Name: ai_chat_sessions Users can create chat sessions; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can create chat sessions" ON public.ai_chat_sessions FOR INSERT WITH CHECK (((auth.uid() = patient_id) OR (auth.uid() = therapist_id) OR (session_type = 'anonymous'::text)));


--
-- Name: refund_requests Users can create refund requests; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can create refund requests" ON public.refund_requests FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: withdrawal_requests Users can create withdrawals; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can create withdrawals" ON public.withdrawal_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: marketplace_review_votes Users can delete own votes; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can delete own votes" ON public.marketplace_review_votes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: report_logs Users can insert own logs; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can insert own logs" ON public.report_logs FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: ai_feedback Users can manage own AI feedback; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can manage own AI feedback" ON public.ai_feedback USING (((auth.uid() = patient_id) OR (auth.uid() = therapist_id) OR public.has_role(VARIADIC ARRAY['admin'::text])));


--
-- Name: marketplace_reviews Users can manage own reviews; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can manage own reviews" ON public.marketplace_reviews USING ((reviewer_id = auth.uid()));


--
-- Name: review_helpful_votes Users can manage own votes; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can manage own votes" ON public.review_helpful_votes USING ((user_id = auth.uid()));


--
-- Name: user_notification_preferences Users can manage their own notification preferences; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can manage their own notification preferences" ON public.user_notification_preferences USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: marketplace_saved_searches Users can manage their own saved searches; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can manage their own saved searches" ON public.marketplace_saved_searches USING ((auth.uid() = user_id));


--
-- Name: word_searches Users can manage their own word searches; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can manage their own word searches" ON public.word_searches USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_addons Users can read own addons; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can read own addons" ON public.user_addons FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: cookie_consents Users can read own consent; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can read own consent" ON public.cookie_consents FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: therapist_subscriptions Users can read own subscriptions; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can read own subscriptions" ON public.therapist_subscriptions FOR SELECT USING ((therapist_id = auth.uid()));


--
-- Name: notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: marketplace_review_votes Users can update own votes; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can update own votes" ON public.marketplace_review_votes FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: user_analytics Users can view own analytics; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can view own analytics" ON public.user_analytics FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_chat_sessions Users can view own chat sessions; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can view own chat sessions" ON public.ai_chat_sessions FOR SELECT USING (((auth.uid() = patient_id) OR (auth.uid() = therapist_id) OR (session_type = 'anonymous'::text)));


--
-- Name: email_notifications Users can view own email notifications; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can view own email notifications" ON public.email_notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: report_logs Users can view own logs; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can view own logs" ON public.report_logs FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: metrics_summary Users can view own metrics; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can view own metrics" ON public.metrics_summary FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: refund_requests Users can view own refund requests; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can view own refund requests" ON public.refund_requests FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: wallet_transactions Users can view own transactions; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.wallets w
  WHERE ((w.id = wallet_transactions.wallet_id) AND (w.user_id = auth.uid())))));


--
--
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: withdrawal_requests Users can view own withdrawals; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: report_logs Users can view report logs for their reports; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can view report logs for their reports" ON public.report_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.clinical_reports cr
  WHERE ((cr.id = report_logs.report_id) AND ((cr.therapist_id = auth.uid()) OR (cr.patient_id = auth.uid()))))));


--
--
CREATE POLICY "Users can view their own notification preferences" ON public.user_notification_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: arco_requests Users create own arco requests; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users create own arco requests" ON public.arco_requests FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: platform_feedback Users create own feedback; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users create own feedback" ON public.platform_feedback FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: ai_chat_messages Users insert ai_chat_messages; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users insert ai_chat_messages" ON public.ai_chat_messages FOR INSERT WITH CHECK (true);


--
-- Name: coupon_uses Users insert coupon_uses; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users insert coupon_uses" ON public.coupon_uses FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: orders Users insert orders; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users insert orders" ON public.orders FOR INSERT WITH CHECK (true);


--
-- Name: ai_recommendation_feedback Users manage own ai_recommendation_feedback; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users manage own ai_recommendation_feedback" ON public.ai_recommendation_feedback USING ((auth.uid() = user_id));


--
-- Name: blog_comments Users manage own blog_comments; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users manage own blog_comments" ON public.blog_comments USING ((auth.uid() = user_id));


--
-- Name: favorite_lists Users manage own favorite_lists; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users manage own favorite_lists" ON public.favorite_lists USING ((auth.uid() = user_id));


--
-- Name: marketplace_favorites Users manage own favorites; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users manage own favorites" ON public.marketplace_favorites USING ((user_id = auth.uid()));


--
-- Name: review_reports Users manage own review_reports; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users manage own review_reports" ON public.review_reports USING ((auth.uid() = reporter_id));


--
-- Name: search_logs Users manage own search_logs; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users manage own search_logs" ON public.search_logs USING ((auth.uid() = user_id));


--
-- Name: symptom_profiles Users manage own symptoms; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users manage own symptoms" ON public.symptom_profiles USING ((auth.uid() = patient_id));


--
-- Name: user_favorite_phrases Users manage own user_favorite_phrases; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users manage own user_favorite_phrases" ON public.user_favorite_phrases USING ((auth.uid() = user_id));


--
-- Name: ai_chat_messages Users read own ai_chat_messages; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users read own ai_chat_messages" ON public.ai_chat_messages FOR SELECT USING ((session_id IN ( SELECT ai_chat_sessions.id
   FROM public.ai_chat_sessions
  WHERE ((ai_chat_sessions.therapist_id = auth.uid()) OR (ai_chat_sessions.patient_id = auth.uid())))));


--
--
CREATE POLICY "Users read own ai_conversation_analysis" ON public.ai_conversation_analysis FOR SELECT USING ((session_id IN ( SELECT ai_chat_sessions.id
   FROM public.ai_chat_sessions
  WHERE ((ai_chat_sessions.therapist_id = auth.uid()) OR (ai_chat_sessions.patient_id = auth.uid())))));


--
--
CREATE POLICY "Users read own arco requests" ON public.arco_requests FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: coupon_uses Users read own coupon_uses; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users read own coupon_uses" ON public.coupon_uses FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: platform_feedback Users read own feedback; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users read own feedback" ON public.platform_feedback FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: therapist_recommendations Users read own recommendations; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users read own recommendations" ON public.therapist_recommendations FOR SELECT USING ((auth.uid() = patient_id));


--
-- Name: legal_signatures Users read own signatures; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users read own signatures" ON public.legal_signatures FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: subscription_payments Users see own payments; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users see own payments" ON public.subscription_payments FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: subscriptions Users see own subscriptions; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users see own subscriptions" ON public.subscriptions FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: legal_signatures Users sign documents; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "Users sign documents" ON public.legal_signatures FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: activity_library View global and own activities; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "View global and own activities" ON public.activity_library FOR SELECT USING (((is_global = true) OR (therapist_id = auth.uid())));


--
-- Name: treatment_plans View global and own plans; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "View global and own plans" ON public.treatment_plans FOR SELECT USING (((is_global = true) OR (therapist_id = auth.uid())));


--
-- Name: activity_categories; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY admin_all_transactions ON public.wallet_transactions USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY admin_all_wallets ON public.wallets USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY admin_all_withdrawals ON public.withdrawal_requests USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY admin_full_access_incident_notes ON public.support_incident_notes USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY admin_full_access_incidents ON public.support_incidents USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY admin_full_access_system_logs ON public.system_logs USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY admin_full_access_ticket_notes ON public.support_ticket_notes USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY admin_full_access_tickets ON public.support_tickets USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY admin_manage_all_courses ON public.courses USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY admin_manage_enrollments ON public.course_enrollments USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY admin_permissions_no_client_writes ON public.admin_permissions TO authenticated USING (false) WITH CHECK (false);


--
-- Name: ados2_evaluations; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY anyone_can_accept_invitation ON public.therapist_invitations FOR UPDATE USING ((status = 'pending'::text)) WITH CHECK ((status = 'accepted'::text));


--
-- Name: clinical_access_log anyone_can_insert_log; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY anyone_can_insert_log ON public.clinical_access_log FOR INSERT WITH CHECK (true);


--
-- Name: courses anyone_read_approved_courses; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY anyone_read_approved_courses ON public.courses FOR SELECT USING ((status = 'approved'::text));


--
-- Name: therapist_invitations anyone_read_by_code; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY anyone_read_by_code ON public.therapist_invitations FOR SELECT USING (true);


--
-- Name: ai_plan_limits anyone_read_limits; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY anyone_read_limits ON public.ai_plan_limits FOR SELECT USING (true);


--
-- Name: course_modules anyone_read_modules_of_approved; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY anyone_read_modules_of_approved ON public.course_modules FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.courses
  WHERE ((courses.id = course_modules.course_id) AND (courses.status = 'approved'::text)))));


--
--
CREATE POLICY anyone_read_reviews ON public.course_reviews FOR SELECT USING (true);


--
-- Name: appointments; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY appointments_insert ON public.appointments FOR INSERT TO authenticated WITH CHECK (((auth.uid() = therapist_id) OR (auth.uid() = patient_id)));


--
-- Name: appointments appt_patient_cancel; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY appt_patient_cancel ON public.appointments FOR UPDATE USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.profile_id = auth.uid()))));


--
--
CREATE POLICY appt_patient_view_own ON public.appointments FOR SELECT USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.profile_id = auth.uid()))));


--
--
CREATE POLICY appt_therapist_update ON public.appointments FOR UPDATE USING ((therapist_id IN ( SELECT therapist_details.user_id
   FROM public.therapist_details
  WHERE (therapist_details.user_id = auth.uid()))));


--
--
CREATE POLICY appt_therapist_view_own ON public.appointments FOR SELECT USING ((therapist_id IN ( SELECT therapist_details.user_id
   FROM public.therapist_details
  WHERE (therapist_details.user_id = auth.uid()))));


--
--
CREATE POLICY blog_posts_admin_all ON public.blog_posts USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY blog_posts_public_select ON public.blog_posts FOR SELECT TO authenticated, anon USING ((status = 'published'::text));


--
-- Name: blog_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY blog_reviews_admin_all ON public.blog_reviews USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
--
CREATE POLICY clinic_members_can_read ON public.clinics FOR SELECT USING ((id IN ( SELECT clinic_therapists.clinic_id
   FROM public.clinic_therapists
  WHERE ((clinic_therapists.therapist_id = auth.uid()) AND (clinic_therapists.is_active = true)))));


--
--
CREATE POLICY clinic_owner_manage ON public.clinic_therapists USING (public.is_clinic_owner(clinic_id)) WITH CHECK (public.is_clinic_owner(clinic_id));


--
-- Name: clinic_therapists; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY clinics_manage_own ON public.clinics TO authenticated USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: clinics clinics_public_read; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY clinics_public_read ON public.clinics FOR SELECT TO authenticated, anon USING ((is_active = true));


--
-- Name: commissions; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY ct_manage_self ON public.clinic_therapists TO authenticated USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: clinic_therapists ct_read_active; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY ct_read_active ON public.clinic_therapists FOR SELECT TO authenticated, anon USING ((is_active = true));


--
-- Name: debug_signup_logs; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY del_therapist_specialties_self ON public.therapist_specialties FOR DELETE USING ((therapist_id = auth.uid()));


--
-- Name: diagnosis_codes; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY edu_rec_admin_all ON public.education_recommendations USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true)))));


--
--
CREATE POLICY edu_rec_select ON public.education_recommendations FOR SELECT USING ((is_active = true));


--
-- Name: education_recommendations; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY ins_therapist_specialties_self ON public.therapist_specialties FOR INSERT WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: course_modules instructor_manage_modules; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY instructor_manage_modules ON public.course_modules USING ((EXISTS ( SELECT 1
   FROM public.courses
  WHERE ((courses.id = course_modules.course_id) AND (courses.instructor_id = auth.uid())))));


--
--
CREATE POLICY instructor_manage_own ON public.courses USING ((auth.uid() = instructor_id));


--
-- Name: course_enrollments instructor_read_course_enrollments; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY instructor_read_course_enrollments ON public.course_enrollments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.courses
  WHERE ((courses.id = course_enrollments.course_id) AND (courses.instructor_id = auth.uid())))));


--
--
CREATE POLICY marketplace_items_delete_policy ON public.marketplace_items FOR DELETE USING ((seller_id = auth.uid()));


--
-- Name: marketplace_items marketplace_items_insert_policy; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY marketplace_items_insert_policy ON public.marketplace_items FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (seller_id = auth.uid())));


--
-- Name: marketplace_items marketplace_items_select_policy; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY marketplace_items_select_policy ON public.marketplace_items FOR SELECT USING ((((is_active = true) AND (is_approved = true)) OR (seller_id = auth.uid())));


--
-- Name: marketplace_items marketplace_items_update_policy; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY marketplace_items_update_policy ON public.marketplace_items FOR UPDATE USING ((seller_id = auth.uid())) WITH CHECK ((seller_id = auth.uid()));


--
-- Name: marketplace_orders; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY only_therapist_can_delete ON public.appointments FOR DELETE TO authenticated USING ((auth.uid() = therapist_id));


--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY patient_insert_appointments ON public.appointments FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.id = appointments.patient_id) AND (patients.profile_id = auth.uid())))) OR (auth.uid() = therapist_id)));


--
--
CREATE POLICY patient_manages_own_grants ON public.patient_access_grants USING ((profile_id = auth.uid())) WITH CHECK ((profile_id = auth.uid()));


--
-- Name: patient_materials; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY patient_own_record ON public.patients FOR SELECT USING ((profile_id = auth.uid()));


--
-- Name: patient_payments; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY patient_sees_own_log ON public.clinical_access_log FOR SELECT USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.profile_id = auth.uid()))));


--
--
CREATE POLICY patient_select_own_appointments ON public.appointments FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.id = appointments.patient_id) AND (patients.profile_id = auth.uid())))));


--
--
CREATE POLICY patient_select_own_patient_record ON public.patients FOR SELECT TO authenticated USING ((profile_id = auth.uid()));


--
-- Name: ados2_evaluations patient_view_own_evaluations; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY patient_view_own_evaluations ON public.ados2_evaluations FOR SELECT USING ((auth.uid() = patient_id));


--
-- Name: ados2_item_responses patient_view_own_item_responses; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY patient_view_own_item_responses ON public.ados2_item_responses FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.ados2_evaluations
  WHERE ((ados2_evaluations.id = ados2_item_responses.evaluation_id) AND (ados2_evaluations.patient_id = auth.uid())))));


--
--
CREATE POLICY "patients can see own appointments" ON public.appointments FOR SELECT TO authenticated USING ((auth.uid() = patient_id));


--
-- Name: patients patients_select_own_or_assigned; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY patients_select_own_or_assigned ON public.patients FOR SELECT USING (((profile_id = auth.uid()) OR (therapist_id IN ( SELECT patients.id
   FROM public.therapist_details
  WHERE (therapist_details.user_id = auth.uid())))));


--
--
CREATE POLICY patients_update_own ON public.patients FOR UPDATE USING ((profile_id = auth.uid()));


--
-- Name: clinical_history patients_view_own_clinical_history; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY patients_view_own_clinical_history ON public.clinical_history FOR SELECT TO authenticated USING ((patient_id = auth.uid()));


--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY pq_select_for_therapists ON public.patient_questions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'therapist'::public.user_role)))));


--
--
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING ((id = auth.uid()));


--
-- Name: profiles profiles_update_own; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING ((id = auth.uid()));


--
-- Name: progress_reports; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY public_read_motivational_phrases ON public.motivational_phrases FOR SELECT USING ((is_active = true));


--
-- Name: refund_requests; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY sel_therapist_specialties_self ON public.therapist_specialties FOR SELECT USING ((therapist_id = auth.uid()));


--
-- Name: sensorial_evaluations; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY service_role_all ON public.ai_usage_quotas TO service_role USING (true);


--
-- Name: services; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY student_enroll ON public.course_enrollments FOR INSERT WITH CHECK ((auth.uid() = student_id));


--
-- Name: course_enrollments student_read_own_enrollments; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY student_read_own_enrollments ON public.course_enrollments FOR SELECT USING ((auth.uid() = student_id));


--
-- Name: course_reviews student_write_review; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY student_write_review ON public.course_reviews FOR INSERT WITH CHECK ((auth.uid() = reviewer_id));


--
-- Name: subscription_payments; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_and_patient_can_update_fixed ON public.appointments FOR UPDATE TO authenticated USING (((auth.uid() = therapist_id) OR (EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.id = appointments.patient_id) AND (patients.profile_id = auth.uid())))))) WITH CHECK (((auth.uid() = therapist_id) OR (EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.id = appointments.patient_id) AND (patients.profile_id = auth.uid()))))));

--
CREATE POLICY therapist_delete_own_patients ON public.patients FOR DELETE USING ((therapist_id = auth.uid()));


--
-- Name: therapist_details; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_insert_own_appointments ON public.appointments FOR INSERT TO authenticated WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: patients therapist_insert_own_patients; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_insert_own_patients ON public.patients FOR INSERT TO authenticated WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: therapist_insurances; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_own_evaluations ON public.ados2_evaluations USING ((auth.uid() = therapist_id));


--
-- Name: therapist_invitations therapist_own_invitations; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_own_invitations ON public.therapist_invitations USING ((auth.uid() = inviter_id));


--
-- Name: ados2_item_responses therapist_own_item_responses; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_own_item_responses ON public.ados2_item_responses USING ((EXISTS ( SELECT 1
   FROM public.ados2_evaluations
  WHERE ((ados2_evaluations.id = ados2_item_responses.evaluation_id) AND (ados2_evaluations.therapist_id = auth.uid())))));


--
--
CREATE POLICY therapist_own_patients ON public.patients USING ((therapist_id = auth.uid()));


--
-- Name: ai_usage_quotas therapist_own_quota; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_own_quota ON public.ai_usage_quotas USING ((auth.uid() = therapist_id));


--
-- Name: therapist_invite_quotas therapist_own_quota; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_own_quota ON public.therapist_invite_quotas USING ((auth.uid() = therapist_id));


--
-- Name: therapist_recommendations; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_sees_own_grants ON public.patient_access_grants FOR SELECT USING (((granted_to = auth.uid()) AND (is_active = true)));


--
-- Name: clinical_access_log therapist_sees_related_log; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_sees_related_log ON public.clinical_access_log FOR SELECT USING ((accessed_by = auth.uid()));


--
-- Name: therapist_details therapist_select_own; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_select_own ON public.therapist_details FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: appointments therapist_select_own_appointments; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_select_own_appointments ON public.appointments FOR SELECT TO authenticated USING ((auth.uid() = therapist_id));


--
-- Name: patients therapist_select_own_patients; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_select_own_patients ON public.patients FOR SELECT TO authenticated USING ((auth.uid() = therapist_id));


--
-- Name: therapist_services; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_services_select_own_active ON public.therapist_services FOR SELECT TO authenticated USING (((therapist_id = auth.uid()) AND (is_active = true)));


--
-- Name: therapist_specialties; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_update_own ON public.therapist_details FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: appointments therapist_update_own_appointments; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_update_own_appointments ON public.appointments FOR UPDATE TO authenticated USING ((auth.uid() = therapist_id));


--
-- Name: patients therapist_update_own_patients; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY therapist_update_own_patients ON public.patients FOR UPDATE TO authenticated USING ((auth.uid() = therapist_id));


--
-- Name: therapists; Type: ROW SECURITY; Schema: public; Owner: -
--
--
CREATE POLICY "therapists can create appointments" ON public.appointments FOR INSERT WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: appointments therapists can update appointments; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY "therapists can update appointments" ON public.appointments FOR UPDATE USING ((auth.uid() = therapist_id));


--
-- Name: clinical_history therapists_insert_own_clinical_history; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY therapists_insert_own_clinical_history ON public.clinical_history FOR INSERT TO authenticated WITH CHECK (((therapist_id = auth.uid()) AND (patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.therapist_id = auth.uid())))));


--
--
CREATE POLICY therapists_update_own_clinical_history ON public.clinical_history FOR UPDATE TO authenticated USING ((therapist_id = auth.uid())) WITH CHECK (((therapist_id = auth.uid()) AND (patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.therapist_id = auth.uid())))));


--
--
CREATE POLICY therapists_view_own_clinical_history ON public.clinical_history FOR SELECT USING ((therapist_id = auth.uid()));


--
-- Name: profiles therapists_view_patient_profiles; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY therapists_view_patient_profiles ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.profile_id = profiles.id) AND (patients.therapist_id = auth.uid())))));


--
--
CREATE POLICY therapists_view_shared_patient_history ON public.clinical_history FOR SELECT USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.therapist_id = auth.uid()))));


--
--
CREATE POLICY therapists_view_shared_patient_history_metadata ON public.clinical_history FOR SELECT USING (((therapist_id = auth.uid()) OR (patient_id IN ( SELECT DISTINCT clinical_history.patient_id
   FROM public.patients
  WHERE (patients.therapist_id = auth.uid())))));


--
--
CREATE POLICY users_create_tickets ON public.support_tickets FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: support_tickets users_own_tickets; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY users_own_tickets ON public.support_tickets FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: wallet_transactions users_own_transactions; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY users_own_transactions ON public.wallet_transactions USING ((wallet_id IN ( SELECT wallets.id
   FROM public.wallets
  WHERE (wallets.user_id = auth.uid()))));


--
--
CREATE POLICY users_own_wallet ON public.wallets USING ((user_id = auth.uid()));


--
-- Name: withdrawal_requests users_own_withdrawals; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY users_own_withdrawals ON public.withdrawal_requests USING ((user_id = auth.uid()));


--
-- Name: support_tickets users_update_own_tickets; Type: POLICY; Schema: public; Owner: -
--
--
CREATE POLICY users_update_own_tickets ON public.support_tickets FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: wallet_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--
