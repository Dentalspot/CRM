-- ============================================================
-- Notification type para invitaciones de clínica a dentista
-- ============================================================

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'appointment'::text, 'reminder'::text, 'message'::text, 'system'::text,
    'payment'::text, 'document'::text,
    'budget_sent'::text, 'budget_accepted'::text,
    'budget_payment_registered'::text, 'budget_completed'::text,
    'clinic_invitation'::text
  ]));
