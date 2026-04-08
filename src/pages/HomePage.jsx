import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useMetaTracking } from '@/hooks/useMetaTracking';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Users, Clock, Star,
  Brain, Calendar, Shield, MapPin, MessageCircle,
  FileImage, ScanLine, UserCheck, DollarSign,
  CheckCircle, ChevronRight,
} from 'lucide-react';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui/accordion';
import HeroSearchForm from '@/components/home/HeroSearchForm';
import FeaturedProfessionalsCarousel from '@/components/home/FeaturedProfessionalsCarousel';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const flowSteps = [
  { icon: <MessageCircle className="w-6 h-6" />, title: 'Describe tu problema', description: 'Escribe tu sintoma en lenguaje simple. Nuestra IA clasifica tu caso al instante.', color: 'from-primary to-accent' },
  { icon: <FileImage className="w-6 h-6" />, title: 'Orden de radiografia', description: 'Descarga un PDF con la orden medica y laboratorios cercanos.', color: 'from-violet-500 to-purple-600' },
  { icon: <ScanLine className="w-6 h-6" />, title: 'La IA analiza', description: 'El laboratorio sube tu imagen y la IA entrega un diagnostico preliminar.', color: 'from-amber-400 to-orange-500' },
  { icon: <UserCheck className="w-6 h-6" />, title: 'Elige y agenda', description: 'Ve dentistas cercanos con precios y disponibilidad. Agenda directo.', color: 'from-emerald-400 to-teal-500' },
];

const benefits = [
  { icon: <Brain className="w-6 h-6" />, title: 'Teleorientacion con IA', description: 'Describe tu sintoma y recibe orientacion inmediata con inteligencia artificial.', gradient: 'from-primary to-accent' },
  { icon: <FileImage className="w-6 h-6" />, title: 'Orden automatica', description: 'PDF descargable con tipo de examen, instrucciones y laboratorios asociados.', gradient: 'from-violet-500 to-purple-600' },
  { icon: <ScanLine className="w-6 h-6" />, title: 'Analisis radiografico IA', description: 'Diagnostico preliminar automatizado con nivel de urgencia y alternativas.', gradient: 'from-amber-400 to-orange-500' },
  { icon: <MapPin className="w-6 h-6" />, title: 'Match con dentistas', description: 'Encuentra profesionales por ubicacion, especialidad y disponibilidad.', gradient: 'from-emerald-400 to-teal-500' },
  { icon: <DollarSign className="w-6 h-6" />, title: 'Precios transparentes', description: 'Estimaciones claras antes de agendar. Compara y elige con informacion real.', gradient: 'from-primary to-secondary' },
  { icon: <Calendar className="w-6 h-6" />, title: 'Agenda integrada', description: 'Reserva directa con confirmacion por correo y WhatsApp.', gradient: 'from-rose-400 to-pink-500' },
];

const featuredProfessionalsData = [
  { name: 'Dr. Andres Mendoza', specialty: 'Ortodoncia', rating: 5, location: 'Santiago' },
  { name: 'Dra. Camila Reyes', specialty: 'Endodoncia', rating: 5, location: 'Valparaiso' },
  { name: 'Dr. Felipe Torres', specialty: 'Implantologia', rating: 5, location: 'Concepcion' },
  { name: 'Dra. Sofia Navarro', specialty: 'Odontopediatria', rating: 4, location: 'Temuco' },
  { name: 'Dr. Nicolas Herrera', specialty: 'Cirugia Maxilofacial', rating: 5, location: 'Antofagasta' },
  { name: 'Dra. Valentina Diaz', specialty: 'Periodoncia', rating: 5, location: 'Santiago' },
];

