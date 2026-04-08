/**
 * @file src/components/guards/PlanGuard.jsx
 * 
 * Protege rutas basado en el plan del usuario
 * Si no tiene acceso, redirige o muestra fallback
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { isPlanHigherOrEqual, getMinimumPlanForFeature } from '@/utils/planHelpers';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Guard para proteger rutas por plan mínimo
 * 
 * @param {Object} props
 * @param {string} props.requiredPlan - Plan mínimo requerido ('individual', 'profesional', 'centro')
 * @param {string} props.feature - Alternativa: feature key para determinar plan automáticamente
 * @param {ReactNode} props.children - Contenido a mostrar si tiene acceso
 * @param {string} props.redirectTo - Ruta de redirección (default: '/planes')
 * @param {boolean} props.showFallback - Mostrar UI de bloqueo en lugar de redirigir
 */
const PlanGuard = ({
  requiredPlan,
  feature,
  children,
  redirectTo = '/planes',
  showFallback = false,
}) => {
  const location = useLocation();
  const { currentPlan, loading, planInfo } = useSubscription();

  // Determinar plan requerido
  const minimumPlan = requiredPlan || (feature ? getMinimumPlanForFeature(feature) : null);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Sin plan requerido definido, permitir acceso
  if (!minimumPlan) {
    return children;
  }

  // Verificar acceso
  const hasAccess = isPlanHigherOrEqual(currentPlan, minimumPlan);

  // Si tiene acceso, renderizar children
  if (hasAccess) {
    return children;
  }

  // Sin acceso: mostrar fallback o redirigir
  if (showFallback) {
    return (
      <AccessDeniedFallback
        currentPlan={planInfo?.name || currentPlan}
        requiredPlan={minimumPlan}
        redirectTo={redirectTo}
      />
    );
  }

  // Redirigir guardando la ubicación actual
  return (
    <Navigate
      to={redirectTo}
      state={{ from: location, requiredPlan: minimumPlan }}
      replace
    />
  );
};

/**
 * Componente de fallback cuando no tiene acceso
 */
const AccessDeniedFallback = ({ currentPlan, requiredPlan, redirectTo }) => {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-primary" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Contenido Premium
          </h2>

          <p className="text-gray-500 mb-6">
            Esta sección requiere el plan <strong className="text-primary capitalize">{requiredPlan}</strong> o superior.
            <br />
            Tu plan actual es <strong className="capitalize">{currentPlan}</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => window.history.back()}>
              Volver
            </Button>
            <Button asChild>
              <a href={redirectTo}>Ver planes</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanGuard;

/**
 * HOC para envolver componentes con PlanGuard
 * 
 * @example
 * const ProtectedPage = withPlanGuard(MyPage, { requiredPlan: 'profesional' });
 */
export const withPlanGuard = (Component, guardProps) => {
  return function GuardedComponent(props) {
    return (
      <PlanGuard {...guardProps}>
        <Component {...props} />
      </PlanGuard>
    );
  };
};