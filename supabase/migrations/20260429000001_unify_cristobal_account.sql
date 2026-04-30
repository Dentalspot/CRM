-- ============================================================
-- Data fix: Unificar la cuenta de Cristobal (Opción 1)
-- ============================================================
-- Contexto: Cristobal tenía 2 cuentas (dentista + clínica admin).
-- Unificamos a la cuenta dentista, dándole también rol clinic_admin
-- en la organización Alamos. Desactivamos la cuenta legacy.
--
-- Org: 0d07b61c-cb45-4bd8-97f7-ec4c82ba80ec (Odontología Los Álamos)
-- Cuenta dentista (mantener): b269000f-6f36-4034-82ef-ae035ffed12d
-- Cuenta admin legacy (desactivar): 149325b2-88bb-49f6-81e2-7a97fe422127
-- ============================================================

-- 1) Cuenta dentista ahora también es clinic_admin
INSERT INTO public.organization_members (organization_id, user_id, role, is_active)
VALUES (
  '0d07b61c-cb45-4bd8-97f7-ec4c82ba80ec',
  'b269000f-6f36-4034-82ef-ae035ffed12d',
  'clinic_admin',
  true
)
ON CONFLICT (organization_id, user_id, role) DO UPDATE SET is_active = true;

-- 2) Crear row en `clinics` para Alamos (necesario para queries de pacientes)
INSERT INTO public.clinics (
  name, organization_id, therapist_id, is_active, type
)
SELECT
  'Odontología Los Álamos',
  '0d07b61c-cb45-4bd8-97f7-ec4c82ba80ec',
  'b269000f-6f36-4034-82ef-ae035ffed12d',
  true,
  'consulta_privada'
WHERE NOT EXISTS (
  SELECT 1 FROM public.clinics
  WHERE organization_id = '0d07b61c-cb45-4bd8-97f7-ec4c82ba80ec'
);

-- 3) Vincular dentista a esa clínica via clinic_therapists
INSERT INTO public.clinic_therapists (
  clinic_id, therapist_id, is_active, commission_percent
)
SELECT c.id, 'b269000f-6f36-4034-82ef-ae035ffed12d', true, 0
FROM public.clinics c
WHERE c.organization_id = '0d07b61c-cb45-4bd8-97f7-ec4c82ba80ec'
ON CONFLICT DO NOTHING;

-- 4) Desactivar cuenta legacy en organization_members (soft delete)
UPDATE public.organization_members
SET is_active = false
WHERE user_id = '149325b2-88bb-49f6-81e2-7a97fe422127'
  AND organization_id = '0d07b61c-cb45-4bd8-97f7-ec4c82ba80ec';
