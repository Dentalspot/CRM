import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLimitStatus } from '@/hooks/usePlanFeatures';
import { getPlanLimit } from '@/utils/planHelpers';
import { cn } from '@/lib/utils';
import UpgradeModal from '@/components/modals/UpgradeModal';

/**
 * Component to display usage limits and warnings
 * 
 * @param {Object} props
 * @param {string} props.limitKey - Key of the limit to check (e.g., 'maxPatients')
 * @param {string} props.variant - Visual style ('warning', 'error', 'info')
 * @param {boolean} props.showUpgradeButton - Whether to show the upgrade button
 * @param {Function} props.onUpgradeClick - Optional override for upgrade action
 * @param {string} props.className - Additional classes
 */
const LimitWarning = ({ 
  limitKey, 
  variant = 'warning', 
  showUpgradeButton = true, 
  onUpgradeClick,
  className 
}) => {
  const navigate = useNavigate();
  const { current, currentPlan, isNear, hasReached, isLoading } = useLimitStatus(limitKey);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const max = getPlanLimit(currentPlan, limitKey);
  const isUnlimited = max === Infinity;
  
  // Don't show anything if unlimited or loading (unless explicitly testing/handling)
  if (isLoading || isUnlimited) return null;

  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  
  // Determine effective variant if default is used
  let effectiveVariant = variant;
  if (variant === 'warning' && hasReached) effectiveVariant = 'error';
  if (variant === 'warning' && !isNear && !hasReached) effectiveVariant = 'info';

  const styles = {
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-500',
      text: 'text-blue-900',
      subtext: 'text-blue-700',
      bar: 'bg-blue-500', // Used via [&>div]:bg-blue-500 override on Progress
      Icon: AlertCircle,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      icon: 'text-amber-500',
      text: 'text-amber-900',
      subtext: 'text-amber-700',
      bar: 'bg-amber-500',
      Icon: AlertTriangle,
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: 'text-red-500',
      text: 'text-red-900',
      subtext: 'text-red-700',
      bar: 'bg-red-500',
      Icon: AlertCircle,
    },
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: 'text-green-500',
      text: 'text-green-900',
      subtext: 'text-green-700',
      bar: 'bg-green-500',
      Icon: CheckCircle2,
    }
  };

  const style = styles[effectiveVariant] || styles.info;
  const Icon = style.Icon;

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      setShowUpgradeModal(true);
    }
  };

  const getTitle = () => {
    if (hasReached) return 'Límite alcanzado';
    if (isNear) return 'Límite próximo';
    return 'Uso del plan';
  };

  const getDescription = () => {
    if (hasReached) return `Has alcanzado el límite de ${max} en tu plan actual.`;
    if (isNear) return `Estás cerca del límite de ${max} permitidos.`;
    return `Estás usando ${current} de ${max} disponibles.`;
  };

  return (
    <>
      <div className={cn(
        "rounded-lg border p-4 shadow-sm transition-all duration-300",
        style.bg,
        className
      )}>
        <div className="flex items-start gap-3">
          <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", style.icon)} />
          
          <div className="flex-1 space-y-3">
            <div>
              <h4 className={cn("font-medium text-sm", style.text)}>
                {getTitle()}
              </h4>
              <p className={cn("text-xs mt-1", style.subtext)}>
                {getDescription()}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium opacity-80">
                <span className={style.text}>{Math.round(percentage)}%</span>
                <span className={style.text}>{current} / {max}</span>
              </div>
              <Progress 
                value={percentage} 
                className={cn("h-2 bg-white/50", `[&>div]:${style.bar}`)} 
              />
            </div>

            {showUpgradeButton && (hasReached || isNear) && (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full bg-white hover:bg-white/80 border-transparent shadow-sm h-8 text-xs font-medium"
                onClick={handleUpgrade}
              >
                <ArrowUpCircle className="h-3.5 w-3.5 mr-2" />
                Mejorar mi plan
              </Button>
            )}
          </div>
        </div>
      </div>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={currentPlan}
        featureName={`más capacidad de ${limitKey.replace('max', '')}`}
      />
    </>
  );
};

export default LimitWarning;