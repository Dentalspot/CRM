-- ============================================================================
-- ODONTOGRAMS TABLE
-- Almacena odontogramas digitales vinculados a pacientes.
-- teeth_data es JSONB con estructura: { "11": { "mesial": "caries", ... }, ... }
-- ============================================================================

CREATE TABLE IF NOT EXISTS odontograms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  tooth_type TEXT NOT NULL DEFAULT 'adult' CHECK (tooth_type IN ('adult', 'child')),
  teeth_data JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_odontograms_patient_id ON odontograms(patient_id);
CREATE INDEX idx_odontograms_therapist_id ON odontograms(therapist_id);
CREATE INDEX idx_odontograms_updated_at ON odontograms(updated_at DESC);

-- RLS
ALTER TABLE odontograms ENABLE ROW LEVEL SECURITY;

-- Dentistas: CRUD completo en odontogramas de sus pacientes
CREATE POLICY "therapist_odontograms_crud"
  ON odontograms
  FOR ALL
  TO authenticated
  USING (
    therapist_id = auth.uid()
    OR patient_id IN (
      SELECT id FROM patients WHERE therapist_id = auth.uid()
    )
  )
  WITH CHECK (
    therapist_id = auth.uid()
    OR patient_id IN (
      SELECT id FROM patients WHERE therapist_id = auth.uid()
    )
  );

-- Pacientes: solo lectura de sus propios odontogramas
CREATE POLICY "patient_odontograms_read"
  ON odontograms
  FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE id IN (
        SELECT id FROM patients p
        JOIN profiles pr ON pr.id = p.id
        WHERE pr.id = auth.uid()
      )
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_odontogram_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_odontogram_updated_at
  BEFORE UPDATE ON odontograms
  FOR EACH ROW
  EXECUTE FUNCTION update_odontogram_updated_at();
