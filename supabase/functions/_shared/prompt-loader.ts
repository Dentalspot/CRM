/**
 * Shared Prompt Loader — Reads prompts and settings from DB with hardcoded fallbacks
 * Used by all edge functions to enable admin prompt engineering via UI
 */

interface PromptConfig {
  system_prompt: string
  user_prompt_template: string | null
  temperature: number
  max_tokens: number
  model: string
}

interface SupabaseClient {
  from: (table: string) => any
}

/**
 * Load a prompt template from ai_prompt_templates by slug.
 * Falls back to hardcoded defaults if DB query fails or returns null.
 */
export async function loadPrompt(
  supabase: SupabaseClient,
  slug: string,
  fallback: PromptConfig
): Promise<PromptConfig> {
  try {
    const { data, error } = await supabase
      .from('ai_prompt_templates')
      .select('system_prompt, user_prompt_template, temperature, max_tokens, model')
      .eq('slug', slug)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (error || !data) {
      console.log(`[prompt-loader] No DB prompt for "${slug}", using fallback`)
      return fallback
    }

    console.log(`[prompt-loader] Loaded prompt "${slug}" from DB`)
    return {
      system_prompt: data.system_prompt || fallback.system_prompt,
      user_prompt_template: data.user_prompt_template || fallback.user_prompt_template,
      temperature: data.temperature ?? fallback.temperature,
      max_tokens: data.max_tokens ?? fallback.max_tokens,
      model: data.model || fallback.model,
    }
  } catch (e) {
    console.warn(`[prompt-loader] Error loading "${slug}":`, e)
    return fallback
  }
}

/**
 * Load a single setting value from ai_settings by key.
 * Falls back to provided default if DB query fails.
 */
export async function loadSetting(
  supabase: SupabaseClient,
  key: string,
  fallback: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', key)
      .limit(1)
      .single()

    if (error || !data) {
      return fallback
    }

    return data.value || fallback
  } catch {
    return fallback
  }
}

/**
 * Load multiple settings at once (batch).
 * Returns a map of key -> value with fallbacks applied.
 */
export async function loadSettings(
  supabase: SupabaseClient,
  keys: Record<string, string> // { settingKey: fallbackValue }
): Promise<Record<string, string>> {
  const result: Record<string, string> = { ...keys }

  try {
    const keyList = Object.keys(keys)
    const { data, error } = await supabase
      .from('ai_settings')
      .select('key, value')
      .in('key', keyList)

    if (!error && data) {
      for (const row of data) {
        if (row.value) result[row.key] = row.value
      }
    }
  } catch {
    // Return all fallbacks
  }

  return result
}

/**
 * Replace {{variables}} in a prompt template with actual values.
 */
export function interpolatePrompt(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '')
  }
  return result
}
