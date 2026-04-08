-- ============================================================================
-- SEED: Crear los 9 admins de DentalSpot
-- Ejecutar en Supabase SQL Editor
-- Password por defecto: DentalSpot2026!
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_existing_id UUID;
  v_password TEXT := 'DentalSpot2026!';
  v_admins JSONB := '[
    {
      "email": "ia@dentalspot.cl",
      "name": "Admin IA",
      "modules": ["ai_tools", "ai_playground", "ai_models", "ai_prompts"]
    },
    {
      "email": "legal@dentalspot.cl",
      "name": "Admin Legal",
      "modules": ["legal", "arco", "cookie_consents"]
    },
    {
      "email": "pacientes@dentalspot.cl",
      "name": "Admin Pacientes",
      "modules": ["patients", "patients_management", "demographics"]
    },
    {
      "email": "ficha@dentalspot.cl",
      "name": "Admin Ficha Clinica",
      "modules": ["clinical_files", "clinical_history"]
    },
    {
      "email": "marketplace@dentalspot.cl",
      "name": "Admin Marketplace",
      "modules": ["marketplace", "marketplace_products", "sales", "marketplace_coupons", "withdrawals"]
    },
    {
      "email": "debug@dentalspot.cl",
      "name": "Admin Soporte",
      "modules": ["support", "therapists", "clinics", "feedback", "faq"]
    },
    {
      "email": "pagos@dentalspot.cl",
      "name": "Admin Pagos",
      "modules": ["memberships", "payments", "coupons", "plans", "directory"]
    },
    {
      "email": "blog@dentalspot.cl",
      "name": "Admin Blog",
      "modules": ["blog", "qa", "publications"]
    },
    {
      "email": "marketing@dentalspot.cl",
      "name": "Admin Marketing",
      "modules": ["marketing", "marketing_mission_control", "marketing_meta_ads", "marketing_kanban", "marketing_audience", "marketing_campaigns", "marketing_automation", "marketing_analytics"]
    }
  ]';
  v_admin JSONB;
  v_module TEXT;
BEGIN
  FOR v_admin IN SELECT * FROM jsonb_array_elements(v_admins)
  LOOP
    v_user_id := NULL;

    -- Verificar si ya existe
    SELECT id INTO v_existing_id FROM auth.users WHERE email = v_admin->>'email';

    IF v_existing_id IS NOT NULL THEN
      v_user_id := v_existing_id;
      RAISE NOTICE 'Usuario ya existe: % (ID: %)', v_admin->>'email', v_user_id;
    ELSE
      -- Crear usuario nuevo
      v_user_id := gen_random_uuid();

      INSERT INTO auth.users (
        instance_id, id, aud, role, email,
        encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at,
        confirmation_token, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        v_admin->>'email',
        crypt(v_password, gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object(
          'full_name', v_admin->>'name',
          'role', 'admin',
          'origin_app', 'dentalspot',
          'origin_domain', 'https://dentalspot.cl'
        ),
        now(),
        now(),
        '',
        ''
      );

      -- Crear identidad
      INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data,
        provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        v_user_id,
        v_admin->>'email',
        jsonb_build_object('sub', v_user_id::text, 'email', v_admin->>'email'),
        'email',
        now(), now(), now()
      );

      RAISE NOTICE 'Usuario creado: % (ID: %)', v_admin->>'email', v_user_id;
    END IF;

    -- Crear/actualizar perfil
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (v_user_id, v_admin->>'email', v_admin->>'name', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = EXCLUDED.full_name;

    -- Asignar permisos
    FOR v_module IN SELECT jsonb_array_elements_text(v_admin->'modules')
    LOOP
      INSERT INTO admin_permissions (user_id, module, can_read, can_write)
      VALUES (v_user_id, v_module, true, true)
      ON CONFLICT (user_id, module) DO UPDATE SET can_read = true, can_write = true;
    END LOOP;

    RAISE NOTICE 'Permisos asignados: % → % modulos', v_admin->>'email', jsonb_array_length(v_admin->'modules');
  END LOOP;
END $$;
