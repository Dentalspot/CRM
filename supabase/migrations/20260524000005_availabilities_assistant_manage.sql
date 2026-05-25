-- Feature: la asistente también gestiona la disponibilidad del equipo.
--
-- Contexto (decisión founder 2026-05-24): el control de horarios del dentista
-- lo tienen el clinic_admin Y la asistente. El dentista invitado queda
-- read-only en clínicas ajenas (ya cubierto por migration 20260522000005).
--
-- Estado previo:
--   - "Therapists can manage own availability" → dentista en clínicas propias
--   - "availabilities_clinic_admin_manage" → clinic_admin de la org
--   - (faltaba) → assistant de la org
--
-- Compliance: la disponibilidad/horario es dato OPERATIVO, no PHI clínica.
-- Que la asistente lo gestione no toca Ley 20.584/21.719 (no es ficha del
-- paciente). El hardening del rol assistant sobre datos CLÍNICOS (tabla
-- patients) es un tema separado (deuda en data-compliance.md línea 122).
--
-- Patrón idéntico a availabilities_clinic_admin_manage pero role='assistant'.

DROP POLICY IF EXISTS "availabilities_assistant_manage"
  ON "public"."therapist_availabilities";

CREATE POLICY "availabilities_assistant_manage"
  ON "public"."therapist_availabilities"
  FOR ALL
  USING (
    clinic_id IN (
      SELECT c.id
      FROM clinics c
      WHERE c.organization_id IN (
        SELECT om.organization_id
        FROM organization_members om
        WHERE om.user_id = auth.uid()
          AND om.role = 'assistant'
          AND om.is_active = true
      )
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT c.id
      FROM clinics c
      WHERE c.organization_id IN (
        SELECT om.organization_id
        FROM organization_members om
        WHERE om.user_id = auth.uid()
          AND om.role = 'assistant'
          AND om.is_active = true
      )
    )
  );

COMMENT ON POLICY "availabilities_assistant_manage"
  ON "public"."therapist_availabilities"
  IS 'La asistente gestiona la disponibilidad de cualquier dentista activo en su org (mismo patrón que clinic_admin). Disponibilidad = dato operativo, no PHI. Decisión founder 2026-05-24.';
