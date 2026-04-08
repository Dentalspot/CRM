import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import PerformanceMetricsChart from '../components/PerformanceMetricsChart';

/**
 * Admin dashboard for viewing performance metrics related to DentalLevel.
 * Requires 'dentallevel.read' permission.
 */
const FonoPerformanceMetricsPage = () => {
  return (
    <PermissionGuard module="dentallevel" action="read">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Métricas de Desempeño DentalLevel</h1>
        <div className="grid md:grid-cols-2 gap-6">
            <PerformanceMetricsChart data={{}} />
            <PerformanceMetricsChart data={{}} />
        </div>
      </div>
    </PermissionGuard>
  );
};

export default FonoPerformanceMetricsPage;