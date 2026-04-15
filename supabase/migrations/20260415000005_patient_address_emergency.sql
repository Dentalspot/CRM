-- Add address and emergency contact fields to patients table
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
