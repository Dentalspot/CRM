import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { USER_ROLES } from '@/constants/roles';
import {
  Briefcase, Calendar, Camera, Building2, Users,
  Search, Stethoscope, ChevronRight, CheckCircle2, Sparkles,
} from 'lucide-react';

const STEPS_BY_ROLE = {
  [USER_ROLES.THERAPIST]: [
    {
      title: 'Completa tu perfil profesional',
      description: 'Sube tu foto, agrega tus especialidades y formación académica. Los pacientes confían más en perfiles completos.',
      icon: Camera,
      color: 'bg-teal-100 text-teal-700',
      action: '/dashboard/profile?tab=personal-info',
      cta: 'Ir a Mi Perfil',
    },
    {
      title: 'Configura tu primera clínica y horarios',
      description: 'Crea tu clínica (o consulta) y define los horarios en que atiendes. Sin esto, no podrás agendar citas.',
      icon: Calendar,
      color: 'bg-blue-100 text-blue-700',
      action: '/dashboard/profile?tab=clinics-availability',
      cta: 'Configurar Clínica',
    },
    {
      title: 'Activa tu perfil público',
      description: 'Hazte visible en el buscador de dentistas para que pacientes te encuentren y reserven online.',
      icon: Search,
      color: 'bg-purple-100 text-purple-700',
      action: '/dashboard/profile?tab=personal-info',
      cta: 'Activar Perfil',
    },
  ],
  [USER_ROLES.PATIENT]: [
    {
      title: 'Completa tus datos personales',
      description: 'Agrega tu información de contacto y datos médicos relevantes para que tu dentista tenga todo el contexto.',
      icon: Briefcase,
      color: 'bg-teal-100 text-teal-700',
      action: '/dashboard/profile?tab=personal-info',
      cta: 'Completar Perfil',
    },
    {
      title: 'Encuentra tu dentista',
      description: 'Busca profesionales por especialidad, ciudad o modalidad (online/presencial) y agenda tu primera cita.',
      icon: Stethoscope,
      color: 'bg-blue-100 text-blue-700',
      action: '/dentistas',
      cta: 'Buscar Especialista',
    },
  ],
  [USER_ROLES.CLINIC]: [
    {
      title: 'Registra tu clínica',
      description: 'Agrega el nombre, dirección y datos de contacto de tu centro. Este es el primer paso para operar en DentalSpot.',
      icon: Building2,
      color: 'bg-teal-100 text-teal-700',
      action: '/dashboard/profile?tab=clinic-info',
      cta: 'Registrar Clínica',
    },
    {
      title: 'Invita a tu primer dentista',
      description: 'Envía una invitación por email para que tus dentistas se unan a tu clínica y compartan agenda.',
      icon: Users,
      color: 'bg-blue-100 text-blue-700',
      action: '/dashboard/clinic/therapists',
      cta: 'Invitar Dentista',
    },
    {
      title: 'Configura tu plan',
      description: 'Elige el plan que mejor se adapte al tamaño de tu centro y desbloquea todas las funcionalidades.',
      icon: Sparkles,
      color: 'bg-purple-100 text-purple-700',
      action: '/dashboard/membership',
      cta: 'Ver Planes',
    },
  ],
};

const WelcomeModal = ({ isOpen, onClose }) => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [closing, setClosing] = useState(false);

  const role = profile?.role || user?.role || USER_ROLES.PATIENT;
  const steps = STEPS_BY_ROLE[role] || STEPS_BY_ROLE[USER_ROLES.PATIENT];
  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleComplete = async () => {
    setClosing(true);
    try {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      await refreshProfile();
    } catch (err) {
      logger.warn('Error marking onboarding complete:', err.message);
    }
    onClose();
  };

  const handleAction = () => {
    handleComplete().then(() => {
      navigate(step.action);
    });
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const firstName = (profile?.full_name || '').split(' ')[0] || 'profesional';

  return (
    <Dialog open={isOpen && !closing} onOpenChange={(open) => { if (!open) handleSkip(); }}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-8 pt-8 pb-6 text-white">
          {currentStep === 0 ? (
            <>
              <h2 className="text-2xl font-bold mb-1">
                Bienvenido/a, {firstName}!
              </h2>
              <p className="text-teal-100 text-sm">
                Te preparamos {steps.length} pasos rápidos para sacar el máximo provecho de DentalSpot.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-1">
                Paso {currentStep + 1} de {steps.length}
              </h2>
              <div className="flex gap-1.5 mt-3">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= currentStep ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Step Content */}
        <div className="px-8 py-6">
          <div className="flex items-start gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${step.color}`}>
              <StepIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900 mb-1">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-slate-400 hover:text-slate-600">
            Saltar todo
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAction}>
              {step.cta}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button onClick={handleNext} className="bg-teal-600 hover:bg-teal-700">
              {isLastStep ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Empezar
                </>
              ) : (
                'Siguiente'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
