
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText, ChevronRight, ChevronDown, CheckCircle2, ClipboardList,
  ArrowLeft, Loader2, Save, XCircle, Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import * as pieApi from '@/features/pie/api/pieEvaluationsApi';
import { TECAL_ITEMS, TECAL_SUBCATEGORIES } from '@/features/pie/constants/tecalItems';

const PIE_BASE_PATH = '/dashboard/therapist/pie';

const STEPS = [
  { id: 1, label: 'Configuración', icon: ClipboardList },
  { id: 2, label: 'Puntuación', icon: FileText },
  { id: 3, label: 'Resultados', icon: CheckCircle2 },
];

const SECTION_META = {
  vocabulario: { label: 'Vocabulario', color: 'blue', range: '1-41', total: 41 },
  morfologia: { label: 'Morfología', color: 'violet', range: '42-89', total: 48 },
  sintaxis: { label: 'Sintaxis', color: 'emerald', range: '90-101', total: 12 },
};

function ResultBadge({ resultado }) {
  if (!resultado) return null;
  const r = resultado.toLowerCase();
  if (r.includes('deficit')) return <Badge variant="destructive">Deficitario</Badge>;
  if (r.includes('riesgo')) return <Badge className="bg-amber-100 text-amber-800 border-amber-200">En riesgo</Badge>;
  return <Badge className="bg-green-100 text-green-800 border-green-200">Normal</Badge>;
}

