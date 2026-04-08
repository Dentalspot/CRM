/**
 * @file BillingDashboardPage.jsx
 * @description Dashboard principal para Pagos@dentalspot.cl
 * Página thin: solo composición de componentes modulares.
 * Data fetching delegado a useBillingDashboard hook.
 */

import React from 'react';
import {
  TrendingUp, Activity, AlertCircle, XCircle,
  CreditCard, RefreshCw, AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/adminUtils';

import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { useBillingDashboard } from '../hooks/useBillingDashboard';

// Componentes modulares del módulo billing
import BillingMetricsCard from '../components/BillingMetricsCard';
import RecentSubscriptionsTable from '../components/RecentSubscriptionsTable';
import PlansSummaryPanel from '../components/PlansSummaryPanel';
import CouponsSummaryPanel from '../components/CouponsSummaryPanel';
import BillingQuickNav from '../components/BillingQuickNav';

const BillingDashboardPage = () => {
  const { metrics, recentSubs, plans, coupons, loading, error, refresh } = useBillingDashboard();

  return (
    <PermissionGuard module="payments" action="read">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <CreditCard className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
              <p className="text-muted-foreground mt-0.5">
                Control financiero de pagos, suscripciones y planes
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
            <span>Error al cargar datos financieros.</span>
            <Button variant="outline" size="sm" onClick={refresh} className="ml-auto">
              Reintentar
            </Button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BillingMetricsCard
            title="MRR (Ingresos Recurrentes)"
            value={metrics ? formatCurrency(metrics.mrr || 0) : '—'}
            icon={TrendingUp}
            color="green"
            loading={loading}
            subtitle="mensual"
          />
          <BillingMetricsCard
            title="Suscripciones Activas"
            value={metrics?.activeSubscriptions ?? '—'}
            icon={Activity}
            color="blue"
            loading={loading}
            subtitle="planes vigentes"
          />
          <BillingMetricsCard
            title="Tasa de Churn"
            value={metrics ? `${metrics.churnRate}%` : '—'}
            icon={AlertCircle}
            color={metrics?.churnRate > 5 ? 'red' : 'green'}
            loading={loading}
            subtitle="cancelaciones este mes"
            alert={metrics?.churnRate > 5 ? 'Churn elevado' : undefined}
          />
          <BillingMetricsCard
            title="Pagos Fallidos (Hoy)"
            value={metrics?.failedPaymentsToday ?? '—'}
            icon={XCircle}
            color={metrics?.failedPaymentsToday > 0 ? 'red' : 'green'}
            loading={loading}
            subtitle="requieren atención"
            alert={metrics?.failedPaymentsToday > 0 ? 'Acción requerida' : undefined}
          />
        </div>

        {/* Content: Tabla + Paneles laterales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentSubscriptionsTable subscriptions={recentSubs} loading={loading} />
          </div>
          <div className="space-y-6">
            <PlansSummaryPanel plans={plans} loading={loading} />
            <CouponsSummaryPanel coupons={coupons} loading={loading} />
          </div>
        </div>

        <Separator />

        {/* Quick Nav */}
        <BillingQuickNav />
      </div>
    </PermissionGuard>
  );
};

export default BillingDashboardPage;