const faqItems = [
  { question: 'Que es DentalSpot y como funciona?', answer: 'DentalSpot es una plataforma que conecta pacientes con dentistas cercanos usando inteligencia artificial. Describes tu sintoma, obtienes una orden de radiografia, la IA analiza la imagen y te muestra los profesionales mas adecuados para tu caso con precios transparentes.' },
  { question: 'El diagnostico de la IA reemplaza al dentista?', answer: 'No. El analisis con IA es una orientacion preliminar para reducir incertidumbre y ayudarte a tomar mejores decisiones. Siempre necesitaras la evaluacion presencial de un profesional.' },
  { question: 'Como sube el laboratorio mi radiografia?', answer: 'El laboratorio puede subir tu radiografia directamente a tu perfil mediante un formulario simple con tu codigo de paciente. Tambien puede enviarla por correo.' },
  { question: 'Cuanto cuesta usar DentalSpot?', answer: 'Para pacientes, describir tu sintoma y recibir orientacion es gratuito. El analisis de radiografia con IA tiene un costo accesible que se muestra antes de confirmar. Los dentistas pagan una suscripcion mensual.' },
  { question: 'Como se eligen los dentistas que aparecen?', answer: 'Los profesionales son verificados antes de unirse. El ranking se basa en cercania, disponibilidad, precio y resenas de pacientes reales. No hay pago por posicionamiento.' },
  { question: 'DentalSpot cumple con la normativa chilena?', answer: 'Si. DentalSpot cumple con la Ley 19.628 de Proteccion de Datos Personales y la Ley 20.584 sobre Derechos y Deberes de los Pacientes. Las radiografias e informacion clinica se almacenan de forma encriptada.' },
];

