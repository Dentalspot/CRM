import React from 'react';
import { useParams } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import EvaluationMetricsChart from '../components/EvaluationMetricsChart';

/**
 * Detail of a single evaluation run.
 */
const AiEvaluationDetailPage = () => {
  const { id } = useParams();

  return (
    <PermissionGuard module="ai_tools" action="read">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Evaluación: {id}</h1>
        <EvaluationMetricsChart />
      </div>
    </PermissionGuard>
  );
};

export default AiEvaluationDetailPage;