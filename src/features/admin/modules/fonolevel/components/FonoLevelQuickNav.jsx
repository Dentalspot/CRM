import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Award, Shield, BarChart3, Settings, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ICON_COLORS = {
  rose: 'text-primary bg-primary dark:bg-primary/20',
  amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  slate: 'text-slate-600 bg-slate-50 dark:bg-slate-800',
};

const ITEMS = [
  { title: 'Gestión de Niveles', description: 'Configurar sistema de reputación', icon: Settings, to: '/admin/dentallevel/management', color: 'rose' },
  { title: 'Especialidades',    description: 'Administrar especialidades',       icon: Award,    to: '/admin/dentallevel/specialties', color: 'amber' },
  { title: 'Insignias',         description: 'Badges y reconocimientos',         icon: Shield,   to: '/admin/dentallevel/badges',      color: 'green' },
  { title: 'Revisión',          description: 'Reputación por aprobar',           icon: Star,     to: '/admin/dentallevel/review',      color: 'purple' },
  { title: 'Métricas',          description: 'Performance profesional',          icon: BarChart3, to: '/admin/dentallevel/metrics',    color: 'slate' },
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

const DentalLevelQuickNav = () => (
  <div>
    <h2 className="text-lg font-semibold mb-4">Acceso Rápido</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {ITEMS.map((item) => <QuickNavItem key={item.to} {...item} />)}
    </div>
  </div>
);

export default DentalLevelQuickNav;
