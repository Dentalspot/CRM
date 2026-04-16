-- ============================================================
-- FASE 1 — PASO 3: Poblar modelo de organización
--
-- Migración conservadora con checkpoints.
-- Ante ambigüedad → migration_review_queue.
-- No apaga campos legacy. No activa RLS. No hace NOT NULL.
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 3.0 — Crear migration_review_queue + ajustar constraint
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.migration_review_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES public.organizations(id),
    entity_type text NOT NULL CHECK (entity_type IN ('patient', 'appointment', 'dentist', 'organization')),
    entity_id uuid NOT NULL,
    source_table text NOT NULL,
    issue_type text NOT NULL CHECK (issue_type IN (
        'orphan_patient', 'ambiguous_org', 'missing_dentist',
        'multi_clinic_dentist', 'dentist_not_in_org',
        'no_primary_dentist', 'unassigned_clinic_patient'
    )),
    issue_description text NOT NULL,
    context jsonb,
    severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'dismissed')),
    migration_batch text NOT NULL,
    resolution text,
    resolved_at timestamp with time zone,
    resolved_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mrq_status ON public.migration_review_queue (status) WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_mrq_entity ON public.migration_review_queue (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_mrq_org ON public.migration_review_queue (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mrq_batch ON public.migration_review_queue (migration_batch);

ALTER TABLE public.migration_review_queue ENABLE ROW LEVEL SECURITY;

-- Ajustar constraint de organization_members para permitir múltiples roles
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_organization_id_user_id_key;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_org_user_role_key UNIQUE (organization_id, user_id, role);


-- ══════════════════════════════════════════════════════════════
-- 3.1 — Crear organizations desde legacy
-- ══════════════════════════════════════════════════════════════

-- 3.1a: Cada clínica existente → organization tipo 'clinic'
INSERT INTO public.organizations (id, name, type, legal_entity_type, legal_name, legal_rut, address, phone, email, created_at)
SELECT
    gen_random_uuid(),
    c.name,
    'clinic',
    CASE WHEN c.rut_empresa IS NOT NULL THEN 'persona_juridica' ELSE 'persona_natural' END,
    COALESCE(c.razon_social, c.name),
    c.rut_empresa,
    c.address,
    c.phone,
    c.email,
    c.created_at
FROM public.clinics c
WHERE c.is_active = true;

-- Crear mapping temporal: clinics.id → organizations.id
-- Usamos una tabla temporal para el mapeo durante esta migración
CREATE TEMPORARY TABLE _clinic_org_map AS
SELECT c.id AS clinic_id, o.id AS org_id, c.therapist_id
FROM public.clinics c
JOIN public.organizations o ON o.name = c.name AND o.type = 'clinic'
WHERE c.is_active = true;

-- 3.1b: Dentistas independientes (sin clínica propia ni membresía de clínica)
-- Solo los que NO son dueños de clínica y NO son miembros de clínica
INSERT INTO public.organizations (id, name, type, legal_entity_type, legal_name, legal_rut, phone, email, created_at)
SELECT
    gen_random_uuid(),
    'Consultorio de ' || p.full_name,
    'solo_practice',
    'persona_natural',
    p.full_name,
    p.rut,
    p.phone,
    p.email,
    p.created_at
FROM public.profiles p
WHERE p.role = 'therapist'
  AND p.id NOT IN (SELECT therapist_id FROM public.clinics WHERE therapist_id IS NOT NULL)
  AND p.id NOT IN (SELECT therapist_id FROM public.clinic_therapists WHERE is_active = true);

-- Mapping para dentistas independientes
CREATE TEMPORARY TABLE _solo_org_map AS
SELECT p.id AS therapist_id, o.id AS org_id
FROM public.profiles p
JOIN public.organizations o ON o.legal_name = p.full_name AND o.type = 'solo_practice'
WHERE p.role = 'therapist'
  AND p.id NOT IN (SELECT therapist_id FROM public.clinics WHERE therapist_id IS NOT NULL)
  AND p.id NOT IN (SELECT therapist_id FROM public.clinic_therapists WHERE is_active = true);


-- ══════════════════════════════════════════════════════════════
-- 3.2 — Poblar organization_members
-- ══════════════════════════════════════════════════════════════

-- 3.2a: Dueños de clínica → clinic_admin + dentist (2 filas)
INSERT INTO public.organization_members (organization_id, user_id, role, is_active, joined_at)
SELECT m.org_id, m.therapist_id, 'clinic_admin', true, now()
FROM _clinic_org_map m
WHERE m.therapist_id IS NOT NULL
ON CONFLICT (organization_id, user_id, role) DO NOTHING;

INSERT INTO public.organization_members (organization_id, user_id, role, is_active, joined_at)
SELECT m.org_id, m.therapist_id, 'dentist', true, now()
FROM _clinic_org_map m
WHERE m.therapist_id IS NOT NULL
ON CONFLICT (organization_id, user_id, role) DO NOTHING;

-- 3.2b: Miembros de clínica (clinic_therapists) → dentist
INSERT INTO public.organization_members (organization_id, user_id, role, is_active, joined_at)
SELECT m.org_id, ct.therapist_id, 'dentist', true, ct.joined_at
FROM public.clinic_therapists ct
JOIN _clinic_org_map m ON m.clinic_id = ct.clinic_id
WHERE ct.is_active = true
ON CONFLICT (organization_id, user_id, role) DO NOTHING;

-- 3.2c: Dentistas independientes → clinic_admin + dentist de su solo_practice
INSERT INTO public.organization_members (organization_id, user_id, role, is_active, joined_at)
SELECT m.org_id, m.therapist_id, 'clinic_admin', true, now()
FROM _solo_org_map m
ON CONFLICT (organization_id, user_id, role) DO NOTHING;

INSERT INTO public.organization_members (organization_id, user_id, role, is_active, joined_at)
SELECT m.org_id, m.therapist_id, 'dentist', true, now()
FROM _solo_org_map m
ON CONFLICT (organization_id, user_id, role) DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- 3.3 — Poblar patients.organization_id
-- ══════════════════════════════════════════════════════════════

-- Prioridad 1: Pacientes con clinic_id → org de esa clínica
UPDATE public.patients p
SET organization_id = m.org_id
FROM _clinic_org_map m
WHERE p.clinic_id = m.clinic_id
  AND p.organization_id IS NULL;

-- Prioridad 2: Pacientes de dentista independiente (sin clinic_id)
UPDATE public.patients p
SET organization_id = m.org_id
FROM _solo_org_map m
WHERE p.therapist_id = m.therapist_id
  AND p.clinic_id IS NULL
  AND p.organization_id IS NULL;

-- Prioridad 3: Pacientes sin clinic_id de dentista que es dueño de EXACTAMENTE 1 clínica
UPDATE public.patients p
SET organization_id = sub.org_id
FROM (
    SELECT m.therapist_id, m.org_id
    FROM _clinic_org_map m
    WHERE m.therapist_id IN (
        SELECT therapist_id FROM _clinic_org_map GROUP BY therapist_id HAVING count(*) = 1
    )
) sub
WHERE p.therapist_id = sub.therapist_id
  AND p.clinic_id IS NULL
  AND p.organization_id IS NULL;

-- Prioridad 4: Dentista dueño de MÚLTIPLES clínicas + paciente sin clinic_id → COLA
INSERT INTO public.migration_review_queue (organization_id, entity_type, entity_id, source_table, issue_type, issue_description, context, severity, migration_batch)
SELECT
    NULL,
    'patient',
    p.id,
    'patients',
    'ambiguous_org',
    'Paciente sin clinic_id de dentista dueño de múltiples clínicas. No se puede determinar organización automáticamente.',
    jsonb_build_object(
        'patient_name', pr.full_name,
        'therapist_id', p.therapist_id,
        'therapist_name', t.full_name,
        'clinic_count', (SELECT count(*) FROM _clinic_org_map WHERE therapist_id = p.therapist_id)
    ),
    'high',
    'paso_3.3'
FROM public.patients p
LEFT JOIN public.profiles pr ON pr.id = p.profile_id
LEFT JOIN public.profiles t ON t.id = p.therapist_id
WHERE p.organization_id IS NULL
  AND p.therapist_id IS NOT NULL
  AND p.clinic_id IS NULL
  AND p.therapist_id IN (
      SELECT therapist_id FROM _clinic_org_map GROUP BY therapist_id HAVING count(*) > 1
  );

-- Prioridad 5: Pacientes huérfanos (sin therapist_id ni clinic_id) → COLA
INSERT INTO public.migration_review_queue (organization_id, entity_type, entity_id, source_table, issue_type, issue_description, context, severity, migration_batch)
SELECT
    NULL,
    'patient',
    p.id,
    'patients',
    'orphan_patient',
    'Paciente sin therapist_id ni clinic_id. No se puede determinar organización.',
    jsonb_build_object('patient_name', pr.full_name, 'status', p.status),
    'high',
    'paso_3.3'
FROM public.patients p
LEFT JOIN public.profiles pr ON pr.id = p.profile_id
WHERE p.organization_id IS NULL
  AND p.therapist_id IS NULL
  AND p.clinic_id IS NULL;


-- ══════════════════════════════════════════════════════════════
-- 3.4 — Poblar patient_care_team (solo con membresía válida)
-- ══════════════════════════════════════════════════════════════

-- Solo crear care_team si el dentista es miembro de la org del paciente
INSERT INTO public.patient_care_team (patient_id, dentist_id, organization_id, role, is_active, assigned_at)
SELECT
    p.id,
    p.therapist_id,
    p.organization_id,
    'primary',
    true,
    COALESCE(p.admission_date::timestamptz, p.created_at)
FROM public.patients p
WHERE p.organization_id IS NOT NULL
  AND p.therapist_id IS NOT NULL
  AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = p.organization_id
        AND om.user_id = p.therapist_id
        AND om.role = 'dentist'
        AND om.is_active = true
  );

-- Registrar en cola los que no calificaron (dentista no es miembro de la org)
INSERT INTO public.migration_review_queue (organization_id, entity_type, entity_id, source_table, issue_type, issue_description, context, severity, migration_batch)
SELECT
    p.organization_id,
    'patient',
    p.id,
    'patients',
    'dentist_not_in_org',
    'Dentista asignado al paciente no es miembro de la organización del paciente.',
    jsonb_build_object(
        'patient_name', pr.full_name,
        'therapist_id', p.therapist_id,
        'therapist_name', t.full_name,
        'organization_id', p.organization_id
    ),
    'medium',
    'paso_3.4'
FROM public.patients p
LEFT JOIN public.profiles pr ON pr.id = p.profile_id
LEFT JOIN public.profiles t ON t.id = p.therapist_id
WHERE p.organization_id IS NOT NULL
  AND p.therapist_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = p.organization_id
        AND om.user_id = p.therapist_id
        AND om.role = 'dentist'
        AND om.is_active = true
  );

