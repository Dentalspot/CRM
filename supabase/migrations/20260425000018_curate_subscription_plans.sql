-- ============================================================
-- S1: Curaduría del catálogo de planes (Fase 1 Subscriptions)
-- ============================================================
-- Limpieza del catálogo pre-existente, sin destruir IDs:
--   - DELETE plan "Profesional" (legacy inactivo)
--   - UPDATE Free (sin cambios estructurales mayores)
--   - UPDATE Individual → Pro
--   - UPDATE Clínica Pro → Clinic
--   - UPDATE Clínica Premium → Clinic Plus
--
-- Features JSONB con tier + limits + gates (sin marketplace).
-- ============================================================

DELETE FROM public.subscription_plans WHERE slug = 'profesional';

UPDATE public.subscription_plans
SET
  name = 'Free', slug = 'free',
  description = 'Empieza gratis. Ideal para conocer la plataforma.',
  price = 0, currency = 'CLP', billing_cycle = 'monthly',
  max_patients = 5, max_clinics = 1, max_users = 1, max_storage_mb = 100,
  is_active = true, sort_order = 1,
  features = jsonb_build_object(
    'tier', 'free',
    'limits', jsonb_build_object('presupuestos_mes', 3),
    'gates', jsonb_build_object(
      'booking_publico', false, 'reportes_ingresos', false,
      'ia_notiz', false, 'ia_suggest', false,
      'multi_dentista', false, 'asistentes', false
    )
  ),
  updated_at = now()
WHERE slug = 'free';

UPDATE public.subscription_plans
SET
  name = 'Pro', slug = 'pro',
  description = 'Para dentistas profesionales con consulta privada. 14 días de prueba gratis.',
  price = 14990, currency = 'CLP', billing_cycle = 'monthly',
  max_patients = NULL, max_clinics = 1, max_users = 1, max_storage_mb = 5000,
  is_active = true, sort_order = 2,
  features = jsonb_build_object(
    'tier', 'pro',
    'trial_days', 14,
    'limits', jsonb_build_object('presupuestos_mes', null),
    'gates', jsonb_build_object(
      'booking_publico', true, 'reportes_ingresos', true,
      'ia_notiz', 'basic', 'ia_suggest', true,
      'multi_dentista', false, 'asistentes', false
    )
  ),
  updated_at = now()
WHERE slug = 'individual';

UPDATE public.subscription_plans
SET
  name = 'Clinic', slug = 'clinic',
  description = 'Para clínicas con equipo de varios dentistas y asistentes.',
  price = 24990, currency = 'CLP', billing_cycle = 'monthly',
  max_patients = NULL, max_clinics = 3, max_users = 5, max_storage_mb = 20000,
  is_active = true, sort_order = 3,
  features = jsonb_build_object(
    'tier', 'clinic',
    'limits', jsonb_build_object('presupuestos_mes', null),
    'gates', jsonb_build_object(
      'booking_publico', true, 'reportes_ingresos', true,
      'ia_notiz', 'basic', 'ia_suggest', true,
      'multi_dentista', true, 'asistentes', true
    )
  ),
  updated_at = now()
WHERE slug = 'clinic_pro';

UPDATE public.subscription_plans
SET
  name = 'Clinic Plus', slug = 'clinic-plus',
  description = 'Para clínicas grandes con múltiples sedes y mayor staff.',
  price = 39990, currency = 'CLP', billing_cycle = 'monthly',
  max_patients = NULL, max_clinics = 10, max_users = 15, max_storage_mb = 50000,
  is_active = true, sort_order = 4,
  features = jsonb_build_object(
    'tier', 'clinic-plus',
    'limits', jsonb_build_object('presupuestos_mes', null),
    'gates', jsonb_build_object(
      'booking_publico', true, 'reportes_ingresos', true,
      'ia_notiz', 'advanced', 'ia_suggest', true,
      'multi_dentista', true, 'asistentes', true
    )
  ),
  updated_at = now()
WHERE slug = 'clinic_premium';
