import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import IncidentsTable from '../components/IncidentsTable';
import { useIncidents } from '../hooks/useIncidents';

/**
 * Incident management page.
 */
const IncidentsPage = () => {
  const { incidents } = useIncidents({});

  return (
    <PermissionGuard module="support" action="read">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Incidentes</h1>
        <IncidentsTable incidents={incidents} />
      </div>
    </PermissionGuard>
  );
};

export default IncidentsPage;