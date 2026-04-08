/**
 * analyze-ados2-report — AI Clinical Analysis for ADOS-2 Reports + RAG
 *
 * 1. Fetches similar past analyses from tea_training_examples (RAG)
 * 2. Searches PubMed for evidence
 * 3. Generates clinical analysis with Llama 3.3 70B → Claude Haiku fallback
 * 4. Saves analysis as training example for future RAG
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { loadPrompt } from '../_shared/prompt-loader.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── PubMed Search ───
interface PubMedArticle { pmid: string; title: string; authors: string; journal: string; year: string; url: string }

async function searchPubMed(query: string, maxResults = 5): Promise<PubMedArticle[]> {
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
  try {
    const searchRes = await fetch(`${baseUrl}/esearch.fcgi?db=pubmed&retmode=json&retmax=${maxResults}&sort=relevance&term=${encodeURIComponent(query)}`)
    if (!searchRes.ok) return []
    const searchData = await searchRes.json()
    const pmids = searchData.esearchresult?.idlist || []
    if (!pmids.length) return []

    const fetchRes = await fetch(`${baseUrl}/efetch.fcgi?db=pubmed&retmode=xml&id=${pmids.join(',')}`)
    if (!fetchRes.ok) return []
    const xmlText = await fetchRes.text()
    const articles: PubMedArticle[] = []
    for (const block of xmlText.split('<PubmedArticle>').slice(1)) {
      try {
        const pmid = block.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1] || ''
        const title = block.match(/<ArticleTitle>(.+?)<\/ArticleTitle>/s)?.[1]?.replace(/<[^>]+>/g, '') || ''
        const journal = block.match(/<Title>(.+?)<\/Title>/)?.[1] || ''
        const year = block.match(/<Year>(\d{4})<\/Year>/)?.[1] || ''
        const authorMatches = block.match(/<LastName>(.+?)<\/LastName>\s*<ForeName>(.+?)<\/ForeName>/g) || []
        const authors = authorMatches.slice(0, 3).map(a => {
          const last = a.match(/<LastName>(.+?)<\/LastName>/)?.[1] || ''
          const first = a.match(/<ForeName>(.+?)<\/ForeName>/)?.[1] || ''
          return `${last} ${first.charAt(0)}`
        }).join(', ') + (authorMatches.length > 3 ? ' et al.' : '')
        if (title) articles.push({ pmid, title, authors, journal, year, url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` })
      } catch { /* skip */ }
    }
    return articles
  } catch (e) { console.warn('[PubMed]', e); return [] }
}

function buildPubMedQuery(areas: string[]): string {
  const base = 'autism spectrum disorder intervention'
  return `(${base}) AND (${areas.slice(0, 3).join(' OR ')}) AND (children OR pediatric) AND (2019:2026[pdat])`
}

// ─── RAG: Fetch similar past analyses ───
async function fetchTrainingExamples(supabase: any, module: string, rango: string, limit = 2): Promise<string> {
  try {
    const { data } = await supabase
      .from('tea_training_examples')
      .select('eval_scores, clinical_analysis, recommendations')
      .eq('eval_type', 'ados2')
      .order('created_at', { ascending: false })
      .limit(15)

    if (!data?.length) return ''

    const scored = data
      .map((ex: any) => {
        let score = 0
        const scores = ex.eval_scores || {}
        if (scores.module === module) score += 3
        if (scores.rango_preocupacion === rango) score += 2
        if (ex.clinical_analysis?.length > 50) score += 1
        return { ...ex, score }
      })
      .filter((ex: any) => ex.score > 0 && ex.clinical_analysis)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, limit)

    if (!scored.length) return ''

    return scored.map((ex: any, i: number) => {
      const s = ex.eval_scores || {}
      return `--- Ejemplo ${i + 1} (Módulo ${s.module || '?'}, ${s.rango_preocupacion || '?'}, Global: ${s.total_global || '?'}) ---\n${(ex.clinical_analysis || '').slice(0, 500)}`
    }).join('\n\n')
  } catch { return '' }
}

// ─── Save training example ───
async function saveTrainingExample(supabase: any, evalData: any, analysis: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('tea_training_examples').insert({
      therapist_id: user.id,
      eval_type: 'ados2',
      eval_scores: {
        module: evalData.module,
        algorithm: evalData.algorithm,
        total_global: evalData.total_global,
        rango_preocupacion: evalData.rango_preocupacion,
      },
      clinical_analysis: analysis,
      source: 'ai_generated',
    })
  } catch { /* non-blocking */ }
}

