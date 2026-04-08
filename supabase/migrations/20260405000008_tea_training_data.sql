-- Training examples for TEA module RAG + future fine-tuning
-- Stores therapist-validated ADOS-2 and ADI-R analyses

CREATE TABLE IF NOT EXISTS public.tea_training_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL,
  patient_id UUID,

  -- Evaluation type
  eval_type TEXT NOT NULL,  -- 'ados2' | 'adir' | 'concordance'

  -- Input context (scores)
  eval_scores JSONB DEFAULT '{}'::jsonb,
  -- ADOS-2: { module, algorithm, total_sa, total_crr, total_global, rango_preocupacion }
  -- ADI-R: { verbal_status, total_a, total_b, total_c, total_d, clasificacion }

  patient_age TEXT,
  verbal_status TEXT,

  -- Output (therapist-validated analysis)
  clinical_analysis TEXT,
  recommendations TEXT,
  report_observations TEXT,

  -- Metadata
  source TEXT DEFAULT 'ai_edited',  -- 'ai_generated' | 'ai_edited' | 'manual'
  quality_score SMALLINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tea_training_type ON tea_training_examples(eval_type);
CREATE INDEX IF NOT EXISTS idx_tea_training_therapist ON tea_training_examples(therapist_id);

ALTER TABLE tea_training_examples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_read_tea_training" ON tea_training_examples FOR SELECT USING (true);
CREATE POLICY "own_insert_tea_training" ON tea_training_examples FOR INSERT WITH CHECK (therapist_id = auth.uid());
