import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { loadPrompt, loadSetting, interpolatePrompt } from '../_shared/prompt-loader.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dentalspot.cl',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const hfToken = Deno.env.get('HF_TOKEN') || Deno.env.get('HUGGING_FACE_API_KEY')
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Load configurable prompt and model settings from DB (with hardcoded fallbacks)
    const [soapPromptConfig, whisperModel, analysisModel, analysisFallbackModel] = await Promise.all([
      loadPrompt(supabase, 'process-notiz.soap', {
        system_prompt: 'Eres un asistente clínico experto en fonoaudiología chilena. Respondes SOLO en JSON válido sin markdown.',
        user_prompt_template: null,
        temperature: 0.2,
        max_tokens: 2000,
        model: 'meta-llama/Llama-3.3-70B-Instruct',
      }),
      loadSetting(supabase, 'model.notiz.transcription', 'openai/whisper-large-v3-turbo'),
      loadSetting(supabase, 'model.notiz.analysis', 'meta-llama/Llama-3.3-70B-Instruct'),
      loadSetting(supabase, 'model.notiz.analysis.fallback', 'claude-haiku-4-5-20251001'),
    ])

    const contentType = req.headers.get('content-type') || ''

    // Health check
    if (contentType.includes('application/json')) {
      const body = await req.json()
      if (body.health) {
        return new Response(JSON.stringify({ status: 'ok', providers: { hf: !!hfToken, anthropic: !!anthropicKey } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      // Text-only mode (for process-notiz-text)
      if (body.text) {
        const analysis = await analyzeTranscription(body.text, body.patientContext, hfToken, anthropicKey, soapPromptConfig, analysisFallbackModel)
        return new Response(JSON.stringify({ success: true, analysis }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Long audio mode: download from Storage + transcribe
      if (body.longAudio && body.storagePath) {
        console.log(`Long audio mode: downloading ${body.storagePath}`)
        const { data: audioData, error: dlErr } = await supabase.storage
          .from('audio-sessions')
          .download(body.storagePath)

        if (dlErr || !audioData) {
          return new Response(JSON.stringify({ error: 'No se pudo descargar el audio: ' + (dlErr?.message || 'unknown') }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const audioBuffer = await audioData.arrayBuffer()
        const audioType = body.storagePath.endsWith('.mp4') ? 'audio/mp4' : 'audio/webm'
        console.log(`Downloaded: ${audioBuffer.byteLength} bytes, type: ${audioType}`)

        // Transcribe full audio (Whisper handles chunking internally for long files)
        const transcription = await transcribeAudio(new Uint8Array(audioBuffer), audioType, hfToken!, whisperModel)

        if (!transcription) {
          return new Response(JSON.stringify({
            error: 'No se pudo transcribir el audio largo.',
            debug: { audioSize: audioBuffer.byteLength, audioType }
          }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        console.log(`Long audio transcription: ${transcription.length} chars`)

        // Analyze
        const analysis = await analyzeTranscription(transcription, body.patientContext, hfToken, anthropicKey, soapPromptConfig, analysisFallbackModel)

        // Save to DB
        if (body.therapist_id) {
          await supabase.from('notiz_sessions').insert({
            therapist_id: body.therapist_id,
            patient_id: body.patient_id || null,
            title: body.title || 'Sesión sin título',
            transcript: transcription,
            summary: analysis?.summary || transcription.slice(0, 200),
            metadata: { provider: 'huggingface-long', analysis },
          }).then(({ error }) => error ? console.error('DB save error:', error) : console.log('DB save OK'))
        }

        return new Response(JSON.stringify({ transcription, analysis, provider: 'huggingface-long' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // Audio mode (direct upload, short recordings)
    const formData = await req.formData()
    const audioFile = formData.get('file') as File
    const patientContext = formData.get('patientContext') as string
    const therapistId = formData.get('therapist_id') as string
    const patientId = formData.get('patient_id') as string
    const title = formData.get('title') as string || 'Sesión sin título'

    if (!audioFile) throw new Error('No audio file uploaded')

    console.log(`Processing: ${audioFile.name}, size: ${audioFile.size}, type: ${audioFile.type}`)

    // Validate audio has actual content
    if (audioFile.size < 1000) {
      return new Response(JSON.stringify({
        error: 'El archivo de audio está vacío o es demasiado pequeño. Verifica que el micrófono funcione.',
        debug: { audioSize: audioFile.size, audioType: audioFile.type }
      }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Step 1: Transcribe with HF Whisper (FREE)
    let transcription = ''

    if (!hfToken) {
      return new Response(JSON.stringify({
        error: 'HF_TOKEN no configurado. Configura el token en Supabase Edge Function Secrets.',
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const audioBlob = await audioFile.arrayBuffer()
    const audioType = audioFile.type || 'audio/webm'
    console.log(`Audio: size=${audioBlob.byteLength}, type=${audioType}, name=${audioFile.name}`)

    // Try multiple Whisper endpoints/content-types for Safari mp4 compat
    const contentTypesToTry = [audioType]
    // Safari sends audio/mp4 which some Whisper endpoints struggle with
    // Also try generic types that Whisper handles better
    if (audioType.includes('mp4')) {
      contentTypesToTry.push('audio/mp4', 'audio/mpeg', 'audio/m4a')
    }

    let lastError = ''
    for (const ct of contentTypesToTry) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          console.log(`HF Whisper attempt ${attempt + 1} with Content-Type: ${ct}...`)
          const hfRes = await fetch(
            `https://router.huggingface.co/hf-inference/models/${whisperModel}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${hfToken}`,
                'Content-Type': ct,
              },
              body: new Uint8Array(audioBlob),
            }
          )

          console.log(`HF response: status=${hfRes.status}`)

          if (hfRes.ok) {
            const result = await hfRes.json()
            transcription = result.text?.trim() || ''
            if (transcription) {
              console.log('HF transcription OK:', transcription.slice(0, 100))
              break
            }
            console.warn('HF returned empty text')
          } else if (hfRes.status === 503) {
            const wait = (attempt + 1) * 10000
            console.log(`HF model loading, retry in ${wait / 1000}s...`)
            await new Promise(r => setTimeout(r, wait))
            continue
          } else {
            lastError = await hfRes.text()
            console.error(`HF error (${hfRes.status}):`, lastError.slice(0, 300))
          }
          break
        } catch (e) {
          lastError = String(e)
          console.error(`HF attempt ${attempt + 1} error:`, e)
        }
      }
      if (transcription) break
    }

    if (!transcription) {
      return new Response(JSON.stringify({
        error: 'No se pudo transcribir el audio. Verifica que el micrófono funcione y la grabación tenga audio.',
        debug: { audioSize: audioBlob.byteLength, audioType, lastError: lastError.slice(0, 200) }
      }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Step 2: Analyze with LLM (Llama free → Claude fallback)
    const analysis = await analyzeTranscription(transcription, patientContext, hfToken, anthropicKey, soapPromptConfig, analysisFallbackModel)

    // Step 3: Save to DB
    if (therapistId) {
      const { error: dbErr } = await supabase.from('notiz_sessions').insert({
        therapist_id: therapistId,
        patient_id: patientId || null,
        title,
        transcript: transcription,
        summary: analysis?.summary || transcription,
        duration_seconds: formData.get('duration') ? parseInt(formData.get('duration') as string) : null,
        metadata: { provider: 'huggingface+anthropic', analysis },
      })
      if (dbErr) console.error('DB save error:', dbErr)
      else console.log('DB save OK')
    }

    return new Response(JSON.stringify({ transcription, analysis, provider: 'huggingface+anthropic' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: unknown) {
    console.error('Process-notiz error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// SOAP prompt for clinical note analysis
function buildSOAPPrompt(transcription: string, patientContext?: string): string {
  return `Eres un asistente clínico experto en fonoaudiología. Analiza esta transcripción de sesión y genera una nota clínica en formato SOAP + SMART.

REGLAS ESTRICTAS:
1) Solo usa información EXPLÍCITA de la transcripción. NO inventes datos.
2) Si algo no se menciona, escribe "No reportado" o "No observado".
3) Redacta en tercera persona, tono clínico profesional.
4) En el Plan (P), formula al menos un objetivo SMART (Específico, Medible, Alcanzable, Relevante, con Tiempo).

FORMATO SOAP:
- S (Subjetivo): Lo que reporta el paciente, familia o cuidador. Percepciones, síntomas, cambios en casa, adherencia.
- O (Objetivo): Lo que tú observas/mides. Conductas observables, resultados, porcentajes de logro, respuesta a estímulos, tiempo de atención.
- A (Análisis): Juicio clínico. Interpreta qué significa clínicamente lo observado. Conecta con progreso, barreras, hipótesis clínicas.
- P (Plan): Siguiente foco terapéutico con objetivo SMART, indicaciones, tareas para casa, ajustes del abordaje.

Transcripción: "${transcription}"
${patientContext ? `Contexto del paciente: ${patientContext}` : ''}

Responde SOLO con este JSON (sin texto adicional ni markdown):
{"summary":"resumen ejecutivo en 2-3 líneas","soap":{"subjective":"texto S","objective":"texto O","analysis":"texto A","plan":"texto P con objetivo SMART"},"diagnosis_observations":"observaciones clínicas","symptoms_observed":["síntoma"],"exercises_performed":["actividad"],"patient_progress":"progreso","recommendations":["recomendación"],"key_points":["punto clave"],"next_steps":["próximo paso"],"smart_objective":"objetivo SMART completo"}`
}

// Parse JSON from LLM response
function parseAnalysisJSON(text: string): Record<string, unknown> | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    console.error('JSON parse error from:', jsonMatch[0].slice(0, 200))
    return null
  }
}

// Primary: Llama 3.3 70B via HuggingFace (FREE) — model/prompt configurable from DB
async function analyzeWithLlama(
  transcription: string,
  patientContext: string | undefined,
  hfToken: string,
  promptConfig: { system_prompt: string; user_prompt_template: string | null; temperature: number; max_tokens: number; model: string },
): Promise<Record<string, unknown> | null> {
  const userPrompt = promptConfig.user_prompt_template
    ? interpolatePrompt(promptConfig.user_prompt_template, {
        transcription,
        patient_context: patientContext ? `Contexto del paciente: ${patientContext}` : '',
      })
    : buildSOAPPrompt(transcription, patientContext)

  try {
    console.log(`Trying ${promptConfig.model} for SOAP analysis...`)
    const res = await fetch('https://router.huggingface.co/hyperbolic/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: promptConfig.model,
        messages: [
          { role: 'system', content: promptConfig.system_prompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: promptConfig.max_tokens,
        temperature: promptConfig.temperature,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error(`Llama error (${res.status}):`, errText.slice(0, 200))
      return null
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ''
    console.log('Llama raw:', text.slice(0, 300))
    return parseAnalysisJSON(text)
  } catch (e) {
    console.error('Llama analysis error:', e)
    return null
  }
}

// Fallback: Claude Haiku (paid) — model configurable from DB
async function analyzeWithClaude(
  transcription: string,
  patientContext: string | undefined,
  anthropicKey: string | undefined,
  fallbackModel: string,
  promptConfig: { temperature: number; max_tokens: number },
): Promise<Record<string, unknown> | null> {
  if (!anthropicKey) return null
  const prompt = buildSOAPPrompt(transcription, patientContext)

  try {
    console.log(`Trying ${fallbackModel} for SOAP analysis...`)
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: fallbackModel,
        max_tokens: promptConfig.max_tokens,
        temperature: promptConfig.temperature,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error(`Claude error (${res.status}):`, errText.slice(0, 200))
      return null
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    console.log('Claude raw:', text.slice(0, 300))
    return parseAnalysisJSON(text)
  } catch (e) {
    console.error('Claude analysis error:', e)
    return null
  }
}

// Main analysis: tries Llama (free) → Claude (paid) → basicAnalysis
// Uses DB-configurable prompts/models loaded at startup
async function analyzeTranscription(
  transcription: string,
  patientContext: string | undefined,
  hfToken: string | undefined,
  anthropicKey: string | undefined,
  promptConfig: { system_prompt: string; user_prompt_template: string | null; temperature: number; max_tokens: number; model: string },
  fallbackModel: string,
) {
  // 1. Try primary model (configurable, default Llama free)
  if (hfToken) {
    const result = await analyzeWithLlama(transcription, patientContext, hfToken, promptConfig)
    if (result) { console.log('SOAP via primary model OK'); return result }
  }

  // 2. Try fallback model (configurable, default Claude paid)
  const claudeResult = await analyzeWithClaude(
    transcription, patientContext, anthropicKey,
    fallbackModel,
    { temperature: promptConfig.temperature, max_tokens: promptConfig.max_tokens }
  )
  if (claudeResult) { console.log('SOAP via fallback model OK'); return claudeResult }

  // 3. Basic fallback (no LLM)
  console.warn('All LLM providers failed, using basic analysis')
  return basicAnalysis(transcription)
}

// Reusable transcription function (works for both short and long audio)
async function transcribeAudio(audioBytes: Uint8Array, contentType: string, hfToken: string, whisperModelId: string): Promise<string> {
  const contentTypesToTry = [contentType]
  if (contentType.includes('mp4')) {
    contentTypesToTry.push('audio/mp4', 'audio/mpeg', 'audio/m4a')
  }

  for (const ct of contentTypesToTry) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`Whisper attempt ${attempt + 1}, Content-Type: ${ct}, size: ${audioBytes.byteLength}`)
        const res = await fetch(
          `https://router.huggingface.co/hf-inference/models/${whisperModelId}`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': ct },
            body: audioBytes,
          }
        )

        if (res.ok) {
          const result = await res.json()
          const text = result.text?.trim() || ''
          if (text) { console.log('Transcription OK:', text.slice(0, 80)); return text }
          console.warn('Whisper returned empty text')
        } else if (res.status === 503) {
          const wait = (attempt + 1) * 10000
          console.log(`Model loading, retry in ${wait / 1000}s...`)
          await new Promise(r => setTimeout(r, wait))
          continue
        } else {
          const err = await res.text()
          console.error(`Whisper error (${res.status}):`, err.slice(0, 200))
        }
        break
      } catch (e) {
        console.error(`Whisper attempt ${attempt + 1} error:`, e)
      }
    }
  }
  return ''
}

function basicAnalysis(transcription: string) {
  return {
    summary: transcription.slice(0, 200),
    soap: {
      subjective: 'No reportado',
      objective: transcription.slice(0, 300),
      analysis: 'No especificado — transcripción sin análisis IA',
      plan: 'No especificado',
    },
    smart_objective: '',
    diagnosis_observations: 'No especificado',
    symptoms_observed: [],
    exercises_performed: [],
    patient_progress: 'No especificado',
    recommendations: [],
    key_points: [],
    next_steps: [],
  }
}
