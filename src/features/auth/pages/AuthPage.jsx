import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import AuthForm from '@/features/auth/components/AuthForm';
import RolePicker from '@/features/auth/components/RolePicker';
import { getPublicRoles, USER_ROLES } from '@/constants/roles';
import { useAuth } from '@/contexts/AuthContext';
import { useMetaTracking } from '@/hooks/useMetaTracking';
import { CheckCircle, Users, Calendar, Shield, Star, X, Gift, ArrowLeft, Search, FileText, Bell, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Contenido orientado al PROFESIONAL (dentista / clínica / asistente)
const BENEFITS = [
  { icon: Users, text: 'Aparece en el buscador y recibe pacientes nuevos' },
  { icon: Calendar, text: 'Agenda online con recordatorios automáticos' },
  { icon: Shield, text: 'Ficha clínica digital segura y trazable' },
  { icon: Star, text: 'Herramientas IA: Notiz, plantillas y más' },
];

const STATS = [
  { value: '46+', label: 'Profesionales registrados' },
  { value: '100%', label: 'Gratis para comenzar' },
  { value: '11+', label: 'Pacientes activos' },
];

const PROFESSIONAL_TESTIMONIAL = {
  initials: 'DK',
  name: 'Danissa Klagges',
  role: 'Dentista, Temuco',
  quote: '"DentalSpot me ha permitido organizar mi consulta, automatizar las notas de sesión y recibir pacientes nuevos desde el buscador. Lo recomiendo a todos mis colegas."',
};

// Contenido orientado al PACIENTE
const PATIENT_BENEFITS = [
  { icon: Search, text: 'Busca dentistas por especialidad y cercanía' },
  { icon: Calendar, text: 'Reserva citas online en minutos' },
  { icon: FileText, text: 'Tu ficha clínica siempre disponible' },
  { icon: Bell, text: 'Recibe recordatorios automáticos de tus citas' },
];

const PATIENT_STATS = [
  { value: '46+', label: 'Dentistas verificados' },
  { value: '100%', label: 'Gratis para pacientes' },
  { value: '3 min', label: 'Para reservar' },
];

const PATIENT_TESTIMONIAL = {
  initials: 'CR',
  name: 'Carolina R.',
  role: 'Paciente, Santiago',
  quote: '"Encontré dentista cerca de mi oficina en minutos. Reservar fue súper fácil y los recordatorios automáticos me salvan de olvidar las citas."',
};

// Exit-intent popup
const ExitIntentPopup = ({ onClose }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300 relative">
      <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 text-gray-400 z-10">
        <X className="h-5 w-5" />
      </button>

      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-8 text-white text-center">
        <Gift className="h-12 w-12 mx-auto mb-3 opacity-90" />
        <h2 className="text-2xl font-bold">¿De verdad quieres dejar pasar esta oportunidad?</h2>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-gray-600 text-center">
          Cada mes, miles de pacientes buscan dentistas en Chile.
          <strong> No pierdas la oportunidad de que te encuentren.</strong>
        </p>

        <div className="space-y-3">
          {[
            'Perfil profesional visible para pacientes',
            'Agenda online con reservas automáticas',
            'Herramientas de IA para documentación',
            'Gratis para comenzar — sin tarjeta de crédito',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={onClose}
          className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-base font-semibold"
        >
          Completar mi registro gratuito
        </Button>

        <button onClick={onClose} className="w-full text-center text-xs text-gray-400 hover:text-gray-600">
          No, gracias
        </button>
      </div>
    </div>
  </div>
);

export default function AuthPage() {
  const { action } = useParams();
  const navigate = useNavigate();
  const isLogin = action === 'login';
  const { user, loading: authLoading } = useAuth();
  const { trackEvent } = useMetaTracking();
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [exitPopupShown, setExitPopupShown] = useState(false);
  const [searchParams] = useSearchParams();

  // Rol seleccionado (viene de query string, ej. /auth/login?role=therapist).
  // Si el rol no es válido (no está en getPublicRoles), se ignora y mostramos
  // el RolePicker. Esto permite que Admin / Lab no sean seleccionables via URL.
  const roleParam = searchParams.get('role');
  const validRoles = getPublicRoles().map((r) => r.value);
  const selectedRole = validRoles.includes(roleParam) ? roleParam : null;

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      if (action === 'register' || action === 'signup') {
        trackEvent('CompleteRegistration', { content_name: 'User Registration', status: 'success' });
      } else if (isLogin) {
        trackEvent('Login', { status: 'success' });
      }
    }
  }, [user, action, isLogin, trackEvent]);

  // Exit-intent detection (mouse leaves viewport top).
  // Solo se dispara en registro profesional (dentista/clínica/asistente).
  // Para paciente no tiene sentido — el registro es simple y gratuito.
  const isPatientRegister = !isLogin && roleParam === USER_ROLES.PATIENT;

  const handleMouseLeave = useCallback((e) => {
    if (isLogin || exitPopupShown || user || isPatientRegister) return;
    if (e.clientY <= 0) {
      setShowExitPopup(true);
      setExitPopupShown(true);
    }
  }, [isLogin, exitPopupShown, user, isPatientRegister]);

  useEffect(() => {
    if (isLogin || user || isPatientRegister) return;
    // Desktop: mouse leave detection
    document.addEventListener('mouseleave', handleMouseLeave);
    // Mobile fallback: show after 45 seconds
    const timer = setTimeout(() => {
      if (!exitPopupShown) {
        setShowExitPopup(true);
        setExitPopupShown(true);
      }
    }, 45000);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timer);
    };
  }, [handleMouseLeave, isLogin, user, exitPopupShown, isPatientRegister]);

  if (authLoading || user) return null;

  // Step 1 — Si no hay rol válido seleccionado, mostrar RolePicker.
  // Vale para login y register.
  if (!selectedRole) {
    return (
      <>
        <Helmet>
          <title>{isLogin ? 'Iniciar Sesión' : 'Crear cuenta'} | DentalSpot</title>
        </Helmet>
        <RolePicker isLogin={isLogin} />
      </>
    );
  }

  // Step 2 — Rol seleccionado: mostrar el AuthForm.
  // Login: simple centered layout
  if (isLogin) {
    return (
      <>
        <Helmet>
          <title>Iniciar Sesión | DentalSpot</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-teal-100 p-4">
          <div className="w-full max-w-md">
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Cambiar tipo de cuenta
            </button>
            <AuthForm isLogin={true} initialRole={selectedRole} />
          </div>
        </div>
      </>
    );
  }

  // Register: two-column Doctoralia-style layout.
  // El contenido del panel izquierdo cambia según el rol elegido:
  //   - PATIENT → orientado al paciente (buscar dentistas, reservar)
  //   - otros (dentista/clínica/asistente) → orientado al profesional
  const isPatientView = selectedRole === USER_ROLES.PATIENT;
  const activeBenefits = isPatientView ? PATIENT_BENEFITS : BENEFITS;
  const activeStats = isPatientView ? PATIENT_STATS : STATS;
  const activeTestimonial = isPatientView ? PATIENT_TESTIMONIAL : PROFESSIONAL_TESTIMONIAL;

  return (
    <>
      <Helmet>
        <title>{isPatientView ? 'Regístrate Gratis — Paciente' : 'Regístrate Gratis'} | DentalSpot</title>
        <meta
          name="description"
          content={
            isPatientView
              ? 'Regístrate gratis en DentalSpot. Busca dentistas cerca de ti, reserva citas online y accedé a tu ficha clínica desde donde estés.'
              : 'Crea tu perfil profesional gratuito en DentalSpot. Aparece en las búsquedas y recibe pacientes.'
          }
        />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <a href="/" className="text-2xl font-bold">
              <span className="text-pink-500">DENTAL</span><span className="text-teal-500">SPOT</span>
            </a>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500 hidden sm:block">¿Ya tienes una cuenta?</span>
              <a href="/auth/login" className="font-semibold text-teal-600 hover:text-teal-700 border border-teal-200 px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors">
                Iniciar sesión
              </a>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-start">

            {/* Left: Value proposition (content changes per role) */}
            <div className="space-y-8 lg:sticky lg:top-24">
              <div>
                {isPatientView ? (
                  <>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                      Encuentra el dentista ideal
                      <span className="block text-teal-600">cerca de ti</span>
                    </h1>
                    <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                      Regístrate gratis para buscar dentistas cerca, reservar citas online
                      y mantener tu ficha clínica siempre disponible.
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                      Crea tu perfil profesional
                      <span className="block text-teal-600">gratuito en DentalSpot</span>
                    </h1>
                    <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                      Miles de pacientes buscan dentistas cada mes. Aparece en las búsquedas,
                      recibe reservas online y gestiona tu consulta con herramientas inteligentes.
                    </p>
                  </>
                )}
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                {activeBenefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600 shrink-0">
                      <b.icon className="h-5 w-5" />
                    </div>
                    <span className="text-gray-700 font-medium">{b.text}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                {activeStats.map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl font-bold text-teal-600">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Testimonial */}
              <div className="bg-gray-50 rounded-xl p-5 border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-600">
                    {activeTestimonial.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{activeTestimonial.name}</p>
                    <p className="text-xs text-gray-500">{activeTestimonial.role}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 italic">
                  {activeTestimonial.quote}
                </p>
                <div className="flex gap-0.5 mt-2">
                  {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                </div>
              </div>
            </div>

            {/* Right: Registration form */}
            <div className="lg:pl-8">
              <button
                type="button"
                onClick={() => navigate('/auth/register')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
              >
                <ArrowLeft className="w-4 h-4" /> Cambiar tipo de cuenta
              </button>
              <div className="bg-white rounded-2xl border shadow-lg p-1">
                <AuthForm isLogin={false} initialRole={selectedRole} />
              </div>

              <p className="text-xs text-gray-400 text-center mt-4 max-w-sm mx-auto">
                Al registrarte aceptas nuestros{' '}
                <a href="/legal/terminos-condiciones" className="underline hover:text-gray-600">términos y condiciones</a>{' '}
                y <a href="/legal/politica-privacidad" className="underline hover:text-gray-600">política de privacidad</a>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Exit-intent popup */}
      {showExitPopup && <ExitIntentPopup onClose={() => setShowExitPopup(false)} />}
    </>
  );
}
