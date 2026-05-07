import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { loadPrompt, loadSettings, interpolatePrompt } from '../_shared/prompt-loader.ts'
import { stripPII } from '../_shared/hf-client.ts'

// ─── RAG: Fetch similar past treatment plans ───
async function fetchSimilarPlans(supabase: any, diagnosis: string, templateType: string, limit = 3): Promise<string> {
  try {
    const { data } = await supabase
      .from('generated_templates')
      .select('title, patient_info, generated_content, template_type')
      .eq('status', 'saved')
      .order('created_at', { ascending: false })
      .limit(30)

    if (!data?.length) return ''

    const diagLower = stripPII(diagnosis).toLowerCase()
    const scored = data
      .map((ex: any) => {
        let score = 0
        const info = ex.patient_info || {}
        const exDiag = (info.diagnosis || '').toLowerCase()
        if (exDiag && diagLower && (exDiag.includes(diagLower) || diagLower.includes(exDiag))) score += 3
        if (ex.template_type === templateType) score += 2
        if (ex.generated_content && typeof ex.generated_content === 'object') score += 1
        return { ...ex, score }
      })
      .filter((ex: any) => ex.score >= 3 && ex.generated_content)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, limit)

    if (!scored.length) return ''

    return scored.map((ex: any, i: number) => {
      const c = ex.generated_content || {}
      const objs = (c.objetivos_especificos || []).slice(0, 3).join('; ')
      const sessions = (c.plan_sesiones || []).slice(0, 1).map((s: any) =>
        `Sesión: ${s.titulo || ''} — ${(s.actividades || []).slice(0, 2).map((a: any) => a.nombre || a.titulo || '').join(', ')}`
      ).join('; ')
      return `--- Plan ${i + 1}: "${c.titulo || ex.title}" (${(ex.patient_info?.diagnosis || '')}${ex.patient_info?.age ? ', ' + ex.patient_info.age : ''}) ---
Objetivo: ${c.objetivo_general || ''}
Objetivos específicos: ${objs}
${sessions}`
    }).join('\n\n')
  } catch (e) {
    console.warn('[RAG] fetchSimilarPlans error:', e)
    return ''
  }
}

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
 * Generate Template — 2-Model Pipeline for Evidence-Based Treatment Plans
 *
 * Pipeline:
 * 1. Search PubMed for relevant evidence (5-6 articles)
 * 2. MODEL 1 (Analyst): Llama 3.3 70B synthesizes evidence into clinical findings
 * 3. MODEL 2 (Planner): Claude Haiku (or Llama fallback) generates structured treatment plan
 * 4. Save to generated_templates table
 * 5. Return plan + evidence synthesis + articles
 */

// ============================================================
// PubMed Integration
// ============================================================

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
  disfonia: ['voice disorders', 'dysphonia', 'voice therapy techniques'],
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
  respiración: ['breathing exercises', 'respiratory therapy speech', 'breath support voice'],
  fluencia: ['fluency disorders', 'stuttering treatment', 'fluency shaping'],
  articulación: ['articulation therapy', 'speech sound disorders treatment', 'phonological intervention'],
}

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

  return `${query} speech language pathology treatment`
}

interface PubMedArticle {
  pmid: string
  title: string
  authors: string
  journal: string
  year: string
  abstract: string
  doi: string
  url: string
}

