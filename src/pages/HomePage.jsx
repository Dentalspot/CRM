import React, { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useMetaTracking } from '@/hooks/useMetaTracking';
import { Button } from '@/components/ui/button';
import { motion, useInView } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { trackEvent, trackPageView } from '@/lib/analytics';
import useScrollDepth from '@/hooks/useScrollDepth';
import useTimeOnPage from '@/hooks/useTimeOnPage';
import {
  ArrowRight, Sparkles, Users, Clock, Star,
  Brain, Calendar, BarChart3, Shield, Zap,
  MapPin, MessageCircle, FileImage, Search,
  Stethoscope, DollarSign, CheckCircle, Upload,
  ScanLine, UserCheck, Building2, Quote, Lock,
  AlertTriangle, Heart,
} from 'lucide-react';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui/accordion';
import FeaturedProfessionalsCarousel from '@/components/home/FeaturedProfessionalsCarousel';

// ─── ANIMATIONS ──────────────────────────────────────────────────────────────
const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const AnimatedCounter = ({ target, suffix = '', duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  useEffect(() => {
    if (!inView) return;
    const num = parseInt(target, 10);
    if (isNaN(num)) { setCount(target); return; }
    let start = 0;
    const step = Math.ceil(num / (duration * 60));
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setCount(num); clearInterval(timer); } else setCount(start);
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return <span ref={ref} className="tabular-nums">{typeof count === 'number' ? count.toLocaleString('es-CL') : count}{suffix}</span>;
};

const PhoneMockup = ({ children, className = '', size = 'md' }) => {
  const w = size === 'sm' ? 'w-[220px]' : size === 'lg' ? 'w-[280px]' : 'w-[260px]';
  return (
    <div className={`${w} ${className}`}>
      <div className="phone-frame"><div className="phone-screen"><div className="phone-notch" />
        <div className="bg-gradient-to-b from-slate-50 to-white p-4 min-h-[380px]">{children}</div>
      </div></div>
    </div>
  );
};

const FloatingCard = ({ children, className = '', delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + 0.5, duration: 0.5 }}
    className={`float-card-base p-3.5 ${className}`} style={{ animation: `float ${4 + delay}s ease-in-out infinite`, animationDelay: `${delay}s` }}>
    {children}
  </motion.div>
);

// ─── DATA ────────────────────────────────────────────────────────────────────
const featuredProfessionalsData = [
  { name: 'Dr. Andres Mendoza', specialty: 'Ortodoncia', rating: 5, location: 'Santiago' },
  { name: 'Dra. Camila Reyes', specialty: 'Endodoncia', rating: 5, location: 'Valparaiso' },
  { name: 'Dr. Felipe Torres', specialty: 'Implantologia', rating: 5, location: 'Concepcion' },
  { name: 'Dra. Sofia Navarro', specialty: 'Odontopediatria', rating: 4, location: 'Temuco' },
  { name: 'Dr. Nicolas Herrera', specialty: 'Cirugia Maxilofacial', rating: 5, location: 'Antofagasta' },
  { name: 'Dra. Valentina Diaz', specialty: 'Periodoncia', rating: 5, location: 'Santiago' },
];

// Patient home: solo testimonials de pacientes (los dentistas viven en /para-dentistas).
// Pendiente Fase 2: reemplazar por testimonials reales con consentimiento (ver spec 027 FR-OUT-005).
const testimonials = [
  { quote: 'Me dolía una muela un domingo. En 10 minutos tenía la orden de radiografía y al día siguiente ya estaba agendada.', name: 'María P.', role: 'Paciente', location: 'Santiago' },
  { quote: 'La IA detectó un problema que yo no había notado. Mi dentista confirmó el diagnóstico. Impresionante.', name: 'Carlos R.', role: 'Paciente', location: 'Valparaíso' },
  { quote: 'Me ahorré días de búsqueda. Vi precios claros, leí reseñas reales y reservé en menos de un minuto.', name: 'Antonia M.', role: 'Paciente', location: 'Concepción' },
];

const faqItems = [
  { question: 'Que es DentalSpot y como funciona?', answer: 'DentalSpot conecta pacientes con dentistas cercanos usando inteligencia artificial. Describes tu sintoma, obtienes una orden de radiografia, la IA analiza la imagen y te muestra los profesionales mas adecuados con precios transparentes.' },
  { question: 'El diagnostico de la IA reemplaza al dentista?', answer: 'No. Es una orientacion preliminar para reducir incertidumbre. Siempre necesitaras la evaluacion presencial de un profesional.' },
  { question: 'Como sube el laboratorio mi radiografia?', answer: 'El laboratorio sube tu radiografia directamente a tu perfil mediante un formulario simple o por correo y el sistema la asocia automaticamente.' },
  { question: 'Cuanto cuesta usar DentalSpot?', answer: 'Para pacientes, describir tu sintoma es gratuito. El analisis IA tiene un costo accesible. Los dentistas pagan suscripcion mensual.' },
  { question: 'Como se eligen los dentistas?', answer: 'El ranking se basa en cercania, disponibilidad, precio y resenas reales. No hay pago por posicionamiento.' },
  { question: 'Cumple con la normativa chilena?', answer: 'Si. Cumple con Ley 19.628 y Ley 20.584. Radiografias e informacion clinica se almacenan encriptadas.' },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────
const HomePage = () => {
  const navigate = useNavigate();
  const { trackEvent: trackMetaCustom } = useMetaTracking();
  const [symptomInput, setSymptomInput] = useState('');

  // Page view + analytics tracking (Meta legacy + nuevo módulo unificado)
  useEffect(() => {
    trackMetaCustom('ViewContent', { content_name: 'Home Page', content_category: 'Landing' });
    trackEvent('patient_home_view');
    trackPageView('/', 'DentalSpot | Encuentra un dentista en minutos');
  }, []);

  // Scroll depth tracking (25/50/75/100%)
  useScrollDepth((pct) => {
    trackEvent('scroll_depth', { depth_pct: pct, page: 'patient_home' });
  });

  // Time on page tracking
  useTimeOnPage((seconds) => {
    trackEvent('time_on_page', { seconds, page: 'patient_home' });
  });

  // Handler del hero CTA — trackea click + navega a /consulta con el síntoma
  const handleHeroCtaClick = () => {
    trackEvent('patient_hero_cta_click', { has_symptom_input: symptomInput.trim().length > 0 });
    if (symptomInput.trim().length > 0) {
      navigate(`/consulta?symptom=${encodeURIComponent(symptomInput.trim())}`);
    } else {
      navigate('/consulta');
    }
  };

  // Handler del FAQ — trackea apertura de pregunta
  const handleFaqOpen = (questionId) => {
    trackEvent('patient_faq_question_open', { question_id: questionId });
  };

  // Schema.org MedicalWebPage — más preciso que WebApplication para landing dirigida
  // a pacientes que buscan información médica/dental. Diferencia esta página del
  // dentist landing (que usa SoftwareApplication) para SEO + rich snippets distintos.
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: 'DentalSpot — Encuentra un dentista en minutos',
    url: 'https://dentalspot.cl',
    description: 'DentalSpot conecta pacientes con dentistas cercanos usando IA. Describe tu síntoma, recibe orientación con IA y agenda con el profesional ideal.',
    inLanguage: 'es-CL',
    medicalAudience: 'Patient',
    specialty: {
      '@type': 'MedicalSpecialty',
      name: 'Dentistry',
    },
    about: {
      '@type': 'MedicalCondition',
      name: 'Salud dental',
    },
    publisher: {
      '@type': 'Organization',
      name: 'DentalSpot',
      url: 'https://dentalspot.cl',
      logo: 'https://dentalspot.cl/logo-dentalspot-full.png',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'CL',
        addressRegion: 'Santiago',
      },
    },
    audience: {
      '@type': 'PeopleAudience',
      audienceType: ['Pacientes', 'Familias', 'Adultos'],
      geographicArea: { '@type': 'Country', name: 'Chile' },
    },
  };
  const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqItems.map(i => ({ '@type': 'Question', name: i.question, acceptedAnswer: { '@type': 'Answer', text: i.answer } })) };

  return (
    <>
      <Helmet>
        <title>DentalSpot | Encuentra un dentista en minutos</title>
        <meta name="description" content="Conectamos pacientes con dentistas cercanos usando IA. Describe tu sintoma, obtiene diagnostico preliminar y agenda con el profesional ideal." />
        <meta name="keywords" content="dentista, radiografia dental, diagnostico dental IA, agenda dentista, DentalSpot, healthtech Chile" />
        <link rel="canonical" href="https://dentalspot.cl" />
        <meta property="og:title" content="DentalSpot - Encuentra un dentista en minutos" />
        <meta property="og:description" content="Describe tu sintoma, analiza tu radiografia con IA y encuentra el dentista ideal." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dentalspot.cl" />
        <meta property="og:locale" content="es_CL" />
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div className="overflow-hidden">

        {/* ═══════════ 1. HERO — Dark + Phone Mockups ═══════════ */}
        <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden py-6 md:py-0" aria-labelledby="hero-heading">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-accent/8 blur-[120px] pointer-events-none" />
          <div className="absolute top-[30%] right-[20%] w-[200px] h-[200px] rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none animate-pulse-soft" />
          <div className="deco-circle w-[400px] h-[400px] top-[10%] left-[5%] hidden lg:block" />
          <div className="deco-circle w-[250px] h-[250px] bottom-[20%] left-[15%] hidden lg:block" style={{ borderColor: 'rgba(69,181,196,0.15)' }} />
          <div className="absolute top-[18%] left-[6%] grid grid-cols-5 gap-3 opacity-30 hidden lg:grid">
            {[...Array(15)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-white/20" />)}
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-screen pt-8 pb-12 md:py-20">
              {/* Content */}
              <div className="text-center lg:text-left">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-8">
                  <Sparkles className="w-3.5 h-3.5" /> Odontologia inteligente con IA
                </motion.div>

                <motion.h1 id="hero-heading" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
                  className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-3 leading-[1.1] tracking-tight">
                  Encuentra un dentista
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-[1.1] tracking-tight text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, hsl(189,49%,52%), hsl(170,40%,75%), hsl(187,77%,37%))', backgroundSize: '200% auto', animation: 'gradient-x 3s ease infinite' }}>
                  en minutos
                </motion.p>

                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="text-base md:text-lg text-white/60 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
                  Describe tu sintoma, obtiene un diagnostico preliminar con IA y agenda con el dentista ideal cerca de ti.
                </motion.p>

                {/* Flow icons */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className="flex items-center justify-center lg:justify-start gap-2 mb-8">
                  {[
                    { icon: '💬', label: 'Describe', color: 'from-primary to-primary/80' },
                    { icon: '📄', label: 'Orden', color: 'from-violet-500 to-purple-500' },
                    { icon: '🤖', label: 'IA analiza', color: 'from-amber-400 to-orange-400' },
                    { icon: '🦷', label: 'Agenda', color: 'from-emerald-400 to-teal-500' },
                  ].map((s, i) => (
                    <React.Fragment key={i}>
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex flex-col items-center gap-1">
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl md:text-2xl shadow-lg`}>{s.icon}</div>
                        <span className="text-[10px] md:text-xs font-semibold text-white/70">{s.label}</span>
                      </motion.div>
                      {i < 3 && <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0 mx-0.5" />}
                    </React.Fragment>
                  ))}
                </motion.div>

                {/* Input + CTA — paciente describe síntoma → flujo IA */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row items-stretch justify-center lg:justify-start gap-3 mb-8 max-w-xl mx-auto lg:mx-0">
                  <input
                    type="text"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleHeroCtaClick(); }}
                    placeholder="Describe tu síntoma o necesidad"
                    aria-label="Describe tu síntoma o necesidad"
                    className="flex-1 h-14 px-5 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/60 text-base focus:outline-none focus:border-primary focus:bg-white/15 transition-colors"
                  />
                  <Button
                    onClick={handleHeroCtaClick}
                    size="lg"
                    className="h-14 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-2xl shadow-lg shadow-primary/25 text-base flex items-center gap-2 justify-center whitespace-nowrap"
                  >
                    Encontrar dentista <ArrowRight className="w-5 h-5" />
                  </Button>
                </motion.div>

                {/* Trust */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  className="flex flex-wrap justify-center lg:justify-start gap-5">
                  {[
                    { icon: <Shield className="w-3.5 h-3.5" />, label: 'Datos encriptados' },
                    { icon: <Brain className="w-3.5 h-3.5" />, label: 'IA avanzada' },
                    { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Dentistas verificados' },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-white/40"><span className="text-primary">{b.icon}</span>{b.label}</div>
                  ))}
                </motion.div>
              </div>

              {/* Phone Mockups + Floating Cards */}
              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
                className="relative h-[520px] md:h-[600px] hidden md:block">

                <FloatingCard className="top-[12%] left-[30%] lg:left-[25%]" delay={0}>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-extrabold text-slate-800">4.8</span>
                    <span className="text-[10px] text-slate-400">200+ resenas</span>
                  </div>
                </FloatingCard>

                <FloatingCard className="top-[55%] right-[5%]" delay={0.5}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm"><Brain className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">+5,000</p>
                      <p className="text-[10px] text-slate-400">Analisis IA</p>
                    </div>
                  </div>
                </FloatingCard>

                <FloatingCard className="bottom-[15%] right-[10%]" delay={1}>
                  <div className="flex -space-x-2 mb-1.5">
                    {['bg-primary/20', 'bg-accent/20', 'bg-secondary/40'].map((c, i) => (
                      <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-white flex items-center justify-center text-xs`}>
                        {['🧑‍⚕️', '👩‍⚕️', '🦷'][i]}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400"><strong className="text-slate-700">+200</strong> dentistas activos</p>
                </FloatingCard>

                <FloatingCard className="top-[5%] right-[-5%] lg:right-[0] w-[170px] hidden lg:block" delay={1.5}>
                  <p className="text-[10px] text-slate-400 font-semibold mb-2">Proxima cita</p>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px]">🦷</div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-700">Dr. Mendoza</p>
                      <p className="text-[9px] text-slate-400">Ortodoncia · Hoy 15:00</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-medium">
                    <CheckCircle className="w-3 h-3" /> Confirmada
                  </div>
                </FloatingCard>

                {/* Secondary Phone */}
                <div className="absolute top-1/2 left-[5%] -translate-y-[45%] z-10 opacity-90 hidden lg:block">
                  <PhoneMockup size="sm">
                    <p className="text-[10px] text-slate-400 font-semibold mb-2">Analisis IA</p>
                    <div className="bg-white rounded-xl p-3 shadow-sm mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center"><Brain className="w-3 h-3 text-white" /></div>
                        <p className="text-[10px] font-bold text-slate-700">Resultado</p>
                      </div>
                      <div className="flex items-center gap-1 mb-1"><CheckCircle className="w-3 h-3 text-emerald-500" /><span className="text-[9px] text-emerald-600 font-medium">Sin urgencia</span></div>
                      <p className="text-[9px] text-slate-400">Caries incipiente pieza 36</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <p className="text-[10px] font-semibold text-slate-700 mb-2">Costo estimado</p>
                      <p className="text-lg font-extrabold text-primary">$45.000 - $65.000</p>
                      <p className="text-[9px] text-slate-400">Restauracion directa</p>
                    </div>
                  </PhoneMockup>
                </div>

                {/* Main Phone */}
                <div className="absolute top-1/2 left-1/2 -translate-x-[30%] lg:-translate-x-[25%] -translate-y-1/2 z-20">
                  <PhoneMockup>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm">👋</div>
                        <div>
                          <p className="text-[10px] text-slate-400">Bienvenida</p>
                          <p className="text-sm font-bold text-slate-800">Hola, Maria</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-[9px] text-emerald-600 font-semibold">3 citas hoy</span>
                      </div>
                    </div>
                    {/* Next appointment */}
                    <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">Proxima Cita</span>
                        <Calendar className="w-3.5 h-3.5 text-primary/50" />
                      </div>
                      <p className="text-xs font-bold text-slate-900">Dr. Mendoza</p>
                      <p className="text-[10px] text-slate-500">Ortodoncia</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Clock className="w-3 h-3 text-slate-400" /><span className="text-[10px] text-slate-600 font-medium">Hoy 15:00</span>
                        <MapPin className="w-3 h-3 text-slate-400 ml-1" /><span className="text-[10px] text-slate-600">Santiago</span>
                      </div>
                    </div>
                    {/* AI card */}
                    <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl border border-primary/10 p-3.5 mb-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center"><Brain className="w-3.5 h-3.5 text-white" /></div>
                        <p className="text-xs font-bold text-slate-900">IA Dental</p>
                      </div>
                      <p className="text-[10px] text-slate-600">Analisis listo</p>
                      <div className="flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3 text-emerald-500" /><span className="text-[10px] text-emerald-600 font-medium">Sin urgencia</span></div>
                    </div>
                    {/* Odontogram */}
                    <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
                      <div className="flex items-center gap-2 mb-1"><span className="text-sm">🦷</span><p className="text-xs font-bold text-slate-900">Odontograma</p></div>
                      <p className="text-[10px] text-slate-500">Ultima revision: 15 Mar 2026</p>
                    </div>
                  </PhoneMockup>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════ 2. COMO FUNCIONA — 4 pasos ═══════════ */}
        <section className="py-24 border-y border-slate-100 bg-grid-pattern" aria-labelledby="flow-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Asi de simple</motion.p>
              <motion.h2 id="flow-heading" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
                De sintoma a solucion en <span className="text-gradient-primary">4 pasos</span>
              </motion.h2>
              <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-base text-slate-500 max-w-2xl mx-auto">
                Sin llamar, sin esperar, sin incertidumbre. Todo digital y guiado.
              </motion.p>
            </div>
            <motion.div variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
              {[
                { icon: <MessageCircle className="w-7 h-7" />, title: 'Describe tu problema', desc: 'Escribe tu sintoma en lenguaje simple. La IA clasifica tu caso al instante.', color: 'bg-primary/10 text-primary' },
                { icon: <FileImage className="w-7 h-7" />, title: 'Obtiene tu orden', desc: 'Descarga un PDF con la orden de radiografia y laboratorios cercanos.', color: 'bg-violet-100 text-violet-600' },
                { icon: <ScanLine className="w-7 h-7" />, title: 'La IA analiza', desc: 'Diagnostico preliminar, nivel de urgencia y estimacion de costos.', color: 'bg-amber-100 text-amber-600' },
                { icon: <UserCheck className="w-7 h-7" />, title: 'Elige y agenda', desc: 'Dentistas cercanos con precios, disponibilidad y resenas. Agenda directo.', color: 'bg-emerald-100 text-emerald-600' },
              ].map((s, i) => (
                <motion.div key={i} variants={fadeUp} className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
                    <span className="text-3xl font-black text-slate-200">{i + 1}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                  {i < 3 && <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10"><ArrowRight className="w-6 h-6 text-slate-300" /></div>}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════ 3. PROBLEM — Visual chaos card (AFI style) ═══════════ */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 10% 20%, rgba(69,181,196,0.08) 0%, transparent 40%), radial-gradient(ellipse at 90% 80%, rgba(69,181,196,0.05) 0%, transparent 40%)' }} />
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Chaos card */}
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
                <div className="bg-white rounded-3xl p-7 shadow-xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-lg">🦷</div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-800">Sin DentalSpot</h4>
                      <span className="text-xs text-slate-400">El camino tradicional</span>
                    </div>
                    <span className="text-[10px] bg-red-50 text-red-500 px-3 py-1 rounded-full font-semibold">😩 Frustrante</span>
                  </div>
                  {[
                    { title: 'Buscar dentista en Google', sub: 'Sin referencias reales', urgent: true },
                    { title: 'Llamar para pedir hora', sub: 'Nadie contesta, buzón lleno', urgent: true },
                    { title: 'Esperar 2 semanas por cita', sub: 'Y el dolor sigue...', urgent: false },
                    { title: 'Sorpresa con el precio', sub: 'Presupuesto sin aviso previo', urgent: false },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-2 hover:bg-slate-100 transition-all">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${t.urgent ? 'bg-red-100 text-red-500 border border-red-200' : 'border-2 border-slate-200 bg-white'}`}>
                        {t.urgent && '✕'}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-700">{t.title}</p>
                        <p className={`text-[10px] ${t.urgent ? 'text-red-400' : 'text-slate-400'}`}>{t.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Floating stats */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-lg animate-float z-30">
                  <p className="text-2xl font-extrabold text-red-400">72%</p>
                  <div className="w-8 h-0.5 bg-slate-100 rounded my-1.5" />
                  <p className="text-[10px] text-slate-400 leading-tight">Pacientes insatisfechos<br/>con la experiencia</p>
                </div>
                <div className="absolute bottom-[25%] -left-6 bg-white rounded-2xl p-4 shadow-lg animate-float-slow z-30 hidden md:block">
                  <p className="text-2xl font-extrabold text-amber-400">14 dias</p>
                  <div className="w-8 h-0.5 bg-slate-100 rounded my-1.5" />
                  <p className="text-[10px] text-slate-400 leading-tight">Espera promedio<br/>por una cita</p>
                </div>
              </motion.div>

              {/* Content */}
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <span className="inline-flex items-center gap-2 bg-red-50 text-red-500 px-4 py-2 rounded-full text-xs font-semibold mb-5">
                  <AlertTriangle className="w-3.5 h-3.5" /> El Problema
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 leading-tight">
                  Ir al dentista no deberia ser <span className="text-red-400">una odisea.</span>
                </h2>
                <p className="text-base text-slate-500 mb-8 leading-relaxed">
                  Llamar, esperar semanas, no saber el precio, llegar sin diagnostico. El sistema dental esta roto.
                </p>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[{ v: '14 dias', l: 'Espera promedio' }, { v: '72%', l: 'Sin informacion de precios' }, { v: '0', l: 'Pre-diagnostico antes de ir' }].map((s, i) => (
                    <div key={i} className="text-center p-4 bg-slate-50 rounded-2xl">
                      <p className="text-xl font-extrabold text-primary">{s.v}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-6 flex items-center gap-4 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl flex-shrink-0">💡</div>
                  <p className="text-white text-sm font-medium relative z-10">
                    DentalSpot resuelve todo esto. <strong className="text-emerald-200">En minutos, no semanas.</strong>
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════ 4. SOLUTION — Teal gradient + Phone (AFI style) ═══════════ */}
        <section className="relative">
          <div className="bg-gradient-to-br from-primary via-accent to-teal-700 py-24 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute bottom-12 -left-20 w-[250px] h-[250px] rounded-full border-2 border-white/10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-slate-50" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />

            <div className="container mx-auto px-4 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Phone */}
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="relative flex justify-center order-last lg:order-first">
                  <div className="absolute top-[8%] left-[5%] bg-white rounded-2xl p-3 shadow-xl animate-float z-30 hidden md:block">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm">🤖</div>
                      <div><p className="text-xs font-bold text-slate-800">Diagnostico IA</p><p className="text-[9px] text-slate-400">30 segundos</p></div>
                    </div>
                  </div>
                  <div className="absolute bottom-[18%] right-[5%] bg-white rounded-2xl p-3 shadow-xl animate-float-slow z-30 hidden md:block">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm"><DollarSign className="w-4 h-4 text-white" /></div>
                      <div><p className="text-xs font-bold text-slate-800">Precio claro</p><p className="text-[9px] text-slate-400">Antes de agendar</p></div>
                    </div>
                  </div>
                  <PhoneMockup size="lg">
                    <div className="text-center mb-5 pb-4 border-b border-slate-100">
                      <p className="text-2xl font-extrabold text-gradient-primary tracking-tight">DentalSpot</p>
                      <p className="text-[9px] text-slate-400 mt-1">Odontologia inteligente</p>
                    </div>
                    {[
                      { icon: '💬', title: 'Teleorientacion IA', sub: 'Describe tu sintoma', bg: 'bg-gradient-to-r from-primary/10 to-accent/10' },
                      { icon: '📄', title: 'Orden Radiografia', sub: 'PDF descargable', bg: 'bg-gradient-to-r from-violet-50 to-violet-100' },
                      { icon: '🤖', title: 'Analisis con IA', sub: 'Diagnostico preliminar', bg: 'bg-gradient-to-r from-amber-50 to-amber-100' },
                      { icon: '🦷', title: 'Match Dentista', sub: 'Cercanos con precios', bg: 'bg-gradient-to-r from-emerald-50 to-emerald-100' },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-2.5 hover:bg-white hover:shadow-md transition-all">
                        <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center text-lg`}>{f.icon}</div>
                        <div><p className="text-xs font-bold text-slate-800">{f.title}</p><p className="text-[9px] text-slate-400">{f.sub}</p></div>
                      </div>
                    ))}
                    <div className="mt-4 w-full py-3 bg-gradient-to-r from-primary to-accent text-white text-center rounded-xl text-xs font-semibold">Empezar Ahora 🦷</div>
                  </PhoneMockup>
                </motion.div>

                {/* Content */}
                <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="text-white">
                  <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-semibold mb-5">
                    <Sparkles className="w-3.5 h-3.5" /> La Solucion
                  </span>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
                    Con <span className="text-emerald-200">DentalSpot</span> todo cambia
                  </h2>
                  <p className="text-base text-white/70 mb-8 leading-relaxed max-w-lg">
                    De sintoma a solucion en minutos. IA que orienta, precios claros y dentistas verificados.
                  </p>
                  <div className="space-y-3 mb-8">
                    {[
                      { icon: '⚡', title: 'Orientacion inmediata', sub: 'IA clasifica tu caso al instante' },
                      { icon: '💰', title: 'Precios transparentes', sub: 'Compara antes de decidir' },
                      { icon: '📍', title: 'Dentistas cercanos', sub: 'Por ubicacion, especialidad y resenas' },
                    ].map((v, i) => (
                      <div key={i} className="flex items-center gap-3.5 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/15 hover:translate-x-2 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg flex-shrink-0">{v.icon}</div>
                        <div><h4 className="text-sm font-bold text-white">{v.title}</h4><p className="text-xs text-white/60">{v.sub}</p></div>
                      </div>
                    ))}
                  </div>
                  <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full px-8 text-base font-bold shadow-xl">
                    <Link to="/consulta" className="flex items-center gap-2">Empezar ahora <ArrowRight className="w-4 h-4" /></Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ 5. TESTIMONIALS ═══════════ */}
        {/* (Sección "Para Dentistas" eliminada — ahora vive en /para-dentistas, ver spec 027) */}
        <section data-section="testimonials" className="py-24 bg-slate-900 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Lo que dicen de DentalSpot</h2>
              <p className="text-slate-400">Pacientes y dentistas reales</p>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
              {testimonials.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="snap-start min-w-[300px] max-w-[340px] flex-shrink-0 glass-card-dark rounded-2xl p-6 hover:border-primary/20 transition-all">
                  <Quote className="w-7 h-7 text-primary/30 mb-3" />
                  <p className="text-slate-300 text-sm leading-relaxed mb-5">{t.quote}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-white text-xs font-bold">
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{t.name}</p>
                      <p className="text-slate-500 text-xs">{t.role} · {t.location}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ 7. PROFESSIONALS ═══════════ */}
        <section className="py-24 bg-white" aria-labelledby="professionals-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <motion.h2 id="professionals-heading" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">Dentistas verificados</motion.h2>
              <p className="text-base text-slate-500">Profesionales con experiencia, resenas reales y disponibilidad.</p>
            </div>
            <FeaturedProfessionalsCarousel professionals={featuredProfessionalsData} />
            <div className="text-center mt-10">
              <Button asChild variant="outline" size="lg" className="rounded-2xl">
                <Link to="/dentistas" className="flex items-center gap-2">Ver todos los dentistas <ArrowRight className="w-5 h-5" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ═══════════ 7.5 TRUST STRIP — Compliance + origen ═══════════ */}
        <section className="py-12 bg-white border-y border-slate-100">
          <div className="container mx-auto px-4">
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
            >
              {[
                { title: 'Hecho en Chile', desc: 'Para pacientes chilenos', icon: <span className="text-2xl">🇨🇱</span> },
                { title: 'Datos protegidos', desc: 'Ley 21.719 — privacidad respetada', icon: <Lock className="w-6 h-6 text-primary" /> },
                { title: 'Dentistas verificados', desc: 'Profesionales con título validado', icon: <CheckCircle className="w-6 h-6 text-primary" /> },
                { title: 'Reseñas reales', desc: 'Solo de pacientes que reservaron', icon: <Star className="w-6 h-6 text-primary" /> },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} className="text-center px-2">
                  <div className="flex justify-center mb-3">{item.icon}</div>
                  <p className="text-sm font-bold text-slate-800 mb-1">{item.title}</p>
                  <p className="text-xs text-slate-500 leading-snug">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════ 8. FAQ ═══════════ */}
        <section className="py-20 bg-slate-50" aria-labelledby="faq-heading">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 id="faq-heading" className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-3">Preguntas frecuentes</h2>
                <p className="text-slate-500">Todo sobre DentalSpot</p>
              </div>
              <Accordion type="single" collapsible className="space-y-3" onValueChange={(val) => { if (val) handleFaqOpen(val); }}>
                {faqItems.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="bg-white rounded-2xl border border-slate-100 px-6 hover:border-slate-200 transition-colors">
                    <AccordionTrigger className="text-left font-semibold text-slate-800 hover:no-underline py-5">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-slate-600 leading-relaxed pb-5">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* ═══════════ 9. FINAL CTA ═══════════ */}
        <section className="py-24 bg-white text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-semibold mb-5">🦷 Tu salud no puede esperar</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
              Describe tu sintoma y en minutos tendras un plan
            </h2>
            <p className="text-base text-slate-500 max-w-lg mx-auto mb-10">
              Diagnostico preliminar con IA, precios claros y el dentista ideal cerca de ti.
            </p>
            <div className="flex items-center justify-center mb-6">
              <Button asChild size="lg" className="h-14 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold rounded-2xl shadow-lg text-base">
                <Link to="/consulta" className="flex items-center gap-2">Empezar ahora <ArrowRight className="w-5 h-5" /></Link>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6">
              {['Gratis para pacientes', 'IA avanzada', 'Sin esperas'].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 text-slate-400 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary" /> {t}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ 10. CLOSING QUOTE ═══════════ */}
        <section className="py-16 bg-gradient-to-r from-primary/5 to-accent/5 text-center">
          <div className="container mx-auto px-4">
            <p className="text-xl md:text-2xl text-slate-700 font-medium italic max-w-2xl mx-auto leading-relaxed">
              "Tu salud dental no deberia depender de a quien conoces.<br/>
              <strong className="text-primary not-italic">Deberia depender de quien es el mejor para ti.</strong>"
            </p>
          </div>
        </section>

      </div>
    </>
  );
};

export default HomePage;
