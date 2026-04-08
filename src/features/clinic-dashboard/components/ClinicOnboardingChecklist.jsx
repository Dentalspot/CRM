import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import logger from '@/lib/utils/logger';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Building2,
  MapPin,
  Mail,
  UserPlus,
  CalendarPlus,
  CreditCard,
  Award,
  Check,
  ChevronRight,
  Trophy,
  Rocket
} from 'lucide-react';

const STEPS = [
  {
    id: 'account',
    title: 'Cuenta creada',
    description: 'Te has registrado exitosamente como centro en DentalSpot',
    xp: 100,
    icon: Building2,
    cta: '',
    href: '',
  },
  {
    id: 'clinic_created',
    title: 'Registra tu centro',
    description: 'Crea tu clínica para empezar a gestionar tu equipo y pacientes',
    xp: 200,
    icon: Building2,
    cta: 'Crear clínica',
    action: 'create_clinic',
  },
  {
    id: 'clinic_info',
    title: 'Completa la información del centro',
    description: 'Agrega dirección, teléfono y horarios para que pacientes te encuentren',
    xp: 200,
    icon: MapPin,
    cta: 'Completar info',
    href: '/dashboard/clinic/settings',
  },
  {
    id: 'first_therapist',
    title: 'Invita a tu primer terapeuta',
    description: 'Agrega profesionales a tu equipo para empezar a atender',
    xp: 300,
    icon: Mail,
    cta: 'Invitar terapeuta',
    action: 'invite_therapist',
  },
  {
    id: 'first_patient',
    title: 'Registra el primer paciente',
    description: 'Agrega un paciente para que tu equipo pueda empezar a agendar',
    xp: 200,
    icon: UserPlus,
    cta: 'Agregar paciente',
    href: '/dashboard/patients',
  },
  {
    id: 'first_appointment',
    title: 'Agenda la primera cita',
    description: 'Programa la primera sesión y tu panel cobrará vida',
    xp: 300,
    icon: CalendarPlus,
    cta: 'Agendar cita',
    href: '/dashboard/calendar',
  },
  {
    id: 'subscription',
    title: 'Activa tu plan Centro',
    description: 'Desbloquea reportes consolidados, multisede y gestión avanzada',
    xp: 300,
    icon: CreditCard,
    cta: 'Ver planes',
    href: '/planes',
  },
];

