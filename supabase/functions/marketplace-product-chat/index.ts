import { corsHeaders, jsonResponse, errorResponse, createServiceClient } from '../_shared/supabase-client.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { productId, userMessage, chatHistory } = await req.json()

    if (!userMessage) {
      return errorResponse('Missing userMessage', 400)
    }

    if (!productId) {
      return errorResponse('Missing productId', 400)
    }

    // Fetch product details
    const supabase = createServiceClient()
    const { data: product, error: productError } = await supabase
      .from('marketplace_items')
      .select('title, description, price, category, item_type, target_age_min, target_age_max, target_diagnosis, ai_benefits, ai_target_audience, ai_use_cases')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return errorResponse('Producto no encontrado', 404)
    }

    // Build product context string
    const productContext = buildProductContext(product)

    const systemPrompt = `Eres un asistente de ventas especializado en productos de fonoaudiologia. Responde preguntas sobre el siguiente producto basandote SOLO en la informacion proporcionada. NO inventes informacion. Si no sabes algo, di que no tienes esa informacion y sugiere contactar al vendedor. Se amable, profesional y conciso.

Producto:
${productContext}

IMPORTANTE: Responde UNICAMENTE con JSON valido:
{"reply":"tu respuesta aqui","suggestions":["pregunta sugerida 1","pregunta sugerida 2","pregunta sugerida 3"]}

Las suggestions deben ser 2-3 preguntas de seguimiento que el usuario podria hacer sobre este producto.`

    // Build messages: system + last 6 chat history messages + current user message
    const recentHistory = (chatHistory || []).slice(-6)
    const userContent = recentHistory.length
      ? `Historial:\n${recentHistory.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}\n\nUsuario: ${userMessage}`
      : userMessage

    let responseText = ''
    let modelUsed = ''

    // Strategy 1: Claude Haiku
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (ANTHROPIC_API_KEY) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 800,
            temperature: 0.5,
            system: systemPrompt,
            messages: [{ role: 'user', content: userContent }],
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
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent },
              ],
              max_tokens: 800,
              temperature: 0.5,
            }),
          }
        )

        if (res.ok) {
          const data = await res.json()
          responseText = data.choices?.[0]?.message?.content || ''
          modelUsed = 'meta-llama/Llama-3.3-70B-Instruct'
        } else {
          const errText = await res.text()
          console.warn(`HuggingFace fallback failed (${res.status}): ${errText.slice(0, 150)}`)
        }
      } catch (e) {
        console.warn('HuggingFace error:', e)
      }
    }

    // Parse JSON response from model
    if (responseText) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          return jsonResponse({
            reply: parsed.reply,
            suggestions: parsed.suggestions || getDefaultSuggestions(product),
            model: modelUsed,
          })
        } catch {
          // JSON parse failed, wrap raw text
        }
      }

      // Model returned text but not valid JSON - wrap it
      return jsonResponse({
        reply: responseText.replace(/```json|```/g, '').trim(),
        suggestions: getDefaultSuggestions(product),
        model: modelUsed,
      })
    }

    // All models failed
    return jsonResponse({
      reply: 'Lo siento, no puedo responder en este momento. Por favor intenta mas tarde o contacta al vendedor directamente.',
      suggestions: ['Reintentar', 'Contactar vendedor'],
      model: 'none',
    })

  } catch (error) {
    console.error('Product chat error:', error)
    return jsonResponse({
      reply: 'Lo siento, ocurrio un error. Por favor intenta mas tarde.',
      suggestions: ['Reintentar'],
    })
  }
})

function formatPrice(price: number | null): string {
  if (!price) return 'No especificado'
  return `$${price.toLocaleString('es-CL')} CLP`
}

function formatAgeRange(min: number | null, max: number | null): string {
  if (!min && !max) return 'No especificado'
  if (min && max) return `${min} a ${max} anos`
  if (min) return `Desde ${min} anos`
  return `Hasta ${max} anos`
}

function buildProductContext(product: Record<string, unknown>): string {
  const lines: string[] = []

  lines.push(`Titulo: ${product.title}`)
  if (product.description) lines.push(`Descripcion: ${product.description}`)
  lines.push(`Precio: ${formatPrice(product.price as number | null)}`)
  if (product.category) lines.push(`Categoria: ${product.category}`)
  if (product.item_type) lines.push(`Tipo: ${product.item_type}`)

  const ageRange = formatAgeRange(
    product.target_age_min as number | null,
    product.target_age_max as number | null
  )
  if (ageRange !== 'No especificado') lines.push(`Rango de edad: ${ageRange}`)

  if (product.target_diagnosis) {
    const diagnosis = Array.isArray(product.target_diagnosis)
      ? (product.target_diagnosis as string[]).join(', ')
      : product.target_diagnosis
    lines.push(`Diagnosticos objetivo: ${diagnosis}`)
  }

  if (product.ai_benefits) lines.push(`Beneficios: ${product.ai_benefits}`)
  if (product.ai_target_audience) lines.push(`Audiencia objetivo: ${product.ai_target_audience}`)
  if (product.ai_use_cases) lines.push(`Casos de uso: ${product.ai_use_cases}`)

  return lines.join('\n')
}

function getDefaultSuggestions(product: Record<string, unknown>): string[] {
  const suggestions: string[] = []
  if (product.price) suggestions.push('Que incluye este producto?')
  if (product.target_diagnosis) suggestions.push('Para que diagnosticos sirve?')
  if (product.ai_use_cases) suggestions.push('Como se usa en terapia?')
  if (suggestions.length === 0) {
    suggestions.push('Que incluye este producto?', 'Para que edades es adecuado?')
  }
  return suggestions.slice(0, 3)
}
