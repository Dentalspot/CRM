/**
 * @file DentalLevelListPage.jsx
 * @description Dashboard principal para DentalLevel@dentalspot.cl
 * Página thin: composición de componentes modulares.
 */
import React from 'react';
import { Star, Users, CheckCircle2, Award, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { useDentalLevelDashboard } from '../hooks/useFonoLevelDashboard';

import DentalLevelMetricsCard from '../components/FonoLevelMetricsCard';
import TherapistsListPanel from '../components/TherapistsListPanel';
import DentalLevelQuickNav from '../components/FonoLevelQuickNav';

const DentalLevelListPage = () => {
  const { metrics, topTherapists, loading, error, refresh } = useDentalLevelDashboard();

  return (
    <PermissionGuard module="dentallevel" action="read">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary dark:bg-primary/30 rounded-lg">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">DentalLevel</h1>
              <p className="text-muted-foreground mt-0.5">Reputación, insignias y especialidades profesionales</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} /> Actualizar
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3 text-sm text-red-700 dark:text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Error al cargar datos de DentalLevel.</span>
            <Button variant="outline" size="sm" onClick={refresh} className="ml-auto">Reintentar</Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <DentalLevelMetricsCard title="Total Terapeutas" value={metrics?.totalTherapists ?? '—'} icon={Users} color="blue" loading={loading} subtitle="registrados" />
          <DentalLevelMetricsCard title="Verificados" value={metrics?.verifiedTherapists ?? '—'} icon={CheckCircle2} color="green" loading={loading} subtitle="perfil validado" />
          <DentalLevelMetricsCard title="Especialidades" value={metrics?.totalSpecialties ?? '—'} icon={Award} color="amber" loading={loading} subtitle="disponibles" />
        </div>

        <TherapistsListPanel therapists={topTherapists} loading={loading} />

        <Separator />

        <DentalLevelQuickNav />
      </div>
    </PermissionGuard>
  );
};

export default DentalLevelListPage;
