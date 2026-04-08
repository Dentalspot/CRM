import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield, CheckCircle2, AlertTriangle, Clock, Download,
  FileText, Eye, RefreshCw, Loader2, ArrowLeft
} from 'lucide-react';
import { useCompliance } from '../hooks/useCompliance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ClinicalHistoryCompliancePage = () => {
  const { stats, pendingRecords, loading, markAsReviewed, generateReport, refetch } = useCompliance();
  const [reviewing, setReviewing] = useState(null);

  const handleMarkReviewed = async (id) => {
    setReviewing(id);
    await markAsReviewed(id);
    setReviewing(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/admin/clinical-history"><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Link>
          </Button>
          <h1 className="text-2xl font-bold">Cumplimiento Normativo</h1>
          <p className="text-muted-foreground">Estado de cumplimiento y auditoría de registros clínicos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
          </Button>
          <Button size="sm" onClick={generateReport}>
            <Download className="h-4 w-4 mr-2" /> Generar Reporte
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{stats.totalRecords}</p>
            <p className="text-xs text-gray-500">Total Registros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats.reviewed}</p>
            <p className="text-xs text-gray-500">Revisados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold text-amber-600">{stats.pendingReview}</p>
            <p className="text-xs text-gray-500">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-5 w-5 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{stats.recentAccesses}</p>
            <p className="text-xs text-gray-500">Accesos (30d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-5 w-5 mx-auto mb-2 text-teal-500" />
            <p className="text-2xl font-bold text-teal-600">{stats.complianceRate}%</p>
            <p className="text-xs text-gray-500">Cumplimiento</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending records */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Registros Pendientes de Revisión ({stats.pendingReview})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRecords.length > 0 ? (
                <div className="space-y-2">
                  {pendingRecords.map(record => (
                    <div key={record.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {record.summary || record.title || 'Sin resumen'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.patients?.profiles?.full_name || 'Paciente'} — {record.therapist?.full_name || 'Dentista'}
                          {record.created_at && ` — ${format(new Date(record.created_at), 'd MMM yyyy', { locale: es })}`}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/clinical-history/${record.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleMarkReviewed(record.id)}
                          disabled={reviewing === record.id}
                        >
                          {reviewing === record.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Todos los registros están revisados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Normative framework */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-teal-500" />
                Marco Normativo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: 'Ley 19.628', desc: 'Protección de la vida privada' },
                { name: 'Ley 20.584', desc: 'Derechos de los pacientes' },
                { name: 'RGPD / GDPR', desc: 'Reglamento europeo de datos' },
                { name: 'Ag. Nac. Ciberseguridad', desc: 'Normativa ANCS Chile' },
              ].map(law => (
                <div key={law.name} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{law.name}</p>
                    <p className="text-xs text-gray-500">{law.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClinicalHistoryCompliancePage;
