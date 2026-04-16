-- ============================================================
-- Resolución provisional de Danissa Klagges Romero
-- + Paso 4B: NOT NULL en 4 tablas restantes
--
-- Asignación provisional a Odontologia Bulnes por mayoría de
-- actividad asistencial histórica reciente.
-- ============================================================

-- IDs verificados:
-- patient_id Danissa:   76b552c3-1b6a-43a1-8b84-16c0a7f6d37b
-- therapist_id:         4e55fb74-b3b5-4233-9b5d-88d7a01a9046 (Cristóbal Tagle)
-- org_id Bulnes:        f7877d13-b5b9-4a16-8aee-be7933910478

-- ──────────────────────────────────────────────────────────────
-- A.1 — Asignar organization_id al paciente
-- ──────────────────────────────────────────────────────────────
UPDATE public.patients
SET organization_id = 'f7877d13-b5b9-4a16-8aee-be7933910478'
WHERE id = '76b552c3-1b6a-43a1-8b84-16c0a7f6d37b'
  AND organization_id IS NULL;

-- ──────────────────────────────────────────────────────────────
-- A.2 — Crear patient_care_team primary
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.patient_care_team (patient_id, dentist_id, organization_id, role, is_active, assigned_at)
VALUES (
    '76b552c3-1b6a-43a1-8b84-16c0a7f6d37b',
    '4e55fb74-b3b5-4233-9b5d-88d7a01a9046',
    'f7877d13-b5b9-4a16-8aee-be7933910478',
    'primary',
    true,
    (SELECT COALESCE(admission_date::timestamptz, created_at) FROM public.patients WHERE id = '76b552c3-1b6a-43a1-8b84-16c0a7f6d37b')
);

-- ──────────────────────────────────────────────────────────────
-- A.3 — Crear patient_clinical_record
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
WHERE id = '76b552c3-1b6a-43a1-8b84-16c0a7f6d37b';

-- ──────────────────────────────────────────────────────────────
-- A.4 — Poblar organization_id en registros dependientes
-- ──────────────────────────────────────────────────────────────

UPDATE public.clinical_history
SET organization_id = 'f7877d13-b5b9-4a16-8aee-be7933910478'
WHERE patient_id = '76b552c3-1b6a-43a1-8b84-16c0a7f6d37b'
  AND organization_id IS NULL;

UPDATE public.odontograms
SET organization_id = 'f7877d13-b5b9-4a16-8aee-be7933910478'
WHERE patient_id = '76b552c3-1b6a-43a1-8b84-16c0a7f6d37b'
  AND organization_id IS NULL;

UPDATE public.odontogram_evaluations
SET organization_id = 'f7877d13-b5b9-4a16-8aee-be7933910478'
WHERE patient_id = '76b552c3-1b6a-43a1-8b84-16c0a7f6d37b'
  AND organization_id IS NULL;

UPDATE public.patient_payments
SET organization_id = 'f7877d13-b5b9-4a16-8aee-be7933910478'
WHERE patient_id = '76b552c3-1b6a-43a1-8b84-16c0a7f6d37b'
  AND organization_id IS NULL;

-- ──────────────────────────────────────────────────────────────
-- A.5 — Crear processing_lawful_basis
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.processing_lawful_basis (organization_id, patient_id, basis_type, scope, legal_reference, is_active, established_at)
VALUES (
    'f7877d13-b5b9-4a16-8aee-be7933910478',
    '76b552c3-1b6a-43a1-8b84-16c0a7f6d37b',
    'health_protection',
    'Tratamiento de datos de salud para atención sanitaria',
    'Ley 20.584; Ley 21.719 Art. 16 letra e)',
    true,
    (SELECT COALESCE(admission_date::timestamptz, created_at) FROM public.patients WHERE id = '76b552c3-1b6a-43a1-8b84-16c0a7f6d37b')
);

INSERT INTO public.processing_lawful_basis (organization_id, patient_id, basis_type, scope, legal_reference, is_active, established_at)
VALUES (
    'f7877d13-b5b9-4a16-8aee-be7933910478',
    '76b552c3-1b6a-43a1-8b84-16c0a7f6d37b',
    'legal_obligation',
    'Conservación de ficha clínica por período legal mínimo de 15 años',
    'Ley 20.584 Art. 12',
    true,
    (SELECT COALESCE(admission_date::timestamptz, created_at) FROM public.patients WHERE id = '76b552c3-1b6a-43a1-8b84-16c0a7f6d37b')
);

-- ──────────────────────────────────────────────────────────────
-- A.6 — Resolver migration_review_queue
-- ──────────────────────────────────────────────────────────────
UPDATE public.migration_review_queue
SET status = 'resolved',
    resolution = 'Asignación provisional a Odontologia Bulnes por mayoría de actividad asistencial histórica reciente. Caso podría requerir separación futura por organización si se confirma atención activa sostenida en múltiples sedes.',
    resolved_at = now()
WHERE entity_id = '76b552c3-1b6a-43a1-8b84-16c0a7f6d37b'
  AND entity_type = 'patient'
  AND status = 'pending';

-- ══════════════════════════════════════════════════════════════
-- B — Paso 4B: SET NOT NULL en 4 tablas restantes
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.patients
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.clinical_history
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.odontograms
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.patient_payments
    ALTER COLUMN organization_id SET NOT NULL;
