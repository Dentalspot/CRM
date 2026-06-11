-- ============================================================
-- Spec 030 Bloque 4: paciente NO ve notas profesionales privadas
-- ============================================================
-- Antes:
--   policy ch_patient_select: is_own_patient(patient_id)
--   → el paciente lee TODAS sus rows de clinical_history, incluyendo
--   las que el dentista marcó como is_professional_only=true.
--
-- Despues:
--   policy ch_patient_select: is_own_patient(patient_id) AND
--                              COALESCE(is_professional_only, false) = false
--   → defensa en profundidad real a nivel RLS. Si el dentista guarda una nota
--   con is_professional_only=true, el paciente NO la ve aunque haga SELECT *.
--   El frontend tiene una sola fuente de verdad: la policy.
--
-- Cumple Ley 20.584 Art. 12 (separacion ficha clinica vs informacion al paciente)
-- y Ley 21.719 (minimizacion de exposicion de datos sensibles).
-- ============================================================

DROP POLICY IF EXISTS ch_patient_select ON public.clinical_history;

CREATE POLICY ch_patient_select
  ON public.clinical_history FOR SELECT
  USING (
    is_own_patient(patient_id)
    AND COALESCE(is_professional_only, false) = false
  );

COMMENT ON POLICY ch_patient_select ON public.clinical_history IS
  'Spec 030 Bloque 4: paciente solo ve rows con is_professional_only=false (o NULL). Rows marcadas como nota privada profesional quedan ocultas a nivel RLS, no por filtro de frontend.';
