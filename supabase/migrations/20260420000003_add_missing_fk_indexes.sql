-- ============================================================
-- Spec 011: add-missing-fk-indexes
-- Fecha: 2026-04-20
-- Origen: Express block audit 2026-04-20 (architecture.md
--   §"Performance audit — FKs sin índice") identificó 30+ FKs sin
--   índice. Este spec cubre los 7 de alta prioridad.
--
-- Estado pre-migration (confirmado Phase 1 del spec 011):
--   - 7 FKs vigentes en pg_constraint (T1 PASS)
--   - 0 índices pre-existentes cubriendo las 7 columnas (T2 PASS)
--   - Row counts: appointments=14, clinical_history=5,
--     clinic_invoices=0, commissions=0 (T3 PASS, CONCURRENTLY
--     innecesario por volumen diminuto)
--
-- Estrategia:
--   - 7 CREATE INDEX IF NOT EXISTS btree default
--   - Naming convention: idx_<table>_<column>
--   - CONCURRENTLY omitido (tablas <100 rows hoy)
--   - IF NOT EXISTS defense-in-depth (FR-013)
--
-- Target FKs:
--   1. appointments.service_id       → therapist_services.id
--   2. clinic_invoices.patient_id    → patients.id
--   3. clinic_invoices.therapist_id  → profiles.id
--   4. clinical_history.diagnosis_id → patient_diagnoses.id
--   5. clinical_history.entry_type   → clinical_entry_types.id
--   6. commissions.sale_id           → sales.id
--   7. commissions.therapist_id      → profiles.id
--
-- Constitution IV (Micro-Bloques): scope tight a los 7 FKs de alta
-- prioridad. Los ~23 FKs restantes (admin_*, arco_*, blog_*, etc.)
-- quedan excluidos per FR-012 — spec futura dedicada si aplica.
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- Pre-check: confirmar estado esperado pre-migration
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  fk_count_pre  INT;
  idx_count_pre INT;
BEGIN
  -- Confirmar los 7 FKs existen
  SELECT COUNT(*) INTO fk_count_pre
  FROM pg_constraint c
  JOIN pg_class cl       ON cl.oid = c.conrelid
  JOIN pg_attribute a    ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.contype = 'f'
    AND cl.relnamespace = 'public'::regnamespace
    AND (
      (cl.relname = 'appointments'     AND a.attname = 'service_id')     OR
      (cl.relname = 'commissions'      AND a.attname = 'therapist_id')   OR
      (cl.relname = 'commissions'      AND a.attname = 'sale_id')        OR
      (cl.relname = 'clinic_invoices'  AND a.attname = 'patient_id')     OR
      (cl.relname = 'clinic_invoices'  AND a.attname = 'therapist_id')   OR
      (cl.relname = 'clinical_history' AND a.attname = 'entry_type')     OR
      (cl.relname = 'clinical_history' AND a.attname = 'diagnosis_id')
    );

  -- Confirmar 0 índices pre-existentes sobre las 7 columnas objetivo
  SELECT COUNT(*) INTO idx_count_pre
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'idx_appointments_service_id',
      'idx_clinic_invoices_patient_id',
      'idx_clinic_invoices_therapist_id',
      'idx_clinical_history_diagnosis_id',
      'idx_clinical_history_entry_type',
      'idx_commissions_sale_id',
      'idx_commissions_therapist_id'
    );

  IF fk_count_pre <> 7 THEN
    RAISE EXCEPTION
      'Pre-check FAIL: esperaba 7 FKs vigentes, encontré %. Revisar pg_constraint antes de re-correr.',
      fk_count_pre;
  END IF;

  IF idx_count_pre <> 0 THEN
    RAISE EXCEPTION
      'Pre-check FAIL: esperaba 0 índices pre-existentes con los nombres objetivo, encontré %. Revisar pg_indexes antes de re-correr.',
      idx_count_pre;
  END IF;

  RAISE NOTICE
    'Pre-check OK — 7 FKs vigentes, 0 índices pre-existentes con nombres objetivo';
