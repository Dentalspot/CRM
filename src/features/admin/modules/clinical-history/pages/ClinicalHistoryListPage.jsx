/**
 * @file ClinicalHistoryListPage.jsx
 * @description Dashboard principal para Ficha@dentalspot.cl
 * Gobernanza, auditoría y cumplimiento de registros clínicos.
 * Página thin: composición de componentes modulares.
 */

import React from 'react';
import {
  ClipboardList, FileText, Users, CalendarDays,
  RefreshCw, AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { useClinicalHistoryDashboard } from '../hooks/useClinicalHistoryDashboard';

import ClinicalHistoryMetricsCard from '../components/ClinicalHistoryMetricsCard';
import RecentRecordsPanel from '../components/RecentRecordsPanel';
import GovernancePanel from '../components/GovernancePanel';
import ClinicalHistoryQuickNav from '../components/ClinicalHistoryQuickNav';

const ClinicalHistoryListPage = () => {
  const { metrics, recentRecords, loading, error, refresh } = useClinicalHistoryDashboard();

  return (
    <PermissionGuard module="clinical_files" action="read">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <ClipboardList className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Fichas Clínicas</h1>
              <p className="text-muted-foreground mt-0.5">
                Gobernanza, auditoría y cumplimiento normativo
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
            <span>Error al cargar datos de fichas clínicas.</span>
            <Button variant="outline" size="sm" onClick={refresh} className="ml-auto">
              Reintentar
            </Button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ClinicalHistoryMetricsCard
            title="Total Registros"
            value={metrics?.totalRecords ?? '—'}
            icon={FileText}
            color="blue"
            loading={loading}
            subtitle="fichas en plataforma"
          />
          <ClinicalHistoryMetricsCard
            title="Este Mes"
            value={metrics?.recordsThisMonth ?? '—'}
            icon={CalendarDays}
            color="green"
            loading={loading}
            subtitle="nuevos registros"
          />
          <ClinicalHistoryMetricsCard
            title="Última Semana"
            value={metrics?.recordsThisWeek ?? '—'}
            icon={ClipboardList}
            color="amber"
            loading={loading}
            subtitle="últimos 7 días"
          />
          <ClinicalHistoryMetricsCard
            title="Terapeutas Activos"
            value={metrics?.activeTherapists ?? '—'}
            icon={Users}
            color="purple"
            loading={loading}
            subtitle="con registros clínicos"
          />
        </div>

        {/* Content: Tabla + Panel Gobernanza */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentRecordsPanel records={recentRecords} loading={loading} />
          </div>
          <div className="space-y-6">
            <GovernancePanel />
          </div>
        </div>

        <Separator />

        {/* Quick Nav */}
        <ClinicalHistoryQuickNav />
      </div>
    </PermissionGuard>
  );
};

export default ClinicalHistoryListPage;
