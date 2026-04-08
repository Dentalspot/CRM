
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
  ArrowLeft, Loader2, Save, Check, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import * as pieApi from '@/features/pie/api/pieEvaluationsApi';
import { STSG_RECEPTIVO_ITEMS, STSG_EXPRESIVO_ITEMS, STSG_CATEGORIAS } from '@/features/pie/constants/stsgItems';

const PIE_BASE_PATH = '/dashboard/therapist/pie';
const TOTAL_PHRASES = 92; // 23 items x 2 frases x 2 subpruebas

const STEPS_NAV = [
  { id: 1, label: 'Configuración', icon: ClipboardList },
  { id: 2, label: 'Puntuación', icon: FileText },
  { id: 3, label: 'Resultados', icon: CheckCircle2 },
];

function ResultBadge({ resultado }) {
  if (!resultado) return null;
  const r = resultado.toLowerCase();
  if (r.includes('deficit')) return <Badge variant="destructive">Deficitario</Badge>;
  if (r.includes('riesgo')) return <Badge className="bg-amber-100 text-amber-800 border-amber-200">En riesgo</Badge>;
  return <Badge className="bg-green-100 text-green-800 border-green-200">Normal</Badge>;
}

function CorrectButton({ active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`h-7 w-7 rounded border flex items-center justify-center text-xs transition-colors ${
      active ? 'bg-green-500 border-green-600 text-white' : 'bg-white border-gray-200 text-gray-300 hover:bg-green-50 hover:border-green-300'
    }`}><Check className="h-3.5 w-3.5" /></button>
  );
}

function ErrorButton({ active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`h-7 w-7 rounded border flex items-center justify-center text-xs transition-colors ${
      active ? 'bg-red-500 border-red-600 text-white' : 'bg-white border-gray-200 text-gray-300 hover:bg-red-50 hover:border-red-300'
    }`}><X className="h-3.5 w-3.5" /></button>
  );
}