-- Pacientes sin therapist_id pero con org → cola
INSERT INTO public.migration_review_queue (organization_id, entity_type, entity_id, source_table, issue_type, issue_description, context, severity, migration_batch)
SELECT
    p.organization_id,
    'patient',
    p.id,
    'patients',
    'no_primary_dentist',
    'Paciente con organización asignada pero sin therapist_id. No se puede crear equipo tratante.',
    jsonb_build_object('patient_name', pr.full_name, 'status', p.status),
    'medium',
    'paso_3.4'
FROM public.patients p
LEFT JOIN public.profiles pr ON pr.id = p.profile_id
WHERE p.organization_id IS NOT NULL
  AND p.therapist_id IS NULL;


-- ══════════════════════════════════════════════════════════════
-- 3.5 — Copiar datos clínicos → patient_clinical_record
-- ══════════════════════════════════════════════════════════════

INSERT INTO public.patient_clinical_record (
    patient_id, organization_id,
    consultation_reason, allergies, medications,
    systemic_diseases, surgical_history, pregnancy,
    clinical_alerts, medical_history,
    created_at, updated_at
)
SELECT
    p.id, p.organization_id,
    p.consultation_reason, p.allergies, p.medications,
    p.systemic_diseases, p.surgical_history, p.pregnancy,
    p.clinical_alerts, p.medical_history,
    p.created_at, p.updated_at
