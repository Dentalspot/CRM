import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dentalspot.cl',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

/**
 * Chat about a specific PubMed article
 * Uses Llama 3.3 70B to answer questions about articles in the context of speech-language pathology
 * Saves Q&A pairs for RAG training
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { question, article_title, article_context, evidence_context, history = [] } = await req.json()

    if (!question) return json({ error: 'Se requiere una pregunta' }, 400)

    const hfToken = Deno.env.get('HF_TOKEN') || Deno.env.get('HUGGING_FACE_API_KEY')
    if (!hfToken) return json({ error: 'API key no configurada' }, 500)

    // Build RAG context from previous training data
    let ragContext = ''
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      const { data: examples } = await supabase
        .from('evidence_chat_training')
        .select('question, answer')
        .limit(5)
        .order('created_at', { ascending: false })

      if (examples?.length) {
        ragContext = '\n\nEJEMPLOS PREVIOS DE RESPUESTAS VALIDADAS:\n' +
          examples.map((e: { question: string; answer: string }) =>
            `P: ${e.question}\nR: ${e.answer}`
          ).join('\n\n')
      }
    } catch {}

    const systemPrompt = `Eres un especialista en fonoaudiología basada en evidencia. Responde preguntas sobre artículos científicos de PubMed en español.

CONTEXTO DEL ARTÍCULO:
Título: ${article_title || 'No disponible'}
${article_context || ''}

SÍNTESIS GENERAL DE LA EVIDENCIA:
${evidence_context || ''}
${ragContext}

INSTRUCCIONES:
- Responde en español, de forma concisa y clínica.
- Basa tu respuesta en la información del artículo proporcionado.
- Si la información no está disponible en el contexto, indícalo honestamente.
- Orienta las respuestas hacia la práctica fonoaudiológica.
- Máximo 3 párrafos.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: question },
    ]

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
          messages,
          max_tokens: 600,
          temperature: 0.3,
        }),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error('[chat-evidence] LLM error:', errText)
      return json({ error: 'Error al generar respuesta' }, 500)
    }

    const data = await res.json()
    const answer = data.choices?.[0]?.message?.content || 'No se pudo generar una respuesta.'

    // Save training data
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      await supabase.from('evidence_chat_training').insert({
        question,
        answer,
        article_title: article_title || '',
        context: { article_context: (article_context || '').slice(0, 500), evidence_context: (evidence_context || '').slice(0, 500) },
        status: 'pending',
      }).catch(() => {})
    } catch {}

    return json({ answer, model: 'llama-3.3-70b' })
  } catch (err) {
    console.error('[chat-evidence] Error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})
