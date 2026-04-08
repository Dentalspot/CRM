
import React, { useState, useEffect, useMemo } from 'react';
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
import { Progress } from '@/components/ui/progress';
import {
  FileText, ChevronRight, ChevronDown, CheckCircle2, ClipboardList, Search,
  Printer, ArrowLeft, Loader2, Save, AlertTriangle, Users, MessageCircle,
  Hand, Repeat, Baby, Info,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import * as adirApi from '@/features/adir/api/adirApi';
import {
  ADIR_DOMAINS,
  ADIR_SCORE_OPTIONS,
  ADIR_PERIODS,
  ADIR_VERBAL_STATUS,
  ADIR_INFORMANT_RELATIONSHIPS,
  ADIR_CLASIFICACION,
  ADIR_CUTOFFS,
  DOMAIN_LABELS,
  getActiveDomains,
  getActiveBDomain,
  toAlgorithmScore,
} from '@/features/adir/constants/adirItems';
import { generateAdirReport } from '@/features/tea/utils/reportGenerator';

const ADIR_BASE_PATH = '/dashboard/therapist/adir';

const STEPS = [
  { id: 1, label: 'Configuración', icon: ClipboardList },
  { id: 2, label: 'Puntuación', icon: FileText },
  { id: 3, label: 'Revisión', icon: Search },
  { id: 4, label: 'Resultados', icon: CheckCircle2 },
];

const DOMAIN_ICONS = {
  A: Users,
  B_verbal: MessageCircle,
  B_nonverbal: Hand,
  C: Repeat,
  D: Baby,
};

export default function AdirEvaluationPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(id ? 2 : 1);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  // Step 1 state
  const [patients, setPatients] = useState([]);
  const [setup, setSetup] = useState({
    patient_id: searchParams.get('patient') || '',
    verbal_status: 'verbal',
    informant_name: '',
    informant_relationship: '',
    fecha_evaluacion: new Date().toISOString().split('T')[0],
    examinador: '',
    informacion_adicional: '',
  });

  // Step 2 state
  const [evaluationId, setEvaluationId] = useState(id || null);
  const [evaluation, setEvaluation] = useState(null);
  // scores: { 'A1__current': 2, 'A1__4_5_years': 1, 'B1v__current': 0, ... }
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({}); // { 'A1': 'nota...', ... }
  const [collapsedDomains, setCollapsedDomains] = useState({});

  // Step 3/4 state
  const [results, setResults] = useState(null);
  const [observaciones, setObservaciones] = useState('');

  // Active domains based on verbal_status
  const verbalStatus = evaluation?.verbal_status || setup.verbal_status;
  const activeDomains = useMemo(() => getActiveDomains(verbalStatus), [verbalStatus]);

  // ─── EFFECTS ───────────────────────────────

  useEffect(() => {
    if (!id) loadPatients();
  }, []);

  useEffect(() => {
    if (id) loadEvaluation(id);
  }, [id]);

  useEffect(() => {
    if (user?.full_name || user?.user_metadata?.full_name) {
      setSetup(prev => ({
        ...prev,
        examinador: prev.examinador || user.full_name || user.user_metadata?.full_name || '',
      }));
    }
  }, [user]);

  // ─── DATA LOADING ──────────────────────────

  const loadPatients = async () => {
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
      full_name: p.profile?.full_name || 'Sin nombre',
    })).sort((a, b) => a.full_name.localeCompare(b.full_name));

    setPatients(formattedPatients);
  };

  const loadEvaluation = async (evalId) => {
    setLoading(true);
    try {
      const data = await adirApi.fetchEvaluationById(evalId);
      setEvaluation(data);
      setObservaciones(data.observaciones || '');

      // Restore scores from saved responses
      const savedScores = {};
      const savedNotes = {};
      (data.responses || []).forEach(r => {
        const key = `${r.item_code}__${r.period || 'current'}`;
        savedScores[key] = r.raw_score;
        if (r.notes) savedNotes[r.item_code] = r.notes;
      });
      setScores(savedScores);
      setNotes(savedNotes);

      if (data.status === 'completada' || data.status === 'revisada') {
        setResults({
          total_a: data.total_a,
          total_b: data.total_b,
          total_c: data.total_c,
          total_d: data.total_d,
          cumple: {
            A: data.cumple_criterio_a,
            B: data.cumple_criterio_b,
            C: data.cumple_criterio_c,
            D: data.cumple_criterio_d,
          },
          clasificacion: data.clasificacion,
        });
        setStep(4);
      } else {
        setStep(2);
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al cargar evaluación', description: e.message });
      navigate(ADIR_BASE_PATH);
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 1: CREAR EVALUACIÓN ──────────────

  const handleStartEvaluation = async () => {
    if (!setup.patient_id || !setup.verbal_status) {
      toast({ variant: 'destructive', title: 'Completa paciente y tipo de evaluación' });
      return;
    }
    if (!setup.informant_name) {
      toast({ variant: 'destructive', title: 'Ingresa el nombre del informante (cuidador)' });
      return;
    }

    setSaving(true);
    try {
      const newEval = await adirApi.createEvaluation({
        therapist_id: user.id,
        patient_id: setup.patient_id,
        verbal_status: setup.verbal_status,
        informant_name: setup.informant_name,
        informant_relationship: setup.informant_relationship || null,
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

  // ─── STEP 2: SCORING ──────────────────────

  const setScore = (itemCode, period, value) => {
    setScores(prev => ({ ...prev, [`${itemCode}__${period}`]: value }));
  };

  const getScore = (itemCode, period) => {
    return scores[`${itemCode}__${period}`];
  };

  const buildResponsesArray = () => {
    const responses = [];

    activeDomains.forEach(domainKey => {
      const domainData = ADIR_DOMAINS[domainKey];
      if (!domainData) return;

      domainData.items.forEach(item => {
        domainData.periods.forEach(period => {
          const score = getScore(item.code, period);
          if (score !== undefined && score !== null) {
            responses.push({
              ...item,
              domain: domainKey,
              score,
              period,
              notes: notes[item.code] || null,
            });
          }
        });
      });
    });
    return responses;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await adirApi.saveItemResponses(evaluationId, buildResponsesArray());
      toast({ title: '✅ Borrador guardado' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  // ─── STEP 3: REVIEW ───────────────────────

  const getMissingItems = () => {
    const missing = {};
    activeDomains.forEach(domainKey => {
      const domainData = ADIR_DOMAINS[domainKey];
      if (!domainData) return;

      const missingInDomain = domainData.items.filter(item => {
        // Al menos el primer período (current o ever) debe tener puntuación
        const primaryPeriod = domainData.periods[0];
        return getScore(item.code, primaryPeriod) === undefined;
      });

      if (missingInDomain.length > 0) {
        missing[domainKey] = missingInDomain;
      }
    });
    return missing;
  };

  const getCompletionStats = () => {
    let total = 0;
    let completed = 0;
    activeDomains.forEach(domainKey => {
      const domainData = ADIR_DOMAINS[domainKey];
      if (!domainData) return;
      domainData.items.forEach(item => {
        total++;
        const primaryPeriod = domainData.periods[0];
        if (getScore(item.code, primaryPeriod) !== undefined) completed++;
      });
    });
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const handleGoToReview = async () => {
    // Guardar antes de ir a revisión
    setSaving(true);
    try {
      await adirApi.saveItemResponses(evaluationId, buildResponsesArray());
      setStep(3);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  // ─── STEP 4: CALCULAR ─────────────────────

  const handleCalculate = async () => {
    setSaving(true);
    try {
      await adirApi.saveItemResponses(evaluationId, buildResponsesArray());
      const res = await adirApi.calculateScores(evaluationId);
      setResults(res);
      setStep(4);
      toast({ title: '✅ Evaluación calculada y guardada' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al calcular', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkRevisada = async () => {
    setSaving(true);
    try {
      await adirApi.updateEvaluationStatus(evaluationId, 'revisada', observaciones);
      toast({ title: '✅ Evaluación marcada como revisada' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al actualizar', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  // ─── HELPERS UI ────────────────────────────

  const toggleDomain = (key) => {
    setCollapsedDomains(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getDomainTotal = (domainKey, period) => {
    const domainData = ADIR_DOMAINS[domainKey];
    if (!domainData) return 0;
    return domainData.items.reduce((sum, item) => {
      const raw = getScore(item.code, period);
      if (raw === undefined || raw === null) return sum;
      return sum + toAlgorithmScore(raw);
    }, 0);
  };

  const getDomainCompletedCount = (domainKey) => {
    const domainData = ADIR_DOMAINS[domainKey];
    if (!domainData) return { completed: 0, total: 0 };
    const total = domainData.items.length;
    const completed = domainData.items.filter(item => {
      const primaryPeriod = domainData.periods[0];
      return getScore(item.code, primaryPeriod) !== undefined;
    }).length;
    return { completed, total };
  };

  // ─── LOADING STATE ─────────────────────────

  if (loading) {
    return (
      <div className="container mx-auto py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // ─── RENDER ────────────────────────────────

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(ADIR_BASE_PATH)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <FileText className="h-6 w-6 text-teal-600" />
        <h1 className="text-xl font-bold text-gray-900">
          {id ? 'Evaluación ADI-R' : 'Nueva Evaluación ADI-R'}
        </h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <React.Fragment key={s.id}>
              {i > 0 && <div className={`h-0.5 w-8 shrink-0 ${isDone ? 'bg-teal-500' : 'bg-gray-200'}`} />}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 ${
                isActive ? 'bg-teal-100 text-teal-800 border border-teal-300' :
                isDone ? 'bg-teal-50 text-teal-600' :
                'bg-gray-50 text-gray-400'
              }`}>
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ======================== STEP 1: CONFIGURACIÓN ======================== */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-teal-600" />
              Configuración de la entrevista
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Paciente */}
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select value={setup.patient_id} onValueChange={v => setSetup(p => ({ ...p, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Informante */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                El ADI-R es una entrevista al cuidador principal, no al paciente.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Nombre del informante *</Label>
                  <Input
                    value={setup.informant_name}
                    onChange={e => setSetup(p => ({ ...p, informant_name: e.target.value }))}
                    placeholder="Nombre del cuidador"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Relación con el paciente</Label>
                  <Select
                    value={setup.informant_relationship}
                    onValueChange={v => setSetup(p => ({ ...p, informant_relationship: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {ADIR_INFORMANT_RELATIONSHIPS.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Verbal Status */}
            <div className="space-y-2">
              <Label>Nivel de lenguaje *</Label>
              <Select value={setup.verbal_status} onValueChange={v => setSetup(p => ({ ...p, verbal_status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ADIR_VERBAL_STATUS.map(v => (
                    <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Determina si se usa el algoritmo de comunicación verbal o no verbal.
              </p>
            </div>

            {/* Fecha y examinador */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de evaluación</Label>
                <Input
                  type="date"
                  value={setup.fecha_evaluacion}
                  onChange={e => setSetup(p => ({ ...p, fecha_evaluacion: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Examinador</Label>
                <Input
                  value={setup.examinador}
                  onChange={e => setSetup(p => ({ ...p, examinador: e.target.value }))}
                  placeholder="Nombre del entrevistador"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Información adicional</Label>
              <Textarea
                value={setup.informacion_adicional}
                onChange={e => setSetup(p => ({ ...p, informacion_adicional: e.target.value }))}
                placeholder="Contexto, motivo de consulta, observaciones previas..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleStartEvaluation}
              disabled={saving}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              Iniciar Entrevista
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ======================== STEP 2: PUNTUACIÓN ======================== */}
      {step === 2 && evaluation && (() => {
        const stats = getCompletionStats();

        return (
          <div className="space-y-4">
            {/* Info banner */}
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="py-3 px-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
                  <span><strong>Paciente:</strong> {evaluation.patient?.full_name || '—'}</span>
                  <span><strong>Informante:</strong> {evaluation.informant_name || '—'}</span>
                  <Badge variant="outline" className="text-xs">
                    {verbalStatus === 'verbal' ? 'Verbal' : 'No verbal'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            <Card className="bg-teal-50 border-teal-200">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-teal-700">
                    Progreso: {stats.completed}/{stats.total} ítems ({stats.percentage}%)
                  </span>
                  <span className="text-xs text-teal-600">
                    Auto-guardado al avanzar
                  </span>
                </div>
                <Progress value={stats.percentage} className="h-2" />
              </CardContent>
            </Card>

            {/* Leyenda */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="py-3 px-4">
                <p className="text-xs text-amber-800">
                  <strong>Conversión algoritmo:</strong> 0→0 · 1→1 · 2→2 · 3→2 · 7/8/9→0 (no cuentan para el total)
                </p>
              </CardContent>
            </Card>

            {/* Dominios */}
            {activeDomains.map(domainKey => {
              const domainData = ADIR_DOMAINS[domainKey];
              if (!domainData) return null;
              const DomainIcon = DOMAIN_ICONS[domainKey] || FileText;
              const isCollapsed = collapsedDomains[domainKey];
              const { completed, total } = getDomainCompletedCount(domainKey);

              return (
                <Card key={domainKey}>
                  <CardHeader
                    className="pb-2 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleDomain(domainKey)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isCollapsed
                          ? <ChevronRight className="h-4 w-4 text-gray-400" />
                          : <ChevronDown className="h-4 w-4 text-gray-400" />
                        }
                        <DomainIcon className="h-4 w-4 text-teal-600" />
                        <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                          {domainData.label}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{completed}/{total}</span>
                        {domainData.periods.map(period => (
                          <Badge key={period} variant="outline" className="text-teal-700 border-teal-300 text-xs">
                            {period === 'current' ? 'Act' : period === '4_5_years' ? '4-5a' : 'Algv'}:
                            {' '}{getDomainTotal(domainKey, period)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 ml-6 mt-1">{domainData.description}</p>
                  </CardHeader>

                  {!isCollapsed && (
                    <CardContent className="space-y-3 pt-0">
                      {domainData.items.map(item => (
                        <div key={item.code} className="border rounded-lg p-3 space-y-2 bg-white">
                          {/* Item header */}
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="text-xs shrink-0 w-12 justify-center mt-0.5">
                              {item.code}
                            </Badge>
                            <span className="text-sm text-gray-700 leading-tight flex-1">{item.name}</span>
                          </div>

                          {/* Score rows per period */}
                          {domainData.periods.map(period => {
                            const periodLabel = ADIR_PERIODS.find(p => p.value === period)?.label || period;
                            return (
                              <div key={period} className="flex items-center gap-2 ml-14">
                                <span className="text-xs text-gray-500 w-24 shrink-0">{periodLabel}:</span>
                                <div className="flex gap-1 flex-wrap">
                                  {ADIR_SCORE_OPTIONS.map(opt => (
                                    <button
                                      key={opt.value}
                                      title={opt.label}
                                      onClick={() => setScore(item.code, period, opt.value)}
                                      className={`w-7 h-7 rounded text-xs font-bold border-2 transition-all ${
                                        getScore(item.code, period) === opt.value
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
                            );
                          })}

                          {/* Notes toggle */}
                          <div className="ml-14">
                            <input
                              type="text"
                              className="w-full text-xs border-0 border-b border-gray-200 focus:border-teal-400 focus:ring-0 py-1 px-0 placeholder-gray-300 bg-transparent"
                              placeholder="Notas del entrevistador..."
                              value={notes[item.code] || ''}
                              onChange={e => setNotes(prev => ({ ...prev, [item.code]: e.target.value }))}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              );
            })}

            {/* Acciones */}
            <div className="flex gap-3 justify-end print:hidden sticky bottom-4 bg-white/90 backdrop-blur p-3 rounded-xl border shadow-sm">
              <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Borrador
              </Button>
              <Button onClick={handleGoToReview} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Revisar y Calcular
              </Button>
            </div>
          </div>
        );
      })()}

      {/* ======================== STEP 3: REVISIÓN ======================== */}
      {step === 3 && (() => {
        const missingItems = getMissingItems();
        const hasMissing = Object.keys(missingItems).length > 0;
        const stats = getCompletionStats();

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="h-5 w-5 text-teal-600" />
                  Revisión antes de calcular
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Completitud */}
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-4xl font-black text-teal-700">{stats.percentage}%</div>
                  <div className="text-sm text-gray-500 mt-1">{stats.completed} de {stats.total} ítems completados</div>
                </div>

                {/* Ítems faltantes */}
                {hasMissing && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      Ítems sin puntuación
                    </p>
                    {Object.entries(missingItems).map(([domainKey, items]) => (
                      <div key={domainKey} className="text-xs text-amber-700">
                        <span className="font-medium">{DOMAIN_LABELS[domainKey] || domainKey}:</span>{' '}
                        {items.map(i => i.code).join(', ')}
                      </div>
                    ))}
                    <p className="text-xs text-amber-600">
                      Los ítems sin puntuación se tratarán como 0 en el cálculo del algoritmo.
                    </p>
                  </div>
                )}

                {/* Resumen de totales por dominio */}
                <div className="grid grid-cols-2 gap-3">
                  {activeDomains.map(domainKey => {
                    const domainData = ADIR_DOMAINS[domainKey];
                    if (!domainData) return null;
                    const cutoffKey = domainKey.startsWith('B_') ? 'B' : domainKey;
                    const cutoff = ADIR_CUTOFFS[verbalStatus]?.[cutoffKey];
                    // Use algorithm period: 4_5_years for A/B, ever for C/D
                    const algPeriod = domainKey === 'D' ? 'ever' :
                      domainKey === 'C' ? 'ever' : '4_5_years';
                    const total = getDomainTotal(domainKey, algPeriod);
                    const meetsCutoff = cutoff !== undefined && total >= cutoff;

                    return (
                      <div key={domainKey} className={`p-3 rounded-lg border text-center ${
                        meetsCutoff ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="text-2xl font-black">{total}</div>
                        <div className="text-xs font-medium text-gray-600 mt-0.5">
                          {domainData.shortLabel}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Corte: ≥{cutoff} → {meetsCutoff ? '⚠️ Cumple' : '✅ No cumple'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Volver a editar
              </Button>
              <Button onClick={handleCalculate} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Calcular y Finalizar
              </Button>
            </div>
          </div>
        );
      })()}

      {/* ======================== STEP 4: RESULTADOS ======================== */}
      {step === 4 && results && (() => {
        const clasCfg = ADIR_CLASIFICACION[results.clasificacion] || ADIR_CLASIFICACION.inconclusive;
        const cutoffs = ADIR_CUTOFFS[verbalStatus] || ADIR_CUTOFFS.verbal;

        return (
          <div className="space-y-6">
            {/* Clasificación global */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resultado ADI-R</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={`p-5 rounded-xl border-2 text-center ${clasCfg.color}`}>
                  <div className="text-2xl font-black mb-1">{clasCfg.label}</div>
                  <p className="text-sm">{clasCfg.description}</p>
                </div>

                {/* Tabla de dominios vs cutoffs */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium text-gray-600">Dominio</th>
                        <th className="text-center py-2 font-medium text-gray-600">Puntaje</th>
                        <th className="text-center py-2 font-medium text-gray-600">Corte</th>
                        <th className="text-center py-2 font-medium text-gray-600">¿Cumple?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 'A', label: 'A — Interacción social', total: results.total_a, cutoff: cutoffs.A, cumple: results.cumple.A },
                        { key: 'B', label: `B — Comunicación (${verbalStatus === 'verbal' ? 'verbal' : 'no verbal'})`, total: results.total_b, cutoff: cutoffs.B, cumple: results.cumple.B },
                        { key: 'C', label: 'C — Conducta restringida', total: results.total_c, cutoff: cutoffs.C, cumple: results.cumple.C },
                        { key: 'D', label: 'D — Desarrollo < 36m', total: results.total_d, cutoff: cutoffs.D, cumple: results.cumple.D },
                      ].map(row => (
                        <tr key={row.key} className="border-b last:border-0">
                          <td className="py-2.5 font-medium">{row.label}</td>
                          <td className="text-center py-2.5">
                            <span className="text-lg font-black">{row.total ?? 0}</span>
                          </td>
                          <td className="text-center py-2.5 text-gray-500">≥ {row.cutoff}</td>
                          <td className="text-center py-2.5">
                            {row.cumple ? (
                              <Badge className="bg-red-100 text-red-700 border-red-300">⚠️ Cumple</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700 border-green-300">✅ No cumple</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <strong>Nota:</strong> El ADI-R clasifica como "Autismo" cuando se alcanzan los puntos de corte en
                  los cuatro dominios (A, B, C y D). Esta herramienta es un sistema de registro y scoring;
                  la interpretación clínica debe considerar el contexto completo del paciente y complementarse
                  con la observación directa (ADOS-2).
                </p>
              </CardContent>
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
                  placeholder="Observaciones de la entrevista, calidad de la información del informante, recomendaciones, próximos pasos..."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Acciones */}
            <div className="flex gap-3 flex-wrap justify-end print:hidden">
              <Button variant="outline" onClick={() => navigate(ADIR_BASE_PATH)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Volver al listado
              </Button>
              <Button variant="outline" onClick={() => {
                const patientProfile = evaluation?.patient?.profile || {};
                generateAdirReport({
                  evaluation,
                  patientName: patientProfile.full_name || '',
                  therapistName: user?.user_metadata?.full_name || evaluation?.examinador || '',
                  patientData: { birthdate: patientProfile.birthdate, rut: patientProfile.rut },
                });
              }}>
                <Printer className="h-4 w-4 mr-2" /> Generar Informe
              </Button>
              <Button onClick={handleMarkRevisada} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Marcar como Revisada
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
