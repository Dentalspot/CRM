/**
 * @file LeadCapturePage.jsx
 * @description Landing page de captacion de leads para campanas de Meta Ads.
 * Captura email (+nombre, telefono opcional) → guarda en marketing_leads → trackea Lead en Meta Pixel + CAPI.
 * Soporta UTM params para atribucion de campanas.
 *
 * URL: /registro-profesional o /lp/:campaign
 */
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useMetaTracking } from '@/hooks/useMetaTracking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckCircle, Users, Calendar, Shield, Star, ArrowRight, Loader2,
  Stethoscope, Brain, FileText, Bot, TrendingUp, Heart, Sparkles,
  Play, ChevronDown
} from 'lucide-react';

// ============================================
// BRAND COLORS
// ============================================
const BRAND = {
  primary: '#00BCB5',
  light: '#82DFDA',
  softer: '#d2f2f0',
  bg: '#f6fbfb',
  accent: '#ff74c3',
};

// ============================================
// BENEFITS & SOCIAL PROOF
// ============================================

const HERO_BENEFITS = [
  'Aparece en el buscador y recibe pacientes nuevos',
  'Agenda online con recordatorios automaticos',
  'Ficha clinica digital segura y trazable',
  'Herramientas IA: Notiz, plantillas y mas',
  'Marketplace para vender material profesional',
  '100% gratis para comenzar — sin tarjeta',
];

const FEATURES = [
  { icon: Calendar, title: 'Agenda Inteligente', desc: 'Reservas online, recordatorios SMS y sincronizacion con Google Calendar.' },
  { icon: FileText, title: 'Ficha Clinica Digital', desc: 'Evaluaciones TEA (ADOS-2, ADI-R), planes de tratamiento y seguimiento.' },
  { icon: Bot, title: 'IA Integrada', desc: 'Notiz transcribe sesiones a SOAP. Generador de plantillas con evidencia.' },
  { icon: Users, title: 'Buscador de Profesionales', desc: 'Pacientes te encuentran por especialidad, ubicacion y disponibilidad.' },
  { icon: TrendingUp, title: 'Marketplace', desc: 'Vende material terapeutico digital a colegas de todo Chile.' },
  { icon: Shield, title: 'Seguridad Clinica', desc: 'Datos encriptados, cumplimiento normativo y trazabilidad completa.' },
];

const TESTIMONIALS = [
  { name: 'Carolina M.', role: 'Dentista, Santiago', text: 'DentalSpot me ahorra horas de documentacion cada semana. La IA es increible.' },
  { name: 'Felipe R.', role: 'Dentista, Concepcion', text: 'Desde que active mi perfil, recibo 3-4 pacientes nuevos al mes.' },
  { name: 'Valentina S.', role: 'Dentista, Valparaiso', text: 'La ficha clinica TEA es la mas completa que he usado. Todo en un solo lugar.' },
];

const STATS = [
  { value: '46+', label: 'Profesionales' },
  { value: '100+', label: 'Pacientes activos' },
  { value: '500+', label: 'Sesiones registradas' },
  { value: '4.8', label: 'Valoracion promedio' },
];

// ============================================
// LEAD FORM COMPONENT
// ============================================

const LeadForm = ({ onSuccess, source, utmParams }) => {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { trackEvent } = useMetaTracking();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email) return;
    setLoading(true);
    setError(null);

    try {
      // Save to marketing_leads
      const { error: dbError } = await supabase.from('marketing_leads').insert({
        full_name: form.full_name || null,
        email: form.email.trim().toLowerCase(),
        phone: form.phone || null,
        source: source || 'meta_ads',
        status: 'new',
        segment: 'landing_page',
        metadata: {
          utm_source: utmParams.utm_source || null,
          utm_medium: utmParams.utm_medium || null,
          utm_campaign: utmParams.utm_campaign || null,
          utm_content: utmParams.utm_content || null,
          utm_term: utmParams.utm_term || null,
          landing_url: window.location.href,
          referrer: document.referrer || null,
          captured_at: new Date().toISOString(),
        },
      });

      if (dbError) {
        // Duplicate email — still count as success for UX
        if (dbError.code === '23505') {
          // Already exists, just track and continue
        } else {
          throw dbError;
        }
      }

      // Track Lead event in Meta
      trackEvent('Lead', {
        content_name: 'Landing Page Lead',
        content_category: 'Lead Capture',
        currency: 'CLP',
        value: 0,
      }, {
        email: form.email,
        phone: form.phone,
      });

      onSuccess(form);
    } catch (err) {
      setError('Hubo un error. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-white/90">Nombre completo</Label>
        <Input
          value={form.full_name}
          onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
          placeholder="Tu nombre"
          className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-white/90">Email profesional *</Label>
        <Input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
          placeholder="tu@email.com"
          className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-white/90">Telefono (opcional)</Label>
        <Input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="+56 9 1234 5678"
          className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
        />
      </div>

      {/* Legal consent checkbox */}
      <div className="flex items-start gap-3 pt-1">
        <Checkbox
          id="accept-terms"
          checked={acceptedTerms}
          onCheckedChange={setAcceptedTerms}
          className="mt-0.5 border-white/40 data-[state=checked]:bg-[#ff74c3] data-[state=checked]:border-[#ff74c3]"
        />
        <label htmlFor="accept-terms" className="text-xs text-white/70 leading-relaxed cursor-pointer">
          Declaro haber leído, y acepto expresamente los{' '}
          <Link to="/legal/terminos-y-condiciones" target="_blank" className="underline text-white/90 hover:text-white">
            Términos y Condiciones
          </Link>{' '}
          del sitio www.dentalspot.cl y su{' '}
          <Link to="/legal/politica-de-privacidad" target="_blank" className="underline text-white/90 hover:text-white">
            Política de Privacidad y Protección de Datos
          </Link>.
        </label>
      </div>

      {error && <p className="text-red-300 text-sm">{error}</p>}
      <Button
        type="submit"
        disabled={loading || !form.email || !acceptedTerms}
        style={{ backgroundColor: BRAND.accent }}
        className="w-full h-14 text-lg font-bold text-white hover:opacity-90 shadow-xl disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />}
        {loading ? 'Registrando...' : 'Quiero probar DentalSpot gratis'}
      </Button>
      <p className="text-xs text-white/60 text-center">
        Sin tarjeta de credito. Cancela cuando quieras.
      </p>
    </form>
  );
};

// ============================================
// SUCCESS STATE
// ============================================

