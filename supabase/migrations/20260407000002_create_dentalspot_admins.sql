-- ============================================================================
-- DENTALSPOT ADMIN USERS
--
-- IMPORTANTE: Este script solo crea los permisos en admin_permissions.
-- Los usuarios deben registrarse primero via la app (auth.users + profiles).
-- Despues de que se registren, ejecutar este script con sus UUIDs reales.
--
-- PASO 1: Cada admin se registra en https://dentalspot.cl/auth/register con rol 'admin'
-- PASO 2: Buscar sus UUIDs en profiles:
--         SELECT id, email, role FROM profiles WHERE email LIKE '%@dentalspot.cl';
-- PASO 3: Reemplazar los UUIDs placeholder de abajo con los reales
-- PASO 4: Ejecutar este script en Supabase SQL Editor
-- ============================================================================

-- ============================================
-- FUNCION HELPER: Crear admin con permisos por modulo
-- ============================================
CREATE OR REPLACE FUNCTION create_dentalspot_admin(
  p_email TEXT,
  p_modules TEXT[]
) RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_module TEXT;
BEGIN
  -- Buscar el user_id por email
  SELECT id INTO v_user_id FROM profiles WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Usuario % no encontrado. Debe registrarse primero.', p_email;
    RETURN;
  END IF;

  -- Actualizar rol a admin
  UPDATE profiles SET role = 'admin' WHERE id = v_user_id;

  -- Insertar permisos para cada modulo
  FOREACH v_module IN ARRAY p_modules
  LOOP
    INSERT INTO admin_permissions (user_id, module, can_read, can_write)
    VALUES (v_user_id, v_module, true, true)
    ON CONFLICT (user_id, module) DO UPDATE SET can_read = true, can_write = true;
  END LOOP;

  RAISE NOTICE 'Admin % configurado con % modulos.', p_email, array_length(p_modules, 1);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CREAR ADMINS (ejecutar DESPUES de que se registren)
-- ============================================

-- 1. ia@dentalspot.cl → Herramientas IA
SELECT create_dentalspot_admin('ia@dentalspot.cl', ARRAY[
  'ai_tools', 'ai_playground', 'ai_models', 'ai_prompts'
]);

-- 2. legal@dentalspot.cl → Legal / Compliance
SELECT create_dentalspot_admin('legal@dentalspot.cl', ARRAY[
  'legal', 'arco', 'cookie_consents'
]);

-- 3. pacientes@dentalspot.cl → Gestion de Pacientes
SELECT create_dentalspot_admin('pacientes@dentalspot.cl', ARRAY[
  'patients', 'patients_management', 'demographics'
]);

-- 4. ficha@dentalspot.cl → Historia Clinica
SELECT create_dentalspot_admin('ficha@dentalspot.cl', ARRAY[
  'clinical_files', 'clinical_history'
]);

-- 5. marketplace@dentalspot.cl → Marketplace
SELECT create_dentalspot_admin('marketplace@dentalspot.cl', ARRAY[
  'marketplace', 'marketplace_products', 'sales', 'marketplace_coupons', 'withdrawals'
]);

-- 6. debug@dentalspot.cl → Soporte / Debug
SELECT create_dentalspot_admin('debug@dentalspot.cl', ARRAY[
  'support', 'therapists', 'clinics', 'feedback', 'faq'
]);

-- 7. pagos@dentalspot.cl → Facturacion
SELECT create_dentalspot_admin('pagos@dentalspot.cl', ARRAY[
  'memberships', 'payments', 'coupons', 'plans', 'directory'
]);

-- 8. blog@dentalspot.cl → Blog / Contenido
SELECT create_dentalspot_admin('blog@dentalspot.cl', ARRAY[
  'blog', 'qa', 'publications'
]);

-- 9. marketing@dentalspot.cl → Marketing
SELECT create_dentalspot_admin('marketing@dentalspot.cl', ARRAY[
  'marketing', 'marketing_mission_control', 'marketing_meta_ads',
  'marketing_kanban', 'marketing_audience', 'marketing_campaigns',
  'marketing_automation', 'marketing_analytics'
]);

-- ============================================
-- SUPER ADMIN (tu cuenta principal, ejecutar aparte)
-- ============================================
-- Si quieres un super admin con acceso total:
-- UPDATE profiles SET is_super_admin = true WHERE email = 'tu-email@dentalspot.cl';
-- INSERT INTO admin_permissions (user_id, module, can_read, can_write)
-- SELECT id, 'all', true, true FROM profiles WHERE email = 'tu-email@dentalspot.cl'
-- ON CONFLICT (user_id, module) DO NOTHING;

-- Limpiar funcion helper
-- DROP FUNCTION IF EXISTS create_dentalspot_admin(TEXT, TEXT[]);
