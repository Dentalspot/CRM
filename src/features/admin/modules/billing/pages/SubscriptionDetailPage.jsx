import React from 'react';
import { useParams } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import SubscriptionStatusCard from '../components/SubscriptionStatusCard';

/**
 * Detailed view of a subscription.
 * Requires 'billing.read'.
 */
const SubscriptionDetailPage = () => {
  const { id } = useParams();

  return (
    <PermissionGuard module="payments" action="read">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Detalle de Suscripción: {id}</h1>
        <div className="grid md:grid-cols-3 gap-6">
            <SubscriptionStatusCard status="active" details="Renueva el 15/10/2026" />
        </div>
      </div>
    </PermissionGuard>
  );
};

export default SubscriptionDetailPage;