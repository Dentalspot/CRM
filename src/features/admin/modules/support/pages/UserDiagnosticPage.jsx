import React from 'react';
import { useParams } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import UserDiagnosticPanel from '../components/UserDiagnosticPanel';
import AccessWarningBanner from '../components/AccessWarningBanner';
import { useUserDiagnostic } from '../hooks/useUserDiagnostic';

/**
 * Diagnostic view for a specific user.
 * Protected by logging/audit.
 */
const UserDiagnosticPage = () => {
  const { id } = useParams();
  const { diagnostic } = useUserDiagnostic(id);

  return (
    <PermissionGuard module="support" action="read">
      <div className="space-y-6">
        <AccessWarningBanner />
        <h1 className="text-2xl font-bold">Diagnóstico de Usuario</h1>
        <UserDiagnosticPanel data={diagnostic} />
      </div>
    </PermissionGuard>
  );
};

export default UserDiagnosticPage;