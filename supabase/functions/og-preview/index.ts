import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dentalspot.cl',
  'Content-Type': 'text/html; charset=utf-8',
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')

  if (!slug) {
    return new Response('Missing slug', { status: 400 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Try by slug first, then by UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)

  let query = supabase
    .from('blog_posts')
    .select('id, title, subtitle, excerpt, cover_url, meta_title, meta_description, keywords, author_name, published_at, slug')
    .eq('status', 'published')

  if (isUuid) {
    query = query.eq('id', slug)
  } else {
    query = query.eq('slug', slug)
  }

  const { data: post, error } = await query.single()

  if (error || !post) {
    // Fallback: redirect to SPA
    return new Response('', {
      status: 302,
      headers: { Location: `https://fonokit.cl/blog/${slug}` },
    })
  }

  const title = post.meta_title || post.title || 'FONOKIT Blog'
  const description = post.meta_description || post.excerpt || post.subtitle || `${post.title} — Artículo de fonoaudiología en FONOKIT`
  const image = post.cover_url || 'https://fonokit.cl/og-default.jpg'
  const canonicalUrl = `https://fonokit.cl/blog/${post.slug || post.id}`
  const author = post.author_name || 'Equipo FONOKIT'
  const publishedAt = post.published_at || ''
  const keywords = post.keywords?.join(', ') || 'fonoaudiología, terapia, salud'

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} | FONOKIT Blog</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="${escapeHtml(keywords)}">
  <meta name="author" content="${escapeHtml(author)}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="FONOKIT">
  <meta property="og:locale" content="es_CL">
  ${publishedAt ? `<meta property="article:published_time" content="${publishedAt}">` : ''}
  <meta property="article:author" content="${escapeHtml(author)}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">

  <link rel="canonical" href="${canonicalUrl}">

  <!-- Redirect human visitors to the SPA -->
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}">
</head>
<body>
  <h1>${escapeHtml(post.title)}</h1>
  <p>${escapeHtml(description)}</p>
  <p>Redirecting to <a href="${canonicalUrl}">${canonicalUrl}</a>...</p>
</body>
</html>`

  return new Response(html, { status: 200, headers: corsHeaders })
})

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
