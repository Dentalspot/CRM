-- Tabla de evaluaciones odontológicas (patrón ADOS-2)
CREATE TABLE IF NOT EXISTS public.odontogram_evaluations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id uuid NOT NULL REFERENCES public.profiles(id),
    patient_id uuid NOT NULL REFERENCES public.patients(id),
    evaluation_type text NOT NULL DEFAULT 'inicial' CHECK (evaluation_type IN ('inicial', 'tratamiento')),
    status text NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador', 'completada')),
    evaluation_date date NOT NULL DEFAULT CURRENT_DATE,
    teeth_data jsonb DEFAULT '{}'::jsonb,
    treatments jsonb DEFAULT '[]'::jsonb,
    budget_total numeric DEFAULT 0,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.odontogram_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists can manage own evaluations"
    ON public.odontogram_evaluations
    FOR ALL
    USING (therapist_id = auth.uid())
    WITH CHECK (therapist_id = auth.uid());

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_odontogram_evaluations_therapist ON public.odontogram_evaluations(therapist_id);
CREATE INDEX IF NOT EXISTS idx_odontogram_evaluations_patient ON public.odontogram_evaluations(patient_id);
