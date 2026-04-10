-- =====================================================
-- Seed AI prompt templates and settings for DentalSpot chatbot
-- Creates tables if needed, seeds prompts/settings/FAQs
-- =====================================================

-- 1. Create ai_prompt_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ai_prompt_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE,
  name text NOT NULL,
  category text DEFAULT 'general',
  description text,
  template text DEFAULT '',
  system_prompt text,
  user_prompt_template text,
  variables jsonb DEFAULT '[]'::jsonb,
  temperature numeric(3,2) DEFAULT 0.3,
  max_tokens integer DEFAULT 1000,
  model text DEFAULT 'claude-haiku-4-5-20251001',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admins_read_prompts' AND tablename = 'ai_prompt_templates') THEN
    CREATE POLICY "admins_read_prompts" ON public.ai_prompt_templates
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admins_write_prompts' AND tablename = 'ai_prompt_templates') THEN
    CREATE POLICY "admins_write_prompts" ON public.ai_prompt_templates
      FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
  -- Allow edge functions (service_role) to read prompts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_read_prompts' AND tablename = 'ai_prompt_templates') THEN
    CREATE POLICY "service_read_prompts" ON public.ai_prompt_templates
      FOR SELECT TO service_role USING (true);
  END IF;
END $$;

-- Ensure ai_settings table exists
CREATE TABLE IF NOT EXISTS public.ai_settings (
  key text PRIMARY KEY,
  value text,
  description text,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_read_settings' AND tablename = 'ai_settings') THEN
    CREATE POLICY "service_read_settings" ON public.ai_settings
      FOR SELECT TO service_role USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admins_read_settings' AND tablename = 'ai_settings') THEN
    CREATE POLICY "admins_read_settings" ON public.ai_settings
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admins_write_settings' AND tablename = 'ai_settings') THEN
    CREATE POLICY "admins_write_settings" ON public.ai_settings
      FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
END $$;

-- Ensure faq_chatbot table exists
CREATE TABLE IF NOT EXISTS public.faq_chatbot (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'general',
  link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.faq_chatbot ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anyone_read_faqs' AND tablename = 'faq_chatbot') THEN
    CREATE POLICY "anyone_read_faqs" ON public.faq_chatbot
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_read_faqs' AND tablename = 'faq_chatbot') THEN
    CREATE POLICY "service_read_faqs" ON public.faq_chatbot
      FOR SELECT TO service_role USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admins_write_faqs' AND tablename = 'faq_chatbot') THEN
    CREATE POLICY "admins_write_faqs" ON public.faq_chatbot
      FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
END $$;

-- 2. Seed chatbot prompts for DentalSpot
-- =====================================================

-- chat-with-ai: Therapist/Dentist System Prompt
INSERT INTO public.ai_prompt_templates (slug, name, category, description, system_prompt, user_prompt_template, variables, temperature, max_tokens, model, is_active)
VALUES (
  'chat-with-ai.therapist',
  'Asistente Clinico DentalSpot',
  'chatbot',
  'System prompt para el chatbot cuando el usuario es dentista/odontologo',
  E'Actuas como "Asistente Clinico DentalSpot", un asistente inteligente para odontologos y dentistas en Chile.\n\nCONTEXTO: Profesional: {{therapist_name}}\n{{faq_context}}\n{{rag_context}}\n\nINSTRUCCIONES:\n1. Si hay informacion en la BASE DE CONOCIMIENTO (FAQs), USALA PRIMERO para responder. Incluye los links si existen.\n2. Si hay contexto clinico, USALO para responder con datos reales del profesional.\n3. Se profesional y conciso (maximo 3 parrafos).\n4. Puedes sugerir tratamientos, procedimientos y materiales basandote en la evidencia.\n5. Si no hay datos suficientes, dilo y sugiere donde encontrar la informacion en DentalSpot.\n6. Cuando incluyas un link, formatealo asi: [texto](url)\n\nIMPORTANTE: Responde UNICAMENTE con JSON valido:\n{"reply":"tu respuesta aqui","suggestions":["opcion 1","opcion 2"],"sources_used":{{rag_sources}}}',
  NULL,
  '["therapist_name", "faq_context", "rag_context", "rag_sources"]'::jsonb,
  0.3,
  800,
  'claude-haiku-4-5-20251001',
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  system_prompt = EXCLUDED.system_prompt,
  description = EXCLUDED.description;

-- chat-with-ai: Patient System Prompt
INSERT INTO public.ai_prompt_templates (slug, name, category, description, system_prompt, user_prompt_template, variables, temperature, max_tokens, model, is_active)
VALUES (
  'chat-with-ai.patient',
  'Asistente DentalSpot Paciente',
  'chatbot',
  'System prompt para el chatbot cuando el usuario es paciente',
  E'Actua como "Asistente DentalSpot", un asistente virtual empatico para pacientes de odontologia en Chile.\n\nCONTEXTO: Nombre: {{patient_name}}, Rol: Paciente\n{{faq_context}}\n\nINSTRUCCIONES:\n1. Si hay informacion en la BASE DE CONOCIMIENTO (FAQs), USALA PRIMERO para responder. Incluye los links si existen.\n2. Responde concisamente (maximo 3 parrafos cortos).\n3. Se amable y motivador.\n4. Si preguntan por citas, sugiere revisar "Mi Agenda".\n5. No des diagnosticos medicos, siempre sugiere consultar al profesional.\n6. Cuando incluyas un link, formatealo asi: [texto](url)\n\nIMPORTANTE: Responde UNICAMENTE con JSON valido:\n{"reply":"tu respuesta aqui","suggestions":["opcion 1","opcion 2","opcion 3"]}',
  NULL,
  '["patient_name", "faq_context"]'::jsonb,
  0.7,
  800,
  'claude-haiku-4-5-20251001',
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  system_prompt = EXCLUDED.system_prompt,
  description = EXCLUDED.description;

-- chat-with-ai: Visitor/Public System Prompt (leads frios en el home)
INSERT INTO public.ai_prompt_templates (slug, name, category, description, system_prompt, user_prompt_template, variables, temperature, max_tokens, model, is_active)
VALUES (
  'chat-with-ai.visitor',
  'Asistente DentalSpot Visitante',
  'chatbot',
  'System prompt para el chatbot cuando el usuario es un visitante no logueado (lead frio)',
  E'Actua como "Asistente DentalSpot", el asistente comercial de DentalSpot, una plataforma de gestion dental con IA en Chile.\n\n{{faq_context}}\n\nINSTRUCCIONES:\n1. Responde preguntas sobre DentalSpot: planes, precios, funcionalidades, registro y seguridad.\n2. Se amable, profesional y entusiasta sobre el producto.\n3. Responde concisamente (maximo 3 parrafos cortos).\n4. Si preguntan por precios, menciona que hay distintos planes y sugiere visitar la seccion de Planes.\n5. Si preguntan como registrarse, explica los pasos: Registrarse > Completar datos > Elegir plan.\n6. Si preguntan cosas clinicas o de pacientes, sugiere que inicien sesion o consulten a su dentista.\n7. Motiva a registrarse o iniciar sesion para acceder a todas las funcionalidades.\n\nIMPORTANTE: Responde UNICAMENTE con JSON valido:\n{"reply":"tu respuesta aqui","suggestions":["opcion 1","opcion 2","opcion 3"]}',
  NULL,
  '["faq_context"]'::jsonb,
  0.7,
  800,
  'claude-haiku-4-5-20251001',
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  system_prompt = EXCLUDED.system_prompt,
  description = EXCLUDED.description;

-- 3. Seed model configuration in ai_settings
-- =====================================================

INSERT INTO public.ai_settings (key, value, description, category) VALUES
  ('model.chatbot.primary', 'claude-haiku-4-5-20251001', 'Modelo principal del chatbot', 'models'),
  ('model.chatbot.fallback1', 'meta-llama/Llama-3.3-70B-Instruct', 'Fallback 1 chatbot (gratuito)', 'models'),
  ('model.chatbot.fallback2', 'deepseek-ai/DeepSeek-V3', 'Fallback 2 chatbot (gratuito)', 'models'),
  ('temp.chatbot.therapist', '0.3', 'Temperatura chatbot dentista', 'models'),
  ('temp.chatbot.patient', '0.7', 'Temperatura chatbot paciente', 'models'),
  ('tokens.chatbot', '800', 'Max tokens chatbot', 'models')
ON CONFLICT (key) DO NOTHING;

-- 4. Seed initial FAQs for DentalSpot
-- =====================================================

-- Ensure link column exists
ALTER TABLE public.faq_chatbot ADD COLUMN IF NOT EXISTS link text;

INSERT INTO public.faq_chatbot (question, answer, category, link) VALUES
  ('¿Como veo mis proximas citas?', 'Puedes ver tus proximas citas en la seccion "Mi Agenda" del menu lateral o en el panel principal en "Mis Proximas Sesiones".', 'citas', '/dashboard/agenda'),
  ('¿Como contacto a mi dentista?', 'La informacion de tu dentista esta en la tarjeta "Mi Dentista" de tu panel principal. Ahi encontraras su telefono, email y acceso a su perfil.', 'contacto', '/dashboard/patient'),
  ('¿Donde veo mis documentos?', 'Tus documentos clinicos estan en la seccion "Mis Documentos" del panel. Puedes descargarlos haciendo clic en el icono de descarga.', 'documentos', '/dashboard/documentos'),
  ('¿Como veo mi progreso?', 'Tu progreso se muestra en el panel principal con metricas como asistencia, cumplimiento de indicaciones y estado del tratamiento.', 'progreso', '/dashboard/patient'),
  ('¿Que hago si tengo dolor dental?', 'Si tienes dolor dental urgente, contacta directamente a tu dentista. Si es fuera de horario, acude a urgencias dentales. No tomes medicamentos sin consultar primero.', 'urgencias', NULL),
  ('¿Como reagendo una cita?', 'Puedes reagendar tu cita desde "Mi Agenda". Haz clic en la cita que quieres cambiar y selecciona "Reagendar". Tambien puedes contactar directamente a tu dentista.', 'citas', '/dashboard/agenda'),
  ('¿Que debo hacer antes de mi cita?', 'Recomendamos llegar 10 minutos antes, traer tu documento de identidad y seguir las indicaciones previas que te haya dado tu dentista (como ayuno si corresponde).', 'citas', NULL),
  ('¿Como veo mis pagos pendientes?', 'Los pagos pendientes aparecen en tu panel principal. Para detalles de precios o formas de pago, contacta directamente a tu dentista.', 'pagos', '/dashboard/patient')
ON CONFLICT DO NOTHING;
