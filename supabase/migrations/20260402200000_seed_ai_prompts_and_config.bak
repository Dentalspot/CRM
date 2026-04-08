-- =====================================================
-- Create ai_prompt_templates table (if not exists)
-- + Seed all AI prompts currently hardcoded in edge functions
-- + Seed model config in ai_settings
-- =====================================================

-- 1. Ensure ai_prompt_templates has all required columns
-- Table may already exist with basic columns — add missing ones

-- Add slug column (unique key for edge function lookups)
ALTER TABLE public.ai_prompt_templates ADD COLUMN IF NOT EXISTS slug text;

-- Add user_prompt_template for the user message template
ALTER TABLE public.ai_prompt_templates ADD COLUMN IF NOT EXISTS user_prompt_template text;

-- Add model config columns
ALTER TABLE public.ai_prompt_templates ADD COLUMN IF NOT EXISTS temperature numeric(3,2) DEFAULT 0.3;
ALTER TABLE public.ai_prompt_templates ADD COLUMN IF NOT EXISTS max_tokens integer DEFAULT 1000;
ALTER TABLE public.ai_prompt_templates ADD COLUMN IF NOT EXISTS model text DEFAULT 'meta-llama/Llama-3.3-70B-Instruct';

-- Ensure other expected columns exist
ALTER TABLE public.ai_prompt_templates ADD COLUMN IF NOT EXISTS variables jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_prompt_templates ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.ai_prompt_templates ADD COLUMN IF NOT EXISTS system_prompt text;

-- Allow template column to be null (we're migrating to system_prompt)
ALTER TABLE public.ai_prompt_templates ALTER COLUMN template DROP NOT NULL;
-- Set default so inserts don't fail
ALTER TABLE public.ai_prompt_templates ALTER COLUMN template SET DEFAULT '';

-- Make slug unique (only if not already constrained)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_prompt_templates_slug_key'
  ) THEN
    -- First ensure no nulls before adding unique constraint
    UPDATE public.ai_prompt_templates SET slug = id::text WHERE slug IS NULL;
    ALTER TABLE public.ai_prompt_templates ADD CONSTRAINT ai_prompt_templates_slug_key UNIQUE (slug);
  END IF;
END $$;

-- RLS (skip if already enabled)
ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;

-- Policies (skip if exist)
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
END $$;

-- 2. Seed AI Prompts from edge functions
-- =====================================================

-- process-notiz: SOAP Clinical Analysis
INSERT INTO public.ai_prompt_templates (slug, name, category, description, system_prompt, user_prompt_template, variables, temperature, max_tokens, model, is_active)
VALUES (
  'process-notiz.soap',
  'Analisis SOAP Clinico',
  'notiz',
  'Genera nota clinica en formato SOAP + SMART a partir de transcripcion de sesion',
  'Eres un asistente clinico experto en fonoaudiologia chilena. Respondes SOLO en JSON valido sin markdown.',
  E'Eres un asistente clinico experto en fonoaudiologia. Analiza esta transcripcion de sesion y genera una nota clinica en formato SOAP + SMART.\n\nREGLAS ESTRICTAS:\n1) Solo usa informacion EXPLICITA de la transcripcion. NO inventes datos.\n2) Si algo no se menciona, escribe "No reportado" o "No observado".\n3) Redacta en tercera persona, tono clinico profesional.\n4) En el Plan (P), formula al menos un objetivo SMART (Especifico, Medible, Alcanzable, Relevante, con Tiempo).\n\nFORMATO SOAP:\n- S (Subjetivo): Lo que reporta el paciente, familia o cuidador. Percepciones, sintomas, cambios en casa, adherencia.\n- O (Objetivo): Lo que tu observas/mides. Conductas observables, resultados, porcentajes de logro, respuesta a estimulos, tiempo de atencion.\n- A (Analisis): Juicio clinico. Interpreta que significa clinicamente lo observado. Conecta con progreso, barreras, hipotesis clinicas.\n- P (Plan): Siguiente foco terapeutico con objetivo SMART, indicaciones, tareas para casa, ajustes del abordaje.\n\nTranscripcion: "{{transcription}}"\n{{patient_context}}\n\nResponde SOLO con este JSON (sin texto adicional ni markdown):\n{"summary":"resumen ejecutivo en 2-3 lineas","soap":{"subjective":"texto S","objective":"texto O","analysis":"texto A","plan":"texto P con objetivo SMART"},"diagnosis_observations":"observaciones clinicas","symptoms_observed":["sintoma"],"exercises_performed":["actividad"],"patient_progress":"progreso","recommendations":["recomendacion"],"key_points":["punto clave"],"next_steps":["proximo paso"],"smart_objective":"objetivo SMART completo"}',
  '["transcription", "patient_context"]'::jsonb,
  0.2,
  2000,
  'meta-llama/Llama-3.3-70B-Instruct',
  true
) ON CONFLICT (slug) DO NOTHING;

-- chat-with-ai: Therapist System Prompt
INSERT INTO public.ai_prompt_templates (slug, name, category, description, system_prompt, user_prompt_template, variables, temperature, max_tokens, model, is_active)
VALUES (
  'chat-with-ai.therapist',
  'Asistente Clinico Fonokit',
  'chatbot',
  'System prompt para el chatbot cuando el usuario es terapeuta',
  E'Actuas como "Asistente Clinico Fonokit", un asistente inteligente para fonoaudiologos en Chile.\n\nCONTEXTO: Terapeuta: {{therapist_name}}\n{{faq_context}}\n{{rag_context}}\n\nINSTRUCCIONES:\n1. Si hay informacion en la BASE DE CONOCIMIENTO (FAQs), USALA PRIMERO para responder. Incluye los links si existen.\n2. Si hay contexto clinico, USALO para responder con datos reales del terapeuta.\n3. Se profesional y conciso (maximo 3 parrafos).\n4. Puedes sugerir tratamientos, actividades y materiales basandote en la evidencia.\n5. Si no hay datos suficientes, dilo y sugiere donde encontrar la informacion en Fonokit.\n6. Cuando incluyas un link, formatealo asi: [texto](url)\n\nIMPORTANTE: Responde UNICAMENTE con JSON valido:\n{"reply":"tu respuesta aqui","suggestions":["opcion 1","opcion 2"],"sources_used":{{rag_sources}}}',
  NULL,
  '["therapist_name", "faq_context", "rag_context", "rag_sources"]'::jsonb,
  0.3,
  800,
  'meta-llama/Llama-3.3-70B-Instruct',
  true
) ON CONFLICT (slug) DO NOTHING;

-- chat-with-ai: Patient System Prompt
INSERT INTO public.ai_prompt_templates (slug, name, category, description, system_prompt, user_prompt_template, variables, temperature, max_tokens, model, is_active)
VALUES (
  'chat-with-ai.patient',
  'Asistente Fonokit Paciente',
  'chatbot',
  'System prompt para el chatbot cuando el usuario es paciente',
  E'Actua como "Asistente Fonokit", un asistente virtual empatico para pacientes de fonoaudiologia en Chile.\n\nCONTEXTO: Nombre: {{patient_name}}, Rol: Paciente\n{{faq_context}}\n\nINSTRUCCIONES:\n1. Si hay informacion en la BASE DE CONOCIMIENTO (FAQs), USALA PRIMERO para responder. Incluye los links si existen.\n2. Responde concisamente (maximo 3 parrafos cortos).\n3. Se amable y motivador.\n4. Si preguntan por citas, sugiere revisar "Mi Agenda".\n5. No des diagnosticos medicos, siempre sugiere consultar al profesional.\n6. Cuando incluyas un link, formatealo asi: [texto](url)\n\nIMPORTANTE: Responde UNICAMENTE con JSON valido:\n{"reply":"tu respuesta aqui","suggestions":["opcion 1","opcion 2","opcion 3"]}',
  NULL,
  '["patient_name", "faq_context"]'::jsonb,
  0.7,
  800,
  'meta-llama/Llama-3.3-70B-Instruct',
  true
) ON CONFLICT (slug) DO NOTHING;

