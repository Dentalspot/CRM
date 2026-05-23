-- ============================================================
-- Feature: Restringir gestión de availabilities a clínicas propias
-- ============================================================
-- Solicitud del founder (sesión 2026-05-22): cuando un dentista trabaja
-- como INVITADO en una clínica ajena, no debería poder modificar sus
-- propios horarios — solo el clinic_admin de esa clínica asigna los
-- horarios del equipo. Esto asegura coherencia operativa de la clínica
-- (el dueño define cuándo abre, qué horarios cubre cada dentista).
--
-- Antes: la policy "Therapists can manage own availability" permitía al
-- dentista CRUD sobre cualquier row donde therapist_id = auth.uid(),
-- sin importar de qué clínica era. Eso le permitía cambiar horarios en
-- clínicas donde es solo invitado.
--
-- Ahora: el dentista solo puede CRUD en availabilities cuyo clinic_id
-- corresponda a una clínica de la que ES DUEÑO (clinics.therapist_id =
-- auth.uid()). Para clínicas invitadas, queda read-only — la edición
-- queda exclusiva del clinic_admin via policy
-- availabilities_clinic_admin_manage (que ya existía).
--
-- Casos cubiertos:
--   - Dentista en su consulta personal o clínica propia: edita normal
--   - Dentista invitado a Clínica X: NO puede tocar sus horarios ahí
--   - Clinic_admin de Clínica X: puede gestionar horarios de cualquier
--     dentista activo en su org (sin cambios)
--   - SELECT público sigue funcionando (policy "Public can view")
-- ============================================================

DROP POLICY IF EXISTS "Therapists can manage own availability"
  ON "public"."therapist_availabilities";

CREATE POLICY "Therapists can manage own availability"
  ON "public"."therapist_availabilities"
  FOR ALL
  USING (
    "auth"."uid"() = "therapist_id"
    AND "clinic_id" IN (
      SELECT "id" FROM "public"."clinics"
      WHERE "therapist_id" = "auth"."uid"()
    )
  )
  WITH CHECK (
    "auth"."uid"() = "therapist_id"
    AND "clinic_id" IN (
      SELECT "id" FROM "public"."clinics"
      WHERE "therapist_id" = "auth"."uid"()
    )
  );

COMMENT ON POLICY "Therapists can manage own availability"
  ON "public"."therapist_availabilities"
  IS 'El dentista solo puede CRUD availabilities en clínicas donde es DUEÑO (clinics.therapist_id = auth.uid()). En clínicas donde es invitado, los horarios los gestiona el clinic_admin via policy availabilities_clinic_admin_manage. Cambio del 2026-05-22.';
