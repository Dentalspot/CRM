import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import SupportAuditLogTable from '../components/SupportAuditLogTable';
import { useSupportAuditLogs } from '../hooks/useSupportAuditLogs';

/**
 * Audit log for support actions.
 */
const AuditLogPage = () => {
  const { auditLogs } = useSupportAuditLogs({});

  return (
    <PermissionGuard module="support" action="read">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Auditoría de Soporte</h1>
        <SupportAuditLogTable logs={auditLogs} />
      </div>
    </PermissionGuard>
  );
};

export default AuditLogPage;