-- generate-template: Evidence Analyst
INSERT INTO public.ai_prompt_templates (slug, name, category, description, system_prompt, user_prompt_template, variables, temperature, max_tokens, model, is_active)
VALUES (
  'generate-template.evidence-analyst',
  'Analista de Evidencia Cientifica',
  'templates',
  'Analiza articulos PubMed y extrae hallazgos clinicos para planificacion terapeutica',
  E'Eres un investigador clinico especializado en fonoaudiologia basada en evidencia. Tu tarea es analizar articulos cientificos y extraer informacion clinicamente relevante para la planificacion terapeutica.\n\nINSTRUCCIONES:\n- Analiza TODOS los articulos proporcionados\n- Extrae informacion relevante para el diagnostico especifico del paciente\n- Identifica niveles de evidencia (meta-analisis, RCT, estudio de cohorte, caso clinico, revision)\n- Responde SIEMPRE en espanol\n- Se conciso pero completo — otro modelo usara tu analisis para generar el plan de tratamiento',
  E'Diagnostico del paciente: {{diagnosis}}\n\nARTICULOS CIENTIFICOS:\n{{articles_context}}\n\nAnaliza estos articulos y extrae:\n\n1. HALLAZGOS PRINCIPALES: Que dicen los estudios sobre el tratamiento de "{{diagnosis}}"?\n2. TECNICAS VALIDADAS: Que intervenciones/tecnicas tienen mayor soporte empirico? Incluye nombres especificos.\n3. PARAMETROS RECOMENDADOS: Frecuencia de sesiones, duracion del tratamiento, intensidad segun la literatura.\n4. DOSIFICACION: Cuantas repeticiones, minutos por actividad, sesiones por semana recomiendan los estudios?\n5. RESULTADOS ESPERADOS: Que outcomes reportan los estudios? En que plazos?\n6. PRECAUCIONES: Contraindicaciones o factores de riesgo documentados.\n7. NIVEL DE EVIDENCIA: Para cada hallazgo, indica si proviene de [meta-analisis], [RCT], [estudio de cohorte], [revision sistematica], [caso clinico], etc.\n\nCita los articulos por numero [1], [2], etc. en cada punto.',
  '["diagnosis", "articles_context"]'::jsonb,
  0.2,
  1200,
  'meta-llama/Llama-3.3-70B-Instruct',
  true
) ON CONFLICT (slug) DO NOTHING;

-- generate-template: Therapeutic Planner
INSERT INTO public.ai_prompt_templates (slug, name, category, description, system_prompt, user_prompt_template, variables, temperature, max_tokens, model, is_active)
VALUES (
  'generate-template.planner',
  'Planificador Terapeutico',
  'templates',
  'Genera plan de tratamiento estructurado basado en evidencia cientifica',
  E'Eres un fonoaudiologo clinico con 15 anos de experiencia en planificacion terapeutica basada en evidencia. Tu tarea es generar un {{type_description}} profesional, detallado y directamente aplicable en sesion.\n\nINSTRUCCIONES:\n1. USA la sintesis de evidencia proporcionada como base para TODAS tus decisiones clinicas.\n2. Cita la evidencia usando el formato [Autor, Ano] cuando fundamentes actividades o parametros.\n3. Se EXTREMADAMENTE especifico y practico — el terapeuta debe poder usar esto directamente en sesion.\n4. Para cada actividad, incluye pasos detallados, no solo descripciones generales.\n5. Adapta la complejidad al nivel de dificultad indicado.\n6. Si NO se proporcionan objetivos especificos, GENERA objetivos SMART basados en la evidencia cientifica, el diagnostico y la edad del paciente.\n7. Responde SIEMPRE en espanol.\n8. Responde UNICAMENTE con JSON valido en el formato especificado.',
  E'Genera un {{type_description}} para el siguiente caso clinico:\n\nDATOS DEL PACIENTE:\n- Diagnostico/Condicion: {{diagnosis}}\n- Edad: {{age}}\n- Nivel de dificultad: {{difficulty}}\n{{duration_context}}\n{{objectives_context}}\n\nSINTESIS DE EVIDENCIA CIENTIFICA (analizada por modelo experto):\n{{evidence_synthesis}}\n\nGenera el {{type_description}} usando la evidencia analizada. Cada actividad debe estar fundamentada en los hallazgos cientificos. Incluye al menos 2-3 sesiones con actividades detalladas paso a paso.',
  '["type_description", "diagnosis", "age", "difficulty", "duration_context", "objectives_context", "evidence_synthesis"]'::jsonb,
  0.3,
  2500,
  'meta-llama/Llama-3.3-70B-Instruct',
  true
) ON CONFLICT (slug) DO NOTHING;

