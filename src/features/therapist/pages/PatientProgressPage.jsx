import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Sparkles, FileBarChart, History } from 'lucide-react';
import { analyzeProgress, saveProgressReport, getProgressReports, shareReport } from '@/features/progress/api/progressAnalysisApi';
import ProgressReportPage from '@/features/progress/pages/ProgressReportPage';
import { format } from 'date-fns';
import logger from '@/lib/utils/logger';
import { es } from 'date-fns/locale';

const PatientProgressPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [reportType, setReportType] = useState('monthly');

  useEffect(() => {
    loadPatients();
  }, [user]);

  useEffect(() => {
    if (selectedPatientId) {
      loadReports(selectedPatientId);
    }
  }, [selectedPatientId]);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id,
          profile_id,
          profile:profiles!patients_profile_id_fkey(full_name)
        `)
        .eq('status', 'active');
        // RLS filtra por care_team + org membership

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      logger.error('Error loading patients:', error);
    }
  };

  const loadReports = async (patientId) => {
    setLoading(true);
    try {
      // Find the patient object to get profile_id
      const patient = patients.find(p => p.id === patientId);
      if (!patient?.profile_id) {
        setReports([]);
        return;
      }

      const data = await getProgressReports(patient.profile_id);
      setReports(data || []);
      if (data && data.length > 0) {
        setCurrentReport(data[0]);
      } else {
        setCurrentReport(null);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error cargando reportes' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedPatientId) return;
    
    const selectedPatient = patients.find(p => p.id === selectedPatientId);
    if (!selectedPatient?.profile_id) {
      toast({ 
        variant: 'destructive', 
        title: 'Error de datos', 
        description: 'El paciente seleccionado no tiene un perfil de usuario válido asociado.' 
      });
      return;
    }

    setGenerating(true);
    try {
      const analysis = await analyzeProgress(selectedPatientId, reportType);
      
      const reportData = {
        patient_id: selectedPatient.profile_id, // Use profile_id
        therapist_id: user.id,
        report_type: reportType,
        analysis_data: analysis,
        shared_with_patient: false
      };

      const savedReport = await saveProgressReport(reportData);
      
      setReports([savedReport, ...reports]);
      setCurrentReport(savedReport);
      toast({ title: '✨ Reporte generado exitosamente' });

    } catch (error) {
      logger.error(error);
      toast({ 
        variant: 'destructive', 
        title: 'Error al generar', 
        description: error.message || 'Verifica que el paciente tenga registros de actividad recientes.' 
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!currentReport) return;
    try {
      await shareReport(currentReport.id, !currentReport.shared_with_patient);
      
      // Update local state
      const updated = { ...currentReport, shared_with_patient: !currentReport.shared_with_patient };
      setCurrentReport(updated);
      setReports(reports.map(r => r.id === updated.id ? updated : r));
      
      toast({ 
        title: updated.shared_with_patient ? 'Reporte compartido' : 'Reporte ocultado',
        description: updated.shared_with_patient ? 'El paciente ahora puede ver este reporte.' : 'El paciente ya no puede ver este reporte.'
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al compartir' });
    }
  };

  const selectedPatientName = patients.find(p => p.id === selectedPatientId)?.profile?.full_name || 'Paciente';

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileBarChart className="h-8 w-8 text-teal-600" />
            Análisis de Progreso
          </h1>
          <p className="text-muted-foreground">Genera reportes de evolución clínica impulsados por IA.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Seleccionar Paciente</label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Buscar paciente..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.profile?.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Reporte</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Progreso Mensual</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="comprehensive">Evolución Completa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleGenerateReport} 
              disabled={!selectedPatientId || generating}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generar Análisis IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedPatientId && (
        <Tabs defaultValue="report" className="w-full">
          <TabsList className="bg-white border w-full justify-start p-0 h-12">
            <TabsTrigger value="report" className="h-full px-6 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none">
              Reporte Actual
            </TabsTrigger>
            <TabsTrigger value="history" className="h-full px-6 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none">
              <History className="h-4 w-4 mr-2" />
              Historial ({reports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report" className="pt-6">
            {currentReport ? (
              <ProgressReportPage 
                report={currentReport} 
                patientName={selectedPatientName}
                onShare={handleShare}
              />
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <FileBarChart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">Sin reporte seleccionado</h3>
                <p className="text-gray-500">Genera un nuevo reporte o selecciona uno del historial.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <Card 
                  key={report.id} 
                  className="cursor-pointer hover:border-teal-300 transition-all hover:shadow-md"
                  onClick={() => {
                    setCurrentReport(report);
                    document.querySelector('[value="report"]')?.click();
                  }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex justify-between">
                      {format(new Date(report.generated_at), 'PPP', { locale: es })}
                      {report.shared_with_patient && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Compartido</span>
                      )}
                    </CardTitle>
                    <CardDescription className="capitalize">{report.report_type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 line-clamp-3">
                      {report.analysis_data?.executive_summary}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default PatientProgressPage;