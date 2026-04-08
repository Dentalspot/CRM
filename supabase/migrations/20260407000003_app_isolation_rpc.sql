-- ============================================================================
-- APP ISOLATION: RPC para filtrar usuarios por origin_app
--
-- El ecosistema Comunicare comparte una sola BD de Supabase.
-- Cada app (FonoKit, DentalSpot, KineKit, etc.) necesita ver solo SUS datos.
-- origin_app se guarda en auth.users.raw_user_meta_data al registrarse.
--
-- SEGURIDAD: Esta funcion solo retorna IDs, no datos sensibles.
--            Solo accesible por usuarios autenticados con rol admin.
-- ============================================================================

-- Funcion para obtener user IDs filtrados por origin_app y role
CREATE OR REPLACE FUNCTION get_users_by_origin_app(
  p_origin_app TEXT,
  p_role TEXT DEFAULT NULL
)
RETURNS TABLE (id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.raw_user_meta_data->>'origin_app' = p_origin_app
    AND (p_role IS NULL OR p.role = p_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Solo admins pueden ejecutar esta funcion
REVOKE ALL ON FUNCTION get_users_by_origin_app(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_users_by_origin_app(TEXT, TEXT) TO authenticated;

-- ============================================================================
-- ELIMINAR SUPER ADMIN
-- Por seguridad, desactivar is_super_admin para todos los usuarios.
-- Cada admin tiene permisos granulares por modulo.
-- ============================================================================
UPDATE profiles SET is_super_admin = false WHERE is_super_admin = true;

-- ============================================================================
-- ACTUALIZAR MIGRACION DE ADMINS
-- Quitar referencia a super_admin del script anterior
-- ============================================================================