-- generate-template: Objectives Generator
INSERT INTO public.ai_prompt_templates (slug, name, category, description, system_prompt, user_prompt_template, variables, temperature, max_tokens, model, is_active)
VALUES (
  'generate-template.objectives',
  'Generador de Objetivos SMART',
  'templates',
  'Genera objetivos terapeuticos SMART basados en diagnostico y evidencia',
  E'Eres un fonoaudiologo clinico experto. Genera objetivos terapeuticos SMART (especificos, medibles, alcanzables, relevantes, con tiempo) para un {{type_description}}.\n\nINSTRUCCIONES:\n- Genera entre 4 y 6 objetivos especificos\n- Cada objetivo debe ser medible y alcanzable\n- Basa los objetivos en la evidencia cientifica cuando este disponible\n- Adapta al nivel de dificultad indicado\n- Responde SIEMPRE en espanol\n- Responde UNICAMENTE con un JSON array de strings, ejemplo:\n["Objetivo 1", "Objetivo 2", "Objetivo 3", "Objetivo 4"]',
  E'Diagnostico: {{diagnosis}}\nEdad: {{age}}\nDificultad: {{difficulty}}\nTipo: {{type_description}}\n\nEVIDENCIA DISPONIBLE:\n{{evidence_context}}\n\nGenera 4-6 objetivos especificos para este caso. Solo el JSON array.',
  '["diagnosis", "age", "difficulty", "type_description", "evidence_context"]'::jsonb,
  0.3,
  500,
  'meta-llama/Llama-3.3-70B-Instruct',
  true
) ON CONFLICT (slug) DO NOTHING;

-- 3. Seed model configuration in ai_settings
-- =====================================================

INSERT INTO public.ai_settings (key, value, description, category) VALUES
  ('model.notiz.analysis', 'meta-llama/Llama-3.3-70B-Instruct', 'Modelo para analisis SOAP en Notiz', 'models'),
  ('model.notiz.analysis.fallback', 'claude-haiku-4-5-20251001', 'Modelo fallback para analisis SOAP (pagado)', 'models'),
  ('model.notiz.transcription', 'openai/whisper-large-v3-turbo', 'Modelo Whisper para transcripcion de audio', 'models'),
  ('model.chatbot.primary', 'claude-haiku-4-5-20251001', 'Modelo principal del chatbot', 'models'),
  ('model.chatbot.fallback1', 'meta-llama/Llama-3.3-70B-Instruct', 'Fallback 1 chatbot (gratuito)', 'models'),
  ('model.chatbot.fallback2', 'deepseek-ai/DeepSeek-V3', 'Fallback 2 chatbot (gratuito)', 'models'),
  ('model.templates.analyst', 'meta-llama/Llama-3.3-70B-Instruct', 'Modelo analista de evidencia', 'models'),
  ('model.templates.planner', 'claude-haiku-4-5-20251001', 'Modelo planificador principal', 'models'),
  ('model.templates.planner.fallback1', 'meta-llama/Llama-3.3-70B-Instruct', 'Fallback 1 planificador', 'models'),
  ('model.templates.planner.fallback2', 'deepseek-ai/DeepSeek-V3', 'Fallback 2 planificador', 'models'),
  ('model.templates.objectives', 'meta-llama/Llama-3.3-70B-Instruct', 'Modelo generador de objetivos', 'models'),
  ('temp.notiz.analysis', '0.2', 'Temperatura analisis SOAP', 'models'),
  ('temp.chatbot.therapist', '0.3', 'Temperatura chatbot terapeuta', 'models'),
  ('temp.chatbot.patient', '0.7', 'Temperatura chatbot paciente', 'models'),
  ('temp.templates.analyst', '0.2', 'Temperatura analista evidencia', 'models'),
  ('temp.templates.planner', '0.3', 'Temperatura planificador', 'models'),
  ('tokens.notiz.analysis', '2000', 'Max tokens analisis SOAP', 'models'),
  ('tokens.chatbot', '800', 'Max tokens chatbot', 'models'),
  ('tokens.templates.analyst', '1200', 'Max tokens analista', 'models'),
  ('tokens.templates.planner', '2500', 'Max tokens planificador', 'models'),
  ('tokens.templates.objectives', '500', 'Max tokens objetivos', 'models')
ON CONFLICT (key) DO NOTHING;
