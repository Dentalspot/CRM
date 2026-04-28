import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, ArrowLeft, Loader2, Settings2, Thermometer, Hash, Cpu, Database, Mic, FileText, Brain, ClipboardList, HardDrive, Target, Upload, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

// ============================================================
// Tab: Configuracion de Modelos
// ============================================================
const ModelConfigTab = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const fetchModelSettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('category', 'models')
      .order('key');
    setSettings(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchModelSettings(); }, []);

  const handleSave = async (key, value) => {
    setSaving(key);
    const { error } = await supabase
      .from('ai_settings')
      .upsert({ key, value, category: 'models', updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Guardado', description: `${key} actualizado` });
    }
    setSaving(null);
  };

  const grouped = {};
  settings.forEach(s => {
    const prefix = s.key.split('.').slice(0, 2).join('.');
    if (!grouped[prefix]) grouped[prefix] = { settings: [], area: prefix };
    grouped[prefix].settings.push(s);
  });

  const areaLabels = {
    'model.notiz': { label: 'Notiz - Notas Clinicas', color: 'bg-purple-100 text-purple-700' },
    'model.chatbot': { label: 'Chatbot Asistente', color: 'bg-blue-100 text-blue-700' },
    'model.templates': { label: 'Generador de Plantillas', color: 'bg-teal-100 text-teal-700' },
    'temp.notiz': { label: 'Temperatura - Notiz', color: 'bg-amber-100 text-amber-700' },
    'temp.chatbot': { label: 'Temperatura - Chatbot', color: 'bg-amber-100 text-amber-700' },
    'temp.templates': { label: 'Temperatura - Templates', color: 'bg-amber-100 text-amber-700' },
    'tokens.notiz': { label: 'Tokens - Notiz', color: 'bg-primary text-primary' },
    'tokens.chatbot': { label: 'Tokens - Chatbot', color: 'bg-primary text-primary' },
    'tokens.templates': { label: 'Tokens - Templates', color: 'bg-primary text-primary' },
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <div className="grid gap-6">
      {Object.entries(grouped).map(([prefix, group]) => {
        const meta = areaLabels[prefix] || { label: prefix, color: 'bg-gray-100 text-gray-700' };
        return (
          <Card key={prefix}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {prefix.startsWith('model.') && <Cpu className="h-4 w-4" />}
                {prefix.startsWith('temp.') && <Thermometer className="h-4 w-4" />}
                {prefix.startsWith('tokens.') && <Hash className="h-4 w-4" />}
                <Badge className={meta.color}>{meta.label}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.settings.map(s => (
                <div key={s.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-500 truncate">{s.key}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>
                  </div>
                  <Input
                    defaultValue={s.value}
                    className="w-72 text-sm font-mono"
                    onBlur={(e) => { if (e.target.value !== s.value) handleSave(s.key, e.target.value); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSave(s.key, e.target.value); }}
                  />
                  {saving === s.key && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// ============================================================
// Tab: Entrenamiento (Training Roadmap)
// ============================================================
const TrainingTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [notiz, templates, ados, adir, clinical] = await Promise.all([
        supabase.from('notiz_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('treatment_plans').select('*', { count: 'exact', head: true }),
        supabase.from('ados2_evaluations').select('*', { count: 'exact', head: true }),
        supabase.from('adir_evaluations').select('*', { count: 'exact', head: true }),
        supabase.from('clinical_history').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        notizSessions: notiz.count || 0,
        treatmentPlans: templates.count || 0,
        ados2Evals: ados.count || 0,
        adirEvals: adir.count || 0,
        clinicalRecords: clinical.count || 0,
        total: (notiz.count || 0) + (templates.count || 0) + (ados.count || 0) + (adir.count || 0) + (clinical.count || 0),
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const ROADMAP = [
    { name: 'Modelo de Transcripcion Odontologica', desc: 'Fine-tune de Whisper con terminologia de odontologia chilena', requirement: '500+ sesiones Notiz', current: stats?.notizSessions || 0, needed: 500 },
    { name: 'Generador de Informes Clinicos', desc: 'Modelo especializado en redaccion de informes odontologicos', requirement: '200+ registros clinicos', current: stats?.clinicalRecords || 0, needed: 200 },
    { name: 'Asistente de Evaluacion TEA', desc: 'Modelo entrenado con resultados ADOS-2 y ADI-R para sugerencias', requirement: '100+ evaluaciones TEA', current: (stats?.ados2Evals || 0) + (stats?.adirEvals || 0), needed: 100 },
    { name: 'Recomendador Inteligente de Planes', desc: 'Sugiere planes terapeuticos basado en historial de exito', requirement: '300+ planes de tratamiento', current: stats?.treatmentPlans || 0, needed: 300 },
  ];

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Sesiones Notiz', value: stats?.notizSessions, icon: '🎙️' },
          { label: 'Planes Terapeuticos', value: stats?.treatmentPlans, icon: '📋' },
          { label: 'Evaluaciones ADOS-2', value: stats?.ados2Evals, icon: '🧩' },
          { label: 'Evaluaciones ADI-R', value: stats?.adirEvals, icon: '📊' },
          { label: 'Registros Clinicos', value: stats?.clinicalRecords, icon: '📁' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 text-center">
              <span className="text-2xl">{k.icon}</span>
              <p className="text-2xl font-bold mt-1">{k.value}</p>
              <p className="text-xs text-gray-500">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-teal-500" />
            <div>
              <p className="font-semibold">Total datos de entrenamiento disponibles</p>
              <p className="text-sm text-gray-500">Datos que se usaran para fine-tuning cuando alcancen masa critica</p>
            </div>
          </div>
          <span className="text-3xl font-bold text-teal-600">{stats?.total}</span>
        </CardContent>
      </Card>

      {/* Roadmap */}
      <h3 className="text-lg font-semibold flex items-center gap-2"><Target className="h-5 w-5" /> Roadmap de Modelos</h3>
      <div className="grid gap-4">
        {ROADMAP.map(model => {
          const progress = Math.min(100, Math.round((model.current / model.needed) * 100));
          return (
            <Card key={model.name}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{model.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{model.desc}</p>
                  </div>
                  <Badge className={progress >= 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                    {progress >= 100 ? 'Listo' : 'Recolectando'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{model.current}/{model.needed}</span>
                  <span className="text-xs text-gray-400">({progress}%)</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Requisito: {model.requirement}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};

// ============================================================
// Tab: Datasets (fuentes de datos + upload)
// ============================================================

const DATASET_CATEGORIES = [
  { value: 'notiz', label: 'Notiz - Transcripciones', table: 'notiz_sessions' },
  { value: 'clinical', label: 'Registros Clinicos', table: 'clinical_history' },
  { value: 'templates', label: 'Planes Terapeuticos', table: 'treatment_plans' },
  { value: 'ados2', label: 'Evaluaciones ADOS-2', table: 'ados2_evaluations' },
  { value: 'adir', label: 'Evaluaciones ADI-R', table: 'adir_evaluations' },
  { value: 'chatbot', label: 'Chatbot - Preguntas', table: 'faq_chatbot' },
  { value: 'feedback', label: 'Feedback IA', table: 'ai_feedback' },
];

const DatasetsTab = () => {
  const { toast } = useToast();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ category: 'notiz', name: '', description: '', file: null });
  const [datasets, setDatasets] = useState([]);
  const fileInputRef = useRef(null);

  // Fetch data source counts
  useEffect(() => {
    const fetchSources = async () => {
      const queries = [
        { name: 'Sesiones Notiz', table: 'notiz_sessions', icon: Mic, color: 'purple', desc: 'Transcripciones de audio y resumenes de sesiones', useCase: 'Fine-tune de modelo de transcripcion' },
        { name: 'Registros Clinicos', table: 'clinical_history', icon: ClipboardList, color: 'teal', desc: 'Notas de evolucion, diagnosticos y observaciones', useCase: 'Generador automatico de informes' },
        { name: 'Planes Terapeuticos', table: 'treatment_plans', icon: FileText, color: 'blue', desc: 'Planes con objetivos, actividades y duracion', useCase: 'Recomendador inteligente de planes' },
        { name: 'Evaluaciones ADOS-2', table: 'ados2_evaluations', icon: Brain, color: 'amber', desc: 'Resultados ADOS-2 con puntajes por dominio', useCase: 'Asistente de evaluacion TEA' },
        { name: 'Evaluaciones ADI-R', table: 'adir_evaluations', icon: Brain, color: 'orange', desc: 'Resultados ADI-R con scoring por periodo', useCase: 'Asistente de evaluacion TEA' },
        { name: 'FAQ Chatbot', table: 'faq_chatbot', icon: Database, color: 'pink', desc: 'Preguntas frecuentes para el chatbot', useCase: 'Entrenamiento chatbot' },
      ];

      const results = await Promise.all(
        queries.map(async (q) => {
          const { count, error } = await supabase.from(q.table).select('*', { count: 'exact', head: true });
          return { ...q, records: error ? 0 : (count || 0), error: !!error };
        })
      );

      setSources(results);
      setLoading(false);
    };
    fetchSources();
  }, []);

  // Fetch uploaded datasets
  useEffect(() => {
    const fetchDatasets = async () => {
      const { data } = await supabase
        .from('ai_task_queue')
        .select('*')
        .eq('task_type', 'dataset_upload')
        .order('created_at', { ascending: false })
        .limit(20);
      setDatasets(data || []);
    };
    fetchDatasets();
  }, []);

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selecciona un archivo y nombre' });
      return;
    }

    setUploading(true);
    try {
      // 1. Upload file to storage
      const fileName = `datasets/${uploadForm.category}/${Date.now()}_${uploadForm.file.name}`;
      const { error: storageErr } = await supabase.storage
        .from('audio-sessions')
        .upload(fileName, uploadForm.file, { upsert: false });

      if (storageErr) throw storageErr;

      // 2. Register in ai_task_queue
      const { error: dbErr } = await supabase.from('ai_task_queue').insert({
        task_type: 'dataset_upload',
        status: 'pending',
        payload: {
          name: uploadForm.name,
          description: uploadForm.description,
          category: uploadForm.category,
          file_path: fileName,
          file_name: uploadForm.file.name,
          file_size: uploadForm.file.size,
          records_count: null,
        },
      });

      if (dbErr) throw dbErr;

      toast({ title: 'Dataset cargado', description: `${uploadForm.name} registrado correctamente` });
      setUploadModal(false);
      setUploadForm({ category: 'notiz', name: '', description: '', file: null });

      // Refresh datasets
      const { data } = await supabase
        .from('ai_task_queue')
        .select('*')
        .eq('task_type', 'dataset_upload')
        .order('created_at', { ascending: false })
        .limit(20);
      setDatasets(data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al cargar', description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const ICON_COLORS = {
    purple: 'bg-purple-100 text-purple-600',
    teal: 'bg-teal-100 text-teal-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    orange: 'bg-orange-100 text-orange-600',
    pink: 'bg-primary text-primary',
  };

  const totalRecords = sources.reduce((sum, s) => sum + s.records, 0);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <>
      {/* Header con boton upload */}
      <div className="flex items-center justify-between">
        <Card className="flex-1">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDrive className="h-6 w-6 text-teal-500" />
              <div>
                <p className="font-semibold">Total de registros disponibles</p>
                <p className="text-sm text-gray-500">{sources.length} fuentes de datos conectadas</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-teal-600">{totalRecords.toLocaleString()}</span>
              <Button onClick={() => setUploadModal(true)} className="bg-teal-600 hover:bg-teal-700">
                <Upload className="h-4 w-4 mr-2" /> Cargar Dataset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fuentes de datos */}
      <h3 className="text-lg font-semibold flex items-center gap-2"><Database className="h-5 w-5" /> Fuentes de Datos</h3>
      <div className="grid gap-4">
        {sources.map(s => (
          <Card key={s.table}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg shrink-0 ${ICON_COLORS[s.color]}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{s.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{s.records}</span>
                      <Badge variant="outline" className={s.records > 0 ? 'border-green-200 text-green-600' : 'border-gray-200 text-gray-400'}>
                        {s.records > 0 ? 'Con datos' : 'Vacio'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">Tabla: {s.table}</Badge>
                    <span className="text-xs text-gray-400">Uso: {s.useCase}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Datasets cargados manualmente */}
      {datasets.length > 0 && (
        <>
          <h3 className="text-lg font-semibold flex items-center gap-2 mt-4"><Upload className="h-5 w-5" /> Datasets Cargados</h3>
          <div className="grid gap-3">
            {datasets.map(d => {
              const payload = d.payload || {};
              return (
                <Card key={d.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {d.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-green-500" /> :
                       d.status === 'failed' ? <AlertTriangle className="h-5 w-5 text-red-500" /> :
                       <Clock className="h-5 w-5 text-amber-500" />}
                      <div>
                        <p className="font-medium text-sm">{payload.name || 'Dataset'}</p>
                        <p className="text-xs text-gray-500">{payload.description || payload.file_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">{payload.category}</Badge>
                      {payload.file_size && <span className="text-xs text-gray-400">{(payload.file_size / 1024).toFixed(0)} KB</span>}
                      <Badge className={
                        d.status === 'completed' ? 'bg-green-100 text-green-700' :
                        d.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }>
                        {d.status === 'completed' ? 'Procesado' : d.status === 'failed' ? 'Error' : 'Pendiente'}
                      </Badge>
                      <span className="text-xs text-gray-400">{new Date(d.created_at).toLocaleDateString('es-CL')}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Upload Modal */}
      <Dialog open={uploadModal} onOpenChange={setUploadModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Cargar Dataset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Seccion IA destino</label>
              <Select value={uploadForm.category} onValueChange={v => setUploadForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DATASET_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Nombre del dataset</label>
              <Input
                value={uploadForm.name}
                onChange={e => setUploadForm(f => ({ ...f, name: e.target.value }))}
                placeholder="ej: Sesiones TEA Enero 2026"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Descripcion (opcional)</label>
              <Textarea
                value={uploadForm.description}
                onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descripcion del contenido del dataset..."
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Archivo (CSV, JSON, JSONL)</label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-teal-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadForm.file ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">{uploadForm.file.name}</span>
                    <span className="text-xs text-gray-400">({(uploadForm.file.size / 1024).toFixed(0)} KB)</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Haz clic para seleccionar archivo</p>
                    <p className="text-xs text-gray-400 mt-1">CSV, JSON o JSONL (max 50MB)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.jsonl,.xlsx"
                  className="hidden"
                  onChange={e => setUploadForm(f => ({ ...f, file: e.target.files?.[0] || null }))}
                />
              </div>
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploading || !uploadForm.file || !uploadForm.name}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? 'Cargando...' : 'Cargar Dataset'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ============================================================
// Main Page with Tabs
// ============================================================
const TABS = [
  { id: 'config', label: 'Configuracion', icon: Settings2 },
  { id: 'training', label: 'Entrenamiento', icon: Target },
  { id: 'datasets', label: 'Datasets', icon: Database },
];

const AiModelListPage = () => {
  const [activeTab, setActiveTab] = useState('config');

  return (
    <PermissionGuard module="ai_tools" action="read">
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild><Link to="/admin/ai-tools"><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Link></Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 rounded-lg"><Cpu className="h-5 w-5 text-cyan-600" /></div>
          <div>
            <h1 className="text-2xl font-bold">Modelos IA</h1>
            <p className="text-sm text-muted-foreground">Configuracion, entrenamiento y datasets para modelos de IA</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'config' && <ModelConfigTab />}
        {activeTab === 'training' && <TrainingTab />}
        {activeTab === 'datasets' && <DatasetsTab />}
      </div>
    </PermissionGuard>
  );
};

export default AiModelListPage;
