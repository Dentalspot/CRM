import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Sparkles, Loader2, ArrowUpCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLAN_PRICING, PLAN_LIMITS, hasFeature } from '../api/membershipApi';
import { PLAN_UI_CONFIG } from './membershipConfig';
import { calculateDiscountedPrice } from '@/constants/planFeatures';

const PlanUpgradeCard = ({ planId, currentPlan, isYearly, onSelect, isProcessing, discount, clinicData, dynamicPlan }) => {
  const pricing = PLAN_PRICING[planId];
  const config = PLAN_UI_CONFIG[planId];
  const limits = PLAN_LIMITS[planId];
  const Icon = config.icon;

  // Override with dynamic data from subscription_plans table
  const displayName = dynamicPlan?.name || pricing.name;
  const displayPrice = dynamicPlan?.price ?? pricing.priceCLP;
  const displayDescription = dynamicPlan?.description || pricing.subtitle;

  const isCurrent = currentPlan === planId;
  const isDowngrade = PLAN_PRICING[currentPlan]?.priceCLP > displayPrice;
  const price = isYearly ? Math.round(displayPrice * 10) : displayPrice;
  const finalPrice = discount && discount.discount > 0
    ? calculateDiscountedPrice(displayPrice, clinicData.activeTherapists)
    : displayPrice;

  const highlights = [];
  if (limits.maxPatients === Infinity) {
    highlights.push('Pacientes ilimitados');
  } else {
    highlights.push(`Hasta ${limits.maxPatients} pacientes`);
  }
  if (hasFeature(planId, 'whatsappReminders')) highlights.push('WhatsApp');
  if (hasFeature(planId, 'aiReports')) highlights.push('IA Notiz');
  if (hasFeature(planId, 'multiClinic')) highlights.push('Multiclínica');

  return (
    <Card className={cn(
      "relative flex flex-col h-full transition-all duration-300",
      isCurrent ? "ring-2 ring-green-500 bg-green-50/30" : "hover:shadow-lg hover:border-gray-300",
      config.popular && !isCurrent && "ring-2 ring-pink-500/50"
    )}>
      {config.popular && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-1 shadow-md">
            <Sparkles className="h-3 w-3 mr-1" /> Recomendado
          </Badge>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 right-4 z-10">
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" /> Plan Actual
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4 pt-8">
        <div className={cn("mx-auto mb-4 p-3 rounded-xl w-fit", config.bgLight)}>
          <Icon className={cn("h-8 w-8", config.textColor)} />
        </div>
        <CardTitle className="text-xl">{displayName}</CardTitle>
        <CardDescription>{displayDescription}</CardDescription>

        <div className="mt-4">
          <div className="flex items-baseline justify-center gap-1 flex-wrap">
            {discount && discount.discount > 0 && displayPrice > 0 ? (
              <>
                <span className="text-lg line-through text-gray-400 mr-1">${displayPrice.toLocaleString('es-CL')}</span>
                <span className="text-3xl font-bold text-gray-900">${finalPrice.toLocaleString('es-CL')}</span>
                <span className="text-gray-500">/mes</span>
                <Badge className="ml-1 bg-teal-100 text-teal-700 border-0">-{Math.round(discount.discount * 100)}%</Badge>
              </>
            ) : (
              <>
                <span className="text-3xl font-bold text-gray-900">${price?.toLocaleString('es-CL')}</span>
                <span className="text-gray-500">/mes</span>
              </>
            )}
          </div>
          {isYearly && displayPrice > 0 && (
            <Badge variant="outline" className="mt-2 border-green-300 text-green-700 bg-green-50">Ahorras 2 meses</Badge>
          )}
          {discount && discount.discount > 0 && displayPrice > 0 && (
            <Badge className="mt-1 bg-teal-50 text-teal-700 border border-teal-200 font-normal">Precio clínica</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        <ul className="space-y-2">
          {highlights.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm">
              <Check className={cn("h-4 w-4", config.textColor)} />
              <span className="text-gray-700">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4">
        <Button
          onClick={() => onSelect(planId)}
          disabled={isCurrent || isProcessing === planId}
          className={cn(
            "w-full",
            isCurrent && "bg-green-600 hover:bg-green-600 cursor-default",
            config.popular && !isCurrent && "bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90"
          )}
          variant={isCurrent ? "default" : config.popular ? "default" : "outline"}
        >
          {isProcessing === planId ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
          ) : isCurrent ? (
            <><CheckCircle className="mr-2 h-4 w-4" /> Plan Actual</>
          ) : isDowngrade ? (
            'Cambiar Plan'
          ) : (
            <><ArrowUpCircle className="mr-2 h-4 w-4" /> Mejorar</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PlanUpgradeCard;
