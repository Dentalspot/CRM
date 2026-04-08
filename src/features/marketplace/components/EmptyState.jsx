import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * EmptyState — Componente reutilizable para estados vacíos.
 * 
 * Decisión UX: Los empty states NO son dead-ends. Siempre ofrecen
 * una acción siguiente para mantener a la usuaria en flujo.
 * El tono es tranquilizador, no frustrante.
 */
const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  compact = false,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-16'}`}>
      {Icon && (
        <div className={`rounded-2xl bg-slate-50 flex items-center justify-center mb-4 ${compact ? 'h-12 w-12' : 'h-16 w-16'}`}>
          <Icon className={`text-slate-300 ${compact ? 'h-6 w-6' : 'h-8 w-8'}`} />
        </div>
      )}
      <h3 className={`font-semibold text-slate-700 ${compact ? 'text-sm' : 'text-base'}`}>
        {title}
      </h3>
      <p className={`text-slate-400 mt-1 max-w-sm ${compact ? 'text-xs' : 'text-sm'}`}>
        {description}
      </p>
      {(actionLabel || secondaryLabel) && (
        <div className="flex items-center gap-3 mt-5">
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              className="bg-teal-600 hover:bg-teal-700 text-white"
              size={compact ? 'sm' : 'default'}
            >
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && onSecondary && (
            <Button
              variant="ghost"
              onClick={onSecondary}
              size={compact ? 'sm' : 'default'}
              className="text-slate-500"
            >
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
