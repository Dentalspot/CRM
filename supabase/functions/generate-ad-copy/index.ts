/**
 * @file generate-ad-copy/index.ts
 * @description Genera copy para anuncios de Meta Ads usando IA.
 * Produce: primary_text, headline, description en multiples variaciones.
 * Lee prompt configurable desde ai_prompt_templates (slug: generate-ad-copy.meta).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dentalspot.cl',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fallback prompt if DB prompt not found
const FALLBACK_SYSTEM_PROMPT = `Eres un experto en copywriting publicitario para Meta Ads (Facebook e Instagram).
Tu trabajo es generar copy persuasivo, conciso y orientado a conversion para anuncios digitales.

REGLAS:
- El primary_text (texto principal) debe tener maximo 125 caracteres para no ser cortado
- El headline debe tener maximo 40 caracteres
- La description debe tener maximo 30 caracteres
- Usa emojis estrategicamente (1-2 por texto, no mas)
- El tono debe ser profesional pero cercano
- Incluye un call-to-action claro
- Adapta el mensaje al objetivo de la campana
- Genera exactamente el numero de variaciones solicitadas
- El publico objetivo es Chile (usa lenguaje chileno cuando sea apropiado)

FORMATO DE RESPUESTA (JSON estricto):
{
  "variations": [
    {
      "primary_text": "Texto principal del anuncio",
      "headline": "Titulo corto",
      "description": "Descripcion breve",
      "cta": "Accion sugerida (ej: Registrate, Saber mas, Comprar)"
    }
  ]
}`

const FALLBACK_USER_TEMPLATE = `Genera {{count}} variaciones de copy para un anuncio de Meta Ads con estos parametros:

**Servicio/Producto:** {{product}}
**Publico objetivo:** {{audience}}
**Objetivo de campana:** {{objective}}
**Tono:** {{tone}}
{{#if extra_context}}
**Contexto adicional:** {{extra_context}}
{{/if}}

Responde SOLO con el JSON, sin texto adicional.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- Auth ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- Parse body ---
    const body = await req.json()
    const {
      product = 'DentalSpot — plataforma para dentistas',
      audience = 'Dentistas en Chile',
      objective = 'leads',
      tone = 'profesional y cercano',
      count = 3,
      extra_context = '',
    } = body

    // --- Load configurable prompt from DB ---
    let systemPrompt = FALLBACK_SYSTEM_PROMPT
    let userTemplate = FALLBACK_USER_TEMPLATE
    let model = 'meta-llama/Llama-3.3-70B-Instruct'
    let temperature = 0.7
    let maxTokens = 2000

    try {
      const { data: promptConfig } = await supabase
        .from('ai_prompt_templates')
        .select('system_prompt, user_prompt_template, model, temperature, max_tokens')
        .eq('slug', 'generate-ad-copy.meta')
        .eq('is_active', true)
        .single()

      if (promptConfig) {
        if (promptConfig.system_prompt) systemPrompt = promptConfig.system_prompt
        if (promptConfig.user_prompt_template) userTemplate = promptConfig.user_prompt_template
        if (promptConfig.model) model = promptConfig.model
        if (promptConfig.temperature) temperature = Number(promptConfig.temperature)
        if (promptConfig.max_tokens) maxTokens = Number(promptConfig.max_tokens)
      }
    } catch {
      // Use fallbacks silently
    }

    // --- Interpolate user prompt ---
    const OBJECTIVE_LABELS: Record<string, string> = {
      leads: 'Generacion de leads (registros)',
      awareness: 'Reconocimiento de marca',
      traffic: 'Trafico al sitio web',
      sales: 'Ventas / conversiones',
      engagement: 'Interaccion y engagement',
      app: 'Instalaciones de app',
    }

    const userPrompt = userTemplate
      .replace(/\{\{count\}\}/g, String(count))
      .replace(/\{\{product\}\}/g, product)
      .replace(/\{\{audience\}\}/g, audience)
      .replace(/\{\{objective\}\}/g, OBJECTIVE_LABELS[objective] || objective)
      .replace(/\{\{tone\}\}/g, tone)
      .replace(/\{\{extra_context\}\}/g, extra_context)
      .replace(/\{\{#if extra_context\}\}([\s\S]*?)\{\{\/if\}\}/g, extra_context ? '$1' : '')

    // --- Call LLM via OpenRouter ---
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!openRouterKey) {
      return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://dentalspot.cl',
        'X-Title': 'DentalSpot Ad Copy Generator',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
    })

    const llmData = await llmResponse.json()

    if (!llmResponse.ok) {
      console.error('[generate-ad-copy] LLM error:', JSON.stringify(llmData))
      return new Response(JSON.stringify({ error: 'LLM request failed', details: llmData }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rawContent = llmData.choices?.[0]?.message?.content || '{}'

    // Parse JSON from LLM response
    let variations = []
    try {
      const parsed = JSON.parse(rawContent)
      variations = parsed.variations || parsed.results || [parsed]
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1])
        variations = parsed.variations || parsed.results || [parsed]
      } else {
        variations = [{ primary_text: rawContent, headline: '', description: '', cta: '' }]
      }
    }

    return new Response(JSON.stringify({
      success: true,
      variations,
      model,
      usage: llmData.usage || null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[generate-ad-copy] Error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
