import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useMetaTracking } from '@/hooks/useMetaTracking';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Users, Clock, Star,
  Brain, Calendar, BarChart3, Shield, Zap,
  MapPin, MessageCircle, FileImage, Search,
  Stethoscope, DollarSign, CheckCircle, Upload,
  ScanLine, UserCheck, Building2,
} from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

import HeroSearchForm from '@/components/home/HeroSearchForm';
import FeaturedProfessionalsCarousel from '@/components/home/FeaturedProfessionalsCarousel';

// ─── ANIMATION VARIANTS ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const flowSteps = [
  {
    step: 1,
    icon: <MessageCircle className="w-7 h-7" />,
    title: 'Describe tu problema',
    description: 'Escribe tu sintoma en lenguaje simple: "me duele una muela", "se me quebro un diente". Nuestra IA clasifica tu caso al instante.',
    color: 'bg-primary/10 text-primary',
  },
  {
    step: 2,
    icon: <FileImage className="w-7 h-7" />,
    title: 'Obtiene tu orden de radiografia',
    description: 'Descarga un PDF con la orden medica para tu radiografia. Incluye tipo de examen recomendado y laboratorios cercanos.',
    color: 'bg-secondary/10 text-accent',
  },
  {
    step: 3,
    icon: <ScanLine className="w-7 h-7" />,
    title: 'La IA analiza tu radiografia',
    description: 'El laboratorio sube tu imagen y nuestra IA entrega un diagnostico preliminar, nivel de urgencia y estimacion de costos.',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    step: 4,
    icon: <UserCheck className="w-7 h-7" />,
    title: 'Elige tu dentista y agenda',
    description: 'Ve dentistas cercanos con precios, disponibilidad, especialidad y resenas. Agenda directo, sin llamadas.',
    color: 'bg-emerald-100 text-emerald-600',
  },
];

const benefits = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: 'Teleorientacion con IA',
    description: 'Describe tu sintoma y recibe orientacion inmediata. La IA clasifica tu caso y te guia al siguiente paso.',
    gradient: 'from-primary to-accent',
  },
  {
    icon: <FileImage className="w-6 h-6" />,
    title: 'Orden de radiografia automatica',
    description: 'PDF descargable con tipo de examen, instrucciones y mapa de laboratorios asociados. Sin filas ni esperas.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: <ScanLine className="w-6 h-6" />,
    title: 'Analisis radiografico con IA',
    description: 'Diagnostico preliminar automatizado, nivel de urgencia y alternativas de tratamiento con estimacion de costos.',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: 'Match con dentistas cercanos',
    description: 'Modelo tipo Uber: encuentra profesionales por ubicacion, especialidad, precio y disponibilidad en tiempo real.',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    icon: <DollarSign className="w-6 h-6" />,
    title: 'Transparencia de precios',
    description: 'Estimaciones claras antes de agendar. Compara precios entre profesionales y elige con informacion real.',
    gradient: 'from-primary to-secondary',
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: 'Agenda integrada',
    description: 'Reserva directa con confirmacion por correo y WhatsApp. Recordatorios automaticos e instrucciones previas.',
    gradient: 'from-rose-400 to-pink-500',
  },
];

const featuredProfessionalsData = [
  { name: 'Dr. Andres Mendoza',   specialty: 'Ortodoncia',             rating: 5, location: 'Santiago' },
  { name: 'Dra. Camila Reyes',    specialty: 'Endodoncia',             rating: 5, location: 'Valparaiso' },
  { name: 'Dr. Felipe Torres',    specialty: 'Implantologia',          rating: 5, location: 'Concepcion' },
  { name: 'Dra. Sofia Navarro',   specialty: 'Odontopediatria',        rating: 4, location: 'Temuco' },
  { name: 'Dr. Nicolas Herrera',  specialty: 'Cirugia Maxilofacial',   rating: 5, location: 'Antofagasta' },
  { name: 'Dra. Valentina Diaz',  specialty: 'Periodoncia',            rating: 5, location: 'Santiago' },
];

