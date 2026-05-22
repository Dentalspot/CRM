-- ============================================================
-- Followup UX #3 (spec 023): banner de membresía revocada
-- ============================================================
-- Bug: cuando un admin revoca a un asistente/clinic_admin
-- (organization_members.is_active=false), el usuario revocado no podía
-- leer su propia row para que el frontend supiera mostrarle un mensaje
-- "Tu acceso fue revocado".
--
-- Causa: la policy om_member_select usa is_org_member(organization_id)
-- que filtra por is_active=true. Una vez revocado, el user ya no es
-- "member" según la función → no puede SELECT su propia row.
--
-- Fix: nueva policy om_self_select que permite al user leer sus propias
-- rows en organization_members sin importar is_active. Esto es
-- transparencia básica (un user debe poder saber a qué orgs pertenece
-- o perteneció) y bajo riesgo porque scoped a auth.uid().
--
-- Usado por: src/components/dashboard/RevokedMembershipBanner.jsx
-- ============================================================

CREATE POLICY "om_self_select" ON "public"."organization_members"
  FOR SELECT
  USING ("user_id" = "auth"."uid"());

COMMENT ON POLICY "om_self_select" ON "public"."organization_members"
  IS 'El usuario puede leer sus propias rows en organization_members (incluyendo is_active=false). Necesario para el banner de membresía revocada (Followup UX #3 spec 023).';
