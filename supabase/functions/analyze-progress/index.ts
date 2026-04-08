import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { hfTextGeneration, hfClassification, stripPII } from '../_shared/hf-client.ts'
import { createSupabaseClient, corsHeaders, jsonResponse, errorResponse } from '../_shared/supabase-client.ts'
import { loadPrompt } from '../_shared/prompt-loader.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createSupabaseClient(req)
    const { patient_id, assigned_plan_id, period = '30 días' } = await req.json()

    if (!patient_id) return errorResponse('patient_id required', 400)

    // Fetch session activities with achievement levels
    let query = supabase
      .from('session_activities')
      .select('name, status, achievement_level, notes, created_at, session_id')
      .order('created_at', { ascending: false })
      .limit(50)

    // If plan specified, filter by plan sessions
    if (assigned_plan_id) {
      const { data: sessions } = await supabase
        .from('plan_sessions')
        .select('clinical_history_id')
        .eq('assigned_plan_id', assigned_plan_id)

      if (sessions?.length) {
        // Get session IDs linked to this plan
        const sessionIds = sessions.map(s => s.clinical_history_id).filter(Boolean)
        if (sessionIds.length) {
          query = query.in('session_id', sessionIds)
        }
      }
    }

    const { data: activities } = await query

    // Fetch patient goals
    const { data: goals } = await supabase
      .from('patient_goals')
      .select('title, achieved, goal_type')
      .eq('patient_id', patient_id)

    // Classify overall trend using BART-MNLI
    const activitySummary = (activities || [])
      .map(a => `${a.name}: ${a.achievement_level || a.status}`)
      .join('. ')

    let trendClassification = { label: 'sin_datos', score: 0, scores: {} }
    if (activitySummary.length > 10) {
      trendClassification = await hfClassification(
        activitySummary,
        ['mejora_significativa', 'mejora_leve', 'estancado', 'regresion']
      )
    }

    // Generate detailed analysis with Mistral
    const defaultFallbackPrompt = `Analiza el progreso del paciente: ${activitySummary}`
    const promptConfig = await loadPrompt(supabase, 'analyze-progress.default', {
      system_prompt: defaultFallbackPrompt,
      user_prompt_template: null,
      temperature: 0.3,
      max_tokens: 1024,
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
    })

    const goalsText = (goals || []).map(g => `${g.title} (${g.achieved ? 'logrado' : 'pendiente'})`).join(', ')

    let prompt = promptConfig.system_prompt
      .replace('{{session_data}}', stripPII(activitySummary).slice(0, 800))
      .replace('{{plan_objectives}}', stripPII(goalsText).slice(0, 400))
      .replace('{{period}}', period)

    const result = await hfTextGeneration(prompt, { maxTokens: promptConfig.max_tokens, temperature: promptConfig.temperature })

    let analysis
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw_response: result }
    } catch {
      analysis = { raw_response: result }
    }

    // Merge classification with analysis
    analysis.trend_classification = trendClassification
    analysis.stats = {
      total_activities: activities?.length || 0,
      achieved: activities?.filter(a => a.achievement_level === 'logrado').length || 0,
      in_progress: activities?.filter(a => a.achievement_level === 'en_proceso').length || 0,
      not_achieved: activities?.filter(a => a.achievement_level === 'no_logrado').length || 0,
      goals_total: goals?.length || 0,
      goals_achieved: goals?.filter(g => g.achieved).length || 0,
    }

    return jsonResponse({ analysis, model: 'mistralai/Mistral-7B-Instruct-v0.3 + facebook/bart-large-mnli' })
  } catch (err) {
    console.error('analyze-progress error:', err)
    return errorResponse(err.message)
  }
})
