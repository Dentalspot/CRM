import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import PaymentsTable from '../components/PaymentsTable';
import BillingFilters from '../components/BillingFilters';
import { usePayments } from '../hooks/usePayments';

/**
 * List of payment transactions.
 * Requires 'billing.read'.
 */
const PaymentsPage = () => {
  const { payments, loading } = usePayments();

  return (
    <PermissionGuard module="payments" action="read">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Historial de Pagos</h1>
        <BillingFilters />
        <PaymentsTable payments={payments} isLoading={loading} />
      </div>
    </PermissionGuard>
  );
};

export default PaymentsPage;