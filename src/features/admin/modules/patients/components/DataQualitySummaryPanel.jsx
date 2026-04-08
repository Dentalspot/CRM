/**
 * @file DataQualitySummaryPanel.jsx
 * @description Panel lateral con resumen de calidad de datos de pacientes.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const QualityRow = ({ label, value, status }) => {
  const isOk = status === 'ok';
  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2">
        {isOk ? (
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
        )}
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-semibold text-sm tabular-nums">{value}</span>
    </div>
  );
};

const DataQualitySummaryPanel = ({ metrics = null, loading = false }) => {
  const total = metrics?.totalPatients || 0;
  const active = metrics?.activePatients || 0;
  const inactive = total - active;
  const completeness = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4 text-purple-500" />
          Calidad de Datos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <QualityRow
          label="Pacientes activos"
          value={active}
          status="ok"
        />
        <QualityRow
          label="Pacientes inactivos"
          value={inactive}
          status={inactive > active ? 'warning' : 'ok'}
        />
        <QualityRow
          label="Completitud datos"
          value={`${completeness}%`}
          status={completeness > 70 ? 'ok' : 'warning'}
        />
        <Button variant="outline" size="sm" className="w-full mt-2" asChild>
          <Link to="/admin/patients/quality">Panel de Calidad</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default DataQualitySummaryPanel;
