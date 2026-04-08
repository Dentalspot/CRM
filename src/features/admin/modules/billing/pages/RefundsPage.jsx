import React, { useState } from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import RefundModal from '../components/RefundModal';
import { Button } from '@/components/ui/button';

/**
 * Dashboard for processing refunds.
 * Requires 'billing.write'.
 */
const RefundsPage = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PermissionGuard module="payments" action="write">
      <div className="space-y-6">
        <div className="flex justify-between">
            <h1 className="text-3xl font-bold">Reembolsos</h1>
            <Button variant="destructive" onClick={() => setModalOpen(true)}>Nueva Solicitud</Button>
        </div>
        <p className="text-muted-foreground">Historial de reembolsos procesados.</p>
        
        <RefundModal open={modalOpen} onOpenChange={setModalOpen} onConfirm={() => setModalOpen(false)} />
      </div>
    </PermissionGuard>
  );
};

export default RefundsPage;