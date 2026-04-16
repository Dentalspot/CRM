-- ============================================================
-- PASO 3 — Resolución manual: Cristobal Tagle Morales
--
-- Asignado a Odontología Los Álamos por mayoría clara de
-- registros asistenciales históricos (4/5 appointments, 1/2
-- clinical_history inferibles en Los Álamos).
--
-- Danissa Klagges Romero se mantiene en cola de revisión.
-- ============================================================

-- Variables de referencia (IDs verificados en queries previas):
-- patient_id Cristobal:    5ffc5695-9c98-4f33-9538-a80338215ea6
-- therapist_id Cristóbal:  4e55fb74-b3b5-4233-9b5d-88d7a01a9046
-- org_id Los Álamos:       dd0f2b0f-eeba-4db1-bca8-77cfd6284e2c

-- ──────────────────────────────────────────────────────────────
-- 1. Asignar organization_id al paciente
-- ──────────────────────────────────────────────────────────────
UPDATE public.patients
SET organization_id = 'dd0f2b0f-eeba-4db1-bca8-77cfd6284e2c'
WHERE id = '5ffc5695-9c98-4f33-9538-a80338215ea6'
  AND organization_id IS NULL;

-- ──────────────────────────────────────────────────────────────
-- 2. Crear patient_care_team primary
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.patient_care_team (patient_id, dentist_id, organization_id, role, is_active, assigned_at)
VALUES (
    '5ffc5695-9c98-4f33-9538-a80338215ea6',
    '4e55fb74-b3b5-4233-9b5d-88d7a01a9046',
    'dd0f2b0f-eeba-4db1-bca8-77cfd6284e2c',
    'primary',
    true,
    (SELECT COALESCE(admission_date::timestamptz, created_at) FROM public.patients WHERE id = '5ffc5695-9c98-4f33-9538-a80338215ea6')
);

-- ──────────────────────────────────────────────────────────────
-- 3. Crear patient_clinical_record (copiar datos clínicos)
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.patient_clinical_record (
    patient_id, organization_id,
    consultation_reason, allergies, medications,
    systemic_diseases, surgical_history, pregnancy,
    clinical_alerts, medical_history,
    created_at, updated_at
)
SELECT
    id, organization_id,
    consultation_reason, allergies, medications,
    systemic_diseases, surgical_history, pregnancy,
    clinical_alerts, medical_history,
    created_at, updated_at
FROM public.patients
WHERE id = '5ffc5695-9c98-4f33-9538-a80338215ea6';

-- ──────────────────────────────────────────────────────────────
-- 4. Poblar organization_id en registros dependientes
-- ──────────────────────────────────────────────────────────────

-- clinical_history
UPDATE public.clinical_history
SET organization_id = 'dd0f2b0f-eeba-4db1-bca8-77cfd6284e2c'
WHERE patient_id = '5ffc5695-9c98-4f33-9538-a80338215ea6'
  AND organization_id IS NULL;

-- odontograms
UPDATE public.odontograms
SET organization_id = 'dd0f2b0f-eeba-4db1-bca8-77cfd6284e2c'
WHERE patient_id = '5ffc5695-9c98-4f33-9538-a80338215ea6'
  AND organization_id IS NULL;

-- odontogram_evaluations
UPDATE public.odontogram_evaluations
SET organization_id = 'dd0f2b0f-eeba-4db1-bca8-77cfd6284e2c'
WHERE patient_id = '5ffc5695-9c98-4f33-9538-a80338215ea6'
  AND organization_id IS NULL;

-- ──────────────────────────────────────────────────────────────
-- 5. Crear processing_lawful_basis
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.processing_lawful_basis (organization_id, patient_id, basis_type, scope, legal_reference, is_active, established_at)
VALUES (
    'dd0f2b0f-eeba-4db1-bca8-77cfd6284e2c',
    '5ffc5695-9c98-4f33-9538-a80338215ea6',
    'health_protection',
    'Tratamiento de datos de salud para atención sanitaria',
    'Ley 20.584; Ley 21.719 Art. 16 letra e)',
    true,
    (SELECT COALESCE(admission_date::timestamptz, created_at) FROM public.patients WHERE id = '5ffc5695-9c98-4f33-9538-a80338215ea6')
);

INSERT INTO public.processing_lawful_basis (organization_id, patient_id, basis_type, scope, legal_reference, is_active, established_at)
VALUES (
    'dd0f2b0f-eeba-4db1-bca8-77cfd6284e2c',
    '5ffc5695-9c98-4f33-9538-a80338215ea6',
    'legal_obligation',
    'Conservación de ficha clínica por período legal mínimo de 15 años',
    'Ley 20.584 Art. 12',
    true,
    (SELECT COALESCE(admission_date::timestamptz, created_at) FROM public.patients WHERE id = '5ffc5695-9c98-4f33-9538-a80338215ea6')
);

-- ──────────────────────────────────────────────────────────────
-- 6. Resolver migration_review_queue para Cristobal
-- ──────────────────────────────────────────────────────────────
UPDATE public.migration_review_queue
SET status = 'resolved',
    resolution = 'Asignado a Odontología Los Álamos. Mayoría clara de registros asistenciales: 4/5 appointments y 1/2 clinical_history inferibles en Los Álamos.',
    resolved_at = now()
WHERE entity_id = '5ffc5695-9c98-4f33-9538-a80338215ea6'
  AND entity_type = 'patient'
  AND status = 'pending';

-- ──────────────────────────────────────────────────────────────
-- 7. Documentar caso Danissa en la cola (sin resolver)
-- ──────────────────────────────────────────────────────────────
UPDATE public.migration_review_queue
SET context = context || '{"review_note": "Caso mantenido en revisión por actividad asistencial real en dos organizaciones (Los Álamos: 3 citas, Bulnes: 5 citas, clinical_history dividida). Requiere confirmación de sede principal o eventual separación futura por organización."}'::jsonb
WHERE entity_id = '76b552c3-1b6a-43a1-8b84-16c0a7f6d37b'
  AND entity_type = 'patient'
  AND status = 'pending';
