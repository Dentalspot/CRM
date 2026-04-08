/**
 * @file setup-ads-v3/index.ts
 * @description Adds 21 new ad creatives (video scripts as image+copy ads) to existing campaigns.
 * Does NOT delete existing ads. Uses existing uploaded image hash.
 * Maps each creative to the correct funnel stage ad sets.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const META_API_VERSION = 'v21.0'
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`
const PAGE_ID = '529163383830922'
const LANDING_URL = 'https://fonokit.cl/registro-profesional?utm_source=meta&utm_medium=paid&utm_campaign=growth_v3_2026'

// Ad set mapping by funnel
const TOFU_ADSETS = [
  { id: '120245378574640064', name: 'TOFU-Lookalike-Registro' },
  { id: '120245378576410064', name: 'TOFU-Lookalike-Seguidores' },
]
const MOFU_ADSETS = [
  { id: '120245378579330064', name: 'MOFU-Engagers-FB' },
  { id: '120245378581110064', name: 'MOFU-Visitantes-Web' },
]
const BOFU_ADSETS = [
  { id: '120245378583120064', name: 'BOFU-Leads-Supersalud' },
  { id: '120245378584320064', name: 'BOFU-Retargeting-Landing' },
]

// ============================================
// 21 AD COPY VARIANTS — organized by funnel
// ============================================

const TOFU_VARIANTS = [
  // #1 — Anti-Software-Genérico (Storytelling)
  {
    name: '#1 Anti-Software-Genérico',
    primary_text: `Si llevas tiempo usando un software clínico que no entiende tu consulta fono…

no es culpa tuya.

Es que no fue hecho para ti.

Estás adaptando fichas de médicos, agenda de dentistas, plantillas de psicólogos… pero nada calza.

Y así es muy difícil trabajar tranquila.

Mientras tanto, hay fonoaudiólogas en tu misma situación que hoy ya tienen todo en un solo lugar.

No porque sean más tecnológicas. Porque encontraron Fonokit.

La única plataforma diseñada 100% para fonoaudiólogas.
Gratis. Financiada por CORFO. 🇨🇱

👉 Regístrate y deja de adaptar lo que no era tuyo.`,
    headline: 'Hecho por fonos, para fonos — Gratis',
    description: 'La única plataforma especializada en fonoaudiología',
  },
  // #2 — Precio-Destructor (Storytelling)
  {
    name: '#2 Precio-Destructor',
    primary_text: `Si cada mes pagas $30.000 o más por un software clínico y sientes que no le sacas el jugo…

no es que no sepas usarlo.

Es que estás pagando por algo genérico.

Agenda básica, fichas que no hablan tu idioma, soporte que no entiende lo que haces… y la plata se va igual.

Mientras tanto, hay colegas tuyas que tienen agenda, fichas, evaluación TEA, transcripción con IA y marketplace profesional.

Y pagan $0.

No es una prueba gratis de 7 días.
Es Fonokit. Financiado por CORFO. Para siempre. 🇨🇱

👉 Deja de pagar por lo que puedes tener gratis.`,
    headline: '$0/mes vs $140.000/mes — Tú decides',
    description: 'Agenda + fichas + IA + evaluación TEA — gratis por CORFO',
  },
  // #3 — TEA-Diferenciador (Storytelling)
  {
    name: '#3 TEA-Diferenciador',
    primary_text: `Si haces evaluaciones TEA ya sabes lo que es esto:

Imprimir el protocolo. Puntuar a mano. Pasar todo a Excel. Armar el informe desde cero.

Horas. Cada vez.

Ahora imagina esto:

Abres Fonokit. Seleccionas ADI-R, ADOS-2 o Perfil Sensorial. Puntúas directo en la plataforma. El algoritmo calcula todo automáticamente. Y el informe sale listo.

Ningún otro software en Chile tiene esto.

Es gratis. Es de CORFO. Y es solo para fonoaudiólogas. 🇨🇱

👉 Haz tu primera evaluación TEA digital hoy.`,
    headline: 'Evaluación TEA integrada — Solo en Fonokit',
    description: 'ADI-R + ADOS-2 + Perfil Sensorial 2 — puntaje automático y gratuito',
  },
  // #4 — Ahorro de Tiempo (Storytelling)
  {
    name: '#4 Ahorro-Tiempo',
    primary_text: `Si sientes que trabajas más horas de las que te pagan…

no es falta de organización.

Es que nadie te dio las herramientas correctas.

Fichas a mano. Recordatorios por WhatsApp. Informes en Word. Agenda en el cuaderno.

Así cualquiera se agota.

Mientras tanto, hay fonoaudiólogas que atienden lo mismo que tú pero terminan más temprano.

No porque trabajen menos. Porque Fonokit hace el papeleo por ellas.

Agenda inteligente. Fichas digitales. Transcripción con IA. Todo automático.
Y gratis — financiado por CORFO. 🇨🇱

👉 Recupera tus horas. Regístrate en 2 minutos.`,
    headline: '80% menos papeleo — Regístrate gratis',
    description: 'Ahorra horas cada semana con la plataforma gratuita para fonoaudiólogos',
  },
  // #5 — Social Proof Emocional (Storytelling)
  {
    name: '#5 Social-Proof-Emocional',
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
  },
  // #12 — Confrontacional "No es culpa del mercado"
  {
    name: '#12 No-Es-Culpa-Del-Mercado',
    primary_text: `Digitalizar tu consulta no es abrir una agenda en Google Calendar y esperar que todo funcione.

No es hacer fichas en Word y cruzar los dedos.

No es mandar recordatorios por WhatsApp uno por uno.

Si tus pacientes faltan sin avisar… no es culpa de ellos. Es culpa del sistema que no tienes.

Porque una consulta bien organizada no se siente como trabajo extra. Se siente como libertad.

Deja de improvisar con parches que no funcionan juntos.

En Fonokit tienes todo: agenda, fichas, TEA, IA, marketplace.

Sin software genéricos. Solo lo que funciona para fonoaudiólogas.

$0. Para siempre. CORFO. 🇨🇱

👉 Regístrate en fonokit.cl`,
    headline: 'El problema no eres tú. Es la herramienta.',
    description: 'Deja de improvisar — la plataforma correcta es gratis',
  },
  // #13 — "Quién soy" Personal Branding
  {
    name: '#13 Quién-Soy-Danissa',
    primary_text: `Si eres fonoaudióloga, probablemente no tienes idea quién soy.

Pero soy fonoaudióloga, igual que tú. Atendí pacientes, hice evaluaciones TEA a mano, armé informes en Word hasta las 11 de la noche.

Viví el mismo caos que tú vives hoy.

Pero además soy fundadora de Fonokit. La primera plataforma clínica hecha 100% para fonoaudiólogas.

No hago software genérico. No vendo suscripciones de $140.000. No prometo magia.

Construí una plataforma real, con problemas reales, para profesionales reales.

Y CORFO lo respaldó. Porque Chile necesitaba una herramienta para sus 11.000+ fonoaudiólogos. 🇨🇱

👉 Regístrate gratis en fonokit.cl 💜`,
    headline: 'De fonoaudióloga a fundadora — Conóceme',
    description: 'Creé lo que no existía: la plataforma que toda fono necesita',
  },
  // #17 — Humor "Juanita"
  {
    name: '#17 Juanita-Humor',
    primary_text: `Juanita deja de hacer fichas en el cuaderno! 📓

Siempre estás mandando recordatorios por WhatsApp.
No sabes cuántos pacientes atendiste este mes.
Haces informes TEA en Word copiando de otro informe viejo.

Créeme Juanita que Pedrita partió así. 😅

Y en fonokit.cl encontró su solución.
Ahora tiene agenda automática, fichas digitales y evaluaciones TEA con puntaje solo. 🧠

No cuesta $140.000 ❌
No cuesta $26.000 ❌
No cuesta NADA. $0 para siempre 🤯

Financiado por CORFO 🇨🇱

fonokit.cl 💜
Besitos de Pedrita, Juanita y Danissa 😘`,
    headline: 'Juanita ya se registró — ¿Y tú? 😘',
    description: 'Gratis. Para siempre. CORFO. Sin excusas, Juanita.',
  },
  // #14 — Ultra corto "Tenía pacientes no sistema"
  {
    name: '#14 Tenía-Pacientes-No-Sistema',
    primary_text: `María José tenía pacientes. Pero no tenía sistema.

Fichas en tres cuadernos. Evaluaciones TEA toda la tarde. Pacientes que faltaban. Informes a las 11 de la noche.

Se registró en Fonokit.
Ordenó su agenda. Digitalizó sus fichas. Automatizó sus evaluaciones.

Resultado: la primera semana ya salía a las 6 🕕

Así de simple.

Fonokit. Gratis. Para siempre. CORFO. 🇨🇱

👉 fonokit.cl 💜`,
    headline: 'De caos a orden en una semana',
    description: 'Registrate gratis y empieza a salir a las 6',
  },
  // #18 — Micro "Dedicarte al 100%"
  {
    name: '#18 Dedicarte-Al-100',
    primary_text: `¿Te gustaría dedicarte a tus pacientes al 100%? 🔥

Sin papeleo. Sin fichas a mano. Sin informes hasta las 11. Sin recordatorios por WhatsApp.

Solo tú y tus pacientes.

Eso es Fonokit. 💜

Gratis. Para siempre. CORFO. 🇨🇱

👉 fonokit.cl`,
    headline: 'Solo tú y tus pacientes — $0/mes',
    description: 'Fonokit: agenda + fichas + TEA + IA — gratis para siempre',
  },
  // #15 — Test digital interactivo
  {
    name: '#15 Test-Digital',
    primary_text: `¿Qué tan digitalizada está tu consulta fono? 🤔

Test rápido — responde "sí" o "no":

1️⃣ ¿Fichas clínicas en sistema digital?
2️⃣ ¿Recordatorios automáticos antes de cada sesión?
3️⃣ ¿Evaluaciones TEA en plataforma digital?
4️⃣ ¿Informes clínicos automáticos?
5️⃣ ¿Perfil donde pacientes te encuentran sin pagar?
6️⃣ ¿Transcripción con IA?
7️⃣ ¿Agenda conectada con fichas?
8️⃣ ¿Terminas antes de las 7?

Menos de 4: consulta análoga 🍼
4-6: tienes parches 💪
7-8: ya estás en Fonokit, ¿o no? 😏💜

Si respondiste "no" a alguna → fonokit.cl
Gratis. Para siempre. CORFO. 🇨🇱`,
    headline: '¿Cuántos "sí" sacaste? 🤔',
    description: 'Haz el test y descubre si tu consulta necesita Fonokit',
  },
]

const MOFU_VARIANTS = [
  // #6 — "Esto haría yo" (Consejo experto)
  {
    name: '#6 Esto-Haría-Yo',
    primary_text: `Esto haría si estuviera a cargo de tu consulta fonoaudiológica.

Pero no hay nadie que lo pueda hacer mejor que tú 🫵

1️⃣ Digitalizaría todo. Nada de fichas en papel.
2️⃣ Automatizaría los recordatorios. Que ningún paciente falte.
3️⃣ Dejaría de perder horas en informes TEA. ADI-R, ADOS-2, Perfil Sensorial — puntaje automático.
4️⃣ Me haría visible. Un perfil donde pacientes me encuentren.
5️⃣ No pagaría un peso por esto.

Porque Fonokit hace todo eso.
Gratis. Financiado por CORFO. 🇨🇱

👉 Regístrate y empieza a hacerlo bien.`,
    headline: '5 cosas que haría hoy si fuera tú',
    description: 'Consejo de fonoaudióloga a fonoaudióloga — gratis',
  },
  // #7 — "Por qué Fonokit es distinto" (Análisis Huel)
  {
    name: '#7 Por-Qué-Es-Distinto',
    primary_text: `Si eres fonoaudióloga, quédate y analiza esto con lupa 👇

Fonokit no es un software clínico más. ❌

1️⃣ Evaluación TEA: ADI-R, ADOS-2 y Perfil Sensorial integrados. Ningún otro software lo tiene.

2️⃣ Inteligencia Artificial: Transcripción automática de sesiones. Lo que tomaba horas, ahora minutos.

3️⃣ Marketplace profesional: Tu perfil visible para pacientes de todo Chile. Sin pagar.

4️⃣ Es gratis: No prueba de 7 días. CORFO financiando la digitalización de 11.000+ fonos.

5️⃣ Comunidad: Cientos de colegas ya están adentro.

Fonokit no vende software. Vende tiempo, tranquilidad y comunidad. 💜

👉 Regístrate gratis en fonokit.cl 🇨🇱`,
    headline: '5 razones que lo hacen distinto a todo',
    description: 'Análisis: por qué Fonokit no es un software más',
  },
  // #8 — "Organizadas vs Agotadas"
  {
    name: '#8 Organizadas-vs-Agotadas',
    primary_text: `¿Qué diferencia hay entre una fonoaudióloga que termina a las 6 y una que sigue haciendo informes a las 10?

No es la cantidad de pacientes. Es el sistema.

Las que terminan temprano:
✅ Agenda digital con recordatorios
✅ Fichas clínicas en minutos
✅ Evaluación TEA automática
✅ Transcripción con IA
✅ Pacientes llegan solos por marketplace

Las que se agotan:
❌ Fichas a mano
❌ Recordatorios por WhatsApp
❌ Informes TEA en Excel
❌ Buscan pacientes por Instagram

La diferencia no es talento. Es herramientas.

Fonokit es gratis. Financiado por CORFO. 🇨🇱

👉 Pasa al lado de las que terminan temprano.`,
    headline: '¿Terminas a las 6 o a las 10?',
    description: 'La diferencia no es talento. Es herramientas. Fonokit es gratis.',
  },
  // #9 — "Analicé 5 software" (Review comparativa)
  {
    name: '#9 Analicé-5-Software',
    primary_text: `Analicé los 5 software clínicos más usados en Chile para fonoaudiólogas 🔍

AgendaPro: $34.900/mes. Hecho para peluquerías. No tiene evaluación TEA.

Encuadrado: $26.000/mes. Genérico. Psicólogos, abogados, nutricionistas... todos usan lo mismo.

Medilink: ni muestra precios. Enfocado en centros médicos grandes.

Doctoralia: no tiene ficha clínica ni IA.

Clinera: $20 USD/mes. Nada específico para fonos.

Y luego está Fonokit:
✅ Evaluación TEA (ADI-R + ADOS-2 + Perfil Sensorial)
✅ Fichas con terminología fono
✅ Transcripción con IA
✅ Marketplace profesional
✅ Precio: $0. Para siempre. CORFO. 🇨🇱

No es opinión. Es comparación.

👉 Regístrate gratis en fonokit.cl`,
    headline: 'Comparé 5 software — Fonokit ganó',
    description: '$0 vs $140.000: la comparativa que necesitabas ver',
  },
  // #10 — "Falta de dirección"
  {
    name: '#10 Falta-De-Dirección',
    primary_text: `Muchas veces no es falta de ganas. Es falta de dirección.

Intentas organizar tu consulta, pruebas herramientas, ves tutoriales…

Pero nadie te enseñó cómo hacer que todo funcione junto.

Una planilla para fichas. Otra app para agenda. WhatsApp para recordatorios. Word para informes. Excel para puntajes TEA.

Seis herramientas que no se hablan entre sí. Y tú en el medio.

Las fonoaudiólogas organizadas no son distintas a ti. Solo tuvieron algo que cambia todo: un solo lugar donde todo está conectado.

Eso es Fonokit.
Todo en un solo lugar. Todo conectado. Todo gratis. CORFO. 🇨🇱

👉 fonokit.cl 💜`,
    headline: 'Un solo lugar. Todo conectado. $0.',
    description: 'Deja de pegar parches — Fonokit conecta todo gratis',
  },
  // #11 — "Caso estancada"
  {
    name: '#11 Caso-Estancada',
    primary_text: `Valentina tenía su consulta. Atendía pacientes. Pero estaba estancada.

Fichas en cuaderno. Evaluaciones TEA a mano. Informes hasta las 11. Pacientes que faltaban.

Se registró en Fonokit para ordenar su consulta.

En una semana:
📋 Informes TEA: de 2 horas → 15 minutos
📅 Pacientes que faltaban → 0
🕐 Horas en papeleo: de 10 → 2 a la semana
📍 4 pacientes nuevos del marketplace

Sin cambiar de profesión. Sin cambiar de ciudad. Sin pagar un peso.

Con sistema.

Fonokit. Gratis. CORFO. 🇨🇱

👉 fonokit.cl 💜`,
    headline: 'De 2 horas a 15 minutos — Caso real',
    description: 'Una semana en Fonokit cambió todo — gratis',
  },
  // #16 — "Pagando y dependiendo"
  {
    name: '#16 Pagando-Y-Dependiendo',
    primary_text: `Te voy a decir algo que probablemente ya sabes… pero no quieres aceptar:

Estás pagando todos los meses… y sigues sin tener tu consulta organizada.

Pagas agenda. $15.000.
Pagas fichas. $20.000.
Pagas publicidad para pacientes. $50.000.

Y si mañana dejas de pagar… te quedas igual. Pero con menos plata.

Eso no es organizarse. Eso es depender.

La diferencia real no es pagar más. Es tener UNA herramienta que haga todo.

Fonokit: agenda + fichas + TEA + IA + marketplace.

$0. Para siempre. CORFO. 🇨🇱

👉 Regístrate en fonokit.cl y deja de depender. 💜`,
    headline: 'Deja de depender. Deja de pagar.',
    description: '$95.000/mes en parches vs $0 en Fonokit — tú decides',
  },
]

const BOFU_VARIANTS = [
  // #19 — "Llévate Fonokit hoy" (Oferta completa)
  {
    name: '#19 Llévate-Fonokit-Hoy',
    primary_text: `Llévate hoy Fonokit con todo incluido + $0 al mes + para siempre 👇

No necesitas otro software genérico.

Necesitas la plataforma completa hecha para fonoaudiólogas:

📅 Agenda online con recordatorios automáticos
📋 Fichas clínicas con terminología fono
🧠 Evaluación TEA — ADI-R + ADOS-2 + Perfil Sensorial 2 con puntaje automático
🤖 Transcripción con IA
📍 Marketplace profesional

Todo esto por $0. Para siempre. Financiado por CORFO. 🇨🇱

Sin tarjeta de crédito. Sin letra chica.

Cientos de fonoaudiólogas ya se registraron.
La única diferencia entre ellas y tú… es que ellas ya empezaron.

👉 Regístrate gratis en fonokit.cl 💜`,
    headline: 'Todo incluido. $0. Para siempre.',
    description: 'Agenda + fichas + TEA + IA + marketplace — gratis por CORFO',
  },
  // #20 — "Duplicar productividad" (Case study)
  {
    name: '#20 Duplicar-Productividad',
    primary_text: `Duplicar la productividad de tu consulta fono no pasa por suerte. Pasa por entender qué herramientas usar.

Catalina, fonoaudióloga de Temuco, empezó a usar Fonokit cuando su consulta ya funcionaba, pero no rendía al ritmo que quería.

Después de una semana:
📋 Informes TEA: de 2 horas → 15 minutos
📅 Pacientes que faltaban: de 6 → 0
🕐 Horas en papeleo: de 12 → 3
📍 5 pacientes nuevos del marketplace

No cambió de profesión. No pagó un peso. Cambió la forma de gestionar su consulta.

Fonokit. Gratis. Para siempre. CORFO. 🇨🇱

👉 fonokit.cl 💜`,
    headline: 'De 12 horas de papeleo a 3 — Caso real',
    description: 'Así cambió todo en una semana — gratis con Fonokit',
  },
  // #21 — Bumper "Lo que te falta"
  {
    name: '#21 Lo-Que-Te-Falta',
    primary_text: `Si llevas tiempo pensando en organizar tu consulta… probablemente esto es lo que te falta.

No es otro cuaderno.
No es otra planilla Excel.
No es otro software de médicos.

Es Fonokit.

Agenda. Fichas. Evaluación TEA. IA. Marketplace.

Todo en uno. Todo gratis. Todo para fonos. 💜🇨🇱

👉 fonokit.cl`,
    headline: 'Lo que te falta. Gratis. fonokit.cl',
    description: 'Fonokit: todo en uno para fonoaudiólogas — $0',
  },
]

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const accessToken = Deno.env.get('META_CAPI_ACCESS_TOKEN')!
    const adAccountId = Deno.env.get('META_AD_ACCOUNT_ID')!

    const body = await req.json().catch(() => ({}))
    const imageBase64 = body.image_base64

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'image_base64 required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: any = { image: null, creatives: [], ads: [], summary: {} }

    // 1. Upload image
    console.log('[v3] Uploading image...')
    const imageUpload = await metaPostForm(`/${adAccountId}/adimages`, {
      bytes: imageBase64, access_token: accessToken,
    })
    const images = imageUpload?.images
    const imageHash = images ? Object.values(images)[0]?.hash : null
    if (!imageHash) throw new Error('Image upload failed: ' + JSON.stringify(imageUpload))
    results.image = { hash: imageHash }

    // Helper to create creative + ads for a variant set
    async function createVariantsForAdsets(
      variants: typeof TOFU_VARIANTS,
      adsets: typeof TOFU_ADSETS,
      funnelLabel: string
    ) {
      let creativeCount = 0, adCount = 0
      for (const variant of variants) {
        console.log(`[v3] Creating creative: ${variant.name}`)
        const objectStorySpec = {
          page_id: PAGE_ID,
          link_data: {
            image_hash: imageHash,
            link: LANDING_URL,
            message: variant.primary_text,
            name: variant.headline,
            description: variant.description,
            call_to_action: { type: 'SIGN_UP', value: { link: LANDING_URL } },
          },
        }

        const creative = await metaPostJSON(`/${adAccountId}/adcreatives`, {
          name: `Fonokit v3 — ${variant.name}`,
          object_story_spec: objectStorySpec,
        }, accessToken)
        results.creatives.push({ name: variant.name, id: creative.id, funnel: funnelLabel })
        creativeCount++

        // Create ad in each adset of this funnel
        for (const adset of adsets) {
          const adName = `${adset.name} — ${variant.name}`
          console.log(`[v3] Creating ad: ${adName}`)
          const ad = await metaPostForm(`/${adAccountId}/ads`, {
            name: adName,
            adset_id: adset.id,
            creative: JSON.stringify({ creative_id: creative.id }),
            status: 'PAUSED',
            access_token: accessToken,
          })
          results.ads.push({ name: adName, id: ad.id, adset: adset.name, funnel: funnelLabel })
          adCount++
        }
      }
      return { creativeCount, adCount }
    }

    // 2. Create TOFU variants → TOFU ad sets
    console.log('[v3] === TOFU ===')
    const tofu = await createVariantsForAdsets(TOFU_VARIANTS, TOFU_ADSETS, 'TOFU')

    // 3. Create MOFU variants → MOFU ad sets
    console.log('[v3] === MOFU ===')
    const mofu = await createVariantsForAdsets(MOFU_VARIANTS, MOFU_ADSETS, 'MOFU')

    // 4. Create BOFU variants → BOFU ad sets
    console.log('[v3] === BOFU ===')
    const bofu = await createVariantsForAdsets(BOFU_VARIANTS, BOFU_ADSETS, 'BOFU')

    results.summary = {
      tofu: { creatives: tofu.creativeCount, ads: tofu.adCount },
      mofu: { creatives: mofu.creativeCount, ads: mofu.adCount },
      bofu: { creatives: bofu.creativeCount, ads: bofu.adCount },
      total_creatives: tofu.creativeCount + mofu.creativeCount + bofu.creativeCount,
      total_ads: tofu.adCount + mofu.adCount + bofu.adCount,
    }

    return new Response(JSON.stringify({ success: true, ...results }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[v3] Error:', err)
    return new Response(JSON.stringify({
      success: false,
      error: (err as Error).message,
      details: (err as any).details || null,
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function metaPostForm(path: string, body: Record<string, string>) {
  const url = `${META_BASE_URL}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
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
