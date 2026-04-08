/**
 * @file MarketplaceDashboardPage.jsx
 * @description Dashboard principal para Marketplace@dentalspot.cl
 * Página thin: composición de componentes modulares.
 * Data fetching delegado a useMarketplaceDashboard hook.
 */

import React from 'react';
import {
  Store, TrendingUp, DollarSign, Wallet, Package,
  RefreshCw, AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/adminUtils';

import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { useMarketplaceDashboard } from '../hooks/useMarketplaceDashboard';

import MarketplaceMetricsCard from '../components/MarketplaceMetricsCard';
import RecentSalesTable from '../components/RecentSalesTable';
import WithdrawalsPendingPanel from '../components/WithdrawalsPendingPanel';
import ProductsPendingPanel from '../components/ProductsPendingPanel';
import MarketplaceQuickNav from '../components/MarketplaceQuickNav';

const MarketplaceDashboardPage = () => {
  const {
    metrics, recentSales, pendingWithdrawals, pendingProducts,
    loading, error, refresh,
  } = useMarketplaceDashboard();

  return (
    <PermissionGuard module="marketplace" action="read">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Store className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
              <p className="text-muted-foreground mt-0.5">
                Ventas, comisiones, retiros y productos digitales
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
            <span>Error al cargar datos del marketplace.</span>
            <Button variant="outline" size="sm" onClick={refresh} className="ml-auto">
              Reintentar
            </Button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MarketplaceMetricsCard
            title="Volumen Ventas (Mes)"
            value={metrics ? formatCurrency(metrics.totalVolumeMonth) : '—'}
            icon={TrendingUp}
            color="green"
            loading={loading}
            subtitle={metrics ? `${metrics.totalSalesMonth} transacciones` : ''}
          />
          <MarketplaceMetricsCard
            title="Comisiones Cobradas"
            value={metrics ? formatCurrency(metrics.commissionRevenue) : '—'}
            icon={DollarSign}
            color="blue"
            loading={loading}
            subtitle="pagadas a la plataforma"
          />
          <MarketplaceMetricsCard
            title="Retiros Pendientes"
            value={metrics ? formatCurrency(metrics.pendingWithdrawalsAmount) : '—'}
            icon={Wallet}
            color={metrics?.pendingWithdrawalsCount > 0 ? 'amber' : 'green'}
            loading={loading}
            subtitle={metrics ? `${metrics.pendingWithdrawalsCount} solicitudes` : ''}
            alert={metrics?.pendingWithdrawalsCount > 0 ? 'Requiere aprobación' : undefined}
          />
          <MarketplaceMetricsCard
            title="Productos Activos"
            value={metrics?.activeProducts ?? '—'}
            icon={Package}
            color="indigo"
            loading={loading}
            subtitle="en catálogo"
          />
        </div>

        {/* Content: Tabla + Paneles */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentSalesTable sales={recentSales} loading={loading} />
          </div>
          <div className="space-y-6">
            <WithdrawalsPendingPanel withdrawals={pendingWithdrawals} loading={loading} />
            <ProductsPendingPanel products={pendingProducts} loading={loading} />
          </div>
        </div>

        <Separator />

        {/* Quick Nav */}
        <MarketplaceQuickNav />
      </div>
    </PermissionGuard>
  );
};

export default MarketplaceDashboardPage;