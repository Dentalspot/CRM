/**
 * @file BlogPostPage.jsx
 * @description Vista pública de artículo — diseño editorial estilo TED/Medium.
 * Filosofía DentalSpot: "No cobramos por dudas, cobramos por transformaciones."
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, CalendarDays, Clock, User,
  MessageCircle, ChevronRight, Loader2,
  ArrowRight, Sparkles,
} from 'lucide-react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabaseClient';
import { sanitizeHTML } from '@/lib/utils/sanitize';
import { calculateReadTime, formatDate } from '@/lib/blogUtils';
import logger from '@/lib/utils/logger';
import { useAuth } from '@/contexts/AuthContext';
import { useMetaTracking } from '@/hooks/useMetaTracking';

/* ─── Reading Progress Bar ─── */
const ReadingProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return <motion.div className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-50 origin-left" style={{ scaleX }} />;
};

/* ─── Share Buttons ─── */
const ShareBar = ({ title, url }) => {
  const [copied, setCopied] = useState(false);
  const enc = { u: encodeURIComponent(url), t: encodeURIComponent(title) };
  const copyLink = () => { navigator.clipboard.writeText(`"${title}" — vía dentalspot.cl ${url}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="flex items-center gap-1 text-slate-400">
      <span className="text-[10px] uppercase tracking-wider font-medium mr-1 hidden sm:inline">Compartir</span>
      <a href={`https://api.whatsapp.com/send?text=${enc.t}%20${enc.u}`} target="_blank" rel="noreferrer" className="p-2 rounded-full hover:bg-green-50 hover:text-green-600 transition-colors" aria-label="WhatsApp">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${enc.t}&url=${enc.u}`} target="_blank" rel="noreferrer" className="p-2 rounded-full hover:bg-slate-100 hover:text-slate-700 transition-colors" aria-label="Twitter">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc.u}`} target="_blank" rel="noreferrer" className="p-2 rounded-full hover:bg-slate-100 hover:text-slate-700 transition-colors" aria-label="Facebook">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </a>
      <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${enc.u}&title=${enc.t}`} target="_blank" rel="noreferrer" className="p-2 rounded-full hover:bg-slate-100 hover:text-slate-700 transition-colors" aria-label="LinkedIn">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      </a>
      <button onClick={() => { navigator.clipboard.writeText(`${title}\n\n🔗 ${url}\n\n#odontología #dentalspot #salud`); setCopied('ig'); setTimeout(() => setCopied(false), 2000); }} className="p-2 rounded-full hover:bg-pink-50 hover:text-pink-600 transition-colors relative" aria-label="Copiar para Instagram">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        {copied === 'ig' && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 text-white px-2 py-1 rounded whitespace-nowrap">Copiado para IG</span>}
      </button>
      <button onClick={() => { navigator.clipboard.writeText(`${title}\n\n🔗 ${url}\n\n#odontología #terapia #dentalspot`); setCopied('tk'); setTimeout(() => setCopied(false), 2000); }} className="p-2 rounded-full hover:bg-slate-100 hover:text-slate-700 transition-colors relative" aria-label="Copiar para TikTok">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.39a8.28 8.28 0 004.76 1.51V6.35a4.84 4.84 0 01-1-.17z"/></svg>
        {copied === 'tk' && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 text-white px-2 py-1 rounded whitespace-nowrap">Copiado para TikTok</span>}
      </button>
      <button onClick={copyLink} className="p-2 rounded-full hover:bg-slate-100 hover:text-slate-700 transition-colors relative" aria-label="Copiar link">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        {copied === true && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 text-white px-2 py-1 rounded whitespace-nowrap">Link copiado</span>}
      </button>
    </div>
  );
};

/* ─── Related Card ─── */
const RelatedCard = ({ post, index }) => {
  const slug = post.slug || post.id;
  const date = formatDate(post.published_at || post.created_at, 'dd MMM, yyyy');
  const author = post.author?.full_name || post.author_name || 'Equipo DentalSpot';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }} viewport={{ once: true }}>
      <Link to={`/blog/${slug}`} className="group block h-full">
        <article className="flex flex-col h-full">
          {post.cover_url && (
            <div className="aspect-[16/10] rounded-2xl overflow-hidden mb-5 bg-slate-100">
              <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            </div>
          )}
          <h3 className="text-lg font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-2">{post.title}</h3>
          <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">{post.excerpt || ''}</p>
          <div className="mt-auto flex items-center gap-3 text-xs text-slate-400">
            <span className="font-medium text-slate-600">{author}</span>
            <span>·</span>
            <span>{date}</span>
          </div>
        </article>
      </Link>
    </motion.div>
  );
};

