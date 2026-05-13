-- ============================================================
-- B11 fix: dual role para dueño de clínica que es a la vez dentista
-- ============================================================
-- Bug: el trigger auto_create_organization_for_clinic (que dispara al crear
-- una clínica via wizard "Mi Clínica") registraba al dueño solo como
-- 'clinic_admin' en organization_members. Pero las policies RLS de
-- patients (pat_dentist_insert), patient_care_team (pct_dentist_insert),
-- payments (pp_dentist_select), etc. exigen is_org_member(org, 'dentist').
--
-- Resultado: un dentista solo dueño de su clínica completaba el wizard,
-- pero seguía sin poder crear pacientes ("violates row-level security
-- policy for table 'patients'") porque no aparecía como 'dentist' en
-- su propia org — solo como 'clinic_admin'.
--
-- Fix:
--   1) Actualizar el trigger para crear AMBOS roles cuando el dueño es
--      profile.role='therapist': 'clinic_admin' (es admin de su clínica)
--      + 'dentist' (es el tratante). Si el dueño es 'clinic' (empresa
--      con admin no-dentista), sigue solo como 'clinic_admin'.
--
--   2) Backfill: agregar rol 'dentist' a todos los clinic_admin activos
--      que tienen profile.role='therapist'. Cubre usuarios B11b que ya
--      completaron el wizard pero quedaron tuertos.
--
-- NO cubre B11a (dentistas que NO completaron el wizard "Mi Clínica" y
-- por ende no tienen clinic ni org). Eso es UX gap separado (gate al
-- login o forzar wizard) — micro-bloque aparte.
-- ============================================================

-- 1) Trigger actualizado
CREATE OR REPLACE FUNCTION public.auto_create_organization_for_clinic()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_org_id uuid;
  v_owner_profile_role text;
BEGIN
  IF NEW.organization_id IS NULL THEN
    INSERT INTO public.organizations (name, type, legal_entity_type, legal_name, is_active)
    VALUES (
      COALESCE(NEW.name, 'Clínica sin nombre'),
      'clinic',
      'persona_natural',
      COALESCE(NEW.name, 'Clínica sin nombre'),
      true
    )
    RETURNING id INTO v_org_id;

    NEW.organization_id := v_org_id;

    IF NEW.therapist_id IS NOT NULL THEN
      -- Resolver el role del profile del dueño para decidir si también es dentist
      SELECT role::text INTO v_owner_profile_role
      FROM public.profiles
      WHERE id = NEW.therapist_id;

      -- Siempre clinic_admin (es el dueño legal de la clínica)
      INSERT INTO public.organization_members (organization_id, user_id, role, is_active)
      VALUES (v_org_id, NEW.therapist_id, 'clinic_admin', true)
      ON CONFLICT (organization_id, user_id, role) DO NOTHING;

      -- Si el dueño además es un dentista (role='therapist'), agregar rol 'dentist'
      -- para que pase las RLS de patients/care_team/payments.
      IF v_owner_profile_role = 'therapist' THEN
        INSERT INTO public.organization_members (organization_id, user_id, role, is_active)
        VALUES (v_org_id, NEW.therapist_id, 'dentist', true)
        ON CONFLICT (organization_id, user_id, role) DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $function$;

-- 2) Backfill: rescatar a usuarios clinic_admin que también son dentistas
INSERT INTO public.organization_members (organization_id, user_id, role, is_active)
SELECT
  om.organization_id,
  om.user_id,
  'dentist',
  true
FROM public.organization_members om
JOIN public.profiles p ON p.id = om.user_id
WHERE om.role = 'clinic_admin'
  AND om.is_active = true
  AND p.role::text = 'therapist'
ON CONFLICT (organization_id, user_id, role) DO NOTHING;
