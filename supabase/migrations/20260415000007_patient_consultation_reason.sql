-- Add consultation reason field to patients table
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS consultation_reason text;
