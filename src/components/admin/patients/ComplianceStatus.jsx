import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, XCircle, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const ComplianceStatus = ({ stats }) => {
  const total = (stats?.compliant || 0) + (stats?.warning || 0) + (stats?.nonCompliant || 0);
  const compliantPercent = total > 0 ? ((stats?.compliant || 0) / total) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Cumplimiento Normativo (Ley de Datos)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Nivel de cumplimiento global</span>
            <span className="font-bold">{Math.round(compliantPercent)}%</span>
          </div>
          <Progress value={compliantPercent} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <span className="block font-bold text-green-700">{stats?.compliant || 0}</span>
            <span className="text-green-600">Cumplen</span>
          </div>
          <div className="p-2 bg-yellow-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
            <span className="block font-bold text-yellow-700">{stats?.warning || 0}</span>
            <span className="text-yellow-600">Alerta</span>
          </div>
          <div className="p-2 bg-red-50 rounded-lg">
            <XCircle className="w-5 h-5 mx-auto mb-1 text-red-600" />
            <span className="block font-bold text-red-700">{stats?.nonCompliant || 0}</span>
            <span className="text-red-600">Crítico</span>
          </div>
        </div>
        
        {stats?.deletionRequests > 0 && (
          <div className="mt-4 p-2 border border-red-200 bg-red-50 rounded text-xs text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{stats.deletionRequests} solicitud(es) de eliminación de datos pendientes.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComplianceStatus;