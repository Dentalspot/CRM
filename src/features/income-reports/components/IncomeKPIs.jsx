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

const ClinicBreakdownCard = ({ row, isClinic }) => (
  <Card className="border-dashed">
    <CardContent className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium truncate">{row.name}</p>
        <span className="text-xs text-muted-foreground">· {row.count}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Bruto</p>
          <p className="font-mono font-semibold">${formatCLP(row.gross)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{isClinic ? 'Comisión' : 'Neto'}</p>
          <p className="font-mono font-semibold text-emerald-700">
            ${formatCLP(isClinic ? row.commission : row.net)}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * KPIs adaptados según rol + breakdown por clínica.
 */
const IncomeKPIs = ({ kpis, role }) => {
  const isClinic = role === 'clinic' || role === 'assistant';
  const breakdown = kpis.byClinic || [];
  // Solo mostrar breakdown si hay >1 clínica representada (sino es redundante).
  const showBreakdown = breakdown.length > 1;

  return (
    <div className="space-y-3">
      {/* KPIs principales */}
      {isClinic ? (
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
      ) : (
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
      )}

      {/* Breakdown por clínica (solo si pertenece a más de una) */}
      {showBreakdown && (
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">
            Desglose por clínica
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {breakdown.map((row, idx) => (
              <ClinicBreakdownCard key={idx} row={row} isClinic={isClinic} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeKPIs;
