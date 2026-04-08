import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import CouponForm from '../components/CouponForm';
import CouponRulesPanel from '../components/CouponRulesPanel';

/**
 * Edit a specific coupon.
 * Requires 'billing.write'.
 */
const CouponDetailPage = () => {
  return (
    <PermissionGuard module="payments" action="write">
      <div className="space-y-6 grid md:grid-cols-2 gap-6">
        <div>
            <h1 className="text-2xl font-bold mb-4">Editar Cupón</h1>
            <CouponForm onSubmit={() => {}} />
        </div>
        <div className="pt-12">
            <CouponRulesPanel />
        </div>
      </div>
    </PermissionGuard>
  );
};

export default CouponDetailPage;