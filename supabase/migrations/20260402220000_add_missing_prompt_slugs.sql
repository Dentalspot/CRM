-- Add slug-based prompt entries for edge functions migrated to shared prompt-loader
-- These functions previously used category-based lookup (.eq('category', '...'))
-- Now they use slug-based lookup via loadPrompt(supabase, 'slug', fallback)

INSERT INTO ai_prompt_templates (slug, name, category, description, is_active, temperature, max_tokens, model)
VALUES
  ('analyze-progress.default',   'Analisis de Progreso',       'progress',   'Analiza progreso del paciente basado en sesiones',           true, 0.3, 1024, 'mistralai/Mistral-7B-Instruct-v0.3'),
  ('generate-material.default',  'Generador de Material',      'material',   'Genera material terapeutico personalizado',                  true, 0.5, 1024, 'mistralai/Mistral-7B-Instruct-v0.3'),
  ('evaluate-analysis.default',  'Evaluador de Analisis',      'evaluation', 'Evalua y analiza resultados de evaluaciones clinicas',       true, 0.2, 1024, 'mistralai/Mistral-7B-Instruct-v0.3'),
  ('suggest-treatment.default',  'Sugerencias de Tratamiento', 'treatment',  'Sugiere planes de tratamiento basados en diagnostico',      true, 0.3, 1024, 'mistralai/Mistral-7B-Instruct-v0.3')
ON CONFLICT (slug) DO NOTHING;

-- Copy system_prompt from existing category-based entries (if any) to the new slug-based entries
-- This preserves any prompts that were previously configured via the admin UI
UPDATE ai_prompt_templates new_row
SET
  system_prompt        = COALESCE(new_row.system_prompt, old_row.system_prompt),
  user_prompt_template = COALESCE(new_row.user_prompt_template, old_row.user_prompt_template)
FROM (
  SELECT DISTINCT ON (category) category, system_prompt, user_prompt_template
  FROM ai_prompt_templates
  WHERE slug IS NULL OR slug NOT LIKE '%.default'
  ORDER BY category, updated_at DESC NULLS LAST
) old_row
WHERE new_row.slug = old_row.category || '.default'
  AND new_row.system_prompt IS NULL;
