/**
 * @file BillingQuickNav.jsx
 * @description Grid de accesos rápidos a sub-páginas del módulo billing.
 * Reutilizable: acepta items por prop para flexibilidad futura.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt, CreditCard, XCircle, DollarSign, BadgeCheck, BarChart3, ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ICON_COLORS = {
  blue:   'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  amber:  'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  green:  'text-green-600 bg-green-50 dark:bg-green-900/20',
  purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  red:    'text-red-600 bg-red-50 dark:bg-red-900/20',
  slate:  'text-slate-600 bg-slate-50 dark:bg-slate-800',
};

const DEFAULT_ITEMS = [
  { title: 'Suscripciones',       description: 'Listado completo y filtros',  icon: Receipt,    to: '/admin/billing/subscriptions', color: 'blue' },
  { title: 'Historial de Pagos',  description: 'Transacciones y estados',     icon: CreditCard, to: '/admin/billing/payments',      color: 'green' },
  { title: 'Pagos Fallidos',      description: 'Transacciones con error',     icon: XCircle,    to: '/admin/billing/payments/failed', color: 'red' },
  { title: 'Reembolsos',          description: 'Gestionar devoluciones',      icon: DollarSign, to: '/admin/billing/payments/refunds', color: 'amber' },
  { title: 'Planes y Membresías', description: 'Configuración de planes',     icon: BadgeCheck, to: '/admin/billing/plans',         color: 'purple' },
  { title: 'Reportes Financieros', description: 'Métricas y exportaciones',   icon: BarChart3,  to: '/admin/billing/reports',        color: 'slate' },
];

const QuickNavItem = ({ title, description, icon: Icon, to, color }) => (
  <Link to={to}>
    <Card className="group hover:shadow-md transition-all cursor-pointer h-full">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={cn('p-2 rounded-lg shrink-0', ICON_COLORS[color])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
      </CardContent>
    </Card>
  </Link>
);

const BillingQuickNav = ({ items = DEFAULT_ITEMS }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Acceso Rápido</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <QuickNavItem key={item.to} {...item} />
        ))}
      </div>
    </div>
  );
};

export default BillingQuickNav;