import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { Button } from '@/components/ui/button';

/**
 * Admin page for reviewing flagged profiles and manually adjusting scores.
 * Requires 'dentallevel.write' permission.
 */
const FonoReputationReviewPage = () => {
  return (
    <PermissionGuard module="dentallevel" action="write">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Revisión de Reputación</h1>
        <p className="text-muted-foreground">Perfiles que requieren atención manual.</p>
        <Button>Forzar Recálculo General</Button>
      </div>
    </PermissionGuard>
  );
};

export default FonoReputationReviewPage;