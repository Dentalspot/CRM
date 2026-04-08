import React from 'react';
import { useParams } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import ModelPerformanceCard from '../components/ModelPerformanceCard';

/**
 * Detail view of an AI Model.
 */
const AiModelDetailPage = () => {
  const { id } = useParams();

  return (
    <PermissionGuard module="ai_tools" action="read">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Modelo: {id}</h1>
        <ModelPerformanceCard />
      </div>
    </PermissionGuard>
  );
};

export default AiModelDetailPage;