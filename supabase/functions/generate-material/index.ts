import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { hfTextGeneration, stripPII } from '../_shared/hf-client.ts'
import { createSupabaseClient, corsHeaders, jsonResponse, errorResponse } from '../_shared/supabase-client.ts'
import { loadPrompt } from '../_shared/prompt-loader.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createSupabaseClient(req)
    const {
      diagnosis,
      age_range = '3-6 años',
      difficulty = 'intermedio',
      material_type = 'ejercicio',
      objectives = '',
    } = await req.json()

    if (!diagnosis) return errorResponse('diagnosis required', 400)

    // Fetch prompt template via shared loader
    const promptConfig = await loadPrompt(supabase, 'generate-material.default', {
      system_prompt: `Genera un ejercicio terapéutico para ${diagnosis}`,
      user_prompt_template: null,
      temperature: 0.5,
      max_tokens: 1024,
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
    })

    let prompt = promptConfig.system_prompt
      .replace('{{diagnosis}}', stripPII(diagnosis))
      .replace('{{age_range}}', age_range)
      .replace('{{difficulty}}', difficulty)
      .replace('{{material_type}}', material_type)
      .replace('{{objectives}}', stripPII(objectives).slice(0, 300))

    const result = await hfTextGeneration(prompt, { maxTokens: promptConfig.max_tokens, temperature: promptConfig.temperature })

    let material
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      material = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw_response: result }
    } catch {
      material = { raw_response: result }
    }

    // Optionally save to generated_templates
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('generated_templates').insert({
        therapist_id: user.id,
        template_type: material_type,
        patient_info: { diagnosis, age_range, difficulty },
        generated_content: material,
        title: material.titulo || `Material: ${diagnosis}`,
        status: 'draft',
      })
    }

    return jsonResponse({ material, model: 'mistralai/Mistral-7B-Instruct-v0.3' })
  } catch (err) {
    console.error('generate-material error:', err)
    return errorResponse(err.message)
  }
})
