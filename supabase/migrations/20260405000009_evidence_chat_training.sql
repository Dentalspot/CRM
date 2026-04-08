-- Training data from evidence chat interactions
-- Therapists ask questions about scientific articles → answers stored for RAG + fine-tuning

CREATE TABLE IF NOT EXISTS public.evidence_chat_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL,
  article_title TEXT,
  article_context TEXT,  -- title + abstract + synthesis
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  model_used TEXT,
  source TEXT DEFAULT 'chat',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_chat_therapist ON evidence_chat_training(therapist_id);

ALTER TABLE evidence_chat_training ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_read_evidence_chat" ON evidence_chat_training FOR SELECT USING (true);
CREATE POLICY "own_insert_evidence_chat" ON evidence_chat_training FOR INSERT WITH CHECK (therapist_id = auth.uid());
