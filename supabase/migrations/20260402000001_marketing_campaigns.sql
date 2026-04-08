-- =============================================================================
-- Marketing Campaigns table + email_notifications enhancements
-- =============================================================================

-- 1. Create marketing_campaigns table
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text,
  body_html text,
  status text DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','failed','paused')),
  segment text DEFAULT 'all',
  source_filter text,
  tags_filter jsonb DEFAULT '[]'::jsonb,
  campaign_type text DEFAULT 'one_time',
  trigger_type text DEFAULT 'manual',
  trigger_config jsonb DEFAULT '{}'::jsonb,
  sequence_group text,
  sequence_order integer DEFAULT 1,
  delay_days integer DEFAULT 0,
  send_time text,
  repeat_interval text,
  is_active boolean DEFAULT true,
  excluded_emails text[] DEFAULT '{}',
  included_emails text[] DEFAULT '{}',
  recipient_count integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_sequence ON public.marketing_campaigns(sequence_group, sequence_order);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON public.marketing_campaigns(created_by);

-- RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaigns"
  ON public.marketing_campaigns FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-update trigger
CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add columns to email_notifications for Resend webhook tracking
ALTER TABLE public.email_notifications ADD COLUMN IF NOT EXISTS resend_id text;
ALTER TABLE public.email_notifications ADD COLUMN IF NOT EXISTS opened_at timestamptz;
ALTER TABLE public.email_notifications ADD COLUMN IF NOT EXISTS clicked_at timestamptz;
ALTER TABLE public.email_notifications ADD COLUMN IF NOT EXISTS lead_id uuid;
ALTER TABLE public.email_notifications ADD COLUMN IF NOT EXISTS campaign_id uuid;

-- Add foreign keys (safe — won't fail if already exists)
DO $$ BEGIN
  ALTER TABLE public.email_notifications
    ADD CONSTRAINT fk_email_notifications_lead
    FOREIGN KEY (lead_id) REFERENCES public.marketing_leads(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.email_notifications
    ADD CONSTRAINT fk_email_notifications_campaign
    FOREIGN KEY (campaign_id) REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Expand notification_type to include marketing types
ALTER TABLE public.email_notifications DROP CONSTRAINT IF EXISTS email_notifications_notification_type_check;
ALTER TABLE public.email_notifications ADD CONSTRAINT email_notifications_notification_type_check
  CHECK (notification_type IN (
    'appointment_reminder','appointment_confirmation','appointment_cancellation',
    'report_ready','plan_assigned','session_summary','payment_reminder',
    'newsletter','system_update','marketing','marketing_campaign'
  ));

-- Expand status to include webhook statuses
ALTER TABLE public.email_notifications DROP CONSTRAINT IF EXISTS email_notifications_status_check;
ALTER TABLE public.email_notifications ADD CONSTRAINT email_notifications_status_check
  CHECK (status IN ('pending','sent','failed','cancelled','delivered','bounced','complained','deleted'));

-- Index for webhook lookups by resend_id
CREATE INDEX IF NOT EXISTS idx_email_notifications_resend_id ON public.email_notifications(resend_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_campaign_id ON public.email_notifications(campaign_id);
