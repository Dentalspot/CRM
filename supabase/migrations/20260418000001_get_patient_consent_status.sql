-- =============================================================================
-- Funcion: public.get_patient_consent_status(p_patient_id uuid)
-- =============================================================================
-- Expone al dentista tratante (y a platform_admin) el estado real de
-- consentimiento clinico del paciente, derivado de legal_signatures, sin
-- abrir lectura directa a esa tabla.
--
-- Contexto:
-- - El paciente firma desde su portal mediante useClinicalConsent.signConsent,
--   que inserta en legal_signatures correctamente, pero el UPDATE silencioso
--   a patients.clinical_consent_signed no persiste (rol patient no tiene
--   UPDATE sobre patients en el modelo Phase 1).
-- - El frontend del dentista lee patients.clinical_consent_signed y por eso
--   muestra "Pendiente" aunque el paciente haya firmado.
-- - La policy actual sobre legal_signatures (Users read own signatures) no
--   permite al dentista ver firmas del paciente.
-- - Esta funcion expone la proyeccion minima necesaria { signed, signed_at }
--   con autorizacion explicita.
--
-- Inferencia segura del paciente clinico:
--   patients.profile_id = auth.users.id = legal_signatures.user_id
-- No requiere agregar columnas al modelo.
--
-- Vigencia de la firma:
--   se considera firmada solo si la version firmada coincide con la version
--   publicada actual del documento (slug='consentimiento-clinico'). Si el doc
--   cambia de version, las firmas obsoletas dejan de contar. Coherente con
--   useClinicalConsent.checkConsent del frontend.
--
-- Autorizacion (decision conservadora inicial):
--   - dentista en care_team del paciente (is_in_care_team)
--   - platform_admin (is_admin)
--   NO incluye clinic_admin para reducir superficie. Extender con
--   `OR is_org_member(<org>, 'clinic_admin')` si producto lo requiere
--   posteriormente; es cambio aditivo sin breaking change.
--
-- Reversible:
--   REVOKE EXECUTE ON FUNCTION public.get_patient_consent_status(uuid) FROM authenticated;
--   DROP FUNCTION IF EXISTS public.get_patient_consent_status(uuid);
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_patient_consent_status(p_patient_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile_id  uuid;
  v_authorized  boolean;
  v_signed_at   timestamptz;
BEGIN
  -- Lookup minimo del paciente. profile_id es el puente con
  -- legal_signatures.user_id.
  SELECT p.profile_id
    INTO v_profile_id
  FROM public.patients p
  WHERE p.id = p_patient_id;

  -- Paciente inexistente o sin profile_id asociado: no distinguimos para
  -- evitar leakage de existencia. NULL como respuesta neutra.
  IF v_profile_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Autorizacion: dentista del care_team o platform_admin.
  v_authorized :=
    public.is_in_care_team(p_patient_id)
    OR public.is_admin();

  IF NOT v_authorized THEN
    RETURN NULL;
  END IF;

  -- Firma mas reciente del paciente para la version publicada vigente
  -- del documento de consentimiento clinico.
  SELECT max(ls.accepted_at)
    INTO v_signed_at
  FROM public.legal_signatures ls
  JOIN public.legal_documents ld
    ON ld.id = ls.document_id
   AND ls.document_version = ld.version
  WHERE ls.user_id = v_profile_id
    AND ld.slug = 'consentimiento-clinico'
    AND ld.status = 'published';

  RETURN jsonb_build_object(
    'signed',    v_signed_at IS NOT NULL,
    'signed_at', v_signed_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_patient_consent_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_patient_consent_status(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_patient_consent_status(uuid) IS
  'Devuelve { signed, signed_at } para el consentimiento clinico vigente del paciente. Autorizado para dentista del care_team y platform_admin. NULL si el caller no esta autorizado o el paciente no existe. Deriva de legal_signatures, no usa patients.clinical_consent_signed (obsoleto en Phase 1).';
