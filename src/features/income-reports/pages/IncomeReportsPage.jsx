import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp } from 'lucide-react';
import { USER_ROLES } from '@/constants/roles';

import IncomeKPIs from '../components/IncomeKPIs';
import IncomeFilters from '../components/IncomeFilters';
import IncomeTable from '../components/IncomeTable';
import { useIncomeReport, useClinicTherapists } from '../hooks/useIncomeReport';

const fmtISO = (d) => d.toISOString().slice(0, 10);

/**
 * Página unificada de reportes de ingresos.
 * Detecta el rol del usuario y adapta KPIs, filtros y columnas.
 */
const IncomeReportsPage = () => {
  const { user, profile } = useAuth();
  const role = profile?.role || user?.role;

  // Mapeo de rol app → rol display
  const displayRole =
    role === USER_ROLES.CLINIC ? 'clinic'
    : role === USER_ROLES.ASSISTANT ? 'assistant'
    : 'therapist';

  const isClinicView = displayRole === 'clinic' || displayRole === 'assistant';

  // Default: este mes
  const defaultRange = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { dateFrom: fmtISO(from), dateTo: fmtISO(now) };
  }, []);

  const [filters, setFilters] = useState({
    ...defaultRange,
    method: null,
    therapistId: null,
  });

  // Lista de dentistas (solo se carga si es vista clínica)
  const { therapists } = useClinicTherapists(isClinicView, null);

  const { rows, kpis, loading } = useIncomeReport(filters, displayRole);

  return (
    <>
      <Helmet>
        <title>Ingresos | DentalSpot</title>
      </Helmet>

      <div className="space-y-5 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Reportes de ingresos</h1>
        </div>

        <IncomeFilters
          filters={filters}
          setFilters={setFilters}
          therapists={therapists}
          showTherapistFilter={isClinicView}
        />

        <IncomeKPIs kpis={kpis} role={displayRole} />

        <IncomeTable rows={rows} loading={loading} role={displayRole} />
      </div>
    </>
  );
};

export default IncomeReportsPage;
