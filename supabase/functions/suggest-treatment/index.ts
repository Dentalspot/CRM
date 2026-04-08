import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { hfTextGeneration, stripPII } from '../_shared/hf-client.ts'
import { createSupabaseClient, corsHeaders, jsonResponse, errorResponse } from '../_shared/supabase-client.ts'
import { loadPrompt } from '../_shared/prompt-loader.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createSupabaseClient(req)
    const { patient_id, diagnosis, age, history_summary, goals } = await req.json()

    if (!patient_id && !diagnosis) {
      return errorResponse('patient_id or diagnosis required', 400)
    }

    // Fetch patient context if patient_id provided
    let context = { diagnosis, age, history: history_summary || '', goals: goals || '' }

    if (patient_id) {
      const { data: patient } = await supabase
        .from('patients')
        .select('diagnosis_summary, date_of_birth')
        .eq('id', patient_id)
        .single()

      if (patient) {
        context.diagnosis = diagnosis || patient.diagnosis_summary || 'No especificado'
        if (patient.date_of_birth) {
          const birth = new Date(patient.date_of_birth)
          context.age = String(Math.floor((Date.now() - birth.getTime()) / 31557600000))
        }
      }

      // Fetch recent clinical history
      const { data: history } = await supabase
        .from('clinical_history')
        .select('summary, entry_type, entry_date')
        .eq('patient_id', patient_id)
        .order('entry_date', { ascending: false })
        .limit(5)

      if (history?.length) {
        context.history = history.map(h => `${h.entry_type}: ${h.summary}`).join('\n')
      }

      // Fetch current goals
      const { data: patientGoals } = await supabase
        .from('patient_goals')
        .select('title, achieved')
        .eq('patient_id', patient_id)
        .eq('achieved', false)
        .limit(5)

      if (patientGoals?.length) {
        context.goals = patientGoals.map(g => g.title).join(', ')
      }
    }

    // Fetch prompt template via shared loader
    const promptConfig = await loadPrompt(supabase, 'suggest-treatment.default', {
      system_prompt: `Sugiere un plan de tratamiento para: ${context.diagnosis}`,
      user_prompt_template: null,
      temperature: 0.3,
      max_tokens: 1024,
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
    })

    // Replace variables
    let prompt = promptConfig.system_prompt
      .replace('{{diagnosis}}', stripPII(context.diagnosis))
      .replace('{{age}}', context.age || 'No especificada')
      .replace('{{history}}', stripPII(context.history).slice(0, 500))
      .replace('{{goals}}', stripPII(context.goals).slice(0, 300))

    // Generate with Mistral-7B
    const result = await hfTextGeneration(prompt, { maxTokens: promptConfig.max_tokens, temperature: promptConfig.temperature })

    // Try to parse JSON from response
    let suggestion
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      suggestion = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw_response: result }
    } catch {
      suggestion = { raw_response: result }
    }

    // Save to ai_feedback for tracking
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('ai_feedback').insert({
        user_id: user.id,
        feedback_type: 'suggestion',
        context: { patient_id, diagnosis: context.diagnosis },
        suggestion: suggestion,
        status: 'pending',
      }).select()
    }

    return jsonResponse({ suggestion, model: 'mistralai/Mistral-7B-Instruct-v0.3' })
  } catch (err) {
    console.error('suggest-treatment error:', err)
    return errorResponse(err.message)
  }
})
