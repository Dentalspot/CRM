import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  Users,
  HardDrive,
  ArrowUpCircle,
  CalendarDays,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import {
  getCurrentSubscription,
  getUsageStats,
  PLAN_PRICING,
  PLAN_LIMITS,
  getPlanLimit,
  hasFeature,
  PLAN_NAMES
} from '../api/membershipApi';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/lib/utils/logger';
import { cn } from '@/lib/utils';

// Colores y labels por plan (solo UI)
const PLAN_UI = {
  free: {
    label: 'Gratuito',
    color: 'bg-slate-100 text-slate-700',
    borderColor: 'border-l-slate-300',
    iconColor: 'text-slate-400'
  },
  individual: {
    label: 'Individual',
    color: 'bg-blue-100 text-blue-700',
    borderColor: 'border-l-blue-500',
    iconColor: 'text-blue-500'
  },
  profesional: {
    label: 'Profesional',
    color: 'bg-teal-100 text-teal-700',
    borderColor: 'border-l-teal-500',
    iconColor: 'text-teal-500'
  },
  centro: {
    label: 'Centro de Salud',
    color: 'bg-purple-100 text-purple-700',
    borderColor: 'border-l-purple-500',
    iconColor: 'text-purple-500'
  }
};

const MembershipStatusWidget = ({ className }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [stats, setStats] = useState({ patientsCount: 0, storageUsedMB: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [subData, statsData] = await Promise.all([
        getCurrentSubscription(user.id),
        getUsageStats(user.id)
      ]);
      setSubscription(subData);
      setStats(statsData);
    } catch (error) {
      logger.error("Error loading membership widget data", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="pb-2">
          <div className="h-6 w-1/3 bg-slate-200 rounded"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 w-full bg-slate-200 rounded"></div>
          <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Obtener info del plan usando las constantes centralizadas
  const planKey = subscription?.plan_name || PLAN_NAMES.FREE;
  const planUI = PLAN_UI[planKey] || PLAN_UI.free;
  const maxPatients = getPlanLimit(planKey, 'maxPatients');

  // Calcular porcentajes
  const isUnlimitedPatients = maxPatients === Infinity;
  const patientsPercent = isUnlimitedPatients
    ? 5 // Solo mostrar una barra pequeña para ilimitado
    : Math.min(100, (stats.patientsCount / maxPatients) * 100);

  const maxStorage = getPlanLimit(planKey, 'maxStorageMB') || 5000;
  const storagePercent = Math.min(100, (stats.storageUsedMB / maxStorage) * 100);

  const isNearLimit = !isUnlimitedPatients && patientsPercent >= 80;
  const hasReachedLimit = !isUnlimitedPatients && stats.patientsCount >= maxPatients;

  const isFreePlan = planKey === PLAN_NAMES.FREE;
  const isPremiumPlan = planKey === PLAN_NAMES.PROFESSIONAL || planKey === PLAN_NAMES.CENTER;

  return (
    <Card className={cn(
      "border-l-4 shadow-sm",
      className,
      planUI.borderColor
    )}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Crown className={cn("h-4 w-4", planUI.iconColor)} />
          Mi Membresía
        </CardTitle>
        <Badge variant="secondary" className={planUI.color}>
          {isPremiumPlan && <Sparkles className="h-3 w-3 mr-1" />}
          Plan {planUI.label}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-5 pb-2">
        {/* Estadísticas de uso */}
        <div className="space-y-3">
          {/* Límite de pacientes */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Users className="h-3.5 w-3.5" />
                Pacientes Activos
              </span>
              <span className={cn(
                "font-medium",
                hasReachedLimit ? "text-red-600" : isNearLimit ? "text-amber-600" : "text-slate-600"
              )}>
                {stats.patientsCount} / {isUnlimitedPatients ? 'Ilimitado' : maxPatients}
              </span>
            </div>
            <Progress
              value={patientsPercent}
              className={cn(
                "h-2",
                hasReachedLimit ? "bg-red-100" : isNearLimit ? "bg-amber-100" : "bg-slate-100"
              )}
              indicatorClassName={cn(
                hasReachedLimit ? "bg-red-500" :
                  isNearLimit ? "bg-amber-500" :
                    isFreePlan ? "bg-slate-500" : "bg-teal-500"
              )}
            />
            {hasReachedLimit && (
              <p className="text-[10px] text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                Has alcanzado el límite de pacientes. Actualiza tu plan.
              </p>
            )}
            {isNearLimit && !hasReachedLimit && (
              <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                Estás cerca del límite de pacientes.
              </p>
            )}
          </div>

          {/* Almacenamiento */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <HardDrive className="h-3.5 w-3.5" />
                Almacenamiento
              </span>
              <span className="text-slate-600 font-medium">
                {stats.storageUsedMB} MB / {(maxStorage / 5000).toFixed(0)} GB
              </span>
            </div>
            <Progress
              value={storagePercent}
              className="h-2 bg-slate-100"
              indicatorClassName="bg-blue-500"
            />
          </div>
        </div>

        {/* Fecha de renovación */}
        {subscription?.current_period_end && !subscription?.isFree && (
          <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-md">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>
              {subscription?.cancel_at_period_end ? 'Vence el: ' : 'Renueva el: '}
              <span className="font-medium text-slate-700">
                {format(new Date(subscription.current_period_end), "d 'de' MMMM, yyyy", { locale: es })}
              </span>
            </span>
          </div>
        )}

        {/* Aviso si está cancelada pero aún activa */}
        {subscription?.cancel_at_period_end && (
          <div className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Tu suscripción no se renovará automáticamente.
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2">
        {isFreePlan ? (
          <Button
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-md border-0 h-9 text-xs"
            onClick={() => navigate('/planes')}
          >
            <ArrowUpCircle className="h-3.5 w-3.5 mr-2" />
            Mejorar Plan
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full h-9 text-xs border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            onClick={() => navigate('/dashboard/membership')}
          >
            Gestionar Suscripción
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default MembershipStatusWidget;