export default function StsgEvaluationPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(id ? 2 : 1);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  const [patients, setPatients] = useState([]);
  const [setup, setSetup] = useState({
    patient_id: searchParams.get('patient') || '',
    fecha_evaluacion: new Date().toISOString().split('T')[0],
    edad_anios: '', edad_meses: '',
  });

  const [evaluationId, setEvaluationId] = useState(id || null);
  // responses per phrase: { "r1a": true, "r1b": false, "e1a": true, "e1b": false, ... }
  const [responses, setResponses] = useState({});
  // transcriptions for expresivo: { "e1a": "la pueta...", "e1b": "..." }
  const [transcriptions, setTranscriptions] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});
  const [results, setResults] = useState(null);
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => { if (!id) loadPatients(); }, []);
  useEffect(() => { if (id) loadEvaluation(id); }, [id]);

  const loadPatients = async () => {
    const { data } = await supabase
      .from('patients')
      .select('id, profile:profiles!patients_profile_id_fkey(full_name)')
      .eq('therapist_id', user.id).eq('status', 'active');
    setPatients((data || []).map(p => ({ id: p.id, full_name: p.profile?.full_name || 'Sin nombre' }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name)));
  };

  const loadEvaluation = async (evalId) => {
    setLoading(true);
    try {
      const data = await pieApi.fetchStsgById(evalId);
      setEvaluationId(data.id);
      setObservaciones(data.observaciones || '');
      const saved = data.items_responses || {};
      setResponses(saved);
      setTranscriptions(saved.transcriptions || {});
      if (data.status === 'completada') { setResults(data); setStep(3); }
      else setStep(2);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
      navigate(PIE_BASE_PATH);
    } finally { setLoading(false); }
  };

  // Count correct phrases per subtest (each item has a and b)
  const countCorrect = (prefix, items) =>
    items.reduce((sum, i) => sum + (responses[`${prefix}${i.num}a`] === true ? 1 : 0) + (responses[`${prefix}${i.num}b`] === true ? 1 : 0), 0);
  const countAnswered = (prefix, items) =>
    items.reduce((sum, i) => sum + (responses[`${prefix}${i.num}a`] !== undefined ? 1 : 0) + (responses[`${prefix}${i.num}b`] !== undefined ? 1 : 0), 0);

  const recCorrect = useMemo(() => countCorrect('r', STSG_RECEPTIVO_ITEMS), [responses]);
  const expCorrect = useMemo(() => countCorrect('e', STSG_EXPRESIVO_ITEMS), [responses]);
  const totalAnswered = useMemo(() =>
    countAnswered('r', STSG_RECEPTIVO_ITEMS) + countAnswered('e', STSG_EXPRESIVO_ITEMS), [responses]);
  const progressPct = Math.round((totalAnswered / TOTAL_PHRASES) * 100);

  const toggleResponse = (key, value) => {
    setResponses(prev => {
      if (prev[key] === value) { const next = { ...prev }; delete next[key]; return next; }
      return { ...prev, [key]: value };
    });
  };

  const handleStartEvaluation = async () => {
    if (!setup.patient_id) { toast({ variant: 'destructive', title: 'Selecciona un paciente' }); return; }
    if (!setup.edad_anios) { toast({ variant: 'destructive', title: 'Ingresa la edad' }); return; }
    setSaving(true);
    try {
      const newEval = await pieApi.createStsgEvaluation({
        therapist_id: user.id, patient_id: setup.patient_id,
        fecha_evaluacion: setup.fecha_evaluacion,
        edad_anios: parseInt(setup.edad_anios) || 0, edad_meses: parseInt(setup.edad_meses) || 0,
      });
      setEvaluationId(newEval.id); setStep(2);
      toast({ title: 'Evaluación STSG creada' });
    } catch (e) { toast({ variant: 'destructive', title: 'Error', description: e.message }); }
    finally { setSaving(false); }
  };

  const handleCalculate = async () => {
    setSaving(true);
    try {
      // Save all responses + transcriptions, compute puntaje from phrase-level data
      const payload = { ...responses, transcriptions };
      await pieApi.updateStsgEvaluation(evaluationId, {
        items_responses: payload,
        puntaje_receptivo: recCorrect,
        puntaje_expresivo: expCorrect,
      });
      const res = await pieApi.calculateStsgResults(evaluationId);
      setResults(res); setStep(3);
      toast({ title: 'Resultados calculados' });
    } catch (e) { toast({ variant: 'destructive', title: 'Error', description: e.message }); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await pieApi.updateStsgEvaluation(evaluationId, { observaciones, status: 'completada' });
      toast({ title: 'Evaluación guardada exitosamente' });
    } catch (e) { toast({ variant: 'destructive', title: 'Error', description: e.message }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="container mx-auto py-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>;

  // ─── Render item for receptivo (señala imagen correcta) ───
  const renderReceptivoItem = (item) => {
    const keyA = `r${item.num}a`, keyB = `r${item.num}b`;
    const valA = responses[keyA], valB = responses[keyB];
    return (
      <div key={item.num} className="p-3 rounded-lg border bg-white space-y-1.5">
        <div className="text-xs font-bold text-slate-400 mb-1">Ítem {item.num}</div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 shrink-0">
            <CorrectButton active={valA === true} onClick={() => toggleResponse(keyA, true)} />
            <ErrorButton active={valA === false} onClick={() => toggleResponse(keyA, false)} />
          </div>
          <span className={`text-sm flex-1 ${item.correct === 'a' ? 'font-semibold' : 'text-slate-500'}`}>
            a) {item.a} {item.correct === 'a' && <span className="text-green-500 text-xs">★</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 shrink-0">
            <CorrectButton active={valB === true} onClick={() => toggleResponse(keyB, true)} />
            <ErrorButton active={valB === false} onClick={() => toggleResponse(keyB, false)} />
          </div>
          <span className={`text-sm flex-1 ${item.correct === 'b' ? 'font-semibold' : 'text-slate-500'}`}>
            b) {item.b} {item.correct === 'b' && <span className="text-green-500 text-xs">★</span>}
          </span>
        </div>
      </div>
    );
  };

  // ─── Render item for expresivo (repite + transcripción) ───
  const renderExpresivoItem = (item) => {
    const keyA = `e${item.num}a`, keyB = `e${item.num}b`;
    const valA = responses[keyA], valB = responses[keyB];
    return (
      <div key={item.num} className="p-3 rounded-lg border bg-white space-y-2">
        <div className="text-xs font-bold text-slate-400 mb-1">Ítem {item.num}</div>
        {/* Frase A */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex gap-1 shrink-0">
              <CorrectButton active={valA === true} onClick={() => toggleResponse(keyA, true)} />
              <ErrorButton active={valA === false} onClick={() => toggleResponse(keyA, false)} />
            </div>
            <span className={`text-sm flex-1 ${item.correct === 'a' ? 'font-semibold' : 'text-slate-500'}`}>
              a) {item.a} {item.correct === 'a' && <span className="text-green-500 text-xs">★</span>}
            </span>
          </div>
          <div className="pl-16">
            <Input
              className="h-7 text-xs font-mono bg-slate-50 border-slate-200 placeholder:text-slate-300"
              placeholder="Transcripción: lo que dijo el niño..."
              value={transcriptions[keyA] || ''}
              onChange={e => setTranscriptions(p => ({ ...p, [keyA]: e.target.value }))}
              spellCheck={false} autoCorrect="off" autoCapitalize="off"
              data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false"
            />
          </div>
        </div>
        {/* Frase B */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex gap-1 shrink-0">
              <CorrectButton active={valB === true} onClick={() => toggleResponse(keyB, true)} />
              <ErrorButton active={valB === false} onClick={() => toggleResponse(keyB, false)} />
            </div>
            <span className={`text-sm flex-1 ${item.correct === 'b' ? 'font-semibold' : 'text-slate-500'}`}>
              b) {item.b} {item.correct === 'b' && <span className="text-green-500 text-xs">★</span>}
            </span>
          </div>
          <div className="pl-16">
            <Input
              className="h-7 text-xs font-mono bg-slate-50 border-slate-200 placeholder:text-slate-300"
              placeholder="Transcripción: lo que dijo el niño..."
              value={transcriptions[keyB] || ''}
              onChange={e => setTranscriptions(p => ({ ...p, [keyB]: e.target.value }))}
              spellCheck={false} autoCorrect="off" autoCapitalize="off"
              data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (prefix, label, items, renderFn, correct, total, instructions = '') => {
    const isCollapsed = collapsedSections[prefix];
    const answered = countAnswered(prefix, items);
    return (
      <Card key={prefix}>
        <CardHeader className="cursor-pointer select-none" onClick={() => setCollapsedSections(p => ({ ...p, [prefix]: !p[prefix] }))}>
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
              <span>{label}</span>
              <Badge variant="outline" className="text-xs">23 ítems · 46 frases</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm font-normal">
              <span className="text-green-600">{correct} ✓</span>
              <span className="text-slate-400">/ {total} frases</span>
            </div>
          </CardTitle>
        </CardHeader>
        {!isCollapsed && (
          <CardContent className="pt-0 space-y-3">
            {instructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                <p className="text-xs font-semibold text-blue-800 mb-1">📋 Instrucciones al niño:</p>
                <p className="text-xs text-blue-700 leading-relaxed italic">{instructions}</p>
              </div>
            )}
            {items.map(item => renderFn(item))}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      <Helmet><title>STSG - Evaluación | DentalSpot</title></Helmet>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(PIE_BASE_PATH)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <FileText className="h-6 w-6 text-violet-600" />
        <h1 className="text-xl font-bold">{id ? 'Evaluación STSG' : 'Nueva Evaluación STSG'}</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS_NAV.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id, isDone = step > s.id;
          return (
            <React.Fragment key={s.id}>
              {i > 0 && <div className={`h-0.5 w-8 shrink-0 ${isDone ? 'bg-violet-500' : 'bg-gray-200'}`} />}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 ${
                isActive ? 'bg-violet-100 text-violet-800 border border-violet-300' :
                isDone ? 'bg-violet-50 text-violet-600' : 'bg-gray-50 text-gray-400'
              }`}><Icon className="h-3.5 w-3.5" />{s.label}</div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ════ STEP 1 ════ */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-violet-600" /> Configuración STSG
            </CardTitle>
            <p className="text-sm text-gray-500">Screening Test of Spanish Grammar — 23 ítems × 2 frases × 2 subpruebas</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select value={setup.patient_id} onValueChange={v => setSetup(p => ({ ...p, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
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
            <Button onClick={handleStartEvaluation} disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              Iniciar Evaluación
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ════ STEP 2 ════ */}
      {step === 2 && (
        <div className="space-y-4">
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="py-3 px-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Progreso: <strong>{totalAnswered}</strong> de {TOTAL_PHRASES} frases</span>
                <span className="font-medium text-violet-600">{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-2 [&>div]:bg-violet-500" />
              <p className="text-xs text-slate-500">
                Cada ítem tiene 2 frases (A y B). Evalúa cada frase por separado: ✓ correcto / ✗ error.
                En la subprueba expresiva, transcribe lo que el niño dijo.
              </p>
            </CardContent>
          </Card>

          {renderSection('r', 'Subprueba Receptiva (Comprensivo)', STSG_RECEPTIVO_ITEMS, renderReceptivoItem, recCorrect, 46,
            '«Te voy a hablar de estos dibujos. Míralos todos. Espera que termine de hablar.» Se le muestra la primera página sin indicar los dibujos, se dicen ambas oraciones. Luego: «Muéstrame [oración A]» (el niño señala). «Ahora muéstrame [oración B]» (el niño señala). Se continúa con el mismo procedimiento en todos los ítems.'
          )}
          {renderSection('e', 'Subprueba Expresiva', STSG_EXPRESIVO_ITEMS, renderExpresivoItem, expCorrect, 46,
            '«Aquí hay otros dibujos de los que te voy a hablar. Cuando yo termine, quiero que tú repitas lo que te dije. Espera que yo termine.» Se muestra la primera página diciendo ambas oraciones. Se pregunta «¿Cuál es este?» indicando primero el dibujo de la oración correcta (con asterisco). Luego se pregunta por la segunda oración del ítem.'
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
            </Button>
            <Button onClick={handleCalculate} disabled={saving} className="flex-1 bg-violet-600 hover:bg-violet-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Calcular Resultados
            </Button>
          </div>
        </div>
      )}

      {/* ════ STEP 3: INTERPRETACIÓN CLÍNICA ════ */}
      {step === 3 && results && (() => {
        // Build interpretation data
        const hasErrorInItem = (prefix, num) =>
          responses[`${prefix}${num}a`] === false || responses[`${prefix}${num}b`] === false;

        const failedCategories = STSG_CATEGORIAS.filter(cat => {
          const recErr = cat.items.r.filter(n => hasErrorInItem('r', n)).length;
          const expErr = cat.items.e.filter(n => hasErrorInItem('e', n)).length;
          return (recErr + expErr) > 0;
        });

        const passedCategories = STSG_CATEGORIAS.filter(cat => {
          const recErr = cat.items.r.filter(n => hasErrorInItem('r', n)).length;
          const expErr = cat.items.e.filter(n => hasErrorInItem('e', n)).length;
          return (recErr + expErr) === 0;
        });

        // Group failed categories by comprehension vs expression difficulty
        const onlyReceptivo = failedCategories.filter(cat =>
          cat.items.r.some(n => hasErrorInItem('r', n)) && !cat.items.e.some(n => hasErrorInItem('e', n))
        );
        const onlyExpresivo = failedCategories.filter(cat =>
          !cat.items.r.some(n => hasErrorInItem('r', n)) && cat.items.e.some(n => hasErrorInItem('e', n))
        );
        const bothFailed = failedCategories.filter(cat =>
          cat.items.r.some(n => hasErrorInItem('r', n)) && cat.items.e.some(n => hasErrorInItem('e', n))
        );

        return (
        <div className="space-y-4">
          {/* Resumen cuantitativo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-violet-600" /> Resultados STSG
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Subprueba</th>
                    <th className="text-center py-2 px-3 font-medium">Correctas</th>
                    <th className="text-center py-2 px-3 font-medium">Percentil</th>
                    <th className="text-center py-2 px-3 font-medium">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-3">Receptivo</td>
                    <td className="py-2 px-3 text-center">{results.puntaje_receptivo} / 46</td>
                    <td className="py-2 px-3 text-center">{results.percentil_receptivo || '—'}</td>
                    <td className="py-2 px-3 text-center"><ResultBadge resultado={results.resultado_receptivo} /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3">Expresivo</td>
                    <td className="py-2 px-3 text-center">{results.puntaje_expresivo} / 46</td>
                    <td className="py-2 px-3 text-center">{results.percentil_expresivo || '—'}</td>
                    <td className="py-2 px-3 text-center"><ResultBadge resultado={results.resultado_expresivo} /></td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Interpretación clínica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interpretación Clínica</CardTitle>
              <p className="text-sm text-gray-500">Hallazgos para orientar el plan de intervención</p>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Estructuras NO adquiridas (falla en comprensión y expresión) */}
              {bothFailed.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <h4 className="text-sm font-bold text-red-800">Estructuras no adquiridas</h4>
                    <span className="text-xs text-red-500">(falla en comprensión y expresión)</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">El niño no comprende ni produce estas estructuras. Requieren intervención prioritaria.</p>
                  <div className="space-y-1">
                    {bothFailed.map(cat => (
                      <div key={cat.key} className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
                        <X className="h-4 w-4 text-red-500 shrink-0" />
                        <span className="text-sm text-red-800 font-medium">{cat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estructuras en desarrollo (falla solo en expresión) */}
              {onlyExpresivo.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <h4 className="text-sm font-bold text-amber-800">Estructuras en desarrollo</h4>
                    <span className="text-xs text-amber-500">(comprende pero no produce)</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">El niño comprende estas estructuras pero aún no las produce correctamente. Trabajar desde la comprensión hacia la expresión.</p>
                  <div className="space-y-1">
                    {onlyExpresivo.map(cat => (
                      <div key={cat.key} className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
                        <span className="text-amber-500 text-xs font-bold shrink-0">~</span>
                        <span className="text-sm text-amber-800 font-medium">{cat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dificultad comprensiva (falla solo en comprensión) */}
              {onlyReceptivo.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <h4 className="text-sm font-bold text-orange-800">Dificultad comprensiva</h4>
                    <span className="text-xs text-orange-500">(no comprende pero produce)</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">El niño produce estas estructuras pero falla al comprenderlas. Puede indicar uso memorizado sin comprensión real.</p>
                  <div className="space-y-1">
                    {onlyReceptivo.map(cat => (
                      <div key={cat.key} className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-100">
                        <span className="text-orange-500 text-xs font-bold shrink-0">?</span>
                        <span className="text-sm text-orange-800 font-medium">{cat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estructuras adquiridas */}
              {passedCategories.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <h4 className="text-sm font-bold text-green-800">Estructuras adquiridas</h4>
                    <span className="text-xs text-green-500">(comprende y produce)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {passedCategories.map(cat => (
                      <Badge key={cat.key} className="bg-green-100 text-green-700 border-green-200 text-xs">
                        {cat.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sugerencias de intervención */}
          {failedCategories.length > 0 && (
            <Card className="border-violet-200 bg-violet-50/50">
              <CardHeader>
                <CardTitle className="text-base text-violet-800">Sugerencias para Plan de Intervención</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-violet-900 space-y-2">
                {bothFailed.length > 0 && (
                  <div>
                    <p className="font-medium">Prioridad alta — trabajar comprensión y expresión:</p>
                    <ul className="list-disc list-inside text-xs space-y-0.5 mt-1 text-violet-700">
                      {bothFailed.map(cat => <li key={cat.key}>{cat.label}</li>)}
                    </ul>
                  </div>
                )}
                {onlyExpresivo.length > 0 && (
                  <div>
                    <p className="font-medium">Prioridad media — modelar producción:</p>
                    <ul className="list-disc list-inside text-xs space-y-0.5 mt-1 text-violet-700">
                      {onlyExpresivo.map(cat => <li key={cat.key}>{cat.label}</li>)}
                    </ul>
                  </div>
                )}
                {onlyReceptivo.length > 0 && (
                  <div>
                    <p className="font-medium">Reforzar comprensión:</p>
                    <ul className="list-disc list-inside text-xs space-y-0.5 mt-1 text-violet-700">
                      {onlyReceptivo.map(cat => <li key={cat.key}>{cat.label}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Observaciones */}
          <Card>
            <CardHeader><CardTitle className="text-base">Observaciones</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Observaciones clínicas, conducta durante la evaluación..." rows={4} />
              <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Evaluación
              </Button>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(`/dashboard/therapist/pie/stsg/new?patient=${searchParams.get('patient') || ''}`)} className="flex-1">
              Nueva Evaluación STSG
            </Button>
            <Button variant="outline" onClick={() => navigate(PIE_BASE_PATH)} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al PIE
            </Button>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
