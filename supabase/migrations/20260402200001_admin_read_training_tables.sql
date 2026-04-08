-- =====================================================
-- Add admin read policies to training-relevant tables
-- Allows admin to see counts for AI training dashboard
-- =====================================================

-- Admin can read all notiz_sessions (for training data counts)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_notiz_sessions' AND tablename = 'notiz_sessions') THEN
    CREATE POLICY "admin_read_notiz_sessions" ON public.notiz_sessions
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
END $$;

-- Admin can read all ados2_evaluations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_ados2_evaluations' AND tablename = 'ados2_evaluations') THEN
    CREATE POLICY "admin_read_ados2_evaluations" ON public.ados2_evaluations
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
END $$;

-- Admin can read all adir_evaluations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_adir_evaluations' AND tablename = 'adir_evaluations') THEN
    CREATE POLICY "admin_read_adir_evaluations" ON public.adir_evaluations
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
END $$;

-- Admin can read all clinical_history
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_clinical_history' AND tablename = 'clinical_history') THEN
    CREATE POLICY "admin_read_clinical_history" ON public.clinical_history
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
END $$;

-- Admin can read all treatment_plans
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_treatment_plans' AND tablename = 'treatment_plans') THEN
    CREATE POLICY "admin_read_treatment_plans" ON public.treatment_plans
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
END $$;

-- Admin can read all sensorial_evaluations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_sensorial_evaluations' AND tablename = 'sensorial_evaluations') THEN
    CREATE POLICY "admin_read_sensorial_evaluations" ON public.sensorial_evaluations
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
END $$;

-- Admin can read all generated_templates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_generated_templates' AND tablename = 'generated_templates') THEN
    CREATE POLICY "admin_read_generated_templates" ON public.generated_templates
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
END $$;

-- Admin can read all session_activities
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_session_activities' AND tablename = 'session_activities') THEN
    CREATE POLICY "admin_read_session_activities" ON public.session_activities
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
END $$;

-- Admin can read all ai_chat_sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_ai_chat_sessions' AND tablename = 'ai_chat_sessions') THEN
    CREATE POLICY "admin_read_ai_chat_sessions" ON public.ai_chat_sessions
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
END $$;

-- Admin can read all ai_feedback
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_ai_feedback' AND tablename = 'ai_feedback') THEN
    CREATE POLICY "admin_read_ai_feedback" ON public.ai_feedback
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
END $$;

-- Admin can read all ai_usage_quotas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_ai_usage_quotas' AND tablename = 'ai_usage_quotas') THEN
    CREATE POLICY "admin_read_ai_usage_quotas" ON public.ai_usage_quotas
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
END $$;
