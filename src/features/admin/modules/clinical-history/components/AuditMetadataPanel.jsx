import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

/**
 * @file AuditMetadataPanel.jsx
 * @description Displays key audit metadata for a clinical record.
 */
const AuditMetadataPanel = ({ record }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadatos de Auditoría</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between"><span>Creado por:</span> <span className="font-medium">{record?.therapist?.full_name || 'N/A'}</span></div>
        <div className="flex justify-between"><span>Fecha de creación:</span> <span className="font-medium">{record?.created_at ? new Date(record.created_at).toLocaleString() : 'N/A'}</span></div>
        <div className="flex justify-between"><span>Última modificación:</span> <span className="font-medium">{record?.updated_at ? new Date(record.updated_at).toLocaleString() : 'N/A'}</span></div>
        <div className="flex justify-between"><span>Total de accesos:</span> <span className="font-medium">0</span></div>
        <div className="flex justify-between"><span>Último acceso:</span> <span className="font-medium">Nunca</span></div>
      </CardContent>
    </Card>
  );
};

export default AuditMetadataPanel;