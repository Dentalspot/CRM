
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2, Plus, Trash2, Save, Sparkles, ChevronDown, ClipboardList,
  Users, BookOpen, Shield, CalendarCheck, GraduationCap, Brain, Mic2, Hand, Activity,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import logger from '@/lib/utils/logger';

// ─── Constants ─────────────────────────────

const uid = () => Date.now().toString() + Math.random().toString(36).slice(2, 6);

const AREAS_DISPONIBLES = [
  { key: 'pedagogica', label: 'Área Pedagógica', icon: GraduationCap, color: 'blue', responsable: 'Profesor/a' },
  { key: 'socioemocional', label: 'Área Socioemocional', icon: Users, color: 'pink', responsable: 'Psicólogo/a' },
  { key: 'fonoaudiologica', label: 'Área Fonoaudiológica', icon: Mic2, color: 'violet', responsable: 'Fonoaudiólogo/a' },
  { key: 'ocupacional', label: 'Área Ocupacional / Sensorial', icon: Hand, color: 'amber', responsable: 'Terapeuta Ocupacional' },
  { key: 'kinesiologica', label: 'Área Kinesiológica / Motora', icon: Activity, color: 'emerald', responsable: 'Kinesiólogo/a' },
  { key: 'otros', label: 'Otros Apoyos', icon: Shield, color: 'gray', responsable: '' },
];

const emptyObjetivoEspecifico = () => ({
  id: uid(), texto: '', estrategias: '', frecuencia: 'Semanal', indicador: '', estado: 'No iniciado', observaciones: '',
});

const emptyArea = (areaKey) => {
  const def = AREAS_DISPONIBLES.find(a => a.key === areaKey) || {};
  return {
    id: uid(), key: areaKey, label: def.label || areaKey,
    necesidad: '', objetivo_general: '', responsable: def.responsable || '',
    objetivos_especificos: [emptyObjetivoEspecifico()],
  };
};

const emptySeguimiento = () => ({ id: uid(), fecha: '', hito: '', hallazgo: '', ajuste: '', responsable: '' });
const emptyEquipo = () => ({ id: uid(), nombre: '', rol: '', fecha: '' });

const TIPOS_ADECUACION = [
  { key: 'acceso_presentacion', label: 'Presentación y representación de la información', group: 'acceso' },
  { key: 'acceso_ejecucion', label: 'Medios de ejecución y expresión', group: 'acceso' },
  { key: 'acceso_entorno', label: 'Entorno', group: 'acceso' },
  { key: 'acceso_tiempo', label: 'Organización del tiempo', group: 'acceso' },
  { key: 'oa_graduacion', label: 'Graduación del nivel de complejidad', group: 'objetivos' },
  { key: 'oa_priorizacion', label: 'Priorización de OA y contenidos', group: 'objetivos' },
  { key: 'oa_temporizacion', label: 'Temporalización', group: 'objetivos' },
  { key: 'oa_enriquecimiento', label: 'Enriquecimiento curricular', group: 'objetivos' },
  { key: 'oa_eliminacion', label: 'Eliminación de aprendizajes (última instancia)', group: 'objetivos' },
];

const RECURSOS_MATERIALES = [
  'PC / tablet', 'Material concreto', 'Pictogramas', 'Apoyos visuales',
  'Organizadores gráficos', 'Audiovisuales', 'Material multisensorial',
  'Calendarios visuales', 'Juguetes / material lúdico',
];

const STATUS_COLORS = {
  'No iniciado': 'bg-gray-100 text-gray-600',
  'En proceso': 'bg-amber-100 text-amber-800',
  'Logrado': 'bg-green-100 text-green-800',
  'Suspendido': 'bg-red-100 text-red-700',
};

