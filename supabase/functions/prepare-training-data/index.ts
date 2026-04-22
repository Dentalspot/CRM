import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { stripPII } from '../_shared/hf-client.ts'
import { createServiceClient, corsHeaders, jsonResponse, errorResponse } from '../_shared/supabase-client.ts'

/**
 * Prepare Training Data Pipeline
 *
 * Exports platform data as JSONL files for future model fine-tuning.
 * Each dataset type produces input/output pairs suitable for instruction tuning.
 *
 * Datasets:
 * 1. session_notes: transcription → structured analysis
 * 2. treatment_plans: diagnosis context → plan JSON
 * 3. evaluations: scores → interpretation
 * 4. feedback: accepted/rejected suggestions for RLHF
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createServiceClient()
    const { dataset_type, limit = 500 } = await req.json()

    if (!dataset_type) {
      return errorResponse('dataset_type required: session_notes | treatment_plans | evaluations | feedback', 400)
    }

    let jsonlLines: string[] = []

    if (dataset_type === 'session_notes') {
      // Notiz sessions with transcription + extracted analysis
      const { data } = await supabase
        .from('notiz_sessions')
        .select('transcription, summary, extracted_data, key_points, next_steps')
        .not('transcription', 'is', null)
        .not('summary', 'is', null)
        .limit(limit)

      jsonlLines = (data || [])
        .filter((d: any) => d.transcription && d.summary)
        .map((d: any) => JSON.stringify({
          instruction: 'Analiza la siguiente transcripcion de una sesion de fonoaudiologia y genera un resumen clinico estructurado.',
          input: stripPII(d.transcription).slice(0, 2000),
          output: JSON.stringify({
            summary: d.summary,
            key_points: d.key_points || [],
            next_steps: d.next_steps || [],
            extracted_data: d.extracted_data || {},
          }),
        }))

    } else if (dataset_type === 'treatment_plans') {
      // Treatment plans with diagnosis → plan structure
      const { data } = await supabase
        .from('treatment_plans')
        .select('name, description, general_objective, specific_objectives, activities, target_diagnosis, target_population, duration_weeks, number_of_sessions')
        .eq('is_template', true)
        .not('general_objective', 'is', null)
        .limit(limit)

      jsonlLines = (data || [])
        .filter((d: any) => d.general_objective)
        .map((d: any) => JSON.stringify({
          instruction: 'Genera un plan de tratamiento fonoaudiologico estructurado para el siguiente contexto clinico.',
          input: stripPII(`Diagnostico: ${d.target_diagnosis || 'general'}. Poblacion: ${d.target_population || 'no especificada'}. Duracion: ${d.duration_weeks || 12} semanas.`),
          output: JSON.stringify({
            nombre: d.name,
            objetivo_general: d.general_objective,
            objetivos_especificos: d.specific_objectives || [],
            actividades: d.activities || [],
            duracion_semanas: d.duration_weeks,
            sesiones: d.number_of_sessions,
          }),
        }))

    } else if (dataset_type === 'evaluations') {
      // ADI-R evaluations with scores → classification
      const { data: adirData } = await supabase
        .from('adir_evaluations')
        .select('total_a, total_b, total_c, total_d, cumple_criterio_a, cumple_criterio_b, cumple_criterio_c, cumple_criterio_d, clasificacion, verbal_status, observaciones')
        .not('clasificacion', 'is', null)
        .limit(Math.floor(limit / 3))

      const adirLines = (adirData || []).map((d: any) => JSON.stringify({
        instruction: 'Interpreta los siguientes resultados de una evaluacion ADI-R y proporciona una interpretacion clinica.',
        input: `Puntajes - A:${d.total_a}, B:${d.total_b}, C:${d.total_c}, D:${d.total_d}. Status verbal: ${d.verbal_status}. Criterios: A=${d.cumple_criterio_a}, B=${d.cumple_criterio_b}, C=${d.cumple_criterio_c}, D=${d.cumple_criterio_d}.`,
        output: JSON.stringify({
          clasificacion: d.clasificacion,
          observaciones: stripPII(d.observaciones || ''),
        }),
      }))

      // ADOS-2 evaluations
      const { data: adosData } = await supabase
        .from('ados2_evaluations')
        .select('module, total_as, total_crr, total_com, total_global, rango_preocupacion, observaciones')
        .not('rango_preocupacion', 'is', null)
        .limit(Math.floor(limit / 3))

      const adosLines = (adosData || []).map((d: any) => JSON.stringify({
        instruction: 'Interpreta los siguientes resultados de una evaluacion ADOS-2 y proporciona una interpretacion clinica.',
        input: `Modulo: ${d.module}. Puntajes - AS:${d.total_as}, CRR:${d.total_crr}, COM:${d.total_com}, Global:${d.total_global}.`,
        output: JSON.stringify({
          rango_preocupacion: d.rango_preocupacion,
          observaciones: stripPII(d.observaciones || ''),
        }),
      }))

      // Sensorial evaluations
      const { data: sensData } = await supabase
        .from('sensorial_evaluations')
        .select('total_score, overall_classification, atypical_sections, scores_by_section, observaciones')
        .not('overall_classification', 'is', null)
        .limit(Math.floor(limit / 3))

      const sensLines = (sensData || []).map((d: any) => JSON.stringify({
        instruction: 'Interpreta los siguientes resultados de un Perfil Sensorial y proporciona una interpretacion clinica.',
        input: `Puntaje total: ${d.total_score}. Secciones atipicas: ${d.atypical_sections}. Scores por seccion: ${JSON.stringify(d.scores_by_section || {})}.`,
        output: JSON.stringify({
          clasificacion: d.overall_classification,
          observaciones: stripPII(d.observaciones || ''),
        }),
      }))

      jsonlLines = [...adirLines, ...adosLines, ...sensLines]

    } else if (dataset_type === 'feedback') {
      // AI feedback for RLHF-style training
      const { data } = await supabase
        .from('ai_feedback')
        .select('feedback_type, context, suggestion, status, modifications')
        .in('status', ['accepted', 'rejected', 'modified'])
        .limit(limit)

      jsonlLines = (data || [])
        .filter((d: any) => d.suggestion)
        .map((d: any) => JSON.stringify({
          instruction: `Sugerencia de tipo ${d.feedback_type} para contexto clinico.`,
          input: JSON.stringify(d.context || {}),
          output: JSON.stringify(d.suggestion || {}),
          label: d.status, // accepted, rejected, modified
          modifications: d.modifications || null,
        }))

    } else {
      return errorResponse(`Unknown dataset_type: ${dataset_type}. Use: session_notes, treatment_plans, evaluations, feedback`, 400)
    }

    // Generate JSONL content
    const jsonlContent = jsonlLines.join('\n')
    const fileName = `dentalspot_${dataset_type}_${new Date().toISOString().slice(0, 10)}.jsonl`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('patient-documents')
      .upload(`training-data/${fileName}`, new Blob([jsonlContent], { type: 'application/jsonl' }), {
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      // Return data directly if storage fails
      return jsonResponse({
        dataset_type,
        records: jsonlLines.length,
        file_name: fileName,
        storage_error: uploadError.message,
        preview: jsonlLines.slice(0, 3).map(l => JSON.parse(l)),
      })
    }

    // Generate signed URL
    const { data: signedUrl } = await supabase.storage
      .from('patient-documents')
      .createSignedUrl(`training-data/${fileName}`, 3600)

    // Log to task queue
    await supabase.from('ai_task_queue').insert({
      task_type: 'dataset_export',
      input_data: { dataset_type, limit },
      output_data: { records: jsonlLines.length, file_name: fileName },
      status: 'completed',
      processed_at: new Date().toISOString(),
    })

    return jsonResponse({
      dataset_type,
      records: jsonlLines.length,
      file_name: fileName,
      download_url: signedUrl?.signedUrl || null,
      preview: jsonlLines.slice(0, 2).map(l => JSON.parse(l)),
    })
  } catch (err) {
    console.error('prepare-training-data error:', err)
    return errorResponse(err.message)
  }
})
