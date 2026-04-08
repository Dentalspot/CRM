-- Store PACI examples for RAG and future fine-tuning
-- Every time a therapist saves/edits a PACI, a snapshot is stored here
-- with the evaluation context that generated it.

CREATE TABLE IF NOT EXISTS public.paci_training_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL,
  patient_id UUID NOT NULL,

  -- Input context (what the AI received)
  diagnosis TEXT,
  nee_type TEXT,
  patient_age TEXT,
  course TEXT,
  evaluation_results TEXT,  -- summary of TECAL/STSG/TEPROSIF results

  -- Output (what the therapist validated/edited)
  areas JSONB DEFAULT '[]'::jsonb,  -- the final edited PACI areas
  perfil JSONB DEFAULT '{}'::jsonb,
  quality_score SMALLINT,  -- optional: therapist rates quality 1-5

  -- Metadata
  source TEXT DEFAULT 'manual',  -- 'manual' | 'ai_generated' | 'ai_edited'
  period TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paci_training_diagnosis ON paci_training_examples(diagnosis);
CREATE INDEX IF NOT EXISTS idx_paci_training_nee ON paci_training_examples(nee_type);

ALTER TABLE paci_training_examples ENABLE ROW LEVEL SECURITY;
-- All therapists can read training examples (shared knowledge base)
CREATE POLICY "anyone_read_training" ON paci_training_examples FOR SELECT USING (true);
-- Only creator can insert/update
CREATE POLICY "own_insert_training" ON paci_training_examples FOR INSERT WITH CHECK (therapist_id = auth.uid());
CREATE POLICY "own_update_training" ON paci_training_examples FOR UPDATE USING (therapist_id = auth.uid());
