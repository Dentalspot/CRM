-- Restringir tipos MIME permitidos en buckets de imágenes
-- Cumplimiento Ley 21.719: minimizar superficie de ataque por uploads
-- Solo se permiten JPG, PNG y WebP. Se excluye SVG (riesgo XSS) y GIF (no usado).

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'avatars';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'logos';
