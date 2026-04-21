-- ============================================================
-- Spec 015: apply-policies-patient-goals-and-development-areas
-- Fecha: 2026-04-20
-- Origen: Template 3 de spec 012 data-model.md §Follow-up specs.
--   Cierra GROUP B = 3/3 (billing + evaluations ✅ spec 014,
--   goals + development_areas ✅ este spec).
--
-- Decisión Phase 1 (validada con Query D information_schema.columns):
--   - patient_development_areas: SHARED CATALOG (sin patient_id column)
--   - patient_goals: per-patient (tiene patient_id column)
--
-- Estado pre-migration (confirmado Phase 1 queries A/B/C/D/D-EXT):
--   - patient_goals: rowsecurity=true, policy_count=0, row_count=0
--   - patient_development_areas: rowsecurity=true, policy_count=0, row_count=0
--
-- Ajustes schema (confirmados spec 014 + validados Phase 1):
--   - patient_care_team.dentist_id (no therapist_id)
--   - patient_care_team.is_active = true filter
--   - patients.profile_id = auth.uid() para mapeo patient→user
--
-- Hallazgo lateral documentado (NO tratado en este spec):
--   - FKs duplicados en patient_goals (area_id, evaluation_id, patient_id)
--   - patient_id tiene FK dual a patients.id + profiles.id
--   - Follow-up: spec cleanup-duplicate-fks-patient-goals
--
-- Total: 5 policies (2 patient_development_areas + 3 patient_goals).
-- Patrón canonical: replica de 20260420000004 (spec 014).
-- ============================================================

-- Pre-check: confirmar estado esperado pre-migration para ambas tablas
DO $$
DECLARE
  goals_rls BOOLEAN;
  goals_policies INT;
  areas_rls BOOLEAN;
  areas_policies INT;
BEGIN
  SELECT rowsecurity INTO goals_rls FROM pg_tables
    WHERE schemaname='public' AND tablename='patient_goals';
  SELECT COUNT(*) INTO goals_policies FROM pg_policies
    WHERE schemaname='public' AND tablename='patient_goals';

  SELECT rowsecurity INTO areas_rls FROM pg_tables
    WHERE schemaname='public' AND tablename='patient_development_areas';
  SELECT COUNT(*) INTO areas_policies FROM pg_policies
    WHERE schemaname='public' AND tablename='patient_development_areas';

  IF NOT goals_rls THEN
    RAISE EXCEPTION 'Pre-check FAIL: patient_goals rowsecurity=false, esperaba true';
  END IF;
  IF NOT areas_rls THEN
    RAISE EXCEPTION 'Pre-check FAIL: patient_development_areas rowsecurity=false, esperaba true';
  END IF;

  IF goals_policies > 0 THEN
    RAISE EXCEPTION 'Pre-check FAIL (state drift PATTERNS.md §7): patient_goals tiene % policies, esperaba 0', goals_policies;
  END IF;
  IF areas_policies > 0 THEN
    RAISE EXCEPTION 'Pre-check FAIL (state drift PATTERNS.md §7): patient_development_areas tiene % policies, esperaba 0', areas_policies;
  END IF;

  RAISE NOTICE 'Pre-check OK: ambas tablas rowsecurity=true + policy_count=0';
END $$;

-- ============================================================
-- patient_development_areas — 2 policies (SHARED CATALOG variant)
-- Justificación: Query D confirmó que patient_development_areas NO tiene
-- patient_id column → catálogo compartido (áreas genéricas tipo
-- "Estética", "Funcionalidad"), no per-patient.
-- ============================================================

DROP POLICY IF EXISTS "Authenticated read patient_development_areas"
  ON public.patient_development_areas;
CREATE POLICY "Authenticated read patient_development_areas"
  ON public.patient_development_areas FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage patient_development_areas"
  ON public.patient_development_areas;
CREATE POLICY "Admins manage patient_development_areas"
  ON public.patient_development_areas FOR ALL
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
-- patient_goals — 3 policies (per-patient via care_team)
-- ============================================================

DROP POLICY IF EXISTS "Therapists manage own patient goals"
  ON public.patient_goals;
CREATE POLICY "Therapists manage own patient goals"
  ON public.patient_goals FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.patient_care_team
            WHERE patient_care_team.dentist_id = auth.uid()
              AND patient_care_team.patient_id = patient_goals.patient_id
              AND patient_care_team.is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.patient_care_team
            WHERE patient_care_team.dentist_id = auth.uid()
              AND patient_care_team.patient_id = patient_goals.patient_id
              AND patient_care_team.is_active = true)
  );

DROP POLICY IF EXISTS "Patients read own goals"
  ON public.patient_goals;
CREATE POLICY "Patients read own goals"
  ON public.patient_goals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.patients
            WHERE patients.id = patient_goals.patient_id
              AND patients.profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins manage patient_goals"
  ON public.patient_goals;
CREATE POLICY "Admins manage patient_goals"
  ON public.patient_goals FOR ALL
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
-- Post-check: 2 policies dev_areas + 3 policies goals + rowsecurity preservado
-- ============================================================
DO $$
DECLARE
  goals_policies_post INT;
  areas_policies_post INT;
  goals_rls_post BOOLEAN;
  areas_rls_post BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO goals_policies_post FROM pg_policies
    WHERE schemaname='public' AND tablename='patient_goals';
  SELECT COUNT(*) INTO areas_policies_post FROM pg_policies
    WHERE schemaname='public' AND tablename='patient_development_areas';
  SELECT rowsecurity INTO goals_rls_post FROM pg_tables
    WHERE schemaname='public' AND tablename='patient_goals';
  SELECT rowsecurity INTO areas_rls_post FROM pg_tables
    WHERE schemaname='public' AND tablename='patient_development_areas';

  IF goals_policies_post <> 3 THEN
    RAISE EXCEPTION 'Post-check FAIL: patient_goals esperaba 3 policies, encontré %', goals_policies_post;
  END IF;
  IF areas_policies_post <> 2 THEN
    RAISE EXCEPTION 'Post-check FAIL: patient_development_areas esperaba 2 policies, encontré %', areas_policies_post;
  END IF;

  IF NOT goals_rls_post THEN
    RAISE EXCEPTION 'Post-check FAIL: patient_goals rowsecurity se desactivó';
  END IF;
  IF NOT areas_rls_post THEN
    RAISE EXCEPTION 'Post-check FAIL: patient_development_areas rowsecurity se desactivó';
  END IF;

  RAISE NOTICE 'Post-check OK: patient_goals=3 policies (Therapists manage via care_team + Patients read own + Admins manage), patient_development_areas=2 policies (Authenticated read SHARED CATALOG + Admins manage), ambas rowsecurity=true. GROUP B spec 012 = 3/3 cerrado.';
END $$;

-- ============================================================
-- Rollback (NO ejecutar — run in case of emergency, spec.md §Rollback Plan):
-- DROP POLICY IF EXISTS "Authenticated read patient_development_areas" ON public.patient_development_areas;
-- DROP POLICY IF EXISTS "Admins manage patient_development_areas" ON public.patient_development_areas;
-- DROP POLICY IF EXISTS "Therapists manage own patient goals" ON public.patient_goals;
-- DROP POLICY IF EXISTS "Patients read own goals" ON public.patient_goals;
-- DROP POLICY IF EXISTS "Admins manage patient_goals" ON public.patient_goals;
-- -- Verify rollback: SELECT tablename, COUNT(*) FROM pg_policies
-- --   WHERE tablename IN ('patient_goals','patient_development_areas') GROUP BY tablename;
-- -- Expected: 0 rows (estado pre-spec 015 restaurado, rowsecurity preservado true)
-- ============================================================
