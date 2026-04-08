/**
 * @file PatientsListPage.jsx
 * @description Dashboard principal para Pacientes@dentalspot.cl
 * Gestión demográfica, calidad de datos y análisis poblacional.
 * Página thin: composición de componentes modulares.
 */

import React from 'react';
import {
  Users, UserPlus, UserCheck, HeartHandshake,
  RefreshCw, AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { usePatientsDashboard } from '../hooks/usePatientsDashboard';

import PatientsMetricsCard from '../components/PatientsMetricsCard';
import RecentPatientsTable from '../components/RecentPatientsTable';
import DataQualitySummaryPanel from '../components/DataQualitySummaryPanel';
import PatientsQuickNav from '../components/PatientsQuickNav';

const PatientsListPage = () => {
  const { metrics, recentPatients, loading, error, refresh } = usePatientsDashboard();

  return (
    <PermissionGuard module="patients" action="read">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
              <p className="text-muted-foreground mt-0.5">
                Gestión demográfica, calidad de datos y análisis poblacional
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualizar
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3 text-sm text-red-700 dark:text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Error al cargar datos de pacientes.</span>
            <Button variant="outline" size="sm" onClick={refresh} className="ml-auto">
              Reintentar
            </Button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PatientsMetricsCard
            title="Total Pacientes"
            value={metrics?.totalPatients ?? '—'}
            icon={Users}
            color="blue"
            loading={loading}
            subtitle="en plataforma"
          />
          <PatientsMetricsCard
            title="Activos"
            value={metrics?.activePatients ?? '—'}
            icon={UserCheck}
            color="green"
            loading={loading}
            subtitle="con estado activo"
          />
          <PatientsMetricsCard
            title="Nuevos este Mes"
            value={metrics?.newThisMonth ?? '—'}
            icon={UserPlus}
            color="amber"
            loading={loading}
            subtitle="registros recientes"
          />
          <PatientsMetricsCard
            title="Terapeutas"
            value={metrics?.therapistsWithPatients ?? '—'}
            icon={HeartHandshake}
            color="purple"
            loading={loading}
            subtitle="con pacientes asignados"
          />
        </div>

        {/* Content: Tabla + Panel calidad */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentPatientsTable patients={recentPatients} loading={loading} />
          </div>
          <div className="space-y-6">
            <DataQualitySummaryPanel metrics={metrics} loading={loading} />
          </div>
        </div>

        <Separator />

        {/* Quick Nav */}
        <PatientsQuickNav />
      </div>
    </PermissionGuard>
  );
};

export default PatientsListPage;
