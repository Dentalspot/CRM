/**
 * @file SupportQuickNav.jsx
 * @description Grid de accesos rápidos a sub-páginas del módulo support.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket, AlertTriangle, Search, FileText, Server,
  Bug, Shield, ArrowRight,
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

const ITEMS = [
  { title: 'Tickets',          description: 'Gestión de tickets de soporte',    icon: Ticket,        to: '/admin/support/tickets',   color: 'blue' },
  { title: 'Incidentes',       description: 'Registro y seguimiento',           icon: AlertTriangle, to: '/admin/support/incidents', color: 'red' },
  { title: 'Buscar Usuario',   description: 'Diagnóstico por usuario',          icon: Search,        to: '/admin/support/users',     color: 'purple' },
  { title: 'Logs del Sistema', description: 'Registros y trazabilidad',         icon: FileText,      to: '/admin/support/logs',      color: 'slate' },
  { title: 'Salud del Sistema', description: 'Métricas y estado general',       icon: Server,        to: '/admin/support/health',    color: 'green' },
  { title: 'Análisis de Errores', description: 'Errores críticos y tendencias', icon: Bug,           to: '/admin/support/errors',    color: 'amber' },
  { title: 'Auditoría',        description: 'Log de acciones administrativas',  icon: Shield,        to: '/admin/support/audit',     color: 'slate' },
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

const SupportQuickNav = () => (
  <div>
    <h2 className="text-lg font-semibold mb-4">Acceso Rápido</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {ITEMS.map((item) => <QuickNavItem key={item.to} {...item} />)}
    </div>
  </div>
);

export default SupportQuickNav;
