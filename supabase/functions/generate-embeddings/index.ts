import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { hfEmbeddings } from '../_shared/hf-client.ts'
import { createServiceClient, corsHeaders, jsonResponse, errorResponse } from '../_shared/supabase-client.ts'

/**
 * Batch Embedding Generator
 *
 * Generates MiniLM-L6-v2 embeddings (384 dims) for:
 * - marketplace_items (title + description + diagnosis)
 * - treatment_plans (name + objective + diagnosis)
 * - activity_library (name + description + tags)
 *
 * Stores in ai_embeddings table for semantic search.
 * Called manually from admin or via pg_cron daily.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createServiceClient()
    const { source_table = 'marketplace_items', batch_size = 10 } = await req.json()

    const validTables = ['marketplace_items', 'treatment_plans', 'activity_library']
    if (!validTables.includes(source_table)) {
      return errorResponse(`source_table must be one of: ${validTables.join(', ')}`, 400)
    }

    // Find items without embeddings
    let query: any
    let textBuilder: (item: any) => string

    if (source_table === 'marketplace_items') {
      query = supabase
        .from('marketplace_items')
        .select('id, title, description, target_diagnosis, item_type')
        .eq('is_active', true)
        .limit(batch_size)

      textBuilder = (item: any) => [
        item.title,
        item.description?.slice(0, 300),
        item.item_type,
        Array.isArray(item.target_diagnosis) ? item.target_diagnosis.join(', ') : '',
      ].filter(Boolean).join('. ')

    } else if (source_table === 'treatment_plans') {
      query = supabase
        .from('treatment_plans')
        .select('id, name, general_objective, target_diagnosis, target_population')
        .eq('is_template', true)
        .limit(batch_size)

      textBuilder = (item: any) => [
        item.name,
        item.general_objective?.slice(0, 300),
        item.target_diagnosis,
        item.target_population,
      ].filter(Boolean).join('. ')

    } else {
      query = supabase
        .from('activity_library')
        .select('id, name, description, tags')
        .limit(batch_size)

      textBuilder = (item: any) => [
        item.name,
        item.description?.slice(0, 300),
        Array.isArray(item.tags) ? item.tags.join(', ') : '',
      ].filter(Boolean).join('. ')
    }

    const { data: items, error: fetchError } = await query
    if (fetchError) throw fetchError
    if (!items?.length) {
      return jsonResponse({ message: 'No items to process', source_table, embedded: 0 })
    }

    // Filter out items that already have embeddings
    const itemIds = items.map((i: any) => i.id)
    const { data: existing } = await supabase
      .from('ai_embeddings')
      .select('source_id')
      .eq('source_table', source_table)
      .in('source_id', itemIds)

    const existingIds = new Set((existing || []).map((e: any) => e.source_id))
    const newItems = items.filter((i: any) => !existingIds.has(i.id))

    if (!newItems.length) {
      return jsonResponse({ message: 'All items already have embeddings', source_table, embedded: 0, skipped: items.length })
    }

    // Generate embeddings in batches of 10
    const texts = newItems.map(textBuilder)
    const embeddings = await hfEmbeddings(texts)

    // Store embeddings
    const inserts = newItems.map((item: any, idx: number) => ({
      source_table,
      source_id: item.id,
      embedding: JSON.stringify(embeddings[idx]),
      text_content: texts[idx].slice(0, 500),
    }))

    const { error: insertError } = await supabase
      .from('ai_embeddings')
      .upsert(inserts, { onConflict: 'source_table,source_id' })

    if (insertError) throw insertError

    // Log to task queue
    await supabase.from('ai_task_queue').insert({
      task_type: 'embedding_gen',
      input_data: { source_table, batch_size },
      output_data: { embedded: newItems.length, skipped: existingIds.size },
      status: 'completed',
      processed_at: new Date().toISOString(),
    })

    return jsonResponse({
      source_table,
      embedded: newItems.length,
      skipped: existingIds.size,
      total_in_batch: items.length,
    })
  } catch (err) {
    console.error('generate-embeddings error:', err)
    return errorResponse(err.message)
  }
})