END $$;

-- ══════════════════════════════════════════════════════════════
-- CREATE INDEX × 7 (btree default, IF NOT EXISTS defense-in-depth)
-- Orden alfabético para trazabilidad
-- ══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_appointments_service_id
  ON public.appointments (service_id);

CREATE INDEX IF NOT EXISTS idx_clinic_invoices_patient_id
  ON public.clinic_invoices (patient_id);

CREATE INDEX IF NOT EXISTS idx_clinic_invoices_therapist_id
  ON public.clinic_invoices (therapist_id);

CREATE INDEX IF NOT EXISTS idx_clinical_history_diagnosis_id
  ON public.clinical_history (diagnosis_id);

CREATE INDEX IF NOT EXISTS idx_clinical_history_entry_type
  ON public.clinical_history (entry_type);

CREATE INDEX IF NOT EXISTS idx_commissions_sale_id
  ON public.commissions (sale_id);

CREATE INDEX IF NOT EXISTS idx_commissions_therapist_id
  ON public.commissions (therapist_id);

-- ══════════════════════════════════════════════════════════════
-- Post-check: confirmar 7 índices creados + 7 FKs intactos
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  idx_count_post INT;
  fk_count_post  INT;
BEGIN
  SELECT COUNT(*) INTO idx_count_post
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'idx_appointments_service_id',
      'idx_clinic_invoices_patient_id',
      'idx_clinic_invoices_therapist_id',
      'idx_clinical_history_diagnosis_id',
      'idx_clinical_history_entry_type',
      'idx_commissions_sale_id',
      'idx_commissions_therapist_id'
    );

  SELECT COUNT(*) INTO fk_count_post
  FROM pg_constraint c
  JOIN pg_class cl       ON cl.oid = c.conrelid
  JOIN pg_attribute a    ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.contype = 'f'
    AND cl.relnamespace = 'public'::regnamespace
    AND (
      (cl.relname = 'appointments'     AND a.attname = 'service_id')     OR
      (cl.relname = 'commissions'      AND a.attname = 'therapist_id')   OR
      (cl.relname = 'commissions'      AND a.attname = 'sale_id')        OR
      (cl.relname = 'clinic_invoices'  AND a.attname = 'patient_id')     OR
      (cl.relname = 'clinic_invoices'  AND a.attname = 'therapist_id')   OR
      (cl.relname = 'clinical_history' AND a.attname = 'entry_type')     OR
      (cl.relname = 'clinical_history' AND a.attname = 'diagnosis_id')
    );

  IF idx_count_post <> 7 THEN
    RAISE EXCEPTION
      'Post-check FAIL: esperaba 7 índices creados, encontré %. Revisar pg_indexes.',
      idx_count_post;
  END IF;

  IF fk_count_post <> 7 THEN
    RAISE EXCEPTION
      'Post-check FAIL: esperaba 7 FKs intactos, encontré %. Algún FK mutó durante el apply.',
      fk_count_post;
  END IF;

  RAISE NOTICE
    'Post-check OK — 7 índices btree creados, 7 FKs intactos. Migration cerrada.';
END $$;

-- ══════════════════════════════════════════════════════════════
-- Rollback (NO ejecutar, solo referencia)
-- ══════════════════════════════════════════════════════════════
-- DROP INDEX IF EXISTS public.idx_appointments_service_id;
-- DROP INDEX IF EXISTS public.idx_clinic_invoices_patient_id;
-- DROP INDEX IF EXISTS public.idx_clinic_invoices_therapist_id;
-- DROP INDEX IF EXISTS public.idx_clinical_history_diagnosis_id;
-- DROP INDEX IF EXISTS public.idx_clinical_history_entry_type;
-- DROP INDEX IF EXISTS public.idx_commissions_sale_id;
-- DROP INDEX IF EXISTS public.idx_commissions_therapist_id;
