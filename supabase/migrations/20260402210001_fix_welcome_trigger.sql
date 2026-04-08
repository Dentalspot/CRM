-- ============================================
-- Fix welcome trigger to use hardcoded URL
-- (Vault secrets may not be configured yet)
-- ============================================

CREATE OR REPLACE FUNCTION trigger_welcome_sequence()
RETURNS trigger AS $$
DECLARE
  _supabase_url text := 'https://ungjizupgostxkemilob.supabase.co';
  _service_key text;
BEGIN
  -- Only trigger for leads from meta_ads or landing_page segment
  IF NEW.source = 'meta_ads' OR NEW.segment = 'landing_page' THEN
    -- Get service role key from vault (must be configured)
    SELECT decrypted_secret INTO _service_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;

    IF _service_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := _supabase_url || '/functions/v1/welcome-sequence',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || _service_key
        ),
        body := jsonb_build_object('lead_id', NEW.id::text, 'step', 1)
      );
    ELSE
      RAISE WARNING 'service_role_key not found in vault. Run: SELECT vault.create_secret(''YOUR_KEY'', ''service_role_key'');';
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'Welcome sequence trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
