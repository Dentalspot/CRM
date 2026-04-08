/**
 * @file AiQuickNav.jsx
 * @description Grid de accesos rápidos a sub-páginas de AI Tools.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Cpu, Database, FlaskConical, Terminal, FileText, Settings, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ICON_COLORS = {
  cyan:   'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20',
  purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  green:  'text-green-600 bg-green-50 dark:bg-green-900/20',
  amber:  'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  blue:   'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  slate:  'text-slate-600 bg-slate-50 dark:bg-slate-800',
};

const ITEMS = [
  { title: 'Modelos',         description: 'Gestión de modelos IA',          icon: Bot,          to: '/admin/ai-tools/models',      color: 'cyan' },
  { title: 'Entrenamiento',   description: 'Jobs de fine-tuning',            icon: Cpu,          to: '/admin/ai-tools/training',    color: 'purple' },
  { title: 'Datasets',        description: 'Datos para entrenamiento',       icon: Database,     to: '/admin/ai-tools/datasets',    color: 'green' },
  { title: 'Evaluaciones',    description: 'Métricas y benchmarks',          icon: FlaskConical, to: '/admin/ai-tools/evaluations', color: 'amber' },
  { title: 'Playground',      description: 'Probar inferencia en vivo',      icon: Terminal,     to: '/admin/ai-tools/playground',  color: 'blue' },
  { title: 'Prompts',         description: 'Templates de prompts',           icon: FileText,     to: '/admin/ai-tools/prompts',     color: 'slate' },
  { title: 'Configuración',   description: 'API keys y límites',             icon: Settings,     to: '/admin/ai-tools/settings',    color: 'slate' },
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

const AiQuickNav = () => (
  <div>
    <h2 className="text-lg font-semibold mb-4">Acceso Rápido</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {ITEMS.map((item) => <QuickNavItem key={item.to} {...item} />)}
    </div>
  </div>
);

export default AiQuickNav;
