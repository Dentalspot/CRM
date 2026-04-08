import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import SystemHealthChart from '../components/SystemHealthChart';
import { useSystemHealth } from '../hooks/useSystemHealth';

/**
 * Platform health overview.
 */
const SystemHealthPage = () => {
  const { health } = useSystemHealth();

  return (
    <PermissionGuard module="support" action="read">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Salud del Sistema</h1>
        <SystemHealthChart data={health} />
      </div>
    </PermissionGuard>
  );
};

export default SystemHealthPage;