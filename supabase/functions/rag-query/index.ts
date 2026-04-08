import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

/**
 * RAG Query Engine for Fonokit
 *
 * Flow: Question → Embed → Vector Search + Text Search → Build Context → Generate Answer
 *
 * Uses:
 * - MiniLM-L6-v2 for embeddings (HuggingFace free)
 * - pgvector for similarity search (ai_embeddings table)
 * - pg_trgm for text search fallback (clinical_history, notiz_sessions, treatment_plans)
 * - Mistral-7B or Claude Haiku for answer generation
 *
 * Modes:
 * - "clinical": Search therapist's own clinical data
 * - "knowledge": Search marketplace, activity library, general knowledge
 * - "patient": Search specific patient's records
 * - "auto": Detect best mode from question
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get authenticated user
    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await userClient.auth.getUser()

    const { question, mode = 'auto', patient_id, max_context = 5 } = await req.json()

    if (!question) return json({ error: 'question required' }, 400)
    if (!user) return json({ error: 'authentication required' }, 401)

    const hfToken = Deno.env.get('HF_TOKEN') || Deno.env.get('HUGGING_FACE_API_KEY')
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    // Step 1: Generate embedding for the question
    let queryEmbedding: number[] | null = null
    if (hfToken) {
      try {
        const embRes = await fetch(
          'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2',
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: question }),
          }
        )
        if (embRes.ok) {
          const embData = await embRes.json()
          queryEmbedding = Array.isArray(embData[0]) ? embData[0] : embData
        }
      } catch (e) {
        console.warn('Embedding failed, falling back to text search:', e)
      }
    }

    // Step 2: Search for relevant context
    const contexts: Array<{ source: string; content: string; metadata: Record<string, unknown>; score: number }> = []

    // 2a: Vector search (if embedding available)
    if (queryEmbedding) {
      const sourceFilter = mode === 'knowledge' ? 'marketplace_items' : null
      const { data: vectorResults } = await supabase.rpc('match_embeddings', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: 0.3,
        match_count: max_context,
        source_filter: sourceFilter,
      })

      if (vectorResults?.length) {
        vectorResults.forEach((r: any) => {
          contexts.push({
            source: r.source_table,
            content: r.text_content,
            metadata: { source_id: r.source_id },
            score: r.similarity,
          })
        })
      }
    }

    // 2b: Clinical text search (always, for therapist-specific data)
    if (mode !== 'knowledge') {
      const { data: clinicalResults } = await supabase.rpc('rag_search_clinical', {
        p_therapist_id: user.id,
        p_query: question,
        p_limit: max_context * 2,
      })

      if (clinicalResults?.length) {
        clinicalResults.forEach((r: any) => {
          contexts.push({
            source: r.source,
            content: r.content?.slice(0, 500) || '',
            metadata: r.metadata || {},
            score: r.relevance || 0,
          })
        })
      }
    }

    // 2c: Patient-specific search
    if (patient_id) {
      const { data: patientHistory } = await supabase
        .from('clinical_history')
        .select('summary, entry_type, entry_date, session_notes')
        .eq('patient_id', patient_id)
        .eq('therapist_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(5)

      if (patientHistory?.length) {
        patientHistory.forEach((h: any) => {
          contexts.push({
            source: 'patient_history',
            content: `${h.entry_type} (${h.entry_date}): ${h.summary || ''} ${h.session_notes || ''}`.slice(0, 400),
            metadata: { patient_id, entry_date: h.entry_date },
            score: 0.8,
          })
        })
      }

      // Patient goals
      const { data: goals } = await supabase
        .from('patient_goals')
        .select('title, achieved, goal_type')
        .eq('patient_id', patient_id)
        .limit(5)

      if (goals?.length) {
        contexts.push({
          source: 'patient_goals',
          content: goals.map((g: any) => `${g.goal_type}: ${g.title} (${g.achieved ? 'logrado' : 'pendiente'})`).join('. '),
          metadata: { patient_id },
          score: 0.7,
        })
      }

      // Patient diagnoses
      const { data: diagnoses } = await supabase
        .from('patient_diagnoses')
        .select('diagnosis_name, severity, is_primary')
        .eq('patient_id', patient_id)
        .eq('is_active', true)

      if (diagnoses?.length) {
        contexts.push({
          source: 'patient_diagnoses',
          content: diagnoses.map((d: any) => `${d.diagnosis_name} (${d.severity || 'sin severidad'}${d.is_primary ? ', principal' : ''})`).join('. '),
          metadata: { patient_id },
          score: 0.9,
        })
      }
    }

    // Deduplicate and sort by score
    const uniqueContexts = contexts
      .sort((a, b) => b.score - a.score)
      .slice(0, max_context)

    // Step 3: Generate answer with context
    const contextText = uniqueContexts.map((c, i) =>
      `[${c.source}] ${c.content}`
    ).join('\n\n')

    const systemPrompt = `Eres un asistente clinico especializado en fonoaudiologia para la plataforma Fonokit.
Responde SOLO basandote en el contexto proporcionado. Si no hay informacion suficiente, dilo claramente.
Se conciso, profesional y en español. No inventes datos clinicos.
Si mencionas datos de pacientes, usa solo lo que esta en el contexto.`

    const userPrompt = `Contexto clinico:
${contextText || 'No se encontro contexto relevante.'}

Pregunta: ${question}

Responde de forma clara y profesional:`

    let answer = ''
    let model = ''

    // Try Claude Haiku first (better quality), fallback to Mistral
    if (anthropicKey) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1000,
            temperature: 0.2,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        })

        if (res.ok) {
          const data = await res.json()
          answer = data.content?.[0]?.text || ''
          model = 'claude-haiku-4-5'
        }
      } catch (e) {
        console.warn('Claude failed, trying Mistral:', e)
      }
    }

    // Fallback to Llama 3.3 70B via HuggingFace Hyperbolic (FREE)
    if (!answer && hfToken) {
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
              model: 'meta-llama/Llama-3.3-70B-Instruct',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              max_tokens: 1000,
              temperature: 0.2,
            }),
          }
        )

        if (res.ok) {
          const data = await res.json()
          answer = data.choices?.[0]?.message?.content || ''
          model = 'llama-3.3-70b'
        }
      } catch (e) {
        console.error('Llama failed:', e)
      }
    }

    // Fallback 2: DeepSeek-V3 via HuggingFace Hyperbolic (FREE)
    if (!answer && hfToken) {
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
              model: 'deepseek-ai/DeepSeek-V3',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              max_tokens: 1000,
              temperature: 0.2,
            }),
          }
        )

        if (res.ok) {
          const data = await res.json()
          answer = data.choices?.[0]?.message?.content || ''
          model = 'deepseek-v3'
        }
      } catch (e) {
        console.error('DeepSeek failed:', e)
      }
    }

    if (!answer) {
      answer = 'No pude generar una respuesta. Verifica que las API keys esten configuradas.'
    }

    // Log the query for feedback/improvement
    await supabase.from('ai_feedback').insert({
      user_id: user.id,
      feedback_type: 'rag_query',
      context: { question, mode, patient_id, contexts_found: uniqueContexts.length },
      suggestion: { answer, model },
      status: 'pending',
    }).catch(() => {})

    return json({
      answer,
      model,
      sources: uniqueContexts.map(c => ({ source: c.source, score: Math.round(c.score * 100) / 100, metadata: c.metadata })),
      contexts_used: uniqueContexts.length,
    })
  } catch (err) {
    console.error('rag-query error:', err)
    return json({ error: err.message }, 500)
  }
})
