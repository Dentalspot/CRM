import React from 'react';
import { Link } from 'react-router-dom';
import { Send, Users, LayoutTemplate, BarChart3, Tag, Settings, Zap, ArrowRight, Facebook, Rocket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ICON_COLORS = {
  pink: 'text-primary bg-primary dark:bg-primary/20',
  blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  slate: 'text-slate-600 bg-slate-50 dark:bg-slate-800',
};

const ITEMS = [
  { title: 'Mission Control', description: 'Centro de comando y estado', icon: Rocket, to: '/admin/marketing/mission-control', color: 'purple' },
  { title: 'Pipeline Kanban', description: 'Seguimiento visual de leads', icon: BarChart3, to: '/admin/marketing/kanban', color: 'green' },
  { title: 'Importar Leads', description: 'Subir CSV de contactos', icon: Send, to: '/admin/marketing/import', color: 'blue' },
  { title: 'Audiencia', description: 'Segmentar y gestionar contactos', icon: Users, to: '/admin/marketing/audience', color: 'green' },
  { title: 'Campanas', description: 'Crear y enviar newsletters', icon: Send, to: '/admin/marketing/campaigns', color: 'pink' },
  { title: 'Templates', description: 'Plantillas de email', icon: LayoutTemplate, to: '/admin/marketing/templates', color: 'green' },
  { title: 'Analytics', description: 'Metricas de apertura y clicks', icon: BarChart3, to: '/admin/marketing/analytics', color: 'slate' },
  { title: 'Automatizacion', description: 'Flujos y triggers automaticos', icon: Zap, to: '/admin/marketing/automation', color: 'purple' },
  { title: 'Meta Ads', description: 'Campanas, anuncios y audiencias', icon: Facebook, to: '/admin/marketing/meta-ads', color: 'blue' },
  { title: 'Configuracion', description: 'Resend, Meta, dominio', icon: Settings, to: '/admin/marketing/settings', color: 'slate' },
];

const QuickNavItem = ({ title, description, icon: Icon, to, color }) => (
  <Link to={to}>
    <Card className="group hover:shadow-md transition-all cursor-pointer h-full">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={cn('p-2 rounded-lg shrink-0', ICON_COLORS[color])}><Icon className="h-4 w-4" /></div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
      </CardContent>
    </Card>
  </Link>
);

const MarketingQuickNav = () => (
  <div>
    <h2 className="text-lg font-semibold mb-4">Acceso Rapido</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {ITEMS.map((item) => <QuickNavItem key={item.to} {...item} />)}
    </div>
  </div>
);

export default MarketingQuickNav;
