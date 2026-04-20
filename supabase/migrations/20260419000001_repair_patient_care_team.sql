-- ============================================================
-- Fix P0 — spec 003 (fix-audit-log-silent)
--
-- Reparar la sincronización de patient_care_team con patients para
-- restaurar la escritura de clinical_audit_log.
--
-- CONTEXTO Y CAUSA RAÍZ
-- -----------------------------------------------------------
-- La tabla clinical_audit_log no recibe escrituras desde
-- 2026-04-18 06:57 UTC. El logger frontend (src/lib/audit/*) está
-- correcto: invoca supabase.from('clinical_audit_log').insert(...)
-- con payload válido. La falla está en la policy RLS cal_dentist_insert
-- (migración 20260416000001_rls_phase3_compliance.sql:19-23), que
-- exige is_in_care_team(patient_id). Esa función (definida en
-- 20260415100007_rls_phase1_administrative.sql:33-46) consulta
-- la tabla patient_care_team, que fue poblada una sola vez en el
-- backfill del 15-abr (20260415100002_populate_organization_model.sql:
-- 220-241) y nunca más. Ningún trigger la mantiene sincronizada
-- con patients.therapist_id / organization_id.
--
-- Consecuencia: cualquier paciente creado o reasignado después del
-- 15-abr queda fuera del care_team efectivo → is_in_care_team
-- devuelve false → la policy RLS rechaza el INSERT al log
-- silenciosamente (console.warn solo en DEV, silent fail en PROD).
--
-- VENTANA DE COMPLIANCE VIOLADA
-- -----------------------------------------------------------
-- Constitution III (Append-Only Clinical Audit) y Ley 21.719 ARCO
-- violadas desde 2026-04-18 06:57 UTC hasta el timestamp de apply
-- de esta migración.
--
-- ESTA MIGRACIÓN NO FABRICA ENTRADAS RETROACTIVAS EN CLINICAL_AUDIT_LOG.
-- SC-005 de la spec 003: append-only es inviolable; los accesos
-- perdidos en la ventana 18-abr → fix son estructuralmente irrecuperables.
-- La brecha queda documentada aquí y en el commit de cierre de spec 003.
--
-- QUE HACE ESTA MIGRACION
-- -----------------------------------------------------------
-- A) Backfill reparador idempotente de patient_care_team: agrega
--    las filas primary/active que el backfill one-shot del 15-abr
--    no cubrió, respetando las 3 condiciones originales
--    (organization_id + therapist_id + dentista miembro activo de la org).
--    ON CONFLICT DO NOTHING evita duplicados sobre el índice único
--    parcial idx_pct_unique_dentist_active.
--
-- B) Trigger sync_patient_care_team: mantiene patient_care_team
--    sincronizado con patients en adelante (AFTER INSERT y AFTER
--    UPDATE OF therapist_id, organization_id).
--
-- QUE NO HACE
-- -----------------------------------------------------------
-- - NO relaja ninguna policy RLS (FR-005). cal_dentist_insert sigue
--   exigiendo is_org_member + is_in_care_team sin fallback.
-- - NO toca los triggers append-only trg_audit_log_no_update /
--   trg_audit_log_no_delete de clinical_audit_log (FR-007).
-- - NO modifica la función is_in_care_team ni la tabla patients.
-- - NO toca clinical_access_log (tabla distinta, módulo clinical-passport).
-- - NO toca frontend (hook + logger permanecen correctos).
--
-- REFERENCIAS
-- -----------------------------------------------------------
-- Spec 003: specs/003-fix-audit-log-silent/spec.md
-- Plan 003: specs/003-fix-audit-log-silent/plan.md
-- Spec 001 (bloqueada por este fix): commit dd7f02c en origin/main
-- Policy rechazando: supabase/migrations/20260416000001_rls_phase3_compliance.sql:19-23
-- Función consultada: supabase/migrations/20260415100007_rls_phase1_administrative.sql:33-46
-- Backfill one-shot original: supabase/migrations/20260415100002_populate_organization_model.sql:220-241
--
-- ROLLBACK
-- -----------------------------------------------------------
-- DROP TRIGGER IF EXISTS trg_sync_patient_care_team_insert ON public.patients;
-- DROP TRIGGER IF EXISTS trg_sync_patient_care_team_update ON public.patients;
-- DROP FUNCTION IF EXISTS public.sync_patient_care_team();
-- (Las filas insertadas en patient_care_team por la sección A son
--  datos legítimos y no se revierten automáticamente.)
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- A. Backfill reparador (idempotente)
-- ──────────────────────────────────────────────────────────────
-- Misma semántica que el backfill one-shot del 15-abr, pero agregando
-- filtro NOT EXISTS para evitar re-insertar filas que ya están activas.
-- ON CONFLICT DO NOTHING protege contra el índice único parcial
-- idx_pct_unique_dentist_active ON (patient_id, dentist_id) WHERE is_active = true.
INSERT INTO public.patient_care_team
    (patient_id, dentist_id, organization_id, role, is_active, assigned_at)
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
  )
  AND NOT EXISTS (
      SELECT 1 FROM public.patient_care_team pct
      WHERE pct.patient_id = p.id
        AND pct.dentist_id = p.therapist_id
        AND pct.is_active = true
  )
ON CONFLICT DO NOTHING;


-- ──────────────────────────────────────────────────────────────
-- B. Trigger: sincronizar patient_care_team con patients
-- ──────────────────────────────────────────────────────────────
-- SECURITY DEFINER para que el INSERT pueda correr con privilegios
-- del owner (bypass de RLS pct_admin_manage que exige clinic_admin).
-- El gate de membership dentro de la función preserva el design intent:
-- solo se crean filas para (paciente, dentista) con membership válida.
CREATE OR REPLACE FUNCTION public.sync_patient_care_team()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Sin therapist_id u organization_id, no hay care_team que crear.
    IF NEW.therapist_id IS NULL OR NEW.organization_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Gate de membership: el dentista debe ser miembro activo de la org
    -- del paciente. Replica la condición del backfill one-shot del 15-abr
    -- para mantener consistencia con el criterio original.
    IF NOT EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id
          AND om.user_id = NEW.therapist_id
          AND om.role = 'dentist'
          AND om.is_active = true
    ) THEN
        RETURN NEW;
    END IF;

    -- INSERT idempotente. Si ya existe fila activa para (patient, dentist),
    -- el índice único parcial idx_pct_unique_dentist_active la deja pasar
    -- via ON CONFLICT DO NOTHING. Nunca duplica.
    INSERT INTO public.patient_care_team
        (patient_id, dentist_id, organization_id, role, is_active, assigned_at)
    VALUES (
        NEW.id,
        NEW.therapist_id,
        NEW.organization_id,
        'primary',
        true,
        now()
    )
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_patient_care_team() IS
  'Mantiene patient_care_team sincronizado con patients (therapist_id + organization_id). Instalada 2026-04-19 por spec 003 para cerrar la brecha de compliance Constitution III / Ley 21.719 ARCO abierta el 2026-04-18 06:57 UTC.';


-- Trigger AFTER INSERT: poblar care_team cuando se crea un paciente nuevo
-- con therapist_id + organization_id válidos.
DROP TRIGGER IF EXISTS trg_sync_patient_care_team_insert ON public.patients;
CREATE TRIGGER trg_sync_patient_care_team_insert
    AFTER INSERT ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.sync_patient_care_team();


-- Trigger AFTER UPDATE condicional: repoblar care_team cuando cambia
-- therapist_id o organization_id. No desactiva filas anteriores — esa
-- lógica es scope de una spec futura (care-team-deactivation-on-reassign).
DROP TRIGGER IF EXISTS trg_sync_patient_care_team_update ON public.patients;
CREATE TRIGGER trg_sync_patient_care_team_update
    AFTER UPDATE OF therapist_id, organization_id ON public.patients
    FOR EACH ROW
    WHEN (
        (OLD.therapist_id IS DISTINCT FROM NEW.therapist_id)
        OR (OLD.organization_id IS DISTINCT FROM NEW.organization_id)
    )
    EXECUTE FUNCTION public.sync_patient_care_team();
