-- ============================================================================
-- Migration: crear storage buckets `avatars` y `logos` + RLS policies
-- ----------------------------------------------------------------------------
-- Gap detectado durante implementación photo upload clinic admin (2026-04-25):
-- Los buckets que usa src/components/therapist-profile/sections/ImagesSection.jsx
-- no existían en prod. Resultado: "Bucket not found" al guardar foto/logo.
--
-- Este migration:
-- 1. Crea los 2 buckets como PÚBLICOS (getPublicUrl funciona sin signed URL)
-- 2. Limita tamaño a 5MB por file
-- 3. Solo permite image/jpeg, image/png, image/webp
-- 4. RLS policies: authenticated users pueden CRUD archivos dentro de su
--    propia carpeta (auth.uid() = primer segmento del path)
--
-- Path convention (por ImagesSection.jsx línea 142):
--   {user_id}/{type}_{user_id}_{timestamp}
-- Ej: `149325b2-88bb-49f6-81e2-7a97fe422127/avatar_149325b2-..._1777068891517`
--
-- Idempotente: ON CONFLICT DO NOTHING en buckets + DROP/CREATE en policies.
-- ============================================================================

-- ══════════════════════════════════════════════════════════════
-- 1. CREAR BUCKETS
-- ══════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('logos', 'logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- 2. RLS POLICIES — users pueden manipular solo SUS archivos
-- ══════════════════════════════════════════════════════════════

-- Pattern: el path del objeto es `{user_id}/filename`. auth.uid() debe
-- matchear el primer segmento. Esto permite que cualquier authenticated
-- user (therapist, clinic_admin, assistant) suba su avatar/logo a su
-- propia carpeta.

-- INSERT: crear archivos en su propia folder
DROP POLICY IF EXISTS "Users upload own avatars/logos" ON storage.objects;
CREATE POLICY "Users upload own avatars/logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('avatars', 'logos')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- UPDATE: actualizar archivos en su propia folder (para upsert=true)
DROP POLICY IF EXISTS "Users update own avatars/logos" ON storage.objects;
CREATE POLICY "Users update own avatars/logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('avatars', 'logos')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE: borrar archivos propios
DROP POLICY IF EXISTS "Users delete own avatars/logos" ON storage.objects;
CREATE POLICY "Users delete own avatars/logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('avatars', 'logos')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- SELECT: los buckets son públicos, pero definimos policy explícita para claridad
DROP POLICY IF EXISTS "Public view avatars/logos" ON storage.objects;
CREATE POLICY "Public view avatars/logos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id IN ('avatars', 'logos'));


-- ══════════════════════════════════════════════════════════════
-- 3. VERIFICACIÓN (output)
-- ══════════════════════════════════════════════════════════════

-- Correr post-migration:
--   SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id IN ('avatars','logos');
--   SELECT policyname, cmd FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname ILIKE '%avatars/logos%';
