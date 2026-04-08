import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

/**
 * @file ClinicalHistoryCompliancePanel.jsx
 * @description A dashboard panel for managing and viewing overall clinical history compliance.
 */
const ClinicalHistoryCompliancePanel = () => {
  return (
    <PermissionGuard module="clinical_history" action="write">
      <Card>
        <CardHeader>
          <CardTitle>Panel de Cumplimiento</CardTitle>
          <CardDescription>Revisa el estado de cumplimiento normativo de los registros.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span>Registros Pendientes de Revisión</span>
            <span className="font-bold text-yellow-600">0</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span>Incidentes de Acceso</span>
            <span className="font-bold text-red-600">0</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline">Ver Pendientes</Button>
            <Button>Generar Reporte de Cumplimiento</Button>
          </div>
        </CardContent>
      </Card>
    </PermissionGuard>
  );
};

export default ClinicalHistoryCompliancePanel;