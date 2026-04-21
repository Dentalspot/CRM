-- ============================================================
-- Spec 014: apply-policies-billing-invoices-and-patient-evaluations
-- Fecha: 2026-04-20
-- Origen: GROUP B del audit spec 012 (RLS enabled + 0 policies fail-closed).
--   Aplica Templates 1 + 2 de spec 012 data-model.md §Follow-up specs.
--   Patient_goals + patient_development_areas (Template 3) queda para spec futura.
--
-- Estado pre-migration (confirmado Phase 1, queries A/B/C/D):
--   - billing_invoices: rowsecurity=true, policy_count=0, row_count=0
--   - patient_evaluations: rowsecurity=true, policy_count=0, row_count=0
--
-- Ajustes schema vs template spec 012 (validados Phase 1 Query D):
--   - patient_care_team usa columna dentist_id (NO user_id/therapist_id) —
--     patrón DentalSpot confirmado en spec 003 migration.
--   - patient_care_team.is_active boolean NOT NULL → policy filtra is_active=true
--   - patients.profile_id = auth.uid() para mapeo patient→user (NO patient_user_id).
--
-- 5 policies totales (2 billing + 3 evaluations). ALTER TABLE NO necesario
-- (RLS ya enabled). Patrón canónico: replica de 20260420000002 (spec 009).
-- ============================================================

-- Pre-check: confirmar estado esperado pre-migration para ambas tablas
DO $$
DECLARE
  billing_rls BOOLEAN;
  billing_policies INT;
  evals_rls BOOLEAN;
  evals_policies INT;
BEGIN
  SELECT rowsecurity INTO billing_rls FROM pg_tables
    WHERE schemaname='public' AND tablename='billing_invoices';
  SELECT COUNT(*) INTO billing_policies FROM pg_policies
    WHERE schemaname='public' AND tablename='billing_invoices';

  SELECT rowsecurity INTO evals_rls FROM pg_tables
    WHERE schemaname='public' AND tablename='patient_evaluations';
  SELECT COUNT(*) INTO evals_policies FROM pg_policies
    WHERE schemaname='public' AND tablename='patient_evaluations';

  IF NOT billing_rls THEN
    RAISE EXCEPTION 'Pre-check FAIL: billing_invoices rowsecurity=false, esperaba true';
  END IF;
  IF NOT evals_rls THEN
    RAISE EXCEPTION 'Pre-check FAIL: patient_evaluations rowsecurity=false, esperaba true';
  END IF;

  IF billing_policies > 0 THEN
    RAISE EXCEPTION 'Pre-check FAIL (state drift PATTERNS.md §7): billing_invoices tiene % policies, esperaba 0', billing_policies;
  END IF;
  IF evals_policies > 0 THEN
    RAISE EXCEPTION 'Pre-check FAIL (state drift PATTERNS.md §7): patient_evaluations tiene % policies, esperaba 0', evals_policies;
  END IF;

  RAISE NOTICE 'Pre-check OK: ambas tablas rowsecurity=true + policy_count=0';
END $$;

-- ============================================================
-- billing_invoices — 2 policies
-- ============================================================

DROP POLICY IF EXISTS "Therapists read own billing_invoices" ON public.billing_invoices;
CREATE POLICY "Therapists read own billing_invoices"
  ON public.billing_invoices FOR SELECT
  USING (therapist_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage billing_invoices" ON public.billing_invoices;
CREATE POLICY "Admins manage billing_invoices"
  ON public.billing_invoices FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'::user_role)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'::user_role)
  );

-- ============================================================
-- patient_evaluations — 3 policies
-- ============================================================

DROP POLICY IF EXISTS "Therapists manage own patient evaluations" ON public.patient_evaluations;
CREATE POLICY "Therapists manage own patient evaluations"
  ON public.patient_evaluations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.patient_care_team
            WHERE patient_care_team.dentist_id = auth.uid()
              AND patient_care_team.patient_id = patient_evaluations.patient_id
              AND patient_care_team.is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.patient_care_team
            WHERE patient_care_team.dentist_id = auth.uid()
              AND patient_care_team.patient_id = patient_evaluations.patient_id
              AND patient_care_team.is_active = true)
  );

DROP POLICY IF EXISTS "Patients read own evaluations" ON public.patient_evaluations;
CREATE POLICY "Patients read own evaluations"
  ON public.patient_evaluations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.patients
            WHERE patients.id = patient_evaluations.patient_id
              AND patients.profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins manage patient_evaluations" ON public.patient_evaluations;
CREATE POLICY "Admins manage patient_evaluations"
  ON public.patient_evaluations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'::user_role)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'::user_role)
  );

-- ============================================================
-- Post-check: 2 policies billing + 3 policies evaluations + rowsecurity preservado
-- ============================================================
DO $$
DECLARE
  billing_policies_post INT;
  evals_policies_post INT;
  billing_rls_post BOOLEAN;
  evals_rls_post BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO billing_policies_post FROM pg_policies
    WHERE schemaname='public' AND tablename='billing_invoices';
  SELECT COUNT(*) INTO evals_policies_post FROM pg_policies
    WHERE schemaname='public' AND tablename='patient_evaluations';
  SELECT rowsecurity INTO billing_rls_post FROM pg_tables
    WHERE schemaname='public' AND tablename='billing_invoices';
  SELECT rowsecurity INTO evals_rls_post FROM pg_tables
    WHERE schemaname='public' AND tablename='patient_evaluations';

  IF billing_policies_post <> 2 THEN
    RAISE EXCEPTION 'Post-check FAIL: billing_invoices esperaba 2 policies, encontré %', billing_policies_post;
  END IF;
  IF evals_policies_post <> 3 THEN
    RAISE EXCEPTION 'Post-check FAIL: patient_evaluations esperaba 3 policies, encontré %', evals_policies_post;
  END IF;

  IF NOT billing_rls_post THEN
    RAISE EXCEPTION 'Post-check FAIL: billing_invoices rowsecurity se desactivó';
  END IF;
  IF NOT evals_rls_post THEN
    RAISE EXCEPTION 'Post-check FAIL: patient_evaluations rowsecurity se desactivó';
  END IF;

  RAISE NOTICE 'Post-check OK: billing_invoices=2 policies (Therapists read own + Admins manage), patient_evaluations=3 policies (Therapists manage via care_team + Patients read own + Admins manage), ambas rowsecurity=true';
END $$;

-- ============================================================
-- Rollback (NO ejecutar — run in case of emergency, spec.md §Rollback Plan):
-- DROP POLICY IF EXISTS "Therapists read own billing_invoices" ON public.billing_invoices;
-- DROP POLICY IF EXISTS "Admins manage billing_invoices" ON public.billing_invoices;
-- DROP POLICY IF EXISTS "Therapists manage own patient evaluations" ON public.patient_evaluations;
-- DROP POLICY IF EXISTS "Patients read own evaluations" ON public.patient_evaluations;
-- DROP POLICY IF EXISTS "Admins manage patient_evaluations" ON public.patient_evaluations;
-- -- Verify rollback: SELECT tablename, COUNT(*) FROM pg_policies
-- --   WHERE tablename IN ('billing_invoices','patient_evaluations') GROUP BY tablename;
-- -- Expected: 0 rows (estado pre-spec 014 restaurado, rowsecurity preservado true)
-- ============================================================
