-- ============================================================================
-- Migration: clinic admins can read profiles of their organization members
-- ----------------------------------------------------------------------------
-- Bug detectado durante smoke test spec 023:
--
--   Al entrar a /dashboard/clinic/team → tab Asistentes, la lista de
--   asistentes aparece vacía aunque existe una row en organization_members
--   con role='assistant' y is_active=true.
--
-- Causa raíz: el frontend hace query con embed PostgREST:
--   SELECT id, user_id, role, is_active, joined_at,
--     profiles:user_id (id, full_name, email, phone)
--   FROM organization_members
--   WHERE organization_id = X AND role = 'assistant'
--
-- Las RLS policies actuales de `profiles` solo permiten al user leer su
-- propio profile (profiles_select_own) + casos especiales (dentistas ven
-- profiles de sus pacientes, público ve dentistas). No hay policy para
-- que un clinic_admin lea profiles de asistentes/dentistas de su org.
--
-- Resultado: el embed retorna `profiles: null` para el asistente Kobe, el
-- filtro client-side (que usa row.profiles?.full_name...) devuelve falsy,
-- y la lista aparece vacía.
--
-- Fix: agregar policy para que clinic_admin pueda leer profiles de users
-- que son miembros activos de la misma organización.
--
-- Alcance: solo SELECT, solo cuando el user actual es clinic_admin activo
-- de la org que comparte con el profile objetivo.
-- ============================================================================

-- Nota (2026-04-24): inicialmente la policy filtraba también om_other.is_active=true,
-- pero eso rompía el listado de Inactivos en la UI (profiles embed retornaba null
-- para miembros desvinculados → filter client-side los excluía → lista vacía).
-- Se removió esa condición: ahora el clinic_admin puede ver profiles de miembros
-- activos E inactivos de su org — necesario para reactivación + audit.
-- El check de is_active se mantiene en om_self (solo admins activos pueden consultar).

CREATE POLICY "Clinic admins can view org members profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om_self
      JOIN public.organization_members om_other
        ON om_self.organization_id = om_other.organization_id
      WHERE om_self.user_id = auth.uid()
        AND om_self.role = 'clinic_admin'
        AND om_self.is_active = true
        AND om_other.user_id = public.profiles.id
    )
  );

COMMENT ON POLICY "Clinic admins can view org members profiles" ON public.profiles IS
  'Permite a un clinic_admin activo leer profiles de cualquier miembro '
  '(dentists/assistants) de su organización, activos o inactivos. Necesario '
  'para listado Activos + Inactivos + reactivación en /dashboard/clinic/team (spec 023).';
