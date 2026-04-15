-- Add odontogram_type to distinguish diagnostico vs tratamiento
ALTER TABLE public.odontograms
  ADD COLUMN IF NOT EXISTS odontogram_type text NOT NULL DEFAULT 'diagnostico';

ALTER TABLE public.odontograms
  ADD CONSTRAINT odontograms_type_check
  CHECK (odontogram_type IN ('diagnostico', 'tratamiento'));

-- One odontogram of each type per patient
-- Drop old unique if exists, then create new composite
CREATE UNIQUE INDEX IF NOT EXISTS odontograms_patient_type_unique
  ON public.odontograms (patient_id, odontogram_type);
