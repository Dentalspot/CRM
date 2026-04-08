-- Add 'informe_tea' to clinical_entry_types so TEA reports (ADOS-2, ADI-R, Sensorial)
-- can be saved to the patient's clinical history (ficha clínica)

INSERT INTO clinical_entry_types (code, name, category)
VALUES ('informe_tea', 'Informe TEA', 'informe')
ON CONFLICT (code) DO NOTHING;
