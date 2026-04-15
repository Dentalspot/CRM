-- Allow therapists to insert/update their own subscriptions (needed for free coupon activation)
CREATE POLICY "Users can insert own subscriptions"
  ON public.therapist_subscriptions FOR INSERT
  WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "Users can update own subscriptions"
  ON public.therapist_subscriptions FOR UPDATE
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "Users can delete own pending subscriptions"
  ON public.therapist_subscriptions FOR DELETE
  USING (therapist_id = auth.uid() AND status = 'pending');

-- Also allow users to insert into coupon_redemptions (already has RLS but ensure it works)
-- The migration 20260414000005 already created these policies