const faqItems = [
  {
    question: 'Que es DentalSpot y como funciona?',
    answer:
      'DentalSpot es una plataforma que conecta pacientes con dentistas cercanos usando inteligencia artificial. Describes tu sintoma, obtienes una orden de radiografia, la IA analiza la imagen y te muestra los profesionales mas adecuados para tu caso con precios transparentes.',
  },
  {
    question: 'El diagnostico de la IA reemplaza al dentista?',
    answer:
      'No. El analisis con IA es una orientacion preliminar para reducir incertidumbre y ayudarte a tomar mejores decisiones. Siempre necesitaras la evaluacion presencial de un profesional. El disclaimer es claro: no reemplaza un diagnostico profesional.',
  },
  {
    question: 'Como sube el laboratorio mi radiografia?',
    answer:
      'El laboratorio puede subir tu radiografia directamente a tu perfil mediante un formulario simple con tu codigo de paciente. Tambien puede enviarla por correo y el sistema la asocia automaticamente a tu caso.',
  },
  {
    question: 'Cuanto cuesta usar DentalSpot?',
    answer:
      'Para pacientes, describir tu sintoma y recibir orientacion es gratuito. El analisis de radiografia con IA tiene un costo accesible que se muestra antes de confirmar. Los dentistas pagan una suscripcion mensual para aparecer en la plataforma.',
  },
  {
    question: 'Como se eligen los dentistas que aparecen?',
    answer:
      'Los profesionales son verificados antes de unirse. El ranking se basa en cercania, disponibilidad, precio y resenas de pacientes reales. No hay pago por posicionamiento: el mejor match sube naturalmente.',
  },
  {
    question: 'DentalSpot cumple con la normativa chilena de datos de salud?',
    answer:
      'Si. DentalSpot cumple con la Ley 19.628 de Proteccion de Datos Personales y la Ley 20.584 sobre Derechos y Deberes de los Pacientes. Las radiografias e informacion clinica se almacenan de forma encriptada.',
  },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const HomePage = () => {
  const { trackEvent } = useMetaTracking();

  useEffect(() => {
    trackEvent('ViewContent', { content_name: 'Home Page', content_category: 'Landing' });
  }, []);

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'DentalSpot',
    url: 'https://dentalspot.cl',
    description:
      'DentalSpot conecta pacientes con dentistas cercanos usando inteligencia artificial. Describe tu sintoma, analiza tu radiografia con IA y agenda con el profesional ideal.',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', description: 'Teleorientacion dental con IA y marketplace de dentistas' },
    provider: {
      '@type': 'Organization',
      name: 'DentalSpot',
      address: { '@type': 'PostalAddress', addressCountry: 'CL' },
    },
    audience: { '@type': 'Audience', audienceType: ['Pacientes', 'Dentistas', 'Clinicas Dentales', 'Laboratorios'] },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <>
      <Helmet>
        <title>DentalSpot | Resuelve tu problema dental 
          en minutos</title>
        <meta
          name="description"
          content="Conectamos pacientes con dentistas cercanos usando IA. Describe tu sintoma, obtiene un diagnostico preliminar y agenda con el profesional ideal. Odontologia inteligente en Chile."
        />
        <meta
          name="keywords"
          content="dentista, odontologo, radiografia dental, diagnostico dental IA, agenda dentista, DentalSpot, healthtech Chile, odontologia online, implantes, ortodoncia"
        />
        <link rel="canonical" href="https://dentalspot.cl" />
        <meta property="og:title" content="DentalSpot - Resuelve tu problema dental en minutos" />
        <meta
          property="og:description"
          content="Describe tu sintoma, analiza tu radiografia con IA y encuentra el dentista ideal cerca de ti. Precios transparentes y agenda directa."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dentalspot.cl" />
        <meta property="og:locale" content="es_CL" />
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50">

        {/* ══════════════════════════════════════════════════════════════════
            1. HERO
        ══════════════════════════════════════════════════════════════════ */}
        <section className="relative py-16 md:py-24 lg:py-28 overflow-hidden" aria-labelledby="hero-heading">
          {/* Floating animated orbs */}
          <motion.div animate={{ y: [0, 30, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <motion.div animate={{ y: [0, -25, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-60 -left-32 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />
          <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">

              {/* ── LEFT COLUMN: Content ── */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                className="text-center lg:text-left"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-xl border border-primary/20 text-primary text-sm font-medium mb-6 shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Odontologia inteligente con IA
                </motion.div>

                <motion.h1
                  id="hero-heading"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 leading-tight tracking-tight"
                >
                  Resuelve tu problema dental
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"
                >
                  en minutos
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-base sm:text-lg md:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed"
                >
                  Describe tu sintoma, obtiene un diagnostico preliminar con IA y agenda con el dentista ideal cerca de ti.
                </motion.p>

                {/* Flow icons - always horizontal */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.25 }}
                  className="flex items-center justify-center lg:justify-start gap-1 sm:gap-2 mb-8"
                >
                  {[
                    { icon: '\u{1F4AC}', label: 'Describe', color: 'from-primary to-primary/80' },
                    { icon: '\u{1F4C4}', label: 'Orden', color: 'from-violet-500 to-purple-500' },
                    { icon: '\u{1F916}', label: 'IA analiza', color: 'from-amber-400 to-orange-400' },
                    { icon: '\u{1F9B7}', label: 'Agenda', color: 'from-emerald-400 to-teal-500' },
                  ].map((step, i) => (
                    <React.Fragment key={i}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex flex-col items-center gap-1 min-w-[56px] sm:min-w-[60px]"
                      >
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-lg sm:text-xl md:text-2xl shadow-lg`}>
                          {step.icon}
                        </div>
                        <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-slate-700">{step.label}</span>
                      </motion.div>
                      {i < 3 && (
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary/40 flex-shrink-0 mx-0.5" />
                      )}
                    </React.Fragment>
                  ))}
                </motion.div>

                {/* CTAs */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-8"
                >
                  <Button
                    asChild size="lg"
                    className="h-14 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all text-base"
                  >
                    <Link to="/consulta" className="flex items-center gap-2">
                      Describe tu sintoma <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild variant="outline" size="lg"
                    className="h-14 px-8 border-slate-300 text-slate-700 hover:bg-slate-50 hover:-translate-y-0.5 rounded-2xl font-medium text-base transition-all"
                  >
                    <Link to="/auth/register">Soy Dentista</Link>
                  </Button>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap justify-center lg:justify-start gap-4"
                >
                  {[
                    { icon: <Shield className="w-3.5 h-3.5" />, label: 'Datos encriptados' },
                    { icon: <Brain className="w-3.5 h-3.5" />, label: 'IA avanzada' },
                    { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Verificados' },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="text-primary">{b.icon}</span>{b.label}
                    </div>
                  ))}
                </motion.div>
              </motion.div>

              {/* ── RIGHT COLUMN: Phone mockup ── */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative flex justify-center"
              >
                {/* Floating card: Rating — top right */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-4 -right-2 md:right-2 lg:-right-6 z-20 bg-white rounded-2xl px-4 py-3 shadow-lg shadow-slate-200/60 border border-slate-100 hidden md:flex items-center gap-2"
                >
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">4.8</p>
                    <p className="text-[10px] text-slate-500">200+ resenas</p>
                  </div>
                </motion.div>

                {/* Floating card: AI stats — bottom left */}
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute bottom-16 -left-4 md:left-0 lg:-left-10 z-20 bg-white rounded-2xl px-4 py-3 shadow-lg shadow-slate-200/60 border border-slate-100 hidden md:flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">+5,000</p>
                    <p className="text-[10px] text-slate-500">Analisis IA</p>
                  </div>
                </motion.div>

                {/* Floating card: Users — mid right */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute top-1/2 -right-2 md:right-0 lg:-right-8 z-20 bg-white rounded-2xl px-4 py-3 shadow-lg shadow-slate-200/60 border border-slate-100 hidden md:flex items-center gap-2"
                >
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                      {'\u{1F468}\u{200D}\u{2695}\u{FE0F}'}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs">
                      {'\u{1F469}\u{200D}\u{2695}\u{FE0F}'}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-secondary/40 flex items-center justify-center text-xs">
                      {'\u{1F9D1}\u{200D}\u{2695}\u{FE0F}'}
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">+200 dentistas</p>
                </motion.div>

                {/* Phone mockup */}
                <div
                  className="relative max-w-[280px] sm:max-w-[300px] md:max-w-[320px] w-full"
                  style={{ transform: 'perspective(1000px) rotateY(-5deg)' }}
                >
                  <div className="bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl">
                    <div className="bg-white rounded-[2rem] overflow-hidden">
                      {/* Notch bar */}
                      <div className="bg-slate-900 h-7 flex items-center justify-center relative">
                        <div className="w-24 h-5 bg-slate-900 rounded-b-2xl" />
                        <div className="absolute left-4 flex gap-1">
                          <div className="w-1 h-1 rounded-full bg-slate-600" />
                          <div className="w-1 h-1 rounded-full bg-slate-600" />
                          <div className="w-1 h-1 rounded-full bg-slate-600" />
                        </div>
                        <span className="absolute right-4 text-[9px] text-slate-500 font-medium">9:41</span>
                      </div>

                      {/* Greeting header */}
                      <div className="px-4 py-3 bg-gradient-to-r from-primary/5 to-accent/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[11px] text-slate-500">Bienvenida</p>
                            <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
                              <span>{'\u{1F44B}'}</span> Hola, Maria
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-emerald-600 font-medium">3 citas hoy</span>
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          </div>
                        </div>
                      </div>

                      {/* Card: Next appointment */}
                      <div className="px-4 pt-3 pb-2">
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-semibold text-primary uppercase tracking-wide">Proxima Cita</p>
                            <Calendar className="w-3.5 h-3.5 text-primary/50" />
                          </div>
                          <p className="text-xs font-bold text-slate-900">Dr. Mendoza</p>
                          <p className="text-[10px] text-slate-500">Ortodoncia</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] text-slate-600 font-medium">Hoy 15:00</span>
                            <MapPin className="w-3 h-3 text-slate-400 ml-1" />
                            <span className="text-[10px] text-slate-600">Santiago</span>
                          </div>
                        </div>
                      </div>

                      {/* Card: AI analysis */}
                      <div className="px-4 pb-2">
                        <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/10 p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                              <Brain className="w-3.5 h-3.5 text-white" />
                            </div>
                            <p className="text-xs font-bold text-slate-900">IA Dental</p>
                          </div>
                          <p className="text-[10px] text-slate-600">Analisis listo</p>
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] text-emerald-600 font-medium">Sin urgencia</span>
                          </div>
                        </div>
                      </div>

                      {/* Card: Odontogram */}
                      <div className="px-4 pb-4">
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm">{'\u{1F9B7}'}</span>
                            <p className="text-xs font-bold text-slate-900">Odontograma</p>
                          </div>
                          <p className="text-[10px] text-slate-500">Ultima revision</p>
                          <p className="text-[10px] text-slate-700 font-medium mt-0.5">15 Mar 2026</p>
                        </div>
                      </div>

                      {/* Bottom nav bar */}
                      <div className="px-6 py-2 border-t border-slate-100 flex justify-around">
                        <div className="w-8 h-1 rounded-full bg-slate-900 mx-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Search form below the hero grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="mt-16"
            >
              <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-5">
                Encuentra un dentista DentalSpot cerca de ti
              </p>
              <HeroSearchForm />
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            2. COMO FUNCIONA (FLUJO)
        ══════════════════════════════════════════════════════════════════ */}
        {/* 🔵 Dot grid background */}
        <section className="py-20 border-y border-slate-100" aria-labelledby="flow-heading" style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-sm font-semibold text-primary uppercase tracking-widest mb-4"
              >
                Asi de simple
              </motion.p>
              <motion.h2
                id="flow-heading"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 leading-tight"
              >
                De sintoma a solucion en{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  4 pasos
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-lg text-slate-600 max-w-2xl mx-auto"
              >
                Sin llamar, sin esperar, sin incertidumbre. Todo el proceso es digital y guiado.
              </motion.p>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
            >
              {flowSteps.map((item, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-sm hover:shadow-[0_0_30px_rgba(69,181,196,0.15)] hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                      {item.icon}
                    </div>
                    <span className="text-3xl font-black text-slate-200">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                  {i < flowSteps.length - 1 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className="w-6 h-6 text-slate-300" />
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            3. BENEFICIOS
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-slate-50" aria-labelledby="benefits-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <motion.h2
                id="benefits-heading"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4"
              >
                Por que elegir DentalSpot
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-lg text-slate-600 max-w-2xl mx-auto"
              >
                Rapidez, precision, confianza clinica y transparencia de precios en un solo lugar.
              </motion.p>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
            >
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-[0_0_30px_rgba(69,181,196,0.15)] hover:-translate-y-1 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${b.gradient} text-white mb-4 group-hover:scale-110 transition-transform`}>
                    {b.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{b.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{b.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            4. PARA DENTISTAS
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-white" aria-labelledby="dentists-heading">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
                  Para profesionales
                </p>
                <h2 id="dentists-heading" className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                  Llena tu agenda con{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                    pacientes reales
                  </span>
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  DentalSpot te conecta con pacientes que ya tienen un diagnostico preliminar y estan listos para agendar. Sin tiempos muertos, sin incertidumbre.
                </p>
                <div className="space-y-4">
                  {[
                    'Recibe pacientes con pre-diagnostico IA',
                    'Gestiona tu agenda y disponibilidad en tiempo real',
                    'Define tus precios y especialidades',
                    'Perfil profesional con resenas verificadas',
                    'Odontograma digital integrado',
                    'Dashboard con metricas de tu practica',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Button
                    asChild size="lg"
                    className="h-12 px-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-2xl"
                  >
                    <Link to="/auth/register" className="flex items-center gap-2">
                      Unirme como Dentista <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl p-8 border border-primary/10"
              >
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: <Users className="w-8 h-8" />, value: '+200', label: 'Dentistas activos' },
                    { icon: <MapPin className="w-8 h-8" />, value: '8+', label: 'Ciudades' },
                    { icon: <Star className="w-8 h-8" />, value: '4.8', label: 'Rating promedio' },
                    { icon: <Calendar className="w-8 h-8" />, value: '95%', label: 'Citas confirmadas' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 text-center shadow-sm">
                      <div className="text-primary mx-auto mb-2 flex justify-center">{stat.icon}</div>
                      <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                      <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            5. PROFESIONALES DESTACADOS
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-slate-50" aria-labelledby="professionals-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <motion.h2
                id="professionals-heading"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4"
              >
                Dentistas verificados en DentalSpot
              </motion.h2>
              <p className="text-lg text-slate-600">
                Profesionales con experiencia, resenas reales y disponibilidad en tiempo real.
              </p>
            </div>
            <FeaturedProfessionalsCarousel professionals={featuredProfessionalsData} />
            <div className="text-center mt-10">
              <Button asChild variant="outline" size="lg" className="rounded-2xl">
                <Link to="/dentistas" className="flex items-center gap-2">
                  Ver todos los dentistas <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            6. FAQ
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-white" aria-labelledby="faq-heading">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <motion.h2
                  id="faq-heading"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4"
                >
                  Preguntas frecuentes
                </motion.h2>
              </div>

              <Accordion type="single" collapsible className="space-y-3">
                {faqItems.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="bg-slate-50 rounded-2xl border border-slate-100 px-6">
                    <AccordionTrigger className="text-left font-semibold text-slate-800 hover:no-underline py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 leading-relaxed pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            7. CTA FINAL
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-gradient-to-r from-primary to-accent relative overflow-hidden">
          {/* 🦷 Dientes decorativos flotantes */}
          <img src="/logo-dentalspot.png" alt="" className="absolute top-8 left-8 w-20 h-20 opacity-10 pointer-events-none" />
          <img src="/logo-dentalspot.png" alt="" className="absolute bottom-8 right-12 w-32 h-32 opacity-5 pointer-events-none" />
          <img src="/logo-dentalspot.png" alt="" className="absolute top-1/2 left-1/3 w-14 h-14 opacity-10 pointer-events-none" />
          <img src="/logo-dentalspot.png" alt="" className="absolute top-1/4 right-1/4 w-16 h-16 opacity-[0.07] pointer-events-none" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                Tu salud dental no puede esperar
              </h2>
              <p className="text-lg text-white/90 mb-8">
                Describe tu sintoma ahora y en minutos tendras un plan de accion claro con el dentista ideal para ti.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  asChild size="lg"
                  className="h-14 px-8 bg-white text-primary hover:bg-white/90 font-semibold rounded-2xl shadow-lg text-base"
                >
                  <Link to="/consulta" className="flex items-center gap-2">
                    Empezar ahora <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  asChild variant="outline" size="lg"
                  className="h-14 px-8 bg-white/20 border border-white/40 text-white hover:bg-white/30 rounded-2xl font-semibold text-base backdrop-blur"
                >
                  <Link to="/auth/register">Soy Dentista</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </>
  );
};

export default HomePage;
