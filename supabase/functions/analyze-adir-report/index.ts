/**
 * analyze-adir-report — AI Clinical Analysis for ADI-R Reports + RAG
 *
 * Takes ADI-R domain scores and generates clinical interpretation.
 * Uses RAG from tea_training_examples for context.
 * Llama 3.3 70B → Claude Haiku fallback.
 * Saves output as training example.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { stripPII } from '../_shared/hf-client.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── RAG ───
async function fetchTrainingExamples(supabase: any, verbalStatus: string, clasificacion: string, limit = 2): Promise<string> {
  try {
    const { data } = await supabase
      .from('tea_training_examples')
      .select('eval_scores, clinical_analysis, verbal_status')
      .eq('eval_type', 'adir')
      .order('created_at', { ascending: false })
      .limit(15)

    if (!data?.length) return ''

    const scored = data
      .map((ex: any) => {
        let score = 0
        if (ex.verbal_status === verbalStatus) score += 3
        const s = ex.eval_scores || {}
        if (s.clasificacion === clasificacion) score += 2
        if (ex.clinical_analysis?.length > 50) score += 1
        return { ...ex, score }
      })
      .filter((ex: any) => ex.score > 0 && ex.clinical_analysis)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, limit)

    if (!scored.length) return ''

    return scored.map((ex: any, i: number) => {
      const s = ex.eval_scores || {}
      return `--- Ejemplo ${i + 1} (${s.verbal_status || '?'}, clasificación: ${s.clasificacion || '?'}, A:${s.total_a} B:${s.total_b} C:${s.total_c} D:${s.total_d}) ---\n${(ex.clinical_analysis || '').slice(0, 500)}`
    }).join('\n\n')
  } catch { return '' }
}

async function saveTrainingExample(supabase: any, evalData: any, analysis: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('tea_training_examples').insert({
      therapist_id: user.id,
      eval_type: 'adir',
      eval_scores: {
        verbal_status: evalData.verbal_status,
        total_a: evalData.total_a,
        total_b: evalData.total_b,
        total_c: evalData.total_c,
        total_d: evalData.total_d,
        clasificacion: evalData.clasificacion,
      },
      verbal_status: evalData.verbal_status,
      clinical_analysis: analysis,
      source: 'ai_generated',
    })
  } catch { /* non-blocking */ }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { evaluationData, patientFirstName } = await req.json()
    if (!evaluationData) {
      return new Response(JSON.stringify({ error: 'Missing evaluationData' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // RAG
    const trainingContext = await fetchTrainingExamples(supabase, evaluationData.verbal_status, evaluationData.clasificacion, 2)

    const ragCtx = trainingContext
      ? `\nEJEMPLOS DE ANÁLISIS ANTERIORES VALIDADOS:\n${trainingContext}\nFIN DE EJEMPLOS.\n`
      : ''

    const systemPrompt = `Eres un neuropsicólogo clínico especialista en TEA con experiencia en la entrevista diagnóstica ADI-R (Autism Diagnostic Interview - Revised).

Analiza los puntajes por dominio del ADI-R y genera:

1. PERFIL DIAGNÓSTICO: Interpreta los puntajes de cada dominio en relación a los puntos de corte. Indica cuáles dominios cumplen criterio y cuáles no.

2. ÁREAS DE MAYOR COMPROMISO: Identifica los dominios con mayor severidad según los puntajes y describe las implicancias clínicas.

3. FORTALEZAS RELATIVAS: Identifica dominios con menor compromiso o áreas preservadas.

4. RECOMENDACIONES: 4-5 intervenciones específicas basadas en el perfil, considerando el estatus verbal del evaluado.

Responde en español. Conciso y clínico. Máximo 400 palabras en prosa.`

    const userMessage = `Entrevista ADI-R
Paciente: ${stripPII(patientFirstName || 'Evaluado/a')}
Estatus verbal: ${evaluationData.verbal_status || 'verbal'}
Clasificación: ${evaluationData.clasificacion || 'No calculada'}

Puntajes por dominio:
- Dominio A (Interacción social recíproca): ${evaluationData.total_a ?? 'N/A'} (corte: 10)
- Dominio B${evaluationData.verbal_status === 'verbal' ? ' verbal' : ' no verbal'} (Comunicación): ${evaluationData.total_b ?? 'N/A'} (corte: ${evaluationData.verbal_status === 'verbal' ? '8' : '5'})
- Dominio C (Conductas restringidas/repetitivas): ${evaluationData.total_c ?? 'N/A'} (corte: 3)
- Dominio D (Alteraciones del desarrollo <36m): ${evaluationData.total_d ?? 'N/A'} (corte: 1)

Cumple criterio A: ${(evaluationData.total_a ?? 0) >= 10 ? 'Sí' : 'No'}
Cumple criterio B: ${(evaluationData.total_b ?? 0) >= (evaluationData.verbal_status === 'verbal' ? 8 : 5) ? 'Sí' : 'No'}
Cumple criterio C: ${(evaluationData.total_c ?? 0) >= 3 ? 'Sí' : 'No'}
Cumple criterio D: ${(evaluationData.total_d ?? 0) >= 1 ? 'Sí' : 'No'}
${ragCtx}
${evaluationData.responses ? `\nÍtems con mayor puntaje:\n${evaluationData.responses.filter((r: any) => (r.algorithm_score ?? 0) >= 2).map((r: any) => `${r.item_code}: ${r.item_name} = ${r.algorithm_score}`).join('\n')}` : ''}

Genera el análisis clínico.`

    // Call LLM
    let responseText = '', modelUsed = ''
    const hfToken = Deno.env.get('HF_TOKEN') || Deno.env.get('HUGGING_FACE_API_KEY')
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (hfToken) {
      try {
        const res = await fetch('https://router.huggingface.co/hyperbolic/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'meta-llama/Llama-3.3-70B-Instruct',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
            max_tokens: 800, temperature: 0.3,
          }),
        })
        if (res.ok) { const d = await res.json(); responseText = d.choices?.[0]?.message?.content || ''; modelUsed = 'Llama-3.3-70B' }
      } catch (e) { console.warn('[ADI-R] Llama error:', e) }
    }

    if (!responseText && anthropicKey) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001', max_tokens: 800, temperature: 0.3,
            system: systemPrompt, messages: [{ role: 'user', content: userMessage }],
          }),
        })
        if (res.ok) { const d = await res.json(); responseText = d.content?.[0]?.text || ''; modelUsed = 'claude-haiku' }
      } catch (e) { console.warn('[ADI-R] Claude error:', e) }
    }

    if (!responseText) {
      return new Response(JSON.stringify({ error: 'No AI model available' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Save training (non-blocking)
    saveTrainingExample(supabase, evaluationData, responseText)

    return new Response(JSON.stringify({
      analysis: responseText,
      model_used: modelUsed,
      training_examples_used: !!trainingContext,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('[ADI-R]', e)
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
