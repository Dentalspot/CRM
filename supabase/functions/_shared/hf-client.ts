/**
 * Shared HuggingFace Inference API client for all Edge Functions.
 * Uses free HF Inference API with retry logic for cold starts.
 */

const HF_BASE = 'https://router.huggingface.co/hf-inference/models'

function getToken(): string {
  const token = Deno.env.get('HF_TOKEN') || Deno.env.get('HUGGING_FACE_API_KEY')
  if (!token) throw new Error('Missing HF_TOKEN or HUGGING_FACE_API_KEY')
  return token
}

async function hfRequest(
  model: string,
  body: unknown,
  options: { retries?: number; contentType?: string } = {}
): Promise<Response> {
  const { retries = 3, contentType = 'application/json' } = options
  const token = getToken()
  const url = `${HF_BASE}/${model}`

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
        'x-wait-for-model': 'true',
      },
      body: contentType === 'application/json' ? JSON.stringify(body) : body as BodyInit,
    })

    if (res.ok) return res

    // Model loading - wait and retry
    if (res.status === 503) {
      const delay = [10000, 20000, 30000][attempt] || 30000
      console.log(`[HF] Model ${model} loading, retry ${attempt + 1}/${retries} in ${delay / 1000}s`)
      await new Promise(r => setTimeout(r, delay))
      continue
    }

    // Rate limit
    if (res.status === 429) {
      const delay = 60000
      console.log(`[HF] Rate limited, waiting ${delay / 1000}s`)
      await new Promise(r => setTimeout(r, delay))
      continue
    }

    const error = await res.text()
    throw new Error(`HF API error ${res.status}: ${error}`)
  }

  throw new Error(`HF API failed after ${retries} retries for ${model}`)
}

/**
 * Strip PII from text before sending to external API.
 */
export function stripPII(text: string): string {
  return text
    .replace(/\b\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4}\b/g, '[FECHA]') // dates
    .replace(/\b\d{7,8}-[\dkK]\b/g, '[RUT]') // Chilean RUT
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    .replace(/\+?\d{9,12}/g, '[TELEFONO]')
}

// ============================================================
// TEXT GENERATION (Mistral-7B / Gemma)
// ============================================================

export async function hfTextGeneration(
  prompt: string,
  options: { model?: string; maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const {
    model = 'mistralai/Mistral-7B-Instruct-v0.3',
    maxTokens = 1024,
    temperature = 0.3,
  } = options

  // Wrap in Mistral instruction format
  const formattedPrompt = model.includes('Mistral')
    ? `<s>[INST] ${prompt} [/INST]`
    : prompt

  const res = await hfRequest(model, {
    inputs: formattedPrompt,
    parameters: {
      max_new_tokens: maxTokens,
      temperature,
      return_full_text: false,
    },
  })

  const data = await res.json()
  return data[0]?.generated_text || ''
}

// ============================================================
// SUMMARIZATION (BART-CNN)
// ============================================================

export async function hfSummarization(
  text: string,
  options: { maxLength?: number; minLength?: number } = {}
): Promise<string> {
  const { maxLength = 200, minLength = 30 } = options

  const res = await hfRequest('facebook/bart-large-cnn', {
    inputs: text,
    parameters: { max_length: maxLength, min_length: minLength },
  })

  const data = await res.json()
  return data[0]?.summary_text || ''
}

// ============================================================
// ZERO-SHOT CLASSIFICATION (BART-MNLI)
// ============================================================

export async function hfClassification(
  text: string,
  labels: string[],
  options: { multiLabel?: boolean } = {}
): Promise<{ label: string; score: number; scores: Record<string, number> }> {
  const { multiLabel = false } = options

  const res = await hfRequest('facebook/bart-large-mnli', {
    inputs: text,
    parameters: { candidate_labels: labels, multi_label: multiLabel },
  })

  const data = await res.json()
  const scores: Record<string, number> = {}
  if (data.labels && data.scores) {
    data.labels.forEach((l: string, i: number) => { scores[l] = data.scores[i] })
  }

  return {
    label: data.labels?.[0] || '',
    score: data.scores?.[0] || 0,
    scores,
  }
}

// ============================================================
// EMBEDDINGS (MiniLM-L6-v2 → 384 dims)
// ============================================================

export async function hfEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const res = await hfRequest('sentence-transformers/all-MiniLM-L6-v2', {
    inputs: texts,
  })

  return await res.json()
}

// ============================================================
// IMAGE GENERATION (FLUX.1-schnell)
// ============================================================

export async function hfImageGeneration(
  prompt: string,
  options: { model?: string } = {}
): Promise<ArrayBuffer> {
  const { model = 'black-forest-labs/FLUX.1-schnell' } = options

  const res = await hfRequest(model, { inputs: prompt }, { retries: 3 })

  if (!res.ok) {
    throw new Error(`Image generation failed: ${res.status}`)
  }

  return await res.arrayBuffer()
}

// ============================================================
// TRANSCRIPTION (Whisper - already used in process-notiz)
// ============================================================

export async function hfTranscription(
  audioBuffer: ArrayBuffer,
  contentType = 'audio/webm'
): Promise<string> {
  const res = await hfRequest('openai/whisper-large-v3-turbo', audioBuffer, {
    contentType,
  })

  const data = await res.json()
  return data.text || ''
}
