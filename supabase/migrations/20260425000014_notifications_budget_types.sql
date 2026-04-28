-- ============================================================
-- Micro-bloque #6: Notificaciones de presupuestos y pagos
-- ============================================================
-- Extiende los CHECK constraints de notifications.type y
-- email_notifications.notification_type para soportar eventos
-- de budget/payment.
--
-- Tipos nuevos:
--   - budget_sent
--   - budget_accepted
--   - budget_payment_registered
--   - budget_completed
-- ============================================================

-- 1) Extender enum de notifications.type
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'appointment'::text,
    'reminder'::text,
    'message'::text,
    'system'::text,
    'payment'::text,
    'document'::text,
    'budget_sent'::text,
    'budget_accepted'::text,
    'budget_payment_registered'::text,
    'budget_completed'::text
  ]));

-- 2) Extender enum de email_notifications.notification_type
ALTER TABLE public.email_notifications
  DROP CONSTRAINT IF EXISTS email_notifications_notification_type_check;

ALTER TABLE public.email_notifications
  ADD CONSTRAINT email_notifications_notification_type_check
  CHECK (notification_type = ANY (ARRAY[
    'appointment_reminder'::text,
    'appointment_confirmation'::text,
    'appointment_cancellation'::text,
    'report_ready'::text,
    'plan_assigned'::text,
    'session_summary'::text,
    'payment_reminder'::text,
    'newsletter'::text,
    'system_update'::text,
    'budget_sent'::text
  ]));

-- 3) Función helper SECURITY DEFINER para crear notification in-app
--    desde RPC sin que el cliente necesite INSERT directo
CREATE OR REPLACE FUNCTION public.create_in_app_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_action_url text DEFAULT NULL,
  p_data jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_pref_enabled boolean;
BEGIN
  -- Respetar preferencias del usuario (default = enabled si no existe registro)
  SELECT COALESCE((preferences->p_type)::boolean, true) INTO v_pref_enabled
  FROM public.user_notification_preferences
  WHERE user_id = p_user_id;

  IF v_pref_enabled IS FALSE THEN
    RETURN NULL; -- usuario opt-out
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, action_url, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_action_url, p_data)
  RETURNING id INTO v_id;

  RETURN v_id;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'create_in_app_notification failed: %', SQLERRM;
  RETURN NULL;
END $$;

GRANT EXECUTE ON FUNCTION public.create_in_app_notification(uuid, text, text, text, text, jsonb)
  TO authenticated;