const PiePaciTab = ({ patientId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentSemester = new Date().getMonth() < 6 ? '1' : '2';
  const defaultPeriod = `${currentYear}-${currentSemester}`;

  const [period, setPeriod] = useState(defaultPeriod);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [evalSummary, setEvalSummary] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [pieData, setPieData] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [activeSection, setActiveSection] = useState('paci');

  // Plan state
  const [meta, setMeta] = useState({ estado: 'Borrador' });
  const [perfil, setPerfil] = useState({ fortalezas: '', barreras: '', antecedentes: '', intereses: '' });
  const [areas, setAreas] = useState([]); // main PACI areas
  const [tiposAdecuacion, setTiposAdecuacion] = useState({});
  const [justificacion, setJustificacion] = useState('');
  const [recursosMateriales, setRecursosMateriales] = useState({});
  const [seguimiento, setSeguimiento] = useState([]);
  const [equipo, setEquipo] = useState([emptyEquipo()]);

  useEffect(() => { if (user?.id && patientId) fetchAll(); }, [patientId, user?.id, period]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchPlan(), fetchEvaluations(), fetchPatientInfo()]);
    setLoading(false);
  };

  const fetchPlan = async () => {
    const { data } = await supabase.from('pie_paci').select('*')
      .eq('student_id', patientId).eq('therapist_id', user.id).eq('period', period).maybeSingle();
    if (data) {
      setRecordId(data.id);
      const d = data.extra_data || {};
      setMeta(d.meta || { estado: 'Borrador' });
      setPerfil(d.perfil || { fortalezas: '', barreras: '', antecedentes: '', intereses: '' });
      setAreas(d.areas || []);
      setTiposAdecuacion(d.tipos_adecuacion || {});
      setJustificacion(d.justificacion || '');
      setRecursosMateriales(d.recursos_materiales || {});
      setSeguimiento(d.seguimiento || []);
      setEquipo(d.equipo?.length ? d.equipo : [emptyEquipo()]);
    } else {
      setRecordId(null); setAreas([]); setSeguimiento([]); setEquipo([emptyEquipo()]);
    }
  };

  const fetchPatientInfo = async () => {
    const { data } = await supabase.from('patients')
      .select('id, profile:profiles!patients_profile_id_fkey(full_name, birthdate)')
      .eq('id', patientId).maybeSingle();
    setPatientInfo(data);
    const { data: pie } = await supabase.from('pie_student_data')
      .select('course, nee_type, diagnosis').eq('patient_id', patientId).eq('therapist_id', user.id).maybeSingle();
    setPieData(pie);
  };

  const fetchEvaluations = async () => {
    const r = [];
    const { data: t } = await supabase.from('tecal_evaluations').select('puntaje_total, resultado_total')
      .eq('therapist_id', user.id).eq('patient_id', patientId).eq('status', 'completada')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (t) r.push(`TECAL: ${t.puntaje_total}/101 (${t.resultado_total})`);
    const { data: s } = await supabase.from('stsg_evaluations').select('puntaje_receptivo, puntaje_expresivo, resultado_receptivo, resultado_expresivo')
      .eq('therapist_id', user.id).eq('patient_id', patientId).eq('status', 'completada')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (s) r.push(`STSG: R ${s.puntaje_receptivo}/46 (${s.resultado_receptivo}), E ${s.puntaje_expresivo}/46 (${s.resultado_expresivo})`);
    const { data: tp } = await supabase.from('teprosif_evaluations').select('total_procesos, resultado')
      .eq('therapist_id', user.id).eq('patient_id', patientId).eq('status', 'completada')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (tp) r.push(`TEPROSIF: ${tp.total_procesos} PSF (${tp.resultado})`);
    setEvalSummary(r.length ? r.join(' · ') : null);
  };

  // ─── Area management ──────────────────

  const addArea = (areaKey) => setAreas(p => [...p, emptyArea(areaKey)]);
  const removeArea = (id) => setAreas(p => p.filter(a => a.id !== id));
  const updateArea = (id, field, value) => setAreas(p => p.map(a => a.id === id ? { ...a, [field]: value } : a));

  const addObjetivo = (areaId) => setAreas(p => p.map(a =>
    a.id === areaId ? { ...a, objetivos_especificos: [...a.objetivos_especificos, emptyObjetivoEspecifico()] } : a
  ));
  const removeObjetivo = (areaId, objId) => setAreas(p => p.map(a =>
    a.id === areaId ? { ...a, objetivos_especificos: a.objetivos_especificos.filter(o => o.id !== objId) } : a
  ));
  const updateObjetivo = (areaId, objId, field, value) => setAreas(p => p.map(a =>
    a.id === areaId ? { ...a, objetivos_especificos: a.objetivos_especificos.map(o => o.id === objId ? { ...o, [field]: value } : o) } : a
  ));

  // ─── AI ───────────────────────────────

  const handleGenerateWithAI = async () => {
    if (!evalSummary && !pieData?.diagnosis) {
      toast({ variant: 'destructive', title: 'Sin datos', description: 'Realiza evaluaciones antes de generar con IA.' });
      return;
    }
    setGenerating(true);
    try {
      const age = patientInfo?.profile?.birthdate
        ? `${Math.floor((Date.now() - new Date(patientInfo.profile.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} años` : '';
      const { data, error } = await supabase.functions.invoke('generate-paci', {
        body: {
          patient_name: patientInfo?.profile?.full_name || '', patient_age: age,
          course: pieData?.course || '', nee_type: pieData?.nee_type || 'transitoria',
          diagnosis: pieData?.diagnosis || '', evaluation_results: evalSummary || '',
          period: `Semestre ${period.split('-')[1]} - ${period.split('-')[0]}`,
        },
      });
      if (error) throw error;
      const paci = data?.paci;
      if (!paci || paci.raw_response) { toast({ title: 'Respuesta parcial' }); return; }

      // Map AI areas to our area structure
      const newAreas = (paci.areas_intervencion || []).map(ai => {
        const areaKey = ai.area?.toLowerCase().includes('fono') ? 'fonoaudiologica'
          : ai.area?.toLowerCase().includes('socio') ? 'socioemocional'
          : ai.area?.toLowerCase().includes('pedag') ? 'pedagogica'
          : ai.area?.toLowerCase().includes('ocup') || ai.area?.toLowerCase().includes('senso') ? 'ocupacional'
          : 'fonoaudiologica';
        const def = AREAS_DISPONIBLES.find(a => a.key === areaKey) || {};
        return {
          id: uid(), key: areaKey, label: def.label || ai.area,
          necesidad: ai.area || '',
          objetivo_general: ai.objetivo_general || '',
          responsable: def.responsable || '',
          objetivos_especificos: (ai.objetivos_especificos || []).map(obj => ({
            ...emptyObjetivoEspecifico(),
            texto: obj.texto || obj.text || '',
            estrategias: obj.estrategia || '',
            indicador: obj.indicador_logro || '',
            frecuencia: 'Semanal',
          })),
        };
      });
      if (newAreas.length) setAreas(newAreas);
      toast({ title: 'PACI generado con IA', description: `${newAreas.length} áreas creadas. Revisa y edita.` });
    } catch (err) {
      logger.error('Error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally { setGenerating(false); }
  };

  // ─── Save ─────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    const extra_data = {
      meta, perfil, areas, tipos_adecuacion: tiposAdecuacion, justificacion,
      recursos_materiales: recursosMateriales, seguimiento, equipo,
    };
    const payload = { student_id: patientId, therapist_id: user.id, period, objectives: [], extra_data };
    let error;
    if (recordId) {
      const { error: e } = await supabase.from('pie_paci').update({ extra_data }).eq('id', recordId);
      error = e;
    } else {
      const { data, error: e } = await supabase.from('pie_paci').insert(payload).select().maybeSingle();
      error = e; if (data) setRecordId(data.id);
    }

    // Save training example for RAG / future fine-tuning (non-blocking)
    if (!error && areas.length > 0) {
      supabase.from('paci_training_examples').insert({
        therapist_id: user.id,
        patient_id: patientId,
        diagnosis: pieData?.diagnosis || '',
        nee_type: pieData?.nee_type || '',
        patient_age: patientInfo?.profile?.birthdate
          ? `${Math.floor((Date.now() - new Date(patientInfo.profile.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} años` : '',
        course: pieData?.course || '',
        evaluation_results: evalSummary || '',
        areas,
        perfil,
        source: 'ai_edited',
        period,
      }).then(() => {}).catch(() => {}); // silent, non-blocking
    }

    setSaving(false);
    toast(error ? { variant: 'destructive', title: 'Error' } : { title: 'PACI guardado' });
  };

  const generatePeriods = () => {
    const p = [];
    for (let y = currentYear - 1; y <= currentYear + 1; y++) { p.push(`${y}-1`); p.push(`${y}-2`); }
    return p;
  };

  const toggle = (k) => setCollapsed(p => ({ ...p, [k]: !p[k] }));
  const existingAreaKeys = areas.map(a => a.key);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  const NAV = [
    { id: 'paci', label: 'PACI — Áreas', icon: BookOpen },
    { id: 'perfil', label: 'Perfil', icon: Users },
    { id: 'adecuaciones', label: 'Adecuaciones', icon: ClipboardList },
    { id: 'recursos', label: 'Recursos', icon: Shield },
    { id: 'seguimiento', label: 'Seguimiento', icon: CalendarCheck },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-violet-600" /> PACI
          </h2>
          <p className="text-xs text-gray-500">Plan de Adecuación Curricular Individual · Decreto 83/2015</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{generatePeriods().map(p => <SelectItem key={p} value={p}>Sem {p.split('-')[1]} - {p.split('-')[0]}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={meta.estado} onValueChange={v => setMeta(m => ({ ...m, estado: v }))}>
            <SelectTrigger className={`w-[100px] h-8 text-xs ${meta.estado === 'Vigente' ? 'bg-green-100 text-green-800' : meta.estado === 'Cerrado' ? 'bg-gray-200' : 'bg-amber-100 text-amber-800'}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Borrador">Borrador</SelectItem>
              <SelectItem value="Vigente">Vigente</SelectItem>
              <SelectItem value="Cerrado">Cerrado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Eval + AI */}
      {evalSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <p className="text-[11px] text-blue-700 font-mono">{evalSummary}</p>
        </div>
      )}
      <Button onClick={handleGenerateWithAI} disabled={generating} className="bg-violet-600 hover:bg-violet-700 text-white" size="sm">
        {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
        {generating ? 'Generando...' : 'Generar PACI con IA'}
      </Button>

      {/* Nav */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {NAV.map(n => {
          const Icon = n.icon;
          return (
            <button key={n.id} onClick={() => setActiveSection(n.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 ${
                activeSection === n.id ? 'bg-violet-100 text-violet-800 border border-violet-300' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}>
              <Icon className="h-3 w-3" />{n.label}
              {n.id === 'paci' && areas.length > 0 && <Badge className="ml-1 bg-violet-200 text-violet-800 text-[10px] h-4 px-1">{areas.length}</Badge>}
            </button>
          );
        })}
      </div>

      {/* ══════════ PACI — ÁREAS ══════════ */}
      {activeSection === 'paci' && (
        <div className="space-y-4">
          {/* Botones para agregar áreas */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-slate-600 mb-2 font-medium">Agregar área al PACI:</p>
              <div className="flex flex-wrap gap-2">
                {AREAS_DISPONIBLES.map(a => {
                  const Icon = a.icon;
                  const exists = existingAreaKeys.includes(a.key);
                  return (
                    <Button key={a.key} variant="outline" size="sm"
                      onClick={() => addArea(a.key)}
                      className={`text-xs ${exists ? 'opacity-50' : ''}`}
                    >
                      <Icon className="h-3.5 w-3.5 mr-1" />
                      {a.label}
                      {exists && <Badge className="ml-1 bg-green-100 text-green-700 text-[9px] h-4 px-1">activa</Badge>}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Áreas agregadas */}
          {areas.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400">
              <BookOpen className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No hay áreas agregadas al PACI.</p>
              <p className="text-xs mt-1">Usa los botones de arriba para agregar áreas según las necesidades del estudiante.</p>
            </div>
          ) : (
            areas.map((area) => {
              const def = AREAS_DISPONIBLES.find(a => a.key === area.key) || {};
              const Icon = def.icon || Shield;
              const isCollapsed = collapsed[area.id];
              const logrados = area.objetivos_especificos.filter(o => o.estado === 'Logrado').length;
              const total = area.objetivos_especificos.length;

              return (
                <Card key={area.id} className={`border-l-4 border-l-${def.color || 'gray'}-400`}>
                  <CardHeader className="py-3 cursor-pointer select-none" onClick={() => toggle(area.id)}>
                    <CardTitle className="text-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                        <Icon className={`h-4 w-4 text-${def.color || 'gray'}-600`} />
                        <span>{area.label}</span>
                        {total > 0 && <Badge variant="outline" className="text-[10px]">{logrados}/{total}</Badge>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600"
                        onClick={(e) => { e.stopPropagation(); removeArea(area.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardTitle>
                  </CardHeader>

                  {!isCollapsed && (
                    <CardContent className="pt-0 space-y-4">
                      {/* Necesidad + objetivo general + responsable */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <Label className="text-xs text-gray-500">Necesidad detectada</Label>
                          <Textarea value={area.necesidad} onChange={e => updateArea(area.id, 'necesidad', e.target.value)}
                            rows={2} className="text-xs" placeholder="Descripción de la necesidad..." />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Responsable</Label>
                          <Input value={area.responsable} onChange={e => updateArea(area.id, 'responsable', e.target.value)}
                            className="h-8 text-xs" placeholder="Profesional a cargo" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Objetivo general del área</Label>
                        <Textarea value={area.objetivo_general} onChange={e => updateArea(area.id, 'objetivo_general', e.target.value)}
                          rows={2} className="text-xs" placeholder="Objetivo general..." />
                      </div>

                      {/* Objetivos específicos */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-semibold text-gray-600">Objetivos específicos</Label>
                          <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => addObjetivo(area.id)}>
                            <Plus className="h-3 w-3 mr-0.5" /> Objetivo
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {area.objetivos_especificos.map((obj, oi) => (
                            <div key={obj.id} className="bg-gray-50 rounded-lg border p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400">OE {oi + 1}</span>
                                <div className="flex items-center gap-1">
                                  <Select value={obj.estado} onValueChange={v => updateObjetivo(area.id, obj.id, 'estado', v)}>
                                    <SelectTrigger className={`w-[110px] h-6 text-[10px] ${STATUS_COLORS[obj.estado] || ''}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="No iniciado">No iniciado</SelectItem>
                                      <SelectItem value="En proceso">En proceso</SelectItem>
                                      <SelectItem value="Logrado">Logrado</SelectItem>
                                      <SelectItem value="Suspendido">Suspendido</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 text-red-300"
                                    onClick={() => removeObjetivo(area.id, obj.id)}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                              </div>

                              <Textarea value={obj.texto} onChange={e => updateObjetivo(area.id, obj.id, 'texto', e.target.value)}
                                rows={2} className="text-xs" placeholder="Objetivo específico medible y observable..." />

                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-[10px] text-gray-400">Estrategias / actividades</Label>
                                  <Input value={obj.estrategias} onChange={e => updateObjetivo(area.id, obj.id, 'estrategias', e.target.value)} className="h-7 text-[11px]" /></div>
                                <div><Label className="text-[10px] text-gray-400">Indicador de logro</Label>
                                  <Input value={obj.indicador} onChange={e => updateObjetivo(area.id, obj.id, 'indicador', e.target.value)} className="h-7 text-[11px]" /></div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-[10px] text-gray-400">Frecuencia</Label>
                                  <Select value={obj.frecuencia} onValueChange={v => updateObjetivo(area.id, obj.id, 'frecuencia', v)}>
                                    <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {['Diaria', 'Semanal', 'Quincenal', 'Mensual'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div><Label className="text-[10px] text-gray-400">Observaciones y ajustes</Label>
                                  <Input value={obj.observaciones} onChange={e => updateObjetivo(area.id, obj.id, 'observaciones', e.target.value)} className="h-7 text-[11px]" placeholder="Ajustes realizados..." /></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ══════════ PERFIL ══════════ */}
      {activeSection === 'perfil' && (
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Perfil del Estudiante</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div><Label className="text-xs text-gray-500">Fortalezas y potencialidades</Label>
              <Textarea value={perfil.fortalezas} onChange={e => setPerfil(p => ({ ...p, fortalezas: e.target.value }))} rows={2} className="text-sm" /></div>
            <div><Label className="text-xs text-gray-500">Barreras para el aprendizaje</Label>
              <Textarea value={perfil.barreras} onChange={e => setPerfil(p => ({ ...p, barreras: e.target.value }))} rows={2} className="text-sm" /></div>
            <div><Label className="text-xs text-gray-500">Antecedentes relevantes</Label>
              <Textarea value={perfil.antecedentes} onChange={e => setPerfil(p => ({ ...p, antecedentes: e.target.value }))} rows={2} className="text-sm" /></div>
            <div><Label className="text-xs text-gray-500">Intereses y metas del estudiante</Label>
              <Textarea value={perfil.intereses} onChange={e => setPerfil(p => ({ ...p, intereses: e.target.value }))} rows={2} className="text-sm" /></div>
          </CardContent>
        </Card>
      )}

      {/* ══════════ ADECUACIONES ══════════ */}
      {activeSection === 'adecuaciones' && (
        <div className="space-y-4">
          <div><Label className="text-xs text-gray-500">Justificación técnico-pedagógica</Label>
            <Textarea value={justificacion} onChange={e => setJustificacion(e.target.value)} rows={2} className="text-sm" /></div>
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm">Tipos de adecuación curricular</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Adecuaciones de acceso</p>
                <div className="grid grid-cols-2 gap-1">{TIPOS_ADECUACION.filter(t => t.group === 'acceso').map(t => (
                  <label key={t.key} className="flex items-center gap-2 text-xs"><Checkbox checked={!!tiposAdecuacion[t.key]} onCheckedChange={v => setTiposAdecuacion(p => ({ ...p, [t.key]: v }))} />{t.label}</label>
                ))}</div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Adecuaciones en los OA</p>
                <div className="grid grid-cols-2 gap-1">{TIPOS_ADECUACION.filter(t => t.group === 'objetivos').map(t => (
                  <label key={t.key} className="flex items-center gap-2 text-xs"><Checkbox checked={!!tiposAdecuacion[t.key]} onCheckedChange={v => setTiposAdecuacion(p => ({ ...p, [t.key]: v }))} />{t.label}</label>
                ))}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════ RECURSOS ══════════ */}
      {activeSection === 'recursos' && (
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Recursos materiales y tecnológicos</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {RECURSOS_MATERIALES.map(r => (
                <label key={r} className="flex items-center gap-2 text-xs"><Checkbox checked={!!recursosMateriales[r]} onCheckedChange={v => setRecursosMateriales(p => ({ ...p, [r]: v }))} />{r}</label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════ SEGUIMIENTO ══════════ */}
      {activeSection === 'seguimiento' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Seguimiento</span>
                <Button variant="outline" size="sm" onClick={() => setSeguimiento(p => [...p, emptySeguimiento()])}><Plus className="h-3.5 w-3.5 mr-1" /> Hito</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {seguimiento.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">Sin registros.</p> : (
                <div className="space-y-2">
                  {seguimiento.map((s, i) => (
                    <div key={s.id} className="grid grid-cols-12 gap-1.5 items-center bg-gray-50 p-2 rounded border">
                      <Input type="date" value={s.fecha} onChange={e => setSeguimiento(p => p.map((x, j) => j === i ? { ...x, fecha: e.target.value } : x))} className="col-span-2 h-7 text-[11px]" />
                      <Input value={s.hito} onChange={e => setSeguimiento(p => p.map((x, j) => j === i ? { ...x, hito: e.target.value } : x))} className="col-span-3 h-7 text-[11px]" placeholder="Evidencia" />
                      <Input value={s.hallazgo} onChange={e => setSeguimiento(p => p.map((x, j) => j === i ? { ...x, hallazgo: e.target.value } : x))} className="col-span-3 h-7 text-[11px]" placeholder="Hallazgo" />
                      <Input value={s.ajuste} onChange={e => setSeguimiento(p => p.map((x, j) => j === i ? { ...x, ajuste: e.target.value } : x))} className="col-span-2 h-7 text-[11px]" placeholder="Ajuste" />
                      <Input value={s.responsable} onChange={e => setSeguimiento(p => p.map((x, j) => j === i ? { ...x, responsable: e.target.value } : x))} className="col-span-1 h-7 text-[11px]" placeholder="Resp." />
                      <Button variant="ghost" size="icon" className="col-span-1 h-6 w-6 text-red-300" onClick={() => setSeguimiento(p => p.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Equipo responsable</span>
                <Button variant="outline" size="sm" onClick={() => setEquipo(p => [...p, emptyEquipo()])}><Plus className="h-3.5 w-3.5 mr-1" /> Agregar</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {equipo.map((e, i) => (
                <div key={e.id} className="grid grid-cols-12 gap-2 items-center">
                  <Input value={e.nombre} onChange={ev => setEquipo(p => p.map((x, j) => j === i ? { ...x, nombre: ev.target.value } : x))} className="col-span-5 h-7 text-xs" placeholder="Nombre" />
                  <Input value={e.rol} onChange={ev => setEquipo(p => p.map((x, j) => j === i ? { ...x, rol: ev.target.value } : x))} className="col-span-4 h-7 text-xs" placeholder="Rol / profesión" />
                  <Input type="date" value={e.fecha} onChange={ev => setEquipo(p => p.map((x, j) => j === i ? { ...x, fecha: ev.target.value } : x))} className="col-span-2 h-7 text-xs" />
                  <Button variant="ghost" size="icon" className="col-span-1 h-6 w-6 text-red-300" onClick={() => setEquipo(p => p.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end pt-3 border-t">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" /> Guardar PACI
        </Button>
      </div>
    </div>
  );
};

export default PiePaciTab;
