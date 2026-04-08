-- ============================================
-- Welcome Email Sequence: Templates + Trigger
-- ============================================

-- Ensure columns exist on email_notifications for welcome sequence
DO $$ BEGIN
  ALTER TABLE email_notifications ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;
  ALTER TABLE email_notifications ADD COLUMN IF NOT EXISTS resend_id text;
  ALTER TABLE email_notifications ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES marketing_leads(id) ON DELETE SET NULL;
  ALTER TABLE email_notifications ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES marketing_campaigns(id) ON DELETE SET NULL;
  ALTER TABLE email_notifications ADD COLUMN IF NOT EXISTS opened_at timestamptz;
  ALTER TABLE email_notifications ADD COLUMN IF NOT EXISTS clicked_at timestamptz;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Make user_id nullable (leads don't have user accounts)
ALTER TABLE email_notifications ALTER COLUMN user_id DROP NOT NULL;

-- ============================================
-- Welcome Email Templates (3-email sequence)
-- ============================================

INSERT INTO email_templates (template_name, notification_type, subject_template, body_html_template, body_text_template, variables, is_active)
VALUES

-- EMAIL 1: Bienvenida (inmediato)
(
  'welcome_01_bienvenida',
  'marketing',
  '¡Bienvenido/a a Fonokit, {{nombre}}! 🎉',
  '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f6fbfb;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6fbfb;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#00BCB5,#009E99);padding:32px 40px;text-align:center;">
  <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">Fonokit</h1>
  <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">La plataforma digital para fonoaudiologos</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:40px;">
  <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;">¡Hola {{nombre}}! 👋</h2>
  <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
    Nos alegra que te hayas interesado en Fonokit. Estamos construyendo la plataforma que los fonoaudiologos en Chile necesitan para digitalizar su practica clinica.
  </p>

  <p style="color:#333;font-size:15px;font-weight:600;margin:0 0 16px;">Esto es lo que puedes hacer con Fonokit:</p>

  <!-- Feature 1 -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
  <tr>
    <td width="40" valign="top"><div style="width:32px;height:32px;background-color:#d2f2f0;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">📅</div></td>
    <td style="padding-left:12px;">
      <p style="margin:0;color:#1a1a1a;font-size:14px;font-weight:600;">Agenda Inteligente</p>
      <p style="margin:4px 0 0;color:#666;font-size:13px;">Reservas online + recordatorios automaticos + sync con Google Calendar</p>
    </td>
  </tr></table>

  <!-- Feature 2 -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
  <tr>
    <td width="40" valign="top"><div style="width:32px;height:32px;background-color:#d2f2f0;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">📋</div></td>
    <td style="padding-left:12px;">
      <p style="margin:0;color:#1a1a1a;font-size:14px;font-weight:600;">Ficha Clinica con IA</p>
      <p style="margin:4px 0 0;color:#666;font-size:13px;">Evaluaciones TEA (ADOS-2, ADI-R), SOAP automatico y seguimiento digital</p>
    </td>
  </tr></table>

  <!-- Feature 3 -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr>
    <td width="40" valign="top"><div style="width:32px;height:32px;background-color:#d2f2f0;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">🔍</div></td>
    <td style="padding-left:12px;">
      <p style="margin:0;color:#1a1a1a;font-size:14px;font-weight:600;">Buscador de Profesionales</p>
      <p style="margin:4px 0 0;color:#666;font-size:13px;">Aparece en el directorio y recibe pacientes nuevos cada mes</p>
    </td>
  </tr></table>

  <!-- CTA Button -->
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <a href="https://fonokit.cl/auth/register" style="display:inline-block;background-color:#ff74c3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700;">
      Crear mi cuenta gratis →
    </a>
  </td></tr></table>

  <p style="color:#999;font-size:13px;text-align:center;margin:20px 0 0;">
    Sin tarjeta de credito. Cancela cuando quieras.
  </p>
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#f6fbfb;padding:24px 40px;border-top:1px solid #e8e8e8;">
  <p style="margin:0;color:#999;font-size:12px;text-align:center;">
    Fonokit.cl — La plataforma digital para fonoaudiologos en Chile<br>
    <a href="{{unsubscribe_url}}" style="color:#999;text-decoration:underline;">Cancelar suscripcion</a>
  </p>
</td></tr>

</table>
</td></tr></table>
</body></html>',
  'Hola {{nombre}}! Bienvenido/a a Fonokit. Crea tu cuenta gratis en https://fonokit.cl/auth/register',
  '["nombre", "email", "unsubscribe_url"]'::jsonb,
  true
),

-- EMAIL 2: Herramientas IA (dia 2)
(
  'welcome_02_herramientas',
  'marketing',
  '{{nombre}}, conoce las herramientas que estan transformando la fonoaudiologia 🛠️',
  '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f6fbfb;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6fbfb;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#00BCB5,#009E99);padding:32px 40px;text-align:center;">
  <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">Fonokit</h1>
  <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Inteligencia Artificial para tu practica</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:40px;">
  <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;">{{nombre}}, la IA ya esta aqui 🤖</h2>
  <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
    Sabias que puedes ahorrar hasta 3 horas semanales en documentacion clinica? Estas son las herramientas de IA que nuestros profesionales mas usan:
  </p>

  <!-- Tool 1: Notiz -->
  <div style="background-color:#d2f2f0;border-radius:10px;padding:20px;margin-bottom:16px;">
    <h3 style="margin:0 0 8px;color:#00BCB5;font-size:16px;">🎙️ Notiz — Transcripcion Inteligente</h3>
    <p style="margin:0;color:#555;font-size:14px;line-height:1.5;">
      Graba tu sesion y Notiz la transcribe automaticamente en formato SOAP (Subjetivo, Objetivo, Analisis, Plan). Solo presiona grabar y enfocate en tu paciente.
    </p>
  </div>

  <!-- Tool 2: Generador -->
  <div style="background-color:#d2f2f0;border-radius:10px;padding:20px;margin-bottom:16px;">
    <h3 style="margin:0 0 8px;color:#00BCB5;font-size:16px;">📝 Generador de Plantillas</h3>
    <p style="margin:0;color:#555;font-size:14px;line-height:1.5;">
      Describe lo que necesitas y la IA genera planes de tratamiento, informes y material terapeutico basado en evidencia cientifica.
    </p>
  </div>

  <!-- Tool 3: Buscador de Evidencia -->
  <div style="background-color:#d2f2f0;border-radius:10px;padding:20px;margin-bottom:24px;">
    <h3 style="margin:0 0 8px;color:#00BCB5;font-size:16px;">🔬 Buscador de Evidencia</h3>
    <p style="margin:0;color:#555;font-size:14px;line-height:1.5;">
      Busca articulos cientificos y obtiene sintesis en espanol con recomendaciones clinicas. Practica basada en evidencia, facil.
    </p>
  </div>

  <!-- CTA Button -->
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <a href="https://fonokit.cl/auth/register" style="display:inline-block;background-color:#ff74c3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700;">
      Probar las herramientas gratis →
    </a>
  </td></tr></table>

  <p style="color:#999;font-size:13px;text-align:center;margin:20px 0 0;">
    Todas las herramientas IA estan incluidas en el plan gratuito.
  </p>
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#f6fbfb;padding:24px 40px;border-top:1px solid #e8e8e8;">
  <p style="margin:0;color:#999;font-size:12px;text-align:center;">
    Fonokit.cl — La plataforma digital para fonoaudiologos en Chile<br>
    <a href="{{unsubscribe_url}}" style="color:#999;text-decoration:underline;">Cancelar suscripcion</a>
  </p>
</td></tr>

</table>
</td></tr></table>
</body></html>',
  'Hola {{nombre}}! Conoce Notiz (transcripcion IA), el generador de plantillas y el buscador de evidencia. Prueba gratis: https://fonokit.cl/auth/register',
  '["nombre", "email", "unsubscribe_url"]'::jsonb,
  true
),

-- EMAIL 3: Comunidad y social proof (dia 5)
(
  'welcome_03_comunidad',
  'marketing',
  '{{nombre}}, unete a 46+ profesionales que ya usan Fonokit 💪',
  '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f6fbfb;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6fbfb;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#00BCB5,#009E99);padding:32px 40px;text-align:center;">
  <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">Fonokit</h1>
  <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">La comunidad crece cada dia</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:40px;">
  <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;">{{nombre}}, no te quedes fuera 🚀</h2>
  <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
    Mas de 46 fonoaudiologos en Chile ya estan usando Fonokit para digitalizar su practica. Esto es lo que dicen:
  </p>

  <!-- Testimonial 1 -->
  <div style="border-left:3px solid #00BCB5;padding:12px 16px;margin-bottom:16px;background-color:#f6fbfb;border-radius:0 8px 8px 0;">
    <p style="margin:0;color:#555;font-size:14px;font-style:italic;">"Fonokit me ahorra horas de documentacion cada semana. La IA es increible."</p>
    <p style="margin:8px 0 0;color:#00BCB5;font-size:13px;font-weight:600;">— Carolina M., Fonoaudiologa, Santiago</p>
  </div>

  <!-- Testimonial 2 -->
  <div style="border-left:3px solid #00BCB5;padding:12px 16px;margin-bottom:16px;background-color:#f6fbfb;border-radius:0 8px 8px 0;">
    <p style="margin:0;color:#555;font-size:14px;font-style:italic;">"Desde que active mi perfil, recibo 3-4 pacientes nuevos al mes."</p>
    <p style="margin:8px 0 0;color:#00BCB5;font-size:13px;font-weight:600;">— Felipe R., Fonoaudiologo, Concepcion</p>
  </div>

  <!-- Testimonial 3 -->
  <div style="border-left:3px solid #ff74c3;padding:12px 16px;margin-bottom:24px;background-color:#fff5fb;border-radius:0 8px 8px 0;">
    <p style="margin:0;color:#555;font-size:14px;font-style:italic;">"La ficha clinica TEA es la mas completa que he usado. Todo en un solo lugar."</p>
    <p style="margin:8px 0 0;color:#ff74c3;font-size:13px;font-weight:600;">— Valentina S., Fonoaudiologa, Valparaiso</p>
  </div>

  <!-- Stats -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr>
    <td width="33%" align="center" style="padding:12px;">
      <p style="margin:0;color:#00BCB5;font-size:28px;font-weight:800;">46+</p>
      <p style="margin:4px 0 0;color:#999;font-size:12px;">Profesionales</p>
    </td>
    <td width="33%" align="center" style="padding:12px;">
      <p style="margin:0;color:#00BCB5;font-size:28px;font-weight:800;">500+</p>
      <p style="margin:4px 0 0;color:#999;font-size:12px;">Sesiones</p>
    </td>
    <td width="33%" align="center" style="padding:12px;">
      <p style="margin:0;color:#ff74c3;font-size:28px;font-weight:800;">4.8★</p>
      <p style="margin:4px 0 0;color:#999;font-size:12px;">Valoracion</p>
    </td>
  </tr></table>

  <!-- Marketplace mention -->
  <div style="background-color:#d2f2f0;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
    <p style="margin:0;color:#00BCB5;font-size:16px;font-weight:700;">🛒 Marketplace Profesional</p>
    <p style="margin:8px 0 0;color:#555;font-size:14px;">
      Vende tu material terapeutico digital a colegas de todo Chile. Genera ingresos extras haciendo lo que amas.
    </p>
  </div>

  <!-- CTA Button -->
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <a href="https://fonokit.cl/auth/register" style="display:inline-block;background-color:#ff74c3;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:18px;font-weight:700;">
      Unirme a Fonokit gratis →
    </a>
  </td></tr></table>

  <p style="color:#999;font-size:13px;text-align:center;margin:20px 0 0;">
    Tu lugar en la comunidad te esta esperando.
  </p>
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#f6fbfb;padding:24px 40px;border-top:1px solid #e8e8e8;">
  <p style="margin:0;color:#999;font-size:12px;text-align:center;">
    Fonokit.cl — La plataforma digital para fonoaudiologos en Chile<br>
    <a href="{{unsubscribe_url}}" style="color:#999;text-decoration:underline;">Cancelar suscripcion</a>
  </p>
</td></tr>

</table>
</td></tr></table>
</body></html>',
  'Hola {{nombre}}! 46+ profesionales ya usan Fonokit. Unete gratis: https://fonokit.cl/auth/register',
  '["nombre", "email", "unsubscribe_url"]'::jsonb,
  true
)

ON CONFLICT (template_name) DO NOTHING;

-- ============================================
-- Welcome Sequence Campaigns
-- ============================================

INSERT INTO marketing_campaigns (name, subject, body_html, status, segment, campaign_type, trigger_type, sequence_group, sequence_order, delay_days, is_active, send_time)
VALUES
  ('Welcome 1 — Bienvenida', '¡Bienvenido/a a Fonokit, {{nombre}}! 🎉', '(template: welcome_01_bienvenida)', 'active', 'new', 'sequence', 'on_register', 'welcome_series', 1, 0, true, '09:00'),
  ('Welcome 2 — Herramientas', '{{nombre}}, conoce las herramientas que estan transformando la fonoaudiologia 🛠️', '(template: welcome_02_herramientas)', 'active', 'new', 'sequence', 'on_register', 'welcome_series', 2, 2, true, '09:00'),
  ('Welcome 3 — Comunidad', '{{nombre}}, unete a 46+ profesionales que ya usan Fonokit 💪', '(template: welcome_03_comunidad)', 'active', 'new', 'sequence', 'on_register', 'welcome_series', 3, 5, true, '09:00')
ON CONFLICT DO NOTHING;

-- ============================================
-- Database Trigger: Auto-send welcome on new lead
-- Requires pg_net extension (enabled by default on Supabase)
-- ============================================

-- Enable pg_net if not already
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION trigger_welcome_sequence()
RETURNS trigger AS $$
BEGIN
  -- Only trigger for leads from meta_ads or landing_page segment
  IF NEW.source = 'meta_ads' OR NEW.segment = 'landing_page' THEN
    PERFORM net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1) || '/functions/v1/welcome-sequence',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
      ),
      body := jsonb_build_object('lead_id', NEW.id::text, 'step', 1)
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Don't block insert if welcome email fails
  RAISE WARNING 'Welcome sequence trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_lead_welcome ON marketing_leads;
CREATE TRIGGER on_new_lead_welcome
  AFTER INSERT ON marketing_leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_welcome_sequence();

-- ============================================
-- Cron: Process scheduled emails every 15 min
-- Requires pg_cron extension
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

SELECT cron.schedule(
  'process-scheduled-emails',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1) || '/functions/v1/process-scheduled-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
