import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { hfClassification, hfEmbeddings, stripPII } from '../_shared/hf-client.ts'
import { createServiceClient, corsHeaders, jsonResponse, errorResponse } from '../_shared/supabase-client.ts'

/**
 * FonoLevel AI Scoring
 *
 * Enriches the existing SQL-based reputation score with AI analysis:
 * 1. Sentiment analysis of patient reviews → quality_score
 * 2. Profile completeness classification → completeness_score
 * 3. Specialty depth via embedding similarity → depth_score
 * 4. Final AI adjustment: +/- 15% on the SQL base score
 *
 * Can process a single therapist or batch from ai_task_queue.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createServiceClient()
    const { therapist_id, batch = false } = await req.json()

    const therapistIds: string[] = []

    if (batch) {
      // Process pending tasks from queue
      const { data: tasks } = await supabase
        .from('ai_task_queue')
        .select('id, input_data')
        .eq('task_type', 'fonolevel_score')
        .eq('status', 'pending')
        .limit(10)

      if (tasks?.length) {
        for (const task of tasks) {
          therapistIds.push(task.input_data.therapist_id)
          await supabase.from('ai_task_queue').update({ status: 'processing' }).eq('id', task.id)
        }
      }
    } else if (therapist_id) {
      therapistIds.push(therapist_id)
    } else {
      return errorResponse('therapist_id or batch=true required', 400)
    }

    const results = []

    for (const tid of therapistIds) {
      try {
        const score = await processTherapist(supabase, tid)
        results.push({ therapist_id: tid, ...score })

        // Update task queue if batch
        if (batch) {
          await supabase
            .from('ai_task_queue')
            .update({ status: 'completed', output_data: score, processed_at: new Date().toISOString() })
            .eq('task_type', 'fonolevel_score')
            .eq('status', 'processing')
            .contains('input_data', { therapist_id: tid })
        }
      } catch (err) {
        console.error(`Error processing ${tid}:`, err.message)
        results.push({ therapist_id: tid, error: err.message })

        if (batch) {
          await supabase
            .from('ai_task_queue')
            .update({ status: 'failed', error_message: err.message, processed_at: new Date().toISOString() })
            .eq('task_type', 'fonolevel_score')
            .eq('status', 'processing')
            .contains('input_data', { therapist_id: tid })
        }
      }
    }

    return jsonResponse({ results, processed: results.length })
  } catch (err) {
    console.error('fonolevel-ai-score error:', err)
    return errorResponse(err.message)
  }
})

async function processTherapist(supabase: any, therapistId: string) {
  // 1. Get current SQL-based score
  const { data: reputation } = await supabase.rpc('get_therapist_reputation', {
    p_therapist_id: therapistId
  })

  const baseScore = reputation?.global_score || 0

  // 2. Analyze review sentiment
  const { data: reviews } = await supabase
    .from('marketplace_reviews')
    .select('content, rating, rating_quality, rating_effectiveness')
    .eq('reviewer_id', therapistId)
    .limit(20)

  let sentimentScore = 50 // neutral default
  if (reviews?.length > 0) {
    const reviewTexts = reviews
      .filter((r: any) => r.content)
      .map((r: any) => stripPII(r.content))
      .join('. ')

    if (reviewTexts.length > 20) {
      const sentiment = await hfClassification(
        reviewTexts.slice(0, 1000),
        ['excelente', 'bueno', 'regular', 'malo']
      )

      // Map sentiment to 0-100 score
      const sentimentMap: Record<string, number> = {
        'excelente': 95, 'bueno': 75, 'regular': 45, 'malo': 15
      }
      sentimentScore = sentimentMap[sentiment.label] || 50
    }

    // Also factor in numeric ratings
    const avgRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 3), 0) / reviews.length
    sentimentScore = (sentimentScore * 0.6) + (avgRating / 5 * 100 * 0.4)
  }

  // 3. Profile completeness check
  const { data: profile } = await supabase
    .from('therapist_details')
    .select('about_me, professional_title, university, graduation_year, languages, main_address, social_linkedin_url')
    .eq('user_id', therapistId)
    .single()

  let completenessScore = 0
  if (profile) {
    const fields = [
      profile.about_me, profile.professional_title, profile.university,
      profile.graduation_year, profile.languages, profile.main_address,
      profile.social_linkedin_url
    ]
    const filled = fields.filter(f => f && (Array.isArray(f) ? f.length > 0 : String(f).length > 0)).length
    completenessScore = Math.round((filled / fields.length) * 100)
  }

  // 4. Specialty depth via education count
  const { data: education } = await supabase
    .from('therapist_education')
    .select('id')
    .eq('therapist_id', therapistId)

  const { data: experience } = await supabase
    .from('therapist_experience')
    .select('id')
    .eq('therapist_id', therapistId)

  const depthScore = Math.min(
    (education?.length || 0) * 15 + (experience?.length || 0) * 10,
    100
  )

  // 5. Calculate AI adjustment
  // Weighted: sentiment 40%, completeness 30%, depth 30%
  const aiScore = Math.round(
    sentimentScore * 0.4 +
    completenessScore * 0.3 +
    depthScore * 0.3
  )

  // AI adjustment: map aiScore to -15..+15 range relative to base
  const adjustment = Math.round((aiScore - 50) * 0.3) // -15 to +15
  const finalScore = Math.max(0, Math.min(100, baseScore + adjustment))

  const result = {
    base_score: baseScore,
    ai_score: aiScore,
    adjustment,
    final_score: finalScore,
    breakdown: {
      sentiment: Math.round(sentimentScore),
      completeness: completenessScore,
      depth: depthScore,
      reviews_analyzed: reviews?.length || 0,
    },
    computed_at: new Date().toISOString(),
  }

  // Store in ai_feedback for tracking
  await supabase.from('ai_feedback').insert({
    user_id: therapistId,
    feedback_type: 'fonolevel_score',
    suggestion: result,
    status: 'auto',
  })

  return result
}
