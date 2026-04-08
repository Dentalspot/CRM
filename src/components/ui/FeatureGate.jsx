import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Sparkles, ArrowUpCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAddOnAccess } from '@/hooks/useAddOnAccess';
import AddOnUpgradeModal from '@/components/modals/AddOnUpgradeModal';
import { getMinimumPlanForFeature, getFeatureInfo } from '@/utils/planHelpers';
import { cn } from '@/lib/utils';

/**
 * FeatureGate Component
 * 
 * Protects content based on subscription plan features or add-on purchases.
 * Provides multiple UI variants for the locked state.
 */
const FeatureGate = ({ 
  feature, 
  addOn, 
  children, 
  fallback, 
  showUpgradePrompt = true, 
  title, 
  description, 
  variant = 'default', 
  onUpgradeClick,
  className,
  ...props
}) => {
  const navigate = useNavigate();
  const { hasFeature, loading: subLoading } = useSubscription();
  
  // Always call hooks, but only use relevant data
  // Pass empty string if addOn is undefined to prevent hooks warning if it was conditional (though it shouldn't be)
  const { 
    hasAccess: addOnAccess, 
    isLoading: addOnLoading, 
    config: addOnConfig 
  } = useAddOnAccess(addOn || 'dummy');

  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);

  // Determine which check to perform
  const isAddOnCheck = !!addOn;
  
  // Combined state
  const isLoading = isAddOnCheck ? addOnLoading : subLoading;
  const hasAccess = isAddOnCheck ? addOnAccess : (feature ? hasFeature(feature) : true);

  // Feature metadata
  const featureMeta = feature ? getFeatureInfo(feature) : {};
  const requiredPlan = feature ? getMinimumPlanForFeature(feature) : null;

  // Display texts
  const displayTitle = title || (isAddOnCheck ? addOnConfig?.name : featureMeta?.name) || 'Función Premium';
  const displayDesc = description || (isAddOnCheck ? addOnConfig?.description : featureMeta?.description) || 'Esta función requiere una actualización de plan.';
  
  // Handle Upgrade Action
  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
      return;
    }

    if (isAddOnCheck) {
      setIsAddOnModalOpen(true);
    } else {
      navigate('/planes');
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 min-h-[150px]", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary/50 mb-2" />
        <span className="text-sm text-muted-foreground">Verificando acceso...</span>
      </div>
    );
  }

  // 2. Access Granted
  if (hasAccess) {
    return children;
  }

  // 3. Custom Fallback
  if (fallback) {
    return (
      <>
        {fallback}
        {isAddOnCheck && (
          <AddOnUpgradeModal 
            isOpen={isAddOnModalOpen} 
            onClose={setIsAddOnModalOpen} 
            addOnId={addOn} 
          />
        )}
      </>
    );
  }

  // 4. Determine Active Variant
  // If prompts are disabled, force minimal UI unless variant is specifically handled otherwise
  const activeVariant = !showUpgradePrompt ? 'minimal' : variant;

  const UpgradeButton = ({ className: btnClass, size = 'default' }) => (
    <Button 
      onClick={handleUpgrade} 
      variant={isAddOnCheck ? "default" : "secondary"}
      className={cn("font-medium gap-2", btnClass)}
      size={size}
    >
      {isAddOnCheck ? (
        <>
          <Sparkles className="h-4 w-4" />
          {addOnConfig?.price ? `Comprar por ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(addOnConfig.price)}/mes` : "Adquirir Complemento"}
        </>
      ) : (
        <>
          <ArrowUpCircle className="h-4 w-4" />
          Mejorar Plan
        </>
      )}
    </Button>
  );

  // Render based on variant
  const renderLockedUI = () => {
    switch (activeVariant) {
      case 'banner':
        return (
          <div 
            className={cn(
              "flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100", 
              className
            )}
            role="alert"
            aria-label={`Función bloqueada: ${displayTitle}`}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full shadow-sm">
                <Lock className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-purple-900">{displayTitle}</h4>
                <p className="text-xs text-purple-700 hidden sm:block">{displayDesc}</p>
              </div>
            </div>
            <UpgradeButton size="sm" className="bg-purple-600 hover:bg-purple-700 text-white border-none" />
          </div>
        );

      case 'overlay':
        return (
          <div className={cn("relative overflow-hidden rounded-lg min-h-[200px]", className)}>
            {/* Blurry Background Content Mock */}
            <div className="absolute inset-0 filter blur-sm opacity-50 pointer-events-none select-none bg-gray-100 p-6">
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="h-32 bg-gray-200 rounded w-full" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
            
            {/* Overlay Content */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
              <div className="bg-white/10 p-4 rounded-full mb-4 backdrop-blur-md border border-white/20 shadow-lg">
                <Lock className="h-8 w-8 text-white drop-shadow-md" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 drop-shadow-md">{displayTitle}</h3>
              <p className="text-white/90 text-sm max-w-md mb-6 drop-shadow">{displayDesc}</p>
              <UpgradeButton className="bg-white text-purple-700 hover:bg-white/90" />
            </div>
          </div>
        );

      case 'minimal':
        return (
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div 
                  className={cn("inline-flex items-center justify-center p-2 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-200 transition-colors", className)}
                  role="button"
                  aria-disabled="true"
                  aria-label={displayTitle}
                  onClick={handleUpgrade}
                >
                  <Lock className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white border-slate-800">
                <p className="font-semibold text-xs mb-1">{displayTitle}</p>
                <p className="text-xs text-slate-300 max-w-[200px]">
                  {requiredPlan ? `Disponible en plan ${requiredPlan}` : 'Función bloqueada'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );

      case 'default':
      default:
        return (
          <Card className={cn("overflow-hidden border-none shadow-lg", className)}>
            <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-1">
              <CardContent className="bg-white m-[1px] rounded-lg p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  {isAddOnCheck ? (
                    <Sparkles className="h-8 w-8 text-indigo-600" />
                  ) : (
                    <Lock className="h-8 w-8 text-indigo-600" />
                  )}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {displayTitle}
                </h3>
                
                <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
                  {displayDesc}
                  {requiredPlan && (
                    <span className="block mt-2 font-medium text-indigo-600">
                      Disponible desde el plan {requiredPlan}
                    </span>
                  )}
                </p>

                <div className="w-full max-w-xs space-y-3">
                  <UpgradeButton className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-gray-400 hover:text-gray-600"
                    onClick={() => navigate('/dashboard')}
                  >
                    Volver al inicio
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        );
    }
  };

  return (
    <>
      {renderLockedUI()}
      
      {/* Modal for Add-on upgrades */}
      {isAddOnCheck && (
        <AddOnUpgradeModal 
          isOpen={isAddOnModalOpen} 
          onClose={setIsAddOnModalOpen} 
          addOnId={addOn} 
        />
      )}
    </>
  );
};

/**
 * Higher-Order Component to wrap components with FeatureGate
 * 
 * @param {React.Component} Component - Component to wrap
 * @param {Object} gateProps - FeatureGate props (feature, addOn, etc.)
 */
export const withFeatureGate = (Component, gateProps) => {
  const WrappedComponent = (props) => (
    <FeatureGate {...gateProps}>
      <Component {...props} />
    </FeatureGate>
  );
  
  WrappedComponent.displayName = `WithFeatureGate(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
};

export default FeatureGate;