async function searchPubMed(query: string, maxResults = 6): Promise<PubMedArticle[]> {
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

  const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&retmode=json&retmax=${maxResults}&sort=relevance&term=${encodeURIComponent(query + ' AND (speech language pathology OR treatment OR intervention OR therapy)')}`

  const searchRes = await fetch(searchUrl)
  if (!searchRes.ok) return []

  const searchData = await searchRes.json()
  const pmids = searchData.esearchresult?.idlist || []

  if (!pmids.length) return []

  const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&retmode=xml&id=${pmids.join(',')}`
  const fetchRes = await fetch(fetchUrl)
  if (!fetchRes.ok) return []

  const xmlText = await fetchRes.text()
  const articles: PubMedArticle[] = []

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
          pmid, title, authors, journal, year,
          abstract: abstractText.slice(0, 800),
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

// ============================================================
// LLM Providers
// ============================================================

/** Llama 3.3 70B via HuggingFace Hyperbolic (free) */
async function callHyperbolic(
  systemPrompt: string,
  userPrompt: string,
  hfToken: string,
  model = 'meta-llama/Llama-3.3-70B-Instruct',
  maxTokens = 2000,
  temperature = 0.3
): Promise<string> {
  const res = await fetch(
    'https://router.huggingface.co/hyperbolic/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    }
  )

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown error')
    throw new Error(`Hyperbolic ${model} failed (${res.status}): ${errText}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

/** Claude Haiku via Anthropic API */
async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  anthropicKey: string,
  maxTokens = 2500,
  temperature = 0.3
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown error')
    throw new Error(`Claude Haiku failed (${res.status}): ${errText}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text || ''
}

// ============================================================
// STEP 2: Evidence Analyst Model
// ============================================================

async function analyzeEvidence(
  articles: PubMedArticle[],
  diagnosis: string,
  hfToken: string,
  promptConfig?: { system_prompt: string; user_prompt_template: string | null; temperature: number; max_tokens: number; model: string },
): Promise<string> {
  if (!articles.length) {
    return 'No se encontraron artículos en PubMed. Se generará el plan basándose en conocimiento clínico general del modelo.'
  }

  const articlesContext = articles
    .map((a, i) => `[${i + 1}] "${a.title}" (${a.authors}, ${a.year})\nRevista: ${a.journal}\nResumen: ${a.abstract}`)
    .join('\n\n')

  // Use DB prompt if available, otherwise hardcoded
  const sysPrompt = promptConfig?.system_prompt || `Eres un investigador clínico especializado en fonoaudiología basada en evidencia. Tu tarea es analizar artículos científicos y extraer información clínicamente relevante para la planificación terapéutica.

INSTRUCCIONES:
- Analiza TODOS los artículos proporcionados
- Extrae información relevante para el diagnóstico específico del paciente
- Identifica niveles de evidencia (meta-análisis, RCT, estudio de cohorte, caso clínico, revisión)
- Responde SIEMPRE en español
- Sé conciso pero completo — otro modelo usará tu análisis para generar el plan de tratamiento`

  const userPrompt = promptConfig?.user_prompt_template
    ? interpolatePrompt(promptConfig.user_prompt_template, { diagnosis, articles_context: articlesContext })
    : `Diagnóstico del paciente: ${diagnosis}

ARTÍCULOS CIENTÍFICOS:
${articlesContext}

Analiza estos artículos y responde en JSON válido (sin markdown, sin backticks) con esta estructura exacta:

{
  "hallazgos_principales": "Resumen de los hallazgos principales. Cita [1], [2], etc.",
  "instrumentos_poblacion": "Instrumentos de evaluación usados y población objetivo (edades, tamaño muestral).",
  "nivel_evidencia": "Nivel de evidencia: meta-análisis, RCT, revisiones sistemáticas, etc. Indica el más alto.",
  "ideas_practicas": ["Idea 1 concreta con referencia [1]", "Idea 2 con referencia [2]", "Idea 3"],
  "parametros": "Frecuencia, duración, intensidad, dosificación según la literatura.",
  "precauciones": "Contraindicaciones o factores de riesgo."
}

Responde SOLO con el JSON válido, sin texto adicional.`

  const synthesis = await callHyperbolic(
    sysPrompt,
    userPrompt,
    hfToken,
    promptConfig?.model || 'meta-llama/Llama-3.3-70B-Instruct',
    promptConfig?.max_tokens || 1200,
    promptConfig?.temperature || 0.2
  )

  // Try to parse structured JSON, fallback to raw text
  try {
    const jsonMatch = synthesis.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return JSON.stringify(parsed)
    }
  } catch { /* fallback to raw */ }
  return synthesis
}

// ============================================================
// STEP 3: Therapeutic Planner Model
// ============================================================

async function generatePlan(
  evidenceSynthesis: string,
  params: {
    template_type: string
    diagnosis: string
    age: string
    difficulty: string
    duration: string
    objectives: string
  },
  hfToken: string,
  plannerModels?: { primary: string; fallback1: string; fallback2: string },
  plannerPromptConfig?: { system_prompt: string; user_prompt_template: string | null; temperature: number; max_tokens: number; model: string },
): Promise<{ text: string; model: string }> {
  const templateTypeMap: Record<string, string> = {
    'Plan de Tratamiento': 'plan de tratamiento fonoaudiológico',
    'Ejercicio Terapéutico': 'ejercicio terapéutico detallado',
    'Protocolo de Evaluación': 'protocolo de evaluación clínica',
  }
  const typeDescription = templateTypeMap[params.template_type] || params.template_type.toLowerCase()

  const systemPrompt = `Eres un fonoaudiólogo clínico con 15 años de experiencia en planificación terapéutica basada en evidencia. Tu tarea es generar un ${typeDescription} profesional, detallado y directamente aplicable en sesión.

INSTRUCCIONES:
1. USA la síntesis de evidencia proporcionada como base para TODAS tus decisiones clínicas.
2. Cita la evidencia usando el formato [Autor, Año] cuando fundamentes actividades o parámetros.
3. Sé EXTREMADAMENTE específico y práctico — el terapeuta debe poder usar esto directamente en sesión.
4. Para cada actividad, incluye pasos detallados, no solo descripciones generales.
5. Adapta la complejidad al nivel de dificultad indicado.
6. Si NO se proporcionan objetivos específicos, GENERA objetivos SMART (específicos, medibles, alcanzables, relevantes, con tiempo) basados en la evidencia científica, el diagnóstico y la edad del paciente. Los objetivos deben reflejar las mejores prácticas documentadas en la literatura.
7. Responde SIEMPRE en español.
8. Responde ÚNICAMENTE con JSON válido en el siguiente formato:

{
  "titulo": "Título descriptivo del ${typeDescription}",
  "objetivo_general": "Objetivo principal basado en evidencia",
  "objetivos_especificos": ["Objetivo 1", "Objetivo 2", "Objetivo 3"],
  "plan_sesiones": [
    {
      "sesion": 1,
      "objetivo_sesion": "Objetivo específico de esta sesión",
      "actividades": [
        {
          "nombre": "Nombre de la actividad",
          "descripcion_paso_a_paso": ["Paso 1: ...", "Paso 2: ...", "Paso 3: ..."],
          "duracion_minutos": 15,
          "materiales": ["Material 1", "Material 2"],
          "criterio_logro": "80% de respuestas correctas en 3 sesiones consecutivas",
          "fundamentacion_evidencia": "Según [Autor, Año], esta técnica mostró..."
        }
      ]
    }
  ],
  "frecuencia_recomendada": "2-3 sesiones semanales de 45 minutos",
  "duracion_total_plan": "8-12 semanas",
  "indicadores_progreso": [
    "Indicador medible 1",
    "Indicador medible 2"
  ],
  "evidencia_base": [
    {
      "hallazgo": "Descripción del hallazgo clave",
      "referencia": "[Autor, Año]",
      "nivel_evidencia": "Meta-análisis / RCT / Revisión sistemática"
    }
  ],
  "recomendaciones_para_familia": ["Recomendación 1", "Recomendación 2"],
  "precauciones": ["Precaución o contraindicación si aplica"],
  "criterios_alta": "Criterios para dar de alta al paciente del plan"
}`

  const userPrompt = `Genera un ${typeDescription} para el siguiente caso clínico:

DATOS DEL PACIENTE:
- Diagnóstico/Condición: ${params.diagnosis}
- Edad: ${params.age || 'No especificada'}
- Nivel de dificultad: ${params.difficulty}
${params.duration ? `- Duración/Contexto: ${params.duration}` : ''}
${params.objectives ? `- Objetivos del terapeuta: ${params.objectives}` : '- Objetivos: NO ESPECIFICADOS — Genera objetivos específicos, medibles y alcanzables basados en la evidencia científica, el diagnóstico y la edad del paciente.'}

SÍNTESIS DE EVIDENCIA CIENTÍFICA (analizada por modelo experto):
${evidenceSynthesis}

Genera el ${typeDescription} usando la evidencia analizada. Cada actividad debe estar fundamentada en los hallazgos científicos. Incluye al menos 2-3 sesiones con actividades detalladas paso a paso.`

  // Model cascade — configurable from DB via plannerModels parameter
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  const plannerPrimary = (plannerModels as any)?.primary || 'claude-haiku-4-5-20251001'
  const plannerFallback1 = (plannerModels as any)?.fallback1 || 'meta-llama/Llama-3.3-70B-Instruct'
  const plannerFallback2 = (plannerModels as any)?.fallback2 || 'deepseek-ai/DeepSeek-V3'

  // Strategy 1: Primary model (default Claude Haiku)
  if (anthropicKey && plannerPrimary.includes('claude')) {
    try {
      console.log(`[generate-template] Trying ${plannerPrimary} for planning...`)
      const text = await callClaude(systemPrompt, userPrompt, anthropicKey, 2500, 0.3)
      if (text) return { text, model: `${plannerPrimary} + analyst` }
    } catch (e) {
      console.warn(`[generate-template] ${plannerPrimary} failed:`, e)
    }
  }

  // Strategy 2: Fallback 1 (default Llama 3.3 70B)
  try {
    console.log(`[generate-template] Trying ${plannerFallback1} for planning...`)
    const text = await callHyperbolic(systemPrompt, userPrompt, hfToken, plannerFallback1, 2500, 0.3)
    if (text) return { text, model: `${plannerFallback1} (análisis + planificación)` }
  } catch (e) {
    console.warn(`[generate-template] ${plannerFallback1} failed:`, e)
  }

  // Strategy 3: Fallback 2 (default DeepSeek-V3)
  try {
    console.log(`[generate-template] Trying ${plannerFallback2} for planning...`)
    const text = await callHyperbolic(systemPrompt, userPrompt, hfToken, plannerFallback2, 2500, 0.3)
    if (text) return { text, model: `${plannerFallback2} + analyst` }
  } catch (e) {
    console.warn(`[generate-template] ${plannerFallback2} failed:`, e)
  }

  throw new Error('Todos los modelos de IA fallaron. Intenta de nuevo más tarde.')
}

// ============================================================
// STEP 0: Generate Objectives (lightweight, fast)
// ============================================================

async function generateObjectives(
  diagnosis: string,
  age: string,
  difficulty: string,
  template_type: string,
  articles: PubMedArticle[],
  hfToken: string
): Promise<{ objectives: string[]; model: string }> {
  const evidenceContext = articles.length
    ? articles
        .slice(0, 3)
        .map((a, i) => `[${i + 1}] ${a.title} (${a.year}): ${a.abstract.slice(0, 300)}`)
        .join('\n')
    : 'Sin artículos disponibles. Usa tu conocimiento clínico general.'

  const templateTypeMap: Record<string, string> = {
    'Plan de Tratamiento': 'plan de tratamiento fonoaudiológico',
    'Ejercicio Terapéutico': 'ejercicio terapéutico',
    'Protocolo de Evaluación': 'protocolo de evaluación clínica',
  }
  const typeDesc = templateTypeMap[template_type] || template_type

  const systemPrompt = `Eres un fonoaudiólogo clínico experto. Genera objetivos terapéuticos SMART (específicos, medibles, alcanzables, relevantes, con tiempo) para un ${typeDesc}.

INSTRUCCIONES:
- Genera entre 4 y 6 objetivos específicos
- Cada objetivo debe ser medible y alcanzable
- Basa los objetivos en la evidencia científica cuando esté disponible
- Adapta al nivel de dificultad indicado
- Responde SIEMPRE en español
- Responde ÚNICAMENTE con un JSON array de strings, ejemplo:
["Objetivo 1", "Objetivo 2", "Objetivo 3", "Objetivo 4"]`

  const userPrompt = `Diagnóstico: ${diagnosis}
Edad: ${age || 'No especificada'}
Dificultad: ${difficulty}
Tipo: ${typeDesc}

EVIDENCIA DISPONIBLE:
${evidenceContext}

Genera 4-6 objetivos específicos para este caso. Solo el JSON array.`

  // Try Llama first (fast, free)
  try {
    const text = await callHyperbolic(systemPrompt, userPrompt, hfToken, 'meta-llama/Llama-3.3-70B-Instruct', 500, 0.3)
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      const objectives = JSON.parse(match[0])
      if (Array.isArray(objectives) && objectives.length > 0) {
        return { objectives, model: 'llama-3.3-70b' }
      }
    }
  } catch (e) {
    console.warn('[generate-template] Llama objectives failed:', e)
  }

  // Fallback DeepSeek
  try {
    const text = await callHyperbolic(systemPrompt, userPrompt, hfToken, 'deepseek-ai/DeepSeek-V3', 500, 0.3)
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      const objectives = JSON.parse(match[0])
      if (Array.isArray(objectives) && objectives.length > 0) {
        return { objectives, model: 'deepseek-v3' }
      }
    }
  } catch (e) {
    console.warn('[generate-template] DeepSeek objectives failed:', e)
  }

  throw new Error('No se pudieron generar objetivos. Intenta de nuevo.')
}

