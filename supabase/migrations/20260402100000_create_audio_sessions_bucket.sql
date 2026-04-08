-- Create storage bucket for long audio sessions (Notiz)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('audio-sessions', 'audio-sessions', false, 104857600)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload audio to their own folder
CREATE POLICY "therapists_upload_audio" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'audio-sessions'
    AND (storage.foldername(name))[1] = 'notiz'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Authenticated users can read their own audio
CREATE POLICY "therapists_read_own_audio" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'audio-sessions'
    AND (storage.foldername(name))[1] = 'notiz'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Authenticated users can delete their own audio (cleanup after processing)
CREATE POLICY "therapists_delete_own_audio" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'audio-sessions'
    AND (storage.foldername(name))[1] = 'notiz'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
