import React from 'react';
import { useParams } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

/**
 * Detailed view of a dataset.
 */
const AiDatasetDetailPage = () => {
  const { id } = useParams();

  return (
    <PermissionGuard module="ai_tools" action="read">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dataset: {id}</h1>
      </div>
    </PermissionGuard>
  );
};

export default AiDatasetDetailPage;