-- ============================================================
-- Spec 009: restore-marketplace-purchases-policies
-- Fecha: 2026-04-20
-- Origen: Gap detectado en spec 006 RLS coverage audit + state drift
--   detectado en Phase 1/Phase 2 transition.
--
-- Estado pre-migration (verificado en Phase 1 + re-verificado pre-Phase 2):
--   - rowsecurity = false (vulnerabilidad activa)
--   - 2 policies vivas:
--     * "Admins update marketplace_purchases" UPDATE (legacy)
--     * "Vendors read own plan purchases" SELECT (injected manualmente
--       durante Phase 1, X2→X1 pivot)
--
-- Estrategia:
--   - Estrategia Admin B: replace "Admins update" con "Admin manage" FOR ALL
--   - Opción X1: keep "Vendors read own plan purchases" + agregar buyer policies
--   - Estado final: 4 policies, rls enabled
-- ============================================================

-- Pre-check: confirmar estado esperado pre-migration
DO $$
DECLARE
  policy_count_pre INT;
  rls_pre BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO policy_count_pre FROM pg_policies
    WHERE schemaname='public' AND tablename='marketplace_purchases';
  SELECT rowsecurity INTO rls_pre FROM pg_tables
    WHERE schemaname='public' AND tablename='marketplace_purchases';

  IF policy_count_pre NOT IN (1, 2) THEN
    RAISE EXCEPTION 'Pre-check FAIL: esperaba 1 o 2 policies, encontré %', policy_count_pre;
  END IF;

  IF rls_pre THEN
    RAISE EXCEPTION 'Pre-check FAIL: esperaba rowsecurity=false, encontré true';
  END IF;

  RAISE NOTICE 'Pre-check OK: % policies live, rls disabled', policy_count_pre;
END $$;

-- DROP legacy policy (replaced by "Admin manage" FOR ALL)
DROP POLICY IF EXISTS "Admins update marketplace_purchases" ON public.marketplace_purchases;

-- CREATE 4 target policies (con DROP previo para idempotencia)

DROP POLICY IF EXISTS "Buyers read own marketplace_purchases" ON public.marketplace_purchases;
CREATE POLICY "Buyers read own marketplace_purchases"
  ON public.marketplace_purchases FOR SELECT
  USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Buyers insert marketplace_purchases" ON public.marketplace_purchases;
CREATE POLICY "Buyers insert marketplace_purchases"
  ON public.marketplace_purchases FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Admin manage marketplace_purchases" ON public.marketplace_purchases;
CREATE POLICY "Admin manage marketplace_purchases"
  ON public.marketplace_purchases FOR ALL
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

DROP POLICY IF EXISTS "Vendors read own plan purchases" ON public.marketplace_purchases;
CREATE POLICY "Vendors read own plan purchases"
  ON public.marketplace_purchases FOR SELECT
  USING (
    marketplace_plan_id IN (
      SELECT id FROM public.marketplace_plans
      WHERE author_id = auth.uid()
    )
  );

-- Enable RLS
ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;

-- Post-check: 4 policies + rls=true
DO $$
DECLARE
  policy_count_post INT;
  rls_post BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO policy_count_post FROM pg_policies
    WHERE schemaname='public' AND tablename='marketplace_purchases';
  SELECT rowsecurity INTO rls_post FROM pg_tables
    WHERE schemaname='public' AND tablename='marketplace_purchases';

  IF policy_count_post <> 4 THEN
    RAISE EXCEPTION 'Post-check FAIL: esperaba 4 policies, encontré %', policy_count_post;
  END IF;

  IF NOT rls_post THEN
    RAISE EXCEPTION 'Post-check FAIL: rowsecurity no se activó';
  END IF;

  RAISE NOTICE 'Post-check OK: 4 policies (Buyers read own + Buyers insert + Admin manage + Vendors read own plan purchases) + RLS enabled';
END $$;

-- Rollback (NO ejecutar, solo referencia):
-- ALTER TABLE public.marketplace_purchases DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Buyers read own marketplace_purchases" ON public.marketplace_purchases;
-- DROP POLICY IF EXISTS "Buyers insert marketplace_purchases" ON public.marketplace_purchases;
-- DROP POLICY IF EXISTS "Admin manage marketplace_purchases" ON public.marketplace_purchases;
-- DROP POLICY IF EXISTS "Vendors read own plan purchases" ON public.marketplace_purchases;
-- CREATE POLICY "Admins update marketplace_purchases"
--   ON public.marketplace_purchases FOR UPDATE
--   USING (EXISTS (SELECT 1 FROM profiles
--                  WHERE profiles.id = auth.uid()
--                    AND profiles.role = 'admin'::user_role));