export default function TecalEvaluationPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedPatient = searchParams.get('patient') || '';
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(id ? 2 : 1);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [patients, setPatients] = useState([]);
  const [setup, setSetup] = useState({
    patient_id: preselectedPatient,
    fecha_evaluacion: new Date().toISOString().split('T')[0],
    edad_anios: '',
    edad_meses: '',
  });

  // Step 2: item responses { "1": true, "2": false, ... }
  const [evaluationId, setEvaluationId] = useState(id || null);
  const [responses, setResponses] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});

  // Step 3
  const [results, setResults] = useState(null);
  const [observaciones, setObservaciones] = useState('');

  // ─── EFFECTS ───────────────────────────────

  useEffect(() => { if (!id) loadPatients(); }, []);
  useEffect(() => { if (id) loadEvaluation(id); }, [id]);

  // ─── DATA ──────────────────────────────────

  const loadPatients = async () => {
    const { data } = await supabase
      .from('patients')
      .select('id, profile:profiles!patients_profile_id_fkey(full_name)')
      .eq('therapist_id', user.id)
      .eq('status', 'active');
    setPatients((data || []).map(p => ({ id: p.id, full_name: p.profile?.full_name || 'Sin nombre' }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name)));
  };

  const loadEvaluation = async (evalId) => {
    setLoading(true);
    try {
      const data = await pieApi.fetchTecalById(evalId);
      setEvaluationId(data.id);
      setObservaciones(data.observaciones || '');
      setResponses(data.items_responses || {});
      if (data.status === 'completada') {
        setResults(data);
        setStep(3);
      } else {
        setStep(2);
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
      navigate(PIE_BASE_PATH);
    } finally {
      setLoading(false);
    }
  };

  // ─── COMPUTED ──────────────────────────────

  const answeredCount = Object.keys(responses).length;
  const totalItems = 101;
  const progressPct = Math.round((answeredCount / totalItems) * 100);

  const sectionStats = useMemo(() => {
    const stats = {};
    for (const [section, meta] of Object.entries(SECTION_META)) {
      const items = TECAL_ITEMS.filter(i => i.section === section);
      const answered = items.filter(i => responses[String(i.num)] !== undefined);
      const correct = items.filter(i => responses[String(i.num)] === true);
      const errors = items.filter(i => responses[String(i.num)] === false);
      stats[section] = {
        total: meta.total,
        answered: answered.length,
        correct: correct.length,
        errors: errors.length,
      };
    }
    return stats;
  }, [responses]);

  // Subcategory analysis for Step 3
  const subcategoryAnalysis = useMemo(() => {
    if (!results) return null;
    const analysis = {};
    for (const [section, subcats] of Object.entries(TECAL_SUBCATEGORIES)) {
      analysis[section] = subcats.map(sub => {
        const correct = sub.items.filter(n => responses[String(n)] === true).length;
        const errors = sub.items.filter(n => responses[String(n)] === false).length;
        const pct = sub.total > 0 ? Math.round((correct / sub.total) * 100) : 0;
        return { ...sub, correct, errors, pct };
      });
    }
    return analysis;
  }, [results, responses]);

  // ─── HANDLERS ──────────────────────────────

  const toggleResponse = (itemNum, value) => {
    setResponses(prev => {
      const key = String(itemNum);
      if (prev[key] === value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  };

  const handleStartEvaluation = async () => {
    if (!setup.patient_id) { toast({ variant: 'destructive', title: 'Selecciona un paciente' }); return; }
    if (!setup.edad_anios) { toast({ variant: 'destructive', title: 'Ingresa la edad' }); return; }
    setSaving(true);
    try {
      const newEval = await pieApi.createTecalEvaluation({
        therapist_id: user.id,
        patient_id: setup.patient_id,
        fecha_evaluacion: setup.fecha_evaluacion,
        edad_anios: parseInt(setup.edad_anios) || 0,
        edad_meses: parseInt(setup.edad_meses) || 0,
      });
      setEvaluationId(newEval.id);
      setStep(2);
      toast({ title: 'Evaluación TECAL creada' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCalculate = async () => {
    setSaving(true);
    try {
      await pieApi.updateTecalEvaluation(evaluationId, { items_responses: responses });
      const res = await pieApi.calculateTecalResults(evaluationId);
      setResults(res);
      setStep(3);
      toast({ title: 'Resultados calculados' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await pieApi.updateTecalEvaluation(evaluationId, { observaciones });
      toast({ title: 'Observaciones guardadas' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (key) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── LOADING ───────────────────────────────

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
      <Helmet><title>TECAL - Evaluación | DentalSpot</title></Helmet>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(PIE_BASE_PATH)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <FileText className="h-6 w-6 text-blue-600" />
        <h1 className="text-xl font-bold">{id ? 'Evaluación TECAL' : 'Nueva Evaluación TECAL'}</h1>
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
                isDone ? 'bg-teal-50 text-teal-600' : 'bg-gray-50 text-gray-400'
              }`}>
                <Icon className="h-3.5 w-3.5" />{s.label}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ════════ STEP 1: CONFIGURACIÓN ════════ */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              Configuración TECAL
            </CardTitle>
            <p className="text-sm text-gray-500">Test para la Comprensión Auditiva del Lenguaje — 101 ítems</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select value={setup.patient_id} onValueChange={v => setSetup(p => ({ ...p, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha de evaluación</Label>
              <Input type="date" value={setup.fecha_evaluacion} onChange={e => setSetup(p => ({ ...p, fecha_evaluacion: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Edad (años) *</Label>
                <Input type="number" min={0} max={20} value={setup.edad_anios} onChange={e => setSetup(p => ({ ...p, edad_anios: e.target.value }))} placeholder="Ej: 5" />
              </div>
              <div className="space-y-2">
                <Label>Edad (meses)</Label>
                <Input type="number" min={0} max={11} value={setup.edad_meses} onChange={e => setSetup(p => ({ ...p, edad_meses: e.target.value }))} placeholder="Ej: 6" />
              </div>
            </div>
            <Button onClick={handleStartEvaluation} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              Iniciar Evaluación
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ════════ STEP 2: PUNTUACIÓN ÍTEM POR ÍTEM ════════ */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Instrucciones */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-3 px-4">
              <p className="text-xs font-semibold text-blue-800 mb-1">📋 Instrucciones al niño:</p>
              <p className="text-xs text-blue-700 leading-relaxed italic">
                «AHORA VAMOS A VER ALGUNOS DIBUJOS. POR FAVOR, PON ATENCIÓN. YO VOY A DECIR UNA PALABRA Y QUIERO QUE MUESTRES EL DIBUJO QUE CORRESPONDE A LA PALABRA QUE DIJE.»
              </p>
              <p className="text-xs text-blue-600 mt-1">
                El examinador abre el set de láminas en el ejemplo A y solicita: «BUSCA EL CONEJO. MUESTRA EL CONEJO.» Se continúa con el mismo procedimiento en todos los ítems.
              </p>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="py-3 px-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Progreso: <strong>{answeredCount}</strong> de {totalItems} ítems</span>
                <span className="font-medium text-blue-600">{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-2 [&>div]:bg-blue-500" />
              <div className="flex gap-4 text-xs text-slate-500">
                {Object.entries(SECTION_META).map(([key, meta]) => {
                  const s = sectionStats[key];
                  return (
                    <span key={key}>
                      {meta.label}: <span className="text-green-600 font-medium">{s.correct}</span>/<span className="text-red-500 font-medium">{s.errors}</span>/{s.total}
                    </span>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          {Object.entries(SECTION_META).map(([sectionKey, meta]) => {
            const isCollapsed = collapsedSections[sectionKey];
            const items = TECAL_ITEMS.filter(i => i.section === sectionKey);
            const s = sectionStats[sectionKey];
            const subcats = TECAL_SUBCATEGORIES[sectionKey] || [];

            return (
              <Card key={sectionKey}>
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => toggleSection(sectionKey)}
                >
                  <CardTitle className="text-base flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                      <span>{meta.label}</span>
                      <Badge variant="outline" className="text-xs">Ítems {meta.range}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-normal">
                      <span className="text-green-600">{s.correct} \u2713</span>
                      <span className="text-red-500">{s.errors} \u2717</span>
                      <span className="text-slate-400">/ {s.total}</span>
                    </div>
                  </CardTitle>
                </CardHeader>

                {!isCollapsed && (
                  <CardContent className="pt-0 space-y-4">
                    {subcats.map(subcat => (
                      <div key={subcat.key}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{subcat.key}</span>
                          <span className="text-xs text-slate-400">({subcat.total} ítems)</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                          {subcat.items.map(itemNum => {
                            const val = responses[String(itemNum)];
                            const isCorrect = val === true;
                            const isError = val === false;
                            return (
                              <div key={itemNum} className="flex items-center gap-1">
                                <span className="text-xs text-slate-400 w-6 text-right shrink-0">{itemNum}</span>
                                <button
                                  type="button"
                                  onClick={() => toggleResponse(itemNum, true)}
                                  className={`flex-1 h-8 rounded text-xs font-medium border transition-colors ${
                                    isCorrect
                                      ? 'bg-green-100 border-green-400 text-green-800'
                                      : 'bg-white border-gray-200 text-gray-400 hover:bg-green-50 hover:border-green-300'
                                  }`}
                                >
                                  <Check className="h-3.5 w-3.5 inline" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleResponse(itemNum, false)}
                                  className={`flex-1 h-8 rounded text-xs font-medium border transition-colors ${
                                    isError
                                      ? 'bg-red-100 border-red-400 text-red-800'
                                      : 'bg-white border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-300'
                                  }`}
                                >
                                  <XCircle className="h-3.5 w-3.5 inline" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
            </Button>
            <Button onClick={handleCalculate} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Calcular Resultados
            </Button>
          </div>
        </div>
      )}

      {/* ════════ STEP 3: RESULTADOS + ANÁLISIS CUALITATIVO ════════ */}
      {step === 3 && results && (
        <div className="space-y-4">
          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                Resultados TECAL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Sección</th>
                    <th className="text-center py-2 px-3 font-medium">Errores</th>
                    <th className="text-center py-2 px-3 font-medium">Puntaje</th>
                    <th className="text-center py-2 px-3 font-medium">DE</th>
                    <th className="text-center py-2 px-3 font-medium">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'vocabulario', label: 'Vocabulario' },
                    { key: 'morfologia', label: 'Morfología' },
                    { key: 'sintaxis', label: 'Sintaxis' },
                  ].map(row => (
                    <tr key={row.key} className="border-b">
                      <td className="py-2 px-3">{row.label}</td>
                      <td className="py-2 px-3 text-center">{results[`errores_${row.key}`]}</td>
                      <td className="py-2 px-3 text-center">{results[`puntaje_${row.key}`]}</td>
                      <td className="py-2 px-3 text-center">{results[`de_${row.key}`] || '\u2014'}</td>
                      <td className="py-2 px-3 text-center"><ResultBadge resultado={results[`resultado_${row.key}`]} /></td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-medium">
                    <td className="py-2 px-3">Total</td>
                    <td className="py-2 px-3 text-center">{(results.errores_vocabulario || 0) + (results.errores_morfologia || 0) + (results.errores_sintaxis || 0)}</td>
                    <td className="py-2 px-3 text-center">{results.puntaje_total}</td>
                    <td className="py-2 px-3 text-center">{results.de_total || '\u2014'}</td>
                    <td className="py-2 px-3 text-center"><ResultBadge resultado={results.resultado_total} /></td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Qualitative Analysis by Subcategory */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Análisis Cualitativo por Subcategoría</CardTitle>
              <p className="text-sm text-gray-500">Detalle de rendimiento en léxico, semántica y gramática</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {subcategoryAnalysis && Object.entries(SECTION_META).map(([sectionKey, meta]) => (
                <div key={sectionKey}>
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${meta.color}-500`} />
                    {meta.label}
                  </h3>
                  <div className="space-y-2">
                    {(subcategoryAnalysis[sectionKey] || []).map(sub => (
                      <div key={sub.key} className="flex items-center gap-3">
                        <span className="text-xs text-slate-600 w-48 shrink-0 truncate">{sub.key}</span>
                        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full ${
                              sub.pct >= 80 ? 'bg-green-400' : sub.pct >= 50 ? 'bg-amber-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${sub.pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-16 text-right shrink-0">
                          {sub.correct}/{sub.total} ({sub.pct}%)
                        </span>
                        {sub.errors > 0 && (
                          <Badge variant="outline" className="text-xs text-red-600 border-red-200 shrink-0">
                            {sub.errors} error{sub.errors > 1 ? 'es' : ''}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Ítems con Error (detail) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ítems con Error</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(SECTION_META).map(([sectionKey, meta]) => {
                const errorItems = TECAL_ITEMS
                  .filter(i => i.section === sectionKey && responses[String(i.num)] === false);
                if (errorItems.length === 0) return null;
                return (
                  <div key={sectionKey} className="mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase">{meta.label}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {errorItems.map(item => (
                        <Badge key={item.num} variant="outline" className="text-xs text-red-600 border-red-200">
                          #{item.num} ({item.subcategory})
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
              {TECAL_ITEMS.filter(i => responses[String(i.num)] === false).length === 0 && (
                <p className="text-sm text-green-600">Sin errores registrados</p>
              )}
            </CardContent>
          </Card>

          {/* Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Observaciones clínicas, conducta durante la evaluación..."
                rows={4}
              />
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Observaciones
              </Button>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => navigate(PIE_BASE_PATH)} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver al PIE
          </Button>
        </div>
      )}
    </div>
  );
}
