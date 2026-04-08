/**
 * @file LegalDashboardPage.jsx
 * @description Dashboard principal para Legal@dentalspot.cl
 * Gobierno normativo, cumplimiento y documentos legales.
 * Página thin: composición de componentes modulares.
 */
import React from 'react';
import { Scale, FileText, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { useLegalDashboard } from '../hooks/useLegalDashboard';

import LegalMetricsCard from '../components/LegalMetricsCard';
import ComplianceOverviewPanel from '../components/ComplianceOverviewPanel';
import LegalQuickNav from '../components/LegalQuickNav';

const LegalDashboardPage = () => {
  const { stats, recentDocs: documents, policies, loading, error, refresh } = useLegalDashboard();

  return (
    <PermissionGuard module="legal" action="read">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Scale className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Legal & Cumplimiento</h1>
              <p className="text-muted-foreground mt-0.5">Gobierno normativo, documentos y gestión de riesgos</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} /> Actualizar
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3 text-sm text-red-700 dark:text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Error al cargar datos legales.</span>
            <Button variant="outline" size="sm" onClick={refresh} className="ml-auto">Reintentar</Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <LegalMetricsCard
            title="Contratos Activos"
            value={stats?.active_contracts ?? 0}
            icon={FileText} color="blue" loading={loading}
            subtitle="documentos vigentes"
          />
          <LegalMetricsCard
            title="Disputas Abiertas"
            value={stats?.open_disputes ?? 0}
            icon={AlertTriangle}
            color={stats?.open_disputes > 0 ? 'red' : 'green'}
            loading={loading} subtitle="requieren atención"
            alert={stats?.open_disputes > 0 ? 'Acción requerida' : undefined}
          />
          <LegalMetricsCard
            title="Riesgo Legal"
            value="Bajo"
            icon={Shield} color="green" loading={loading}
            subtitle="evaluación general"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ComplianceOverviewPanel />
          <div className="p-6 border rounded-lg bg-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Documentos Recientes
            </h3>
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Sin documentos legales</p>
                <p className="text-xs text-muted-foreground mt-1">Los documentos aparecerán aquí cuando se creen</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <p className="font-medium text-sm">{doc.title || 'Sin título'}</p>
                    <span className="text-xs text-muted-foreground">{doc.status || 'borrador'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator />

        <LegalQuickNav />
      </div>
    </PermissionGuard>
  );
};

export default LegalDashboardPage;
