
import React, { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText, ChevronRight, CheckCircle2, ClipboardList,
  ArrowLeft, Loader2, Save,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import * as pieApi from '@/features/pie/api/pieEvaluationsApi';
import { TEPROSIF_ITEMS } from '@/features/pie/constants/teprosifNorms';
import { analyzePSF } from '@/features/pie/utils/psfAnalyzer';
import { isProcessExpected, prioritizeIntervention } from '@/features/pie/constants/phonemeAcquisition';

const PIE_BASE_PATH = '/dashboard/therapist/pie';

const STEPS = [
  { id: 1, label: 'Configuracion', icon: ClipboardList },
  { id: 2, label: 'Puntuacion', icon: FileText },
  { id: 3, label: 'Resultados', icon: CheckCircle2 },
];

function getResultadoBadge(resultado) {
  if (!resultado) return null;
  const lower = resultado.toLowerCase();
  if (lower.includes('deficit') || lower.includes('deficitario')) {
    return <Badge variant="destructive">{resultado}</Badge>;
  }
  if (lower.includes('riesgo')) {
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200">{resultado}</Badge>;
  }
  return <Badge className="bg-green-100 text-green-800 border-green-200">{resultado}</Badge>;
}

export default function TeprosifEvaluationPage() {
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
    fecha_evaluacion: new Date().toISOString().split('T')[0],
    edad_anios: '',
    edad_meses: '',
  });

  // Step 2 state
  const [evaluationId, setEvaluationId] = useState(id || null);
  // Each item: { transcription: "pan cha", estructural: 1, asimilacion: 0, sustitucion: 0 }
  const [items, setItems] = useState(
    () => (TEPROSIF_ITEMS || []).map(() => ({ transcription: '', estructural: 0, asimilacion: 0, sustitucion: 0 }))
  );

  // Step 3 state
  const [results, setResults] = useState(null);
  const [observaciones, setObservaciones] = useState('');

  // ─── COMPUTED TOTALS ──────────────────────

  const totalEstructurales = items.reduce((sum, it) => sum + (it.estructural || 0), 0);
  const totalAsimilacion = items.reduce((sum, it) => sum + (it.asimilacion || 0), 0);
  const totalSustitucion = items.reduce((sum, it) => sum + (it.sustitucion || 0), 0);
  const totalPSF = totalEstructurales + totalAsimilacion + totalSustitucion;

  // ─── EFFECTS ───────────────────────────────

  useEffect(() => {
    if (!id) loadPatients();
  }, []);

  useEffect(() => {
    if (id) loadEvaluation(id);
  }, [id]);

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
      const data = await pieApi.fetchTeprosifById(evalId);
      setEvaluationId(data.id);
      setObservaciones(data.observaciones || '');

      if (data.items_detail) {
        try {
          const parsed = typeof data.items_detail === 'string' ? JSON.parse(data.items_detail) : data.items_detail;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItems(parsed);
          }
        } catch (_) {
          // keep default items
        }
      }

      if (data.status === 'completada') {
        setResults({
          total_estructurales: data.total_estructurales,
          total_asimilacion: data.total_asimilacion,
          total_sustitucion: data.total_sustitucion,
          total_psf: data.total_psf,
          resultado: data.resultado,
        });
        setStep(3);
      } else {
        setStep(2);
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al cargar evaluacion', description: e.message });
      navigate(PIE_BASE_PATH);
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 1: CREAR EVALUACION ──────────────

  const handleStartEvaluation = async () => {
    if (!setup.patient_id) {
      toast({ variant: 'destructive', title: 'Selecciona un paciente' });
      return;
    }
    if (!setup.edad_anios && !setup.edad_meses) {
      toast({ variant: 'destructive', title: 'Ingresa la edad del paciente' });
      return;
    }

    setSaving(true);
    try {
      const newEval = await pieApi.createTeprosifEvaluation({
        therapist_id: user.id,
        patient_id: setup.patient_id,
        fecha_evaluacion: setup.fecha_evaluacion,
        edad_anios: parseInt(setup.edad_anios) || 0,
        edad_meses: parseInt(setup.edad_meses) || 0,
      });
      setEvaluationId(newEval.id);
      setStep(2);
      toast({ title: 'Evaluacion TEPROSIF-R creada' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al crear evaluacion', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  // ─── STEP 2: ITEM UPDATE ──────────────────

  const updateItem = (index, field, value) => {
    setItems(prev => {
      const next = [...prev];
      if (field === 'transcription') {
        next[index] = { ...next[index], transcription: value };
        // Auto-analyze PSF from transcription vs model word
        if (value.trim()) {
          const modelo = TEPROSIF_ITEMS[index]?.word || '';
          const suggested = analyzePSF(modelo, value);
          next[index] = { ...next[index], transcription: value, ...suggested };
        } else {
          next[index] = { ...next[index], transcription: value, estructural: 0, asimilacion: 0, sustitucion: 0 };
        }
      } else {
        // Manual override — terapeuta corrige el conteo
        next[index] = { ...next[index], [field]: Math.max(0, Math.min(5, parseInt(value) || 0)) };
      }
      return next;
    });
  };

  // ─── STEP 2: CALCULAR ─────────────────────

  const handleCalculate = async () => {
    setSaving(true);
    try {
      await pieApi.updateTeprosifEvaluation(evaluationId, {
        total_estructurales: totalEstructurales,
        total_asimilacion: totalAsimilacion,
        total_sustitucion: totalSustitucion,
        items_detail: JSON.stringify(items),
      });
      const res = await pieApi.calculateTeprosifResults(evaluationId);
      setResults(res);
      setStep(3);
      toast({ title: 'Resultados calculados' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al calcular', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  // ─── STEP 3: GUARDAR ─────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      await pieApi.updateTeprosifEvaluation(evaluationId, { observaciones });
      toast({ title: 'Observaciones guardadas' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: e.message });
    } finally {
      setSaving(false);
    }
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
      <Helmet>
        <title>TEPROSIF-R - Evaluacion | DentalSpot</title>
      </Helmet>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(PIE_BASE_PATH)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <FileText className="h-6 w-6 text-teal-600" />
        <h1 className="text-xl font-bold text-gray-900">
          {id ? 'Evaluacion TEPROSIF-R' : 'Nueva Evaluacion TEPROSIF-R'}
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

      {/* ======================== STEP 1: CONFIGURACION ======================== */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-teal-600" />
              Configuracion de la Evaluacion TEPROSIF-R
            </CardTitle>
            <p className="text-sm text-gray-500">
              Test de Procesos de Simplificacion Fonologica - Revisado
            </p>
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

            {/* Fecha */}
            <div className="space-y-2">
              <Label>Fecha de evaluacion</Label>
              <Input
                type="date"
                value={setup.fecha_evaluacion}
                onChange={e => setSetup(p => ({ ...p, fecha_evaluacion: e.target.value }))}
              />
            </div>

            {/* Edad */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Edad (anios) *</Label>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={setup.edad_anios}
                  onChange={e => setSetup(p => ({ ...p, edad_anios: e.target.value }))}
                  placeholder="Ej: 5"
                />
              </div>
              <div className="space-y-2">
                <Label>Edad (meses)</Label>
                <Input
                  type="number"
                  min={0}
                  max={11}
                  value={setup.edad_meses}
                  onChange={e => setSetup(p => ({ ...p, edad_meses: e.target.value }))}
                  placeholder="Ej: 6"
                />
              </div>
            </div>

            <Button
              onClick={handleStartEvaluation}
              disabled={saving}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              Iniciar Evaluacion
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ======================== STEP 2: PUNTUACIÓN ======================== */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Instrucciones */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-3 px-4">
              <p className="text-xs font-semibold text-blue-800 mb-1">📋 Instrucciones:</p>
              <p className="text-xs text-blue-700 leading-relaxed italic">
                Se presenta cada lámina al niño y se le pide que nombre lo que ve. Transcriba fonológicamente lo que el niño dice debajo de cada sílaba. Luego identifique y cuente los Procesos de Simplificación Fonológica (PSF) por tipo.
              </p>
            </CardContent>
          </Card>

          {/* Totales flotantes */}
          <Card className="bg-teal-50 border-teal-200">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-4">
                  <span className="text-teal-700">E. Silábica: <strong>{totalEstructurales}</strong></span>
                  <span className="text-teal-700">Asimilación: <strong>{totalAsimilacion}</strong></span>
                  <span className="text-teal-700">Sustitución: <strong>{totalSustitucion}</strong></span>
                </div>
                <span className="text-teal-800 font-bold text-base">Total PSF: {totalPSF}</span>
              </div>
            </CardContent>
          </Card>

          {/* Ítems con sílabas y transcripción */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hoja de Análisis TEPROSIF-R</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(TEPROSIF_ITEMS || []).map((word, idx) => (
                <div key={idx} className="p-3 rounded-lg border bg-white space-y-2">
                  {/* Número + Sílabas modelo */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-6 text-right shrink-0">{word.num}.</span>
                    <div className="flex gap-1">
                      {(word.syllables || []).map((syl, si) => (
                        <span key={si} className="px-2 py-1 bg-slate-100 rounded text-sm font-bold text-slate-700 tracking-wider">
                          {syl}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Transcripción fonológica */}
                  <div className="pl-9">
                    <Input
                      className="h-8 text-sm font-mono bg-amber-50 border-amber-200 placeholder:text-amber-300"
                      placeholder={`Transcripción: lo que dijo el niño para "${word.word}"...`}
                      value={items[idx]?.transcription || ''}
                      onChange={e => updateItem(idx, 'transcription', e.target.value)}
                      spellCheck={false} autoCorrect="off" autoCapitalize="off"
                      data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false"
                    />
                  </div>

                  {/* Conteo de procesos (auto-sugerido, editable) */}
                  <div className="pl-9 flex items-center gap-3 flex-wrap">
                    {items[idx]?.transcription?.trim() && (
                      <span className="text-[10px] text-violet-500 shrink-0">⚡ auto</span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 shrink-0">E. Sil.</span>
                      <Input type="number" min={0} max={5}
                        className={`w-14 h-7 text-center text-xs ${items[idx]?.estructural > 0 ? 'border-red-300 bg-red-50' : ''}`}
                        value={items[idx]?.estructural || 0}
                        onChange={e => updateItem(idx, 'estructural', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 shrink-0">Asim.</span>
                      <Input type="number" min={0} max={5}
                        className={`w-14 h-7 text-center text-xs ${items[idx]?.asimilacion > 0 ? 'border-orange-300 bg-orange-50' : ''}`}
                        value={items[idx]?.asimilacion || 0}
                        onChange={e => updateItem(idx, 'asimilacion', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 shrink-0">Sust.</span>
                      <Input type="number" min={0} max={5}
                        className={`w-14 h-7 text-center text-xs ${items[idx]?.sustitucion > 0 ? 'border-amber-300 bg-amber-50' : ''}`}
                        value={items[idx]?.sustitucion || 0}
                        onChange={e => updateItem(idx, 'sustitucion', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" /> Atras
            </Button>
            <Button
              onClick={handleCalculate}
              disabled={saving}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Calcular Resultados
            </Button>
          </div>
        </div>
      )}

      {/* ======================== STEP 3: RESULTADOS + INTERPRETACIÓN ======================== */}
      {step === 3 && results && (() => {
        // Analyze patterns from item-level data
        const itemsData = items || [];
        const teprosifWords = TEPROSIF_ITEMS || [];

        // Items with structural processes (omissions)
        const itemsWithEstructural = itemsData
          .map((it, i) => ({ ...it, word: teprosifWords[i]?.word, num: teprosifWords[i]?.num, syllables: teprosifWords[i]?.syllables }))
          .filter(it => it.estructural > 0);

        const itemsWithSustitucion = itemsData
          .map((it, i) => ({ ...it, word: teprosifWords[i]?.word, num: teprosifWords[i]?.num }))
          .filter(it => it.sustitucion > 0);

        const itemsWithAsimilacion = itemsData
          .map((it, i) => ({ ...it, word: teprosifWords[i]?.word, num: teprosifWords[i]?.num }))
          .filter(it => it.asimilacion > 0);

        // Detect consistent phoneme omissions from transcriptions
        const findOmittedPhonemes = () => {
          const phonemeCounts = {};
          itemsData.forEach((it, i) => {
            if (!it.transcription?.trim() || it.estructural === 0) return;
            const modelo = (teprosifWords[i]?.word || '').toLowerCase();
            const prod = it.transcription.toLowerCase();
            // Find letters in model not in production
            for (const c of modelo) {
              if (!'aáeéiíoóuú '.includes(c) && !prod.includes(c)) {
                phonemeCounts[c] = (phonemeCounts[c] || 0) + 1;
              }
            }
          });
          return Object.entries(phonemeCounts)
            .filter(([, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1])
            .map(([phoneme, count]) => ({ phoneme: `/${phoneme}/`, count }));
        };

        const omittedPhonemes = findOmittedPhonemes();

        // Detect substituted phonemes
        const findSubstitutedPhonemes = () => {
          const subPatterns = {};
          itemsData.forEach((it, i) => {
            if (!it.transcription?.trim() || it.sustitucion === 0) return;
            const modelo = (teprosifWords[i]?.word || '').toLowerCase();
            const prod = it.transcription.toLowerCase();
            const mCons = [...modelo].filter(c => c.match(/[a-zñ]/) && !'aeiouáéíóú'.includes(c));
            const pCons = [...prod].filter(c => c.match(/[a-zñ]/) && !'aeiouáéíóú'.includes(c));
            const min = Math.min(mCons.length, pCons.length);
            for (let j = 0; j < min; j++) {
              if (mCons[j] !== pCons[j]) {
                const key = `/${mCons[j]}/ → /${pCons[j]}/`;
                subPatterns[key] = (subPatterns[key] || 0) + 1;
              }
            }
          });
          return Object.entries(subPatterns)
            .filter(([, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1])
            .map(([pattern, count]) => ({ pattern, count }));
        };

        const substitutedPhonemes = findSubstitutedPhonemes();

        // Dífonos consonánticos con /l/ y /r/ (items con grupos bl, br, cl, cr, etc.)
        const clusterItems = [1, 4, 8, 9, 21, 22, 23, 31, 33, 37]; // plancha, bicicleta, alfombra, refrigerador, micro, tren, plátano, árbol, guitarra, puente
        const failedClusters = clusterItems.filter(num => {
          const idx = num - 1;
          return itemsData[idx] && itemsData[idx].estructural > 0;
        });

        // Dífonos vocálicos (items con dífonos vocálicos)
        const diphthongItems = [2, 5, 12, 16, 17, 19, 28, 31, 36, 37]; // rueda, helicóptero, dinosaurio, auto, indio, camión, volantín, árbol, jaula, puente
        const failedDiphthongs = diphthongItems.filter(num => {
          const idx = num - 1;
          return itemsData[idx] && itemsData[idx].estructural > 0;
        });

        // Determine clinical indicators
        const hasConsistentOmissions = omittedPhonemes.length > 0;
        const hasClusterDifficulty = failedClusters.length >= 3;
        const hasDiphthongDifficulty = failedDiphthongs.length >= 3;
        const hasConsistentSubstitutions = substitutedPhonemes.length > 0;
        const suggestsPhonologicalDisorder = hasClusterDifficulty && hasDiphthongDifficulty;
        const totalPSF = totalEstructurales + totalAsimilacion + totalSustitucion;
        const predominantProcess = totalEstructurales >= totalSustitucion && totalEstructurales >= totalAsimilacion
          ? 'estructural' : totalSustitucion >= totalAsimilacion ? 'sustitucion' : 'asimilacion';

        return (
        <div className="space-y-4">
          {/* Resumen cuantitativo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-teal-600" />
                Resultados TEPROSIF-R
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="py-3 px-4 text-center">
                    <p className="text-xs text-blue-600 font-medium">E. Silábica</p>
                    <p className="text-2xl font-bold text-blue-800">{results.total_estructurales}</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="py-3 px-4 text-center">
                    <p className="text-xs text-purple-600 font-medium">Asimilación</p>
                    <p className="text-2xl font-bold text-purple-800">{results.total_asimilacion}</p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="py-3 px-4 text-center">
                    <p className="text-xs text-orange-600 font-medium">Sustitución</p>
                    <p className="text-2xl font-bold text-orange-800">{results.total_sustitucion}</p>
                  </CardContent>
                </Card>
              </div>
              <Card className="bg-teal-50 border-teal-200">
                <CardContent className="py-3 px-4 text-center">
                  <p className="text-sm text-teal-600 font-medium">Total PSF: <span className="text-2xl font-bold text-teal-800">{totalPSF}</span></p>
                  <div className="mt-1">{getResultadoBadge(results.resultado)}</div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Interpretación Clínica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interpretación Clínica</CardTitle>
              <p className="text-sm text-gray-500">Análisis de patrones fonológicos para orientar el diagnóstico</p>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Proceso predominante */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">Proceso predominante</h4>
                <div className={`p-3 rounded-lg border ${
                  predominantProcess === 'estructural' ? 'bg-blue-50 border-blue-200' :
                  predominantProcess === 'sustitucion' ? 'bg-orange-50 border-orange-200' :
                  'bg-purple-50 border-purple-200'
                }`}>
                  <p className="text-sm font-medium">
                    {predominantProcess === 'estructural' && '🔵 Procesos Estructurales (E. Silábica)'}
                    {predominantProcess === 'sustitucion' && '🟠 Procesos de Sustitución'}
                    {predominantProcess === 'asimilacion' && '🟣 Procesos de Asimilación'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {predominantProcess === 'estructural' && 'El niño tiende a simplificar la estructura de la palabra (omite sílabas, reduce grupos consonánticos, simplifica dífonos vocálicos).'}
                    {predominantProcess === 'sustitucion' && 'El niño reemplaza fonemas por otros (ej: /r/ por /d/, /s/ por /t/). Evaluar si son sustituciones sistemáticas.'}
                    {predominantProcess === 'asimilacion' && 'El niño tiende a hacer que los sonidos se parezcan entre sí dentro de la palabra (armonía consonántica).'}
                  </p>
                </div>
              </div>

              {/* Fonemas omitidos consistentemente */}
              {hasConsistentOmissions && (() => {
                const childAge = results.edad_anios || 3;
                const omittedWithAge = omittedPhonemes.map(({ phoneme, count }) => {
                  const clean = phoneme.replace(/\//g, '');
                  const info = isProcessExpected(clean, childAge);
                  return { phoneme, count, ...info };
                });
                const unexpected = omittedWithAge.filter(p => !p.expected);
                const expected = omittedWithAge.filter(p => p.expected);
                return (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-2">Fonemas omitidos consistentemente</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                    {unexpected.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-800 mb-1">No esperados para la edad ({childAge} años) — requieren intervención:</p>
                        <div className="flex flex-wrap gap-2">
                          {unexpected.map(({ phoneme, count, acquisitionAge }) => (
                            <Badge key={phoneme} variant="destructive" className="text-xs">
                              {phoneme} — {count}x (se adquiere a los {acquisitionAge} años)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {expected.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-700 mb-1">Esperados para la edad ({childAge} años) — en proceso de adquisición:</p>
                        <div className="flex flex-wrap gap-2">
                          {expected.map(({ phoneme, count, acquisitionAge }) => (
                            <Badge key={phoneme} className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                              {phoneme} — {count}x (se adquiere a los {acquisitionAge} años)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                );
              })()}

              {/* Sustituciones sistemáticas */}
              {hasConsistentSubstitutions && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-2">Sustituciones sistemáticas</h4>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {substitutedPhonemes.map(({ pattern, count }) => (
                        <Badge key={pattern} className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                          {pattern} × {count}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-amber-700">
                      Las sustituciones sistemáticas indican un <strong>patrón fonológico</strong> que debe abordarse en intervención.
                    </p>
                  </div>
                </div>
              )}

              {/* Dífonos consonánticos con /l/ y /r/ */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">Dífonos consonánticos con /l/ y /r/</h4>
                <div className={`p-3 rounded-lg border ${hasClusterDifficulty ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  {failedClusters.length > 0 ? (
                    <>
                      <p className="text-sm font-medium text-red-800">
                        Dificultad en {failedClusters.length} de {clusterItems.length} palabras con grupos consonánticos
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {failedClusters.map(num => (
                          <Badge key={num} variant="outline" className="text-xs text-red-600 border-red-200">
                            {teprosifWords[num-1]?.word} ({teprosifWords[num-1]?.syllables?.join('·')})
                          </Badge>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-green-700">✓ Sin dificultades en dífonos consonánticos con /l/ y /r/</p>
                  )}
                </div>
              </div>

              {/* Dífonos vocálicos */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">Dífonos vocálicos</h4>
                <div className={`p-3 rounded-lg border ${hasDiphthongDifficulty ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  {failedDiphthongs.length > 0 ? (
                    <>
                      <p className="text-sm font-medium text-red-800">
                        Dificultad en {failedDiphthongs.length} de {diphthongItems.length} palabras con dífonos vocálicos
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {failedDiphthongs.map(num => (
                          <Badge key={num} variant="outline" className="text-xs text-red-600 border-red-200">
                            {teprosifWords[num-1]?.word}
                          </Badge>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-green-700">✓ Sin dificultades en dífonos vocálicos</p>
                  )}
                </div>
              </div>

              {/* Indicador de Trastorno Fonológico */}
              {suggestsPhonologicalDisorder && (
                <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-red-900 mb-2">⚠️ Indicador de Trastorno Fonológico</h4>
                  <p className="text-sm text-red-800">
                    Se observa dificultad tanto en <strong>dífonos consonánticos</strong> (grupos con /l/ y /r/) como en <strong>dífonos vocálicos</strong>.
                  </p>
                </div>
              )}

              {/* Priorización de intervención */}
              {(hasConsistentOmissions || hasConsistentSubstitutions) && (() => {
                const childAge = results.edad_anios || 3;
                // Collect all affected phonemes
                const allAffected = [
                  ...omittedPhonemes.map(p => p.phoneme.replace(/\//g, '')),
                  ...substitutedPhonemes.flatMap(p => {
                    const match = p.pattern.match(/\/(\w+)\/ → \/(\w+)\//);
                    return match ? [match[1]] : [];
                  }),
                ];
                const unique = [...new Set(allAffected)];
                const priorities = prioritizeIntervention(unique, childAge);

                if (priorities.length === 0) return null;
                return (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-2">Priorización de Intervención</h4>
                  <p className="text-xs text-slate-500 mb-2">
                    Según tabla de adquisición fonémica de Coloma, Pavez, Maggiolo & Peñaloza (2010). Orden: edad de adquisición, punto articulatorio anterior → posterior, /rr/ al final.
                  </p>
                  <div className="space-y-1.5">
                    {priorities.map((p) => (
                      <div key={p.phoneme} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                        p.expected ? 'bg-gray-50 border-gray-200' : 'bg-white border-slate-200'
                      }`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          p.expected ? 'bg-gray-200 text-gray-500' : 'bg-teal-500 text-white'
                        }`}>{p.priority}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{p.phoneme}</span>
                          <span className="text-xs text-slate-500 ml-2">{p.name} — {p.point}</span>
                        </div>
                        <div className="text-xs shrink-0">
                          {p.expected ? (
                            <Badge className="bg-gray-100 text-gray-500 border-gray-200">Esperado (adq. {p.acquisitionAge}a)</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-200">No adquirido (esperable a los {p.acquisitionAge}a)</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                );
              })()}

              {/* Palabras con mayor dificultad */}
              {(itemsWithEstructural.length > 0 || itemsWithSustitucion.length > 0) && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-2">Palabras con mayor dificultad</h4>
                  <div className="space-y-1">
                    {itemsData
                      .map((it, i) => ({ ...it, word: teprosifWords[i]?.word, num: teprosifWords[i]?.num, total: (it.estructural || 0) + (it.asimilacion || 0) + (it.sustitucion || 0) }))
                      .filter(it => it.total > 0)
                      .sort((a, b) => b.total - a.total)
                      .slice(0, 10)
                      .map(it => (
                        <div key={it.num} className="flex items-center gap-2 text-sm bg-slate-50 rounded px-3 py-1.5 border">
                          <span className="font-medium text-slate-700 w-28 shrink-0">{it.num}. {it.word}</span>
                          {it.transcription && (
                            <span className="text-xs font-mono text-slate-500">→ "{it.transcription}"</span>
                          )}
                          <div className="ml-auto flex gap-1.5 shrink-0">
                            {it.estructural > 0 && <Badge className="bg-blue-100 text-blue-700 text-[10px]">E:{it.estructural}</Badge>}
                            {it.asimilacion > 0 && <Badge className="bg-purple-100 text-purple-700 text-[10px]">A:{it.asimilacion}</Badge>}
                            {it.sustitucion > 0 && <Badge className="bg-orange-100 text-orange-700 text-[10px]">S:{it.sustitucion}</Badge>}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observaciones */}
          <Card>
            <CardHeader><CardTitle className="text-base">Observaciones</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Observaciones clínicas, patrones de simplificación predominantes..."
                rows={4}
              />
              <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Evaluación
              </Button>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(`/dashboard/therapist/pie/teprosif/new?patient=${searchParams.get('patient') || ''}`)} className="flex-1">
              Nueva Evaluación
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