/* ─── FAQ Section ─── */
const FaqSection = ({ faq }) => {
  if (!faq || !Array.isArray(faq) || faq.length === 0) return null;
  return (
    <section className="mt-16 pt-12 border-t border-slate-200">
      <h2 className="text-2xl font-bold mb-8 text-slate-900">Preguntas Frecuentes</h2>
      <div className="space-y-0 divide-y divide-slate-100">
        {faq.map((item, i) => (
          <details key={i} className="group py-5">
            <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-800 hover:text-primary transition-colors">
              <span className="pr-8">{item.question}</span>
              <ChevronRight className="h-4 w-4 transition-transform duration-200 group-open:rotate-90 text-slate-400 shrink-0" />
            </summary>
            <p className="mt-4 text-slate-600 leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
};

/* ─── CTA: Pregunta a un Dentista ─── */
const AskQuestionCta = ({ user }) => {
  const navigate = useNavigate();
  const handleAsk = () => {
    if (!user) { navigate('/auth/register?redirect=/dashboard/questions&reason=ask'); return; }
    navigate('/dashboard/questions');
  };

  return (
    <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="my-16">
      <div className="bg-gradient-to-br from-primary/5 via-white to-secondary/5 border border-primary/10 rounded-3xl p-8 md:p-12 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          <MessageCircle className="h-3.5 w-3.5" />
          100% gratuito
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">¿Este artículo te dejó con dudas?</h3>
        <p className="text-slate-500 max-w-lg mx-auto mb-8 leading-relaxed">
          Pregúntale directamente a un dentista. En DentalSpot no cobramos por resolver
          tus dudas — cobramos por las <strong className="text-slate-700">transformaciones</strong> que
          logramos en nuestros pacientes.
        </p>
        <Button size="lg" onClick={handleAsk} className="rounded-full px-8 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
          <MessageCircle className="mr-2 h-5 w-5" />
          {user ? 'Hacer una pregunta' : 'Inicia sesión y pregunta gratis'}
        </Button>
        <p className="mt-4 text-xs text-slate-400">Respuesta de profesionales verificados · Sin costo · Sin compromiso</p>
      </div>
    </motion.section>
  );
};

/* ─── CTA Final: Buscar Dentista ─── */
const FindTherapistCta = () => (
  <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="py-16 text-center">
    <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
    <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">¿Listo para dar el siguiente paso?</h3>
    <p className="text-slate-500 mb-8 leading-relaxed max-w-2xl mx-auto">
      Encuentra al dentista ideal para ti o tu hijo. Profesionales verificados, con experiencia comprobada y evaluaciones reales.
    </p>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Button size="lg" asChild className="rounded-full px-8">
        <Link to="/dentistas">Buscar Dentista <ArrowRight className="ml-2 h-4 w-4" /></Link>
      </Button>
      <Button size="lg" variant="outline" asChild className="rounded-full px-8">
        <Link to="/blog">Seguir leyendo</Link>
      </Button>
    </div>
  </motion.section>
);

/* ═════════════════════════════════════════
   MAIN: BlogPostPage
   ═════════════════════════════════════════ */
const BlogPostPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { trackEvent } = useMetaTracking();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (post?.title) trackEvent('ViewContent', { content_name: post.title, content_category: 'Blog' });
  }, [post?.title]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const { data, error: fetchErr } = await supabase
          .from('blog_posts')
          .select('*, author:profiles!blog_posts_author_id_fkey(full_name)')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();
        if (fetchErr) throw fetchErr;
        setPost(data);

        // Related articles
        const { data: relData } = await supabase
          .from('blog_posts')
          .select('id, title, slug, excerpt, cover_url, content, published_at, author_name, author:profiles!blog_posts_author_id_fkey(full_name)')
          .eq('status', 'published')
          .neq('id', data.id)
          .order('published_at', { ascending: false })
          .limit(3);
        setRelated(relData || []);
      } catch (err) {
        logger.error('Error fetching post:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchPost();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) return <div className="flex justify-center items-center py-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (error || !post) {
    return (
      <div className="text-center py-24 max-w-lg mx-auto px-4">
        <h1 className="text-2xl font-bold text-slate-900">Artículo no encontrado</h1>
        <p className="mt-3 text-slate-500">El artículo que buscas no existe o fue movido.</p>
        <Button asChild className="mt-8 rounded-full"><Link to="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al Blog</Link></Button>
      </div>
    );
  }

  const formattedDate = formatDate(post.published_at || post.created_at, 'dd MMMM, yyyy');
  const authorName = post.author?.full_name || post.author_name || 'Equipo DentalSpot';
  const readTime = calculateReadTime(post.content || '');
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const faq = typeof post.faq === 'string' ? (() => { try { return JSON.parse(post.faq); } catch { return null; } })() : post.faq;

  const metaDescription = post.meta_description || post.excerpt || post.subtitle || `${post.title} — Artículo de odontología por ${authorName}`;
  const metaImage = post.cover_url || 'https://dentalspot.cl/og-default.jpg';

  return (
    <>
      <Helmet>
        <title>{post.meta_title || post.title} | DentalSpot Blog</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={metaImage} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="DentalSpot" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={metaImage} />
        {post.keywords?.length > 0 && <meta name="keywords" content={post.keywords.join(', ')} />}
      </Helmet>
      <ReadingProgress />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

        {/* ── Header ── */}
        <header className="max-w-3xl mx-auto pt-8 md:pt-14 pb-8 px-4 md:px-0">
          <nav className="mb-10">
            <Button variant="ghost" asChild size="sm" className="text-slate-400 hover:text-slate-700 -ml-3 rounded-full">
              <Link to="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Blog DentalSpot</Link>
            </Button>
          </nav>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-[2.75rem] font-bold leading-[1.15] tracking-tight text-slate-900">
            {post.title}
          </motion.h1>

          {post.subtitle && (
            <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-5 text-lg md:text-xl text-slate-500 leading-relaxed">
              {post.subtitle}
            </motion.p>
          )}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{authorName}</p>
                <p className="text-xs text-slate-400">Dentista(a) en DentalSpot</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formattedDate}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{readTime} min de lectura</span>
            </div>
            <div className="sm:ml-auto"><ShareBar title={post.title} url={currentUrl} /></div>
          </motion.div>
        </header>

        {/* ── Cover ── */}
        {post.cover_url && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto px-4 md:px-0 mb-14">
            <div className="aspect-[2/1] rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50">
              <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          </motion.div>
        )}

        {/* ── Content ── */}
        <article className="max-w-3xl mx-auto px-4 md:px-0">
          <div
            className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-14 prose-h2:mb-5 prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-4 prose-p:text-slate-600 prose-p:leading-[1.8] prose-p:mb-6 prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-800 prose-strong:font-semibold prose-ul:text-slate-600 prose-ol:text-slate-600 prose-li:leading-[1.8] prose-li:mb-2 prose-blockquote:border-l-primary/40 prose-blockquote:bg-slate-50 prose-blockquote:rounded-r-xl prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:text-slate-600 prose-img:rounded-xl prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(post.content || '') }}
          />

          {/* Shareable Quote */}
          {post.shareable_quote && (
            <motion.blockquote initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }}
              className="my-14 py-10 px-8 bg-gradient-to-br from-primary/[0.04] via-white to-secondary/[0.04] rounded-2xl border border-primary/10 relative">
              <div className="absolute -top-3 left-8 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">Frase destacada</div>
              <p className="text-xl md:text-2xl italic text-slate-700 leading-relaxed font-light">"{post.shareable_quote}"</p>
              <footer className="mt-4 flex items-center justify-between">
                <cite className="text-sm text-slate-400 not-italic">— {authorName}</cite>
                <ShareBar title={post.shareable_quote} url={currentUrl} />
              </footer>
            </motion.blockquote>
          )}

          <FaqSection faq={faq} />
          <AskQuestionCta user={user} />

          {/* Footer */}
          <footer className="pt-10 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
              <div>
                <p className="text-sm font-semibold text-slate-800">¿Te resultó útil?</p>
                <p className="text-xs text-slate-400 mt-0.5">Compartir ayuda a más personas a encontrar respuestas</p>
              </div>
              <ShareBar title={post.title} url={currentUrl} />
            </div>
          </footer>
        </article>

        {/* ── Related ── */}
        {related.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 md:px-0 mt-20 mb-8">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-bold text-slate-900">Sigue leyendo</h2>
              <Button variant="ghost" asChild className="text-slate-500 hover:text-primary rounded-full">
                <Link to="/blog">Ver todos <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((r, i) => <RelatedCard key={r.id} post={r} index={i} />)}
            </div>
          </section>
        )}

        {/* ── Final CTA ── */}
        <div className="max-w-5xl mx-auto px-4 md:px-0 border-t border-slate-200">
          <FindTherapistCta />
        </div>
      </motion.div>
    </>
  );
};

export default BlogPostPage;
