
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ensureWallet } from '@/features/wallet/api/walletApi';
import logger from '@/lib/utils/logger';
import {
  CheckCircle2,
  User,
  Image as ImageIcon,
  Stethoscope,
  Calendar,
  Search,
  Check,
  ChevronRight,
  Trophy,
  Users,
  ShoppingBag,
  HelpCircle,
  Wallet,
} from 'lucide-react';

const REWARD_PER_STEP = 500; // $500 CLP por paso

const OnboardingChecklist = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState({
    account: true,
    branding: false,
    specialties: false,
    availability: false,
    invite_colleagues: false,
    marketplace: false,
    questions: false,
  });

  const stepsDef = [
    {
      id: 'account',
      title: 'Cuenta creada',
      description: 'Te has registrado exitosamente en DentalSpot',
      icon: User,
      cta: '',
      href: ''
    },
    {
      id: 'branding',
      title: 'Personaliza tu perfil',
      description: 'Sube tu foto de perfil o logo profesional',
      icon: ImageIcon,
      cta: 'Subir foto',
      href: '/dashboard/profile'
    },
    {
      id: 'specialties',
      title: 'Define tus especialidades',
      description: 'Selecciona las áreas clínicas en las que trabajas',
      icon: Stethoscope,
      cta: 'Agregar',
      href: '/dashboard/profile?tab=academic'
    },
    {
      id: 'availability',
      title: 'Configura tu agenda',
      description: 'Establece tus horarios de atención',
      icon: Calendar,
      cta: 'Configurar',
      href: '/dashboard/profile?tab=clinics-availability'
    },
    {
      id: 'invite_colleagues',
      title: 'Invita a tus colegas',
      description: 'Gana dinero en tu wallet para comprar planificaciones, talleres, cursos y más en el Marketplace',
      icon: Users,
      cta: 'Invitar',
      href: '/dashboard/profile?tab=invitations'
    },
    {
      id: 'marketplace',
      title: 'Revisa materiales',
      description: 'Explora materiales que pueden facilitar tu día a día',
      icon: ShoppingBag,
      cta: 'Explorar',
      href: '/dashboard/marketplace'
    },
    {
      id: 'questions',
      title: 'Responde preguntas',
      description: 'Responde preguntas de pacientes y posiciónate como experto',
      icon: HelpCircle,
      cta: 'Responder',
      href: '/dashboard/therapist/questions'
    },
  ];

  // Credit $500 to wallet for completing an onboarding step
  const creditOnboardingReward = async (userId, stepId) => {
    try {
      const description = `Onboarding: ${stepId}`;

      // Check if already credited
      const { data: existing } = await supabase
        .from('wallet_transactions')
        .select('id')
        .eq('description', description)
        .limit(1);

      if (existing && existing.length > 0) return; // Already credited

      const wallet = await ensureWallet(userId);
      if (!wallet) return;

      // Insert transaction
      await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        type: 'credit',
        amount: REWARD_PER_STEP,
        description,
        reference_type: 'onboarding_reward',
      });

      // Update wallet balance
      await supabase
        .from('wallets')
        .update({
          balance: (wallet.balance || 0) + REWARD_PER_STEP,
        })
        .eq('id', wallet.id);

      toast({
        title: `+$${REWARD_PER_STEP} en tu Wallet`,
        description: `Ganaste $${REWARD_PER_STEP} por completar un paso del onboarding.`,
      });
    } catch (error) {
      logger.error('Error crediting onboarding reward:', error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchStatus = async () => {
      try {
        setLoading(true);
        const [brandRes, specRes, availRes, invRes, marketRes, questionsRes] = await Promise.all([
          supabase.from('therapist_branding').select('avatar_url, logo_url').eq('therapist_id', user.id).maybeSingle(),
          supabase.from('therapist_specialties').select('specialty_id').eq('therapist_id', user.id).limit(1),
          supabase.from('therapist_availabilities').select('id').eq('therapist_id', user.id).limit(1),
          // Invitations: check therapist_invitations table (status=accepted)
          supabase.from('therapist_invitations').select('id').eq('inviter_id', user.id).eq('status', 'accepted').limit(1),
          // Marketplace: check if user bought OR published anything
          supabase.from('marketplace_items').select('id').eq('seller_id', user.id).limit(1),
          // Questions: check if user has any answered questions OR published blog posts
          supabase.from('patient_questions').select('id').eq('therapist_id', user.id).limit(1),
        ]);

        // For marketplace, also check purchases as buyer
        let hasMarketplaceActivity = (marketRes.data?.length || 0) > 0;
        if (!hasMarketplaceActivity) {
          const { data: purchData } = await supabase
            .from('marketplace_purchases').select('id').eq('buyer_id', user.id).limit(1);
          hasMarketplaceActivity = (purchData?.length || 0) > 0;
        }

        const newStatus = {
          account: true,
          branding: !!(brandRes.data?.avatar_url || brandRes.data?.logo_url),
          specialties: (specRes.data?.length || 0) > 0,
          availability: (availRes.data?.length || 0) > 0,
          invite_colleagues: (invRes.data?.length || 0) > 0,
          marketplace: hasMarketplaceActivity,
          questions: (questionsRes.data?.length || 0) > 0,
        };

        setStatus(newStatus);
      } catch (error) {
        logger.error('Error fetching onboarding status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user]);

  // Credit wallet for all completed steps (duplicate-safe)
  useEffect(() => {
    if (!user?.id || loading) return;
    for (const stepId of Object.keys(status)) {
      if (status[stepId]) {
        creditOnboardingReward(user.id, stepId);
      }
    }
  }, [status, loading, user]);

  if (loading) {
    return (
      <Card className="animate-pulse shadow-sm border-slate-200 dark:border-slate-800">
        <CardContent className="p-6 space-y-4">
          <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          <div className="space-y-3 pt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedStepsCount = Object.values(status).filter(Boolean).length;
  const totalEarned = completedStepsCount * REWARD_PER_STEP;
  const maxEarned = stepsDef.length * REWARD_PER_STEP;
  const percentage = Math.round((completedStepsCount / stepsDef.length) * 100);
  const isComplete = completedStepsCount === stepsDef.length;

  if (isComplete) return null;

  const getLevelBadge = (completed) => {
    if (completed < 3) return { name: 'Principiante', className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' };
    if (completed < 6) return { name: 'Avanzado', className: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' };
    return { name: 'Experto', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' };
  };

  const level = getLevelBadge(completedStepsCount);
  const firstIncompleteIndex = stepsDef.findIndex(s => !status[s.id]);

  return (
    <Card className="mb-8 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-indigo-600"></div>

      <CardHeader className="pb-4 pt-6 px-6 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Comienza tu viaje en DentalSpot
          </CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Completa estos pasos y gana <strong>${REWARD_PER_STEP}</strong> en tu wallet por cada uno.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 font-semibold bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
            <Wallet className="w-3.5 h-3.5 mr-1" />
            ${totalEarned.toLocaleString('es-CL')} ganados
          </Badge>
          <Badge variant="outline" className={`px-3 py-1 font-semibold ${level.className}`}>
            {level.name}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-0">
        <div className="space-y-1 mb-6">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-slate-600 dark:text-slate-300">Progreso</span>
            <span className="text-violet-600 dark:text-violet-400">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2.5 [&>div]:bg-violet-600" />
        </div>

        {/* Resumen de pasos completados */}
        {completedStepsCount > 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {completedStepsCount} {completedStepsCount === 1 ? 'paso completado' : 'pasos completados'} — ${totalEarned.toLocaleString('es-CL')} ganados
          </p>
        )}

        <div className="space-y-3">
          {stepsDef.filter(step => !status[step.id]).map((step, index) => {
            const isNext = index === 0;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isNext
                    ? 'bg-white border-violet-200 ring-1 ring-violet-100 shadow-sm dark:bg-slate-900 dark:border-violet-800 dark:ring-violet-900'
                    : 'bg-slate-50/50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    isNext ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
                           : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      {step.title}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
                    +${REWARD_PER_STEP}
                  </Badge>

                  {step.cta && (
                    <Button
                      size="sm"
                      variant={isNext ? "default" : "outline"}
                      className={isNext ? "bg-violet-600 hover:bg-violet-700 text-white" : ""}
                      onClick={() => navigate(step.href)}
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
      </CardContent>
    </Card>
  );
};

export default OnboardingChecklist;
