import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Wallet, Building2, AlertCircle } from 'lucide-react';

const formatCLP = (n) => new Intl.NumberFormat('es-CL').format(Math.round(n || 0));

const KPICard = ({ icon: Icon, label, value, color = 'text-foreground', sub }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 font-mono ${color}`}>
            ${formatCLP(value)}
          </p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className="rounded-full bg-primary/10 p-2 shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * KPIs adaptados según rol.
 */
const IncomeKPIs = ({ kpis, role }) => {
  if (role === 'clinic' || role === 'assistant') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KPICard
          icon={TrendingUp}
          label="Total cobrado"
          value={kpis.totalGross}
          sub={`${kpis.paymentCount} pagos`}
        />
        <KPICard
          icon={Building2}
          label="Comisiones retenidas"
          value={kpis.totalCommission}
          color="text-emerald-700"
          sub="Ingreso de la clínica"
        />
        <KPICard
          icon={AlertCircle}
          label="Saldos pendientes"
          value={kpis.pendingBalance}
          color="text-amber-700"
          sub="Por cobrar"
        />
      </div>
    );
  }

  // Dentista (default)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <KPICard
        icon={TrendingUp}
        label="Total bruto cobrado"
        value={kpis.totalGross}
        sub={`${kpis.paymentCount} pagos`}
      />
      <KPICard
        icon={Wallet}
        label="Mi parte neta"
        value={kpis.totalNet}
        color="text-emerald-700"
        sub="Después de comisiones"
      />
      <KPICard
        icon={AlertCircle}
        label="Saldos pendientes"
        value={kpis.pendingBalance}
        color="text-amber-700"
        sub="Por cobrar"
      />
    </div>
  );
};

export default IncomeKPIs;
