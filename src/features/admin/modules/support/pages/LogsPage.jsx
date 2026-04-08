import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import LogsTable from '../components/LogsTable';
import { useSystemLogs } from '../hooks/useSystemLogs';

/**
 * System Logs viewer.
 */
const LogsPage = () => {
  const { logs } = useSystemLogs({});

  return (
    <PermissionGuard module="support" action="read">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Logs del Sistema</h1>
        <LogsTable logs={logs} />
      </div>
    </PermissionGuard>
  );
};

export default LogsPage;