const FALLBACK_PROMPT = {
  system_prompt: `Eres un neuropsicólogo clínico especialista en TEA con experiencia en ADOS-2. Analiza los resultados y genera:

1. ÁREAS MÁS AFECTADAS: 3-4 áreas con mayores dificultades según puntajes más altos.
2. FORTALEZAS: 2-3 áreas con capacidades preservadas (puntajes 0).
3. RECOMENDACIONES: 4-5 intervenciones basadas en evidencia.

Responde en español, conciso y clínico. Máximo 400 palabras en prosa.`,
  user_prompt_template: null,
  temperature: 0.3,
  max_tokens: 800,
  model: 'meta-llama/Llama-3.3-70B-Instruct',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { evaluationData, patientFirstName } = await req.json()
    if (!evaluationData?.responses) {
      return new Response(JSON.stringify({ error: 'Missing evaluationData' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    const promptConfig = await loadPrompt(supabase, 'analyze-ados2-report.clinical', FALLBACK_PROMPT)

    // Identify affected areas
    const responses = evaluationData.responses || []
    const highScoreItems = responses.filter((r: any) => (r.raw_score ?? 0) >= 1).sort((a: any, b: any) => (b.raw_score ?? 0) - (a.raw_score ?? 0))
    const areaKeywords: string[] = []
    for (const r of highScoreItems.slice(0, 6)) {
      const c = (r.item_code || '').charAt(0)
      if (c === 'A' && !areaKeywords.includes('communication')) areaKeywords.push('communication')
      if (c === 'B' && !areaKeywords.includes('social interaction')) areaKeywords.push('social interaction')
      if (c === 'C' && !areaKeywords.includes('imagination play')) areaKeywords.push('imagination play')
      if (c === 'D' && !areaKeywords.includes('restricted repetitive behavior')) areaKeywords.push('restricted repetitive behavior')
      if (c === 'E' && !areaKeywords.includes('emotional regulation')) areaKeywords.push('emotional regulation')
    }

    // RAG: fetch similar past analyses
    const trainingContext = await fetchTrainingExamples(supabase, evaluationData.module, evaluationData.rango_preocupacion, 2)

    // PubMed
    let articles: PubMedArticle[] = []
    if (areaKeywords.length > 0) {
      articles = await searchPubMed(buildPubMedQuery(areaKeywords), 5)
    }

    // Build prompt
    const itemsSummary = responses
      .filter((r: any) => r.raw_score !== undefined && r.raw_score !== null)
      .map((r: any) => `${r.item_name || r.item_code} (${r.item_code}): ${r.raw_score}`)
      .join('\n')

    const articlesCtx = articles.length > 0
      ? `\n\nArtículos PubMed:\n${articles.map((a, i) => `${i + 1}. ${a.authors} (${a.year}). "${a.title}". ${a.journal}.`).join('\n')}`
      : ''

    const ragCtx = trainingContext
      ? `\n\nEJEMPLOS DE ANÁLISIS ANTERIORES VALIDADOS (usa como referencia de estilo y profundidad):\n${trainingContext}\nFIN DE EJEMPLOS.\n`
      : ''

    const userMessage = `Evaluación ADOS-2 — Módulo ${evaluationData.module}
Paciente: ${patientFirstName || 'Evaluado/a'}
Clasificación: ${evaluationData.rango_preocupacion || 'No calculada'}
Total Global: ${evaluationData.total_global ?? 'N/A'}
${ragCtx}
Puntajes por ítem:
${itemsSummary}
${articlesCtx}

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
            model: promptConfig.model, max_tokens: promptConfig.max_tokens, temperature: promptConfig.temperature,
            messages: [{ role: 'system', content: promptConfig.system_prompt }, { role: 'user', content: userMessage }],
          }),
        })
        if (res.ok) { const d = await res.json(); responseText = d.choices?.[0]?.message?.content || ''; modelUsed = promptConfig.model }
      } catch (e) { console.warn('[ADOS2] Llama error:', e) }
    }

    if (!responseText && anthropicKey) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001', max_tokens: promptConfig.max_tokens, temperature: promptConfig.temperature,
            system: promptConfig.system_prompt, messages: [{ role: 'user', content: userMessage }],
          }),
        })
        if (res.ok) { const d = await res.json(); responseText = d.content?.[0]?.text || ''; modelUsed = 'claude-haiku' }
      } catch (e) { console.warn('[ADOS2] Claude error:', e) }
    }

    if (!responseText) {
      return new Response(JSON.stringify({ error: 'No AI model available' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Save training example (non-blocking)
    saveTrainingExample(supabase, evaluationData, responseText)

    return new Response(JSON.stringify({
      analysis: responseText,
      articles: articles.map(a => ({ title: a.title, authors: a.authors, journal: a.journal, year: a.year, url: a.url })),
      model_used: modelUsed,
      training_examples_used: !!trainingContext,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('[ADOS2]', e)
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
