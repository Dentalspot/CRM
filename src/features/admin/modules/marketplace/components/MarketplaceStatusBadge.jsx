/**
 * @file MarketplaceStatusBadge.jsx
 * @description Badge semántico para estados del marketplace (ventas, retiros, productos).
 */

import React from 'react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  completed:   { label: 'Completada',  color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  paid:        { label: 'Pagado',      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  pending:     { label: 'Pendiente',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  processing:  { label: 'Procesando',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  cancelled:   { label: 'Cancelado',   color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  invalidated: { label: 'Invalidada',  color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  failed:      { label: 'Fallido',     color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  approved:    { label: 'Aprobado',    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected:    { label: 'Rechazado',   color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const MarketplaceStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || { label: status || '—', color: 'bg-slate-100 text-slate-600' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', config.color)}>
      {config.label}
    </span>
  );
};

export default MarketplaceStatusBadge;