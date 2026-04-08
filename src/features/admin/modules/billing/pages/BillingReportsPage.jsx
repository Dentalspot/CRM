import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import BillingChart from '../components/BillingChart';

/**
 * Advanced billing reports and analytics.
 * Requires 'billing.read'.
 */
const BillingReportsPage = () => {
  return (
    <PermissionGuard module="payments" action="read">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Reportes Financieros</h1>
        <div className="grid grid-cols-1 gap-6">
            <BillingChart />
            <div className="p-4 border rounded bg-card">
                Tabla de desglose detallado (Stub)
            </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default BillingReportsPage;