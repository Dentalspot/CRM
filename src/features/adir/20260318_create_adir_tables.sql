-- ============================================================
-- ADI-R (Autism Diagnostic Interview — Revised)
-- Tablas para registro y scoring de entrevistas ADI-R
-- ============================================================

-- 1. Evaluaciones ADI-R
CREATE TABLE IF NOT EXISTS adir_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  therapist_id UUID REFERENCES auth.users(id) NOT NULL,
  patient_id UUID NOT NULL,

  -- Datos del informante (entrevista al cuidador)
  informant_name TEXT,
  informant_relationship TEXT,         -- 'madre' | 'padre' | 'abuelo/a' | 'cuidador/a' | 'otro'

  -- Configuración
  verbal_status TEXT NOT NULL DEFAULT 'verbal',  -- 'verbal' | 'non_verbal'
  fecha_evaluacion DATE NOT NULL DEFAULT CURRENT_DATE,
  examinador TEXT,
  informacion_adicional TEXT,

  -- Scores por dominio (algoritmo diagnóstico)
  total_a SMALLINT,                    -- Interacción social recíproca
  total_b SMALLINT,                    -- Comunicación (verbal o no verbal según verbal_status)
  total_c SMALLINT,                    -- Conducta restringida/repetitiva
  total_d SMALLINT,                    -- Alteraciones del desarrollo < 36 meses

  -- Clasificación
  cumple_criterio_a BOOLEAN,
  cumple_criterio_b BOOLEAN,
  cumple_criterio_c BOOLEAN,
  cumple_criterio_d BOOLEAN,
  clasificacion TEXT,                  -- 'autism' | 'non_spectrum' | 'inconclusive'

  observaciones TEXT,
  status TEXT DEFAULT 'borrador',      -- borrador | completada | revisada

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Respuestas por ítem
CREATE TABLE IF NOT EXISTS adir_item_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID REFERENCES adir_evaluations(id) ON DELETE CASCADE NOT NULL,
  item_code TEXT NOT NULL,             -- e.g. 'A1', 'B1', 'C1', 'D1'
  item_name TEXT,
  domain TEXT NOT NULL,                -- 'A' | 'B_verbal' | 'B_nonverbal' | 'C' | 'D'
  raw_score SMALLINT,                  -- 0, 1, 2, 3, 7, 8, 9
  algorithm_score SMALLINT,            -- Convertido para algoritmo (3→2, 7/8/9→0)
  period TEXT DEFAULT 'current',       -- 'current' | '4_5_years' | 'ever'
  notes TEXT,                          -- Notas del entrevistador por ítem

  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(evaluation_id, item_code, period)
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_adir_evaluations_therapist ON adir_evaluations(therapist_id);
CREATE INDEX IF NOT EXISTS idx_adir_evaluations_patient ON adir_evaluations(patient_id);
CREATE INDEX IF NOT EXISTS idx_adir_item_responses_evaluation ON adir_item_responses(evaluation_id);

-- 4. RLS
ALTER TABLE adir_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE adir_item_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "therapist_owns_adir_evaluations"
  ON adir_evaluations FOR ALL
  USING (therapist_id = auth.uid());

CREATE POLICY "therapist_owns_adir_responses"
  ON adir_item_responses FOR ALL
  USING (
    evaluation_id IN (
      SELECT id FROM adir_evaluations WHERE therapist_id = auth.uid()
    )
  );
