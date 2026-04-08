import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

/**
 * Evidence-Based Search for Speech-Language Pathology
 *
 * Flow: Clinical question → Translate to English → PubMed search → Fetch abstracts → Summarize in Spanish
 *
 * Uses:
 * - PubMed E-utilities API (free, no key needed)
 * - Llama 3.3 70B via HuggingFace/Hyperbolic (free) for summarization
 * - Results cached in evidence_cache table for faster repeat queries
 */

// PubMed search terms for speech-language pathology domains
const SLP_MESH_TERMS: Record<string, string[]> = {
  disfagia: ['deglutition disorders', 'dysphagia', 'swallowing therapy'],
  tea: ['autism spectrum disorder', 'speech therapy autism', 'ASD communication'],
  autismo: ['autism spectrum disorder', 'applied behavior analysis', 'speech language pathology autism'],
  tartamudez: ['stuttering', 'fluency disorders', 'stammering treatment'],
  dislalia: ['articulation disorders', 'phonological disorders', 'speech sound disorders'],
  apraxia: ['apraxia of speech', 'childhood apraxia', 'motor speech disorders'],
  afasia: ['aphasia', 'aphasia rehabilitation', 'language therapy stroke'],
  disartria: ['dysarthria', 'motor speech disorders', 'speech intelligibility'],
  voz: ['voice disorders', 'dysphonia', 'voice therapy'],
  lenguaje: ['language development disorders', 'specific language impairment', 'developmental language disorder'],
  deglución: ['deglutition', 'swallowing disorders', 'dysphagia management'],
  comunicación: ['augmentative alternative communication', 'AAC', 'communication disorders'],
  sensorial: ['sensory processing', 'sensory integration', 'sensory profile'],
  'perfil sensorial': ['sensory profile', 'sensory processing disorder', 'Dunn sensory profile'],
  ados: ['ADOS-2', 'autism diagnostic observation', 'autism assessment'],
  adir: ['ADI-R', 'autism diagnostic interview', 'autism screening'],
  fonológico: ['phonological awareness', 'phonological therapy', 'phonological processes'],
  lectura: ['reading disorders', 'dyslexia', 'reading intervention speech'],
  escritura: ['writing disorders', 'dysgraphia', 'written language disorders'],
  pragmática: ['pragmatic language', 'social communication disorder', 'pragmatic intervention'],
}

// Search PubMed for articles
async function searchPubMed(
  query: string,
  maxResults = 8
): Promise<Array<{ pmid: string; title: string; authors: string; journal: string; year: string; abstract: string; doi: string; url: string }>> {
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

  // Step 1: Search for PMIDs
  const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&retmode=json&retmax=${maxResults}&sort=relevance&term=${encodeURIComponent(query + ' AND (speech language pathology OR fonoaudiologia OR logopedia)')}`

  const searchRes = await fetch(searchUrl)
  if (!searchRes.ok) throw new Error(`PubMed search failed: ${searchRes.status}`)

  const searchData = await searchRes.json()
  const pmids = searchData.esearchresult?.idlist || []

  if (!pmids.length) return []

  // Step 2: Fetch article details
  const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&retmode=xml&id=${pmids.join(',')}`
  const fetchRes = await fetch(fetchUrl)
  if (!fetchRes.ok) throw new Error(`PubMed fetch failed: ${fetchRes.status}`)

  const xmlText = await fetchRes.text()

  // Parse XML (basic parsing for edge function environment)
  const articles: Array<{ pmid: string; title: string; authors: string; journal: string; year: string; abstract: string; doi: string; url: string }> = []

  const articleBlocks = xmlText.split('<PubmedArticle>')
  for (const block of articleBlocks.slice(1)) {
    try {
      const pmid = block.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1] || ''
      const title = block.match(/<ArticleTitle>(.+?)<\/ArticleTitle>/s)?.[1]?.replace(/<[^>]+>/g, '') || ''
      const journal = block.match(/<Title>(.+?)<\/Title>/)?.[1] || ''
      const year = block.match(/<Year>(\d{4})<\/Year>/)?.[1] || ''
      const abstractText = block.match(/<AbstractText[^>]*>(.+?)<\/AbstractText>/gs)
        ?.map(t => t.replace(/<[^>]+>/g, ''))
        .join(' ') || ''
      const doi = block.match(/<ArticleId IdType="doi">(.+?)<\/ArticleId>/)?.[1] || ''

      // Extract authors
      const authorMatches = block.match(/<LastName>(.+?)<\/LastName>\s*<ForeName>(.+?)<\/ForeName>/g) || []
      const authors = authorMatches.slice(0, 3)
        .map(a => {
          const last = a.match(/<LastName>(.+?)<\/LastName>/)?.[1] || ''
          const first = a.match(/<ForeName>(.+?)<\/ForeName>/)?.[1] || ''
          return `${last} ${first.charAt(0)}`
        })
        .join(', ') + (authorMatches.length > 3 ? ' et al.' : '')

      if (title) {
        articles.push({
          pmid,
          title,
          authors,
          journal,
          year,
          abstract: abstractText.slice(0, 600),
          doi,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        })
      }
    } catch {
      // Skip malformed articles
    }
  }

  return articles
}

