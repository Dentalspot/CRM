import { corsHeaders, jsonResponse, errorResponse, createServiceClient } from '../_shared/supabase-client.ts'
import { hfImageGeneration } from '../_shared/hf-client.ts'

/**
 * Generates an AI image for a marketplace item using HuggingFace FLUX.1-schnell.
 * Uploads the result to Supabase Storage and updates the item's gallery_urls.
 */

const CATEGORY_PROMPTS: Record<string, string> = {
  evaluacion: 'clinical evaluation form, speech therapy assessment sheet, professional medical document',
  anamnesis: 'clinical anamnesis form, patient intake form, medical questionnaire',
  plan: 'therapy session plan, treatment planning board, clinical workflow diagram',
  material: 'educational therapy materials, colorful learning resources, speech therapy tools',
  product: 'professional therapy equipment, clinical tools and accessories, medical device product photo',
  activity: 'printable therapy activity sheets, educational worksheets, colorful learning cards',
  course: 'online course thumbnail, professional education, speech therapy training',
}

function buildPrompt(title: string, description: string, category: string, itemType: string): string {
  const categoryHint = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS[itemType] || 'professional healthcare product'

  return `Professional product photo, ${categoryHint}, clean minimalist design, soft gradient background in teal and white colors, high quality, studio lighting, centered composition, modern and professional look. Product: "${title}". No text, no watermark.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { item_id, title, description, category, item_type } = await req.json()

    if (!item_id || !title) {
      return errorResponse('item_id y title son requeridos', 400)
    }

    const supabase = createServiceClient()

    // Check if item already has images
    const { data: item, error: fetchError } = await supabase
      .from('marketplace_items')
      .select('gallery_urls')
      .eq('id', item_id)
      .single()

    if (fetchError) {
      return errorResponse('Item no encontrado', 404)
    }

    const existingGallery = item.gallery_urls || []

    // Generate image with HuggingFace
    const prompt = buildPrompt(title, description || '', category || '', item_type || '')
    console.log(`[AI-Image] Generating for "${title}" with prompt: ${prompt.slice(0, 100)}...`)

    const imageBuffer = await hfImageGeneration(prompt)

    // Upload to Supabase Storage
    const fileName = `ai-generated/${item_id}/${Date.now()}.png`
    const { error: uploadError } = await supabase.storage
      .from('marketplace')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('[AI-Image] Upload error:', uploadError)
      return errorResponse('Error al subir la imagen generada', 500)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('marketplace')
      .getPublicUrl(fileName)

    // Update item gallery_urls
    const updatedGallery = [publicUrl, ...existingGallery]
    const { error: updateError } = await supabase
      .from('marketplace_items')
      .update({ gallery_urls: updatedGallery })
      .eq('id', item_id)

    if (updateError) {
      console.error('[AI-Image] Update error:', updateError)
      return errorResponse('Imagen generada pero no se pudo actualizar el item', 500)
    }

    console.log(`[AI-Image] Success for "${title}": ${publicUrl}`)

    return jsonResponse({
      success: true,
      image_url: publicUrl,
      gallery_urls: updatedGallery,
    })

  } catch (error) {
    console.error('[AI-Image] Error:', error)
    return errorResponse(error.message || 'Error interno al generar imagen', 500)
  }
})