const HomePage = () => {
  const { trackEvent } = useMetaTracking();
  useEffect(() => {
    trackEvent('ViewContent', { content_name: 'Home Page', content_category: 'Landing' });
  }, []);

  const schemaData = {
    '@context': 'https://schema.org', '@type': 'WebApplication', name: 'DentalSpot', url: 'https://dentalspot.cl',
    description: 'DentalSpot conecta pacientes con dentistas cercanos usando inteligencia artificial.',
    applicationCategory: 'HealthApplication', operatingSystem: 'Web',
    provider: { '@type': 'Organization', name: 'DentalSpot', address: { '@type': 'PostalAddress', addressCountry: 'CL' } },
  };
  const faqSchema = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqItems.map(i => ({ '@type': 'Question', name: i.question, acceptedAnswer: { '@type': 'Answer', text: i.answer } })),
  };

  return (
    <>
      <Helmet>
        <title>DentalSpot | Resuelve tu problema dental en minutos</title>
        <meta name="description" content="Conectamos pacientes con dentistas cercanos usando IA. Describe tu sintoma, obtiene un diagnostico preliminar y agenda con el profesional ideal." />
        <link rel="canonical" href="https://dentalspot.cl" />
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* ════════════════ 1. HERO ════════════════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50">
        {/* Floating orbs */}
        <motion.div animate={{ y: [0, 30, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <motion.div animate={{ y: [0, -25, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-1/2 -left-32 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />
        <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-xl border border-primary/20 text-primary text-sm font-medium mb-8 shadow-sm">
              <Sparkles className="w-4 h-4" /> Odontologia inteligente con IA
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
              Resuelve tu problema dental{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">en minutos</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-4 leading-relaxed">
              Describe tu sintoma, obtiene un diagnostico preliminar con IA y{' '}
              <strong className="text-slate-800">agenda con el dentista ideal cerca de ti.</strong>
            </motion.p>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
              className="flex flex-wrap justify-center gap-2 mb-8">
              {['Orientacion IA', 'Orden radiografia', 'Analisis imagen', 'Match dentistas', 'Precios claros'].map((t, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-white/80 backdrop-blur border border-slate-200 text-xs font-medium text-slate-600">{t}</span>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <Button asChild size="lg" className="h-14 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl transition-all text-base">
                <Link to="/auth/register" className="flex items-center gap-2">Describe tu sintoma <ArrowRight className="w-5 h-5" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-2xl font-medium text-base">
                <Link to="/auth/register">Soy Dentista</Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4 mb-10">
              {[
                { icon: <Users className="w-4 h-4 text-primary" />, value: '+200', label: 'Dentistas' },
                { icon: <Clock className="w-4 h-4 text-primary" />, value: '5 min', label: 'Orientacion IA' },
                { icon: <Star className="w-4 h-4 text-amber-400 fill-amber-400" />, value: '100%', label: 'Transparente' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-slate-100 shadow-sm">
                  {s.icon}<span className="font-bold text-slate-900">{s.value}</span><span className="text-slate-500 text-sm">{s.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Trust badges */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-6 mb-12">
              {[
                { icon: <Shield className="w-4 h-4" />, label: 'Datos encriptados' },
                { icon: <Brain className="w-4 h-4" />, label: 'IA avanzada' },
                { icon: <CheckCircle className="w-4 h-4" />, label: 'Profesionales verificados' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="text-primary">{b.icon}</span>{b.label}
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-5">Encuentra un dentista cerca de ti</p>
              <HeroSearchForm />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════ 2. COMO FUNCIONA ════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Asi de simple</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              De sintoma a solucion en{' '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">4 pasos</span>
            </h2>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {flowSteps.map((step, i) => (
              <motion.div key={i} variants={itemVariants}
                className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-lg hover:shadow-[0_0_30px_rgba(69,181,196,0.15)] transition-all hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shadow-lg`}>{step.icon}</div>
                  <span className="text-4xl font-black text-slate-100">{i + 1}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                {i < flowSteps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-primary/40" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════ 3. BENEFICIOS ════════════════ */}
      <section className="py-24 bg-gradient-to-b from-white via-slate-50/50 to-white">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Por que elegir DentalSpot</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Rapidez, precision y transparencia en un solo lugar.</p>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div key={i} variants={itemVariants}
                className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-[0_0_30px_rgba(69,181,196,0.15)] transition-all hover:-translate-y-1 group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${b.gradient} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>{b.icon}</div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{b.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════ 4. PARA DENTISTAS ════════════════ */}
      <section className="py-24 bg-gradient-to-br from-primary/3 via-white to-accent/3">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Para profesionales</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                Llena tu agenda con{' '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">pacientes reales</span>
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">DentalSpot te conecta con pacientes que ya tienen un diagnostico preliminar y estan listos para agendar.</p>
              <div className="space-y-3 mb-8">
                {['Recibe pacientes con pre-diagnostico IA', 'Gestiona tu agenda en tiempo real', 'Define tus precios y especialidades', 'Perfil con resenas verificadas', 'Odontograma digital integrado', 'Dashboard con metricas'].map((item, i) => (
                  <div key={i} className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" /><span className="text-slate-700 text-sm">{item}</span></div>
                ))}
              </div>
              <Button asChild size="lg" className="h-12 px-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-2xl">
                <Link to="/auth/register" className="flex items-center gap-2">Unirme como Dentista <ArrowRight className="w-5 h-5" /></Link>
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4">
              {[
                { icon: <Users className="w-7 h-7" />, value: '+200', label: 'Dentistas activos' },
                { icon: <MapPin className="w-7 h-7" />, value: '8+', label: 'Ciudades' },
                { icon: <Star className="w-7 h-7" />, value: '4.8', label: 'Rating promedio' },
                { icon: <Calendar className="w-7 h-7" />, value: '95%', label: 'Citas confirmadas' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-2xl p-6 text-center shadow-sm hover:shadow-[0_0_30px_rgba(69,181,196,0.12)] transition-all">
                  <div className="text-primary mx-auto mb-2 flex justify-center">{stat.icon}</div>
                  <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════ 5. PROFESIONALES ════════════════ */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Dentistas verificados</h2>
            <p className="text-lg text-slate-600">Profesionales con experiencia y disponibilidad en tiempo real.</p>
          </motion.div>
          <FeaturedProfessionalsCarousel professionals={featuredProfessionalsData} />
          <div className="text-center mt-10">
            <Button asChild variant="outline" size="lg" className="rounded-2xl hover:shadow-[0_0_30px_rgba(69,181,196,0.12)] transition-all">
              <Link to="/dentistas" className="flex items-center gap-2">Ver todos los dentistas <ArrowRight className="w-5 h-5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════════ 6. FAQ ════════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Preguntas frecuentes</h2>
            </motion.div>
            <Accordion type="single" collapsible className="space-y-3">
              {faqItems.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 px-6 shadow-sm hover:shadow-[0_0_20px_rgba(69,181,196,0.08)] transition-all">
                  <AccordionTrigger className="text-left font-semibold text-slate-800 hover:no-underline py-5">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-slate-600 leading-relaxed pb-5">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ════════════════ 7. CTA FINAL ════════════════ */}
      <section className="py-24 bg-gradient-to-r from-primary to-accent relative overflow-hidden">
        {/* Floating circles */}
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/10 border border-white/20 pointer-events-none" />
        <div className="absolute bottom-10 right-16 w-48 h-48 rounded-full bg-white/5 border border-white/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Tu salud dental no puede esperar</h2>
            <p className="text-lg text-white/90 mb-8">Describe tu sintoma ahora y en minutos tendras un plan de accion claro.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-8 bg-white text-primary hover:bg-white/90 font-semibold rounded-2xl shadow-lg text-base">
                <Link to="/auth/register" className="flex items-center gap-2">Empezar ahora <ArrowRight className="w-5 h-5" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 border-white/30 text-white hover:bg-white/10 rounded-2xl font-medium text-base">
                <Link to="/auth/register">Soy Dentista</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
