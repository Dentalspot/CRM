/**
 * @file src/pages/DentistLandingPage.jsx
 *
 * Landing comercial B2B en /para-dentistas (spec 027 Fase 1).
 *
 * Patrón Airbnb (`/` vs `/host`): el patient home queda en `/`, esta landing
 * vive en URL dedicada con copy y CTAs B2B. Mismo branding, mismo /auth.
 *
 * Fase 1 = estructura completa text-only. Mockups de celular con screenshots
 * reales de la app, animaciones sofisticadas, mapa, dentistas reales y
 * pricing real son Fase 2.
 *
 * Secciones (de arriba abajo):
 *  1. Hero — "Tu clínica, organizada y creciendo" + CTA "Crear cuenta gratis"
 *  2. Stats sociales (placeholder números, marcado en comments)
 *  3. Problemas que resuelve — 3 columnas problema → solución
 *  4. Feature spotlight — 4 features alternando texto izq/der (anchor #features)
 *  5. Pricing placeholder — CTA "Hablanos para precios" (anchor #pricing)
 *  6. FAQ profesional
 *  7. CTA final
 *
 * Analytics: page view + scroll depth + time on page + section visible +
 * faq open + CTA clicks. Ver contracts/analytics-events.md.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  ArrowRight, Calendar, Users, DollarSign, MessageCircle,
  Stethoscope, FileText, BarChart3, Sparkles, CheckCircle,
  Building2, TrendingUp, Clock,
} from 'lucide-react';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui/accordion';
import { trackEvent, trackPageView } from '@/lib/analytics';
import useScrollDepth from '@/hooks/useScrollDepth';
import useSectionVisible from '@/hooks/useSectionVisible';
import useTimeOnPage from '@/hooks/useTimeOnPage';

// ── Animations ──────────────────────────────────────────────────────────
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

// ── Data ────────────────────────────────────────────────────────────────
// NOTA: stats son placeholders Fase 1 — números mockeados realistas.
// Cuando lleguen métricas reales (Fase 2), reemplazar este array.
const STATS = [
  { value: '200+', label: 'Dentistas activos en Chile' },
  { value: '5.000+', label: 'Citas agendadas este mes' },
  { value: '4.8 ★', label: 'Satisfacción promedio del paciente' },
];

const PROBLEMS = [
  {
    icon: <Calendar className="w-7 h-7" />,
    problem: 'Agenda saturada o mal organizada',
    solution: 'Calendario inteligente multi-box',
    description: 'Visualiza todas tus salas en una sola pantalla. Drag-and-drop para reprogramar, bloqueo de horarios y reservas online integradas.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: <FileText className="w-7 h-7" />,
    problem: 'Pacientes sin seguimiento',
    solution: 'Ficha clínica unificada',
    description: 'Toda la historia del paciente en un solo lugar: odontograma, radiografías, presupuestos y evolución del tratamiento.',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    icon: <DollarSign className="w-7 h-7" />,
    problem: 'Cuentas en Excel',
    solution: 'Ingresos automáticos por cita',
    description: 'Cada cita completada genera el ingreso automáticamente. Reportes mensuales y comparativas entre boxes en un clic.',
    color: 'bg-emerald-100 text-emerald-600',
  },
];

const FEATURES = [
  {
    title: 'Agenda multi-box con drag-and-drop',
    description: 'Maneja múltiples salas o boxes en paralelo. Reprograma citas arrastrando, bloquea horarios cuando lo necesites, y deja que tus pacientes reserven online directamente desde tu perfil público.',
    icon: <Calendar className="w-12 h-12 text-primary" />,
    bullets: ['Vista semanal multi-box', 'Drag-and-drop para reprogramar', 'Bloqueo de horarios en segundos', 'Reserva online opcional por dentista'],
  },
  {
    title: 'Ficha clínica + odontograma digital',
    description: 'Toda la historia clínica del paciente integrada. Odontograma interactivo, radiografías adjuntas, notas de evolución, presupuestos y consentimientos firmados — todo en un solo lugar y con audit log automático.',
    icon: <Stethoscope className="w-12 h-12 text-primary" />,
    bullets: ['Odontograma interactivo', 'Subida de radiografías', 'Notas de evolución por sesión', 'Audit log automático (Ley 20.584)'],
  },
  {
    title: 'Asistente IA 24/7 vía chat y WhatsApp',
    description: 'Un asistente virtual que responde a tus pacientes a cualquier hora, agenda citas según tu disponibilidad real, y te avisa de nuevas reservas. Sin secretaria, sin perder llamadas fuera del horario.',
    icon: <MessageCircle className="w-12 h-12 text-primary" />,
    bullets: ['Chat 24/7 en tu perfil', 'Integración WhatsApp', 'Agenda según tus horarios', 'Notificaciones en tiempo real'],
  },
  {
    title: 'Reportes de ingresos y comisiones',
    description: 'Dashboard con tus números clave. Ingresos por mes, por procedimiento, por dentista del equipo. Comparativas, tendencias y exportes para tu contadora.',
    icon: <BarChart3 className="w-12 h-12 text-primary" />,
    bullets: ['Dashboard mensual', 'Ingresos por procedimiento', 'Comisiones por dentista', 'Export a Excel/CSV'],
  },
];

const FAQ_ITEMS = [
  {
    id: 'cuanto_cuesta',
    question: '¿Cuánto cuesta usar DentalSpot?',
    answer: 'Tenemos planes pensados para clínicas de distintos tamaños. Por ahora estamos armando los planes públicos — escribinos a contacto@dentalspot.cl y te armamos el plan que mejor se adapta a tu clínica.',
  },
  {
    id: 'comision_por_cita',
    question: '¿Cobran comisión por cita?',
    answer: 'No. DentalSpot es una plataforma SaaS con suscripción mensual. Los pacientes que reservan a través de tu perfil llegan directo a tu clínica, sin intermediarios ni comisiones por reserva.',
  },
  {
    id: 'cumple_ley_21719',
    question: '¿Cumplen la Ley 21.719 y la Ley 20.584?',
    answer: 'Sí. DentalSpot está diseñado desde el día 0 con compliance Ley 21.719 (protección de datos personales) y Ley 20.584 (derechos del paciente): consentimiento informado, audit log de acceso a fichas, RLS database-level, derechos ARCO self-service y políticas claras de retención.',
  },
  {
    id: 'migrar_datos',
    question: '¿Puedo migrar mis datos desde Excel u otro sistema?',
    answer: 'Sí. Tenemos un importador que sube pacientes y citas desde planillas Excel/CSV. Si vienes de otro software dental, contactanos y te ayudamos en la migración para que arranques sin perder tu historia.',
  },
  {
    id: 'soporte',
    question: '¿Qué tipo de soporte ofrecen?',
    answer: 'Soporte por chat en horario hábil chileno y respuesta por email en menos de 24h. Onboarding personalizado para clínicas con más de 3 dentistas. Centro de ayuda y videotutoriales disponibles 24/7.',
  },
];

// ── Section wrapper con tracking section_visible ────────────────────────
const TrackedSection = ({ id, sectionName, children, className }) => {
  const ref = useRef(null);
  useSectionVisible(ref, (name) => {
    trackEvent('dentist_section_visible', { section_name: name });
  }, { sectionName });
  return (
    <section ref={ref} id={id} className={className}>
      {children}
    </section>
  );
};

// ── Page component ───────────────────────────────────────────────────────
const DentistLandingPage = () => {
  useEffect(() => {
    trackEvent('dentist_home_view');
    trackPageView('/para-dentistas', 'DentalSpot para Profesionales | Software para clínicas dentales');
  }, []);

  useScrollDepth(useCallback((pct) => {
    trackEvent('scroll_depth', { depth_pct: pct, page: 'dentist_landing' });
  }, []));

  useTimeOnPage(useCallback((seconds) => {
    trackEvent('time_on_page', { seconds, page: 'dentist_landing' });
  }, []));

  const handleHeroCtaClick = () => {
    trackEvent('dentist_hero_cta_register_click');
  };

  const handlePricingContactClick = () => {
    trackEvent('dentist_pricing_contact_click');
  };

  const handleFinalCtaClick = () => {
    trackEvent('dentist_final_cta_click');
  };

  const handleFaqOpen = (questionId) => {
    if (questionId) {
      trackEvent('dentist_faq_question_open', { question_id: questionId });
    }
  };

  return (
    <>
      <Helmet>
        <title>DentalSpot para Profesionales | Software para clínicas dentales</title>
        <meta
          name="description"
          content="Agenda inteligente, ficha clínica unificada, ingresos automáticos y asistente IA 24/7 — todo en una sola plataforma. Software para clínicas dentales en Chile."
        />
        <meta name="keywords" content="software clínica dental, agenda dentista, ficha clínica digital, odontograma digital, software odontológico Chile, DentalSpot para profesionales" />
        <link rel="canonical" href="https://dentalspot.cl/para-dentistas" />
        <meta property="og:title" content="DentalSpot para Profesionales | Software para clínicas dentales" />
        <meta property="og:description" content="Tu clínica, organizada y creciendo. Agenda + ficha clínica + ingresos + IA 24/7 en una sola plataforma." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dentalspot.cl/para-dentistas" />
        <meta property="og:locale" content="es_CL" />
      </Helmet>

      <div className="overflow-hidden">
        {/* ═══════════ 1. HERO ═══════════ */}
        <TrackedSection
          sectionName="hero"
          className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 md:py-32 overflow-hidden"
        >
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-accent/8 blur-[120px] pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Software para clínicas dentales
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-5 leading-[1.1] tracking-tight max-w-3xl mx-auto"
            >
              Tu clínica, organizada y creciendo
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Agenda inteligente, ficha clínica unificada e ingresos automáticos en una sola plataforma. Dedica tu tiempo a tus pacientes — DentalSpot se encarga del resto.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Button
                asChild
                size="lg"
                onClick={handleHeroCtaClick}
                className="h-14 px-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-2xl shadow-xl shadow-primary/25 text-base"
              >
                <Link to="/auth/register" className="flex items-center gap-2">
                  Crear cuenta gratis <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-5 text-sm text-white/40"
            >
              Sin tarjeta de crédito. Configura tu clínica en menos de 10 minutos.
            </motion.p>
          </div>
        </TrackedSection>

        {/* ═══════════ 2. STATS SOCIALES ═══════════ */}
        <TrackedSection sectionName="stats" className="py-16 bg-white border-b border-slate-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-extrabold text-primary mb-2">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </TrackedSection>

        {/* ═══════════ 3. PROBLEMAS QUE RESUELVE ═══════════ */}
        <TrackedSection sectionName="problemas" className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">Problemas reales, soluciones reales</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                Los dolores diarios de una clínica, resueltos
              </h2>
              <p className="text-base text-slate-500">
                Sin más planillas, sin más llamadas perdidas, sin más sorpresas a fin de mes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {PROBLEMS.map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow"
                >
                  <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-4`}>
                    {item.icon}
                  </div>
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Antes</p>
                  <h3 className="text-base text-slate-700 mb-3">{item.problem}</h3>
                  <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-1">Con DentalSpot</p>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{item.solution}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </TrackedSection>

        {/* ═══════════ 4. FEATURE SPOTLIGHT ═══════════ */}
        <TrackedSection id="features" sectionName="features" className="scroll-mt-24 py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">Todo lo que necesitas</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                Una plataforma, todas las herramientas
              </h2>
              <p className="text-base text-slate-500">
                Diseñada con feedback real de dentistas y clínicas chilenas.
              </p>
            </div>

            <div className="max-w-5xl mx-auto space-y-16">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                >
                  <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                    {feature.icon}
                    <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-4 mb-3">{feature.title}</h3>
                    <p className="text-base text-slate-500 mb-5 leading-relaxed">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Placeholder visual — Fase 2: reemplazar por mockup de celular con screenshot real */}
                  <div className={`bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl border border-primary/10 p-12 flex items-center justify-center min-h-[280px] ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <div className="text-center text-slate-400 text-sm italic">
                      [ Vista previa del módulo ]<br />
                      <span className="text-xs">— screenshots reales en Fase 2 —</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TrackedSection>

        {/* ═══════════ 5. PRICING PLACEHOLDER ═══════════ */}
        <TrackedSection id="pricing" sectionName="pricing" className="scroll-mt-24 py-20 bg-gradient-to-br from-slate-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">Precios transparentes</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Precios</h2>
              <p className="text-base text-slate-500 mb-8 leading-relaxed">
                Te armamos el plan que se ajusta a tu clínica — pronto vas a ver nuestros planes públicos con features detalladas.
              </p>
              <Button
                asChild
                size="lg"
                onClick={handlePricingContactClick}
                variant="outline"
                className="h-12 px-8 border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-2xl font-semibold text-base"
              >
                <Link to="/contacto" className="flex items-center gap-2">
                  Hablanos para precios <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </TrackedSection>

        {/* ═══════════ 6. FAQ PROFESIONAL ═══════════ */}
        <TrackedSection sectionName="faq" className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">Resolvamos tus dudas</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">Preguntas frecuentes</h2>
              <p className="text-slate-500">Lo que más nos preguntan los dentistas y clínicas que evalúan DentalSpot</p>
            </div>
            <Accordion type="single" collapsible className="space-y-3" onValueChange={handleFaqOpen}>
              {FAQ_ITEMS.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="bg-slate-50 rounded-2xl border border-slate-100 px-6 hover:border-primary/20 transition-colors"
                >
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
        </TrackedSection>

        {/* ═══════════ 7. FINAL CTA ═══════════ */}
        <TrackedSection sectionName="cta_final" className="py-24 bg-gradient-to-br from-primary via-accent to-teal-700 text-white text-center relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute bottom-12 -left-20 w-[250px] h-[250px] rounded-full border-2 border-white/10 pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 leading-tight max-w-2xl mx-auto">
              Empezá gratis y descubrí cómo se siente tener tu clínica al día
            </h2>
            <p className="text-base text-white/80 max-w-lg mx-auto mb-10">
              Sin tarjeta de crédito. Sin compromiso. Configura tu clínica en menos de 10 minutos.
            </p>
            <Button
              asChild
              size="lg"
              onClick={handleFinalCtaClick}
              className="h-14 px-10 bg-white text-primary hover:bg-white/90 rounded-2xl font-bold shadow-xl text-base"
            >
              <Link to="/auth/register" className="flex items-center gap-2">
                Empezá gratis 30 días <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </TrackedSection>
      </div>
    </>
  );
};

export default DentistLandingPage;
