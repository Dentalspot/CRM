-- PIE Evaluation Tables: TECAL, STSG, TEPROSIF-R
-- Follows same pattern as adir_evaluations / ados2_evaluations

-- ═══════════════════════════════════════════════════
-- TECAL — Test para la Comprensión Auditiva del Lenguaje
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.tecal_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  fecha_evaluacion DATE NOT NULL DEFAULT CURRENT_DATE,
  edad_anios INT,
  edad_meses INT,

  errores_vocabulario INT DEFAULT 0,
  errores_morfologia INT DEFAULT 0,
  errores_sintaxis INT DEFAULT 0,

  puntaje_vocabulario INT,
  puntaje_morfologia INT,
  puntaje_sintaxis INT,
  puntaje_total INT,

  de_vocabulario TEXT,
  de_morfologia TEXT,
  de_sintaxis TEXT,
  de_total TEXT,

  resultado_vocabulario TEXT,
  resultado_morfologia TEXT,
  resultado_sintaxis TEXT,
  resultado_total TEXT,

  observaciones TEXT,
  status TEXT DEFAULT 'borrador',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tecal_therapist ON tecal_evaluations(therapist_id);
CREATE INDEX IF NOT EXISTS idx_tecal_patient ON tecal_evaluations(patient_id);

ALTER TABLE tecal_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "therapist_owns_tecal" ON tecal_evaluations FOR ALL USING (therapist_id = auth.uid());

-- ═══════════════════════════════════════════════════
-- STSG — Screening Test of Spanish Grammar
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.stsg_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  fecha_evaluacion DATE NOT NULL DEFAULT CURRENT_DATE,
  edad_anios INT,
  edad_meses INT,

  puntaje_receptivo INT DEFAULT 0,
  puntaje_expresivo INT DEFAULT 0,

  percentil_receptivo TEXT,
  percentil_expresivo TEXT,
  resultado_receptivo TEXT,
  resultado_expresivo TEXT,

  observaciones TEXT,
  status TEXT DEFAULT 'borrador',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stsg_therapist ON stsg_evaluations(therapist_id);
CREATE INDEX IF NOT EXISTS idx_stsg_patient ON stsg_evaluations(patient_id);

ALTER TABLE stsg_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "therapist_owns_stsg" ON stsg_evaluations FOR ALL USING (therapist_id = auth.uid());

-- ═══════════════════════════════════════════════════
-- TEPROSIF-R — Test de Procesos de Simplificación Fonológica
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.teprosif_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  fecha_evaluacion DATE NOT NULL DEFAULT CURRENT_DATE,
  edad_anios INT,
  edad_meses INT,

  total_estructurales INT DEFAULT 0,
  total_asimilacion INT DEFAULT 0,
  total_sustitucion INT DEFAULT 0,
  total_procesos INT DEFAULT 0,

  items_detail JSONB DEFAULT '[]'::jsonb,

  resultado TEXT,
  observaciones TEXT,
  status TEXT DEFAULT 'borrador',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teprosif_therapist ON teprosif_evaluations(therapist_id);
CREATE INDEX IF NOT EXISTS idx_teprosif_patient ON teprosif_evaluations(patient_id);

ALTER TABLE teprosif_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "therapist_owns_teprosif" ON teprosif_evaluations FOR ALL USING (therapist_id = auth.uid());
