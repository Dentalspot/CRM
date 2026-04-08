/**
 * @file setup-ads/index.ts
 * @description Creates ad creatives and ads for the 3 campaign funnel.
 * v2: 5 angles based on competitive research (Doctoralia, AgendaPro, Encuadrado, etc.)
 * Cleans up old ads/creatives before creating new ones.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const META_API_VERSION = 'v21.0'
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`

// ============================================
// AD COPY VARIANTS — v2 (based on competitive research)
// ============================================
// Strategy:
// - AgendaPro usa números concretos → nosotros también, pero con $0
// - Encuadrado cobra $26,000-$141,000 CLP/mes → nosotros somos gratis
// - Nadie tiene evaluación TEA → diferenciador imposible de copiar
// - SempreOSaber ataca carga administrativa → nosotros lo hacemos mejor con IA
// - Todos son genéricos → nosotros somos SOLO para fonos

const AD_VARIANTS = [
  {
    name: 'A — Anti-Software-Genérico',
    primary_text: `¿Usas un software genérico que no entiende tu consulta fono? 🤔

Encuadrado, AgendaPro, Medilink... son herramientas hechas para médicos, abogados, peluqueros — y tú adaptas todo a la fuerza.

Fonokit es la ÚNICA plataforma diseñada 100% para fonoaudiólogos:

🧠 Evaluación TEA integrada (ADI-R + ADOS-2)
📋 Fichas clínicas con terminología fono
🤖 Transcripción de sesiones con IA
🗓️ Agenda con recordatorios automáticos
📍 Marketplace para que pacientes te encuentren

Y lo mejor: $0 al mes. Para siempre.
Financiado por CORFO 🇨🇱`,
    headline: 'Hecho por fonos, para fonos — Gratis',
    description: 'La única plataforma especializada en fonoaudiología — financiada por CORFO',
    cta: 'SIGN_UP',
  },
  {
    name: 'B — Precio-Destructor',
    primary_text: `Mientras otros cobran entre $26.000 y $140.000 al mes por software clínico...

Fonokit es 100% GRATIS. ✅

No es una prueba de 7 días.
No es un plan básico limitado.
Es la plataforma completa, financiada por CORFO para los 11.000+ fonoaudiólogos de Chile.

Lo que incluye $0 al mes:
🗓️ Agenda online con recordatorios
📄 Fichas clínicas digitales
🧠 Evaluación TEA (ADI-R + ADOS-2 + Perfil Sensorial)
🤖 Transcripción con IA
📍 Tu perfil visible para pacientes en todo Chile

Sin tarjeta de crédito. Sin letra chica.
Solo regístrate y empieza.`,
    headline: '$0/mes vs $140.000/mes — Tú decides',
    description: 'Agenda + fichas + IA + evaluación TEA — gratis por CORFO',
    cta: 'SIGN_UP',
  },
  {
    name: 'C — TEA-Diferenciador',
    primary_text: `Si haces evaluaciones TEA, esto te va a interesar 👇

Fonokit es la primera plataforma con módulo de evaluación TEA integrado:

🧩 ADI-R — puntaje automático por dominio
🧩 ADOS-2 — algoritmo de severidad incluido
🧩 Perfil Sensorial 2 — cuadrantes sensoriales
📊 Informe profesional listo para entregar

Ningún otro software en Chile tiene esto.

Además: agenda, fichas clínicas, transcripción con IA y marketplace profesional.

100% gratis. Financiado por CORFO.
Ya lo usan cientos de fonoaudiólogas en todo Chile.`,
    headline: 'Evaluación TEA integrada — Solo en Fonokit',
    description: 'ADI-R + ADOS-2 + Perfil Sensorial 2 — puntaje automático y gratuito',
    cta: 'SIGN_UP',
  },
  {
    name: 'D — Ahorro-Tiempo-Números',
    primary_text: `¿Cuántas horas a la semana pierdes en papeleo? ⏰

Las fonoaudiólogas que usan Fonokit reportan:

📉 80% menos tiempo en fichas clínicas
📉 0 pacientes que "se olvidan" de la sesión (recordatorios automáticos)
📈 Más pacientes nuevos gracias al marketplace profesional
🤖 Sesiones transcritas con IA en minutos, no horas

Todo esto sin pagar $1.

Fonokit es gratis, financiado por CORFO, y diseñado exclusivamente para fonoaudiólogos chilenos.

Las planillas Excel y los cuadernos ya fueron.
Digitaliza tu consulta en 2 minutos.`,
    headline: '80% menos papeleo — Regístrate gratis',
    description: 'Ahorra horas cada semana con la plataforma gratuita para fonoaudiólogos',
    cta: 'SIGN_UP',
  },
  {
    name: 'E — Social-Proof-Emocional',
    primary_text: `"Llevo años buscando algo así. Por fin alguien pensó en nosotras." 💜

Cientos de fonoaudiólogas en Chile ya gestionan su consulta completa con Fonokit:

✅ Agenda online que les avisa a tus pacientes
✅ Fichas clínicas con todo lo que necesitas
✅ Evaluación TEA con puntaje automático
✅ Transcripción de sesiones con IA
✅ Tu perfil profesional visible en todo Chile

Gratis. No es broma. Financiado por CORFO 🇨🇱

La pregunta no es si vale la pena.
La pregunta es: ¿por qué no te has registrado aún?`,
    headline: 'Tus colegas ya se sumaron — ¿Y tú?',
    description: 'Únete a las fonoaudiólogas que ya digitalizaron su consulta — gratis',
    cta: 'SIGN_UP',
  },
]

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const accessToken = Deno.env.get('META_CAPI_ACCESS_TOKEN')!
    const adAccountId = Deno.env.get('META_AD_ACCOUNT_ID')!

    const body = await req.json().catch(() => ({}))
    const imageBase64 = body.image_base64
    const skipCleanup = body.skip_cleanup === true

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'image_base64 required in body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: any = { cleaned: { ads: 0, creatives: 0 }, image: null, creatives: [], ads: [] }

    // ============================================
    // 0. CLEAN UP OLD ADS & CREATIVES
    // ============================================
    if (!skipCleanup) {
      console.log('[setup-ads] Cleaning up old ads...')

      // Delete existing ads in our ad sets
      const AD_SET_IDS = [
        '120245378574640064', '120245378576410064',
        '120245378579330064', '120245378581110064',
        '120245378583120064', '120245378584320064',
      ]

      for (const adsetId of AD_SET_IDS) {
        try {
          const adsResp = await metaGet(`/${adsetId}/ads?fields=id,name&limit=100`, accessToken)
          for (const ad of (adsResp?.data || [])) {
            console.log(`[setup-ads] Deleting ad: ${ad.name} (${ad.id})`)
            try { await metaDelete(`/${ad.id}`, accessToken) } catch {}
            results.cleaned.ads++
          }
        } catch {}
      }

      // Delete old Fonokit creatives
      try {
        const creativesResp = await metaGet(
          `/${adAccountId}/adcreatives?fields=id,name&filtering=[{"field":"name","operator":"CONTAIN","value":"Fonokit"}]&limit=100`,
          accessToken
        )
        for (const c of (creativesResp?.data || [])) {
          console.log(`[setup-ads] Deleting creative: ${c.name} (${c.id})`)
          try { await metaDelete(`/${c.id}`, accessToken) } catch {}
          results.cleaned.creatives++
        }
      } catch {}
    }

    // ============================================
    // 1. UPLOAD IMAGE TO META
    // ============================================
    console.log('[setup-ads] Uploading image...')
    const imageUpload = await metaPostForm(`/${adAccountId}/adimages`, {
      bytes: imageBase64,
      access_token: accessToken,
    })

    const images = imageUpload?.images
    const imageHash = images ? Object.values(images)[0]?.hash : null
    if (!imageHash) {
      throw new Error('Failed to upload image: ' + JSON.stringify(imageUpload))
    }
    results.image = { hash: imageHash }
    console.log(`[setup-ads] Image uploaded: ${imageHash}`)

    // ============================================
    // 2. PAGE ID
    // ============================================
    const pageId = '529163383830922'

    // ============================================
    // 3. CREATE AD CREATIVES (5 variants)
    // ============================================
    const LANDING_URL = 'https://fonokit.cl/registro-profesional?utm_source=meta&utm_medium=paid&utm_campaign=growth_v2_2026'

    for (const variant of AD_VARIANTS) {
      console.log(`[setup-ads] Creating creative: ${variant.name}`)

      const objectStorySpec: any = {
        page_id: pageId,
        link_data: {
          image_hash: imageHash,
          link: LANDING_URL,
          message: variant.primary_text,
          name: variant.headline,
          description: variant.description,
          call_to_action: {
            type: variant.cta,
            value: { link: LANDING_URL },
          },
        },
      }

      const creative = await metaPostJSON(`/${adAccountId}/adcreatives`, {
        name: `Fonokit v2 — ${variant.name}`,
        object_story_spec: objectStorySpec,
      }, accessToken)

      results.creatives.push({ name: variant.name, id: creative.id })
    }

    // ============================================
    // 4. CREATE ADS (5 per ad set = 30 total)
    // Strategy: All 5 angles in each ad set.
    // Meta CBO will auto-optimize toward best performers.
    // After 5-7 days, pause bottom 2 performers per ad set.
    // ============================================
    const AD_SETS = [
      { id: '120245378574640064', name: 'TOFU-Lookalike-Registro' },
      { id: '120245378576410064', name: 'TOFU-Lookalike-Seguidores' },
      { id: '120245378579330064', name: 'MOFU-Engagers-FB' },
      { id: '120245378581110064', name: 'MOFU-Visitantes-Web' },
      { id: '120245378583120064', name: 'BOFU-Leads-Supersalud' },
      { id: '120245378584320064', name: 'BOFU-Retargeting-Landing' },
    ]

    for (const adset of AD_SETS) {
      for (let i = 0; i < results.creatives.length; i++) {
        const creative = results.creatives[i]
        const adName = `${adset.name} — ${AD_VARIANTS[i].name}`
        console.log(`[setup-ads] Creating ad: ${adName}`)

        const ad = await metaPostForm(`/${adAccountId}/ads`, {
          name: adName,
          adset_id: adset.id,
          creative: JSON.stringify({ creative_id: creative.id }),
          status: 'PAUSED',
          access_token: accessToken,
        })

        results.ads.push({ name: adName, id: ad.id, adset: adset.name, creative: creative.name })
      }
    }

    return new Response(JSON.stringify({
      success: true,
      summary: {
        cleaned_ads: results.cleaned.ads,
        cleaned_creatives: results.cleaned.creatives,
        new_creatives: results.creatives.length,
        new_ads: results.ads.length,
        angles: AD_VARIANTS.map(v => v.name),
      },
      results,
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[setup-ads] Error:', err)
    return new Response(JSON.stringify({
      success: false,
      error: (err as Error).message,
      details: (err as any).details || null,
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function metaGet(path: string, token: string) {
  const separator = path.includes('?') ? '&' : '?'
  const url = `${META_BASE_URL}${path}${separator}access_token=${token}`
  const res = await fetch(url)
  return await res.json()
}

async function metaDelete(path: string, token: string) {
  const url = `${META_BASE_URL}${path}?access_token=${token}`
  const res = await fetch(url, { method: 'DELETE' })
  return await res.json()
}

async function metaPostForm(path: string, body: Record<string, string>) {
  const url = `${META_BASE_URL}${path}`
  const formData = new URLSearchParams(body)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  })
  const data = await res.json()
  if (data.error) {
    const err = new Error(data.error.error_user_msg || data.error.message || 'Meta API error')
    ;(err as any).details = data.error
    throw err
  }
  return data
}

async function metaPostJSON(path: string, body: any, token: string) {
  const url = `${META_BASE_URL}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: token }),
  })
  const data = await res.json()
  if (data.error) {
    const err = new Error(data.error.error_user_msg || data.error.message || 'Meta API error')
    ;(err as any).details = data.error
    throw err
  }
  return data
}
