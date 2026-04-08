import React from 'react';
import { useParams } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import IncidentCard from '../components/IncidentCard';
import { useIncidentDetail } from '../hooks/useIncidentDetail';

/**
 * Detail view of an incident.
 */
const IncidentDetailPage = () => {
  const { id } = useParams();
  const { incident } = useIncidentDetail(id);

  return (
    <PermissionGuard module="support" action="read">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Incidente #{id}</h1>
        <IncidentCard incident={incident} />
      </div>
    </PermissionGuard>
  );
};

export default IncidentDetailPage;