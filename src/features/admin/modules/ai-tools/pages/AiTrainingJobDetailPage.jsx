import React from 'react';
import { useParams } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import LogViewer from '../components/LogViewer';

/**
 * Details of a training job.
 */
const AiTrainingJobDetailPage = () => {
  const { id } = useParams();

  return (
    <PermissionGuard module="ai_tools" action="read">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Job {id}</h1>
        <LogViewer />
      </div>
    </PermissionGuard>
  );
};

export default AiTrainingJobDetailPage;