// ============================================================
// Main Handler
// ============================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const {
      action = 'generate_plan',
      template_type = 'Plan de Tratamiento',
      diagnosis,
      age,
      difficulty = 'intermedio',
      duration = '',
      objectives = '',
    } = body

    if (!diagnosis) return json({ error: 'Se requiere un diagnóstico' }, 400)

    const hfToken = Deno.env.get('HF_TOKEN') || Deno.env.get('HUGGING_FACE_API_KEY')
    if (!hfToken) return json({ error: 'Missing HF_TOKEN' }, 500)

    // Load DB-configurable prompts and model settings
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const [analystPromptConfig, plannerPromptConfig, objectivesPromptConfig, modelSettingsMap] = await Promise.all([
      loadPrompt(serviceSupabase, 'generate-template.evidence-analyst', {
        system_prompt: '', user_prompt_template: null, temperature: 0.2, max_tokens: 1200, model: 'meta-llama/Llama-3.3-70B-Instruct',
      }),
      loadPrompt(serviceSupabase, 'generate-template.planner', {
        system_prompt: '', user_prompt_template: null, temperature: 0.3, max_tokens: 2500, model: 'meta-llama/Llama-3.3-70B-Instruct',
      }),
      loadPrompt(serviceSupabase, 'generate-template.objectives', {
        system_prompt: '', user_prompt_template: null, temperature: 0.3, max_tokens: 500, model: 'meta-llama/Llama-3.3-70B-Instruct',
      }),
      loadSettings(serviceSupabase, {
        'model.templates.planner': 'claude-haiku-4-5-20251001',
        'model.templates.planner.fallback1': 'meta-llama/Llama-3.3-70B-Instruct',
        'model.templates.planner.fallback2': 'deepseek-ai/DeepSeek-V3',
      }),
    ])

    const plannerModels = {
      primary: modelSettingsMap['model.templates.planner'],
      fallback1: modelSettingsMap['model.templates.planner.fallback1'],
      fallback2: modelSettingsMap['model.templates.planner.fallback2'],
    }

    // ── Shared: Search PubMed ──
    const searchQuery = buildSearchQuery(diagnosis)
    console.log(`[generate-template] Action: "${action}", Diagnosis: "${diagnosis}", Query: "${searchQuery}"`)

    let articles: PubMedArticle[] = []
    try {
      articles = await searchPubMed(searchQuery, action === 'generate_objectives' ? 3 : 6)
      console.log(`[generate-template] Found ${articles.length} PubMed articles`)
    } catch (e) {
      console.warn('[generate-template] PubMed search failed (non-critical):', e)
    }

    // ═══════════════════════════════════════════
    // ACTION: generate_objectives (fast, lightweight)
    // ═══════════════════════════════════════════
    if (action === 'generate_objectives') {
      console.log('[generate-template] Generating objectives...')
      const { objectives: generatedObjectives, model } = await generateObjectives(
        diagnosis, age, difficulty, template_type, articles, hfToken
      )

      return json({
        objectives: generatedObjectives,
        evidence: articles.map(a => ({
          title: a.title, authors: a.authors, journal: a.journal,
          year: a.year, url: a.url,
        })),
        model,
        pubmed_query: searchQuery,
      })
    }

    // ═══════════════════════════════════════════
    // ACTION: generate_plan (full 2-model pipeline)
    // ═══════════════════════════════════════════

    // ── RAG: Fetch similar past plans ──
    let ragContext = ''
    try {
      ragContext = await fetchSimilarPlans(serviceSupabase, diagnosis, template_type, 3)
      if (ragContext) console.log(`[generate-template] RAG: Found similar plans (${ragContext.length} chars)`)
    } catch (e) { console.warn('[generate-template] RAG failed (non-critical):', e) }

    // ── STEP 2: Evidence Analysis (Llama 3.3 70B) ──
    console.log('[generate-template] Step 2: Analyzing evidence with Llama 3.3 70B...')
    let evidenceSynthesis = ''
    try {
      evidenceSynthesis = await analyzeEvidence(articles, diagnosis, hfToken, analystPromptConfig.system_prompt ? analystPromptConfig : undefined)
      console.log(`[generate-template] Evidence synthesis: ${evidenceSynthesis.length} chars`)
    } catch (e) {
      console.warn('[generate-template] Evidence analysis failed (non-critical):', e)
      evidenceSynthesis = articles.length
        ? articles.map((a, i) => `[${i + 1}] ${a.title} (${a.authors}, ${a.year}): ${a.abstract}`).join('\n\n')
        : 'No se encontró evidencia. Basa el plan en tu conocimiento clínico general.'
    }

    // Enrich evidence with RAG context
    if (ragContext) {
      evidenceSynthesis += `\n\nPLANIFICACIONES ANTERIORES EXITOSAS PARA CASOS SIMILARES (usa como referencia de estructura, objetivos y actividades que han funcionado):\n${ragContext}\nFIN DE REFERENCIA.`
    }

    // ── STEP 3: Therapeutic Plan Generation (Claude Haiku / Llama fallback) ──
    console.log('[generate-template] Step 3: Generating therapeutic plan...')
    const { text: responseText, model } = await generatePlan(
      evidenceSynthesis,
      { template_type, diagnosis, age, difficulty, duration, objectives },
      hfToken,
      plannerModels,
      plannerPromptConfig.system_prompt ? plannerPromptConfig : undefined,
    )

    // ── Parse JSON from LLM response ──
    let content: Record<string, unknown>
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        content = JSON.parse(jsonMatch[0])
      } else {
        content = { raw_response: responseText }
      }
    } catch {
      content = { raw_response: responseText.replace(/```json|```/g, '').trim() }
    }

    // ── Save to generated_templates ──
    try {
      const authHeader = req.headers.get('Authorization')
      if (authHeader) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('generated_templates').insert({
            therapist_id: user.id,
            template_type,
            title: (content as any).titulo || `${template_type}: ${diagnosis}`,
            patient_info: { diagnosis, age, difficulty, duration, objectives },
            generated_content: content,
            status: 'draft',
          })
        }
      }
    } catch (e) {
      console.warn('[generate-template] Save failed (non-critical):', e)
    }

    // ── Log for analytics ──
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      await supabase.from('ai_feedback').insert({
        feedback_type: 'generate_template',
        context: { template_type, diagnosis, age, difficulty, articles_count: articles.length },
        suggestion: { model, has_evidence: articles.length > 0, pipeline: '2-model' },
        status: 'pending',
      }).catch(() => {})
    } catch {}

    return json({
      content,
      evidence_synthesis: evidenceSynthesis,
      evidence: articles.map(a => ({
        title: a.title,
        authors: a.authors,
        journal: a.journal,
        year: a.year,
        abstract: a.abstract,
        doi: a.doi,
        url: a.url,
      })),
      model,
      pubmed_query: searchQuery,
      rag_context_used: !!ragContext,
    })
  } catch (err) {
    console.error('[generate-template] Error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})
