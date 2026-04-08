import React, { useState, useEffect } from 'react';
import { useReportGeneration } from '@/hooks/useReportGeneration';
import ReportGenerationModal from '../components/ReportGenerationModal';
import DynamicReportForm from '../components/DynamicReportForm';
import ReportPreview from '../components/ReportPreview';
import ReportActions from '../components/ReportActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, FileText, Calendar, Search } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import logger from '@/lib/utils/logger';
import { Skeleton } from '@/components/ui/skeleton';

const ReportsPage = () => {
  const { user } = useAuth();
  const reportHook = useReportGeneration();
  const { step, setStep, resetFlow } = reportHook;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [existingReports, setExistingReports] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch existing reports
  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('clinical_reports')
          .select(`
            id,
            report_type,
            status,
            created_at,
            patient:patient_id (
              profile:profile_id (full_name)
            )
          `)
          .eq('therapist_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform data slightly to flatten structure
        const formatted = data.map(r => ({
          ...r,
          patientName: r.patient?.profile?.full_name || 'Desconocido'
        }));
        
        setExistingReports(formatted);
      } catch (err) {
        logger.error('Error fetching reports list:', err);
      } finally {
        setIsLoadingList(false);
      }
    };

    fetchReports();
  }, [user, step]); // Refetch when returning to list (step 1) or changing users

  const openGenerationModal = () => {
    resetFlow(); // Reset hook state
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Note: if modal completes successfully (step 2), it stays open logically but modal UI closes 
    // and we render the form in the main view.
    if (step === 1) resetFlow();
  };

  const filteredReports = existingReports.filter(report => 
    report.report_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Views Switching ---

  // 1. List View (Default)
  if (step === 1 && !isModalOpen) {
    return (
      <div className="container mx-auto p-6 max-w-7xl space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mis Informes Clínicos</h1>
            <p className="text-muted-foreground mt-1">Gestiona, crea y comparte informes de tus pacientes.</p>
          </div>
          <Button onClick={openGenerationModal} className="bg-primary shadow-lg hover:shadow-xl transition-all">
            <PlusCircle className="mr-2 h-5 w-5" /> Nuevo Informe
          </Button>
        </div>

        <ReportGenerationModal 
          isOpen={isModalOpen} 
          onClose={handleModalClose}
          hookData={reportHook}
        />

        <div className="grid gap-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por paciente o tipo..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Reports List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Historial Reciente</CardTitle>
              <CardDescription>Últimos informes generados en la plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingList ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium">No hay informes aún</h3>
                  <p className="text-muted-foreground mb-4">Comienza creando tu primer informe clínico.</p>
                  <Button variant="outline" onClick={openGenerationModal}>Crear Informe</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-full mt-1">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{report.report_type}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>{report.patientName}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={report.status === 'validated' ? 'default' : 'secondary'} className="capitalize">
                          {report.status === 'validated' ? 'Completado' : report.status}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => {/* Navigate to detail view (Step 9) */}}>
                          Ver Detalle
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 2. Form View
  if (step === 2) {
    return (
      <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
        <DynamicReportForm hookData={reportHook} onCancel={() => setStep(1)} />
      </div>
    );
  }

  // 3. Preview View
  if (step === 3) {
    return (
      <div className="container mx-auto bg-gray-100 min-h-screen pb-24">
        <ReportPreview reportData={reportHook.generatedReport} />
        <ReportActions hookData={reportHook} onBack={() => setStep(2)} />
      </div>
    );
  }

  return null;
};

export default ReportsPage;