const ClinicOnboardingChecklist = ({ clinicInfo, onCreateClinic, onInviteTherapist }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState({
    account: true,
    clinic_created: false,
    clinic_info: false,
    first_therapist: false,
    first_patient: false,
    first_appointment: false,
    subscription: false,
  });

  useEffect(() => {
    if (!user?.id) return;
    fetchStatus();
  }, [user?.id, clinicInfo]);

  const fetchStatus = async () => {
    try {
      setLoading(true);

      // Si no hay clínica, solo account está completo
      if (!clinicInfo?.id) {
        setStatus(prev => ({ ...prev, account: true }));
        setLoading(false);
        return;
      }

      const clinicId = clinicInfo.id;

      const [therapistsRes, patientsRes, appointmentsRes, subscriptionRes, clinicDetailRes] = await Promise.all([
        // Terapeutas en la clínica
        supabase
          .from('clinic_therapists')
          .select('id')
          .eq('clinic_id', clinicId)
          .limit(1),
        // Pacientes asociados a terapeutas de la clínica
        supabase
          .from('appointments')
          .select('patient_id')
          .eq('clinic_id', clinicId)
          .limit(1),
        // Citas en la clínica
        supabase
          .from('appointments')
          .select('id')
          .eq('clinic_id', clinicId)
          .limit(1),
        // Suscripción activa
        supabase
          .from('therapist_subscriptions')
          .select('status')
          .eq('therapist_id', user.id)
          .eq('status', 'active')
          .limit(1),
        // Info de la clínica (address, phone)
        supabase
          .from('clinics')
          .select('address, phone, modalidad')
          .eq('id', clinicId)
          .maybeSingle(),
      ]);

      const hasAddress = !!(clinicDetailRes.data?.address);
      const hasPhone = !!(clinicDetailRes.data?.phone);

      setStatus({
        account: true,
        clinic_created: true,
        clinic_info: hasAddress && hasPhone,
        first_therapist: (therapistsRes.data?.length || 0) > 0,
        first_patient: (patientsRes.data?.length || 0) > 0,
        first_appointment: (appointmentsRes.data?.length || 0) > 0,
        subscription: (subscriptionRes.data?.length || 0) > 0,
      });
    } catch (error) {
      logger.error('Error fetching clinic onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== LOADING ==========
  if (loading) {
    return (
      <Card className="animate-pulse shadow-sm border-slate-200">
        <CardContent className="p-6 space-y-4">
          <div className="h-6 w-1/3 bg-slate-200 rounded" />
          <div className="h-2 w-full bg-slate-200 rounded-full" />
          <div className="space-y-3 pt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 w-full bg-slate-100 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ========== CÁLCULOS ==========
  const maxXP = STEPS.reduce((acc, step) => acc + step.xp, 0);
  const totalXP = STEPS.reduce((acc, step) => status[step.id] ? acc + step.xp : acc, 0);
  const completedCount = Object.values(status).filter(Boolean).length;
  const percentage = Math.round((totalXP / maxXP) * 100);
  const isComplete = completedCount === STEPS.length;

  // Auto-hide cuando está completo
  if (isComplete) return null;

  const getLevelBadge = (xp) => {
    if (xp < 400) return { name: 'Configurando', className: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (xp < 800) return { name: 'En marcha', className: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (xp < 1300) return { name: 'Operativo', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    return { name: 'Centro Pro', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  };

  const level = getLevelBadge(totalXP);
  const firstIncompleteIndex = STEPS.findIndex(s => !status[s.id]);

  const handleStepAction = (step) => {
    if (step.action === 'create_clinic') {
      onCreateClinic?.();
    } else if (step.action === 'invite_therapist') {
      onInviteTherapist?.();
    } else if (step.href) {
      navigate(step.href);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-500 to-blue-600" />

      <CardHeader className="pb-4 pt-6 px-6 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Rocket className="w-5 h-5 text-teal-500" />
            Pon tu centro en marcha
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Completa estos pasos para tener tu torre de control operativa.
          </p>
        </div>
        <Badge variant="outline" className={`px-3 py-1 font-semibold ${level.className}`}>
          {level.name} · {totalXP} XP
        </Badge>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-0">
        {/* Progress bar */}
        <div className="space-y-1 mb-6">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-slate-600">{completedCount} de {STEPS.length} completados</span>
            <span className="text-teal-600">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2.5 [&>div]:bg-teal-600" />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, index) => {
            const isDone = status[step.id];
            const isNext = index === firstIncompleteIndex;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-50/50 border-emerald-100'
                    : isNext
                      ? 'bg-white border-teal-200 ring-1 ring-teal-100 shadow-sm'
                      : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-600'
                      : isNext
                        ? 'bg-teal-100 text-teal-600'
                        : 'bg-slate-200 text-slate-400'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>

                  <div>
                    <h4 className={`font-semibold text-sm ${isDone ? 'text-emerald-900' : 'text-slate-900'}`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="secondary" className={`text-xs ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    +{step.xp} XP
                  </Badge>

                  {!isDone && step.cta && (
                    <Button
                      size="sm"
                      variant={isNext ? 'default' : 'outline'}
                      className={isNext ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}
                      onClick={() => handleStepAction(step)}
                    >
                      {step.cta}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Beneficios del plan Centro */}
        {!status.subscription && (
          <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100">
            <h4 className="font-semibold text-teal-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-teal-600" />
              ¿Por qué activar el plan Centro?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
              <div className="flex items-start gap-2.5 text-sm text-teal-800">
                <Check className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                <span>Dashboard torre de control con KPIs en tiempo real</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-teal-800">
                <Check className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                <span>Alertas de pacientes en riesgo y ocupación del equipo</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-teal-800">
                <Check className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                <span>Gestión multisede con comparativa de rendimiento</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-teal-800">
                <Check className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                <span>Reportes consolidados y cálculo de comisiones</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClinicOnboardingChecklist;