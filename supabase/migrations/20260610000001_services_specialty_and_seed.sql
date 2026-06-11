-- ============================================================
-- Servicios odontologicos: specialty column + RLS clinic-scoped + seed FONASA
-- ============================================================
-- services.clinic_id apunta a public.clinics(id) (NO a organizations).
-- clinics.organization_id apunta a public.organizations(id) y por ahi entra el join
-- a organization_members.
--
-- Antes:
--   - services tenia name/price/duration_minutes pero sin categorizacion clinica
--   - RLS rota: "Allow public read" filtraba solo por is_active=true (riesgo PHI)
--   - INSERT sin policy (insertable solo via service_role)
--   - UPDATE/DELETE scoped por therapist_id (no por clinic)
--
-- Despues:
--   - services.specialty (text con CHECK 15 especialidades odontologicas)
--   - RLS clinic-scoped via clinics.organization_id → organization_members
--   - INSERT/UPDATE/DELETE restringido a dentist + clinic_admin
--   - Seed ~42 prestaciones FONASA tipicas para TODA clinica existente
--   - Trigger ON INSERT clinics → seed automatico para clinicas nuevas
-- ============================================================

-- ============================================================
-- 1. Columna specialty con CHECK constraint
-- ============================================================

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS specialty text;

ALTER TABLE public.services
  DROP CONSTRAINT IF EXISTS services_specialty_check;

ALTER TABLE public.services
  ADD CONSTRAINT services_specialty_check
  CHECK (specialty IS NULL OR specialty IN (
    'operatoria',
    'endodoncia',
    'periodoncia',
    'cirugia_oral',
    'ortodoncia',
    'odontopediatria',
    'estetica',
    'implantologia',
    'protesis_fija',
    'protesis_removible',
    'rehabilitacion_oral',
    'prevencion',
    'radiologia',
    'patologia_oral',
    'otros'
  ));

CREATE INDEX IF NOT EXISTS idx_services_clinic_specialty
  ON public.services (clinic_id, specialty)
  WHERE is_active = true;

COMMENT ON COLUMN public.services.specialty IS
  'Especialidad odontologica del servicio. Usado para agrupar en UI del catalogo de la clinica.';

-- ============================================================
-- 2. Reset RLS policies (las viejas estaban rotas para odontologia)
-- ============================================================

DROP POLICY IF EXISTS "Allow public read access to active services" ON public.services;
DROP POLICY IF EXISTS "Allow insert for own services" ON public.services;
DROP POLICY IF EXISTS "Allow update and delete for own services" ON public.services;
DROP POLICY IF EXISTS services_org_member_select ON public.services;
DROP POLICY IF EXISTS services_dentist_admin_insert ON public.services;
DROP POLICY IF EXISTS services_dentist_admin_update ON public.services;
DROP POLICY IF EXISTS services_dentist_admin_delete ON public.services;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- SELECT: cualquier miembro activo de la org dueña de la clinica
CREATE POLICY services_org_member_select
  ON public.services FOR SELECT
  USING (
    clinic_id IN (
      SELECT c.id FROM public.clinics c
      JOIN public.organization_members om ON om.organization_id = c.organization_id
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

-- INSERT: solo dentist o clinic_admin
CREATE POLICY services_dentist_admin_insert
  ON public.services FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT c.id FROM public.clinics c
      JOIN public.organization_members om ON om.organization_id = c.organization_id
      WHERE om.user_id = auth.uid()
        AND om.is_active = true
        AND om.role IN ('dentist', 'clinic_admin')
    )
  );

-- UPDATE: misma regla
CREATE POLICY services_dentist_admin_update
  ON public.services FOR UPDATE
  USING (
    clinic_id IN (
      SELECT c.id FROM public.clinics c
      JOIN public.organization_members om ON om.organization_id = c.organization_id
      WHERE om.user_id = auth.uid()
        AND om.is_active = true
        AND om.role IN ('dentist', 'clinic_admin')
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT c.id FROM public.clinics c
      JOIN public.organization_members om ON om.organization_id = c.organization_id
      WHERE om.user_id = auth.uid()
        AND om.is_active = true
        AND om.role IN ('dentist', 'clinic_admin')
    )
  );

-- DELETE: misma regla
CREATE POLICY services_dentist_admin_delete
  ON public.services FOR DELETE
  USING (
    clinic_id IN (
      SELECT c.id FROM public.clinics c
      JOIN public.organization_members om ON om.organization_id = c.organization_id
      WHERE om.user_id = auth.uid()
        AND om.is_active = true
        AND om.role IN ('dentist', 'clinic_admin')
    )
  );

