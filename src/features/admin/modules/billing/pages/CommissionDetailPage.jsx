import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import CommissionCard from '../components/CommissionCard';

/**
 * Detail of a specific commission payout.
 * Requires 'billing.write'.
 */
const CommissionDetailPage = () => {
  return (
    <PermissionGuard module="payments" action="write">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Detalle de Comisión</h1>
        <CommissionCard commission={{ id: 'comm_stub', amount: 0 }} />
      </div>
    </PermissionGuard>
  );
};

export default CommissionDetailPage;