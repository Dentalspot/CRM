import React from 'react';
import { useParams } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import TransactionDetailsCard from '../components/TransactionDetailsCard';

/**
 * Details of a specific payment.
 * Requires 'billing.read'.
 */
const PaymentDetailPage = () => {
  const { id } = useParams();

  return (
    <PermissionGuard module="payments" action="read">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Transacción: {id}</h1>
        <TransactionDetailsCard transaction={{ id }} />
      </div>
    </PermissionGuard>
  );
};

export default PaymentDetailPage;