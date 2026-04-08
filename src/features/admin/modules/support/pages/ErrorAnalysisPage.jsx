import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import ErrorAnalysisChart from '../components/ErrorAnalysisChart';
import { useErrorAnalysis } from '../hooks/useErrorAnalysis';

/**
 * Error trends and analysis.
 */
const ErrorAnalysisPage = () => {
  const { stats } = useErrorAnalysis('week');

  return (
    <PermissionGuard module="support" action="read">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Análisis de Errores</h1>
        <ErrorAnalysisChart data={stats} />
      </div>
    </PermissionGuard>
  );
};

export default ErrorAnalysisPage;