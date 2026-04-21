-- ============================================================
-- Spec 016: lockdown-pie-and-debug-tables
-- Fecha: 2026-04-20
-- Origen: último P0 security pendiente del RLS coverage audit 2026-04-20
--   (architecture.md §"RLS coverage audit"). 6 tablas con
--   rowsecurity=DISABLED + 0 policies = cualquier auth user podía
--   leer/escribir libremente. PHI-adjacent (PIE Escolar module + debug logs).
--
-- Approach: MINIMAL LOCK-DOWN (deny-all default).
--   ENABLE RLS sin policies = deny-all para non-service-role.
--   Edge functions con service_role siguen con bypass.
--   Callsites PIE wrapped en FEATURE_FLAGS.PIE_ESCOLAR=false (spec 010 reconfirm).
--   Reactivación PIE futura = spec dedicado con policies proper.
--
-- Estado pre-migration (confirmado Phase 1 queries A/B/C):
--   6 tablas con rowsecurity=false + policy_count=0.
--   Row counts bajos (PIE dormant, debug_signup_logs metadata).
--
-- Callsite audit Phase 1:
--   - pie_sessions: 3 callsites transitively wrapped (DashboardRouter.jsx:131).
--   - pie_students: 0 callsites frontend.
--   - pie_paci: 4 callsites transitively wrapped.
--   - pie_schedule_blocks: 0 callsites frontend.
--   - pie_therapist_schools: 1 callsite NOT wrapped (R-01 — MyClinicsSection.jsx:205-225
--     silent upsert al guardar clínica type='colegio'). Decisión FR-009 = Option 2a:
--     agregar 1 policy mínima "Therapists manage own pie_therapist_schools" para
--     preservar funcionalidad existente.
--   - debug_signup_logs: 0 callsites frontend + 0 edge functions.
--   - 0 edge functions consumen estas 6 tablas (R-03 descartado).
--   - 0 callsites admin (R-02 descartado).
--
-- FR-009 Decision: Option 2a — Lock-down + 1 policy minimal.
--
-- Total: 6 ALTER TABLE ENABLE RLS + 1 CREATE POLICY.
-- Post-apply: 6 tablas rowsecurity=true, pie_therapist_schools=1 policy,
-- las otras 5 tablas=0 policies (deny-all).
--
-- Patrón canonical: replica spec 006 migration 20260420000001 (ENABLE RLS)
-- + spec 014 migration 20260420000004 (DO $$ pre/post-check + is_admin pattern).
-- ============================================================

-- Pre-check: confirmar estado esperado pre-migration para las 6 tablas
DO $$
DECLARE
  tbl RECORD;
  drift_count INT := 0;
BEGIN
  FOR tbl IN
    SELECT t.tablename,
           t.rowsecurity,
           (SELECT COUNT(*) FROM pg_policies p
            WHERE p.schemaname='public' AND p.tablename=t.tablename) AS policy_count
    FROM pg_tables t
    WHERE t.schemaname='public'
      AND t.tablename IN (
        'pie_sessions', 'pie_students', 'pie_paci',
        'pie_schedule_blocks', 'pie_therapist_schools',
        'debug_signup_logs'
      )
    ORDER BY t.tablename
  LOOP
    -- Aceptar rowsecurity=false (expected) O rowsecurity=true con 0 policies (idempotent re-run).
    -- Abortar si hay policies inesperadas.
    IF tbl.policy_count > 0 THEN
      RAISE EXCEPTION 'Pre-check FAIL (state drift PATTERNS.md §7): tabla % tiene % policies, esperaba 0', tbl.tablename, tbl.policy_count;
    END IF;
    IF tbl.rowsecurity THEN
      drift_count := drift_count + 1;
    END IF;
  END LOOP;

  IF drift_count > 0 THEN
    RAISE NOTICE 'Pre-check NOTE: % de 6 tablas ya tenían rowsecurity=true (idempotent re-run OK)', drift_count;
  ELSE
    RAISE NOTICE 'Pre-check OK: 6 tablas con rowsecurity=false + policy_count=0 (estado pre-spec 016 expected)';
  END IF;
