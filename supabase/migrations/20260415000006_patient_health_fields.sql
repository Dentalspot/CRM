-- Add health history fields to patients table
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medications text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS systemic_diseases text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS pregnancy text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS surgical_history text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS clinical_alerts text;
