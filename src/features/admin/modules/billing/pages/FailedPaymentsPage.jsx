import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import FailedPaymentAlert from '../components/FailedPaymentAlert';
import PaymentsTable from '../components/PaymentsTable';

/**
 * List of failed payments needing attention.
 * Requires 'billing.write' to potentially retry or contact user.
 */
const FailedPaymentsPage = () => {
  return (
    <PermissionGuard module="payments" action="write">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-red-600">Pagos Fallidos</h1>
        <FailedPaymentAlert error="3 pagos fallaron en la última hora" />
        <PaymentsTable payments={[]} />
      </div>
    </PermissionGuard>
  );
};

export default FailedPaymentsPage;