FROM public.patients p
WHERE p.organization_id IS NOT NULL;


-- ══════════════════════════════════════════════════════════════
-- 3.6 — Poblar organization_id en tablas hijas
-- ══════════════════════════════════════════════════════════════

-- clinical_history
UPDATE public.clinical_history ch
SET organization_id = p.organization_id
FROM public.patients p
WHERE ch.patient_id = p.id
  AND p.organization_id IS NOT NULL
  AND ch.organization_id IS NULL;

-- clinical_reports
UPDATE public.clinical_reports cr
SET organization_id = p.organization_id
FROM public.patients p
WHERE cr.patient_id = p.id
  AND p.organization_id IS NOT NULL
  AND cr.organization_id IS NULL;

-- patient_diagnoses
UPDATE public.patient_diagnoses pd
SET organization_id = p.organization_id
FROM public.patients p
WHERE pd.patient_id = p.id
  AND p.organization_id IS NOT NULL
  AND pd.organization_id IS NULL;

-- patient_documents
UPDATE public.patient_documents pd
SET organization_id = p.organization_id
FROM public.patients p
WHERE pd.patient_id = p.id
  AND p.organization_id IS NOT NULL
  AND pd.organization_id IS NULL;

-- patient_evaluations
UPDATE public.patient_evaluations pe
SET organization_id = p.organization_id
FROM public.patients p
WHERE pe.patient_id = p.id
  AND p.organization_id IS NOT NULL
  AND pe.organization_id IS NULL;

