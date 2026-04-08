import React from 'react';
import { useParams } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import LogViewer from '../components/LogViewer';
import { useLogDetail } from '../hooks/useLogDetail';

/**
 * Detailed view of a single log entry.
 */
const LogDetailPage = () => {
  const { id } = useParams();
  const { log } = useLogDetail(id);

  return (
    <PermissionGuard module="support" action="read">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Log #{id}</h1>
        <LogViewer log={log} />
      </div>
    </PermissionGuard>
  );
};

export default LogDetailPage;