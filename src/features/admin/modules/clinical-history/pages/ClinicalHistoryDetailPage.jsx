import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History, FileLock2, Download, Loader2, Calendar, User, Stethoscope, FileText } from 'lucide-react';
import { useClinicalRecord } from '../hooks/useClinicalRecord';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ClinicalHistoryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { record, loading, error } = useClinicalRecord(id);

  const handleExportPDF = () => {
    if (!record) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Registro Clínico - ${record.id}</title>
      <style>body{font-family:system-ui;padding:40px;max-width:800px;margin:auto}
      h1{font-size:20px;color:#333}h2{font-size:16px;color:#666;margin-top:24px}
      .meta{background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0}
      .meta p{margin:4px 0;font-size:14px}</style></head><body>
      <h1>Registro Clínico</h1>
      <div class="meta">
        <p><strong>Paciente:</strong> ${record.patient?.profiles?.full_name || 'N/A'}</p>
        <p><strong>Terapeuta:</strong> ${record.therapist?.full_name || 'N/A'}</p>
        <p><strong>Fecha:</strong> ${record.entry_date || record.event_date || record.created_at}</p>
        <p><strong>Tipo:</strong> ${record.event_type || record.entry_type || 'N/A'}</p>
      </div>
      <h2>Resumen</h2>
      <p>${record.summary || record.title || 'Sin resumen'}</p>
      <h2>Notas de Sesión</h2>
      <div>${record.session_notes || record.description || 'Sin notas'}</div>
      <h2>Observaciones</h2>
      <p>${record.observations || 'Sin observaciones'}</p>
      <hr><p style="font-size:12px;color:#999">Exportado desde DentalSpot — ${new Date().toLocaleString('es-CL')}</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Registro no encontrado</p>
        <Button variant="outline" onClick={() => navigate('/admin/clinical-history')} className="mt-4">
          Volver al listado
        </Button>
      </div>
    );
  }

  const patientName = record.patient?.profiles?.full_name || 'Paciente desconocido';
  const therapistName = record.therapist?.full_name || 'Terapeuta desconocido';
  const entryDate = record.entry_date || record.event_date || record.created_at;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/clinical-history')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al listado
        </Button>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/clinical-history/${id}/access-log`}>
              <FileLock2 className="mr-2 h-4 w-4" /> Historial de Accesos
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/clinical-history/${id}/changes`}>
              <History className="mr-2 h-4 w-4" /> Historial de Cambios
            </Link>
          </Button>
          <Button size="sm" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Registro Clínico</CardTitle>
                <Badge variant="outline" className="capitalize">
                  {record.event_type || record.entry_type || 'registro'}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> {patientName}
                </span>
                <span className="flex items-center gap-1">
                  <Stethoscope className="h-3.5 w-3.5" /> {therapistName}
                </span>
                {entryDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(entryDate), "d MMM yyyy, HH:mm", { locale: es })}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(record.summary || record.title) && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">Resumen</h3>
                  <p className="text-sm text-gray-600">{record.summary || record.title}</p>
                </div>
              )}

              {(record.session_notes || record.description) && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">Notas de Sesión</h3>
                  <div
                    className="text-sm text-gray-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: record.session_notes || record.description || '' }}
                  />
                </div>
              )}

              {record.observations && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">Observaciones</h3>
                  <p className="text-sm text-gray-600">{record.observations}</p>
                </div>
              )}

              {record.diagnosis && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">Diagnóstico</h3>
                  <p className="text-sm text-gray-600">{record.diagnosis}</p>
                </div>
              )}

              {record.treatment_plan && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">Plan de Tratamiento</h3>
                  <p className="text-sm text-gray-600">{record.treatment_plan}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar metadata */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Metadatos de Auditoría
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID Registro</span>
                <span className="font-mono text-xs text-gray-400">{record.id?.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Creado</span>
                <span>{record.created_at ? format(new Date(record.created_at), "dd/MM/yy HH:mm") : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Modificado</span>
                <span>{record.updated_at ? format(new Date(record.updated_at), "dd/MM/yy HH:mm") : 'N/A'}</span>
              </div>
              {record.patient_id && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Patient ID</span>
                  <span className="font-mono text-xs text-gray-400">{record.patient_id?.slice(0, 8)}...</span>
                </div>
              )}
              {record.therapist_id && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Therapist ID</span>
                  <span className="font-mono text-xs text-gray-400">{record.therapist_id?.slice(0, 8)}...</span>
                </div>
              )}
              {record.appointment_id && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Cita asociada</span>
                  <span className="font-mono text-xs text-gray-400">{record.appointment_id?.slice(0, 8)}...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClinicalHistoryDetailPage;
