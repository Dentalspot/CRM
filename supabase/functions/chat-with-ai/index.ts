import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { loadPrompt, loadSettings, interpolatePrompt } from '../_shared/prompt-loader.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userMessage, patientContext, chatHistory, useRAG } = await req.json()
    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'Missing message' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Step 1: Search FAQs for matching answers (always, for all users)
    let faqContext = ''
    try {
      const { data: faqs } = await supabase
        .from('faq_chatbot')
        .select('question, answer, category, link')

      if (faqs?.length) {
        // Simple keyword matching - find FAQs relevant to the user's question
        const queryWords = userMessage.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2)
        const matchedFaqs = faqs
          .map((faq: any) => {
            const faqText = `${faq.question} ${faq.answer} ${faq.category || ''}`.toLowerCase()
            const matchCount = queryWords.filter((w: string) => faqText.includes(w)).length
            return { ...faq, matchCount }
          })
          .filter((faq: any) => faq.matchCount > 0)
          .sort((a: any, b: any) => b.matchCount - a.matchCount)
          .slice(0, 5)

        if (matchedFaqs.length) {
          faqContext = '\n\nBASE DE CONOCIMIENTO (FAQs de Fonokit):\n' +
            matchedFaqs.map((faq: any) =>
              `P: ${faq.question}\nR: ${faq.answer}${faq.link ? `\nLink: ${faq.link}` : ''}`
            ).join('\n\n')
        }
      }
    } catch (e) {
      console.warn('FAQ search failed (non-critical):', e)
    }

    // Step 2: RAG - If therapist asks a clinical question, search their data
    let ragContext = ''
    let ragSources: Array<{ source: string; score: number }> = []

    if (useRAG !== false && patientContext?.role === 'therapist') {
      try {
        const { data: results } = await supabase.rpc('rag_search_clinical', {
          p_therapist_id: patientContext.userId,
          p_query: userMessage,
          p_limit: 6,
        })

        if (results?.length) {
          ragContext = '\n\nCONTEXTO CLINICO DE TUS DATOS:\n' +
            results.map((r: any) => `[${r.source}] ${r.content?.slice(0, 300)}`).join('\n')
          ragSources = results.map((r: any) => ({ source: r.source, score: Math.round((r.relevance || 0) * 100) / 100 }))
        }
      } catch (e) {
        console.warn('RAG search failed (non-critical):', e)
      }
    }

    const isTherapist = patientContext?.role === 'therapist'

    // Load prompt from DB (configurable via admin) with hardcoded fallback
    const promptSlug = isTherapist ? 'chat-with-ai.therapist' : 'chat-with-ai.patient'
    const fallbackSystemPrompt = isTherapist
      ? `Actuas como "Asistente Clinico Fonokit", un asistente inteligente para fonoaudiologos en Chile.\n\nCONTEXTO: Terapeuta: {{therapist_name}}\n{{faq_context}}\n{{rag_context}}\n\nINSTRUCCIONES:\n1. Si hay informacion en la BASE DE CONOCIMIENTO (FAQs), USALA PRIMERO para responder. Incluye los links si existen.\n2. Si hay contexto clinico, USALO para responder con datos reales del terapeuta.\n3. Se profesional y conciso (maximo 3 parrafos).\n4. Puedes sugerir tratamientos, actividades y materiales basandote en la evidencia.\n5. Si no hay datos suficientes, dilo y sugiere donde encontrar la informacion en Fonokit.\n6. Cuando incluyas un link, formatealo asi: [texto](url)\n\nIMPORTANTE: Responde UNICAMENTE con JSON valido:\n{"reply":"tu respuesta aqui","suggestions":["opcion 1","opcion 2"],"sources_used":{{rag_sources}}}`
      : `Actua como "Asistente Fonokit", un asistente virtual empatico para pacientes de fonoaudiologia en Chile.\n\nCONTEXTO: Nombre: {{patient_name}}, Rol: Paciente\n{{faq_context}}\n\nINSTRUCCIONES:\n1. Si hay informacion en la BASE DE CONOCIMIENTO (FAQs), USALA PRIMERO para responder. Incluye los links si existen.\n2. Responde concisamente (maximo 3 parrafos cortos).\n3. Se amable y motivador.\n4. Si preguntan por citas, sugiere revisar "Mi Agenda".\n5. No des diagnosticos medicos, siempre sugiere consultar al profesional.\n6. Cuando incluyas un link, formatealo asi: [texto](url)\n\nIMPORTANTE: Responde UNICAMENTE con JSON valido:\n{"reply":"tu respuesta aqui","suggestions":["opcion 1","opcion 2","opcion 3"]}`

    const promptConfig = await loadPrompt(supabase, promptSlug, {
      system_prompt: fallbackSystemPrompt,
      user_prompt_template: null,
      temperature: isTherapist ? 0.3 : 0.7,
      max_tokens: 800,
      model: 'claude-haiku-4-5-20251001',
    })

    // Load model cascade from DB settings
    const modelSettings = await loadSettings(supabase, {
      'model.chatbot.primary': 'claude-haiku-4-5-20251001',
      'model.chatbot.fallback1': 'meta-llama/Llama-3.3-70B-Instruct',
      'model.chatbot.fallback2': 'deepseek-ai/DeepSeek-V3',
    })

    // Interpolate variables into the prompt template
    const systemPrompt = interpolatePrompt(promptConfig.system_prompt, {
      therapist_name: patientContext?.name || 'Profesional',
      patient_name: patientContext?.name || 'Usuario',
      faq_context: faqContext,
      rag_context: ragContext,
      rag_sources: JSON.stringify(ragSources),
    })

    const userContent = chatHistory?.length
      ? `Historial:\n${chatHistory.slice(-6).map((m: any) => `${m.role}: ${m.content}`).join('\n')}\n\nUsuario: ${userMessage}`
      : userMessage

    let responseText = ''
    let modelUsed = ''

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    const hfToken = Deno.env.get('HF_TOKEN') || Deno.env.get('HUGGING_FACE_API_KEY')

    // Strategy 1: Try primary model (configurable, default Claude Haiku)
    const primaryModel = modelSettings['model.chatbot.primary']
    if (ANTHROPIC_API_KEY && primaryModel.includes('claude')) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: primaryModel,
            max_tokens: promptConfig.max_tokens,
            temperature: promptConfig.temperature,
            system: systemPrompt,
            messages: [{ role: 'user', content: userContent }],
          }),
        })

        if (res.ok) {
          const data = await res.json()
          responseText = data.content?.[0]?.text || ''
          modelUsed = primaryModel
        } else {
          const errText = await res.text()
          console.warn(`Claude failed (${res.status}): ${errText.slice(0, 150)}`)
        }
      } catch (e) {
        console.warn('Claude error:', e)
      }
    }

    // Strategy 2: Fallback 1 (configurable, default Llama 3.3 70B)
    const fallback1Model = modelSettings['model.chatbot.fallback1']
    if (!responseText && hfToken) {
      try {
        const res = await fetch(
          'https://router.huggingface.co/hyperbolic/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${hfToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: fallback1Model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent },
              ],
              max_tokens: promptConfig.max_tokens,
              temperature: promptConfig.temperature,
            }),
          }
        )

        if (res.ok) {
          const data = await res.json()
          responseText = data.choices?.[0]?.message?.content || ''
          modelUsed = fallback1Model
        } else {
          const errText = await res.text()
          console.warn(`Llama failed (${res.status}): ${errText.slice(0, 150)}`)
        }
      } catch (e) {
        console.warn('Llama error:', e)
      }
    }

    // Strategy 3: Fallback 2 (configurable, default DeepSeek-V3)
    const fallback2Model = modelSettings['model.chatbot.fallback2']
    if (!responseText && hfToken) {
      try {
        const res = await fetch(
          'https://router.huggingface.co/hyperbolic/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${hfToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: fallback2Model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent },
              ],
              max_tokens: promptConfig.max_tokens,
              temperature: promptConfig.temperature,
            }),
          }
        )

        if (res.ok) {
          const data = await res.json()
          responseText = data.choices?.[0]?.message?.content || ''
          modelUsed = fallback2Model
        } else {
          const errText = await res.text()
          console.warn(`DeepSeek failed (${res.status}): ${errText.slice(0, 150)}`)
        }
      } catch (e) {
        console.warn('DeepSeek error:', e)
      }
    }

    // Parse JSON response from model
    if (responseText) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          parsed.model = modelUsed
          if (!parsed.sources_used) parsed.sources_used = ragSources
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch {
          // JSON parse failed, wrap raw text
        }
      }

      // Model returned text but not valid JSON - wrap it
      return new Response(JSON.stringify({
        reply: responseText.replace(/```json|```/g, '').trim(),
        suggestions: isTherapist
          ? ['Buscar en mis pacientes', 'Sugerir tratamiento', 'Ver evaluaciones']
          : ['Ver agenda', 'Mis documentos', 'Contactar fono'],
        sources_used: ragSources,
        model: modelUsed,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // All models failed
    return new Response(JSON.stringify({
      reply: 'Lo siento, estoy teniendo problemas tecnicos. Por favor intenta mas tarde.',
      suggestions: ['Reintentar', 'Contactar soporte'],
      model: 'none',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Chat error:', error)
    return new Response(JSON.stringify({
      reply: 'Lo siento, estoy teniendo problemas tecnicos. Por favor intenta mas tarde.',
      suggestions: ['Reintentar', 'Contactar soporte']
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
