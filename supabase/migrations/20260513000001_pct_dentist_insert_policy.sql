-- ============================================================
-- B12 fix: policy INSERT en patient_care_team para role 'dentist'
-- ============================================================
-- Antes solo pct_admin_manage (clinic_admin) permitía INSERT, lo que
-- bloqueaba el flow estándar de createPatientAccount cuando un dentista
-- crea paciente para sí: ensurePrimaryCareTeam fallaba con RLS error
-- (descubierto en smoke P0 #3 password aleatoria, 2026-05-13) y el
-- paciente quedaba sin "Equipo Tratante" en su dashboard del paciente.
--
-- Diseño:
--   - Check estricto: solo permite crear care_team donde dentist_id = auth.uid().
--     Esto refleja la realidad del flow: el dentista se agrega a sí mismo como
--     tratante primario al crear un paciente.
--   - Caso "asignar OTRO dentista como tratante" sigue cubierto por
--     pct_admin_manage (clinic_admin) — un dentista solo no debería
--     poder asignar arbitrariamente a sus colegas; ese caso es del admin.
--   - El SELECT pct_dentist_select ya existía y filtra por is_in_care_team.
-- ============================================================

CREATE POLICY pct_dentist_insert ON public.patient_care_team
  FOR INSERT
  WITH CHECK (
    is_org_member(organization_id, 'dentist')
    AND dentist_id = auth.uid()
  );

-- Nota: si en el futuro el asistente necesita crear care_team (hoy no lo hace
-- en ningún flow; solo el clinic_admin y el dentista mismo), agregar una
-- policy pct_assistant_insert análoga.
