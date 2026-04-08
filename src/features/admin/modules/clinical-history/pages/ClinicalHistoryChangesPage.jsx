import React from 'react';
import { useParams, Link } from 'react-router-dom';
import ChangeHistoryTimeline from '../components/ChangeHistoryTimeline';
import { useChangeHistory } from '../hooks/useChangeHistory';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

/**
 * @file ClinicalHistoryChangesPage.jsx
 * @description Page to display the audit trail/change history of a clinical record.
 */
const ClinicalHistoryChangesPage = () => {
  const { id } = useParams();
  const { changeHistory, loading } = useChangeHistory(id);

  return (
    <PermissionGuard module="clinical_history" action="read">
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to={`/admin/clinical-history/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Detalle
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Historial de Cambios del Registro</h1>
        <ChangeHistoryTimeline history={changeHistory} isLoading={loading} />
      </div>
    </PermissionGuard>
  );
};

export default ClinicalHistoryChangesPage;