-- patient_assigned_plans
UPDATE public.patient_assigned_plans pap
SET organization_id = p.organization_id
FROM public.patients p
WHERE pap.patient_id = p.id
  AND p.organization_id IS NOT NULL
  AND pap.organization_id IS NULL;

-- patient_goals
UPDATE public.patient_goals pg
SET organization_id = p.organization_id
FROM public.patients p
WHERE pg.patient_id = p.id
  AND p.organization_id IS NOT NULL
  AND pg.organization_id IS NULL;

-- patient_private_notes
UPDATE public.patient_private_notes ppn
SET organization_id = p.organization_id
FROM public.patients p
WHERE ppn.patient_id = p.id
  AND p.organization_id IS NOT NULL
  AND ppn.organization_id IS NULL;

-- patient_activities
UPDATE public.patient_activities pa
SET organization_id = p.organization_id
FROM public.patients p
WHERE pa.patient_id = p.id
  AND p.organization_id IS NOT NULL
  AND pa.organization_id IS NULL;

-- patient_payments
UPDATE public.patient_payments pp
SET organization_id = p.organization_id
FROM public.patients p
WHERE pp.patient_id = p.id
  AND p.organization_id IS NOT NULL
  AND pp.organization_id IS NULL;

-- odontograms
UPDATE public.odontograms og
SET organization_id = p.organization_id
FROM public.patients p
WHERE og.patient_id = p.id
  AND p.organization_id IS NOT NULL
  AND og.organization_id IS NULL;

-- odontogram_evaluations (tiene patient_id directo)
UPDATE public.odontogram_evaluations oe
SET organization_id = p.organization_id
FROM public.patients p
WHERE oe.patient_id = p.id
  AND p.organization_id IS NOT NULL
  AND oe.organization_id IS NULL;

-- notiz_sessions
UPDATE public.notiz_sessions ns
SET organization_id = p.organization_id
FROM public.patients p
WHERE ns.patient_id = p.id
  AND p.organization_id IS NOT NULL
  AND ns.organization_id IS NULL;

-- appointments (especial: usa patient_id primero, luego clinic_id)
UPDATE public.appointments a
SET organization_id = p.organization_id
FROM public.patients p
WHERE a.patient_id = p.id
  AND p.organization_id IS NOT NULL
  AND a.organization_id IS NULL;

-- Appointments restantes: intentar vía clinic_id
UPDATE public.appointments a
SET organization_id = m.org_id
FROM _clinic_org_map m
WHERE a.clinic_id = m.clinic_id
  AND a.organization_id IS NULL;


-- ══════════════════════════════════════════════════════════════
-- 3.7 — Poblar processing_lawful_basis (prudente)
-- ══════════════════════════════════════════════════════════════

-- health_protection para pacientes activos
INSERT INTO public.processing_lawful_basis (organization_id, patient_id, basis_type, scope, legal_reference, is_active, established_at)
SELECT
    p.organization_id,
    p.id,
    'health_protection',
    'Tratamiento de datos de salud para atención sanitaria',
    'Ley 20.584; Ley 21.719 Art. 16 letra e)',
    CASE WHEN p.status = 'active' THEN true ELSE false END,
    COALESCE(p.admission_date::timestamptz, p.created_at)
FROM public.patients p
WHERE p.organization_id IS NOT NULL;

-- legal_obligation para todos (retención 15 años)
INSERT INTO public.processing_lawful_basis (organization_id, patient_id, basis_type, scope, legal_reference, is_active, established_at)
SELECT
    p.organization_id,
    p.id,
    'legal_obligation',
    'Conservación de ficha clínica por período legal mínimo de 15 años',
    'Ley 20.584 Art. 12',
    true,
    COALESCE(p.admission_date::timestamptz, p.created_at)
FROM public.patients p
WHERE p.organization_id IS NOT NULL;


-- ══════════════════════════════════════════════════════════════
-- Limpieza de tablas temporales
-- ══════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS _clinic_org_map;
DROP TABLE IF EXISTS _solo_org_map;
