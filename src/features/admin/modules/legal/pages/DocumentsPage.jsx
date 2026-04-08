import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import DocumentsTable from '../components/DocumentsTable';
import LegalFilters from '../components/LegalFilters';
import { useLegalDocuments } from '../hooks/useLegalDocuments';

const DocumentsPage = () => {
  const { documents } = useLegalDocuments({});

  return (
    <PermissionGuard module="legal" action="read">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Documentos Legales</h1>
        <LegalFilters />
        <DocumentsTable documents={documents} />
      </div>
    </PermissionGuard>
  );
};

export default DocumentsPage;