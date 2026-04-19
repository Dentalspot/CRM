import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Lock, ClipboardCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { getPatientFile, getDocumentTemplates } from '@/lib/patientApi';
import { supabase } from '@/lib/supabaseClient';

import PatientSidebar from '@/features/patient-file/components/PatientSidebar';
import Odontogram from '@/features/odontogram/components/Odontogram';
import ConsentRequiredBanner from '@/components/shared/ConsentRequiredBanner';
import PatientDataTab from '@/features/patient-file/components/PatientDataTab';
import ClinicalHistoryTab from '@/features/patient-file/components/ClinicalHistoryTab';
import PlanningTab from '@/features/patient-file/components/PlanningTab';
import PaymentStatusTab from '@/features/patient-file/components/PaymentStatusTab';

// Import PIE Components
import logger from '@/lib/utils/logger';
import useClinicalAccessLogger from '@/lib/audit/useClinicalAccessLogger';
import { PieDataTab, PiePaciTab, PieSessionsTab, PieReportsTab } from '@/features/pie';

const PatientFilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isFreePlan } = useSubscription();

  const [patientData, setPatientData] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [treatmentTemplates, setTreatmentTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('datos');
  const [odontogramMode, setOdontogramMode] = useState('diagnostico');

  // Planning and payments are core features available to all paid plans
  const canAccessPlanning = !isFreePlan;
  const canAccessPayments = !isFreePlan;

  const isPie = FEATURE_FLAGS.PIE_ESCOLAR && patientData?.patient?.attention_type === 'pie_escolar';

  useEffect(() => {
    if (isPie) {
       // Reset tab logic for PIE mode
       if (!['datos_pie', 'paci', 'sesiones_pie', 'informes_pie'].includes(activeTab)) {
           setActiveTab('datos_pie');
       }
    } else {
        if (location.pathname.includes('/planning')) {
          if (canAccessPlanning) {
            setActiveTab('planificar');
          } else {
            navigate(`/dashboard/patients/${id}`, { replace: true });
          }
        } else {
          if (activeTab === 'planificar' && !location.pathname.includes('/planning')) {
            setActiveTab('datos');
          }
        }
    }
  }, [location.pathname, canAccessPlanning, id, navigate, isPie]);

  const fetchTreatmentTemplates = async (userId) => {
    if (!userId) return { data: [] };
    try {
      const { data: plans, error } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('is_template', true)
        .eq('therapist_id', userId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!plans?.length) return { data: [] };

      const planIds = plans.map(p => p.id);
      const { data: items, error: itemsError } = await supabase
        .from('marketplace_items')
        .select('id, plan_template_id, is_active, is_approved, slug, title')
        .in('plan_template_id', planIds);

      if (itemsError) {
        logger.warn("Could not fetch marketplace items for templates", itemsError);
        return { data: plans };
      }

      const plansWithItems = plans.map(plan => ({
        ...plan,
        marketplace_items: items?.filter(item => item.plan_template_id === plan.id) || []
      }));

      return { data: plansWithItems };
    } catch (err) {
      logger.error("Error fetching treatment templates:", err);
      return { data: [] };
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [fileData, templatesData, txTemplatesResponse] = await Promise.all([
        getPatientFile(id),
        user?.id ? getDocumentTemplates(user.id) : Promise.resolve([]),
        fetchTreatmentTemplates(user?.id)
      ]);

      setPatientData(fileData);
      setTemplates(templatesData);
      setTreatmentTemplates(txTemplatesResponse.data || []);

    } catch (error) {
      logger.error("Error loading patient file:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la ficha del paciente."
      });
    } finally {
      setLoading(false);
    }
  }, [id, user?.id, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useClinicalAccessLogger({
    patientId: patientData?.patient?.id || null,
    action: 'view_record',
    resourceType: 'clinical_record',
    resourceId: patientData?.patient?.id || null,
  });

  const handleRefresh = () => {
    loadData();
  };

  const handleTabChange = (value) => {
    if (!isPie) {
        if (value === 'planificar' && !canAccessPlanning) {
          toast({
            title: "Función bloqueada",
            description: "La planificación está disponible desde el plan Individual.",
            variant: "default"
          });
          return;
        }

        if (value === 'pagos' && !canAccessPayments) {
          toast({
            title: "Función bloqueada",
            description: "El seguimiento de pagos está disponible desde el plan Individual.",
            variant: "default"
          });
          return;
        }
    }

    setActiveTab(value);

    if (!isPie) {
        if (value === 'planificar') {
          navigate(`/dashboard/patients/${id}/planning`, { replace: true });
        } else {
          navigate(`/dashboard/patients/${id}`, { replace: true });
        }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600">Paciente no encontrado</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/patients')}>
          Volver a la lista
        </Button>
      </div>
    );
  }

  const { patient, appointments, goals, plans, clinicalHistory, evaluations, privateNotes, documents } = patientData;

  return (
    <>
      <Helmet>
        <title>{patient.full_name || 'Paciente'} | Ficha Clínica | DentalSpot</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/patients')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
             Ficha del Paciente {isPie && <span className="ml-2 text-sm font-normal bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200">🏫 PIE Escolar</span>}
          </h1>
        </div>

        <ConsentRequiredBanner
          patient={patient}
          therapistName={user?.full_name}
          onConsentSigned={() => window.location.reload()}
        />

        {patient?.allergies && patient.allergies.trim() && patient.allergies.trim().toLowerCase() !== 'no presenta alergias' && (
          <div className="flex items-start gap-3 p-4 bg-fuchsia-50 border-2 border-fuchsia-300 rounded-xl animate-in fade-in duration-500">
            <div className="p-2 bg-fuchsia-100 rounded-full shrink-0">
              <ShieldAlert className="h-5 w-5 text-fuchsia-600" />
            </div>
            <div>
              <p className="font-bold text-fuchsia-800 text-sm">Alergia Declarada</p>
              <p className="text-fuchsia-700 text-sm mt-0.5">{patient.allergies}</p>
            </div>
          </div>
        )}

        {patient?.clinical_alerts && patient.clinical_alerts.trim() && patient.clinical_alerts.trim().toLowerCase() !== 'no presenta alertas clínicas' && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-300 rounded-xl animate-in fade-in duration-500">
            <div className="p-2 bg-red-100 rounded-full shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-bold text-red-800 text-sm">Alerta Clínica</p>
              <p className="text-red-700 text-sm mt-0.5">{patient.clinical_alerts}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <PatientSidebar
              patient={patient}
              privateNotes={privateNotes}
              onUpdate={handleRefresh}
            />
          </div>

          <div className="lg:col-span-9">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              
              {isPie ? (
                // PIE TABS
                <>
                  <TabsList className="w-full justify-start bg-gray-100 p-1 rounded-lg mb-6">
                    <TabsTrigger value="datos_pie" className="flex-1 data-[state=active]:bg-teal-500 data-[state=active]:text-white rounded-md transition-all">
                      Datos PIE
                    </TabsTrigger>
                    <TabsTrigger value="paci" className="flex-1 data-[state=active]:bg-teal-500 data-[state=active]:text-white rounded-md transition-all">
                      PACI
                    </TabsTrigger>
                    <TabsTrigger value="sesiones_pie" className="flex-1 data-[state=active]:bg-teal-500 data-[state=active]:text-white rounded-md transition-all">
                      Sesiones
                    </TabsTrigger>
                    <TabsTrigger value="informes_pie" className="flex-1 data-[state=active]:bg-teal-500 data-[state=active]:text-white rounded-md transition-all">
                      Informes
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="datos_pie" className="mt-0">
                    <PieDataTab patientId={id} />
                  </TabsContent>

                  <TabsContent value="paci" className="mt-0">
                    <PiePaciTab patientId={id} />
                  </TabsContent>

                  <TabsContent value="sesiones_pie" className="mt-0">
                     <PieSessionsTab patientId={id} />
                  </TabsContent>
                  
                  <TabsContent value="informes_pie" className="mt-0">
                     <PieReportsTab patientId={id} patientName={patient?.full_name} />
                  </TabsContent>
                </>
              ) : (
                // STANDARD TABS
                <>
                  <div className="overflow-x-auto scrollbar-hide -mx-2 px-2 mb-6">
                    <TabsList className="inline-flex w-auto sm:w-full justify-start bg-gray-100 p-1 rounded-lg min-w-max sm:min-w-0">
                      <TabsTrigger value="datos" className="flex-none sm:flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-teal-500 data-[state=active]:text-white rounded-md transition-all whitespace-nowrap">
                        Datos
                        <span className="hidden sm:inline"> del Paciente</span>
                      </TabsTrigger>
                      <TabsTrigger value="historial" className="flex-none sm:flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-teal-500 data-[state=active]:text-white rounded-md transition-all whitespace-nowrap">
                        Historial
                        <span className="hidden sm:inline"> Clínico</span>
                      </TabsTrigger>
                      <TabsTrigger value="planificar" className="flex-none sm:flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-teal-500 data-[state=active]:text-white rounded-md transition-all gap-1 whitespace-nowrap" disabled={!canAccessPlanning}>
                        Planificar {!canAccessPlanning && <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-1" />}
                      </TabsTrigger>
                      <TabsTrigger value="pagos" className="flex-none sm:flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-teal-500 data-[state=active]:text-white rounded-md transition-all gap-1 whitespace-nowrap" disabled={!canAccessPayments}>
                        Pagos {!canAccessPayments && <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-1" />}
                      </TabsTrigger>
                      <TabsTrigger value="odontograma" className="flex-none sm:flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-teal-500 data-[state=active]:text-white rounded-md transition-all whitespace-nowrap">
                        Odontograma
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="datos" className="mt-0">
                    <PatientDataTab patient={patient} templates={templates} onSave={handleRefresh} />
                  </TabsContent>

                  <TabsContent value="historial" className="mt-0">
                    <ClinicalHistoryTab patientId={id} appointments={appointments} clinicalHistory={clinicalHistory} evaluations={evaluations} documents={documents} onRefresh={handleRefresh} />
                  </TabsContent>

                  <TabsContent value="planificar" className="mt-0">
                    <PlanningTab patientId={id} goals={goals} plans={plans} templates={treatmentTemplates} onRefresh={handleRefresh} />
                  </TabsContent>

                  <TabsContent value="pagos" className="mt-0">
                    <PaymentStatusTab patient={id} appointments={appointments} />
                  </TabsContent>

                  <TabsContent value="odontograma" className="mt-0">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOdontogramMode('diagnostico')}
                          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                            odontogramMode === 'diagnostico'
                              ? 'bg-teal-500 text-white'
                              : 'bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Diagnóstico Inicial
                        </button>
                        <button
                          type="button"
                          onClick={() => setOdontogramMode('tratamiento')}
                          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                            odontogramMode === 'tratamiento'
                              ? 'bg-teal-500 text-white'
                              : 'bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Tratamiento
                        </button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/therapist/odontograma/nueva?patient=${id}`)}
                        className="text-pink-600 border-pink-200 hover:bg-pink-50"
                      >
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Nueva Evaluación
                      </Button>
                    </div>
                    <Odontogram key={odontogramMode} patientId={id} odontogramType={odontogramMode} />
                  </TabsContent>
                </>
              )}
              
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientFilePage;