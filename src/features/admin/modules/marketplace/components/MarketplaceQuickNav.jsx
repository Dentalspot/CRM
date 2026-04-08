/**
 * @file MarketplaceQuickNav.jsx
 * @description Grid de accesos rápidos a sub-páginas del módulo marketplace.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, DollarSign, Wallet, Package, Ticket, BarChart3, Users, ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ICON_COLORS = {
  blue:   'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  amber:  'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  green:  'text-green-600 bg-green-50 dark:bg-green-900/20',
  purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  red:    'text-red-600 bg-red-50 dark:bg-red-900/20',
  indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
  slate:  'text-slate-600 bg-slate-50 dark:bg-slate-800',
};

const ITEMS = [
  { title: 'Ventas',          description: 'Historial y detalle de ventas',    icon: ShoppingCart, to: '/admin/marketplace/sales',       color: 'blue' },
  { title: 'Comisiones',      description: 'Gestión y aprobación',             icon: DollarSign,   to: '/admin/marketplace/commissions', color: 'green' },
  { title: 'Retiros',         description: 'Solicitudes de retiro de fondos',  icon: Wallet,       to: '/admin/marketplace/withdrawals', color: 'amber' },
  { title: 'Productos',       description: 'Moderación y catálogo',            icon: Package,      to: '/admin/marketplace/products',    color: 'indigo' },
  { title: 'Cupones',         description: 'Descuentos y promociones',         icon: Ticket,       to: '/admin/marketplace/coupons',     color: 'purple' },
  { title: 'Métricas',        description: 'Tendencias y reportes',            icon: BarChart3,    to: '/admin/marketplace/metrics',     color: 'slate' },
  { title: 'Rendimiento',     description: 'Performance por vendedor',         icon: Users,        to: '/admin/marketplace/performance', color: 'red' },
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

const MarketplaceQuickNav = () => (
  <div>
    <h2 className="text-lg font-semibold mb-4">Acceso Rápido</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {ITEMS.map((item) => <QuickNavItem key={item.to} {...item} />)}
    </div>
  </div>
);

export default MarketplaceQuickNav;