const SuccessState = ({ lead, navigate }) => (
  <div className="text-center space-y-6 py-8">
    <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
      <CheckCircle className="h-10 w-10 text-green-400" />
    </div>
    <div>
      <h2 className="text-2xl font-bold text-white">
        {lead.full_name ? `${lead.full_name}, estas dentro` : 'Estas dentro'}
      </h2>
      <p className="text-white/70 mt-2">Te enviamos un email a <strong className="text-white">{lead.email}</strong></p>
    </div>
    <div className="space-y-3">
      <Button
        onClick={() => navigate('/auth/register')}
        style={{ backgroundColor: BRAND.accent }}
        className="w-full h-14 text-lg font-bold text-white hover:opacity-90"
      >
        Crear mi cuenta ahora <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
      <p className="text-xs text-white/50">
        Completa tu registro para acceder a todas las herramientas.
      </p>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export default function LeadCapturePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [captured, setCaptured] = useState(false);
  const [capturedLead, setCapturedLead] = useState(null);
  const formRef = useRef(null);
  const { trackEvent } = useMetaTracking();

  // Extract UTM params
  const utmParams = {
    utm_source: searchParams.get('utm_source') || '',
    utm_medium: searchParams.get('utm_medium') || '',
    utm_campaign: searchParams.get('utm_campaign') || '',
    utm_content: searchParams.get('utm_content') || '',
    utm_term: searchParams.get('utm_term') || '',
  };

  const source = searchParams.get('source') || 'meta_ads';

  // Track ViewContent on mount
  useEffect(() => {
    trackEvent('ViewContent', {
      content_name: 'Lead Capture Landing',
      content_category: 'Landing Page',
      content_ids: [utmParams.utm_campaign || 'direct'],
    });
  }, []);

  const handleSuccess = (lead) => {
    setCapturedLead(lead);
    setCaptured(true);
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>DentalSpot — La plataforma #1 para dentistas en Chile</title>
        <meta name="description" content="Agenda, ficha clinica, IA y marketplace en un solo lugar. Regístrate gratis y recibe pacientes nuevos." />
      </Helmet>

      <div className="min-h-screen">
        {/* ============================================
            HERO SECTION
        ============================================ */}
        <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, #009E99 50%, #007A76 100%)` }}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 h-72 w-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-20 h-96 w-96 rounded-full blur-3xl" style={{ backgroundColor: BRAND.light }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Value Proposition */}
              <div className="space-y-8">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full mb-6">
                    <Stethoscope className="h-4 w-4" style={{ color: BRAND.light }} />
                    <span className="text-sm text-white/90 font-medium">Plataforma #1 para dentistas en Chile</span>
                  </div>
                  <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight">
                    Digitaliza tu consulta.
                    <span className="block" style={{ color: BRAND.light }}>Recibe mas pacientes.</span>
                  </h1>
                  <p className="mt-6 text-lg text-white/80 max-w-lg">
                    Agenda, ficha clinica, inteligencia artificial y marketplace — todo en un solo lugar. Unete a la comunidad de dentistas que ya estan creciendo con DentalSpot.
                  </p>
                </div>

                {/* Benefits checklist */}
                <div className="space-y-3">
                  {HERO_BENEFITS.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 shrink-0" style={{ color: BRAND.light }} />
                      <span className="text-white/90">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  {STATS.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-white/60">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Mobile CTA */}
                <div className="lg:hidden">
                  <Button
                    onClick={scrollToForm}
                    style={{ backgroundColor: BRAND.accent }}
                    className="w-full h-14 text-lg font-bold text-white hover:opacity-90"
                  >
                    Registrarme gratis <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </div>

              {/* Right: Lead Form */}
              <div ref={formRef} className="lg:pl-8">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Comienza gratis hoy</h2>
                    <p className="text-white/70 text-sm mt-1">Crea tu perfil profesional en 2 minutos</p>
                  </div>
                  {captured ? (
                    <SuccessState lead={capturedLead} navigate={navigate} />
                  ) : (
                    <LeadForm onSuccess={handleSuccess} source={source} utmParams={utmParams} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 animate-bounce">
            <ChevronDown className="h-6 w-6" />
          </div>
        </section>

        {/* ============================================
            FEATURES SECTION
        ============================================ */}
        <section className="py-20" style={{ backgroundColor: BRAND.bg }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Todo lo que necesitas en un solo lugar</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                DentalSpot integra las herramientas esenciales para que te enfoques en lo que importa: tus pacientes.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="p-6 rounded-xl bg-white border border-gray-100 hover:shadow-lg transition-shadow group">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-colors" style={{ backgroundColor: BRAND.softer }}>
                      <Icon className="h-6 w-6" style={{ color: BRAND.primary }} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================
            TESTIMONIALS SECTION
        ============================================ */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Lo que dicen nuestros profesionales</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-gray-700 text-sm italic mb-4">"{t.text}"</p>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================
            FINAL CTA SECTION
        ============================================ */}
        <section className="py-20" style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, #009E99 100%)` }}>
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Unete a la comunidad DentalSpot
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Mas de 46 profesionales ya estan digitalizando su practica. Comienza gratis hoy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={scrollToForm}
                style={{ backgroundColor: BRAND.accent }}
                className="h-14 px-8 text-lg font-bold text-white hover:opacity-90"
              >
                Registrarme gratis <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                onClick={() => navigate('/auth/register')}
                className="h-14 px-8 text-lg font-bold bg-transparent border-2 border-white/40 text-white hover:bg-white/10"
              >
                Ya tengo cuenta — Iniciar sesion
              </Button>
            </div>
          </div>
        </section>

        {/* ============================================
            FOOTER MINI
        ============================================ */}
        <footer className="py-6 bg-gray-900 text-center">
          <p className="text-sm text-gray-500">
            DentalSpot.cl — La plataforma digital para dentistas en Chile
          </p>
        </footer>
      </div>
    </>
  );
}
