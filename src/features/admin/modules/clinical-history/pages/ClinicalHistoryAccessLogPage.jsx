import React from 'react';
import { useParams, Link } from 'react-router-dom';
import AccessLogTable from '../components/AccessLogTable';
import { useAccessLog } from '../hooks/useAccessLog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

/**
 * @file ClinicalHistoryAccessLogPage.jsx
 * @description Page to display who has accessed a specific clinical record.
 */
const ClinicalHistoryAccessLogPage = () => {
  const { id } = useParams();
  const { accessLog, loading } = useAccessLog(id);

  return (
    <PermissionGuard module="clinical_history" action="read">
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to={`/admin/clinical-history/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Detalle
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Registro de Accesos</h1>
        <p className="text-muted-foreground">
          Quién ha visto, exportado o modificado este registro clínico.
        </p>
        <AccessLogTable log={accessLog} isLoading={loading} />
      </div>
    </PermissionGuard>
  );
};

export default ClinicalHistoryAccessLogPage;