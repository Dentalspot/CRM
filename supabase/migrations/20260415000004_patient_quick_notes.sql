-- Quick notes for patients (short dated notes visible in sidebar)
CREATE TABLE IF NOT EXISTS public.patient_quick_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  therapist_id uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL,
  description text,
  note_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.patient_quick_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists can manage own quick notes"
  ON public.patient_quick_notes FOR ALL
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

CREATE INDEX idx_quick_notes_patient ON public.patient_quick_notes(patient_id, note_date DESC);
