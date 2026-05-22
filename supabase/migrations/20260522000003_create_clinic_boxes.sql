-- ============================================================
-- Feature: clinic_boxes (Paso 1 de Gestión de Clínicas)
-- ============================================================
-- Tabla para representar los "boxes" físicos (salas/sillones) dentro de
-- una clínica/sucursal. Cada appointment futuro podrá referenciar un
-- box específico (Paso 2 — no en este migration).
--
-- Conceptos:
--   - 1 clinic (sucursal) → N boxes
--   - 1 organization → N clinics (sucursales) → N boxes total
--   - dentista trabaja en N clinics, atiende en algún box específico
--     por cita (resolución de conflicto: no 2 citas en mismo box al
--     mismo tiempo — enforce en Paso 2)
--
-- Plan limits ya estaban preparados (subscription_plans.max_boxes con
-- Free=0, Pro=1, Clinic=3, Clinic Plus=null). Enforcement de límite
-- queda como check en frontend por ahora (RLS no puede contar fácil).
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."clinic_boxes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "clinic_id" uuid NOT NULL REFERENCES "public"."clinics"("id") ON DELETE CASCADE,
  "organization_id" uuid NOT NULL REFERENCES "public"."organizations"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "box_type" text NOT NULL DEFAULT 'general' CHECK (
    "box_type" IN ('general', 'ortodoncia', 'cirugia', 'radiologia', 'otro')
  ),
  "is_active" boolean NOT NULL DEFAULT true,
  "equipment" jsonb DEFAULT '[]'::jsonb,
  "notes" text,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),
  -- No dos boxes con el mismo nombre dentro de la misma sucursal
  UNIQUE ("clinic_id", "name")
);

CREATE INDEX IF NOT EXISTS "idx_clinic_boxes_clinic"
  ON "public"."clinic_boxes" ("clinic_id");
CREATE INDEX IF NOT EXISTS "idx_clinic_boxes_org"
  ON "public"."clinic_boxes" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_clinic_boxes_active"
  ON "public"."clinic_boxes" ("organization_id", "is_active")
  WHERE "is_active" = true;

-- Trigger: auto-poblar organization_id si viene null (defensa contra
-- desalineación entre clinic_id y org explícito)
CREATE OR REPLACE FUNCTION "public"."fill_clinic_box_organization_id"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.clinics WHERE id = NEW.clinic_id;
    IF NEW.organization_id IS NULL THEN
      RAISE EXCEPTION 'Clínica % no tiene organization_id', NEW.clinic_id;
    END IF;
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER "trg_fill_clinic_box_org"
  BEFORE INSERT ON "public"."clinic_boxes"
  FOR EACH ROW EXECUTE FUNCTION "public"."fill_clinic_box_organization_id"();

-- Trigger: auto-update updated_at
CREATE TRIGGER "trg_clinic_boxes_updated_at"
  BEFORE UPDATE ON "public"."clinic_boxes"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE "public"."clinic_boxes" ENABLE ROW LEVEL SECURITY;

-- Cualquier member activo de la org puede VER los boxes
-- (dentistas/asistentes necesitan saber qué boxes hay para agendar)
CREATE POLICY "cb_member_select" ON "public"."clinic_boxes"
  FOR SELECT
  USING ("public"."is_org_member"("organization_id"));

-- Solo clinic_admin puede CRUD
CREATE POLICY "cb_admin_insert" ON "public"."clinic_boxes"
  FOR INSERT
  WITH CHECK ("public"."is_org_member"("organization_id", 'clinic_admin'::text));

CREATE POLICY "cb_admin_update" ON "public"."clinic_boxes"
  FOR UPDATE
  USING ("public"."is_org_member"("organization_id", 'clinic_admin'::text))
  WITH CHECK ("public"."is_org_member"("organization_id", 'clinic_admin'::text));

CREATE POLICY "cb_admin_delete" ON "public"."clinic_boxes"
  FOR DELETE
  USING ("public"."is_org_member"("organization_id", 'clinic_admin'::text));

COMMENT ON TABLE "public"."clinic_boxes" IS
  'Boxes/salas/sillones físicos dentro de una clínica/sucursal. Cada appointment futuro podrá referenciarlos para resolver conflictos de recurso (no 2 citas en mismo box simultáneas).';

COMMENT ON COLUMN "public"."clinic_boxes"."box_type" IS
  'Categoría del box: general, ortodoncia, cirugia, radiologia, otro. Sirve para sugerencias de asignación y filtros.';

COMMENT ON COLUMN "public"."clinic_boxes"."equipment" IS
  'Array JSON con equipamiento opcional (ej: ["microscopio", "scanner intraoral", "radiografía periapical"]). Sin UI estructurada en MVP.';
