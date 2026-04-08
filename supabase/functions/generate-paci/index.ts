import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { stripPII } from '../_shared/hf-client.ts'
import { createSupabaseClient, corsHeaders, jsonResponse, errorResponse } from '../_shared/supabase-client.ts'

async function callLlama(systemPrompt: string, userPrompt: string, hfToken: string): Promise<string> {
  const res = await fetch(
    'https://router.huggingface.co/hyperbolic/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 3000,
        temperature: 0.4,
      }),
    }
  )

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown error')
    throw new Error(`Llama API failed (${res.status}): ${errText}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * Fetch similar PACI examples from training data (RAG context)
 * Searches by diagnosis and NEE type for relevant examples
 */
async function fetchTrainingExamples(
  supabase: any,
  diagnosis: string,
  neeType: string,
  limit = 3
): Promise<string> {
  try {
    // Search by similar diagnosis or NEE type
    let query = supabase
      .from('paci_training_examples')
      .select('diagnosis, nee_type, patient_age, course, evaluation_results, areas')
      .order('created_at', { ascending: false })
      .limit(20)

    const { data } = await query
    if (!data || data.length === 0) return ''

    // Score examples by relevance
    const diagLower = (diagnosis || '').toLowerCase()
    const neeLower = (neeType || '').toLowerCase()

    const scored = data.map((ex: any) => {
      let score = 0
      const exDiag = (ex.diagnosis || '').toLowerCase()
      const exNee = (ex.nee_type || '').toLowerCase()

      // Same diagnosis → high score
      if (exDiag && diagLower && (exDiag.includes(diagLower) || diagLower.includes(exDiag))) score += 3
      // Same NEE type
      if (exNee === neeLower) score += 2
      // Has evaluation results
      if (ex.evaluation_results) score += 1
      // Has areas with objectives
      if (ex.areas?.length > 0) score += 1

      return { ...ex, score }
    })
    .filter((ex: any) => ex.score > 0 && ex.areas?.length > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit)

    if (scored.length === 0) return ''

    // Format examples for prompt context
    const examples = scored.map((ex: any, i: number) => {
      const areasText = (ex.areas || []).map((area: any) => {
        const objs = (area.objetivos_especificos || [])
          .map((o: any) => `  - ${o.texto || ''}`)
          .join('\n')
        return `  Área: ${area.label || area.key}\n  Necesidad: ${area.necesidad || ''}\n  Objetivo general: ${area.objetivo_general || ''}\n  Objetivos específicos:\n${objs}`
      }).join('\n\n')

      return `--- Ejemplo ${i + 1} (${ex.diagnosis || 'sin dx'}, ${ex.patient_age || ''}, ${ex.nee_type || ''}) ---\nEvaluaciones: ${(ex.evaluation_results || '').slice(0, 300)}\n${areasText}`
    }).join('\n\n')

    return examples
  } catch (err) {
    console.error('Error fetching training examples:', err)
    return ''
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const hfToken = Deno.env.get('HF_TOKEN') || Deno.env.get('HUGGING_FACE_API_KEY')
    if (!hfToken) return errorResponse('Missing HF_TOKEN', 500)

    const supabase = createSupabaseClient(req)

    const {
      patient_name = '',
      patient_age = '',
      course = '',
      nee_type = 'transitoria',
      diagnosis = '',
      evaluation_results = '',
      period = '',
    } = await req.json()

    if (!evaluation_results && !diagnosis) {
      return errorResponse('Se requiere diagnosis o evaluation_results', 400)
    }

    // RAG: fetch similar training examples
    const trainingContext = await fetchTrainingExamples(supabase, diagnosis, nee_type, 3)

    const systemPrompt = `Eres un fonoaudiólogo escolar experto en PIE (Programa de Integración Escolar) en Chile, con conocimiento del Decreto 83/2015 y Decreto 170/2009.

Tu tarea es generar un PACI (Plan de Adecuación Curricular Individual) personalizado basado en los resultados de evaluación del estudiante.

${trainingContext ? `EJEMPLOS DE REFERENCIA de PACIs anteriores exitosos (usa estos como guía de estilo, nivel de detalle y estructura, pero personaliza según el caso actual):

${trainingContext}

FIN DE EJEMPLOS DE REFERENCIA.
` : ''}
Responde ÚNICAMENTE con un JSON válido (sin texto adicional, sin markdown, sin backticks) con esta estructura:

{
  "areas_intervencion": [
    {
      "area": "nombre del área (Fonoaudiológica, Pedagógica, Socioemocional, etc.)",
      "objetivo_general": "objetivo general del área",
      "objetivos_especificos": [
        {
          "texto": "objetivo específico medible y observable (formato SMART)",
          "estrategia": "estrategia metodológica concreta y aplicable",
          "recursos": "materiales necesarios",
          "indicador_logro": "criterio claro para evaluar el logro"
        }
      ],
      "adecuacion_tipo": "acceso o objetivos",
      "asignaturas": ["asignaturas donde aplica"]
    }
  ],
  "estrategias_aula": ["estrategias concretas para el aula regular"],
  "apoyos_especializados": ["apoyos fonoaudiológicos específicos"],
  "orientaciones_familia": ["orientaciones prácticas para la familia"]
}`

    const userPrompt = `Genera el PACI para:
- Estudiante: ${stripPII(patient_name)}, ${patient_age}
- Curso: ${course}
- NEE: ${nee_type}
- Diagnóstico: ${stripPII(diagnosis)}
- Período: ${period}

Resultados de evaluaciones:
${stripPII(evaluation_results).slice(0, 2000)}

IMPORTANTE:
- Los objetivos deben ser SMART (específicos, medibles, alcanzables, relevantes, con tiempo)
- Priorizar las áreas más deficitarias según los resultados
- Incluir al menos 2-3 objetivos específicos por área deficitaria
- Las estrategias deben ser prácticas y aplicables en contexto escolar chileno
- Considerar la edad y curso del estudiante`

    const result = await callLlama(systemPrompt, userPrompt, hfToken)

    let paci
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      paci = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw_response: result }
    } catch {
      paci = { raw_response: result }
    }

    return jsonResponse({
      paci,
      training_examples_used: trainingContext ? true : false,
    })
  } catch (err) {
    console.error('generate-paci error:', err)
    return errorResponse(err.message)
  }
})
