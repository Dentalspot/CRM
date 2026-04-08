import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import {
  CheckCircle,
  XCircle,
  Zap,
  Users,
  ShieldCheck,
  Sparkles,
  Mic,
  Brain,
  Building2,
  Gift,
  ArrowRight,
  Calendar,
  FileText,
  MessageSquare,
  BarChart3,
  Palette,
  Store,
  Headphones,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import logger from '@/lib/utils/logger';
import { Link } from 'react-router-dom';
import { useMetaTracking } from '@/hooks/useMetaTracking';

// ============================================
// DATOS DE PLANES - Con tu estructura de precios
// ============================================

const pricingPlans = [
  {
    id: 'gratis',
    name: 'Gratis',
    subtitle: 'Empieza',
    icon: <Gift />,
    priceMonthly: 0,
    priceYearly: 0,
    priceCLPMonthly: 0,
    priceCLPYearly: 0,
    description: 'Para quienes recién comienzan o quieren probar DentalSpot.',
    features: [
      { text: 'Hasta 5 pacientes activos', included: true },
      { text: 'Agendamiento básico', included: true },
      { text: 'Historial clínico digital', included: true },
      { text: 'Informes con plantillas básicas', included: true },
      { text: 'Asistente virtual IA (limitado)', included: true },
      { text: 'Soporte por email', included: true },
      { text: 'Recordatorios automáticos', included: false },
      { text: 'Panel de métricas', included: false },
    ],
    cta: 'Comenzar Gratis',
    popular: false,
    iconColor: 'text-gray-400',
  },
  {
    id: 'individual',
    name: 'Individual',
    subtitle: 'Organízate',
    icon: <Zap />,
    priceMonthly: 29,
    priceYearly: 24,
    priceCLPMonthly: 25778,
    priceCLPYearly: 21482,
    description: 'Perfecto para dentistas independientes que buscan optimizar su práctica.',
    features: [
      { text: 'Hasta 30 pacientes activos', included: true },
      { text: 'Agendamiento inteligente', included: true },
      { text: 'Recordatorios por email', included: true },
      { text: 'Informes con plantillas básicas', included: true },
      { text: 'Panel de métricas', included: true },
      { text: 'Landing page personalizada', included: true },
      { text: 'Personalización de marca', included: true },
      { text: 'Marketplace (solo comprar)', included: true },
      { text: 'Asistente virtual IA', included: true },
      { text: 'Soporte por email', included: true },
    ],
    cta: 'Comenzar Ahora',
    popular: false,
    iconColor: 'text-primary',
  },
  {
    id: 'profesional',
    name: 'Profesional',
    subtitle: 'Destaca',
    icon: <Users />,
    priceMonthly: 59,
    priceYearly: 49,
    priceCLPMonthly: 52556,
    priceCLPYearly: 43797,
    description: 'Ideal para profesionales con mayor volumen de pacientes y necesidades avanzadas.',
    features: [
      { text: 'Pacientes ilimitados', included: true, highlight: true },
      { text: '2 usuarios incluidos', included: true },
      { text: 'Agendamiento avanzado', included: true },
      { text: 'Recordatorios email + WhatsApp', included: true, highlight: true },
      { text: 'Generación de informes con IA', included: true, highlight: true },
      { text: 'Integración con calendario', included: true },
      { text: 'Soporte prioritario WhatsApp', included: true },
      { text: 'Panel de métricas avanzadas', included: true },
      { text: 'Multiclínica', included: true },
      { text: 'Plantillas personalizables', included: true },
      { text: 'Marketplace (comprar y vender)', included: true },
    ],
    cta: 'Elegir Profesional',
    popular: true,
    iconColor: 'text-secondary',
  },
  {
    id: 'centro',
    name: 'Centro de Salud',
    subtitle: 'Lidera',
    icon: <ShieldCheck />,
    priceMonthly: 99,
    priceYearly: 82,
    priceCLPMonthly: 88222,
    priceCLPYearly: 73518,
    description: 'Solución completa para clínicas y centros con múltiples dentistas.',
    features: [
      { text: 'Todo en Profesional, y además:', included: true, isHeader: true },
      { text: 'Hasta 5 usuarios incluidos', included: true, highlight: true },
      { text: 'Múltiples cuentas de terapeuta', included: true },
      { text: 'Gestión de roles y permisos', included: true },
      { text: 'Informes consolidados del centro', included: true },
      { text: 'Personalización de marca completa', included: true },
      { text: 'Soporte dedicado y onboarding', included: true, highlight: true },
      { text: 'Usuarios adicionales disponibles', included: true },
    ],
    cta: 'Contactar Ventas',
    popular: false,
    iconColor: 'text-primary',
  },
];

// ============================================
// ADD-ONS
// ============================================

const addOns = [
  {
    id: 'notiz',
    name: 'Notiz',
    subtitle: 'Notas automáticas con IA',
    icon: <Mic className="h-8 w-8" />,
    price: 29990,
    priceUSD: 33,
    description: 'Deja de tomar notas manuales durante las visitas: permite que Notiz tome las notas por ti para que puedas centrarte en la atención a tus pacientes y ahorrar tiempo.',
    features: [
      'Transcripción automática de sesiones',
      'Resúmenes clínicos estructurados',
      'Identificación de objetivos trabajados',
      'Integración con historial del paciente',
    ],
    badge: 'AHORRA TIEMPO',
    includedIn: ['profesional', 'centro'],
  },
  {
    id: 'plan-generator',
    name: 'Generador de Planes',
    subtitle: 'Planificación con IA',
    icon: <Brain className="h-8 w-8" />,
    price: 29990,
    priceUSD: 33,
    description: 'Genera planes de tratamiento personalizados basados en la evaluación inicial, objetivos del paciente y mejores prácticas clínicas.',
    features: [
      'Planes de tratamiento personalizados',
      'Sugerencias de actividades por objetivo',
      'Adaptación según progreso',
      'Exportación a PDF profesional',
    ],
    badge: 'MÁS EFECTIVIDAD',
    includedIn: ['profesional', 'centro'],
  },
];

// ============================================
// TABLA COMPARATIVA
// ============================================

const comparisonCategories = [
  {
    name: 'Capacidad',
    features: [
      { name: 'Número de usuarios', gratis: '1', individual: '1', profesional: '2', centro: '5 (ampliable)' },
      { name: 'Número de pacientes', gratis: '5', individual: '30', profesional: 'Ilimitados', centro: 'Ilimitados' },
      { name: 'Multiclínica', gratis: false, individual: false, profesional: true, centro: true },
    ],
  },
  {
    name: 'Gestión Clínica',
    features: [
      { name: 'Agendamiento de sesiones', gratis: true, individual: true, profesional: true, centro: true },
      { name: 'Historial clínico digital', gratis: true, individual: true, profesional: true, centro: true },
      { name: 'Recordatorios por email', gratis: false, individual: true, profesional: true, centro: true },
      { name: 'Recordatorios por WhatsApp', gratis: false, individual: false, profesional: true, centro: true },
      { name: 'Panel de métricas', gratis: false, individual: true, profesional: true, centro: true },
    ],
  },
  {
    name: 'Informes y Documentación',
    features: [
      { name: 'Generación de informes', gratis: 'Básico', individual: 'Básico', profesional: 'Con IA "Notiz"', centro: 'Con IA "Notiz"' },
      { name: 'Plantillas personalizables', gratis: false, individual: false, profesional: true, centro: true },
      { name: 'Materiales para planes de trabajo', gratis: false, individual: false, profesional: true, centro: true },
      { name: 'Análisis de progreso con IA', gratis: false, individual: false, profesional: true, centro: true },
      { name: 'Informes consolidados del centro', gratis: false, individual: false, profesional: false, centro: true },
    ],
  },
  {
    name: 'Inteligencia Artificial',
    features: [
      { name: 'Asistente virtual IA', gratis: 'Limitado', individual: true, profesional: true, centro: true },
      { name: 'Notiz - Transcripción automática', gratis: 'Add-on $29.990', individual: 'Add-on $29.990', profesional: 'Incluido ✨', centro: 'Incluido ✨' },
      { name: 'Generador de planes con IA', gratis: 'Add-on $29.990', individual: 'Add-on $29.990', profesional: 'Incluido ✨', centro: 'Incluido ✨' },
    ],
  },
  {
    name: 'Personalización',
    features: [
      { name: 'Landing page personalizada', gratis: false, individual: true, profesional: true, centro: true },
      { name: 'Personalización de marca', gratis: false, individual: true, profesional: true, centro: 'Completa' },
    ],
  },
  {
    name: 'Marketplace',
    features: [
      { name: 'Acceso al marketplace', gratis: false, individual: 'Solo comprar', profesional: 'Comprar y vender', centro: 'Comprar y vender' },
    ],
  },
  {
    name: 'Soporte',
    features: [
      { name: 'Tipo de soporte', gratis: 'Email', individual: 'Email', profesional: 'WhatsApp prioritario', centro: 'VIP + Onboarding' },
    ],
  },
];

// ============================================
// FAQ
// ============================================

const faqs = [
  {
    question: '¿Los planes tienen permanencia?',
    answer: 'No, todos nuestros planes son sin compromiso. Puedes cancelar en cualquier momento desde tu panel de configuración y seguirás teniendo acceso hasta el final de tu período de facturación.',
  },
  {
    question: '¿Puedo cambiar mi plan después de suscribirme?',
    answer: 'Sí, puedes actualizar o degradar tu plan en cualquier momento. Si actualizas, el cambio es inmediato y se prorratea el costo. Si degradas, el cambio se aplica al siguiente ciclo de facturación.',
  },
  {
    question: '¿Puedo importar mi base de datos de pacientes actual?',
    answer: 'Sí, DentalSpot permite importar pacientes desde archivos Excel o CSV. También ofrecemos asistencia personalizada para migrar datos desde otros sistemas en los planes Profesional y Centro.',
  },
  {
    question: '¿Qué incluye el descuento por pago anual?',
    answer: 'Al elegir el pago anual, obtienes 2 meses gratis. Es decir, pagas 10 meses y disfrutas 12 meses completos del servicio.',
  },
  {
    question: '¿Qué son los Add-ons de Notiz y Generador de Planes?',
    answer: 'Son funcionalidades avanzadas de inteligencia artificial. Notiz transcribe automáticamente tus sesiones y genera notas clínicas. El Generador de Planes crea planes de tratamiento personalizados. Están incluidos en los planes Profesional y Centro, pero pueden agregarse a planes inferiores por $29.990/mes cada uno.',
  },
  {
    question: '¿En cuánto tiempo puedo ver resultados después de suscribirme?',
    answer: 'Desde el primer día. El agendamiento y gestión de pacientes funcionan inmediatamente. La mayoría de nuestras usuarias reportan ahorrar entre 5-10 horas semanales en tareas administrativas durante el primer mes.',
  },
  {
    question: '¿Qué soporte recibiré para aprovechar al máximo mi suscripción?',
    answer: 'Todos los planes incluyen acceso a nuestra base de conocimientos y tutoriales en video. Los planes pagados incluyen soporte por email, el plan Profesional agrega WhatsApp prioritario, y el plan Centro incluye onboarding personalizado con un especialista.',
  },
  {
    question: '¿Mis datos y los de mis pacientes están seguros?',
    answer: 'Absolutamente. DentalSpot cumple con todas las normativas de protección de datos de salud. Utilizamos encriptación de nivel bancario, servidores seguros y realizamos copias de seguridad diarias. Tus datos nunca se comparten con terceros.',
  },
];

// ============================================
// COMPONENTE: Tarjeta de Plan
// ============================================

const PlanCard = ({ plan, isYearly, delay, isLoggedIn, trackEvent }) => {
  const price = isYearly ? plan.priceYearly : plan.priceMonthly;
  const priceCLP = isYearly ? plan.priceCLPYearly : plan.priceCLPMonthly;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="h-full"
    >
      <Card className={`relative flex flex-col h-full transition-all duration-300 hover:shadow-xl ${plan.popular
          ? 'border-2 border-secondary shadow-lg'
          : 'border border-gray-200 hover:border-gray-300'
        }`}>
        {/* Popular Badge */}
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <Badge className="bg-secondary text-white px-4 py-1 text-xs font-bold rounded-full shadow-md">
              POPULAR
            </Badge>
          </div>
        )}

        <CardHeader className="items-center text-center pb-4 pt-8">
          {/* Icon */}
          <div className="mb-4">
            {React.cloneElement(plan.icon, {
              className: `w-12 h-12 ${plan.popular ? 'text-secondary' : plan.iconColor}`
            })}
          </div>

          {/* Plan Name */}
          <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>

          {/* Description */}
          <CardDescription className="mt-2 min-h-[48px] text-gray-500">
            {plan.description}
          </CardDescription>

          {/* Price */}
          <div className="mt-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-gray-900">
                ${price}
              </span>
              <span className="text-gray-500">/mes</span>
            </div>
            {priceCLP > 0 && (
              <p className="text-sm text-gray-400 mt-1">
                ~${priceCLP?.toLocaleString('es-CL')} CLP
              </p>
            )}
            {isYearly && plan.priceMonthly > 0 && (
              <Badge variant="outline" className="mt-2 text-primary border-primary/30 bg-primary/5">
                Ahorras 2 meses
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-grow px-6">
          <ul className="space-y-3">
            {plan.features.map((feature, index) => (
              <li key={index} className={`flex items-start gap-3 ${feature.isHeader ? 'font-semibold text-gray-900 mt-2' : ''}`}>
                {feature.included ? (
                  <Check className={`h-5 w-5 mt-0.5 flex-shrink-0 ${plan.popular ? 'text-secondary' : 'text-primary'
                    }`} />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-300 mt-0.5 flex-shrink-0" />
                )}
                <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="p-6 pt-4">
          <Button
            asChild
            className={`w-full h-12 text-base font-semibold rounded-full transition-all ${plan.popular
                ? 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 shadow-lg'
                : 'bg-primary text-white hover:bg-primary/90'
              }`}
          >
            <Link
              to={plan.id === 'centro' ? '/contacto?subject=Plan%20Centro' : isLoggedIn ? `/dashboard/membership?plan=${plan.id}` : `/auth/register?plan=${plan.id}`}
              onClick={() => trackEvent('InitiateCheckout', { content_name: plan.name, currency: 'CLP', value: priceCLP })}
            >
              {plan.cta}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

// ============================================
// COMPONENTE: Tarjeta de Add-on
// ============================================

const AddOnCard = ({ addon, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  >
    <Card className="h-full bg-gradient-to-br from-gray-50 to-white border-gray-200 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
            {addon.icon}
          </div>
          <Badge className="bg-primary/10 text-primary border-0">{addon.badge}</Badge>
        </div>
        <div className="mt-4">
          <CardTitle className="text-xl text-gray-900">{addon.name}</CardTitle>
          <p className="text-sm text-primary font-medium">{addon.subtitle}</p>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-gray-900">${addon.price.toLocaleString('es-CL')}</span>
          <span className="text-gray-500 text-sm"> CLP al mes</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm mb-4">{addon.description}</p>
        <ul className="space-y-2">
          {addon.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 p-3 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/10">
          <p className="text-xs text-primary font-medium">
            ✨ Incluido gratis en planes Profesional y Centro
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
          <Link to="/dashboard/membership">
            Descubre más
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  </motion.div>
);

// ============================================
// COMPONENTE: Tabla Comparativa
// ============================================

const ComparisonTable = () => {
  const renderValue = (value) => {
    if (value === true) return <Check className="h-5 w-5 text-primary mx-auto" />;
    if (value === false) return <XCircle className="h-5 w-5 text-gray-300 mx-auto" />;
    if (typeof value === 'string' && value.includes('Incluido')) {
      return <span className="text-sm text-primary font-medium">{value}</span>;
    }
    return <span className="text-sm text-gray-700">{value}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-4 px-4 font-semibold text-gray-900 w-1/3">Comparar planes</th>
            <th className="text-center py-4 px-2 w-1/6">
              <div className="flex flex-col items-center">
                <Gift className="h-6 w-6 text-gray-400 mb-1" />
                <span className="text-sm font-semibold text-gray-600">Gratis</span>
                <span className="text-lg font-bold text-gray-900">$0</span>
              </div>
            </th>
            <th className="text-center py-4 px-2 w-1/6">
              <div className="flex flex-col items-center">
                <Zap className="h-6 w-6 text-primary mb-1" />
                <span className="text-sm font-semibold text-gray-600">Individual</span>
                <span className="text-lg font-bold text-gray-900">$29</span>
              </div>
            </th>
            <th className="text-center py-4 px-2 w-1/6 bg-secondary/5 rounded-t-xl">
              <div className="flex flex-col items-center">
                <Users className="h-6 w-6 text-secondary mb-1" />
                <Badge className="bg-secondary text-white text-xs mb-1">Popular</Badge>
                <span className="text-sm font-semibold text-gray-600">Profesional</span>
                <span className="text-lg font-bold text-gray-900">$59</span>
              </div>
            </th>
            <th className="text-center py-4 px-2 w-1/6">
              <div className="flex flex-col items-center">
                <ShieldCheck className="h-6 w-6 text-primary mb-1" />
                <span className="text-sm font-semibold text-gray-600">Centro</span>
                <span className="text-lg font-bold text-gray-900">$99</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {comparisonCategories.map((category, catIndex) => (
            <React.Fragment key={catIndex}>
              {/* Category Header */}
              <tr className="bg-gray-50">
                <td colSpan={5} className="py-3 px-4">
                  <span className="font-semibold text-gray-800">{category.name}</span>
                </td>
              </tr>
              {/* Features */}
              {category.features.map((feature, featIndex) => (
                <tr key={featIndex} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-600">{feature.name}</td>
                  <td className="py-3 px-2 text-center">{renderValue(feature.gratis)}</td>
                  <td className="py-3 px-2 text-center">{renderValue(feature.individual)}</td>
                  <td className="py-3 px-2 text-center bg-secondary/5">{renderValue(feature.profesional)}</td>
                  <td className="py-3 px-2 text-center">{renderValue(feature.centro)}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// PÁGINA PRINCIPAL
// ============================================

const PricingPage = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [isYearly, setIsYearly] = useState(false);
  const [dynamicPlans, setDynamicPlans] = useState(pricingPlans);
  const { trackEvent } = useMetaTracking();

  useEffect(() => {
    trackEvent('ViewContent', { content_name: 'Pricing Page', content_category: 'Pricing' });
  }, []);

  // Fetch prices from subscription_plans table to keep in sync with admin
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('name, slug, price, is_active, description, features, max_patients, max_clinics, max_users, max_storage_mb')
          .eq('is_active', true)
          .order('sort_order');

        if (error || !data || data.length === 0) return;

        // Merge DB plans by position (sort_order) into hardcoded plans
        // Keeps features, icons, CTA from hardcoded; overrides name, price, description from DB
        setDynamicPlans(prev => prev.map((plan, index) => {
          const dbPlan = data[index];
          if (!dbPlan) return plan;

          // Parse features from DB if available
          let features = plan.features;
          if (dbPlan.features && Array.isArray(dbPlan.features) && dbPlan.features.length > 0) {
            features = dbPlan.features;
          }

          return {
            ...plan,
            name: dbPlan.name || plan.name,
            priceCLPMonthly: dbPlan.price,
            priceCLPYearly: Math.round(dbPlan.price * 0.8333),
            description: dbPlan.description || plan.description,
            features,
          };
        }));
      } catch (err) {
        // Silently fail — keep hardcoded prices as fallback
        logger.warn('Could not fetch dynamic prices:', err);
      }
    };
    fetchPrices();
  }, []);

  return (
    <div className="min-h-screen">
      {/* ============================================ */}
      {/* SECTION 1: HERO */}
      {/* ============================================ */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge className="bg-primary/10 text-primary border-0 mb-4 px-4 py-1">
              PARA ESPECIALISTAS
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Elige tu plan ideal
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              O prueba la{' '}
              <Link to={isLoggedIn ? '/dashboard/membership?plan=gratis' : '/auth/register?plan=gratis'} className="text-primary font-semibold hover:underline">
                versión gratuita
              </Link>
              .
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 bg-gray-100 rounded-full p-2">
              <span className={`text-sm font-medium px-3 py-1 rounded-full transition-all ${!isYearly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                Mensual
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-primary"
              />
              <span className={`text-sm font-medium px-3 py-1 rounded-full transition-all ${isYearly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                Anual
              </span>
              {isYearly && (
                <Badge className="bg-green-100 text-green-700 border-0">
                  2 meses gratis
                </Badge>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 2: PRICING CARDS */}
      {/* ============================================ */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {dynamicPlans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isYearly={isYearly}
                delay={index * 0.1}
                isLoggedIn={isLoggedIn}
                trackEvent={trackEvent}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 3: ADD-ONS */}
      {/* ============================================ */}
      <section className="py-20 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Mejora tu experiencia con{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                funcionalidades especiales
              </span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Potencia tu práctica con inteligencia artificial avanzada
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {addOns.map((addon, index) => (
              <AddOnCard key={addon.id} addon={addon} delay={index * 0.15} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 4: COMPARISON TABLE */}
      {/* ============================================ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Compara las características de todos los planes
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Todos los precios son por mes y por usuario.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-6 overflow-hidden"
          >
            <ComparisonTable />
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 5: FAQ */}
      {/* ============================================ */}
      <section className="py-20 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tus preguntas, nuestras respuestas
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white rounded-xl border border-gray-200 px-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-primary py-5 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 6: FINAL CTA */}
      {/* ============================================ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-12 md:p-16 text-center text-white shadow-2xl">
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
              </div>

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  Trabajemos juntos por el éxito de tu consulta
                </h2>
                <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                  Únete a miles de dentistas que ya transformaron su práctica con DentalSpot.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-primary hover:bg-gray-100 font-semibold text-lg px-8 py-6 rounded-full shadow-lg"
                >
                  <Link to="/auth/register">
                    Escoger plan
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 7: CUSTOM PLAN CTA */}
      {/* ============================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="py-12 text-center"
      >
        <h3 className="text-2xl font-semibold text-gray-900">¿Necesitas algo diferente?</h3>
        <p className="mt-2 text-muted-foreground">
          Ofrecemos soluciones personalizadas para grandes organizaciones.
        </p>
        <Button asChild variant="outline" size="lg" className="mt-6 rounded-full">
          <Link to="/contacto?subject=Plan%20Personalizado">Contáctanos</Link>
        </Button>
      </motion.div>

      {/* Footer spacing */}
      <div className="h-12" />
    </div>
  );
};

export default PricingPage;