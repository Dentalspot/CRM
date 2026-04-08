import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, AlertTriangle, AlertCircle, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const MarketplaceAccessAlert = ({
  title,
  description,
  variant = 'info', // info, warning, error
  onAction,
  actionLabel = 'Ir al Marketplace',
  dismissible = false,
  onDismiss,
  className
}) => {
  const styles = {
    info: {
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      Icon: Info
    },
    warning: {
      borderColor: 'border-yellow-200',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      Icon: AlertTriangle
    },
    error: {
      borderColor: 'border-red-200',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      Icon: AlertCircle
    }
  };

  const currentStyle = styles[variant] || styles.info;
  const Icon = currentStyle.Icon;

  return (
    <Alert 
      className={cn(
        "relative transition-all duration-300 shadow-sm",
        currentStyle.borderColor,
        currentStyle.bgColor,
        className
      )}
    >
      <Icon className={cn("h-5 w-5", currentStyle.iconColor)} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ml-2">
        <div className="flex-1">
          {title && (
            <AlertTitle className={cn("font-semibold mb-1", currentStyle.textColor)}>
              {title}
            </AlertTitle>
          )}
          {description && (
            <AlertDescription className={cn("text-sm opacity-90", currentStyle.textColor)}>
              {description}
            </AlertDescription>
          )}
        </div>
        
        {onAction && (
          <Button 
            size="sm" 
            onClick={onAction}
            className={cn(
              "shrink-0 gap-2 font-medium shadow-none", 
              variant === 'info' && "bg-blue-600 hover:bg-blue-700 text-white",
              variant === 'warning' && "bg-yellow-500 hover:bg-yellow-600 text-white",
              variant === 'error' && "bg-red-600 hover:bg-red-700 text-white"
            )}
          >
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            "absolute top-3 right-3 p-1 rounded-full hover:bg-black/5 transition-colors",
            currentStyle.textColor
          )}
          aria-label="Cerrar alerta"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </Alert>
  );
};

export default MarketplaceAccessAlert;