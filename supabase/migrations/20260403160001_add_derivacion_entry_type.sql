-- Add 'derivacion' to clinical_entry_types so referrals can be stored in clinical_history
-- The foreign key constraint clinical_entry_type_fk requires entry_type to exist in this table

INSERT INTO clinical_entry_types (code, name, category)
VALUES ('derivacion', 'Derivación', 'derivacion')
ON CONFLICT (code) DO NOTHING;
