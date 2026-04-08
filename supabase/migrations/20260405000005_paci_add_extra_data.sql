-- Add extra_data column for AI-generated PACI sections
ALTER TABLE pie_paci ADD COLUMN IF NOT EXISTS extra_data JSONB DEFAULT '{}'::jsonb;
-- Stores: estrategias_aula, apoyos_especializados, orientaciones_familia
