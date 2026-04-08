import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, ArrowLeft, ArrowRight, Save, CheckCircle2,
  AlertCircle, FileText, ChevronDown, ChevronUp, Printer
} from 'lucide-react';
import { generateSensorialReport } from '@/features/tea/utils/reportGenerator';
import {
  SENSORIAL_SECTIONS, SCORE_OPTIONS, CLASSIFICATION,
  TOTAL_ITEMS, classifyScore
} from '../constants/sensorialItems';
import {
  fetchEvaluationById, createEvaluation, saveItemResponses,
  calculateScores, getCompletionPercentage, getMissingSections
} from '../api/sensorialApi';
import { format } from 'date-fns';

const SensorialEvaluationPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isNew = !id || id === 'new';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [evaluationId, setEvaluationId] = useState(id !== 'new' ? id : null);
  const [evaluation, setEvaluation] = useState(null);

  // Step 1 form
  const [patients, setPatients] = useState([]);
  const [config, setConfig] = useState({
    patient_id: searchParams.get('patient') || '',
    informant_name: '',
    informant_relationship: '',
    fecha_evaluacion: format(new Date(), 'yyyy-MM-dd'),
    examinador: '',
  });

  // Step 2 scoring
  const [responses, setResponses] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});

  // Step 3 results
  const [results, setResults] = useState(null);
  const [observaciones, setObservaciones] = useState('');

  // ─── Load Data ───
  useEffect(() => {
    loadPatients();
    if (!isNew) loadEvaluation();
  }, [id]);

  const loadPatients = async () => {
    const { data } = await supabase
      .from('patients')
      .select('id, profile:profiles!patients_profile_id_fkey(full_name)')
      .eq('therapist_id', user.id)
      .eq('status', 'active');
    setPatients(data || []);
  };

  const loadEvaluation = async () => {
    setLoading(true);
    try {
      const data = await fetchEvaluationById(id);
      setEvaluation(data);
      setEvaluationId(data.id);
      setConfig({
        patient_id: data.patient_id || '',
        informant_name: data.informant_name || '',
        informant_relationship: data.informant_relationship || '',
        fecha_evaluacion: data.fecha_evaluacion || '',
        examinador: data.examinador || '',
      });
      setObservaciones(data.observaciones || '');

      // Load responses into map
      const respMap = {};
      (data.responses || []).forEach(r => {
        respMap[r.item_code] = { score: r.score, notes: r.notes || '' };
      });
      setResponses(respMap);

      if (data.status === 'completada' || data.status === 'revisada') {
        setResults({
          sectionScores: data.scores_by_section || {},
          sectionClassifications: data.classifications_by_section || {},
          totalScore: data.total_score || 0,
          overallClassification: data.overall_classification || 'tipico',
          atypicalCount: data.atypical_sections || 0,
        });
        setStep(3);
      } else {
        setStep(2);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al cargar evaluación' });
      navigate('/dashboard/therapist/sensorial');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 1: Create ───
  const handleCreate = async () => {
    if (!config.patient_id) {
      toast({ variant: 'destructive', title: 'Selecciona un paciente' });
      return;
    }
    setSaving(true);
    try {
      const data = await createEvaluation({
        therapist_id: user.id,
        ...config,
        status: 'borrador',
      });
      setEvaluationId(data.id);
      setEvaluation(data);
      setStep(2);
      navigate(`/dashboard/therapist/sensorial/${data.id}`, { replace: true });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al crear', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ─── Step 2: Score ───
  const handleScore = (itemCode, section, itemName, score) => {
    setResponses(prev => ({
      ...prev,
      [itemCode]: { ...prev[itemCode], score, section, name: itemName },
    }));
  };

  const handleSaveDraft = useCallback(async () => {
    if (!evaluationId) return;
    setSaving(true);
    try {
      const respArray = Object.entries(responses).map(([code, data]) => ({
        code,
        name: data.name || '',
        section: data.section || '',
        score: data.score || 0,
        notes: data.notes || '',
      }));
      await saveItemResponses(evaluationId, respArray);
      toast({ title: 'Borrador guardado' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  }, [evaluationId, responses]);

  const handleFinalize = async () => {
    await handleSaveDraft();
    setSaving(true);
    try {
      const res = await calculateScores(evaluationId);
      setResults(res);
      setStep(3);
      toast({ title: 'Evaluación completada' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al calcular', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (key) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Completion ───
  const answeredCount = Object.values(responses).filter(r => r.score > 0).length;
  const completionPct = Math.round((answeredCount / TOTAL_ITEMS) * 100);

  // ─── Loading ───
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // STEP 1: Configuration
  // ═══════════════════════════════════════════
  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard/therapist/sensorial')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al listado
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Nueva Evaluación — Perfil Sensorial</CardTitle>
            <CardDescription>Cuestionario para cuidadores (Modelo de Dunn)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select value={config.patient_id} onValueChange={(v) => setConfig(prev => ({ ...prev, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.profile?.full_name || 'Sin nombre'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del informante</Label>
                <Input value={config.informant_name} onChange={(e) => setConfig(prev => ({ ...prev, informant_name: e.target.value }))} placeholder="Ej: María González" />
              </div>
              <div className="space-y-2">
                <Label>Relación con el niño/a</Label>
                <Select value={config.informant_relationship} onValueChange={(v) => setConfig(prev => ({ ...prev, informant_relationship: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="madre">Madre</SelectItem>
                    <SelectItem value="padre">Padre</SelectItem>
                    <SelectItem value="abuelo_a">Abuelo/a</SelectItem>
                    <SelectItem value="cuidador">Cuidador/a</SelectItem>
                    <SelectItem value="profesor">Profesor/a</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de evaluación</Label>
                <Input type="date" value={config.fecha_evaluacion} onChange={(e) => setConfig(prev => ({ ...prev, fecha_evaluacion: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Examinador</Label>
                <Input value={config.examinador} onChange={(e) => setConfig(prev => ({ ...prev, examinador: e.target.value }))} placeholder="Nombre del profesional" />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                Iniciar Evaluación
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // STEP 2: Scoring
  // ═══════════════════════════════════════════
  if (step === 2) {
    const patientName = evaluation?.patient?.profile?.full_name || patients.find(p => p.id === config.patient_id)?.profile?.full_name || '';

    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard/therapist/sensorial')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          <div className="text-right text-sm text-muted-foreground">
            <span className="font-medium">{patientName}</span> · Perfil Sensorial
          </div>
        </div>

        {/* Progress */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Progress value={completionPct} className="flex-1" />
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {answeredCount} / {TOTAL_ITEMS} ({completionPct}%)
            </span>
          </div>
        </Card>

        {/* Sections */}
        {Object.entries(SENSORIAL_SECTIONS).map(([sectionKey, section]) => {
          const isCollapsed = collapsedSections[sectionKey];
          const sectionAnswered = section.items.filter(item => responses[item.code]?.score > 0).length;
          const sectionTotal = section.items.length;
          const sectionComplete = sectionAnswered === sectionTotal;

          return (
            <Card key={sectionKey}>
              <button
                type="button"
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-t-lg"
                onClick={() => toggleSection(sectionKey)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{section.icon}</span>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{section.label}</h3>
                    <p className="text-xs text-muted-foreground">{sectionAnswered}/{sectionTotal} ítems</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sectionComplete && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  <Badge variant={sectionComplete ? 'default' : 'outline'} className="text-xs">
                    {sectionComplete ? 'Completo' : `${sectionAnswered}/${sectionTotal}`}
                  </Badge>
                  {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
              </button>

              {!isCollapsed && (
                <CardContent className="pt-0 space-y-3">
                  {section.items.map((item, idx) => {
                    const currentScore = responses[item.code]?.score || 0;
                    return (
                      <div key={item.code} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-slate-50/50 border border-slate-100">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-mono text-muted-foreground mr-2">{item.code}</span>
                          <span className="text-sm text-gray-700">{item.name}</span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {SCORE_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleScore(item.code, sectionKey, item.name, opt.value)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
                                currentScore === opt.value
                                  ? opt.color + ' ring-2 ring-offset-1 ring-primary/30'
                                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                              }`}
                              title={opt.label}
                            >
                              {opt.value}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Action Bar */}
        <div className="flex justify-between items-center py-4 border-t sticky bottom-0 bg-white/95 backdrop-blur-sm">
          <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> Guardar borrador
          </Button>
          <Button onClick={handleFinalize} disabled={saving || completionPct < 80}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Calcular y Finalizar
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // STEP 3: Results
  // ═══════════════════════════════════════════
  if (step === 3 && results) {
    const OVERALL_MAP = {
      tipico: { label: 'Procesamiento Sensorial Típico', color: 'bg-green-100 text-green-800 border-green-300' },
      leve: { label: 'Diferencias Sensoriales Leves', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      moderado: { label: 'Diferencias Sensoriales Moderadas', color: 'bg-orange-100 text-orange-800 border-orange-300' },
      significativo: { label: 'Diferencias Sensoriales Significativas', color: 'bg-red-100 text-red-800 border-red-300' },
    };

    const overallCfg = OVERALL_MAP[results.overallClassification] || OVERALL_MAP.tipico;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard/therapist/sensorial')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al listado
        </Button>

        {/* Overall Result */}
        <Card className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Resultado del Perfil Sensorial</h2>
          <div className={`inline-block px-6 py-3 rounded-full text-lg font-semibold border ${overallCfg.color}`}>
            {overallCfg.label}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {results.atypicalCount} de 7 secciones con diferencias · Puntaje total: {results.totalScore}
          </p>
        </Card>

        {/* Section Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle por sección</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(SENSORIAL_SECTIONS).map(([key, section]) => {
                const score = results.sectionScores[key] || 0;
                const classification = results.sectionClassifications[key] || 'typical';
                const classCfg = CLASSIFICATION[classification] || CLASSIFICATION.typical;

                return (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{section.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{section.label}</p>
                        <p className="text-xs text-muted-foreground">Puntaje: {score}</p>
                      </div>
                    </div>
                    <Badge className={classCfg.color}>{classCfg.label}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Observaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Observaciones clínicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Agrega observaciones clínicas relevantes..."
              className="min-h-[120px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const patientName = evaluation?.patient?.profile?.full_name || '';
                  generateSensorialReport({
                    evaluation: { ...evaluation, ...results, observaciones },
                    patientName,
                    therapistName: user?.user_metadata?.full_name || config.examinador || '',
                    sections: SENSORIAL_SECTIONS,
                  });
                }}
              >
                <Printer className="mr-2 h-4 w-4" /> Generar Informe
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await import('../api/sensorialApi').then(api => api.updateEvaluationStatus(evaluationId, 'revisada', observaciones));
                  toast({ title: 'Marcada como revisada' });
                  navigate('/dashboard/therapist/sensorial');
                }}
              >
                <FileText className="mr-2 h-4 w-4" /> Marcar como Revisada
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default SensorialEvaluationPage;
