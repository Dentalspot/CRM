import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Calendar, ArrowUpCircle, AlertCircle, Users2, FileText, Building2 } from 'lucide-react';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PLAN_PRICING, PLAN_NAMES, getPlanLimit, hasFeature } from '../api/membershipApi';
import { PLAN_UI_CONFIG } from './membershipConfig';

const CurrentPlanHeader = ({ subscription, stats, onManage, dynamicPlan }) => {
  const planName = subscription?.plan_name || PLAN_NAMES.FREE;
  const planConfig = PLAN_UI_CONFIG[planName] || PLAN_UI_CONFIG[PLAN_NAMES.FREE];
  const planPricing = PLAN_PRICING[planName] || PLAN_PRICING[PLAN_NAMES.FREE];
  const Icon = planConfig.icon;

  // Dynamic overrides from subscription_plans table
  const displayName = dynamicPlan?.name || planPricing.name;
  const displaySubtitle = dynamicPlan?.description || planPricing.subtitle;
  const displayPrice = dynamicPlan?.price ?? planPricing.priceCLP;

  const isActive = subscription?.isActive;
  const isCancelled = subscription?.cancel_at_period_end;
  const periodEnd = subscription?.current_period_end;

  const maxPatients = getPlanLimit(planName, 'maxPatients');
  const patientsUsed = stats?.patientsCount || 0;
  const patientsPercent = maxPatients === Infinity ? 5 : Math.min(100, (patientsUsed / maxPatients) * 100);
  const isNearLimit = maxPatients !== Infinity && patientsPercent >= 80;

  return (
    <Card className={cn("relative overflow-hidden border-2", planConfig.borderColor)}>
      <div className={cn("absolute inset-0 opacity-5 bg-gradient-to-br", planConfig.gradient)} />

      <CardContent className="relative p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={cn("p-4 rounded-2xl bg-gradient-to-br shadow-lg", planConfig.gradient)}>
              <Icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-gray-900">Plan {displayName}</h2>
                {isActive && !isCancelled && (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" /> Activo
                  </Badge>
                )}
                {isCancelled && (
                  <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                    <AlertCircle className="h-3 w-3 mr-1" /> Cancela pronto
                  </Badge>
                )}
                {planConfig.popular && (
                  <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0">
                    <Star className="h-3 w-3 mr-1" /> Popular
                  </Badge>
                )}
              </div>
              <p className="text-gray-500">{displaySubtitle}</p>
              {planName !== PLAN_NAMES.FREE && (
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ${displayPrice?.toLocaleString('es-CL')}
                  </span>
                  <span className="text-gray-500">/mes</span>
                  <span className="text-sm text-gray-400">(~${Math.round(displayPrice / 900)} USD)</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {periodEnd && !subscription?.isFree && (
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                isCancelled ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-600"
              )}>
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  {isCancelled ? 'Vence: ' : 'Próxima facturación: '}
                  <strong>{format(new Date(periodEnd), "d 'de' MMMM, yyyy", { locale: es })}</strong>
                </span>
              </div>
            )}
            <div className="flex gap-2">
              {planName === PLAN_NAMES.FREE ? (
                <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 text-white shadow-lg" onClick={onManage}>
                  <ArrowUpCircle className="h-4 w-4 mr-2" /> Mejorar Plan
                </Button>
              ) : (
                <Button variant="outline" onClick={onManage}>Gestionar Suscripción</Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium flex items-center gap-2">
                  <Users2 className="h-4 w-4" /> Pacientes activos
                </span>
                <span className={cn("font-semibold", isNearLimit ? "text-amber-600" : "text-gray-900")}>
                  {patientsUsed} / {maxPatients === Infinity ? '∞' : maxPatients}
                </span>
              </div>
              <Progress value={patientsPercent} className={cn("h-2", isNearLimit ? "bg-amber-100" : "bg-gray-100")} />
              {isNearLimit && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Cerca del límite
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Almacenamiento
                </span>
                <span className="font-semibold text-gray-900">{stats?.storageUsedMB || 0} MB</span>
              </div>
              <Progress value={Math.min(100, (stats?.storageUsedMB || 0) / 50)} className="h-2 bg-gray-100" />
            </div>
            {hasFeature(planName, 'multiClinic') && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Clínicas
                  </span>
                  <span className="font-semibold text-gray-900">
                    {stats?.clinicsCount || 1} / {getPlanLimit(planName, 'maxClinics') === Infinity ? '∞' : getPlanLimit(planName, 'maxClinics')}
                  </span>
                </div>
                <Progress value={20} className="h-2 bg-gray-100" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentPlanHeader;
