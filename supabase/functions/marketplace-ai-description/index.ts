import { corsHeaders, jsonResponse, errorResponse, createServiceClient } from '../_shared/supabase-client.ts'
import { interpolatePrompt } from '../_shared/prompt-loader.ts'

const SYSTEM_PROMPT = `Eres un experto en copywriting para productos terapéuticos y educativos de fonoaudiología en Chile. Tu objetivo es generar descripciones persuasivas que conviertan visitantes en compradores. La descripción debe: ser clara y profesional, destacar beneficios terapéuticos, usar un tono cercano pero experto, incluir palabras clave relevantes para SEO, tener entre 100-200 palabras.

Responde UNICAMENTE con JSON válido en este formato exacto:
{
  "description": "descripción mejorada del producto",
  "benefits": ["beneficio 1", "beneficio 2", "beneficio 3"],
  "target_audience": ["audiencia 1", "audiencia 2"],
  "use_cases": ["caso de uso 1", "caso de uso 2", "caso de uso 3"]
}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, description, item_type, category, target_age_min, target_age_max } = await req.json()

    if (!title) {
      return errorResponse('El título del producto es requerido', 400)
    }

    const ageRange = target_age_min != null && target_age_max != null
      ? `${target_age_min}-${target_age_max} años`
      : target_age_min != null
        ? `desde ${target_age_min} años`
        : target_age_max != null
          ? `hasta ${target_age_max} años`
          : 'no especificado'

    const userPrompt = `Genera una descripción mejorada para este producto del marketplace de DentalSpot:

Título: ${title}
Descripción actual: ${description || 'Sin descripción'}
Tipo de producto: ${item_type || 'No especificado'}
Categoría: ${category || 'No especificada'}
Rango de edad objetivo: ${ageRange}

Recuerda responder SOLO con JSON válido.`

    let responseText = ''
    let modelUsed = ''

    // Strategy 1: Claude Haiku
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (ANTHROPIC_API_KEY) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 1500,
            temperature: 0.7,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        })

        if (res.ok) {
          const data = await res.json()
          responseText = data.content?.[0]?.text || ''
          modelUsed = 'claude-3-5-haiku-20241022'
        } else {
          const errText = await res.text()
          console.warn(`Claude failed (${res.status}): ${errText.slice(0, 150)}`)
        }
      } catch (e) {
        console.warn('Claude error:', e)
      }
    }

    // Strategy 2: HuggingFace fallback
    const hfToken = Deno.env.get('HF_TOKEN') || Deno.env.get('HUGGING_FACE_API_KEY')
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
              model: 'meta-llama/Llama-3.3-70B-Instruct',
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt },
              ],
              max_tokens: 1500,
              temperature: 0.7,
            }),
          }
        )

        if (res.ok) {
          const data = await res.json()
          responseText = data.choices?.[0]?.message?.content || ''
          modelUsed = 'meta-llama/Llama-3.3-70B-Instruct'
        } else {
          const errText = await res.text()
          console.warn(`HuggingFace failed (${res.status}): ${errText.slice(0, 150)}`)
        }
      } catch (e) {
        console.warn('HuggingFace error:', e)
      }
    }

    // Parse JSON response
    if (responseText) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          return jsonResponse({
            description: parsed.description || '',
            benefits: parsed.benefits || [],
            target_audience: parsed.target_audience || [],
            use_cases: parsed.use_cases || [],
            model: modelUsed,
          })
        } catch {
          // JSON parse failed, return raw text as description
          return jsonResponse({
            description: responseText.replace(/```json|```/g, '').trim(),
            benefits: [],
            target_audience: [],
            use_cases: [],
            model: modelUsed,
          })
        }
      }

      // No JSON found in response, wrap raw text
      return jsonResponse({
        description: responseText.replace(/```json|```/g, '').trim(),
        benefits: [],
        target_audience: [],
        use_cases: [],
        model: modelUsed,
      })
    }

    // All models failed
    return errorResponse('No se pudo generar la descripción. Intenta más tarde.', 503)

  } catch (error) {
    console.error('marketplace-ai-description error:', error)
    return errorResponse('Error interno del servidor', 500)
  }
})
