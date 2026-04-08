/**
 * @file SupportDashboardPage.jsx
 * @description Dashboard principal para Debug@dentalspot.cl
 * Página thin: composición de componentes modulares.
 * Data fetching delegado a useSupportDashboard hook.
 */

import React from 'react';
import {
  Phone, Ticket, AlertTriangle, Activity,
  RefreshCw, Shield,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { useSupportDashboard } from '../hooks/useSupportDashboard';

import SystemHealthCard from '../components/SystemHealthCard';
import OpenTicketsTable from '../components/OpenTicketsTable';
import ActiveIncidentsPanel from '../components/ActiveIncidentsPanel';
import SystemStatusPanel from '../components/SystemStatusPanel';
import SupportQuickNav from '../components/SupportQuickNav';

const SupportDashboardPage = () => {
  const {
    metrics, recentTickets, activeIncidents, systemHealth,
    loading, error, refresh,
  } = useSupportDashboard();

  return (
    <PermissionGuard module="support" action="read">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Phone className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Soporte & Debug</h1>
              <p className="text-muted-foreground mt-0.5">
                Tickets, incidentes, diagnóstico y salud del sistema
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
            <span>Error al cargar datos de soporte.</span>
            <Button variant="outline" size="sm" onClick={refresh} className="ml-auto">
              Reintentar
            </Button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SystemHealthCard
            metric="Tickets Abiertos"
            value={metrics?.open_tickets ?? '—'}
            icon={Ticket}
            color={metrics?.open_tickets > 5 ? 'red' : 'blue'}
            loading={loading}
            subtitle="requieren atención"
            alert={metrics?.open_tickets > 5 ? 'Carga alta' : undefined}
          />
          <SystemHealthCard
            metric="Incidentes Activos"
            value={metrics?.active_incidents ?? '—'}
            icon={AlertTriangle}
            color={metrics?.active_incidents > 0 ? 'red' : 'green'}
            loading={loading}
            subtitle="no resueltos"
            alert={metrics?.active_incidents > 0 ? 'Requiere atención' : undefined}
          />
          <SystemHealthCard
            metric="Eventos Auditoría (24h)"
            value={metrics?.audit_events_24h ?? '—'}
            icon={Shield}
            color="purple"
            loading={loading}
            subtitle="últimas 24 horas"
          />
          <SystemHealthCard
            metric="Estado Plataforma"
            value={systemHealth?.status === 'operational' ? 'Operativa' : 'Revisar'}
            icon={Activity}
            color={systemHealth?.status === 'operational' ? 'green' : 'amber'}
            loading={loading}
            subtitle={systemHealth ? `${systemHealth.total_users} usuarios` : ''}
          />
        </div>

        {/* Content: Tabla + Paneles */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <OpenTicketsTable tickets={recentTickets} loading={loading} />
          </div>
          <div className="space-y-6">
            <ActiveIncidentsPanel incidents={activeIncidents} loading={loading} />
            <SystemStatusPanel health={systemHealth} loading={loading} />
          </div>
        </div>

        <Separator />

        {/* Quick Nav */}
        <SupportQuickNav />
      </div>
    </PermissionGuard>
  );
};

export default SupportDashboardPage;