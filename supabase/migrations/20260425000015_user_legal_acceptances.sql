-- ============================================================
-- Micro-bloque C2: Persistencia del consentimiento legal
-- ============================================================
-- Cumplimiento Ley 21.719 — registro auditable e inmutable
-- de aceptación de T&C y Política de Privacidad por usuario y versión.
-- ============================================================

-- 1) Tabla de aceptaciones (denormalizada para inmutabilidad)
CREATE TABLE public.user_legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_slug text NOT NULL,
  document_version integer NOT NULL,
  document_title text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_legal_accept_user_slug
  ON public.user_legal_acceptances(user_id, document_slug, accepted_at DESC);

CREATE INDEX idx_legal_accept_slug_version
  ON public.user_legal_acceptances(document_slug, document_version);

COMMENT ON TABLE public.user_legal_acceptances IS
  'Registro inmutable de aceptaciones legales. Denormalizado a propósito (no FK a legal_documents) para sobrevivir cambios o borrados del documento original.';

-- 2) RLS
ALTER TABLE public.user_legal_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY legal_accept_self_select ON public.user_legal_acceptances
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY legal_accept_admin_select ON public.user_legal_acceptances
  FOR SELECT
  USING (public.is_admin());

-- INSERT solo via RPC SECURITY DEFINER (no permitimos INSERT directo)
-- DELETE: nadie (registros inmutables)
-- UPDATE: nadie

-- 3) RPC: registrar aceptación de los slugs especificados
CREATE OR REPLACE FUNCTION public.accept_legal_documents(p_slugs text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text;
  v_doc_id uuid;
  v_version integer;
  v_title text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No authenticated user';
  END IF;

  FOREACH v_slug IN ARRAY p_slugs LOOP
    -- Buscar versión publicada más reciente para este slug
    SELECT id, version, title
      INTO v_doc_id, v_version, v_title
    FROM public.legal_documents
    WHERE slug = v_slug AND status = 'published'
    ORDER BY version DESC NULLS LAST, published_at DESC NULLS LAST
    LIMIT 1;

    IF v_doc_id IS NULL THEN
      RAISE WARNING 'No published document for slug: %', v_slug;
      CONTINUE;
    END IF;

    INSERT INTO public.user_legal_acceptances (
      user_id, document_slug, document_version, document_title
    ) VALUES (
      auth.uid(), v_slug, v_version, v_title
    );
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.accept_legal_documents(text[]) TO authenticated;

-- 4) Helper: ¿qué slugs necesita re-aceptar el usuario actual?
--    Devuelve filas con (slug, current_version, title, content) de docs publicados
--    cuya última aceptación del usuario sea menor o no exista.
CREATE OR REPLACE FUNCTION public.needs_legal_reaccept()
RETURNS TABLE (
  slug text,
  version integer,
  title text,
  content text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Slugs obligatorios (hardcoded por ahora; se podría tabular si crecen)
  WITH required_slugs AS (
    SELECT unnest(ARRAY['terminos-condiciones', 'politica-privacidad']) AS slug
  ),
  current_published AS (
    SELECT DISTINCT ON (ld.slug)
      ld.slug, ld.version, ld.title, ld.content
    FROM public.legal_documents ld
    WHERE ld.status = 'published'
      AND ld.slug IN (SELECT slug FROM required_slugs)
    ORDER BY ld.slug, ld.version DESC NULLS LAST
  ),
  user_latest AS (
    SELECT DISTINCT ON (la.document_slug)
      la.document_slug AS slug, la.document_version AS version
    FROM public.user_legal_acceptances la
    WHERE la.user_id = auth.uid()
    ORDER BY la.document_slug, la.document_version DESC
  )
  SELECT cp.slug, cp.version, cp.title, cp.content
  FROM current_published cp
  LEFT JOIN user_latest ul ON ul.slug = cp.slug
  WHERE ul.version IS NULL OR cp.version > ul.version;
$$;

GRANT EXECUTE ON FUNCTION public.needs_legal_reaccept() TO authenticated;
