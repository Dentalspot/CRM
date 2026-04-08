import React from 'react';
import { useParams } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import ErrorCard from '../components/ErrorCard';
import { useErrorDetail } from '../hooks/useErrorDetail';

/**
 * Detailed error report.
 */
const ErrorDetailPage = () => {
  const { id } = useParams();
  const { errorDetail } = useErrorDetail(id);

  return (
    <PermissionGuard module="support" action="read">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Error #{id}</h1>
        <ErrorCard error={errorDetail} />
      </div>
    </PermissionGuard>
  );
};

export default ErrorDetailPage;