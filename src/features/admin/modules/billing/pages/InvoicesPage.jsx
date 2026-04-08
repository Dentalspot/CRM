import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import InvoicesTable from '../components/InvoicesTable';

/**
 * List of system-generated invoices.
 * Requires 'billing.read'.
 */
const InvoicesPage = () => {
  return (
    <PermissionGuard module="payments" action="read">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Facturación y Boletas</h1>
        <InvoicesTable />
      </div>
    </PermissionGuard>
  );
};

export default InvoicesPage;