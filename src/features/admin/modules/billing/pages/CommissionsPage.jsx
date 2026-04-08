import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import CommissionsTable from '../components/CommissionsTable';
import BillingMetricsCard from '../components/BillingMetricsCard';

/**
 * Overview of commissions (marketplace/partners).
 * Requires 'billing.write' (sensitive financial data).
 */
const CommissionsPage = () => {
  return (
    <PermissionGuard module="payments" action="write">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Gestión de Comisiones</h1>
        <div className="grid grid-cols-3 gap-4">
            <BillingMetricsCard title="Pendiente Pago" value="$0" />
        </div>
        <CommissionsTable />
      </div>
    </PermissionGuard>
  );
};

export default CommissionsPage;