import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import PoliciesTable from '../components/PoliciesTable';
import { useLegalPolicies } from '../hooks/useLegalPolicies';
import { Loader2 } from 'lucide-react';

const PoliciesPage = () => {
  const { policies, loading } = useLegalPolicies();

  return (
    <PermissionGuard module="legal" action="read">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Políticas Internas</h1>
        <p className="text-muted-foreground">Políticas de seguridad, privacidad y cumplimiento normativo</p>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : (
          <PoliciesTable policies={policies} />
        )}
      </div>
    </PermissionGuard>
  );
};

export default PoliciesPage;
