-- Fix: "clinical_entry_type_fk" violation when completing sessions
-- Both frontend (entry_type: 'sesion') and DB trigger (entry_type: 'sesion_terapia')
-- reference codes that don't exist in clinical_entry_types

INSERT INTO public.clinical_entry_types (code, name, category)
VALUES
  ('sesion', 'Sesión Clínica', 'tratamiento'),
  ('sesion_terapia', 'Sesión de Terapia', 'tratamiento'),
  ('evaluacion', 'Evaluación', 'evaluacion'),
  ('nota_clinica', 'Nota Clínica', 'notas'),
  ('alta', 'Alta Clínica', 'administrativo')
ON CONFLICT (code) DO NOTHING;
