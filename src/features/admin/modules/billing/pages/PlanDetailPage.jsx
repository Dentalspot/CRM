import React from 'react';
import { useParams } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import PlanCard from '../components/PlanCard';

/**
 * Edit/View a specific plan configuration.
 * Requires 'billing.write'.
 */
const PlanDetailPage = () => {
  const { id } = useParams();

  return (
    <PermissionGuard module="payments" action="write">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Configuración del Plan</h1>
        <PlanCard plan={{ name: 'Plan Stub', price: 0 }} />
      </div>
    </PermissionGuard>
  );
};

export default PlanDetailPage;