// Translate clinical query to English search terms
function buildSearchQuery(query: string): string {
  const queryLower = query.toLowerCase()
  const matchedTerms: string[] = []

  for (const [spanish, english] of Object.entries(SLP_MESH_TERMS)) {
    if (queryLower.includes(spanish)) {
      matchedTerms.push(...english)
    }
  }

  if (matchedTerms.length) {
    return matchedTerms.slice(0, 3).join(' OR ')
  }

  // Fallback: use the original query + broad SLP term
  return `${query} speech language pathology`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { query, diagnosis, max_results = 6, summarize = true } = await req.json()
    const searchInput = query || diagnosis

    if (!searchInput) return json({ error: 'Se requiere query o diagnosis' }, 400)

    console.log(`[search-evidence] Query: "${searchInput}"`)

    // Build optimized English search query
    const searchQuery = buildSearchQuery(searchInput)
    console.log(`[search-evidence] PubMed query: "${searchQuery}"`)

    // Search PubMed
    const articles = await searchPubMed(searchQuery, max_results)
    console.log(`[search-evidence] Found ${articles.length} articles`)

    if (!articles.length) {
      return json({
        query: searchInput,
        articles: [],
        summary: 'No se encontraron artículos científicos relevantes para esta consulta. Intenta con términos más específicos.',
        model: 'none',
      })
    }

    // Summarize with LLM if requested
    let summary = ''
    let model = ''
    let structured: { hallazgos_principales: string; instrumentos_poblacion: string; nivel_evidencia: string; ideas_practicas: string[] } | null = null

    if (summarize) {
      const hfToken = Deno.env.get('HF_TOKEN') || Deno.env.get('HUGGING_FACE_API_KEY')

      if (hfToken) {
        try {
          const evidenceContext = articles
            .map((a, i) => `[${i + 1}] ${a.title} (${a.authors}, ${a.year})\n${a.abstract}`)
            .join('\n\n')

          const systemPrompt = `Eres un especialista en fonoaudiología basada en evidencia. Analiza los artículos científicos y genera una síntesis clínica ESTRUCTURADA en español.

RESPONDE EXCLUSIVAMENTE en JSON con este formato:
{
  "hallazgos_principales": "Resumen de 2-3 párrafos con los hallazgos principales. Cita artículos por número [1], [2]. Menciona consenso o discrepancia entre estudios.",
  "instrumentos_poblacion": "Instrumentos de evaluación utilizados, población estudiada (edades, diagnósticos, tamaño muestral)",
  "nivel_evidencia": "Tipo de evidencia (meta-análisis, RCT, estudio de cohorte, caso clínico, revisión sistemática). Calidad general.",
  "ideas_practicas": ["Idea práctica 1 aplicable en sesión", "Idea práctica 2", "Idea práctica 3"]
}

INSTRUCCIONES:
- hallazgos_principales: 2-3 párrafos, cita por número [1], [2], etc. Destaca implicaciones clínicas.
- instrumentos_poblacion: lista instrumentos y características de la población.
- nivel_evidencia: clasifica el nivel de evidencia y calidad.
- ideas_practicas: 3-5 ideas CONCRETAS y aplicables en la práctica clínica fonoaudiológica.
- Responde SOLO el JSON, sin texto adicional.
- Responde en español.`

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
                  { role: 'user', content: `Pregunta clínica: "${searchInput}"\n\nArtículos encontrados:\n\n${evidenceContext}` },
                ],
                max_tokens: 1000,
                temperature: 0.2,
              }),
            }
          )

          if (res.ok) {
            const data = await res.json()
            const raw = data.choices?.[0]?.message?.content || ''
            model = 'llama-3.3-70b'

            // Parse structured JSON
            try {
              const jsonMatch = raw.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                summary = parsed.hallazgos_principales || raw
                structured = {
                  hallazgos_principales: parsed.hallazgos_principales || '',
                  instrumentos_poblacion: parsed.instrumentos_poblacion || '',
                  nivel_evidencia: parsed.nivel_evidencia || '',
                  ideas_practicas: parsed.ideas_practicas || [],
                }
              } else {
                summary = raw
              }
            } catch {
              summary = raw.replace(/```json|```/g, '').trim()
            }
          }
        } catch (e) {
          console.warn('[search-evidence] LLM summary failed:', e)
        }
      }

      if (!summary) {
        summary = `Se encontraron ${articles.length} artículos relevantes. Revisa los abstracts para más detalles.`
        model = 'none'
      }
    }

    // Log query for analytics
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      await supabase.from('ai_feedback').insert({
        feedback_type: 'evidence_search',
        context: { query: searchInput, pubmed_query: searchQuery, results_count: articles.length },
        suggestion: { summary: summary.slice(0, 500), model },
        status: 'pending',
      }).catch(() => {})
    } catch {}

    return json({
      query: searchInput,
      pubmed_query: searchQuery,
      articles: articles.map(a => ({
        title: a.title,
        authors: a.authors,
        journal: a.journal,
        year: a.year,
        abstract: a.abstract,
        doi: a.doi,
        url: a.url,
      })),
      summary,
      structured,
      model,
      total_results: articles.length,
    })
  } catch (err) {
    console.error('[search-evidence] Error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})
