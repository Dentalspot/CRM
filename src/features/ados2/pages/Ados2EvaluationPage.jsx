
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, ChevronRight, CheckCircle2, ClipboardList, Printer, ArrowLeft, Loader2, Save, FileCheck, Eye, RefreshCw, Pencil, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabaseClient';
import * as ados2Api from '@/features/ados2/api/ados2Api';
import { ADOS2_MODULES, SCORE_OPTIONS, RANGO_CONFIG, RANGO_CONFIG_T, DOMAIN_LABELS } from '@/features/ados2/constants/ados2Items';
import { getScoreDescription } from '@/features/ados2/constants/ados2ScoreDescriptions';
import { generateAdos2Report } from '@/features/tea/utils/reportGenerator';

const ADOS2_BASE_PATH = '/dashboard/therapist/ados2';

const STEPS = [
  { id: 1, label: 'Configuración', icon: ClipboardList },
  { id: 2, label: 'Puntuación', icon: Brain },
  { id: 3, label: 'Resultados', icon: CheckCircle2 },
];

export default function Ados2EvaluationPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(id ? 2 : 1);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [therapistData, setTherapistData] = useState({});

  // Step 1 state
  const [patients, setPatients] = useState([]);
  const [setup, setSetup] = useState({
    patient_id: searchParams.get('patient') || '',
    module: '',
    algorithm: '',
    fecha_evaluacion: new Date().toISOString().split('T')[0],
    examinador: '',
    informacion_adicional: '',
  });

  // Step 2 state
  const [evaluationId, setEvaluationId] = useState(id || null);
  const [evaluation, setEvaluation] = useState(null);
  const [scores, setScores] = useState({}); // { 'A-2': 0, 'B-1': 1, ... }

  // Step 3 state
  const [results, setResults] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [reportSaved, setReportSaved] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [editingDescription, setEditingDescription] = useState(null); // item_code being edited
  const [customDescriptions, setCustomDescriptions] = useState({}); // { item_code: "custom text" }
  const [expandedSections, setExpandedSections] = useState({ table: true, descriptions: true });
  const [showFichaDialog, setShowFichaDialog] = useState(false);
  const [fichaDate, setFichaDate] = useState('');
  const [patientAppointments, setPatientAppointments] = useState([]);

  // Load patients for step 1
  useEffect(() => {
    if (!id) loadPatients();
  }, []);

  // Load existing evaluation
  useEffect(() => {
    if (id) loadEvaluation(id);
  }, [id]);

  // Set examinador default & load therapist profile for report
  useEffect(() => {
    if (user?.full_name || user?.user_metadata?.full_name) {
      setSetup(prev => ({
        ...prev,
        examinador: prev.examinador || user.full_name || user.user_metadata?.full_name || ''
      }));
    }
    if (user?.id) {
      (async () => {
        const [profileRes, brandingRes, detailsRes] = await Promise.all([
          supabase.from('profiles').select('full_name, phone, rut').eq('id', user.id).maybeSingle(),
          supabase.from('therapist_branding').select('avatar_url').eq('therapist_id', user.id).maybeSingle(),
          supabase.from('therapist_details').select('professional_title, headline, registro_supersalud, registro_secreduc, address').eq('profile_id', user.id).maybeSingle(),
        ]);
        setTherapistData({
          full_name: profileRes.data?.full_name || user.user_metadata?.full_name || '',
          phone: profileRes.data?.phone || '',
          avatar_url: brandingRes.data?.avatar_url || '',
          professional_title: detailsRes.data?.professional_title || '',
          headline: detailsRes.data?.headline || '',
          registro_supersalud: detailsRes.data?.registro_supersalud || '',
          registro_secreduc: detailsRes.data?.registro_secreduc || '',
          address: detailsRes.data?.address || '',
        });
      })();
    }
  }, [user]);

  const loadPatients = async () => {
    // Verificado contra estructura Supabase: perfiles tiene full_name y birthdate.
    const { data, error } = await supabase
      .from('patients')
      .select('id, profile:profiles!patients_profile_id_fkey(full_name)')
      .eq('therapist_id', user.id)
      .eq('status', 'active');

    if (error) {
      toast({ variant: 'destructive', title: 'Error cargando pacientes', description: error.message });
      return;
    }

    const formattedPatients = (data || []).map(p => ({
      id: p.id,
      full_name: p.profile?.full_name || 'Sin nombre'
    })).sort((a, b) => a.full_name.localeCompare(b.full_name));

    setPatients(formattedPatients);
  };

  const loadEvaluation = async (evalId) => {
    setLoading(true);
    try {
      const data = await ados2Api.fetchEvaluationById(evalId);
      setEvaluation(data);
      setObservaciones(data.observaciones || '');

      // Restore scores from saved responses
      const savedScores = {};
      (data.responses || []).forEach(r => {
        savedScores[r.item_code] = r.raw_score;
      });
      setScores(savedScores);

      // If already completed/revisada, go to results
      if (data.status === 'completada' || data.status === 'revisada') {
        setResults({
          total_as: data.total_as,
          total_crr: data.total_crr,
          total_com: data.total_com,
          total_global: data.total_global,
          rango: data.rango_preocupacion,
        });
        setStep(3);
        // Check if report already saved to ficha
        const savedReport = await ados2Api.checkReportSaved(evalId, data.patient_id);
        if (savedReport) setReportSaved(true);
      } else {
        setStep(2);
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al cargar evaluación', description: e.message });
      navigate(ADOS2_BASE_PATH);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEvaluation = async () => {
    if (!setup.patient_id || !setup.module) {
      toast({ variant: 'destructive', title: 'Completa paciente y módulo' });
      return;
    }
    const moduleData = ADOS2_MODULES[setup.module];
    if (moduleData.algorithms.length > 0 && !setup.algorithm) {
      toast({ variant: 'destructive', title: 'Selecciona el algoritmo correspondiente' });
      return;
    }

    setSaving(true);
    try {
      const newEval = await ados2Api.createEvaluation({
        therapist_id: user.id,
        patient_id: setup.patient_id,
        module: setup.module,
        algorithm: setup.algorithm || null,
        fecha_evaluacion: setup.fecha_evaluacion,
        examinador: setup.examinador,
        informacion_adicional: setup.informacion_adicional,
        status: 'borrador',
      });
      setEvaluationId(newEval.id);
      setEvaluation(newEval);
      setStep(2);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al crear evaluación', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const buildResponsesArray = () => {
    const mod = evaluation?.module || setup.module;
    const moduleData = ADOS2_MODULES[mod];
    if (!moduleData) return [];

    const responses = [];
    Object.entries(moduleData.items).forEach(([domain, items]) => {
      items.forEach(item => {
        const score = scores[item.code];
        if (score !== undefined && score !== null) {
          responses.push({ ...item, domain, score });
        }
      });
    });
    return responses;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await ados2Api.saveItemResponses(evaluationId, buildResponsesArray());
      toast({ title: '✅ Borrador guardado' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCalculate = async () => {
    const responses = buildResponsesArray();
    const mod = evaluation?.module || setup.module;
    const moduleData = ADOS2_MODULES[mod];
    const allItems = Object.values(moduleData.items).flat();
    const missing = allItems.filter(item => scores[item.code] === undefined);

    if (missing.length > 0) {
      if (!confirm(`Hay ${missing.length} ítems sin puntuar. ¿Continuar de todas formas?`)) return;
    }

    setSaving(true);
    try {
      await ados2Api.saveItemResponses(evaluationId, responses);
      const calcResult = await ados2Api.calculateScores(evaluationId);
      await ados2Api.updateEvaluationStatus(evaluationId, 'completada');
      setResults(calcResult);
      setStep(3);
      toast({ title: '✅ Evaluación calculada' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al calcular', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkRevisada = async () => {
    setSaving(true);
    try {
      await ados2Api.updateEvaluationStatus(evaluationId, 'revisada', observaciones);
      toast({ title: '✅ Evaluación marcada como revisada' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const getCurrentModule = () => {
    const mod = evaluation?.module || setup.module;
    return mod ? ADOS2_MODULES[mod] : null;
  };

  const getDomainTotal = (domain) => {
    const moduleData = getCurrentModule();
    if (!moduleData?.items[domain]) return 0;
    return moduleData.items[domain].reduce((sum, item) => {
      const s = scores[item.code];
      if (s === undefined || s === null) return sum;
      if ([7, 8, 9].includes(s)) return sum;
      return sum + (s === 3 ? 2 : s);
    }, 0);
  };

  const handleOpenFichaDialog = async () => {
    // Pre-fill with evaluation date
    setFichaDate(evaluation?.fecha_evaluacion || new Date().toISOString().split('T')[0]);
    // Load patient appointments to suggest dates
    try {
      const { data } = await supabase
        .from('appointments')
        .select('id, date, status, services:therapist_services!appointments_service_id_fkey(service_name)')
        .eq('patient_id', evaluation.patient_id)
        .eq('therapist_id', user.id)
        .order('date', { ascending: false })
        .limit(20);
      setPatientAppointments(data || []);
    } catch (e) {
      setPatientAppointments([]);
    }
    setShowFichaDialog(true);
  };

  const handleSaveToFicha = async () => {
    setShowFichaDialog(false);
    setSavingReport(true);
    try {
      const result = await ados2Api.saveReportToFicha({
        evaluationId: evaluationId || id,
        patientId: evaluation.patient_id,
        therapistId: user.id,
        evaluation,
        results,
        entryDate: fichaDate || evaluation?.fecha_evaluacion,
      });
      setReportSaved(true);
      toast({
        title: result.updated ? '✅ Informe actualizado en ficha clínica' : '✅ Informe guardado en ficha clínica',
        description: 'El informe ADOS-2 quedó registrado en la historia clínica del paciente.',
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al guardar en ficha', description: e.message });
    } finally {
      setSavingReport(false);
    }
  };

  // Helper: obtener config de rango según módulo
  const getRangoConfig = (rango, mod) => {
    if (!rango) return null;
    if (mod === 'T') return RANGO_CONFIG_T[rango] || null;
    return RANGO_CONFIG[rango] || null;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 print:hidden">
        <button onClick={() => navigate(ADOS2_BASE_PATH)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Brain className="h-6 w-6 text-teal-600" />
        <h1 className="text-xl font-bold text-gray-900">
          {id ? `Evaluación ADOS-2 — Módulo ${evaluation?.module}` : 'Nueva Evaluación ADOS-2'}
        </h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 print:hidden">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${step === s.id
                ? 'bg-teal-600 text-white'
                : step > s.id
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-gray-100 text-gray-400'
              }`}>
              <s.icon className="h-4 w-4" />
              {s.label}
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300" />}
          </React.Fragment>
        ))}
      </div>

      {/* ======================== STEP 1 ======================== */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuración de la evaluación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Paciente */}
            <div className="space-y-1.5">
              <Label>Paciente *</Label>
              <Select value={setup.patient_id} onValueChange={v => setSetup(p => ({ ...p, patient_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Módulo */}
            <div className="space-y-2">
              <Label>Módulo *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(ADOS2_MODULES).map(([key, mod]) => (
                  <button
                    key={key}
                    onClick={() => setSetup(p => ({ ...p, module: key, algorithm: '' }))}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${setup.module === key
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-teal-300'
                      }`}
                  >
                    <div className="font-bold text-sm text-gray-900">{mod.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{mod.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Algoritmo (solo si aplica) */}
            {setup.module && ADOS2_MODULES[setup.module]?.algorithms.length > 0 && (
              <div className="space-y-1.5">
                <Label>Algoritmo *</Label>
                <div className="flex gap-3 flex-wrap">
                  {ADOS2_MODULES[setup.module].algorithms.map(alg => (
                    <button
                      key={alg.value}
                      onClick={() => setSetup(p => ({ ...p, algorithm: alg.value }))}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${setup.algorithm === alg.value
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-gray-200 hover:border-teal-300'
                        }`}
                    >
                      {alg.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Fecha de evaluación</Label>
                <Input
                  type="date"
                  value={setup.fecha_evaluacion}
                  onChange={e => setSetup(p => ({ ...p, fecha_evaluacion: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Examinador</Label>
                <Input
                  value={setup.examinador}
                  onChange={e => setSetup(p => ({ ...p, examinador: e.target.value }))}
                  placeholder="Nombre del evaluador"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Información adicional</Label>
              <Textarea
                value={setup.informacion_adicional}
                onChange={e => setSetup(p => ({ ...p, informacion_adicional: e.target.value }))}
                placeholder="Observaciones previas, motivo de consulta..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleStartEvaluation}
              disabled={saving}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              Iniciar Evaluación
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ======================== STEP 2 ======================== */}
      {step === 2 && evaluation && (() => {
        const moduleData = ADOS2_MODULES[evaluation.module];
        if (!moduleData) return null;

        return (
          <div className="space-y-6">
            {/* Info paciente */}
            {evaluation.patient && (
              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="py-3 px-4">
                  <p className="text-sm text-slate-700">
                    <strong>Paciente:</strong> {evaluation.patient.full_name}
                    {evaluation.patient.birthdate && (
                      <span className="ml-3 text-slate-500">Nac: {evaluation.patient.birthdate}</span>
                    )}
                    {evaluation.algorithm && (
                      <span className="ml-3">
                        <Badge variant="outline" className="text-xs">{
                          moduleData.algorithms.find(a => a.value === evaluation.algorithm)?.label || evaluation.algorithm
                        }</Badge>
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Leyenda */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="py-3 px-4">
                <p className="text-xs text-amber-800">
                  <strong>Conversión algoritmo:</strong> 0→0 · 1→1 · 2→2 · 3→2 · 7/8/9→0 (no cuentan para el total)
                </p>
              </CardContent>
            </Card>

            {/* Dominios */}
            {Object.entries(moduleData.items).map(([domain, items]) => (
              <Card key={domain}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                      {DOMAIN_LABELS[domain] || domain}
                    </CardTitle>
                    <Badge variant="outline" className="text-teal-700 border-teal-300">
                      Total: {getDomainTotal(domain)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map(item => (
                    <div key={item.code} className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs shrink-0 w-12 justify-center">
                        {item.code}
                      </Badge>
                      <span className="text-sm text-gray-700 flex-1 leading-tight">{item.name}</span>
                      <div className="flex gap-1 shrink-0">
                        {SCORE_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            title={opt.label}
                            onClick={() => setScores(prev => ({ ...prev, [item.code]: opt.value }))}
                            className={`w-8 h-8 rounded text-xs font-bold border-2 transition-all ${scores[item.code] === opt.value
                                ? 'bg-teal-600 text-white border-teal-600'
                                : [7, 8, 9].includes(opt.value)
                                  ? 'border-gray-200 text-gray-400 hover:border-gray-400'
                                  : 'border-gray-200 text-gray-600 hover:border-teal-400'
                              }`}
                          >
                            {opt.value}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Acciones */}
            <div className="flex gap-3 justify-end print:hidden">
              <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Borrador
              </Button>
              <Button onClick={handleCalculate} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Calcular y Finalizar
              </Button>
            </div>
          </div>
        );
      })()}

      {/* ======================== STEP 3 ======================== */}
      {step === 3 && results && (() => {
        const mod = evaluation?.module;
        const rangoCfg = getRangoConfig(results.rango, mod);

        return (
          <div className="space-y-6">
            {/* Puntajes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resultados de la evaluación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {mod === '4' ? (
                    <>
                      <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                        <div className="text-3xl font-black text-indigo-700">{results.total_com ?? 0}</div>
                        <div className="text-xs font-medium text-indigo-600 mt-1">Total COM</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="text-3xl font-black text-blue-700">{results.total_as ?? 0}</div>
                        <div className="text-xs font-medium text-blue-600 mt-1">Total ISR</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="text-3xl font-black text-blue-700">{results.total_as ?? 0}</div>
                        <div className="text-xs font-medium text-blue-600 mt-1">Total AS</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                        <div className="text-3xl font-black text-purple-700">{results.total_crr ?? 0}</div>
                        <div className="text-xs font-medium text-purple-600 mt-1">Total CRR</div>
                      </div>
                    </>
                  )}
                  <div className="text-center p-4 bg-teal-50 rounded-xl border border-teal-200 col-span-2 sm:col-span-2">
                    <div className="text-4xl font-black text-teal-700">{results.total_global ?? 0}</div>
                    <div className="text-xs font-medium text-teal-600 mt-1">
                      {mod === '4' ? 'COM + ISR' : 'Puntuación Total Global'}
                    </div>
                  </div>
                </div>

                {/* Rango de preocupación */}
                {rangoCfg ? (
                  <div className={`p-4 rounded-xl border-2 text-center ${rangoCfg.color}`}>
                    <div className="text-2xl font-black mb-1">{rangoCfg.label}</div>
                    <p className="text-sm">{rangoCfg.description}</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-center text-gray-600">
                    <p className="text-sm">No se pudo determinar el rango de preocupación. Verifique el algoritmo seleccionado.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabla de puntajes por ítem */}
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => setExpandedSections(prev => ({ ...prev, table: !prev.table }))}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Puntajes por Ítem</CardTitle>
                  {expandedSections.table ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </CardHeader>
              {expandedSections.table && (
                <CardContent>
                  {(() => {
                    const responses = evaluation?.responses || [];
                    const moduleData = ADOS2_MODULES[mod];
                    if (!moduleData) return null;

                    const domains = mod === '4'
                      ? [['COM', 'Comunicación'], ['AS', 'Interacción Social Recíproca'], ['CRR', 'Comportamiento Restringido y Repetitivo']]
                      : [['AS', 'Afectación Social (AS)'], ['CRR', 'Comportamiento Restringido y Repetitivo (CRR)']];

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="text-left p-2 border border-slate-200 font-semibold text-slate-600">Área / Ítem</th>
                              <th className="text-center p-2 border border-slate-200 font-semibold text-slate-600 w-16">Código</th>
                              <th className="text-center p-2 border border-slate-200 font-semibold text-slate-600 w-20">Algoritmo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {domains.map(([domainKey, domainLabel]) => {
                              const domainItems = (moduleData.items[domainKey] || []);
                              const domainResponses = responses.filter(r => r.domain === domainKey);
                              const domainTotal = domainResponses.reduce((sum, r) => sum + (r.algorithm_score ?? 0), 0);

                              return (
                                <React.Fragment key={domainKey}>
                                  <tr className="bg-slate-100">
                                    <td colSpan={2} className="p-2 border border-slate-200 font-bold text-slate-700 text-xs">{domainLabel}</td>
                                    <td className="p-2 border border-slate-200"></td>
                                  </tr>
                                  {domainItems.map(item => {
                                    const resp = domainResponses.find(r => r.item_code === item.code);
                                    const algScore = resp?.algorithm_score ?? '—';
                                    const isZero = algScore === 0;
                                    const isHigh = typeof algScore === 'number' && algScore >= 2;
                                    return (
                                      <tr key={item.code} className="hover:bg-slate-50">
                                        <td className="p-2 pl-5 border border-slate-200 text-slate-700">{item.name}</td>
                                        <td className="p-2 border border-slate-200 text-center text-slate-500 font-mono">{item.code}</td>
                                        <td className={`p-2 border border-slate-200 text-center font-bold ${isHigh ? 'text-red-600 bg-red-50' : isZero ? 'text-green-600 bg-green-50' : 'text-slate-700'}`}>
                                          {algScore}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  <tr className="bg-slate-50 border-t-2 border-slate-300">
                                    <td colSpan={2} className="p-2 border border-slate-200 text-right font-bold text-slate-700 text-xs">TOTAL {domainKey}</td>
                                    <td className="p-2 border border-slate-200 text-center font-black text-teal-700">{domainTotal}</td>
                                  </tr>
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </CardContent>
              )}
            </Card>

            {/* Descripción de conductas observadas */}
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => setExpandedSections(prev => ({ ...prev, descriptions: !prev.descriptions }))}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Descripción de Conductas Observadas</CardTitle>
                  {expandedSections.descriptions ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </CardHeader>
              {expandedSections.descriptions && (
                <CardContent className="space-y-1">
                  <p className="text-xs text-slate-500 italic mb-4">Descripción clínica del puntaje asignado a cada ítem. Haz clic en el ícono de editar para personalizar.</p>
                  {(() => {
                    const responses = evaluation?.responses || [];
                    if (responses.length === 0) return <p className="text-xs text-slate-400">No hay respuestas registradas.</p>;

                    const sectionLabels = {
                      'A': 'Lenguaje y Comunicación',
                      'B': 'Interacción Social Recíproca',
                      'C': mod === 'T' ? 'Juego' : 'Imaginación',
                      'D': 'Comportamientos Estereotipados e Intereses Restringidos',
                      'E': 'Otros Comportamientos',
                    };
                    const sectionOrder = ['A', 'B', 'C', 'D', 'E'];

                    const grouped = {};
                    for (const r of responses) {
                      const prefix = (r.item_code || '').charAt(0).toUpperCase();
                      if (!grouped[prefix]) grouped[prefix] = [];
                      grouped[prefix].push(r);
                    }

                    return sectionOrder.map(section => {
                      const items = grouped[section];
                      if (!items || items.length === 0) return null;
                      items.sort((a, b) => (a.item_code || '').localeCompare(b.item_code || '', undefined, { numeric: true }));

                      return (
                        <div key={section} className="mb-4">
                          <h4 className="text-xs font-bold text-primary border-b border-primary pb-1 mb-3 uppercase tracking-wide">{sectionLabels[section] || section}</h4>
                          <div className="space-y-3">
                            {items.map(r => {
                              const desc = getScoreDescription(mod, r.item_code, r.raw_score);
                              const descText = customDescriptions[r.item_code] ?? desc?.description ?? '';
                              const isEditing = editingDescription === r.item_code;
                              const scoreColor = r.raw_score === 0 ? 'text-green-600' : r.raw_score >= 2 ? 'text-red-600' : 'text-amber-600';

                              return (
                                <div key={r.item_code} className="group">
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-slate-700">{r.item_name || desc?.name || r.item_code}</span>
                                        <span className="text-[10px] text-slate-400 font-mono">({r.item_code})</span>
                                        <span className={`text-[10px] font-bold ${scoreColor}`}>Puntaje: {r.raw_score}</span>
                                      </div>
                                      {isEditing ? (
                                        <div className="mt-1">
                                          <Textarea
                                            value={descText}
                                            onChange={e => setCustomDescriptions(prev => ({ ...prev, [r.item_code]: e.target.value }))}
                                            className="text-xs min-h-[60px]"
                                            rows={2}
                                            autoFocus
                                          />
                                          <div className="flex gap-2 mt-1">
                                            <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingDescription(null)}>
                                              Listo
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-slate-400" onClick={() => {
                                              setCustomDescriptions(prev => { const n = { ...prev }; delete n[r.item_code]; return n; });
                                              setEditingDescription(null);
                                            }}>
                                              Restaurar original
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        descText && (
                                          <p className={`text-xs text-slate-600 mt-0.5 pl-2 border-l-2 ${customDescriptions[r.item_code] ? 'border-primary bg-primary/50' : 'border-primary'}`}>
                                            {descText}
                                          </p>
                                        )
                                      )}
                                    </div>
                                    {!isEditing && (
                                      <button
                                        onClick={() => {
                                          if (!customDescriptions[r.item_code]) {
                                            setCustomDescriptions(prev => ({ ...prev, [r.item_code]: descText }));
                                          }
                                          setEditingDescription(r.item_code);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 p-1 rounded hover:bg-slate-100"
                                        title="Editar descripción"
                                      >
                                        <Pencil className="h-3 w-3 text-slate-400" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </CardContent>
              )}
            </Card>

            {/* Observaciones */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Observaciones clínicas</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Observaciones, recomendaciones, próximos pasos..."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Acciones */}
            <div className="flex gap-3 flex-wrap justify-end print:hidden">
              <Button variant="outline" onClick={() => navigate(ADOS2_BASE_PATH)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Volver al listado
              </Button>

              {/* Generar o Ver Informe */}
              {evaluation?.report_html ? (
                <>
                  <Button variant="outline" onClick={() => {
                    const w = window.open('', '_blank');
                    if (w) { w.document.write(evaluation.report_html); w.document.close(); }
                  }}>
                    <Eye className="h-4 w-4 mr-2" /> Ver Informe
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    const patientProfile = evaluation?.patient?.profile || evaluation?.patient || {};
                    // Force regeneration by temporarily clearing report_html
                    const evalWithoutCache = { ...evaluation, report_html: null };
                    generateAdos2Report({
                      evaluation: evalWithoutCache,
                      patientName: patientProfile.full_name || '',
                      therapistName: user?.user_metadata?.full_name || evaluation?.examinador || '',
                      patientData: { birthdate: patientProfile.birthdate, rut: patientProfile.rut },
                      therapistData,
                    });
                    toast({ title: 'Regenerando informe con IA...', description: 'Se guardará automáticamente al completar.' });
                    // Reload evaluation after a delay to get the new report_html
                    setTimeout(() => loadEvaluation(evaluationId || id), 15000);
                  }} className="text-gray-500">
                    <RefreshCw className="h-4 w-4 mr-1" /> Regenerar
                  </Button>
                </>
              ) : (
                <Button onClick={() => {
                  const patientProfile = evaluation?.patient?.profile || evaluation?.patient || {};
                  generateAdos2Report({
                    evaluation,
                    patientName: patientProfile.full_name || '',
                    therapistName: user?.user_metadata?.full_name || evaluation?.examinador || '',
                    patientData: { birthdate: patientProfile.birthdate, rut: patientProfile.rut },
                    therapistData,
                  });
                  toast({ title: 'Generando informe...', description: 'El análisis IA se guardará automáticamente.' });
                  // Reload evaluation after a delay to get the saved report_html
                  setTimeout(() => loadEvaluation(evaluationId || id), 15000);
                }} className="bg-primary hover:bg-primary">
                  <Printer className="h-4 w-4 mr-2" /> Generar Informe
                </Button>
              )}

              <Button
                variant={reportSaved ? 'outline' : 'default'}
                onClick={handleOpenFichaDialog}
                disabled={savingReport}
                className={reportSaved ? 'border-green-300 text-green-700 hover:bg-green-50' : 'bg-indigo-600 hover:bg-indigo-700'}
              >
                {savingReport ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileCheck className="h-4 w-4 mr-2" />}
                {reportSaved ? 'Guardado en Ficha ✓' : 'Guardar en Ficha'}
              </Button>
              <Button onClick={handleMarkRevisada} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Marcar como Revisada
              </Button>
            </div>
          </div>
        );
      })()}

      {/* Dialog: Seleccionar fecha para guardar en ficha */}
      <Dialog open={showFichaDialog} onOpenChange={setShowFichaDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Guardar en Ficha Clínica
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-500">
              Selecciona la fecha de atención a la que se asociará este informe.
            </p>

            {/* Date input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fecha de atención</Label>
              <Input
                type="date"
                value={fichaDate}
                onChange={(e) => setFichaDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Quick select from appointments */}
            {patientAppointments.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">O selecciona una sesión:</Label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 border rounded-lg p-2 bg-gray-50">
                  {patientAppointments.map((apt) => (
                    <button
                      key={apt.id}
                      onClick={() => setFichaDate(apt.date)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${
                        fichaDate === apt.date
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-white hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(apt.date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-xs text-gray-400">
                        {apt.services?.service_name || apt.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFichaDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveToFicha}
              disabled={!fichaDate}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
