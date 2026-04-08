import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent
} from '@/components/ui/dialog';
import {
  Plus,
  FileText,
  Users,
  RefreshCw,
  Activity,
  BarChart2,
  Wand2,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientActivityLogs } from '@/features/progress/api/progressAnalysisApi';
import { useReportGeneration } from '@/hooks/useReportGeneration';

// Passport timeline components (shared with patient view)
import useClinicalTimeline from '@/features/clinical-passport/hooks/useClinicalTimeline';
import ClinicalTimeline from '@/features/clinical-passport/components/ClinicalTimeline';

import ClinicalEntryModal from './ClinicalEntryModal';
import ViewClinicalEntryModal from './ViewClinicalEntryModal';
import ActivityLogModal from './ActivityLogModal';
import ReportGenerationModal from '@/features/reports/components/ReportGenerationModal';
import DynamicReportForm from '@/features/reports/components/DynamicReportForm';
import ReportPreview from '@/features/reports/components/ReportPreview';
import ReportActions from '@/features/reports/components/ReportActions';
import logger from '@/lib/utils/logger';

const ClinicalHistoryTab = ({ patientId, patientName }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Report Hook Integration
  const reportHook = useReportGeneration();
  const { step, setStep, resetFlow } = reportHook;

  // State
  const [activityLogs, setActivityLogs] = useState([]);
  const [externalStats, setExternalStats] = useState({ total: 0, therapists: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isActivityLogModalOpen, setIsActivityLogModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);

  // Passport timeline hook — therapist only sees their own events
  const {
    loading: timelineLoading,
    grouped,
    stats: timelineStats,
    events,
    filter,
    setFilter,
    refresh: refreshTimeline,
  } = useClinicalTimeline({
    patientId,
    therapistId: user?.id,
  });

  // Load supplementary data
  useEffect(() => {
    if (patientId) {
      loadSupplementaryData();
    }
  }, [patientId]);

  const loadSupplementaryData = async () => {
    setLoading(true);
    await Promise.all([
      loadExternalStats(),
      loadActivityLogs(),
    ]);
    setLoading(false);
  };

  const loadExternalStats = async () => {
    try {
      const { data, error } = await supabase.rpc(
        'get_patient_external_sessions_count',
        { p_patient_id: patientId }
      );

      if (!error && data && data[0]) {
        setExternalStats({
          total: data[0].total_external || 0,
          therapists: data[0].external_therapists || []
        });
      }
    } catch (error) {
      logger.error('Error loading external stats:', error);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const logs = await getPatientActivityLogs(patientId);
      setActivityLogs(logs || []);
    } catch (error) {
      logger.error('Error loading activity logs:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshTimeline(),
      loadSupplementaryData(),
    ]);
    setRefreshing(false);
  };

  // Handlers
  const handleCreateEntry = () => {
    setEditingEntry(null);
    setIsCreateModalOpen(true);
  };

  const handleLogActivity = () => {
    setIsActivityLogModalOpen(true);
  };

  const handleOpenReportModal = () => {
    resetFlow();
    setIsReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    if (step > 1) {
      refreshTimeline();
    }
    resetFlow();
  };

  const handleViewEntry = (entry) => {
    setSelectedEntry(entry?.raw || entry);
    setIsViewModalOpen(true);
  };

  const handleEditEntry = (entry) => {
    if (entry.is_external) {
      toast({
        variant: 'destructive',
        title: 'No permitido',
        description: 'No puedes editar registros de otros profesionales.'
      });
      return;
    }
    setEditingEntry(entry);
    setIsCreateModalOpen(true);
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      const { error } = await supabase
        .from('clinical_history')
        .delete()
        .eq('id', entryId)
        .eq('therapist_id', user.id);

      if (error) throw error;

      toast({ title: '✅ Registro eliminado' });
      refreshTimeline();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el registro.'
      });
    }
  };

  const handleEntrySuccess = () => {
    setIsCreateModalOpen(false);
    setEditingEntry(null);
    handleRefresh();
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: events.length,
      logs: activityLogs.length,
      external: externalStats.total,
    };
  }, [events, activityLogs, externalStats]);

  if (loading && timelineLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Historial Clínico</h2>
          <p className="text-sm text-gray-500">
            Registro cronológico de atenciones y evolución del paciente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            onClick={handleLogActivity}
            className="text-teal-700 border-teal-200 hover:bg-teal-50"
          >
            <Activity className="h-4 w-4 mr-2" />
            Registrar Actividad
          </Button>
          <Button onClick={handleCreateEntry} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Registro
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Registros</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-teal-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Actividades</p>
                <p className="text-2xl font-bold text-gray-900">{stats.logs}</p>
              </div>
              <BarChart2 className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Report Widget */}
        <Card
          className="border-l-4 border-l-indigo-500 cursor-pointer hover:bg-indigo-50/50 transition-colors shadow-sm"
          onClick={handleOpenReportModal}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Informes Clínicos</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center">
                    <Plus className="h-3 w-3 mr-1" />
                    Generar
                  </span>
                </div>
              </div>
              <Wand2 className="h-8 w-8 text-indigo-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${stats.external > 0 ? 'border-l-amber-500' : 'border-l-gray-300'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Atenciones Externas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.external}</p>
              </div>
              <Users className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* External Therapists Info */}
      {externalStats.total > 0 && externalStats.therapists.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">
                  Este paciente ha sido atendido por otros profesionales
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  {externalStats.therapists.map((t, i) => (
                    <span key={t.therapist_id}>
                      {t.therapist_name} ({t.session_count} sesiones)
                      {i < externalStats.therapists.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Passport Timeline (same as patient view) */}
      <ClinicalTimeline
        grouped={grouped}
        loading={timelineLoading}
        filter={filter}
        setFilter={setFilter}
        totalEvents={events.length}
        onEventClick={handleViewEntry}
      />

      {/* --- MODALS --- */}

      {/* Report Generation: Step 1 (Selection) */}
      <ReportGenerationModal
        isOpen={isReportModalOpen}
        onClose={handleCloseReportModal}
        hookData={reportHook}
        fixedPatientId={patientId}
      />

      {/* Report Generation: Step 2 (Form) */}
      <Dialog open={step === 2} onOpenChange={(open) => !open && setStep(1)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <DynamicReportForm
              hookData={reportHook}
              onCancel={() => setStep(1)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Generation: Step 3 (Preview) */}
      <Dialog open={step === 3} onOpenChange={(open) => !open && setStep(2)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-gray-50">
          <div className="flex-1 overflow-y-auto pb-20">
            <ReportPreview reportData={reportHook.generatedReport} />
          </div>
          <ReportActions
            hookData={reportHook}
            onBack={() => setStep(2)}
            isModal={true}
          />
        </DialogContent>
      </Dialog>

      {/* Create/Edit Entry Modal */}
      <ClinicalEntryModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingEntry(null);
        }}
        patientId={patientId}
        patientName={patientName}
        entry={editingEntry}
        onSave={handleEntrySuccess}
      />

      {/* Manual Activity Log Modal */}
      <ActivityLogModal
        isOpen={isActivityLogModalOpen}
        onClose={() => setIsActivityLogModalOpen(false)}
        patientId={patientId}
        therapistId={user?.id}
        onSuccess={loadActivityLogs}
      />

      {/* View Modal */}
      <ViewClinicalEntryModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedEntry(null);
        }}
        entry={selectedEntry}
        onEdit={handleEditEntry}
        onDelete={handleDeleteEntry}
        isExternal={selectedEntry?.is_external}
        patientId={patientId}
        therapistId={user?.id}
      />
    </div>
  );
};

export default ClinicalHistoryTab;