END $$;

-- ============================================================
-- Lock-down: 6 ALTER TABLE ENABLE ROW LEVEL SECURITY
-- (deny-all default para non-service-role; service_role sigue bypass)
-- Orden alfabético para consistencia.
-- ============================================================

ALTER TABLE public.debug_signup_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pie_paci               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pie_schedule_blocks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pie_sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pie_students           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pie_therapist_schools  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- pie_therapist_schools — 1 policy minimal (FR-009 Option 2a)
-- Preserva el silent upsert existente en MyClinicsSection.jsx:205-225
-- que dispara al guardar clínica type='colegio' (callsite NO wrapped en
-- FEATURE_FLAGS.PIE_ESCOLAR — runtime check únicamente).
-- ============================================================

DROP POLICY IF EXISTS "Therapists manage own pie_therapist_schools"
  ON public.pie_therapist_schools;
CREATE POLICY "Therapists manage own pie_therapist_schools"
  ON public.pie_therapist_schools FOR ALL
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

-- ============================================================
-- Post-check: 6 tablas rowsecurity=true + policy_count matching FR-009 Option 2a
-- (pie_therapist_schools=1, resto=0)
-- ============================================================
DO $$
DECLARE
  tbl RECORD;
  rls_fail_count INT := 0;
  policy_mismatch_count INT := 0;
  expected_policies INT;
BEGIN
  FOR tbl IN
    SELECT t.tablename,
           t.rowsecurity,
           (SELECT COUNT(*) FROM pg_policies p
            WHERE p.schemaname='public' AND p.tablename=t.tablename) AS policy_count
    FROM pg_tables t
    WHERE t.schemaname='public'
      AND t.tablename IN (
        'pie_sessions', 'pie_students', 'pie_paci',
        'pie_schedule_blocks', 'pie_therapist_schools',
        'debug_signup_logs'
      )
    ORDER BY t.tablename
  LOOP
    IF NOT tbl.rowsecurity THEN
      rls_fail_count := rls_fail_count + 1;
      RAISE WARNING 'Post-check: tabla % rowsecurity=false, esperaba true', tbl.tablename;
    END IF;

    -- pie_therapist_schools tiene 1 policy; las otras 5 tienen 0.
    expected_policies := CASE WHEN tbl.tablename = 'pie_therapist_schools' THEN 1 ELSE 0 END;
    IF tbl.policy_count <> expected_policies THEN
      policy_mismatch_count := policy_mismatch_count + 1;
      RAISE WARNING 'Post-check: tabla % tiene % policies, esperaba %', tbl.tablename, tbl.policy_count, expected_policies;
    END IF;
  END LOOP;

  IF rls_fail_count > 0 THEN
    RAISE EXCEPTION 'Post-check FAIL: % de 6 tablas con rowsecurity=false', rls_fail_count;
  END IF;
  IF policy_mismatch_count > 0 THEN
    RAISE EXCEPTION 'Post-check FAIL: % tablas con policy_count inesperado', policy_mismatch_count;
  END IF;

  RAISE NOTICE 'Post-check OK: 6 tablas rowsecurity=true. pie_therapist_schools=1 policy (Therapists manage own), otras 5 tablas=0 policies (deny-all default). Último P0 del RLS coverage audit 2026-04-20 cerrado.';
END $$;

-- ============================================================
-- Rollback (NO ejecutar — run in case of emergency, spec.md §Rollback Plan):
-- ALTER TABLE public.debug_signup_logs      DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pie_paci               DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pie_schedule_blocks    DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pie_sessions           DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pie_students           DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pie_therapist_schools  DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Therapists manage own pie_therapist_schools"
--   ON public.pie_therapist_schools;
-- -- Verify: SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN (...)
-- --   → 6 rows, todas false. pg_policies count = 0 para todas.
-- ============================================================

-- Spec 016 END — último P0 RLS coverage audit (2026-04-20) cerrado.
