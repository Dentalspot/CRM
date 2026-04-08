import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { hfTextGeneration, stripPII } from '../_shared/hf-client.ts'
import { createSupabaseClient, corsHeaders, jsonResponse, errorResponse } from '../_shared/supabase-client.ts'
import { loadPrompt } from '../_shared/prompt-loader.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createSupabaseClient(req)
    const { evaluation_id, evaluation_type } = await req.json()

    if (!evaluation_id || !evaluation_type) {
      return errorResponse('evaluation_id and evaluation_type required', 400)
    }

    let scores = '', classification = '', observations = ''

    if (evaluation_type === 'adir') {
      const { data: eval_ } = await supabase
        .from('adir_evaluations')
        .select('*')
        .eq('id', evaluation_id)
        .single()
      if (eval_) {
        scores = `A:${eval_.total_a}, B:${eval_.total_b}, C:${eval_.total_c}, D:${eval_.total_d}`
        classification = eval_.clasificacion || 'no determinada'
        observations = eval_.observaciones || ''

        const { data: items } = await supabase
          .from('adir_item_responses')
          .select('domain, algorithm_score')
          .eq('evaluation_id', evaluation_id)

        if (items?.length) {
          const byDomain: Record<string, number[]> = {}
          items.forEach(i => {
            if (!byDomain[i.domain]) byDomain[i.domain] = []
            byDomain[i.domain].push(i.algorithm_score)
          })
          scores += '\nItems por dominio: ' + Object.entries(byDomain)
            .map(([d, vals]) => `${d}: ${vals.join(',')}`)
            .join('; ')
        }
      }
    } else if (evaluation_type === 'ados2') {
      const { data: eval_ } = await supabase
        .from('ados2_evaluations')
        .select('*')
        .eq('id', evaluation_id)
        .single()
      if (eval_) {
        scores = `AS:${eval_.total_as}, CRR:${eval_.total_crr}, COM:${eval_.total_com}, Global:${eval_.total_global}, Módulo:${eval_.module}`
        classification = eval_.rango_preocupacion || 'no determinado'
        observations = eval_.observaciones || ''
      }
    } else if (evaluation_type === 'sensorial') {
      const { data: eval_ } = await supabase
        .from('sensorial_evaluations')
        .select('*')
        .eq('id', evaluation_id)
        .single()
      if (eval_) {
        scores = `Total:${eval_.total_score}, Secciones atípicas:${eval_.atypical_sections}`
        if (eval_.scores_by_section) {
          scores += '\nPor sección: ' + JSON.stringify(eval_.scores_by_section)
        }
        classification = eval_.overall_classification || 'no determinada'
        observations = eval_.observaciones || ''
      }
    } else {
      return errorResponse(`Unknown evaluation_type: ${evaluation_type}`, 400)
    }

    // Fetch prompt template via shared loader
    const promptConfig = await loadPrompt(supabase, 'evaluate-analysis.default', {
      system_prompt: `Interpreta esta evaluación ${evaluation_type}: ${scores}`,
      user_prompt_template: null,
      temperature: 0.2,
      max_tokens: 1024,
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
    })

    let prompt = promptConfig.system_prompt
      .replace('{{eval_type}}', evaluation_type.toUpperCase())
      .replace('{{scores}}', stripPII(scores))
      .replace('{{classification}}', classification)
      .replace('{{observations}}', stripPII(observations).slice(0, 400))

    const result = await hfTextGeneration(prompt, { maxTokens: promptConfig.max_tokens, temperature: promptConfig.temperature })

    let analysis
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw_response: result }
    } catch {
      analysis = { raw_response: result }
    }

    return jsonResponse({ analysis, evaluation_type, model: 'mistralai/Mistral-7B-Instruct-v0.3' })
  } catch (err) {
    console.error('evaluate-analysis error:', err)
    return errorResponse(err.message)
  }
})