-- ============================================================
-- 3. Funcion seed: carga ~42 prestaciones FONASA en una clinica
-- ============================================================

CREATE OR REPLACE FUNCTION public.seed_clinic_dental_services(p_clinic_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing_count integer;
BEGIN
  -- Idempotencia: si la clinica ya tiene servicios, no re-seedear
  SELECT COUNT(*) INTO v_existing_count
  FROM public.services
  WHERE clinic_id = p_clinic_id;

  IF v_existing_count > 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.services (clinic_id, name, description, specialty, price, currency, duration_minutes, is_active) VALUES
  -- Prevencion (4)
  (p_clinic_id, 'Consulta inicial / Examen integral', 'Evaluacion clinica completa y plan de tratamiento', 'prevencion', 25000, 'CLP', 30, true),
  (p_clinic_id, 'Higiene oral y educacion', 'Instruccion de tecnica de cepillado y uso de hilo dental', 'prevencion', 18000, 'CLP', 30, true),
  (p_clinic_id, 'Aplicacion topica de fluor', 'Aplicacion preventiva de fluor en piezas dentarias', 'prevencion', 15000, 'CLP', 20, true),
  (p_clinic_id, 'Urgencia odontologica', 'Atencion de urgencia por dolor o trauma', 'prevencion', 35000, 'CLP', 45, true),

  -- Operatoria (3)
  (p_clinic_id, 'Obturacion composite anterior', 'Restauracion de pieza anterior con resina compuesta', 'operatoria', 32000, 'CLP', 45, true),
  (p_clinic_id, 'Obturacion composite posterior', 'Restauracion de pieza posterior con resina compuesta', 'operatoria', 38000, 'CLP', 60, true),
  (p_clinic_id, 'Pulpotomia', 'Remocion parcial de pulpa coronaria', 'operatoria', 45000, 'CLP', 60, true),

  -- Endodoncia (3)
  (p_clinic_id, 'Tratamiento endodontico unirradicular', 'Endodoncia en pieza de un conducto', 'endodoncia', 80000, 'CLP', 90, true),
  (p_clinic_id, 'Tratamiento endodontico birradicular', 'Endodoncia en pieza de dos conductos', 'endodoncia', 110000, 'CLP', 90, true),
  (p_clinic_id, 'Tratamiento endodontico multirradicular', 'Endodoncia en pieza de tres o mas conductos', 'endodoncia', 160000, 'CLP', 120, true),

  -- Periodoncia (3)
  (p_clinic_id, 'Destartraje supragingival', 'Remocion de calculo dental supragingival', 'periodoncia', 28000, 'CLP', 45, true),
  (p_clinic_id, 'Destartraje subgingival por cuadrante', 'Raspado y alisado radicular por cuadrante', 'periodoncia', 45000, 'CLP', 60, true),
  (p_clinic_id, 'Pulido coronario / Profilaxis', 'Limpieza y pulido de todas las piezas dentarias', 'periodoncia', 25000, 'CLP', 45, true),

  -- Cirugia oral (3)
  (p_clinic_id, 'Extraccion simple', 'Exodoncia de pieza erupcionada', 'cirugia_oral', 35000, 'CLP', 45, true),
  (p_clinic_id, 'Extraccion compleja (con osteotomia)', 'Exodoncia que requiere osteotomia o division radicular', 'cirugia_oral', 70000, 'CLP', 75, true),
  (p_clinic_id, 'Extraccion terceros molares (cordales)', 'Cirugia de tercer molar incluido', 'cirugia_oral', 150000, 'CLP', 90, true),

  -- Ortodoncia (3)
  (p_clinic_id, 'Consulta inicial ortodoncia', 'Evaluacion ortodoncica + plan de tratamiento', 'ortodoncia', 25000, 'CLP', 45, true),
  (p_clinic_id, 'Instalacion brackets metalicos (ambos arcos)', 'Colocacion de aparatologia fija superior e inferior', 'ortodoncia', 550000, 'CLP', 90, true),
  (p_clinic_id, 'Control mensual ortodoncia', 'Activacion de aparato y seguimiento', 'ortodoncia', 25000, 'CLP', 30, true),

  -- Odontopediatria (3)
  (p_clinic_id, 'Consulta inicial odontopediatria', 'Primera evaluacion en paciente pediatrico', 'odontopediatria', 28000, 'CLP', 45, true),
  (p_clinic_id, 'Sellantes (por pieza)', 'Aplicacion de sellante preventivo en molar', 'odontopediatria', 18000, 'CLP', 30, true),
  (p_clinic_id, 'Aplicacion de fluor en nino', 'Aplicacion de fluor barniz en paciente pediatrico', 'odontopediatria', 15000, 'CLP', 20, true),

  -- Estetica (3)
  (p_clinic_id, 'Blanqueamiento dental ambulatorio', 'Blanqueamiento con cubeta personalizada para uso domiciliario', 'estetica', 120000, 'CLP', 60, true),
  (p_clinic_id, 'Blanqueamiento dental in-office', 'Blanqueamiento profesional en sillon', 'estetica', 180000, 'CLP', 90, true),
  (p_clinic_id, 'Carilla composite directa', 'Carilla de resina directa por pieza', 'estetica', 80000, 'CLP', 90, true),

  -- Implantologia (3)
  (p_clinic_id, 'Cirugia implante unitario', 'Colocacion de implante dental unitario', 'implantologia', 800000, 'CLP', 90, true),
  (p_clinic_id, 'Pilar y corona sobre implante', 'Rehabilitacion protesica sobre implante', 'implantologia', 450000, 'CLP', 90, true),
  (p_clinic_id, 'Injerto oseo', 'Regeneracion osea para implante', 'implantologia', 350000, 'CLP', 90, true),

  -- Protesis fija (2)
  (p_clinic_id, 'Corona metal-porcelana', 'Corona ceramo-metalica unitaria', 'protesis_fija', 250000, 'CLP', 90, true),
  (p_clinic_id, 'Corona libre de metal (zirconio)', 'Corona de zirconio o disilicato', 'protesis_fija', 380000, 'CLP', 90, true),

  -- Protesis removible (2)
  (p_clinic_id, 'Protesis acrilica superior', 'Protesis removible total superior', 'protesis_removible', 280000, 'CLP', 90, true),
  (p_clinic_id, 'Protesis acrilica inferior', 'Protesis removible total inferior', 'protesis_removible', 280000, 'CLP', 90, true),

  -- Rehabilitacion oral (2)
  (p_clinic_id, 'Evaluacion rehabilitacion oral', 'Evaluacion integral para rehabilitacion compleja', 'rehabilitacion_oral', 45000, 'CLP', 60, true),
  (p_clinic_id, 'Plan de tratamiento integral', 'Diseno y entrega de plan multidisciplinario', 'rehabilitacion_oral', 50000, 'CLP', 60, true),

  -- Radiologia (3)
  (p_clinic_id, 'Radiografia periapical (1 pieza)', 'Radiografia intraoral periapical', 'radiologia', 8000, 'CLP', 15, true),
  (p_clinic_id, 'Radiografia bitewing', 'Radiografia interproximal', 'radiologia', 9000, 'CLP', 15, true),
  (p_clinic_id, 'Radiografia panoramica', 'Telerradiografia panoramica', 'radiologia', 35000, 'CLP', 20, true),

  -- Patologia oral (2)
  (p_clinic_id, 'Biopsia oral', 'Toma de muestra de tejido para estudio histopatologico', 'patologia_oral', 65000, 'CLP', 45, true),
  (p_clinic_id, 'Consulta patologia oral', 'Evaluacion de lesion de la mucosa oral', 'patologia_oral', 35000, 'CLP', 45, true),

  -- Otros (3)
  (p_clinic_id, 'Pulido y blanqueamiento de obturacion antigua', 'Recuperacion estetica de restauracion existente', 'otros', 22000, 'CLP', 30, true),
  (p_clinic_id, 'Ferulizacion dental', 'Ferula post-trauma o por movilidad dentaria', 'otros', 45000, 'CLP', 60, true),
  (p_clinic_id, 'Consulta general', 'Atencion clinica de motivo de consulta generico', 'otros', 25000, 'CLP', 30, true);

END;
$$;

COMMENT ON FUNCTION public.seed_clinic_dental_services IS
  'Carga ~42 prestaciones FONASA tipicas de odontologia en una clinica. Idempotente.';

-- ============================================================
-- 4. Trigger ON INSERT clinics → seed automatico
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_seed_services_on_new_clinic()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.seed_clinic_dental_services(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clinics_seed_services_after_insert ON public.clinics;

CREATE TRIGGER clinics_seed_services_after_insert
  AFTER INSERT ON public.clinics
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_seed_services_on_new_clinic();

COMMENT ON TRIGGER clinics_seed_services_after_insert ON public.clinics IS
  'Al crear una nueva clinica, seedea ~42 prestaciones FONASA tipicas. Idempotente.';

-- ============================================================
-- 5. Backfill seed para clinicas existentes
-- ============================================================

DO $$
DECLARE
  v_clinic record;
BEGIN
  FOR v_clinic IN SELECT id FROM public.clinics LOOP
    PERFORM public.seed_clinic_dental_services(v_clinic.id);
  END LOOP;
END $$;
