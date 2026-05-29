-- ============================================================
-- Spec 028: Appointment Dentist Assignment
-- ============================================================
-- 1. Trigger: valida que appointments.therapist_id corresponde a un
--    dentista activo de la misma organization_id (FR-002, FR-022).
-- 2. RLS appt_dentist_update: agrega WITH CHECK (FR-021).
-- 3. clinical_audit_log: amplía CHECK action y resource_type para
--    aceptar vocabulario de appointments (FR-016, FR-017).
--
-- Cierra incidentalmente un bug pre-existente: los inserts del módulo
-- asistente (spec 024) usaban action='view'/'create'/'update'/'cancel'
-- y resource_type='appointment' — todos fuera del CHECK histórico —
-- por lo que los audit logs caían silenciosamente. La migration los
-- habilita sin refactorizar call sites.
--
-- Sin cambios destructivos. Sin backfill (therapist_id es NOT NULL
-- desde el baseline). Reversible.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Trigger de validación de dentista vs organización
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_appointment_dentist()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Citas legacy sin org_id (caso teórico, no presente en prod):
  -- tolerar para no romper data histórica. La regla se enforza
  -- una vez la cita tenga org.
  IF NEW.organization_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Validar: el therapist_id es dentista activo de la misma org
  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = NEW.therapist_id
      AND om.organization_id = NEW.organization_id
      AND om.role = 'dentist'
      AND om.is_active = true
  ) THEN
    RAISE EXCEPTION
      'dentist_not_active_in_org: el usuario % no es dentista activo de la org %',
      NEW.therapist_id, NEW.organization_id
      USING HINT = 'Solo se pueden asignar citas a dentistas activos de la misma organización.';
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_check_appointment_dentist ON public.appointments;
CREATE TRIGGER trg_check_appointment_dentist
  BEFORE INSERT OR UPDATE OF therapist_id, organization_id
  ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_appointment_dentist();

COMMENT ON FUNCTION public.check_appointment_dentist() IS
  'Spec 028 FR-002, FR-022: bloquea asignar therapist_id que no es dentista activo de la misma organization_id. Defense in depth complementario a las RLS policies.';


-- ──────────────────────────────────────────────────────────────
-- 2. Refuerzo de RLS appt_dentist_update con WITH CHECK
-- ──────────────────────────────────────────────────────────────
-- ANTES: USING permitía ver/modificar SUS citas, pero sin WITH CHECK
-- el dentista podía reasignar a cualquier uuid (incluso patient_id
-- o dentista de otra org). El trigger (#1) cierra el caso cross-org,
-- pero confirmar en RLS además es defense in depth + más rápido.
--
-- DESPUÉS: USING igual (caller debe ser el dueño actual), WITH CHECK
-- exige que la cita siga siendo de una org donde el caller es dentista
-- (impide reasignar la cita a otra org).
DROP POLICY IF EXISTS appt_dentist_update ON public.appointments;

CREATE POLICY appt_dentist_update ON public.appointments
  FOR UPDATE
  USING (
    is_org_member(organization_id, 'dentist')
    AND therapist_id = auth.uid()
  )
  WITH CHECK (
    is_org_member(organization_id, 'dentist')
  );


-- ──────────────────────────────────────────────────────────────
-- 3. Amplía CHECK clinical_audit_log.action
-- ──────────────────────────────────────────────────────────────
-- Vocabulario nuevo:
--   - 'view', 'create', 'update', 'cancel': usados por
--     AssistantAppointmentModal (spec 024) y por AppointmentModal
--     (spec 028). Estos inserts venían fallando en CHECK.
--   - 'appointment_reassigned': nuevo de spec 028 FR-017 — registro
--     dedicado cuando cambia el dentista responsable de una cita.
ALTER TABLE public.clinical_audit_log
  DROP CONSTRAINT IF EXISTS clinical_audit_log_action_check;

ALTER TABLE public.clinical_audit_log
  ADD CONSTRAINT clinical_audit_log_action_check
  CHECK (action IN (
    'view_record', 'edit_record', 'create_record',
    'export_file', 'print_record',
    'grant_exceptional_access', 'exceptional_access',
    'view', 'create', 'update', 'cancel',
    'appointment_reassigned'
  ));


-- ──────────────────────────────────────────────────────────────
-- 4. Amplía CHECK clinical_audit_log.resource_type
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.clinical_audit_log
  DROP CONSTRAINT IF EXISTS clinical_audit_log_resource_type_check;

ALTER TABLE public.clinical_audit_log
  ADD CONSTRAINT clinical_audit_log_resource_type_check
  CHECK (resource_type IN (
    'clinical_record', 'clinical_entry', 'odontogram',
    'diagnosis', 'document', 'full_file',
    'appointment'
  ));
