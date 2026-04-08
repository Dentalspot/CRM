import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { hfEmbeddings } from '../_shared/hf-client.ts'
import { createSupabaseClient, corsHeaders, jsonResponse, errorResponse } from '../_shared/supabase-client.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createSupabaseClient(req)
    const { patient_id, diagnosis, age, goals, limit: maxResults = 5 } = await req.json()

    // Build query text from patient context
    let queryText = ''

    if (patient_id) {
      const { data: patient } = await supabase
        .from('patients')
        .select('diagnosis_summary, date_of_birth')
        .eq('id', patient_id)
        .single()

      if (patient) {
        queryText = patient.diagnosis_summary || ''
      }

      const { data: patientGoals } = await supabase
        .from('patient_goals')
        .select('title')
        .eq('patient_id', patient_id)
        .eq('achieved', false)
        .limit(5)

      if (patientGoals?.length) {
        queryText += ' ' + patientGoals.map(g => g.title).join(', ')
      }
    }

    if (diagnosis) queryText += ' ' + diagnosis
    if (goals) queryText += ' ' + goals
    if (age) queryText += ` edad ${age} años`

    if (!queryText.trim()) {
      return errorResponse('No context provided (patient_id, diagnosis, or goals required)', 400)
    }

    // Get embedding for query
    const [queryEmbedding] = await hfEmbeddings([queryText.trim()])

    // Search using cosine similarity against stored embeddings
    const { data: matches, error } = await supabase.rpc('match_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: maxResults,
      source_filter: 'marketplace_items',
    })

    // Fallback: if RPC doesn't exist, do a manual search
    if (error?.code === '42883') {
      // RPC doesn't exist yet - fallback to keyword search
      const keywords = queryText.split(/\s+/).filter(w => w.length > 3).slice(0, 5)
      const { data: items } = await supabase
        .from('marketplace_items')
        .select('id, title, description, price, rating, target_diagnosis, item_type')
        .eq('is_active', true)
        .eq('is_approved', true)
        .or(keywords.map(k => `title.ilike.%${k}%,description.ilike.%${k}%`).join(','))
        .limit(maxResults)

      return jsonResponse({
        recommendations: items || [],
        method: 'keyword_fallback',
        query: queryText.slice(0, 100),
      })
    }

    if (error) throw error

    // Fetch full item details for matches
    if (matches?.length) {
      const ids = matches.map((m: { source_id: string }) => m.source_id)
      const { data: items } = await supabase
        .from('marketplace_items')
        .select('id, title, description, price, rating, target_diagnosis, item_type, total_sales')
        .in('id', ids)
        .eq('is_active', true)

      const itemMap = new Map((items || []).map(i => [i.id, i]))
      const recommendations = matches.map((m: { source_id: string; similarity: number }) => ({
        ...itemMap.get(m.source_id),
        relevance_score: m.similarity,
      })).filter((r: { id?: string }) => r.id)

      return jsonResponse({ recommendations, method: 'semantic_similarity', query: queryText.slice(0, 100) })
    }

    return jsonResponse({ recommendations: [], method: 'semantic_similarity', query: queryText.slice(0, 100) })
  } catch (err) {
    console.error('recommend-purchases error:', err)
    return errorResponse(err.message)
  }
})
