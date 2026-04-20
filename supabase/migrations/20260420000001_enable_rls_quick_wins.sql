-- ============================================================
-- Spec 006: enable-rls-quick-wins
-- Fecha: 2026-04-20
-- Origen: Security audit post-Express block reveló 3 tablas con
--   policies definidas pero RLS DISABLED → policies NO enforced.
--
-- Tablas cubiertas:
--   - blog_posts (7 policies presentes, coverage completo)
--   - patient_questions (5 policies presentes, coverage completo)
--
-- Tabla NO cubierta (diferida a spec separada):
--   - marketplace_purchases (solo 1 policy "Admins update" live,
--     faltan Buyer read/insert + Admin read/insert/delete + Vendor
--     read. Enable RLS sin esas policies rompería 13 callsites
--     del marketplace.)
--
-- Constitution I (Compliance-First) + II (RLS-First Security):
--   policies existen en supabase/policies.sql pero no se
--   enforcean mientras RLS está disabled. Este fix activa la
--   enforcement.
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- Pre-check: verificar que las policies esperadas existen
-- (si fueron dropeadas sin avisar, abortar)
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  policy_count_blog INT;
  policy_count_pq INT;
BEGIN
  SELECT COUNT(*) INTO policy_count_blog
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'blog_posts';

  SELECT COUNT(*) INTO policy_count_pq
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'patient_questions';

  IF policy_count_blog < 7 THEN
    RAISE EXCEPTION
      'blog_posts tiene % policies, esperaba >= 7. Abortando enable RLS por seguridad. Revisar pg_policies antes de re-correr.',
      policy_count_blog;
  END IF;

  IF policy_count_pq < 5 THEN
    RAISE EXCEPTION
      'patient_questions tiene % policies, esperaba >= 5. Abortando enable RLS por seguridad. Revisar pg_policies antes de re-correr.',
      policy_count_pq;
  END IF;

  RAISE NOTICE
    'Pre-check OK — blog_posts: % policies, patient_questions: % policies',
    policy_count_blog, policy_count_pq;
END $$;

-- ══════════════════════════════════════════════════════════════
-- Enable RLS (idempotente — no-op si ya está enabled)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_questions ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════
-- Post-check: confirmar que RLS está ahora enabled en ambas
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  rls_blog BOOLEAN;
  rls_pq BOOLEAN;
BEGIN
  SELECT rowsecurity INTO rls_blog
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'blog_posts';

  SELECT rowsecurity INTO rls_pq
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'patient_questions';

  IF NOT rls_blog THEN
    RAISE EXCEPTION 'Post-check FALLÓ: blog_posts.rowsecurity = false después del ALTER.';
  END IF;

  IF NOT rls_pq THEN
    RAISE EXCEPTION 'Post-check FALLÓ: patient_questions.rowsecurity = false después del ALTER.';
  END IF;

  RAISE NOTICE 'Post-check OK — RLS enabled en blog_posts y patient_questions';
END $$;

-- ══════════════════════════════════════════════════════════════
-- Rollback (NO ejecutar en este PR, solo referencia)
-- ══════════════════════════════════════════════════════════════
-- ALTER TABLE public.blog_posts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.patient_questions DISABLE ROW LEVEL SECURITY;
