import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Brain, ClipboardList, Eye, ChevronRight,
  CheckCircle2, Circle, FileText, Plus, Printer
} from 'lucide-react';
import { generateTeaConsolidatedReport } from '../utils/reportGenerator';

const STEPS = [
  {
    key: 'adir',
    number: 1,
    label: 'ADI-R',
    description: 'Entrevista diagnóstica revisada para autismo',
    table: 'adir_evaluations',
    listPath: '/dashboard/therapist/adir',
    newPath: '/dashboard/therapist/adir/new',
    resultField: 'clasificacion',
    resultMap: {
      autism: { label: 'Autismo', color: 'destructive' },
      non_spectrum: { label: 'No espectro', color: 'outline' },
      inconclusive: { label: 'No concluyente', color: 'secondary' },
    },
  },
  {
    key: 'ados2',
    number: 2,
    label: 'ADOS-2',
    description: 'Escala de observación diagnóstica del autismo',
    table: 'ados2_evaluations',
    listPath: '/dashboard/therapist/ados2',
    newPath: '/dashboard/therapist/ados2/new',
    resultField: 'rango_preocupacion',
    resultMap: {
      autismo: { label: 'Autismo', color: 'destructive' },
      espectro_autista: { label: 'Espectro Autista', color: 'default' },
      no_tea: { label: 'No TEA', color: 'outline' },
      moderada_severa: { label: 'Moderada-Severa', color: 'destructive' },
      leve_moderada: { label: 'Leve-Moderada', color: 'default' },
      poco_ninguna: { label: 'Poco/Ninguna', color: 'outline' },
    },
  },
  {
    key: 'sensorial',
    number: 3,
    label: 'Perfil Sensorial',
    description: 'Evaluación de procesamiento sensorial (Dunn)',
    table: 'sensorial_evaluations',
    listPath: '/dashboard/therapist/sensorial',
    newPath: '/dashboard/therapist/sensorial/new',
    resultField: 'overall_classification',
    resultMap: {
      tipico: { label: 'Típico', color: 'outline' },
      leve: { label: 'Diferencia Leve', color: 'secondary' },
      moderado: { label: 'Diferencia Moderada', color: 'default' },
      significativo: { label: 'Significativo', color: 'destructive' },
    },
  },
];

const TeaDashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [loading, setLoading] = useState(true);
  const [evaluationsByStep, setEvaluationsByStep] = useState({});

  useEffect(() => {
    loadPatients();
  }, [user?.id]);

  useEffect(() => {
    if (selectedPatient) loadPatientEvaluations(selectedPatient);
  }, [selectedPatient]);

  const loadPatients = async () => {
    const { data } = await supabase
      .from('patients')
      .select('id, profile:profiles!patients_profile_id_fkey(full_name)')
      .eq('therapist_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    setPatients(data || []);
    setLoading(false);
  };

  const loadPatientEvaluations = async (patientId) => {
    setLoading(true);
    try {
      const results = {};
      for (const step of STEPS) {
        const { data } = await supabase
          .from(step.table)
          .select('id, status, created_at, ' + step.resultField)
          .eq('therapist_id', user.id)
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        results[step.key] = data;
      }
      setEvaluationsByStep(results);
    } catch (err) {
      logger.error('Error loading evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check overall TEA concordance
  const getOverallStatus = () => {
    const completed = STEPS.filter(s => evaluationsByStep[s.key]?.status === 'completada' || evaluationsByStep[s.key]?.status === 'revisada');
    if (completed.length === 0) return null;
    if (completed.length < 3) return { label: `${completed.length}/3 evaluaciones`, color: 'secondary' };

    // All 3 complete — check concordance
    const adirResult = evaluationsByStep.adir?.clasificacion;
    const adosResult = evaluationsByStep.ados2?.rango_preocupacion;

    const adirPositive = adirResult === 'autism';
    const adosPositive = ['autismo', 'espectro_autista', 'moderada_severa', 'leve_moderada'].includes(adosResult);

    if (adirPositive && adosPositive) return { label: 'Concordancia positiva TEA', color: 'destructive' };
    if (!adirPositive && !adosPositive) return { label: 'Concordancia negativa (sin TEA)', color: 'outline' };
    return { label: 'Resultados discordantes', color: 'default' };
  };

  const overallStatus = selectedPatient ? getOverallStatus() : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-purple-600" />
            Módulo TEA
          </h1>
          <p className="text-muted-foreground">Evaluación diagnóstica integral del Trastorno del Espectro Autista</p>
        </div>
      </div>

      {/* Patient Selector */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Label className="shrink-0 font-medium">Paciente:</Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Seleccionar paciente para evaluar" />
              </SelectTrigger>
              <SelectContent>
                {patients.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.profile?.full_name || 'Sin nombre'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {overallStatus && (
              <Badge variant={overallStatus.color} className="ml-auto">{overallStatus.label}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedPatient ? (
        <Card className="text-center py-16">
          <CardContent>
            <Brain className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Selecciona un paciente</h3>
            <p className="text-gray-500 mt-2">Elige un paciente para ver el progreso de las evaluaciones TEA</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* 3 Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((step) => {
              const evaluation = evaluationsByStep[step.key];
              const isComplete = evaluation?.status === 'completada' || evaluation?.status === 'revisada';
              const resultValue = evaluation?.[step.resultField];
              const resultCfg = resultValue ? step.resultMap[resultValue] : null;

              return (
                <Card key={step.key} className={`relative overflow-hidden ${isComplete ? 'border-green-200 bg-green-50/30' : ''}`}>
                  {/* Step number */}
                  <div className="absolute top-3 right-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isComplete ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isComplete ? <CheckCircle2 className="h-4 w-4" /> : step.number}
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{step.label}</CardTitle>
                    <CardDescription className="text-xs">{step.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {evaluation ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Badge variant={isComplete ? 'default' : 'outline'}>
                            {isComplete ? 'Completada' : 'Borrador'}
                          </Badge>
                          {resultCfg && <Badge variant={resultCfg.color}>{resultCfg.label}</Badge>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" asChild>
                            <Link to={`${step.listPath}/${evaluation.id}`}>
                              <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1" asChild>
                            <Link to={step.listPath}>
                              <ClipboardList className="h-3.5 w-3.5 mr-1" /> Historial
                            </Link>
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500">Sin evaluación registrada</p>
                        <Button size="sm" className="w-full" asChild>
                          <Link to={`${step.newPath}?patient=${selectedPatient}`}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Iniciar {step.label}
                          </Link>
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Concordance Summary (when all 3 complete) */}
          {overallStatus && STEPS.every(s => evaluationsByStep[s.key]?.status === 'completada' || evaluationsByStep[s.key]?.status === 'revisada') && (
            <Card className="border-purple-200 bg-purple-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Resumen Diagnóstico TEA
                </CardTitle>
                <CardDescription>Concordancia entre las 3 evaluaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {STEPS.map(step => {
                    const evaluation = evaluationsByStep[step.key];
                    const resultValue = evaluation?.[step.resultField];
                    const resultCfg = resultValue ? step.resultMap[resultValue] : null;
                    return (
                      <div key={step.key} className="text-center p-3 bg-white rounded-lg border">
                        <p className="text-sm font-semibold text-gray-700">{step.label}</p>
                        {resultCfg && <Badge variant={resultCfg.color} className="mt-2">{resultCfg.label}</Badge>}
                      </div>
                    );
                  })}
                </div>
                <div className="text-center space-y-3">
                  <Badge variant={overallStatus.color} className="text-base px-4 py-1.5">{overallStatus.label}</Badge>
                  <div>
                    <Button
                      onClick={() => {
                        const patientName = patients.find(p => p.id === selectedPatient)?.profile?.full_name || '';
                        generateTeaConsolidatedReport({
                          adirEval: evaluationsByStep.adir,
                          ados2Eval: evaluationsByStep.ados2,
                          sensorialEval: evaluationsByStep.sensorial,
                          patientName,
                          therapistName: user?.user_metadata?.full_name || '',
                        });
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Printer className="h-4 w-4 mr-2" /> Generar Informe Consolidado TEA
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

// Need Label import
import logger from '@/lib/utils/logger';
import { Label } from '@/components/ui/label';

export default TeaDashboardPage;
